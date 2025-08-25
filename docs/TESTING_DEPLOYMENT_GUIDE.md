# Testing & Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying and validating the testing & optimization framework implemented in Phase 2.4.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Access to Supabase project (production and test instances)
- [ ] Environment variables configured (`.env.local` and `.env.test`)
- [ ] Docker installed (for local Supabase testing)

## Environment Setup

### 1. Configure Test Database

```bash
# Create .env.test file with test database credentials
cat > .env.test << EOF
VITE_SUPABASE_URL=https://your-test-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-test-anon-key
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres
EOF

# Start local Supabase for integration testing
npx supabase start
```

### 2. Install Dependencies

```bash
# Install all dependencies including dev dependencies
npm install

# Verify test dependencies are installed
npm ls @faker-js/faker vitest @testing-library/react
```

## Testing Validation Steps

### Step 1: Run Unit Tests

These tests don't require database connection and should pass immediately:

```bash
# Run existing unit tests
npm test -- --run src/lib/database/__tests__/*.test.ts

# Expected output: All tests passing
# Files: queryBuilder.test.ts, errors.test.ts, paginationHelper.test.ts, visibilityFilter.test.ts
```

### Step 2: Run Integration Tests

These require a test database connection:

```bash
# Set up test database with migrations
npx supabase db push --db-url $DATABASE_URL

# Seed test data
npm run seed:test

# Run integration tests
npm test -- --run src/lib/database/__tests__/integration/

# Expected output: All scenarios tested
# - Public access scenarios
# - Authenticated access scenarios  
# - Moderator access scenarios
# - Admin access scenarios
```

### Step 3: Run Performance Benchmarks

```bash
# Run benchmarks with small dataset first
npm run bench -- src/lib/database/__tests__/benchmarks/queryPerformance.bench.ts

# Expected metrics:
# - Simple select: < 50ms
# - Complex filter: < 200ms
# - Joined query: < 500ms
# - Full-text search: < 300ms
```

### Step 4: Execute Load Tests

Run progressively more intensive load tests:

```bash
# 1. Light load test (5 users, 30 seconds)
npx tsx src/lib/database/__tests__/load/loadTesting.ts readHeavy 5 30 5

# 2. Medium load test (10 users, 60 seconds)
npx tsx src/lib/database/__tests__/load/loadTesting.ts mixed 10 60 10

# 3. Stress test (25 users, 120 seconds)
npx tsx src/lib/database/__tests__/load/loadTesting.ts stress 25 120 15

# Success criteria:
# - Error rate < 1%
# - P95 latency < 1000ms
# - No connection pool exhaustion
```

## Production Deployment

### Step 1: Deploy Code Changes

```bash
# 1. Run pre-deployment checks
npm run lint
npm run build
npm test

# 2. Create deployment branch
git checkout -b deploy/phase-2.4-testing-optimization
git add .
git commit -m "feat: add comprehensive testing and optimization framework"

# 3. Push to staging
git push origin deploy/phase-2.4-testing-optimization

# 4. Deploy to staging environment
npm run deploy:staging
```

### Step 2: Enable Performance Monitoring

1. **Deploy monitoring configuration:**

```bash
# Copy monitoring config to deployment
cp monitoring/dashboard.yml deploy/

# Update environment variables
export SLACK_WEBHOOK_URL="your-webhook-url"
export PAGERDUTY_KEY="your-pagerduty-key"
export ELASTICSEARCH_URL="your-elasticsearch-url"

# Deploy monitoring stack
kubectl apply -f deploy/monitoring/
```

2. **Verify monitoring is active:**

```bash
# Check metrics endpoint
curl https://your-app.com/metrics

# Verify dashboard access
open https://your-monitoring-dashboard.com
```

### Step 3: Configure Caching

```typescript
// In your application initialization (src/app/main.tsx or similar)
import { QueryCache, QueryOptimizer } from '@lib/database/optimizations/queryCache'
import { PerformanceMonitor } from '@lib/database/monitoring/performanceMonitor'

// Initialize cache with production settings
const cache = new QueryCache({
  maxSize: 200,
  ttl: 30000,  // 30 seconds
  maxMemory: 100 * 1024 * 1024  // 100MB
})

// Initialize performance monitoring
const monitor = new PerformanceMonitor({
  slowQueryTime: 1000,
  criticalQueryTime: 5000
}, {
  onSlowQuery: (metrics) => {
    console.warn('Slow query detected:', metrics)
    // Send to monitoring service
  },
  onCriticalQuery: (metrics) => {
    console.error('Critical query alert:', metrics)
    // Page on-call team
  }
})

// Apply to QueryBuilder globally
window.__queryCache = cache
window.__perfMonitor = monitor
```

### Step 4: Database Optimizations

Run these SQL commands in production (during maintenance window):

```sql
-- 1. Create missing indexes (if not already present)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_visibility 
  ON songs(is_public, moderation_status, created_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrangements_visibility 
  ON arrangements(is_public, moderation_status, created_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_fts 
  ON songs USING gin(to_tsvector('english', title || ' ' || artist));

-- 2. Update table statistics
ANALYZE songs;
ANALYZE arrangements;
ANALYZE setlists;
ANALYZE setlist_items;

-- 3. Configure connection pool
ALTER SYSTEM SET max_connections = 150;
ALTER SYSTEM SET shared_buffers = '256MB';
SELECT pg_reload_conf();
```

## Validation Checklist

### Post-Deployment Validation

- [ ] **Level 1: Syntax & Build**
  ```bash
  npm run lint && npm run build
  # No errors
  ```

- [ ] **Level 2: Unit Tests**
  ```bash
  npm test -- --run
  # All unit tests passing
  ```

- [ ] **Level 3: Integration Tests** 
  ```bash
  npm test -- --run integration/
  # All integration scenarios passing
  ```

- [ ] **Level 4: Performance Benchmarks**
  ```bash
  npm run bench
  # P95 < 500ms achieved
  ```

- [ ] **Level 5: Load Testing**
  ```bash
  npm run test:load
  # Handles 100 concurrent users
  ```

- [ ] **Level 6: Production Metrics**
  - Cache hit rate > 60%
  - Error rate < 0.1%
  - P95 latency < 500ms
  - No alert triggers in first 24 hours

## Rollback Procedure

If issues arise after deployment:

```bash
# 1. Immediate rollback
kubectl rollout undo deployment/songbook-api

# 2. Disable new features
export FEATURE_QUERY_CACHE=false
export FEATURE_PERF_MONITORING=false

# 3. Clear corrupted cache
redis-cli FLUSHALL

# 4. Restore previous monitoring config
kubectl apply -f deploy/monitoring/previous/

# 5. Document issues
echo "Rollback performed at $(date)" >> incidents.log
```

## Monitoring Dashboard Access

After deployment, access these dashboards:

1. **Performance Dashboard**: `https://your-app.com/admin/performance`
2. **Query Analytics**: `https://your-app.com/admin/queries`
3. **Cache Statistics**: `https://your-app.com/admin/cache`
4. **Health Status**: `https://your-app.com/health`

## Support Contacts

- **On-Call Engineer**: Check PagerDuty rotation
- **Database Team**: #db-team slack channel
- **Performance Team**: #performance slack channel
- **Documentation**: This guide + [DATA_LAYER_GUIDE.md](./DATA_LAYER_GUIDE.md) + [MAINTENANCE_RUNBOOK.md](./MAINTENANCE_RUNBOOK.md)

## Troubleshooting

### Common Issues During Deployment

1. **Integration tests fail with "connection refused"**
   - Ensure Supabase is running: `npx supabase status`
   - Check DATABASE_URL in .env.test
   - Verify migrations: `npx supabase db push`

2. **Benchmarks show regression**
   - Check for missing indexes: `npm run check:indexes`
   - Analyze slow queries: `npm run analyze:queries`
   - Review recent code changes

3. **Load tests timeout**
   - Increase connection pool size
   - Check for N+1 queries
   - Enable query batching

4. **Cache memory overflow in production**
   - Reduce cache TTL
   - Implement more aggressive eviction
   - Monitor memory usage trends

## Success Metrics

After successful deployment, you should see:

- ✅ 30% reduction in P95 query latency
- ✅ 60%+ cache hit rate for read operations  
- ✅ 100+ concurrent users supported
- ✅ < 0.1% error rate maintained
- ✅ Zero critical alerts in first week
- ✅ Positive user feedback on performance

---

*Last Updated: 2024*
*Version: 1.0*