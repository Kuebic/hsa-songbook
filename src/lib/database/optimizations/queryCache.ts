import type { QueryBuilder } from '../queryBuilder'

// Cache entry with metadata
interface CacheEntry<T> {
  data: T
  timestamp: number
  hits: number
  size: number
}

// Cache configuration
interface CacheConfig {
  maxSize?: number  // Maximum number of entries
  ttl?: number      // Time to live in milliseconds
  maxMemory?: number // Maximum memory usage in bytes
}

// Query cache statistics
export interface CacheStats {
  hits: number
  misses: number
  evictions: number
  hitRate: number
  size: number
  memoryUsage: number
}

/**
 * LRU Cache implementation for query results
 * Provides automatic eviction and TTL management
 */
export class QueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    hitRate: 0,
    size: 0,
    memoryUsage: 0,
  }
  
  private readonly maxSize: number
  private readonly ttl: number
  private readonly maxMemory: number
  
  constructor(config: CacheConfig = {}) {
    this.maxSize = config.maxSize ?? 100
    this.ttl = config.ttl ?? 30000  // 30 seconds default
    this.maxMemory = config.maxMemory ?? 50 * 1024 * 1024  // 50MB default
  }
  
  /**
   * Generate a unique cache key from query parameters
   */
  generateKey(table: string, filters: any, options?: any): string {
    const normalized = {
      table,
      filters: this.normalizeFilters(filters),
      options: this.normalizeOptions(options),
    }
    return JSON.stringify(normalized)
  }
  
  /**
   * Normalize filters for consistent cache keys
   */
  private normalizeFilters(filters: any): any {
    if (!filters) return {}
    
    // Sort object keys for consistent serialization
    const sorted: any = {}
    Object.keys(filters).sort().forEach(key => {
      sorted[key] = filters[key]
    })
    return sorted
  }
  
  /**
   * Normalize options for consistent cache keys
   */
  private normalizeOptions(options: any): any {
    if (!options) return {}
    
    const { select, orderBy, limit, offset, ...rest } = options
    return {
      select: select || '*',
      orderBy: orderBy || null,
      limit: limit || null,
      offset: offset || null,
      ...rest,
    }
  }
  
  /**
   * Get cached result if available and valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.size--
      this.stats.memoryUsage -= entry.size
      this.updateHitRate()
      return null
    }
    
    // Update stats and return data
    entry.hits++
    this.stats.hits++
    this.updateHitRate()
    
    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, entry)
    
    return entry.data as T
  }
  
  /**
   * Store result in cache
   */
  set<T>(key: string, data: T): void {
    const size = this.estimateSize(data)
    
    // Check memory limit
    if (this.stats.memoryUsage + size > this.maxMemory) {
      this.evictByMemory(size)
    }
    
    // Check size limit
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }
    
    // Add to cache
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hits: 0,
      size,
    }
    
    this.cache.set(key, entry)
    this.stats.size++
    this.stats.memoryUsage += size
  }
  
  /**
   * Invalidate cache entries matching pattern
   */
  invalidate(pattern?: string | RegExp): void {
    if (!pattern) {
      // Clear all
      this.cache.clear()
      this.stats.size = 0
      this.stats.memoryUsage = 0
      return
    }
    
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      : pattern
    
    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        this.stats.size--
        this.stats.memoryUsage -= entry.size
      }
    }
  }
  
  /**
   * Invalidate cache for specific table
   */
  invalidateTable(table: string): void {
    this.invalidate(`"table":"${table}"`)
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }
  
  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats.hits = 0
    this.stats.misses = 0
    this.stats.evictions = 0
    this.updateHitRate()
  }
  
  /**
   * Estimate memory size of data
   */
  private estimateSize(data: any): number {
    try {
      const json = JSON.stringify(data)
      return json.length * 2  // Rough estimate (2 bytes per character)
    } catch {
      return 1024  // Default size for non-serializable data
    }
  }
  
  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    const firstKey = this.cache.keys().next().value
    if (firstKey) {
      const entry = this.cache.get(firstKey)!
      this.cache.delete(firstKey)
      this.stats.evictions++
      this.stats.size--
      this.stats.memoryUsage -= entry.size
    }
  }
  
  /**
   * Evict entries to free up memory
   */
  private evictByMemory(requiredSize: number): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].hits - b[1].hits)  // Sort by hits (least used first)
    
    let freedMemory = 0
    for (const [key, entry] of entries) {
      if (this.stats.memoryUsage - freedMemory + requiredSize <= this.maxMemory) {
        break
      }
      
      this.cache.delete(key)
      freedMemory += entry.size
      this.stats.evictions++
      this.stats.size--
    }
    
    this.stats.memoryUsage -= freedMemory
  }
  
  /**
   * Update hit rate statistic
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }
  
  /**
   * Warm up cache with common queries
   */
  async warmup(queries: Array<{ builder: QueryBuilder<any>, key?: string }>): Promise<void> {
    const promises = queries.map(async ({ builder, key }) => {
      const cacheKey = key || this.generateKey(
        (builder as any).table,
        (builder as any).filters,
        (builder as any).options
      )
      
      const result = await builder.execute()
      if (!result.error) {
        this.set(cacheKey, result)
      }
    })
    
    await Promise.all(promises)
  }
}

/**
 * Query batching for similar operations
 */
export class QueryBatcher {
  private batches = new Map<string, Array<{ resolve: Function, reject: Function, params: any }>>()
  private timers = new Map<string, NodeJS.Timeout>()
  private readonly batchSize: number
  private readonly batchDelay: number
  
  constructor(batchSize = 10, batchDelay = 10) {
    this.batchSize = batchSize
    this.batchDelay = batchDelay
  }
  
  /**
   * Add query to batch
   */
  async batch<T>(
    key: string,
    params: any,
    executor: (batch: any[]) => Promise<T[]>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Initialize batch if needed
      if (!this.batches.has(key)) {
        this.batches.set(key, [])
        
        // Set timer to execute batch
        const timer = setTimeout(() => {
          this.executeBatch(key, executor)
        }, this.batchDelay)
        
        this.timers.set(key, timer)
      }
      
      // Add to batch
      const batch = this.batches.get(key)!
      batch.push({ resolve, reject, params })
      
      // Execute immediately if batch is full
      if (batch.length >= this.batchSize) {
        clearTimeout(this.timers.get(key)!)
        this.executeBatch(key, executor)
      }
    })
  }
  
  /**
   * Execute batched queries
   */
  private async executeBatch<T>(
    key: string,
    executor: (batch: any[]) => Promise<T[]>
  ): Promise<void> {
    const batch = this.batches.get(key)
    if (!batch || batch.length === 0) return
    
    // Clear batch
    this.batches.delete(key)
    this.timers.delete(key)
    
    try {
      // Execute batch query
      const results = await executor(batch.map(b => b.params))
      
      // Resolve individual promises
      batch.forEach((item, index) => {
        item.resolve(results[index])
      })
    } catch (error) {
      // Reject all promises in batch
      batch.forEach(item => {
        item.reject(error)
      })
    }
  }
}

/**
 * Query optimizer with various strategies
 */
export class QueryOptimizer {
  private cache: QueryCache
  private batcher: QueryBatcher
  private readReplica: any
  private primary: any
  
  constructor(primary: any, readReplica?: any) {
    this.primary = primary
    this.readReplica = readReplica || primary
    this.cache = new QueryCache()
    this.batcher = new QueryBatcher()
  }
  
  /**
   * Get optimal connection for query type
   */
  getOptimalConnection(queryType: 'read' | 'write'): any {
    return queryType === 'read' ? this.readReplica : this.primary
  }
  
  /**
   * Stream large result sets
   */
  async *streamResults<T>(
    query: QueryBuilder<any>,
    batchSize = 100
  ): AsyncGenerator<T[]> {
    let page = 1
    let hasMore = true
    
    while (hasMore) {
      const result = await query
        .paginate({ page, limit: batchSize })
        .execute()
      
      if (result.error) {
        throw result.error
      }
      
      yield result.data as T[]
      
      hasMore = result.pagination?.hasNext ?? false
      page++
    }
  }
  
  /**
   * Prefetch related data to avoid N+1 queries
   */
  async prefetchRelations<T>(
    items: T[],
    relations: Array<{
      field: keyof T
      table: string
      foreignKey: string
      select?: string
    }>
  ): Promise<T[]> {
    for (const relation of relations) {
      // Collect foreign keys
      const ids = [...new Set(items.map(item => item[relation.field]))]
        .filter(Boolean)
      
      if (ids.length === 0) continue
      
      // Fetch related data
      const { data } = await this.readReplica
        .from(relation.table)
        .select(relation.select || '*')
        .in(relation.foreignKey, ids)
      
      if (!data) continue
      
      // Map related data
      const dataMap = new Map(
        data.map((d: any) => [d[relation.foreignKey], d])
      )
      
      // Attach to items
      items.forEach((item: any) => {
        const key = item[relation.field]
        if (key && dataMap.has(key)) {
          item[`${String(relation.field)}_data`] = dataMap.get(key)
        }
      })
    }
    
    return items
  }
  
  /**
   * Optimize query with caching
   */
  async optimizeWithCache<T>(
    query: QueryBuilder<any>,
    cacheKey?: string
  ): Promise<{ data: T[], error: any }> {
    const key = cacheKey || this.cache.generateKey(
      (query as any).table,
      (query as any).filters,
      (query as any).options
    )
    
    // Check cache
    const cached = this.cache.get<{ data: T[], error: any }>(key)
    if (cached) {
      return cached
    }
    
    // Execute query
    const result = await query.execute()
    
    // Cache successful results
    if (!result.error) {
      this.cache.set(key, result)
    }
    
    return result
  }
  
  /**
   * Parallel query execution
   */
  async parallel<T>(
    queries: Array<QueryBuilder<any>>
  ): Promise<Array<{ data: T[], error: any }>> {
    return Promise.all(queries.map(q => q.execute()))
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return this.cache.getStats()
  }
  
  /**
   * Invalidate cache
   */
  invalidateCache(pattern?: string | RegExp): void {
    this.cache.invalidate(pattern)
  }
}