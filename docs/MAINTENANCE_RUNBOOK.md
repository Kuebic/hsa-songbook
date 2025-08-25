# Maintenance Runbook

## Table of Contents

1. [Emergency Procedures](#emergency-procedures)
2. [Common Issues and Solutions](#common-issues-and-solutions)
3. [Performance Optimization Procedures](#performance-optimization-procedures)
4. [Database Maintenance](#database-maintenance)
5. [Monitoring and Alerts](#monitoring-and-alerts)
6. [Rollback Procedures](#rollback-procedures)
7. [Incident Response](#incident-response)
8. [Routine Maintenance Tasks](#routine-maintenance-tasks)

## Emergency Procedures

### 🔴 Critical: Database Connection Exhaustion

**Symptoms:**
- Error: "Too many connections"
- Connection pool utilization > 95%
- Application timeouts

**Immediate Actions:**
```bash
# 1. Check current connections
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
  SELECT count(*) as total,
         state,
         wait_event_type
  FROM pg_stat_activity
  GROUP BY state, wait_event_type
  ORDER BY count(*) DESC;"

# 2. Kill idle connections
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
    AND state_change < current_timestamp - interval '10 minutes';"

# 3. Increase connection limit (temporary)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
  ALTER SYSTEM SET max_connections = 200;"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
  SELECT pg_reload_conf();"

# 4. Restart application with reduced pool size
npm run restart:emergency
```

**Root Cause Analysis:**
1. Check for connection leaks in application logs
2. Review recent deployments
3. Analyze query patterns for long-running transactions
4. Check for DDoS or unusual traffic patterns

### 🔴 Critical: High Error Rate (>5%)

**Symptoms:**
- Error rate alerts firing
- User complaints about failures
- Degraded application performance

**Immediate Actions:**
```typescript
// 1. Enable circuit breaker
import { circuitBreaker } from '@lib/database/resilience'
circuitBreaker.enable()

// 2. Check error types
const errors = performanceMonitor.getFailedQueries(50)
console.log('Recent errors:', errors)

// 3. Fallback to cache-only mode
queryOptimizer.setCacheOnlyMode(true)

// 4. Scale read replicas
await scaleReadReplicas(3)
```

**Recovery Steps:**
1. Identify error patterns
2. Fix root cause
3. Gradually restore normal operations
4. Monitor recovery metrics

### 🔴 Critical: Performance Degradation

**Symptoms:**
- P95 latency > 5 seconds
- Slow query alerts
- User reports of slowness

**Immediate Actions:**
```sql
-- 1. Identify slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 2. Check for table bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_dead_tup,
  n_live_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > 10000
ORDER BY n_dead_tup DESC;

-- 3. Emergency vacuum
VACUUM ANALYZE songs;
VACUUM ANALYZE arrangements;

-- 4. Reset query planner statistics
ANALYZE;
```

## Common Issues and Solutions

### Issue: Slow Full-Text Search

**Diagnosis:**
```sql
EXPLAIN ANALYZE
SELECT * FROM songs
WHERE to_tsvector('english', title || ' ' || artist) 
  @@ to_tsquery('english', 'worship & praise');
```

**Solution:**
```sql
-- Create GIN index if missing
CREATE INDEX CONCURRENTLY idx_songs_fts 
ON songs USING gin(to_tsvector('english', title || ' ' || artist));

-- Update statistics
ANALYZE songs;

-- Consider using simpler search
CREATE INDEX idx_songs_title_trgm ON songs USING gin(title gin_trgm_ops);
```

### Issue: Cache Memory Overflow

**Diagnosis:**
```typescript
const stats = queryCache.getStats()
console.log('Cache memory:', stats.memoryUsage)
console.log('Cache entries:', stats.size)
```

**Solution:**
```typescript
// 1. Clear cache
queryCache.invalidate()

// 2. Reduce cache TTL
queryCache.setConfig({
  ttl: 10000,  // 10 seconds
  maxSize: 50
})

// 3. Implement aggressive eviction
queryCache.enableAggressiveEviction()
```

### Issue: Pagination Performance

**Diagnosis:**
```sql
-- Check for missing indexes on ORDER BY columns
EXPLAIN ANALYZE
SELECT * FROM songs
ORDER BY created_at DESC
LIMIT 20 OFFSET 1000;
```

**Solution:**
```sql
-- Add index
CREATE INDEX CONCURRENTLY idx_songs_created_at 
ON songs(created_at DESC);

-- Use cursor-based pagination instead
SELECT * FROM songs
WHERE created_at < '2024-01-01'
ORDER BY created_at DESC
LIMIT 20;
```

### Issue: N+1 Query Problem

**Diagnosis:**
```typescript
// Monitor query count per request
const queryCount = performanceMonitor.getStats(1).totalQueries
if (queryCount > 50) {
  console.warn('Potential N+1 problem detected')
}
```

**Solution:**
```typescript
// Use prefetching
const arrangements = await queryBuilder
  .select('*, songs(*)')  // Include related data
  .execute()

// Or batch queries
const results = await queryOptimizer.parallel([
  songsQuery,
  arrangementsQuery,
  setlistsQuery
])
```

## Performance Optimization Procedures

### Query Optimization Checklist

1. **Identify Slow Queries**
```bash
# Export slow query log
npm run export:slow-queries

# Analyze with pg_stat_statements
psql -c "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20"
```

2. **Analyze Query Plans**
```sql
-- Get execution plan
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT /* your query here */;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;
```

3. **Optimize Indexes**
```sql
-- Find missing indexes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1
ORDER BY n_distinct DESC;

-- Create missing indexes
CREATE INDEX CONCURRENTLY idx_table_column 
ON table(column) WHERE condition;

-- Remove unused indexes
DROP INDEX CONCURRENTLY unused_index;
```

4. **Cache Optimization**
```typescript
// Warm cache with common queries
await queryCache.warmup([
  { builder: popularSongsQuery },
  { builder: recentArrangementsQuery },
  { builder: publicSetlistsQuery }
])

// Monitor cache effectiveness
const stats = queryCache.getStats()
if (stats.hitRate < 0.6) {
  // Adjust cache strategy
  queryCache.setConfig({
    ttl: 60000,  // Increase TTL
    maxSize: 200  // Increase size
  })
}
```

## Database Maintenance

### Daily Tasks

```bash
#!/bin/bash
# Daily maintenance script

# 1. Vacuum analyze
psql -c "VACUUM ANALYZE;"

# 2. Update statistics
psql -c "ANALYZE;"

# 3. Check for bloat
psql -f check_bloat.sql > bloat_report.txt

# 4. Archive old logs
find /var/log/postgresql -name "*.log" -mtime +7 -exec gzip {} \;

# 5. Backup verification
pg_dump --schema-only | diff - schema_baseline.sql
```

### Weekly Tasks

```sql
-- 1. Reindex frequently updated tables
REINDEX TABLE CONCURRENTLY arrangements;
REINDEX TABLE CONCURRENTLY reviews;

-- 2. Full vacuum on small tables
VACUUM FULL pg_stat_statements;

-- 3. Update table statistics
ANALYZE VERBOSE;

-- 4. Check for unused indexes
SELECT 
  schemaname || '.' || indexname AS index,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelid > 50000;
```

### Monthly Tasks

```bash
# 1. Full backup
pg_dump -Fc -f backup_$(date +%Y%m%d).dump $DATABASE_URL

# 2. Performance baseline
npm run benchmark > baseline_$(date +%Y%m%d).txt

# 3. Security audit
npm audit
npm run security:check

# 4. Dependency updates
npm update
npm run test
```

## Monitoring and Alerts

### Alert Response Procedures

#### High Query Latency Alert

1. **Acknowledge Alert**
```bash
# Mark alert as acknowledged
curl -X POST $MONITORING_URL/alerts/ack \
  -d '{"alert_id": "ALERT_ID", "user": "YOUR_NAME"}'
```

2. **Investigate**
```typescript
// Get current performance metrics
const stats = performanceMonitor.getStats(5)
console.log('P95 latency:', stats.p95Duration)
console.log('Slow queries:', performanceMonitor.getSlowQueries(10))
```

3. **Mitigate**
```typescript
// Enable aggressive caching
queryCache.setConfig({ ttl: 300000 })  // 5 minutes

// Reduce query complexity
queryBuilder.setMaxComplexity(5)

// Enable read replica routing
queryOptimizer.preferReadReplica(true)
```

4. **Document**
```bash
# Log incident
echo "[$(date)] High latency incident - P95: ${P95}ms" >> incidents.log
```

### Dashboard Monitoring

Key metrics to watch:

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| P95 Latency | < 500ms | 500-1000ms | > 1000ms |
| Error Rate | < 0.1% | 0.1-1% | > 1% |
| Cache Hit Rate | > 70% | 50-70% | < 50% |
| Connection Pool | < 50% | 50-80% | > 80% |
| CPU Usage | < 60% | 60-80% | > 80% |
| Memory Usage | < 70% | 70-90% | > 90% |

## Rollback Procedures

### Application Rollback

```bash
# 1. Check current version
kubectl get deployment songbook-api -o jsonpath='{.spec.template.spec.containers[0].image}'

# 2. Rollback to previous version
kubectl rollout undo deployment/songbook-api

# 3. Verify rollback
kubectl rollout status deployment/songbook-api

# 4. Check application health
curl -f $APP_URL/health || echo "Health check failed"
```

### Database Migration Rollback

```sql
-- 1. Check migration history
SELECT * FROM migrations ORDER BY executed_at DESC LIMIT 5;

-- 2. Rollback last migration
BEGIN;
-- Run down migration script
\i migrations/down/20240101_rollback.sql
DELETE FROM migrations WHERE version = '20240101';
COMMIT;

-- 3. Verify schema
\d+ affected_table
```

### Cache Rollback

```typescript
// 1. Clear corrupted cache
queryCache.invalidate()

// 2. Restore previous cache config
queryCache.setConfig(previousConfig)

// 3. Warm cache with safe data
await queryCache.warmup(safeQueries)
```

## Incident Response

### Incident Classification

| Severity | Response Time | Examples |
|----------|--------------|----------|
| P1 - Critical | 15 min | Complete outage, data loss |
| P2 - High | 1 hour | Partial outage, severe degradation |
| P3 - Medium | 4 hours | Feature failure, minor degradation |
| P4 - Low | 24 hours | Cosmetic issues, minor bugs |

### Incident Response Checklist

#### During Incident

- [ ] Acknowledge alert
- [ ] Assess impact and severity
- [ ] Start incident channel/call
- [ ] Implement immediate mitigation
- [ ] Communicate status to stakeholders
- [ ] Document actions taken
- [ ] Monitor recovery metrics

#### Post-Incident

- [ ] Ensure system stability
- [ ] Create incident report
- [ ] Schedule post-mortem
- [ ] Update runbook with learnings
- [ ] Implement preventive measures
- [ ] Close incident ticket

### Communication Templates

**Initial Response:**
```
INCIDENT: [Title]
Severity: P[1-4]
Status: Investigating
Impact: [User-facing impact]
Next Update: [Time]
```

**Update:**
```
INCIDENT UPDATE: [Title]
Status: [Investigating/Mitigating/Monitoring]
Progress: [What's been done]
Current Impact: [Updated impact]
ETA: [Resolution estimate]
Next Update: [Time]
```

**Resolution:**
```
INCIDENT RESOLVED: [Title]
Duration: [Start] - [End]
Root Cause: [Brief description]
Resolution: [What fixed it]
Follow-up: Post-mortem scheduled for [Date]
```

## Routine Maintenance Tasks

### Pre-Deployment Checklist

- [ ] Run test suite: `npm test`
- [ ] Run benchmarks: `npm run bench`
- [ ] Check dependencies: `npm audit`
- [ ] Review migration scripts
- [ ] Backup production database
- [ ] Notify team of deployment
- [ ] Update status page

### Post-Deployment Verification

```bash
#!/bin/bash
# Post-deployment verification script

echo "Starting post-deployment verification..."

# 1. Health checks
curl -f $APP_URL/health || exit 1
curl -f $APP_URL/health/db || exit 1
curl -f $APP_URL/health/cache || exit 1

# 2. Smoke tests
npm run test:smoke

# 3. Performance check
npm run test:performance:quick

# 4. Error rate check
ERROR_RATE=$(curl -s $METRICS_URL/error_rate)
if (( $(echo "$ERROR_RATE > 1" | bc -l) )); then
  echo "High error rate detected: ${ERROR_RATE}%"
  exit 1
fi

# 5. Cache verification
CACHE_HIT=$(curl -s $METRICS_URL/cache_hit_rate)
echo "Cache hit rate: ${CACHE_HIT}%"

echo "Verification complete!"
```

### Backup Procedures

```bash
# Daily backup
pg_dump -Fc -f /backups/daily/backup_$(date +%Y%m%d).dump $DATABASE_URL

# Weekly backup with verification
pg_dump -Fc -f /backups/weekly/backup_$(date +%Y%W).dump $DATABASE_URL
pg_restore --list /backups/weekly/backup_$(date +%Y%W).dump > /dev/null || exit 1

# Monthly archive
tar -czf /archives/backup_$(date +%Y%m).tar.gz /backups/daily/
aws s3 cp /archives/backup_$(date +%Y%m).tar.gz s3://backups/monthly/
```

### Capacity Planning

Monitor these metrics for capacity planning:

1. **Database Growth Rate**
```sql
SELECT 
  pg_database_size('songbook') as current_size,
  pg_size_pretty(pg_database_size('songbook')) as pretty_size;
```

2. **Query Volume Trends**
```typescript
const weeklyTrend = await getMetricTrend('query_count', '7d')
const monthlyTrend = await getMetricTrend('query_count', '30d')
console.log('Weekly growth:', weeklyTrend.growthRate)
console.log('Monthly growth:', monthlyTrend.growthRate)
```

3. **Resource Utilization Projections**
```bash
# Generate capacity report
npm run report:capacity > capacity_$(date +%Y%m).md
```

## Security Procedures

### Security Checklist

- [ ] Rotate database credentials quarterly
- [ ] Review access logs monthly
- [ ] Update dependencies weekly
- [ ] Run security scans daily
- [ ] Audit permissions quarterly
- [ ] Test backup restoration monthly

### Credential Rotation

```bash
# 1. Generate new credentials
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Update database
psql -c "ALTER USER appuser PASSWORD '$NEW_PASSWORD';"

# 3. Update application
kubectl create secret generic db-credentials \
  --from-literal=password=$NEW_PASSWORD \
  --dry-run=client -o yaml | kubectl apply -f -

# 4. Restart application
kubectl rollout restart deployment/songbook-api

# 5. Verify connectivity
kubectl exec -it deployment/songbook-api -- npm run test:db
```

## Contact Information

### Escalation Path

1. **On-Call Engineer**: Check PagerDuty
2. **Team Lead**: [Contact Info]
3. **Database Admin**: [Contact Info]
4. **Infrastructure**: [Contact Info]
5. **Security Team**: [Contact Info]

### External Contacts

- **Supabase Support**: support@supabase.com
- **Hosting Provider**: [Support URL]
- **CDN Support**: [Support URL]

### Documentation Links

- [Architecture Diagrams](./architecture/)
- [API Documentation](./api/)
- [Database Schema](./schema/)
- [Deployment Guide](./deployment/)
- [Security Policies](./security/)

---

*Last Updated: 2024*
*Version: 1.0*
*Review Schedule: Quarterly*