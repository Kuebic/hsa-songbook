name: "Tag System Stage 6 - Polish, Migration & Deployment"
description: |

---

## Goal

**Feature Goal**: Complete system polish with performance optimization, migrate all existing theme data to the new tag system, implement caching strategies, and prepare for production deployment

**Deliverable**: Migration scripts, performance optimizations, caching layer, monitoring setup, deployment checklist, and rollback procedures

**Success Definition**: Zero data loss during migration, < 100ms autocomplete response time, successful migration of 100% of existing themes, and production-ready system with monitoring

## User Persona (if applicable)

**Target User**: System administrators executing migration and end users experiencing seamless transition

**Use Case**: Migrate existing songs from theme arrays to tag relationships while maintaining system availability and performance

**User Journey**:
1. Admin initiates migration process
2. System migrates data in batches
3. Progress tracked and logged
4. Validation ensures data integrity
5. Users experience no disruption
6. Performance metrics meet targets

**Pain Points Addressed**:
- Risk of data loss during migration
- System downtime during transition
- Performance degradation with new system
- Lack of rollback capability
- Missing monitoring and alerting

## Why

- **Data Integrity**: Ensure zero data loss during migration
- **Performance**: Maintain or improve response times
- **Reliability**: Implement proper error handling and recovery
- **Observability**: Monitor system health and usage
- **Confidence**: Provide rollback capability if issues arise

## What

Comprehensive migration system with batch processing, performance optimizations including caching and query optimization, monitoring integration, deployment automation, and rollback procedures.

### Success Criteria

- [ ] 100% of existing themes migrated to tags
- [ ] Zero data loss verified by checksums
- [ ] Autocomplete response < 100ms (p95)
- [ ] Search with filters < 500ms (p95)
- [ ] Cache hit ratio > 80%
- [ ] Migration completes in < 1 hour for 10k songs
- [ ] Rollback procedure tested and documented
- [ ] Monitoring dashboards operational

## All Needed Context

### Context Completeness Check

_This PRP contains migration strategies, performance optimization techniques, caching patterns, monitoring setup, and deployment procedures needed for production readiness._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/features/songs/validation/utils/themeNormalization.ts
  why: Existing theme normalization to integrate in migration
  pattern: Theme mapping logic, normalization rules
  gotcha: 200+ theme variations already mapped

- file: supabase/migrations/20240121_add_multilingual_lyrics.sql
  why: Example of successful migration pattern
  pattern: Batch processing, validation checks
  gotcha: Must handle both NULL and empty arrays

- file: src/lib/supabase.ts
  why: Database client configuration
  pattern: Connection settings, retry logic
  gotcha: Rate limiting considerations

- url: https://supabase.com/docs/guides/database/migrations
  why: Supabase migration best practices
  critical: Rollback strategies, zero-downtime migrations

- url: https://tanstack.com/query/latest/docs/react/guides/caching
  why: React Query caching strategies
  critical: Cache invalidation patterns, optimistic updates

- file: src/features/monitoring/index.ts
  why: Existing monitoring integration
  pattern: Web vitals, error tracking
  gotcha: Must integrate with existing setup

- url: https://docs.sentry.io/platforms/javascript/guides/react/
  why: Error tracking and performance monitoring
  critical: Performance transactions, custom metrics

- docfile: PRPs/ai_docs/hsa-songbook-database-patterns.md
  why: Database patterns and optimization strategies
  section: Performance optimization, indexing
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase

```bash
src/
├── features/
│   ├── tags/           # Complete from Stages 1-5
│   ├── songs/
│   │   └── validation/
│   │       └── utils/
│   │           └── themeNormalization.ts
│   └── monitoring/
│       └── index.ts    # Existing monitoring
└── lib/
    └── supabase.ts     # Database client
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
src/
├── features/
│   └── tags/
│       ├── migration/
│       │   ├── migrationRunner.ts              # Main migration orchestrator
│       │   ├── themeMigrator.ts                # Theme to tag converter
│       │   ├── dataValidator.ts                # Pre/post validation
│       │   ├── rollbackManager.ts              # Rollback procedures
│       │   ├── migrationReporter.ts            # Progress reporting
│       │   └── migration.test.ts               # Migration tests
│       ├── cache/
│       │   ├── tagCache.ts                     # In-memory tag cache
│       │   ├── cacheManager.ts                 # Cache orchestration
│       │   └── cacheWarmer.ts                  # Pre-warm popular tags
│       ├── monitoring/
│       │   ├── tagMetrics.ts                   # Custom metrics
│       │   ├── performanceTracker.ts           # Performance monitoring
│       │   └── alerting.ts                     # Alert configurations
│       └── scripts/
│           ├── migrate.ts                      # CLI migration script
│           ├── validate.ts                     # Data validation script
│           └── rollback.ts                     # Rollback script
│
supabase/
├── migrations/
│   ├── 20250124_prepare_tag_migration.sql      # Pre-migration setup
│   ├── 20250125_migrate_themes_to_tags.sql     # Main migration
│   └── 20250126_cleanup_post_migration.sql     # Cleanup old fields
└── functions/
    └── migrate-themes/                         # Edge function for migration
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Migration must handle concurrent user updates
// Use optimistic locking to prevent conflicts

// CRITICAL: Supabase has rate limits
// Batch operations and implement exponential backoff

// CRITICAL: Cache invalidation is complex
// Clear specific keys, not entire cache

// CRITICAL: Memory limits in edge functions
// Process in chunks of 100 records

// CRITICAL: Monitoring adds overhead
// Sample performance metrics, don't track everything

// CRITICAL: Rollback must be idempotent
// Can be run multiple times safely
```

## Implementation Blueprint

### Data models and structure

```typescript
// Migration types
export interface MigrationConfig {
  batchSize: number
  maxRetries: number
  retryDelayMs: number
  validateChecksum: boolean
  dryRun: boolean
  progressCallback?: (progress: MigrationProgress) => void
}

export interface MigrationProgress {
  phase: 'preparing' | 'migrating' | 'validating' | 'complete' | 'failed'
  processedCount: number
  totalCount: number
  errors: MigrationError[]
  startTime: Date
  estimatedCompletion?: Date
}

export interface MigrationError {
  songId: string
  error: string
  context: Record<string, any>
  recoverable: boolean
}

export interface MigrationCheckpoint {
  id: string
  timestamp: Date
  lastProcessedId: string
  processedCount: number
  checksum: string
}

// Cache types
export interface CacheConfig {
  ttl: number  // Time to live in ms
  maxSize: number  // Max items in cache
  warmOnStartup: boolean
  persistToStorage: boolean
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  hits: number
  lastAccessed: number
}

export interface CacheStats {
  hitRate: number
  missRate: number
  evictionCount: number
  avgResponseTime: number
  memoryUsage: number
}

// Performance metrics
export interface PerformanceMetrics {
  autocompleteP50: number
  autocompleteP95: number
  autocompleteP99: number
  searchP50: number
  searchP95: number
  searchP99: number
  cacheHitRate: number
  errorRate: number
}

// Rollback types
export interface RollbackPlan {
  backupId: string
  backupTimestamp: Date
  affectedTables: string[]
  estimatedDuration: number
  validationChecks: ValidationCheck[]
}

export interface ValidationCheck {
  name: string
  query: string
  expectedResult: any
  critical: boolean
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE supabase/migrations/20250124_prepare_tag_migration.sql
  - IMPLEMENT: Add migration tracking table
  - CREATE: Backup tables for rollback
  - ADD: Indexes for migration queries
  - INCLUDE: Checksum functions
  - PLACEMENT: Migrations directory

Task 2: CREATE src/features/tags/migration/dataValidator.ts
  - IMPLEMENT: Pre and post migration validation
  - METHODS: validateThemes(), validateTags(), compareChecksums()
  - INCLUDE: Detailed error reporting
  - PLACEMENT: Migration directory

Task 3: CREATE src/features/tags/migration/themeMigrator.ts
  - IMPLEMENT: Core theme to tag conversion
  - INTEGRATE: Existing theme normalization
  - HANDLE: Edge cases, duplicates, invalid data
  - BATCH: Process in configurable chunks
  - PLACEMENT: Migration directory

Task 4: CREATE src/features/tags/cache/tagCache.ts
  - IMPLEMENT: In-memory LRU cache
  - FEATURES: TTL, size limits, hit tracking
  - METHODS: get(), set(), invalidate(), preload()
  - THREAD-SAFE: Handle concurrent access
  - PLACEMENT: Cache directory

Task 5: CREATE src/features/tags/cache/cacheManager.ts
  - IMPLEMENT: Multi-tier cache orchestration
  - LAYERS: Memory → SessionStorage → IndexedDB
  - FEATURES: Automatic promotion, eviction
  - PLACEMENT: Cache directory

Task 6: CREATE src/features/tags/cache/cacheWarmer.ts
  - IMPLEMENT: Pre-warm popular tags on startup
  - STRATEGY: Load top 100 tags by usage
  - BACKGROUND: Non-blocking initialization
  - PLACEMENT: Cache directory

Task 7: CREATE src/features/tags/migration/migrationRunner.ts
  - IMPLEMENT: Main migration orchestrator
  - FEATURES: Progress tracking, checkpointing, retry
  - INTEGRATE: Validator, migrator, reporter
  - HANDLE: Failures, rollback triggers
  - PLACEMENT: Migration directory

Task 8: CREATE src/features/tags/migration/rollbackManager.ts
  - IMPLEMENT: Rollback procedures
  - FEATURES: Point-in-time recovery, validation
  - IDEMPOTENT: Safe to run multiple times
  - PLACEMENT: Migration directory

Task 9: CREATE src/features/tags/monitoring/performanceTracker.ts
  - IMPLEMENT: Performance metric collection
  - METRICS: Response times, cache hits, errors
  - INTEGRATE: With existing monitoring
  - SAMPLING: Configurable sampling rates
  - PLACEMENT: Monitoring directory

Task 10: CREATE src/features/tags/monitoring/tagMetrics.ts
  - IMPLEMENT: Business metrics tracking
  - METRICS: Tag usage, popular tags, search patterns
  - EXPORT: To monitoring dashboard
  - PLACEMENT: Monitoring directory

Task 11: CREATE src/features/tags/scripts/migrate.ts
  - IMPLEMENT: CLI migration runner
  - OPTIONS: Dry run, batch size, validation
  - OUTPUT: Progress bar, detailed logs
  - PLACEMENT: Scripts directory

Task 12: CREATE supabase/functions/migrate-themes/index.ts
  - IMPLEMENT: Edge function for migration
  - FEATURES: Scheduled or manual trigger
  - LIMITS: Handle memory constraints
  - PLACEMENT: Supabase functions

Task 13: UPDATE src/features/tags/services/tagService.ts
  - ADD: Cache integration
  - OPTIMIZE: Query patterns
  - IMPLEMENT: Performance tracking
  - PLACEMENT: Existing service

Task 14: CREATE comprehensive migration tests
  - TEST: Migration accuracy
  - TEST: Rollback procedures
  - TEST: Cache behavior
  - TEST: Performance targets
  - PLACEMENT: Alongside components

Task 15: CREATE deployment documentation
  - DOCUMENT: Migration steps
  - INCLUDE: Rollback procedures
  - PROVIDE: Monitoring setup
  - CHECKLIST: Pre/post deployment
  - PLACEMENT: Project docs
```

### Implementation Patterns & Key Details

```typescript
// Migration runner with checkpointing
export class MigrationRunner {
  private checkpoint: MigrationCheckpoint | null = null;
  
  async run(config: MigrationConfig): Promise<MigrationProgress> {
    const progress: MigrationProgress = {
      phase: 'preparing',
      processedCount: 0,
      totalCount: 0,
      errors: [],
      startTime: new Date()
    };
    
    try {
      // Phase 1: Validation
      progress.phase = 'preparing';
      const validation = await this.validator.validateSource();
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Phase 2: Get total count
      progress.totalCount = await this.getTotalCount();
      
      // Phase 3: Load checkpoint if exists
      this.checkpoint = await this.loadCheckpoint();
      
      // Phase 4: Process in batches
      progress.phase = 'migrating';
      await this.processBatches(config, progress);
      
      // Phase 5: Final validation
      progress.phase = 'validating';
      await this.validateMigration(config);
      
      progress.phase = 'complete';
      return progress;
      
    } catch (error) {
      progress.phase = 'failed';
      progress.errors.push({
        songId: 'system',
        error: error.message,
        context: { checkpoint: this.checkpoint },
        recoverable: true
      });
      
      if (config.dryRun) {
        console.log('Dry run failed, no changes made');
      } else {
        await this.rollbackManager.initiate();
      }
      
      throw error;
    }
  }
  
  private async processBatches(
    config: MigrationConfig, 
    progress: MigrationProgress
  ): Promise<void> {
    const batchSize = config.batchSize || 100;
    let lastId = this.checkpoint?.lastProcessedId || '00000000-0000-0000-0000-000000000000';
    
    while (progress.processedCount < progress.totalCount) {
      // Fetch batch
      const batch = await this.fetchBatch(lastId, batchSize);
      if (batch.length === 0) break;
      
      // Process with retry
      for (let attempt = 0; attempt < config.maxRetries; attempt++) {
        try {
          await this.processBatch(batch);
          break;
        } catch (error) {
          if (attempt === config.maxRetries - 1) throw error;
          await this.delay(config.retryDelayMs * Math.pow(2, attempt));
        }
      }
      
      // Update progress
      progress.processedCount += batch.length;
      lastId = batch[batch.length - 1].id;
      
      // Save checkpoint
      await this.saveCheckpoint({
        id: uuid(),
        timestamp: new Date(),
        lastProcessedId: lastId,
        processedCount: progress.processedCount,
        checksum: await this.calculateChecksum(batch)
      });
      
      // Report progress
      if (config.progressCallback) {
        progress.estimatedCompletion = this.estimateCompletion(progress);
        config.progressCallback(progress);
      }
    }
  }
}

// High-performance cache implementation
export class TagCache {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder: string[] = [];
  private stats: CacheStats = {
    hitRate: 0,
    missRate: 0,
    evictionCount: 0,
    avgResponseTime: 0,
    memoryUsage: 0
  };
  
  constructor(private config: CacheConfig) {
    if (config.warmOnStartup) {
      this.warmCache();
    }
    
    // Periodic cleanup
    setInterval(() => this.cleanup(), 60000);
  }
  
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.missRate++;
      return null;
    }
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.stats.missRate++;
      return null;
    }
    
    // Update access tracking
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);
    
    this.stats.hitRate++;
    this.updateResponseTime(performance.now() - startTime);
    
    return entry.data;
  }
  
  set<T>(key: string, data: T): void {
    // Check size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
      lastAccessed: Date.now()
    });
    
    this.accessOrder.push(key);
    this.updateMemoryUsage();
  }
  
  private evictLRU(): void {
    const lruKey = this.accessOrder.shift();
    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictionCount++;
    }
  }
  
  private async warmCache(): Promise<void> {
    try {
      // Load popular tags
      const popularTags = await tagService.getPopularTags(100);
      
      for (const tag of popularTags) {
        this.set(`tag:${tag.id}`, tag);
      }
      
      console.log(`Cache warmed with ${popularTags.length} tags`);
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }
}

// Performance monitoring integration
export class PerformanceTracker {
  private metrics: PerformanceMetrics = {
    autocompleteP50: 0,
    autocompleteP95: 0,
    autocompleteP99: 0,
    searchP50: 0,
    searchP95: 0,
    searchP99: 0,
    cacheHitRate: 0,
    errorRate: 0
  };
  
  private samples: Map<string, number[]> = new Map();
  
  track(operation: string, duration: number): void {
    // Collect samples
    if (!this.samples.has(operation)) {
      this.samples.set(operation, []);
    }
    
    const operationSamples = this.samples.get(operation)!;
    operationSamples.push(duration);
    
    // Keep last 1000 samples
    if (operationSamples.length > 1000) {
      operationSamples.shift();
    }
    
    // Calculate percentiles
    if (operationSamples.length >= 100) {
      this.updateMetrics(operation, operationSamples);
    }
    
    // Send to monitoring service
    if (Math.random() < 0.1) { // Sample 10%
      this.sendToMonitoring(operation, duration);
    }
  }
  
  private updateMetrics(operation: string, samples: number[]): void {
    const sorted = [...samples].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    
    if (operation === 'autocomplete') {
      this.metrics.autocompleteP50 = p50;
      this.metrics.autocompleteP95 = p95;
      this.metrics.autocompleteP99 = p99;
    } else if (operation === 'search') {
      this.metrics.searchP50 = p50;
      this.metrics.searchP95 = p95;
      this.metrics.searchP99 = p99;
    }
  }
  
  private sendToMonitoring(operation: string, duration: number): void {
    // Integration with Sentry/DataDog/etc
    if (window.Sentry) {
      const transaction = window.Sentry.startTransaction({
        name: `tag.${operation}`,
        op: operation
      });
      
      transaction.setMeasurement('duration', duration, 'millisecond');
      transaction.finish();
    }
  }
}

// Migration CLI script
#!/usr/bin/env node
import { program } from 'commander';
import { MigrationRunner } from '../migration/migrationRunner';
import ora from 'ora';
import chalk from 'chalk';

program
  .option('-d, --dry-run', 'Run without making changes')
  .option('-b, --batch-size <number>', 'Batch size', '100')
  .option('-v, --validate', 'Run validation only')
  .option('--skip-validation', 'Skip validation checks')
  .parse(process.argv);

const options = program.opts();

async function main() {
  const spinner = ora('Starting migration...').start();
  
  const runner = new MigrationRunner();
  const config: MigrationConfig = {
    batchSize: parseInt(options.batchSize),
    maxRetries: 3,
    retryDelayMs: 1000,
    validateChecksum: !options.skipValidation,
    dryRun: options.dryRun,
    progressCallback: (progress) => {
      spinner.text = `${progress.phase}: ${progress.processedCount}/${progress.totalCount}`;
      
      if (progress.errors.length > 0) {
        spinner.warn(`Errors: ${progress.errors.length}`);
      }
    }
  };
  
  try {
    if (options.validate) {
      spinner.text = 'Running validation...';
      const result = await runner.validate();
      spinner.succeed(chalk.green('Validation passed!'));
      console.log(result);
    } else {
      const result = await runner.run(config);
      spinner.succeed(chalk.green(`Migration complete! Processed ${result.processedCount} records`));
      
      if (result.errors.length > 0) {
        console.warn(chalk.yellow(`\nWarnings: ${result.errors.length} issues found`));
        result.errors.forEach(err => {
          console.warn(`  - ${err.songId}: ${err.error}`);
        });
      }
    }
  } catch (error) {
    spinner.fail(chalk.red('Migration failed!'));
    console.error(error);
    process.exit(1);
  }
}

main();
```

### Integration Points

```yaml
DATABASE:
  - migration: "Batch processing with checkpoints"
  - indexes: "Optimized for migration queries"
  - backup: "Point-in-time recovery capability"

CACHING:
  - layers: "Memory → SessionStorage → IndexedDB"
  - strategy: "LRU with TTL"
  - warming: "Pre-load popular tags"

MONITORING:
  - metrics: "Custom performance tracking"
  - integration: "Sentry/DataDog/CloudWatch"
  - alerting: "Threshold-based alerts"

DEPLOYMENT:
  - scripts: "CLI tools for migration"
  - automation: "CI/CD integration"
  - rollback: "Automated rollback triggers"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Validate migration scripts
npm run lint
npm run build

# Test SQL migrations
npx supabase db lint

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test migration logic
npm run test -- src/features/tags/migration/

# Test cache implementation
npm run test -- src/features/tags/cache/

# Test monitoring
npm run test -- src/features/tags/monitoring/

# Coverage check
npm run test:coverage -- src/features/tags/

# Expected: > 90% coverage for critical paths
```

### Level 3: Integration Testing (System Validation)

```bash
# Dry run migration
npm run migrate -- --dry-run

# Validate data integrity
npm run migrate -- --validate

# Performance benchmark
npm run benchmark:tags

# Cache effectiveness
# Monitor cache hit rate > 80%

# Load testing
# Run with 100 concurrent users
# Verify response times meet SLA

# Expected: All performance targets met
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Migration scenarios:
# 1. Fresh migration
npm run migrate:fresh

# 2. Resume from checkpoint
# Kill migration mid-process
# Restart and verify resume

# 3. Rollback test
npm run migrate
npm run rollback
npm run validate

# Performance testing:
# 1. Autocomplete under load
# Measure p95 < 100ms

# 2. Search with many filters
# Measure p95 < 500ms

# 3. Cache effectiveness
# Monitor hit rate during peak

# Monitoring validation:
# 1. Trigger alerts
# Verify notifications received

# 2. Dashboard accuracy
# Compare metrics with logs

# Edge cases:
# 1. Migrate with network issues
# 2. Concurrent user updates during migration
# 3. Out of memory scenarios
# 4. Rollback after partial migration

# Expected: Graceful handling of all scenarios
```

## Final Validation Checklist

### Technical Validation

- [ ] All validation levels pass
- [ ] Migration completes without data loss
- [ ] Performance targets achieved
- [ ] Cache working effectively
- [ ] Monitoring operational
- [ ] Rollback tested successfully

### Feature Validation

- [ ] All themes converted to tags
- [ ] Relationships preserved
- [ ] No duplicate tags created
- [ ] Search functionality maintained
- [ ] Admin tools working
- [ ] User experience unchanged

### Code Quality Validation

- [ ] Migration idempotent
- [ ] Error handling comprehensive
- [ ] Logging sufficient for debugging
- [ ] Performance metrics tracked
- [ ] Documentation complete

### Deployment Validation

- [ ] Migration runbook created
- [ ] Rollback procedure documented
- [ ] Monitoring dashboards configured
- [ ] Alerts configured
- [ ] Performance baselines established
- [ ] Load testing completed

---

## Anti-Patterns to Avoid

- ❌ Don't migrate all data at once
- ❌ Don't skip validation checks
- ❌ Don't ignore checkpoint recovery
- ❌ Don't forget cache invalidation
- ❌ Don't overlook monitoring setup
- ❌ Don't deploy without rollback plan
- ❌ Don't ignore performance regression
- ❌ Don't skip load testing