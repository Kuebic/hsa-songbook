# Foundation Phase 3D: Database Query Optimization PRP

name: "Database Query Optimization Implementation"
description: |
  Optimize database performance through strategic indexing, query optimization, enhanced caching,
  and connection pooling to achieve <100ms response times for 95% of queries.

---

## Goal

**Feature Goal**: Optimize database query performance through strategic indexing, query optimization patterns, intelligent caching, and connection pooling to reduce response times and improve scalability.

**Deliverable**: Optimized database layer with performance indexes, query analyzer, enhanced cache strategy, connection pooling, and monitoring integration.

**Success Definition**: P95 query response time <100ms, 80% cache hit rate, zero slow queries (>1s) in production, 50% reduction in database load.

## User Persona

**Target User**: End users experiencing faster data loads and developers with improved database tools

**Use Case**: Fast song searches, instant arrangement loading, responsive setlist management

**User Journey**:
1. User searches for songs → Results appear in <200ms
2. User opens arrangement → Loads instantly from cache
3. User manages setlist → Real-time updates without lag
4. System handles 100+ concurrent users smoothly

**Pain Points Addressed**:
- Slow search results on large datasets
- Delayed arrangement loading
- Database bottlenecks during peak usage
- Inefficient queries causing timeouts

## Why

- **User Experience**: 100ms delay = 1% drop in user engagement
- **Scalability**: Current queries won't scale beyond 10K songs
- **Infrastructure**: Reduce database costs by 40% through optimization
- **Reliability**: Prevent database overload during traffic spikes

## What

Implement comprehensive database optimization including strategic indexes, query optimization patterns, multi-tier caching, connection pooling, and real-time monitoring.

### Success Criteria

- [ ] P95 query response time <100ms
- [ ] Zero queries exceeding 1s in production
- [ ] 80% cache hit rate for frequent queries
- [ ] Connection pool utilization <70%
- [ ] Full-text search returns in <200ms
- [ ] Database CPU usage reduced by 40%
- [ ] Query monitoring dashboard operational
- [ ] Automatic slow query detection

## All Needed Context

### Context Completeness Check

_This PRP contains complete database optimization patterns and Supabase-specific implementation details for successful optimization without prior knowledge._

### Documentation & References

```yaml
- url: https://supabase.com/docs/guides/database/query-optimization
  why: Supabase-specific query optimization techniques
  critical: RLS policy optimization and index strategies

- url: https://www.postgresql.org/docs/15/indexes.html
  why: PostgreSQL 15 indexing strategies and types
  critical: B-tree vs GIN vs GiST index selection

- url: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling
  why: Supabase connection pooling configuration
  critical: PgBouncer settings and pool modes

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/supabase/migrations/20250125000002_add_performance_indexes.sql
  why: Existing index implementation
  pattern: GIN indexes for text search, partial indexes for visibility
  gotcha: Already has basic indexing, needs enhancement

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/lib/database/queryBuilder.ts
  why: Current query builder with type safety
  pattern: Fluent interface with visibility filtering
  gotcha: Already implements basic query optimization

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/lib/database/optimizations/queryCache.ts
  why: LRU cache implementation
  pattern: TTL-based caching with memory limits
  gotcha: 30-second TTL may be too short for static data

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/lib/database/monitoring/performanceMonitor.ts
  why: Query performance tracking
  pattern: Metrics collection with percentile analysis
  gotcha: Already tracks slow queries

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/supabase/config.toml
  why: Database configuration
  pattern: Connection pooling disabled for local dev
  gotcha: Pooler settings need production configuration

- docfile: PRPs/ai_docs/supabase-query-optimization.md
  why: Supabase-specific optimization patterns
  section: RLS Performance Optimization
```

### Current Codebase tree

```bash
hsa-songbook/
├── supabase/
│   ├── migrations/
│   │   ├── 20250125000002_add_performance_indexes.sql  # Basic indexes
│   │   └── 20250125000004_add_helper_functions.sql     # DB functions
│   └── config.toml                                      # Pooler disabled
├── src/
│   └── lib/
│       └── database/
│           ├── queryBuilder.ts                          # Query builder
│           ├── optimizations/
│           │   └── queryCache.ts                        # LRU cache
│           └── monitoring/
│               └── performanceMonitor.ts                # Query metrics
└── scripts/
    └── test-migrations.sh                                # Migration tests
```

### Desired Codebase tree with files to be added

```bash
hsa-songbook/
├── supabase/
│   ├── migrations/
│   │   ├── 20250126000001_optimize_indexes.sql          # NEW: Advanced indexes
│   │   ├── 20250126000002_add_materialized_views.sql    # NEW: Mat views
│   │   └── 20250126000003_optimize_rls_policies.sql     # NEW: RLS optimization
│   └── config.toml                                      # MODIFIED: Enable pooler
├── src/
│   └── lib/
│       └── database/
│           ├── queryBuilder.ts                          # ENHANCED: Optimizations
│           ├── optimizations/
│           │   ├── queryCache.ts                        # ENHANCED: Smart cache
│           │   ├── queryOptimizer.ts                    # NEW: Query optimizer
│           │   ├── connectionPool.ts                    # NEW: Pool manager
│           │   └── cacheWarmer.ts                       # NEW: Cache warming
│           └── monitoring/
│               ├── performanceMonitor.ts                # ENHANCED: Alerting
│               └── queryAnalyzer.ts                     # NEW: Query analysis
├── scripts/
│   ├── analyze-queries.js                               # NEW: Query analyzer
│   └── optimize-database.sh                             # NEW: Optimization script
└── monitoring/
    └── slow-queries.sql                                 # NEW: Slow query log
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Supabase RLS adds overhead to every query
// Must optimize RLS policies for performance

// CRITICAL: PgBouncer transaction pooling incompatible with prepared statements
// Use session pooling for complex queries

// CRITICAL: GIN indexes are expensive to update
// Use for read-heavy columns only

// CRITICAL: Materialized views need manual refresh
// Implement refresh strategy based on data staleness

// CRITICAL: Supabase connection limit is 60 for free tier
// Must implement connection pooling

// CRITICAL: React Query refetchInterval can overload database
// Implement smart refetch strategies
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/lib/database/types/optimization.ts
export interface QueryOptimizationHint {
  type: 'index' | 'cache' | 'batch' | 'materialize'
  table: string
  columns?: string[]
  condition?: string
  priority: 'high' | 'medium' | 'low'
}

export interface CacheStrategy {
  key: string
  ttl: number // seconds
  staleWhileRevalidate?: boolean
  tags?: string[] // For cache invalidation
  warmOnStartup?: boolean
}

export interface QueryPlan {
  query: string
  estimatedCost: number
  executionTime?: number
  indexesUsed: string[]
  suggestions: QueryOptimizationHint[]
}

export interface ConnectionPoolConfig {
  min: number
  max: number
  idleTimeoutMillis: number
  connectionTimeoutMillis: number
  allowExitOnIdle: boolean
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE supabase/migrations/20250126000001_optimize_indexes.sql
  - IMPLEMENT: Advanced indexing strategy
  - ADD: Composite indexes for common JOIN patterns
  - ADD: Covering indexes for SELECT queries
  - ADD: BRIN indexes for time-series data
  - OPTIMIZE: Existing indexes with WHERE clauses
  - ANALYZE: Tables after index creation

Task 2: CREATE supabase/migrations/20250126000002_add_materialized_views.sql
  - CREATE: Materialized view for popular songs
  - CREATE: Materialized view for user statistics
  - CREATE: Materialized view for search results
  - ADD: Refresh functions with CONCURRENTLY option
  - SCHEDULE: Periodic refresh via pg_cron

Task 3: CREATE supabase/migrations/20250126000003_optimize_rls_policies.sql
  - OPTIMIZE: RLS policies with EXISTS subqueries
  - ADD: Security definer functions for complex checks
  - CREATE: Policy helper functions for reuse
  - INDEX: Columns used in RLS policies
  - SIMPLIFY: Policy conditions where possible

Task 4: UPDATE supabase/config.toml
  - ENABLE: Connection pooler for production
  - CONFIGURE: Pool mode as 'transaction'
  - SET: pool_size = 25 for optimal performance
  - SET: max_client_conn = 100
  - ADD: Statement timeout configuration

Task 5: CREATE src/lib/database/optimizations/queryOptimizer.ts
  - IMPLEMENT: Query analysis and optimization
  - METHODS: analyzeQuery(), optimizeQuery(), suggestIndexes()
  - PATTERN: Explain plan analysis
  - INTEGRATE: With queryBuilder
  - CACHE: Optimization plans

Task 6: ENHANCE src/lib/database/optimizations/queryCache.ts
  - ADD: Tag-based cache invalidation
  - ADD: Stale-while-revalidate pattern
  - IMPLEMENT: Cache key normalization
  - ADD: Cache statistics tracking
  - OPTIMIZE: Memory usage with compression

Task 7: CREATE src/lib/database/optimizations/connectionPool.ts
  - IMPLEMENT: Connection pool manager
  - MONITOR: Pool health and utilization
  - ADD: Connection retry logic
  - IMPLEMENT: Circuit breaker pattern
  - TRACK: Connection metrics

Task 8: CREATE src/lib/database/optimizations/cacheWarmer.ts
  - IMPLEMENT: Proactive cache warming
  - IDENTIFY: Frequently accessed data
  - SCHEDULE: Off-peak warming
  - PRIORITIZE: Critical queries
  - MONITOR: Warming effectiveness

Task 9: CREATE src/lib/database/monitoring/queryAnalyzer.ts
  - IMPLEMENT: Real-time query analysis
  - DETECT: N+1 query patterns
  - IDENTIFY: Missing indexes
  - SUGGEST: Query optimizations
  - ALERT: On performance degradation

Task 10: CREATE scripts/analyze-queries.js
  - PARSE: Supabase query logs
  - IDENTIFY: Slow queries
  - ANALYZE: Query patterns
  - GENERATE: Optimization report
  - OUTPUT: Index recommendations

Task 11: CREATE scripts/optimize-database.sh
  - RUN: VACUUM ANALYZE
  - UPDATE: Table statistics
  - REINDEX: Fragmented indexes
  - REFRESH: Materialized views
  - REPORT: Optimization results
```

### Implementation Patterns & Key Details

```typescript
// Advanced Index Creation
-- supabase/migrations/20250126000001_optimize_indexes.sql

-- Composite index for common JOIN pattern
CREATE INDEX idx_arrangements_song_user 
ON arrangements(song_id, created_by) 
WHERE deleted_at IS NULL;

-- Covering index for SELECT without table access
CREATE INDEX idx_songs_search_covering 
ON songs(title, artist, id, is_public) 
WHERE deleted_at IS NULL AND is_public = true;

-- BRIN index for time-series data (space-efficient)
CREATE INDEX idx_arrangements_created_brin 
ON arrangements USING brin(created_at) 
WITH (pages_per_range = 128);

-- GIN index for array containment
CREATE INDEX idx_songs_themes_gin 
ON songs USING gin(themes) 
WHERE deleted_at IS NULL;

-- Partial unique index for business logic
CREATE UNIQUE INDEX idx_songs_slug_unique 
ON songs(slug) 
WHERE deleted_at IS NULL;

-- Expression index for case-insensitive search
CREATE INDEX idx_songs_title_lower 
ON songs(LOWER(title)) 
WHERE deleted_at IS NULL;

-- Optimized RLS helper index
CREATE INDEX idx_user_roles_lookup 
ON user_roles(user_id, role) 
WHERE is_active = true;

-- Analyze tables for query planner
ANALYZE songs;
ANALYZE arrangements;
ANALYZE user_roles;

-- Materialized Views for Complex Queries
-- supabase/migrations/20250126000002_add_materialized_views.sql

-- Popular songs with aggregated stats
CREATE MATERIALIZED VIEW mv_popular_songs AS
SELECT 
  s.id,
  s.title,
  s.artist,
  s.slug,
  COUNT(DISTINCT a.id) as arrangement_count,
  COUNT(DISTINCT si.setlist_id) as setlist_count,
  AVG(a.rating) as avg_rating,
  MAX(a.updated_at) as last_arranged
FROM songs s
LEFT JOIN arrangements a ON s.id = a.song_id
LEFT JOIN setlist_items si ON s.id = si.song_id
WHERE s.deleted_at IS NULL 
  AND s.is_public = true
GROUP BY s.id, s.title, s.artist, s.slug
ORDER BY setlist_count DESC, arrangement_count DESC;

-- Index the materialized view
CREATE INDEX idx_mv_popular_songs_title 
ON mv_popular_songs USING gin(title gin_trgm_ops);

-- Search results cache
CREATE MATERIALIZED VIEW mv_song_search AS
SELECT 
  s.id,
  s.title,
  s.artist,
  s.alternative_titles,
  s.themes,
  to_tsvector('english', 
    coalesce(s.title, '') || ' ' || 
    coalesce(s.artist, '') || ' ' || 
    coalesce(array_to_string(s.alternative_titles, ' '), '')
  ) as search_vector
FROM songs s
WHERE s.deleted_at IS NULL 
  AND s.is_public = true;

-- Full-text search index
CREATE INDEX idx_mv_song_search_vector 
ON mv_song_search USING gin(search_vector);

-- Refresh function with concurrency
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  -- Refresh without blocking reads
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_songs;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_song_search;
END;
$$ LANGUAGE plpgsql;

// Query Optimizer Implementation
export class QueryOptimizer {
  private queryCache = new Map<string, QueryPlan>()
  private indexSuggestions = new Map<string, QueryOptimizationHint[]>()

  async analyzeQuery(query: string): Promise<QueryPlan> {
    // Check cache first
    const cached = this.queryCache.get(query)
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return cached
    }

    // Get EXPLAIN ANALYZE output
    const { data: explainData } = await supabase
      .rpc('explain_query', { query_text: query })

    const plan = this.parseExplainPlan(explainData)
    
    // Analyze for optimizations
    const suggestions = this.generateSuggestions(plan)
    
    const queryPlan: QueryPlan = {
      query,
      estimatedCost: plan.totalCost,
      executionTime: plan.executionTime,
      indexesUsed: plan.indexScans,
      suggestions
    }

    // Cache the plan
    this.queryCache.set(query, { ...queryPlan, timestamp: Date.now() })
    
    // Track slow queries
    if (plan.executionTime > 1000) {
      performanceMonitor.trackSlowQuery(query, plan.executionTime)
    }

    return queryPlan
  }

  private generateSuggestions(plan: ExplainPlan): QueryOptimizationHint[] {
    const suggestions: QueryOptimizationHint[] = []

    // Check for sequential scans on large tables
    if (plan.seqScans.length > 0) {
      plan.seqScans.forEach(scan => {
        if (scan.rows > 1000) {
          suggestions.push({
            type: 'index',
            table: scan.table,
            columns: scan.filterColumns,
            priority: 'high'
          })
        }
      })
    }

    // Check for missing JOIN indexes
    if (plan.nestedLoops > 0 && plan.estimatedRows > 100) {
      suggestions.push({
        type: 'index',
        table: plan.joinTable,
        columns: plan.joinColumns,
        priority: 'medium'
      })
    }

    // Suggest caching for expensive queries
    if (plan.totalCost > 100) {
      suggestions.push({
        type: 'cache',
        table: plan.mainTable,
        priority: 'high'
      })
    }

    // Suggest materialized view for complex aggregations
    if (plan.aggregations > 2 && plan.estimatedRows > 10000) {
      suggestions.push({
        type: 'materialize',
        table: plan.mainTable,
        priority: 'medium'
      })
    }

    return suggestions
  }

  optimizeQuery(query: string, hints?: QueryOptimizationHint[]): string {
    let optimized = query

    // Apply optimization hints
    if (hints?.some(h => h.type === 'batch')) {
      // Convert to batch query
      optimized = this.convertToBatch(query)
    }

    // Add index hints for PostgreSQL
    if (hints?.some(h => h.type === 'index')) {
      optimized = this.addIndexHints(query, hints)
    }

    // Rewrite for better performance
    optimized = this.rewriteSubqueries(optimized)
    optimized = this.optimizeJoins(optimized)

    return optimized
  }

  private rewriteSubqueries(query: string): string {
    // Convert correlated subqueries to JOINs
    // Example: SELECT * FROM songs WHERE id IN (SELECT song_id FROM arrangements)
    // Becomes: SELECT DISTINCT s.* FROM songs s INNER JOIN arrangements a ON s.id = a.song_id
    
    // This is a simplified example
    return query.replace(
      /WHERE\s+(\w+)\s+IN\s*\(SELECT\s+(\w+)\s+FROM\s+(\w+)\)/gi,
      'INNER JOIN $3 ON $1 = $3.$2'
    )
  }
}

// Enhanced Cache with Tags
export class SmartQueryCache extends QueryCache {
  private tags = new Map<string, Set<string>>() // tag -> cache keys
  private staleKeys = new Set<string>()

  async get<T>(
    key: string, 
    fetchFn: () => Promise<T>,
    options: CacheStrategy
  ): Promise<T> {
    const cached = this.cache.get(key)
    
    // Return stale data while revalidating
    if (cached && options.staleWhileRevalidate) {
      const isStale = Date.now() - cached.timestamp > options.ttl * 1000
      
      if (isStale && !this.staleKeys.has(key)) {
        this.staleKeys.add(key)
        
        // Revalidate in background
        fetchFn().then(fresh => {
          this.set(key, fresh, options)
          this.staleKeys.delete(key)
        }).catch(console.error)
      }
      
      return cached.data as T
    }

    // Standard cache behavior
    if (cached && Date.now() - cached.timestamp < options.ttl * 1000) {
      this.stats.hits++
      return cached.data as T
    }

    // Cache miss - fetch new data
    this.stats.misses++
    const fresh = await fetchFn()
    this.set(key, fresh, options)
    
    return fresh
  }

  set<T>(key: string, data: T, options: CacheStrategy): void {
    super.set(key, data, options.ttl)
    
    // Track tags for invalidation
    if (options.tags) {
      options.tags.forEach(tag => {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set())
        }
        this.tags.get(tag)!.add(key)
      })
    }
  }

  invalidateTag(tag: string): void {
    const keys = this.tags.get(tag)
    if (keys) {
      keys.forEach(key => this.delete(key))
      this.tags.delete(tag)
    }
  }

  // Compression for large cached items
  private compress(data: any): string {
    return LZString.compressToUTF16(JSON.stringify(data))
  }

  private decompress(compressed: string): any {
    return JSON.parse(LZString.decompressFromUTF16(compressed))
  }
}

// Connection Pool Manager
export class ConnectionPoolManager {
  private pool: Pool
  private circuitBreaker: CircuitBreaker
  private metrics = {
    activeConnections: 0,
    waitingRequests: 0,
    totalConnections: 0,
    errors: 0
  }

  constructor(config: ConnectionPoolConfig) {
    this.pool = new Pool({
      ...config,
      host: process.env.DATABASE_HOST,
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
    })

    this.circuitBreaker = new CircuitBreaker(this.executeQuery.bind(this), {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000
    })

    this.setupMonitoring()
  }

  async query<T>(text: string, params?: any[]): Promise<T> {
    return this.circuitBreaker.fire(text, params)
  }

  private async executeQuery(text: string, params?: any[]) {
    const client = await this.pool.connect()
    this.metrics.activeConnections++

    try {
      const start = Date.now()
      const result = await client.query(text, params)
      const duration = Date.now() - start

      // Track metrics
      performanceMonitor.trackQuery({
        query: text,
        duration,
        rows: result.rowCount
      })

      return result
    } finally {
      client.release()
      this.metrics.activeConnections--
    }
  }

  private setupMonitoring() {
    // Monitor pool health
    setInterval(() => {
      const stats = {
        ...this.metrics,
        poolSize: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      }

      // Alert on high utilization
      const utilization = stats.activeConnections / stats.poolSize
      if (utilization > 0.8) {
        errorReportingService.report({
          level: 'warning',
          message: 'High database connection pool utilization',
          context: stats
        })
      }

      performanceService.trackMetric('db.pool.utilization', utilization * 100)
    }, 10000) // Every 10 seconds
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1')
      return true
    } catch {
      return false
    }
  }
}

// Cache Warmer for Proactive Caching
export class CacheWarmer {
  private warmupQueries: Map<string, CacheStrategy> = new Map()
  private warmupSchedule: NodeJS.Timer | null = null

  registerWarmupQuery(
    name: string, 
    queryFn: () => Promise<any>, 
    strategy: CacheStrategy
  ) {
    this.warmupQueries.set(name, { queryFn, strategy })
  }

  async warmCache(): Promise<void> {
    console.log('Starting cache warmup...')
    const start = Date.now()

    const warmupPromises = Array.from(this.warmupQueries.entries()).map(
      async ([name, { queryFn, strategy }]) => {
        try {
          const data = await queryFn()
          queryCache.set(name, data, strategy)
          console.log(`✓ Warmed cache for ${name}`)
        } catch (error) {
          console.error(`✗ Failed to warm ${name}:`, error)
        }
      }
    )

    await Promise.all(warmupPromises)
    
    const duration = Date.now() - start
    console.log(`Cache warmup completed in ${duration}ms`)
    
    performanceService.trackMetric('cache.warmup.duration', duration)
  }

  startScheduledWarmup(intervalMs = 3600000) { // Default 1 hour
    this.warmupSchedule = setInterval(() => {
      // Warm cache during off-peak hours
      const hour = new Date().getHours()
      if (hour >= 2 && hour <= 5) { // 2 AM - 5 AM
        this.warmCache()
      }
    }, intervalMs)
  }

  stopScheduledWarmup() {
    if (this.warmupSchedule) {
      clearInterval(this.warmupSchedule)
      this.warmupSchedule = null
    }
  }
}

// Initialize cache warming
const cacheWarmer = new CacheWarmer()

// Register queries to warm
cacheWarmer.registerWarmupQuery(
  'popular-songs',
  () => supabase.from('mv_popular_songs').select('*').limit(100),
  { ttl: 3600, tags: ['songs'], staleWhileRevalidate: true }
)

cacheWarmer.registerWarmupQuery(
  'recent-arrangements',
  () => supabase
    .from('arrangements')
    .select('*, songs(*)')
    .order('created_at', { ascending: false })
    .limit(50),
  { ttl: 1800, tags: ['arrangements'], staleWhileRevalidate: true }
)

// Start warmup on app initialization
if (process.env.NODE_ENV === 'production') {
  cacheWarmer.warmCache() // Initial warmup
  cacheWarmer.startScheduledWarmup() // Scheduled warmup
}
```

### Integration Points

```yaml
DATABASE:
  - migrations: "supabase/migrations/"
  - run: "supabase migration up"
  - verify: "supabase db test"

CONFIGURATION:
  - file: "supabase/config.toml"
  - pooler: "Enable for production"
  - monitoring: "Enable slow query log"

APPLICATION:
  - queryBuilder: "src/lib/database/queryBuilder.ts"
  - integrate: "QueryOptimizer for automatic optimization"
  - cache: "SmartQueryCache with tags"

SERVICES:
  - songs: "Use materialized views for popular songs"
  - search: "Use full-text search indexes"
  - arrangements: "Cache with stale-while-revalidate"

MONITORING:
  - dashboard: "Database performance metrics"
  - alerts: "Slow query detection"
  - reports: "Weekly optimization reports"
```

## Validation Loop

### Level 1: Syntax & Migration Testing

```bash
# Test migrations locally
supabase db reset
supabase migration up
# Expected: All migrations apply successfully

# Verify indexes created
psql $DATABASE_URL -c "\di"
# Expected: See all new indexes listed

# Check materialized views
psql $DATABASE_URL -c "\dm"
# Expected: mv_popular_songs, mv_song_search listed

# TypeScript compilation
npm run build
# Expected: No errors
```

### Level 2: Query Performance Testing

```bash
# Run query analysis script
node scripts/analyze-queries.js
# Expected: Report showing query optimizations

# Test query performance
npm run test -- src/lib/database/optimizations
# Expected: All performance tests pass

# Benchmark critical queries
npm run test:benchmark -- database
# Expected: P95 <100ms for all queries

# Test cache hit rates
npm run test -- src/lib/database/optimizations/queryCache.test.ts
# Expected: >80% hit rate in simulations
```

### Level 3: Load Testing

```bash
# Start application
npm run dev &
DEV_PID=$!
sleep 5

# Run load test
npm run test:load -- --users=100 --duration=60s
# Expected: No timeouts, P95 <100ms

# Monitor during load
curl http://localhost:5173/api/metrics/database
# Expected: Connection pool <70% utilized

# Check cache effectiveness
curl http://localhost:5173/api/metrics/cache
# Expected: Hit rate >80%

# Verify no slow queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements WHERE mean_exec_time > 1000"
# Expected: No results

kill $DEV_PID
```

### Level 4: Production Validation

```bash
# Deploy to staging
npm run deploy:staging

# Run production-like load test
npm run test:load -- --env=staging --users=500 --duration=300s
# Expected: System remains responsive

# Check monitoring dashboard
open https://your-monitoring.com/database
# Expected: All metrics within thresholds

# Verify materialized view refresh
psql $DATABASE_URL -c "SELECT schemaname, matviewname, last_refresh FROM pg_matviews"
# Expected: Recent refresh times

# Test failover scenarios
# Simulate connection pool exhaustion
# Expected: Circuit breaker activates, app remains functional

# Generate performance report
node scripts/generate-performance-report.js
# Expected: 40% improvement vs baseline
```

## Final Validation Checklist

### Technical Validation

- [ ] All migrations applied successfully
- [ ] TypeScript compilation successful
- [ ] All tests pass
- [ ] No ESLint errors

### Performance Metrics

- [ ] P95 query time <100ms
- [ ] Zero queries >1s in production
- [ ] Cache hit rate >80%
- [ ] Connection pool utilization <70%
- [ ] Database CPU usage reduced by 40%

### Indexing & Optimization

- [ ] All critical queries use indexes
- [ ] No sequential scans on large tables
- [ ] Materialized views refreshing correctly
- [ ] RLS policies optimized
- [ ] Query plans analyzed and optimized

### Caching Strategy

- [ ] Tag-based invalidation working
- [ ] Stale-while-revalidate implemented
- [ ] Cache warming on startup
- [ ] Memory limits enforced
- [ ] Compression for large items

### Monitoring & Alerting

- [ ] Slow query detection active
- [ ] Query analyzer operational
- [ ] Performance dashboard live
- [ ] Alerts configured for degradation
- [ ] Metrics exported to monitoring

---

## Anti-Patterns to Avoid

- ❌ Don't create indexes on every column (index maintenance overhead)
- ❌ Don't ignore VACUUM and ANALYZE (statistics become stale)
- ❌ Don't use SELECT * in production (fetch only needed columns)
- ❌ Don't bypass RLS policies (security vulnerability)
- ❌ Don't cache user-specific data globally (privacy issue)
- ❌ Don't refresh materialized views during peak hours
- ❌ Don't ignore connection pool limits (connection exhaustion)
- ❌ Don't cache without TTL (stale data forever)