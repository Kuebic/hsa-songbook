import type { QueryBuilder } from '../queryBuilder'

// Performance metrics interface
export interface QueryMetrics {
  query: string
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert'
  duration: number
  timestamp: number
  userId?: string
  error?: boolean
  errorMessage?: string
  resultCount?: number
  cacheHit?: boolean
}

// Performance thresholds
export interface PerformanceThresholds {
  slowQueryTime: number  // ms
  criticalQueryTime: number  // ms
  highMemoryUsage: number  // bytes
  highConnectionCount: number
}

// Aggregated performance stats
export interface PerformanceStats {
  totalQueries: number
  errorCount: number
  slowQueries: number
  criticalQueries: number
  avgDuration: number
  p50Duration: number
  p95Duration: number
  p99Duration: number
  queriesByTable: Map<string, number>
  queriesByOperation: Map<string, number>
  cacheHitRate: number
  errorRate: number
  timeWindow: {
    start: Date
    end: Date
  }
}

// Alert configuration
export interface AlertConfig {
  onSlowQuery?: (metrics: QueryMetrics) => void
  onCriticalQuery?: (metrics: QueryMetrics) => void
  onHighErrorRate?: (rate: number) => void
  onHighMemoryUsage?: (usage: number) => void
}

/**
 * Performance monitoring for database queries
 */
export class PerformanceMonitor {
  private metrics: QueryMetrics[] = []
  private thresholds: PerformanceThresholds
  private alertConfig: AlertConfig
  private maxMetricsSize = 10000
  private metricsRotationSize = 1000
  
  constructor(
    thresholds: Partial<PerformanceThresholds> = {},
    alertConfig: AlertConfig = {}
  ) {
    this.thresholds = {
      slowQueryTime: thresholds.slowQueryTime ?? 1000,  // 1 second
      criticalQueryTime: thresholds.criticalQueryTime ?? 5000,  // 5 seconds
      highMemoryUsage: thresholds.highMemoryUsage ?? 100 * 1024 * 1024,  // 100MB
      highConnectionCount: thresholds.highConnectionCount ?? 50,
    }
    this.alertConfig = alertConfig
  }
  
  /**
   * Record query execution metrics
   */
  recordQuery(metrics: QueryMetrics): void {
    // Add to metrics
    this.metrics.push(metrics)
    
    // Rotate metrics if needed
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.metricsRotationSize)
    }
    
    // Check for alerts
    this.checkAlerts(metrics)
  }
  
  /**
   * Wrap query builder for automatic monitoring
   */
  wrapQueryBuilder(
    builder: QueryBuilder<any>,
    userId?: string
  ): QueryBuilder<any> {
    const originalExecute = builder.execute.bind(builder)
    
    builder.execute = async () => {
      const startTime = performance.now()
      const builderData = builder as any
      
      try {
        const result = await originalExecute()
        const duration = performance.now() - startTime
        
        // Record metrics
        this.recordQuery({
          query: this.buildQueryString(builderData),
          table: builderData.table,
          operation: this.detectOperation(builderData),
          duration,
          timestamp: Date.now(),
          userId,
          error: !!result.error,
          errorMessage: result.error?.message,
          resultCount: Array.isArray(result.data) ? result.data.length : 1,
          cacheHit: false,  // Would be set by cache layer
        })
        
        return result
      } catch (error) {
        const duration = performance.now() - startTime
        
        // Record error metrics
        this.recordQuery({
          query: this.buildQueryString(builderData),
          table: builderData.table,
          operation: this.detectOperation(builderData),
          duration,
          timestamp: Date.now(),
          userId,
          error: true,
          errorMessage: (error as Error).message,
        })
        
        throw error
      }
    }
    
    return builder
  }
  
  /**
   * Get performance statistics
   */
  getStats(windowMinutes = 60): PerformanceStats {
    const now = Date.now()
    const windowStart = now - (windowMinutes * 60 * 1000)
    
    // Filter metrics within window
    const windowMetrics = this.metrics.filter(m => m.timestamp >= windowStart)
    
    if (windowMetrics.length === 0) {
      return this.emptyStats(new Date(windowStart), new Date(now))
    }
    
    // Calculate statistics
    const durations = windowMetrics.map(m => m.duration).sort((a, b) => a - b)
    const errorCount = windowMetrics.filter(m => m.error).length
    const slowQueries = windowMetrics.filter(m => m.duration >= this.thresholds.slowQueryTime).length
    const criticalQueries = windowMetrics.filter(m => m.duration >= this.thresholds.criticalQueryTime).length
    const cacheHits = windowMetrics.filter(m => m.cacheHit).length
    
    // Aggregate by table and operation
    const queriesByTable = new Map<string, number>()
    const queriesByOperation = new Map<string, number>()
    
    windowMetrics.forEach(m => {
      queriesByTable.set(m.table, (queriesByTable.get(m.table) || 0) + 1)
      queriesByOperation.set(m.operation, (queriesByOperation.get(m.operation) || 0) + 1)
    })
    
    return {
      totalQueries: windowMetrics.length,
      errorCount,
      slowQueries,
      criticalQueries,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50Duration: this.percentile(durations, 0.5),
      p95Duration: this.percentile(durations, 0.95),
      p99Duration: this.percentile(durations, 0.99),
      queriesByTable,
      queriesByOperation,
      cacheHitRate: windowMetrics.length > 0 ? cacheHits / windowMetrics.length : 0,
      errorRate: windowMetrics.length > 0 ? errorCount / windowMetrics.length : 0,
      timeWindow: {
        start: new Date(windowStart),
        end: new Date(now),
      },
    }
  }
  
  /**
   * Get slow queries
   */
  getSlowQueries(limit = 10): QueryMetrics[] {
    return this.metrics
      .filter(m => m.duration >= this.thresholds.slowQueryTime)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }
  
  /**
   * Get failed queries
   */
  getFailedQueries(limit = 10): QueryMetrics[] {
    return this.metrics
      .filter(m => m.error)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
  
  /**
   * Get queries by table
   */
  getQueriesByTable(table: string, limit = 100): QueryMetrics[] {
    return this.metrics
      .filter(m => m.table === table)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
  
  /**
   * Export metrics for analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.metrics, null, 2)
    }
    
    // CSV format
    const headers = [
      'timestamp',
      'table',
      'operation',
      'duration',
      'error',
      'errorMessage',
      'resultCount',
      'cacheHit',
      'userId',
    ]
    
    const rows = this.metrics.map(m => [
      new Date(m.timestamp).toISOString(),
      m.table,
      m.operation,
      m.duration.toFixed(2),
      m.error ? 'true' : 'false',
      m.errorMessage || '',
      m.resultCount?.toString() || '',
      m.cacheHit ? 'true' : 'false',
      m.userId || '',
    ])
    
    return [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(',')),
    ].join('\n')
  }
  
  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = []
  }
  
  /**
   * Check for alert conditions
   */
  private checkAlerts(metrics: QueryMetrics): void {
    // Slow query alert
    if (metrics.duration >= this.thresholds.slowQueryTime) {
      this.alertConfig.onSlowQuery?.(metrics)
    }
    
    // Critical query alert
    if (metrics.duration >= this.thresholds.criticalQueryTime) {
      this.alertConfig.onCriticalQuery?.(metrics)
    }
    
    // High error rate alert (check every 100 queries)
    if (this.metrics.length % 100 === 0) {
      const recentMetrics = this.metrics.slice(-100)
      const errorRate = recentMetrics.filter(m => m.error).length / 100
      
      if (errorRate > 0.1) {  // 10% error rate
        this.alertConfig.onHighErrorRate?.(errorRate)
      }
    }
  }
  
  /**
   * Build query string for logging
   */
  private buildQueryString(builderData: any): string {
    const parts = [builderData.operation || 'select', 'from', builderData.table]
    
    if (builderData.filters && Object.keys(builderData.filters).length > 0) {
      parts.push('where', JSON.stringify(builderData.filters))
    }
    
    if (builderData.options?.orderBy) {
      parts.push('order by', builderData.options.orderBy)
    }
    
    if (builderData.options?.limit) {
      parts.push('limit', builderData.options.limit)
    }
    
    return parts.join(' ')
  }
  
  /**
   * Detect operation type from builder data
   */
  private detectOperation(builderData: any): QueryMetrics['operation'] {
    if (builderData.operation) {
      return builderData.operation
    }
    
    // Infer from method calls
    if (builderData.insertData) return 'insert'
    if (builderData.updateData) return 'update'
    if (builderData.deleteFlag) return 'delete'
    if (builderData.upsertData) return 'upsert'
    
    return 'select'
  }
  
  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0
    
    const index = Math.ceil(sortedArray.length * p) - 1
    return sortedArray[Math.max(0, index)]
  }
  
  /**
   * Create empty stats object
   */
  private emptyStats(start: Date, end: Date): PerformanceStats {
    return {
      totalQueries: 0,
      errorCount: 0,
      slowQueries: 0,
      criticalQueries: 0,
      avgDuration: 0,
      p50Duration: 0,
      p95Duration: 0,
      p99Duration: 0,
      queriesByTable: new Map(),
      queriesByOperation: new Map(),
      cacheHitRate: 0,
      errorRate: 0,
      timeWindow: { start, end },
    }
  }
}

/**
 * Connection pool monitor
 */
export class ConnectionPoolMonitor {
  private activeConnections = 0
  private totalConnections = 0
  private maxConnections: number
  private connectionWaitTime: number[] = []
  
  constructor(maxConnections = 50) {
    this.maxConnections = maxConnections
  }
  
  /**
   * Track connection acquisition
   */
  async trackConnection<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    const waitStart = performance.now()
    
    // Wait if at max connections
    while (this.activeConnections >= this.maxConnections) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    const waitTime = performance.now() - waitStart
    this.connectionWaitTime.push(waitTime)
    
    this.activeConnections++
    this.totalConnections++
    
    try {
      return await operation()
    } finally {
      this.activeConnections--
    }
  }
  
  /**
   * Get connection pool stats
   */
  getStats() {
    const waitTimes = [...this.connectionWaitTime].sort((a, b) => a - b)
    
    return {
      activeConnections: this.activeConnections,
      totalConnections: this.totalConnections,
      maxConnections: this.maxConnections,
      utilizationRate: this.activeConnections / this.maxConnections,
      avgWaitTime: waitTimes.length > 0 
        ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length 
        : 0,
      p95WaitTime: waitTimes.length > 0
        ? waitTimes[Math.floor(waitTimes.length * 0.95)]
        : 0,
    }
  }
}

/**
 * Database health monitor
 */
export class DatabaseHealthMonitor {
  private performanceMonitor: PerformanceMonitor
  private connectionMonitor: ConnectionPoolMonitor
  private healthChecks: Map<string, boolean> = new Map()
  
  constructor(
    performanceMonitor: PerformanceMonitor,
    connectionMonitor: ConnectionPoolMonitor
  ) {
    this.performanceMonitor = performanceMonitor
    this.connectionMonitor = connectionMonitor
  }
  
  /**
   * Run health check
   */
  async checkHealth(client: any): Promise<{
    healthy: boolean
    checks: Record<string, boolean>
    metrics: any
  }> {
    const checks: Record<string, boolean> = {}
    
    // Check database connectivity
    try {
      const { error } = await client.from('songs').select('id').limit(1)
      checks.connectivity = !error
    } catch {
      checks.connectivity = false
    }
    
    // Check performance metrics
    const perfStats = this.performanceMonitor.getStats(5)  // Last 5 minutes
    checks.performance = perfStats.p95Duration < 1000  // p95 under 1 second
    checks.errorRate = perfStats.errorRate < 0.01  // Under 1% error rate
    
    // Check connection pool
    const connStats = this.connectionMonitor.getStats()
    checks.connectionPool = connStats.utilizationRate < 0.8  // Under 80% utilization
    
    // Overall health
    const healthy = Object.values(checks).every(v => v)
    
    return {
      healthy,
      checks,
      metrics: {
        performance: perfStats,
        connections: connStats,
      },
    }
  }
  
  /**
   * Start periodic health checks
   */
  startHealthChecks(
    client: any,
    intervalMs = 60000,  // 1 minute
    onUnhealthy?: (report: any) => void
  ): NodeJS.Timeout {
    return setInterval(async () => {
      const health = await this.checkHealth(client)
      
      if (!health.healthy && onUnhealthy) {
        onUnhealthy(health)
      }
      
      // Store health status
      this.healthChecks.set(new Date().toISOString(), health.healthy)
      
      // Keep only last 100 checks
      if (this.healthChecks.size > 100) {
        const firstKey = this.healthChecks.keys().next().value
        if (firstKey) {
          this.healthChecks.delete(firstKey)
        }
      }
    }, intervalMs)
  }
  
  /**
   * Get health history
   */
  getHealthHistory(): Array<{ timestamp: string, healthy: boolean }> {
    return Array.from(this.healthChecks.entries()).map(([timestamp, healthy]) => ({
      timestamp,
      healthy,
    }))
  }
}