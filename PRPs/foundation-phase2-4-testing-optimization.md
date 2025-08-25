name: "Foundation Phase 2.4: Testing & Optimization"
description: "Comprehensive testing, performance optimization, and documentation for the data layer stability improvements"

---

## Goal

**Feature Goal**: Validate, optimize, and document the complete data layer implementation with comprehensive testing and performance benchmarking

**Deliverable**: Integration tests, performance benchmarks, optimization implementations, and complete documentation ensuring production readiness

**Success Definition**: 100% test coverage for critical paths, p95 query time < 500ms, zero regression bugs, complete documentation for maintenance

## User Persona

**Target User**: HSA Songbook end users and development team

**Use Case**: Ensuring the data layer improvements are reliable, performant, and maintainable for long-term success

**User Journey**: 
1. Users experience fast, reliable data operations
2. Developers have confidence in code changes via comprehensive tests
3. Operations team can monitor and optimize performance
4. New team members can understand and maintain the system

**Pain Points Addressed**: 
- Uncertainty about code changes breaking functionality
- Slow queries affecting user experience (current p99: 2.3s)
- Lack of visibility into performance issues
- Missing documentation for troubleshooting

## Why

- **Quality Assurance**: Comprehensive tests prevent regression bugs
- **Performance**: Optimizations reduce query latency by 30%
- **Confidence**: Test coverage enables safe refactoring
- **Maintainability**: Documentation ensures long-term sustainability
- **Observability**: Monitoring catches issues before users report them

## What

Implement comprehensive testing and optimization:
- Integration tests for all query patterns
- Performance benchmarking suite
- Query optimization based on metrics
- Complete documentation package
- Monitoring and alerting setup

### Success Criteria

- [ ] Integration tests cover all user scenarios
- [ ] Performance benchmarks show 30% improvement
- [ ] Query optimization reduces p95 to < 500ms
- [ ] Documentation complete for all components
- [ ] Zero regression bugs in production

## All Needed Context

### Context Completeness Check

_This PRP provides complete testing patterns, benchmarking tools, optimization techniques, and documentation templates for production readiness._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: vitest.config.ts
  why: Test configuration and setup
  pattern: Test environment configuration
  gotcha: Uses jsdom environment for React components

- file: src/shared/test-utils/setup.ts
  why: Test setup and mock patterns
  pattern: Supabase mock implementation
  gotcha: Must mock all chained methods

- file: src/shared/test-utils/render.tsx
  why: React testing utilities
  pattern: Custom render with providers
  gotcha: Includes QueryClient and Router setup

- file: src/features/songs/validation/schemas/__tests__/arrangementSchema.test.ts
  why: Example of comprehensive schema testing
  pattern: Nested describe blocks, edge cases
  gotcha: Tests both valid and invalid scenarios

- file: PRPs/ai_docs/vitest-mocking-best-practices.md
  why: Testing best practices documentation
  section: Mock strategies and patterns

- file: claude_md_files/TESTING_ARCHITECTURE.md
  why: Overall testing strategy
  pattern: Test pyramid approach
  gotcha: Balance between test types

- url: https://vitest.dev/guide/features#benchmarking
  why: Vitest benchmarking features
  critical: Performance testing setup

- url: https://supabase.com/docs/guides/database/query-optimization
  why: Query optimization techniques
  critical: EXPLAIN ANALYZE usage
```

### Current Testing Infrastructure

```yaml
test_framework:
  runner: Vitest 3.2.4
  environment: jsdom
  coverage: V8
  
test_utilities:
  - "@testing-library/react": Component testing
  - "@testing-library/user-event": User interactions
  - "msw": API mocking
  - "@faker-js/faker": Test data generation
  
test_patterns:
  - Unit tests for utilities
  - Integration tests for services
  - Component tests for UI
  - E2E tests for critical paths
```

### Performance Baseline Metrics

```yaml
current_metrics:
  p50: 234ms
  p95: 876ms
  p99: 2.3s
  
target_metrics:
  p50: < 200ms
  p95: < 500ms
  p99: < 1s
  
slow_queries:
  - Full text search without index
  - Arrangements with multiple joins
  - Large setlist operations
```

### Known Testing & Performance Gotchas

```typescript
// CRITICAL: Mock Supabase responses must match exact shape
// Include both data and error properties

// CRITICAL: Performance tests need warm-up runs
// First query often slower due to connection setup

// CRITICAL: Integration tests need proper cleanup
// Reset database state between tests

// CRITICAL: Benchmarks should test realistic data volumes
// Use production-like data sizes

// CRITICAL: Document flaky tests with retry strategies
// Network-dependent tests may need retries
```

## Implementation Blueprint

### Integration Test Structure

```typescript
// src/lib/database/__tests__/integration/queryBuilder.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { QueryBuilder } from '@lib/database'
import { createTestClient, seedTestData, cleanupTestData } from '../helpers'

describe('QueryBuilder Integration Tests', () => {
  let testClient: any
  let testUserId: string
  
  beforeAll(async () => {
    testClient = await createTestClient()
    const { userId } = await seedTestData()
    testUserId = userId
  })
  
  afterAll(async () => {
    await cleanupTestData()
  })
  
  describe('Public Access Scenarios', () => {
    it('should return only public approved content for anonymous users', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'arrangements')
      const result = await queryBuilder
        .select('*')
        .withVisibility({ 
          userId: undefined, 
          roles: [], 
          canModerate: false,
          canAdmin: false 
        })
        .execute()
      
      expect(result.data).toBeDefined()
      expect(result.data.every(a => 
        a.is_public === true && 
        (!a.moderation_status || ['approved', 'pending'].includes(a.moderation_status))
      )).toBe(true)
    })
  })
  
  describe('Authenticated Access Scenarios', () => {
    it('should return public content plus own content for authenticated users', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'arrangements')
      const result = await queryBuilder
        .select('*')
        .withVisibility({ 
          userId: testUserId, 
          roles: ['user'], 
          canModerate: false,
          canAdmin: false 
        })
        .execute()
      
      const ownContent = result.data.filter(a => a.created_by === testUserId)
      const publicContent = result.data.filter(a => a.is_public === true)
      
      expect(ownContent.length).toBeGreaterThan(0)
      expect(publicContent.length).toBeGreaterThan(0)
    })
  })
  
  describe('Moderator Access Scenarios', () => {
    it('should return all content for moderators', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'arrangements')
      const result = await queryBuilder
        .select('*')
        .withVisibility({ 
          userId: testUserId, 
          roles: ['moderator'], 
          canModerate: true,
          canAdmin: false 
        })
        .execute()
      
      // Should include private and rejected content
      const privateContent = result.data.filter(a => !a.is_public)
      const rejectedContent = result.data.filter(a => a.moderation_status === 'rejected')
      
      expect(privateContent.length).toBeGreaterThan(0)
      expect(rejectedContent.length).toBeGreaterThan(0)
    })
  })
})
```

### Performance Benchmark Suite

```typescript
// src/lib/database/__tests__/benchmarks/queryPerformance.bench.ts
import { bench, describe } from 'vitest'
import { QueryBuilder } from '@lib/database'
import { setupBenchmarkData } from '../helpers'

describe('Query Performance Benchmarks', async () => {
  const { client, largeDataset } = await setupBenchmarkData()
  
  bench('Simple select query', async () => {
    await new QueryBuilder(client, 'songs')
      .select('id, title, artist')
      .limit(20)
      .execute()
  })
  
  bench('Complex filtered query', async () => {
    await new QueryBuilder(client, 'songs')
      .select('*')
      .withVisibility({ userId: 'test', canModerate: false, roles: [], canAdmin: false })
      .ilike('title', '%worship%')
      .in('themes', ['praise', 'worship'])
      .paginate({ page: 1, limit: 20 })
      .execute()
  })
  
  bench('Joined query with relations', async () => {
    await new QueryBuilder(client, 'arrangements')
      .select('*, songs(*)')
      .withVisibility({ userId: 'test', canModerate: false, roles: [], canAdmin: false })
      .orderBy('created_at', 'desc')
      .limit(50)
      .execute()
  })
  
  bench('Full text search', async () => {
    await client
      .from('songs')
      .select('*')
      .textSearch('title,artist', 'amazing grace', {
        type: 'websearch',
        config: 'english'
      })
      .limit(10)
  })
}, {
  time: 10000,  // Run for 10 seconds
  iterations: 100,  // Minimum iterations
  warmupIterations: 5,  // Warm-up runs
})
```

### Query Optimization Implementations

```typescript
// src/lib/database/optimizations/queryCache.ts
interface CacheEntry<T> {
  data: T
  timestamp: number
  hits: number
}

export class QueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly maxSize = 100
  private readonly ttl = 30000  // 30 seconds
  
  generateKey(table: string, filters: any): string {
    return `${table}:${JSON.stringify(filters)}`
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    entry.hits++
    return entry.data as T
  }
  
  set<T>(key: string, data: T): void {
    // LRU eviction if cache full
    if (this.cache.size >= this.maxSize) {
      const lru = [...this.cache.entries()]
        .sort((a, b) => a[1].hits - b[1].hits)[0]
      this.cache.delete(lru[0])
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    })
  }
  
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

// Query optimization strategies
export class QueryOptimizer {
  // Batch similar queries
  async batchQueries<T>(
    queries: Array<() => Promise<T>>
  ): Promise<T[]> {
    // Group by table and operation
    const batched = new Map<string, Array<() => Promise<T>>>()
    
    // Execute batches in parallel
    const results = await Promise.all(
      Array.from(batched.values()).map(batch => 
        Promise.all(batch.map(q => q()))
      )
    )
    
    return results.flat()
  }
  
  // Connection pooling
  getOptimalConnection(queryType: 'read' | 'write') {
    // Use read replica for read queries
    // Use primary for write queries
    return queryType === 'read' ? this.readReplica : this.primary
  }
  
  // Query result streaming for large datasets
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
      
      yield result.data
      
      hasMore = result.pagination?.hasNext ?? false
      page++
    }
  }
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
task_1:
  name: "Create test data generators"
  requirements: |
    - Create src/lib/database/__tests__/helpers/testData.ts
    - Use @faker-js/faker for realistic data
    - Generate songs, arrangements, users with roles
    - Create seedTestData() and cleanupTestData() functions
    - Support different data volumes for benchmarks
  validation: "Test data generators create valid database records"

task_2:
  name: "Implement integration test suite"
  requirements: |
    - Create integration test files for each scenario
    - Test public, authenticated, moderator access patterns
    - Test pagination, filtering, sorting
    - Test error scenarios and edge cases
    - Use real Supabase client (test instance)
  validation: "npm test -- integration/ passes all tests"

task_3:
  name: "Create performance benchmark suite"
  requirements: |
    - Setup Vitest bench configuration
    - Create benchmarks for common query patterns
    - Test with realistic data volumes (1000+ records)
    - Include warm-up iterations
    - Generate performance report
  validation: "npm run bench shows performance metrics"

task_4:
  name: "Implement query optimizations"
  requirements: |
    - Create QueryCache class with LRU eviction
    - Implement query batching for similar operations
    - Add query result streaming for large datasets
    - Optimize N+1 query patterns
    - Add database connection pooling
  validation: "Benchmarks show 30% improvement"

task_5:
  name: "Add performance monitoring"
  requirements: |
    - Create performance monitoring middleware
    - Log slow queries (> 1s)
    - Track cache hit rates
    - Monitor connection pool usage
    - Add performance dashboards
  validation: "Monitoring captures all query metrics"

task_6:
  name: "Create load testing scenarios"
  requirements: |
    - Use k6 or similar for load testing
    - Test concurrent user scenarios
    - Simulate traffic spikes
    - Test database connection limits
    - Document breaking points
  validation: "Load tests complete without errors at 100 concurrent users"

task_7:
  name: "Write comprehensive documentation"
  requirements: |
    - Create docs/DATA_LAYER_GUIDE.md
    - Document QueryBuilder API with examples
    - Add troubleshooting guide
    - Create performance tuning guide
    - Include architecture diagrams
  validation: "Documentation reviewed and complete"

task_8:
  name: "Setup monitoring and alerts"
  requirements: |
    - Configure error tracking (Sentry integration)
    - Setup performance monitoring
    - Create alerts for slow queries
    - Monitor database connection health
    - Add custom metrics dashboards
  validation: "Monitoring dashboard shows all metrics"

task_9:
  name: "Create maintenance runbook"
  requirements: |
    - Document common issues and solutions
    - Create query optimization checklist
    - Add database maintenance procedures
    - Include rollback procedures
    - Create incident response guide
  validation: "Runbook covers all operational scenarios"
```

## Testing Requirements

### Test Coverage Requirements

```yaml
coverage_targets:
  statements: 90%
  branches: 85%
  functions: 90%
  lines: 90%
  
critical_paths:  # 100% coverage required
  - QueryBuilder core methods
  - VisibilityFilter logic
  - Error handling
  - Cache operations
```

### Test Categories

```typescript
// 1. Unit Tests - Fast, isolated
describe('QueryBuilder Unit Tests', () => {
  // Test individual methods
  // Mock all dependencies
  // Focus on logic correctness
})

// 2. Integration Tests - Real database
describe('QueryBuilder Integration Tests', () => {
  // Test with real Supabase
  // Verify data persistence
  // Test transaction boundaries
})

// 3. Performance Tests - Benchmarks
describe('Query Performance Benchmarks', () => {
  // Measure execution time
  // Test with large datasets
  // Compare before/after optimization
})

// 4. Load Tests - Concurrent users
describe('Load Testing Scenarios', () => {
  // Simulate multiple users
  // Test connection pooling
  // Find breaking points
})

// 5. E2E Tests - User workflows
describe('End-to-End User Workflows', () => {
  // Test complete user journeys
  // Verify UI updates correctly
  // Test error recovery
})
```

### Performance Testing Queries

```sql
-- Baseline queries to optimize
-- 1. Complex visibility filter
SELECT * FROM arrangements
WHERE (is_public = true AND moderation_status != 'rejected')
   OR created_by = 'user-id';

-- 2. Full-text search
SELECT * FROM songs
WHERE to_tsvector('english', title || ' ' || artist) 
  @@ to_tsquery('english', 'amazing & grace');

-- 3. Joined query with aggregates
SELECT s.*, 
       COUNT(a.id) as arrangement_count,
       ARRAY_AGG(a.name) as arrangement_names
FROM songs s
LEFT JOIN arrangements a ON s.id = a.song_id
GROUP BY s.id
ORDER BY arrangement_count DESC
LIMIT 20;

-- 4. Pagination with filtering
SELECT * FROM songs
WHERE themes && ARRAY['worship', 'praise']
ORDER BY created_at DESC
LIMIT 20 OFFSET 40;
```

## Validation Gates

### Level 1: Unit Tests
```bash
npm test -- unit/
# All unit tests pass
# Coverage > 90%
```

### Level 2: Integration Tests
```bash
npm test -- integration/
# All integration tests pass
# No flaky tests
```

### Level 3: Performance Benchmarks
```bash
npm run bench
# p95 < 500ms
# No regression from baseline
```

### Level 4: Load Testing
```bash
npm run test:load
# Handles 100 concurrent users
# No connection pool exhaustion
```

### Level 5: Production Validation
```bash
# Deploy to staging
# Run smoke tests
# Monitor for 24 hours
# Check error rates
```

## Documentation Structure

### docs/DATA_LAYER_GUIDE.md
```markdown
# Data Layer Guide

## Architecture Overview
- QueryBuilder pattern
- Caching strategy
- Performance optimizations

## API Reference
- QueryBuilder methods
- VisibilityFilter usage
- Error handling

## Common Patterns
- Public access queries
- Authenticated queries
- Admin operations

## Troubleshooting
- Slow query debugging
- Cache issues
- Connection problems

## Performance Tuning
- Index optimization
- Query optimization
- Cache configuration
```

### Monitoring Dashboard Configuration

```yaml
# monitoring/dashboard.yml
metrics:
  - query_execution_time:
      p50: < 200ms
      p95: < 500ms
      p99: < 1s
  
  - cache_hit_rate:
      target: > 60%
      
  - error_rate:
      target: < 0.1%
      
  - concurrent_connections:
      max: 100
      warning: 80
      
alerts:
  - slow_query:
      threshold: 1000ms
      action: log_and_notify
      
  - high_error_rate:
      threshold: 1%
      window: 5m
      action: page_on_call
      
  - connection_pool_exhausted:
      action: scale_up
```

## Performance Optimization Strategies

### 1. Query Optimization
- Add missing indexes
- Optimize complex WHERE clauses
- Use materialized views for aggregates
- Implement query result caching

### 2. Caching Strategy
- Cache frequently accessed data
- Implement cache warming
- Use cache invalidation patterns
- Monitor cache effectiveness

### 3. Database Tuning
- Optimize connection pool size
- Use read replicas for read queries
- Implement query timeout limits
- Regular VACUUM and ANALYZE

### 4. Application Optimization
- Batch similar queries
- Implement data loader pattern
- Use cursor-based pagination
- Stream large result sets

## Final Validation Checklist

- [ ] All integration tests passing
- [ ] Performance benchmarks meet targets
- [ ] Load tests successful at expected volume
- [ ] Documentation complete and reviewed
- [ ] Monitoring configured and tested
- [ ] Error tracking integrated
- [ ] Performance dashboard operational
- [ ] Runbook created and validated
- [ ] Team trained on new patterns
- [ ] Production deployment successful