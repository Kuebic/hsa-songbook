# Data Layer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [QueryBuilder API Reference](#querybuilder-api-reference)
3. [Performance Optimizations](#performance-optimizations)
4. [Testing Strategy](#testing-strategy)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)
7. [Performance Tuning](#performance-tuning)
8. [Monitoring and Metrics](#monitoring-and-metrics)

## Architecture Overview

### Core Components

The HSA Songbook data layer is built on a robust, type-safe architecture optimized for performance and maintainability.

```
┌─────────────────────────────────────────────────────┐
│                   Application Layer                  │
├─────────────────────────────────────────────────────┤
│                  QueryBuilder API                    │
│  ┌────────────┬────────────┬────────────────────┐  │
│  │ Visibility │   Cache    │    Performance     │  │
│  │  Filters   │   Layer    │     Monitor        │  │
│  └────────────┴────────────┴────────────────────┘  │
├─────────────────────────────────────────────────────┤
│                  Supabase Client                     │
│  ┌────────────┬────────────┬────────────────────┐  │
│  │ Connection │    RLS     │    Real-time       │  │
│  │    Pool    │  Policies  │    Subscriptions   │  │
│  └────────────┴────────────┴────────────────────┘  │
├─────────────────────────────────────────────────────┤
│                PostgreSQL Database                   │
└─────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Type Safety**: Full TypeScript support with generated types from Supabase
2. **Performance First**: Built-in caching, query optimization, and monitoring
3. **Security by Default**: RBAC with visibility filters applied automatically
4. **Developer Experience**: Fluent API with method chaining
5. **Observability**: Comprehensive metrics and monitoring

## QueryBuilder API Reference

### Basic Usage

```typescript
import { QueryBuilder } from '@lib/database/queryBuilder'
import { supabase } from '@lib/supabase'

// Create a query builder instance
const qb = new QueryBuilder(supabase, 'songs')

// Execute a simple query
const { data, error } = await qb
  .select('*')
  .eq('is_public', true)
  .limit(20)
  .execute()
```

### API Methods

#### Selection Methods

```typescript
// Select specific columns
.select('id, title, artist')

// Select with relations
.select('*, arrangements(*)')

// Select with nested relations
.select(`
  *,
  arrangements (
    *,
    songs (*)
  )
`)

// Count only (no data)
.select('*', { count: 'exact', head: true })
```

#### Filter Methods

```typescript
// Equality filters
.eq('column', value)         // Equal
.neq('column', value)        // Not equal

// Comparison filters
.gt('column', value)         // Greater than
.gte('column', value)        // Greater than or equal
.lt('column', value)         // Less than
.lte('column', value)        // Less than or equal

// Pattern matching
.like('column', pattern)     // Case-sensitive pattern
.ilike('column', pattern)    // Case-insensitive pattern

// Array operations
.in('column', ['value1', 'value2'])
.contains('array_column', ['value'])
.containedBy('array_column', ['value1', 'value2'])
.overlaps('array_column', ['value'])

// Null checks
.is('column', null)
.not('column', 'is', null)

// Full-text search
.textSearch('column', 'search terms', {
  type: 'websearch',  // or 'plain', 'phrase'
  config: 'english'
})

// Range operations
.range(from, to)
```

#### Visibility Filters

```typescript
// Apply visibility based on user permissions
.withVisibility({
  userId: 'user-123',
  roles: ['user', 'moderator'],
  canModerate: true,
  canAdmin: false
})
```

#### Ordering and Pagination

```typescript
// Ordering
.orderBy('created_at', 'desc')
.orderBy('title', 'asc')  // Multiple order clauses

// Pagination
.paginate({ page: 1, limit: 20 })

// Limit and offset
.limit(10)
.range(0, 9)  // Equivalent to limit(10)
```

#### Data Mutations

```typescript
// Insert
const { data, error } = await qb
  .insert({ title: 'New Song', artist: 'Artist' })
  .single()  // Return single record
  .execute()

// Update
await qb
  .update({ views: 100 })
  .eq('id', 'song-123')
  .execute()

// Upsert
await qb
  .upsert({ 
    id: 'song-123', 
    title: 'Updated Title' 
  })
  .execute()

// Delete
await qb
  .delete()
  .eq('id', 'song-123')
  .execute()
```

### Error Handling

```typescript
const { data, error } = await qb.select('*').execute()

if (error) {
  // Error is typed and includes:
  // - message: User-friendly error message
  // - code: Error code for programmatic handling
  // - details: Additional error context
  console.error('Query failed:', error.message)
  return
}

// Data is properly typed based on table schema
console.log('Results:', data)
```

## Performance Optimizations

### Query Caching

The QueryCache provides automatic caching with LRU eviction:

```typescript
import { QueryCache } from '@lib/database/optimizations/queryCache'

// Create cache with custom configuration
const cache = new QueryCache({
  maxSize: 100,      // Maximum cache entries
  ttl: 30000,        // Time to live (30 seconds)
  maxMemory: 50 * 1024 * 1024  // 50MB max memory
})

// Use with QueryBuilder
const optimizer = new QueryOptimizer(supabase)
const result = await optimizer.optimizeWithCache(qb, 'custom-key')

// Invalidate cache
cache.invalidateTable('songs')  // Clear all songs queries
cache.invalidate(/pattern/)      // Clear matching patterns
```

### Query Batching

Batch similar queries to reduce database round trips:

```typescript
import { QueryBatcher } from '@lib/database/optimizations/queryCache'

const batcher = new QueryBatcher(10, 10)  // batch size, delay in ms

// Queries are automatically batched
const results = await Promise.all([
  batcher.batch('songs', { id: 1 }, executor),
  batcher.batch('songs', { id: 2 }, executor),
  batcher.batch('songs', { id: 3 }, executor),
])
```

### Connection Pooling

Optimize connection usage:

```typescript
const optimizer = new QueryOptimizer(primaryClient, readReplicaClient)

// Automatically routes to appropriate connection
const connection = optimizer.getOptimalConnection('read')  // Uses read replica
const connection = optimizer.getOptimalConnection('write') // Uses primary
```

### Streaming Large Results

Handle large datasets efficiently:

```typescript
const optimizer = new QueryOptimizer(supabase)

// Stream results in batches
for await (const batch of optimizer.streamResults(qb, 100)) {
  // Process batch of 100 records
  console.log(`Processing ${batch.length} records`)
}
```

## Testing Strategy

### Test Structure

```
src/lib/database/__tests__/
├── unit/               # Fast, isolated unit tests
├── integration/        # Real database integration tests
├── benchmarks/         # Performance benchmarks
├── load/              # Load testing scenarios
└── helpers/           # Test utilities and data generators
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- integration/
npm test -- benchmarks/
npm test -- load/

# Run with coverage
npm run test:coverage

# Run benchmarks
npm run bench

# Run load tests
npx tsx src/lib/database/__tests__/load/loadTesting.ts mixed 10 60 10
# Arguments: scenario concurrent duration rampUp
```

### Test Data Generation

```typescript
import { seedTestData, generateSongs } from '@lib/database/__tests__/helpers/testData'

// Generate comprehensive test data
const testData = await seedTestData({
  songCount: 50,
  arrangementCount: 100,
  userCount: 10,
  includeRoles: true,
  includePermissions: true
})

// Generate specific data types
const songs = generateSongs(20)
const chordData = generateChordData('complex')
```

## Common Patterns

### Public Content Access

```typescript
// Anonymous users see only public, approved content
const publicContent = await new QueryBuilder(supabase, 'songs')
  .select('*')
  .withVisibility({ 
    userId: undefined, 
    roles: [], 
    canModerate: false,
    canAdmin: false 
  })
  .eq('is_public', true)
  .neq('moderation_status', 'rejected')
  .execute()
```

### Authenticated User Queries

```typescript
// Users see public content plus their own
const userContent = await new QueryBuilder(supabase, 'arrangements')
  .select('*')
  .withVisibility({ 
    userId: currentUser.id, 
    roles: ['user'], 
    canModerate: false,
    canAdmin: false 
  })
  .orderBy('created_at', 'desc')
  .paginate({ page: 1, limit: 20 })
  .execute()
```

### Moderator Operations

```typescript
// Moderators can see and manage all content
const pendingContent = await new QueryBuilder(supabase, 'songs')
  .select('*, created_by, moderated_by')
  .withVisibility({ 
    userId: moderator.id, 
    roles: ['moderator'], 
    canModerate: true,
    canAdmin: false 
  })
  .eq('moderation_status', 'pending')
  .orderBy('created_at', 'asc')
  .execute()

// Approve content
await new QueryBuilder(supabase, 'songs')
  .update({ 
    moderation_status: 'approved',
    moderated_by: moderator.id,
    moderated_at: new Date().toISOString()
  })
  .eq('id', songId)
  .execute()
```

### Search Implementation

```typescript
// Multi-field search with filters
const searchResults = await new QueryBuilder(supabase, 'songs')
  .select('*')
  .withVisibility(userPermissions)
  .textSearch('title,artist', searchQuery, {
    type: 'websearch',
    config: 'english'
  })
  .in('themes', selectedThemes)
  .orderBy('_relevance', 'desc')  // Order by search relevance
  .paginate({ page: 1, limit: 20 })
  .execute()
```

### Batch Operations

```typescript
// Insert multiple records
const songs = [
  { title: 'Song 1', artist: 'Artist 1' },
  { title: 'Song 2', artist: 'Artist 2' },
]

const { data, error } = await new QueryBuilder(supabase, 'songs')
  .insert(songs)
  .execute()

// Update multiple records
await new QueryBuilder(supabase, 'arrangements')
  .update({ is_public: false })
  .eq('created_by', userId)
  .execute()
```

## Troubleshooting

### Common Issues and Solutions

#### Slow Queries

**Symptoms**: Queries taking > 1 second

**Diagnosis**:
```typescript
// Check query performance
const monitor = new PerformanceMonitor()
const slowQueries = monitor.getSlowQueries(10)

// Analyze query plan
const explain = await supabase.rpc('explain_query', {
  query: 'SELECT * FROM songs WHERE title ILIKE $1',
  params: ['%worship%']
})
```

**Solutions**:
1. Add appropriate indexes
2. Use query caching
3. Optimize filter conditions
4. Reduce result set size

#### High Memory Usage

**Symptoms**: Memory usage > 100MB

**Diagnosis**:
```typescript
const cacheStats = optimizer.getCacheStats()
console.log('Cache memory:', cacheStats.memoryUsage)
console.log('Cache size:', cacheStats.size)
```

**Solutions**:
1. Reduce cache size
2. Lower TTL values
3. Stream large results
4. Implement pagination

#### Connection Pool Exhaustion

**Symptoms**: "Too many connections" errors

**Diagnosis**:
```typescript
const connStats = connectionMonitor.getStats()
console.log('Active connections:', connStats.activeConnections)
console.log('Utilization:', connStats.utilizationRate)
```

**Solutions**:
1. Increase pool size
2. Reduce connection hold time
3. Implement connection queuing
4. Use read replicas

### Debug Logging

Enable detailed logging for troubleshooting:

```typescript
// Enable query logging
const qb = new QueryBuilder(supabase, 'songs', { debug: true })

// Monitor all queries
const monitor = new PerformanceMonitor({}, {
  onSlowQuery: (metrics) => {
    console.warn('Slow query detected:', metrics)
  },
  onCriticalQuery: (metrics) => {
    console.error('Critical query alert:', metrics)
  }
})
```

## Performance Tuning

### Database Indexes

Essential indexes for optimal performance:

```sql
-- Text search indexes
CREATE INDEX idx_songs_title_trgm ON songs USING gin(title gin_trgm_ops);
CREATE INDEX idx_songs_artist_trgm ON songs USING gin(artist gin_trgm_ops);

-- Full-text search indexes
CREATE INDEX idx_songs_fts ON songs USING gin(
  to_tsvector('english', title || ' ' || artist)
);

-- Visibility filter indexes
CREATE INDEX idx_songs_visibility ON songs(is_public, moderation_status, created_by);
CREATE INDEX idx_arrangements_visibility ON arrangements(is_public, moderation_status, created_by);

-- Foreign key indexes
CREATE INDEX idx_arrangements_song_id ON arrangements(song_id);
CREATE INDEX idx_setlist_items_setlist_id ON setlist_items(setlist_id);
CREATE INDEX idx_setlist_items_arrangement_id ON setlist_items(arrangement_id);

-- Sorting indexes
CREATE INDEX idx_songs_created_at ON songs(created_at DESC);
CREATE INDEX idx_arrangements_rating ON arrangements(rating_average DESC NULLS LAST);
```

### Query Optimization Checklist

1. **Use appropriate indexes**
   - Check EXPLAIN ANALYZE output
   - Ensure indexes match WHERE clauses
   - Consider composite indexes for multi-column filters

2. **Optimize SELECT clauses**
   - Select only needed columns
   - Avoid SELECT * in production
   - Use aggregations server-side

3. **Efficient filtering**
   - Use indexed columns in WHERE clauses
   - Avoid functions on indexed columns
   - Use EXISTS instead of IN for large sets

4. **Smart pagination**
   - Use cursor-based pagination for large datasets
   - Implement result streaming
   - Cache pagination metadata

5. **Connection management**
   - Use connection pooling
   - Separate read/write connections
   - Implement circuit breakers

### Cache Configuration

Optimal cache settings by environment:

```typescript
// Development
const devCache = new QueryCache({
  maxSize: 50,
  ttl: 10000,  // 10 seconds
  maxMemory: 10 * 1024 * 1024  // 10MB
})

// Production
const prodCache = new QueryCache({
  maxSize: 200,
  ttl: 30000,  // 30 seconds
  maxMemory: 100 * 1024 * 1024  // 100MB
})

// High-traffic
const highTrafficCache = new QueryCache({
  maxSize: 500,
  ttl: 60000,  // 1 minute
  maxMemory: 500 * 1024 * 1024  // 500MB
})
```

## Monitoring and Metrics

### Key Metrics to Track

```typescript
// Setup comprehensive monitoring
const perfMonitor = new PerformanceMonitor({
  slowQueryTime: 1000,      // 1 second
  criticalQueryTime: 5000,  // 5 seconds
}, {
  onSlowQuery: async (metrics) => {
    // Log to monitoring service
    await logger.warn('Slow query', metrics)
  },
  onCriticalQuery: async (metrics) => {
    // Alert on-call
    await alerting.critical('Critical query', metrics)
  },
  onHighErrorRate: async (rate) => {
    // Trigger investigation
    await alerting.warn('High error rate', { rate })
  }
})

// Get current metrics
const stats = perfMonitor.getStats(60)  // Last 60 minutes
console.log({
  totalQueries: stats.totalQueries,
  errorRate: stats.errorRate,
  avgDuration: stats.avgDuration,
  p95Duration: stats.p95Duration,
  slowQueries: stats.slowQueries
})
```

### Dashboard Configuration

Key metrics for monitoring dashboards:

1. **Query Performance**
   - Average response time
   - P50, P95, P99 latencies
   - Slow query count
   - Query volume by table

2. **Error Tracking**
   - Error rate by operation
   - Error distribution
   - Failed query patterns

3. **Cache Performance**
   - Hit rate
   - Memory usage
   - Eviction rate
   - Cache size

4. **Connection Health**
   - Active connections
   - Connection wait time
   - Pool utilization
   - Connection errors

### Alert Thresholds

Recommended alert configurations:

```yaml
alerts:
  # Performance
  slow_query:
    threshold: 1000ms
    window: 5m
    severity: warning
    
  critical_query:
    threshold: 5000ms
    window: 1m
    severity: critical
    
  # Errors
  high_error_rate:
    threshold: 1%
    window: 5m
    severity: warning
    
  critical_error_rate:
    threshold: 5%
    window: 1m
    severity: critical
    
  # Resources
  high_memory:
    threshold: 80%
    window: 5m
    severity: warning
    
  connection_exhaustion:
    threshold: 90%
    window: 1m
    severity: critical
```

### Performance Reports

Generate performance reports:

```typescript
// Export metrics for analysis
const metrics = perfMonitor.exportMetrics('csv')
fs.writeFileSync('performance-report.csv', metrics)

// Generate summary report
const report = {
  timestamp: new Date().toISOString(),
  stats: perfMonitor.getStats(1440),  // 24 hours
  slowQueries: perfMonitor.getSlowQueries(20),
  failedQueries: perfMonitor.getFailedQueries(20),
  cacheStats: optimizer.getCacheStats(),
  connectionStats: connectionMonitor.getStats()
}

console.log('Performance Report:', JSON.stringify(report, null, 2))
```

## Best Practices

1. **Always use TypeScript types**
2. **Apply visibility filters for security**
3. **Implement proper error handling**
4. **Use caching for read-heavy operations**
5. **Monitor and alert on performance issues**
6. **Test with realistic data volumes**
7. **Document complex queries**
8. **Regular performance audits**
9. **Keep dependencies updated**
10. **Follow security best practices**

## Migration Guide

When updating from older patterns:

1. Replace direct Supabase calls with QueryBuilder
2. Add visibility filters to all queries
3. Implement caching for frequently accessed data
4. Add performance monitoring
5. Update tests to use new patterns

## Support and Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- Internal Slack: #hsa-songbook-dev
- Monitoring Dashboard: [Internal URL]

---

*Last updated: 2024*