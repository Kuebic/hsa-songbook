# Foundation Phase 3C: Performance Monitoring & Web Vitals PRP

name: "Performance Monitoring & Web Vitals Implementation"
description: |
  Implement comprehensive performance monitoring with real-time web vitals tracking, alerting thresholds,
  performance budgets, and actionable dashboards to maintain optimal user experience.

---

## Goal

**Feature Goal**: Establish production-grade performance monitoring infrastructure with real-time web vitals tracking, automated alerting, and performance regression detection.

**Deliverable**: Complete performance monitoring system with web vitals collection, real-time dashboard, alerting thresholds, and CI/CD integration for performance budgets.

**Success Definition**: All Core Web Vitals tracked in production, performance regressions detected within 5 minutes, 90+ Lighthouse score maintained, actionable performance dashboard operational.

## User Persona

**Target User**: Development team and DevOps engineers monitoring application performance

**Use Case**: Real-time performance monitoring, alerting on degradation, and data-driven optimization decisions

**User Journey**:
1. Performance metrics collected automatically from all users
2. Metrics aggregated and analyzed in real-time
3. Alerts triggered when thresholds exceeded
4. Dashboard provides actionable insights
5. CI/CD prevents performance regressions

**Pain Points Addressed**:
- Blind spots in production performance
- Late detection of performance regressions
- Lack of user-centric performance metrics
- No correlation between deploys and performance

## Why

- **User Experience**: Poor performance causes 53% mobile abandonment
- **SEO Impact**: Core Web Vitals affect search rankings
- **Business Metrics**: 100ms latency costs 1% in sales (Amazon study)
- **Developer Productivity**: Early detection reduces debugging time by 60%

## What

Build comprehensive performance monitoring system with web vitals tracking, real-time analysis, intelligent alerting, and CI/CD integration to maintain optimal performance standards.

### Success Criteria

- [ ] All Core Web Vitals (LCP, FID/INP, CLS, FCP, TTFB) tracked
- [ ] Real-time performance dashboard operational
- [ ] Alerting for performance degradation (<5min detection)
- [ ] Performance budgets enforced in CI/CD
- [ ] 90+ Lighthouse score maintained
- [ ] Custom business metrics tracked
- [ ] Performance data retention for 30 days
- [ ] Network-aware metric collection

## All Needed Context

### Context Completeness Check

_This PRP provides complete implementation details for performance monitoring without requiring prior knowledge of the monitoring landscape._

### Documentation & References

```yaml
- url: https://web.dev/articles/vitals
  why: Core Web Vitals definitions and thresholds
  critical: Good/Needs Improvement/Poor thresholds for each metric

- url: https://github.com/GoogleChrome/web-vitals
  why: Official web-vitals library documentation
  critical: Attribution build for detailed performance insights

- url: https://docs.sentry.io/platforms/javascript/performance/
  why: Sentry performance monitoring integration
  critical: Transaction and span tracking patterns

- url: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver
  why: Native Performance Observer API
  critical: Custom metric collection patterns

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/features/monitoring/hooks/useWebVitals.ts
  why: Existing web vitals implementation
  pattern: Lazy loading web-vitals library in production
  gotcha: Already integrated in App.tsx

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/features/monitoring/services/performanceService.ts
  why: Current performance service with buffering
  pattern: 5-second batch reporting to reduce overhead
  gotcha: gtag integration already configured

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/lib/database/monitoring/performanceMonitor.ts
  why: Database performance monitoring
  pattern: Query metrics with P50/P95/P99 tracking
  gotcha: Separate from frontend monitoring

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/features/monitoring/components/PerformanceMonitor.tsx
  why: Development performance overlay
  pattern: Real-time metric display in dev mode
  gotcha: Only renders in development

- docfile: PRPs/ai_docs/web-vitals-monitoring-guide.md
  why: Comprehensive web vitals implementation patterns
  section: Real User Monitoring (RUM) Setup
```

### Current Codebase tree

```bash
hsa-songbook/
├── src/
│   ├── app/
│   │   └── App.tsx                          # useWebVitals() hook
│   ├── features/
│   │   └── monitoring/
│   │       ├── hooks/
│   │       │   └── useWebVitals.ts          # Basic vitals collection
│   │       ├── services/
│   │       │   └── performanceService.ts    # Metric buffering
│   │       └── components/
│   │           └── PerformanceMonitor.tsx   # Dev overlay
│   └── lib/
│       └── database/
│           └── monitoring/
│               └── performanceMonitor.ts    # DB metrics
├── .env.example                              # VITE_METRICS_ENDPOINT
└── package.json                              # web-vitals dependency
```

### Desired Codebase tree with files to be added

```bash
hsa-songbook/
├── src/
│   ├── features/
│   │   └── monitoring/
│   │       ├── hooks/
│   │       │   ├── useWebVitals.ts              # ENHANCED: Attribution
│   │       │   ├── usePerformanceMetrics.ts     # NEW: Custom metrics
│   │       │   └── useResourceTiming.ts         # NEW: Resource tracking
│   │       ├── services/
│   │       │   ├── performanceService.ts        # ENHANCED: Thresholds
│   │       │   ├── performanceAnalyzer.ts       # NEW: Metric analysis
│   │       │   └── performanceReporter.ts       # NEW: Reporting logic
│   │       ├── components/
│   │       │   ├── PerformanceMonitor.tsx       # ENHANCED: Prod mode
│   │       │   ├── PerformanceDashboard.tsx     # NEW: Full dashboard
│   │       │   └── MetricCard.tsx               # NEW: Metric display
│   │       ├── utils/
│   │       │   ├── thresholds.ts                # NEW: Metric thresholds
│   │       │   └── networkDetection.ts          # NEW: Connection aware
│   │       └── types/
│   │           └── metrics.ts                   # NEW: Type definitions
│   ├── pages/
│   │   └── admin/
│   │       └── PerformancePage.tsx              # NEW: Admin dashboard
│   └── config/
│       └── performanceBudget.json               # NEW: Budget config
├── scripts/
│   ├── lighthouse-ci.js                         # NEW: Lighthouse CI
│   └── performance-baseline.js                  # NEW: Baseline tracker
└── .github/
    └── workflows/
        └── performance-monitoring.yml            # NEW: CI integration
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: web-vitals must be dynamically imported for tree-shaking
// import { getCLS } from 'web-vitals' // ❌ Adds 6KB to bundle
// const { getCLS } = await import('web-vitals/attribution') // ✅ Loaded on demand

// CRITICAL: PerformanceObserver not available in all browsers
// Must check for support before using

// CRITICAL: sendBeacon has 64KB limit
// Must batch metrics appropriately

// CRITICAL: Safari doesn't support all web vitals
// INP not available, use FID as fallback

// CRITICAL: React 19 concurrent features affect metrics
// Use React.startTransition for non-urgent updates
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/features/monitoring/types/metrics.ts
export interface WebVitalMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender'
  attribution?: Record<string, any> // Detailed attribution data
}

export interface CustomMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percent'
  tags?: Record<string, string>
  timestamp: number
}

export interface PerformanceThreshold {
  metric: string
  good: number
  needsImprovement: number
  poor: number
  alerting: {
    enabled: boolean
    threshold: number
    window: number // Time window in minutes
    minSamples: number // Minimum samples before alerting
  }
}

export interface PerformanceBudget {
  metrics: {
    [key: string]: {
      budget: number
      unit: string
    }
  }
  resources: {
    javascript: number
    css: number
    images: number
    total: number
  }
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/features/monitoring/types/metrics.ts
  - IMPLEMENT: TypeScript interfaces for all metric types
  - DEFINE: WebVitalMetric, CustomMetric, PerformanceThreshold
  - EXPORT: All types for monitoring system
  - PLACEMENT: monitoring/types directory

Task 2: CREATE src/features/monitoring/utils/thresholds.ts
  - IMPLEMENT: Centralized threshold definitions
  - DEFINE: Core Web Vitals thresholds (LCP: 2500/4000, etc.)
  - ADD: Custom metric thresholds
  - EXPORT: getThreshold(), isGoodMetric() functions
  - REFERENCE: web.dev/vitals thresholds

Task 3: ENHANCE src/features/monitoring/hooks/useWebVitals.ts
  - ADD: Attribution build import for detailed insights
  - ADD: INP metric (Interaction to Next Paint)
  - ADD: Network type detection before reporting
  - IMPLEMENT: Metric rating calculation
  - MAINTAIN: Lazy loading pattern

Task 4: CREATE src/features/monitoring/hooks/usePerformanceMetrics.ts
  - IMPLEMENT: Custom business metrics collection
  - TRACK: Time to interactive, time to first byte
  - MEASURE: API response times, render performance
  - PATTERN: PerformanceObserver for custom marks
  - EXPORT: trackMetric(), measureDuration() functions

Task 5: CREATE src/features/monitoring/services/performanceAnalyzer.ts
  - IMPLEMENT: Real-time metric analysis
  - CALCULATE: P50, P75, P90, P95, P99 percentiles
  - DETECT: Performance degradation patterns
  - TREND: Moving averages and anomaly detection
  - ALERT: Threshold violation detection

Task 6: CREATE src/features/monitoring/services/performanceReporter.ts
  - IMPLEMENT: Multi-destination reporting
  - DESTINATIONS: Analytics, Sentry, custom endpoint
  - BATCH: Efficient metric batching (max 64KB)
  - RETRY: Failed report retry with backoff
  - QUEUE: Offline queue with IndexedDB

Task 7: CREATE src/features/monitoring/components/PerformanceDashboard.tsx
  - IMPLEMENT: Real-time performance dashboard
  - DISPLAY: Current metrics with sparklines
  - SHOW: Historical trends (24h, 7d, 30d)
  - FILTER: By page, user segment, device type
  - EXPORT: Data export functionality

Task 8: CREATE src/features/monitoring/components/MetricCard.tsx
  - IMPLEMENT: Individual metric display component
  - SHOW: Current value, rating, trend
  - VISUALIZE: Mini chart for last 100 samples
  - INDICATE: Good/needs improvement/poor status
  - ANIMATE: Real-time updates

Task 9: CREATE src/features/monitoring/utils/networkDetection.ts
  - IMPLEMENT: Network quality detection
  - USE: Network Information API when available
  - CLASSIFY: 4g, 3g, 2g, slow-2g, offline
  - ADAPT: Metric collection based on connection
  - SAVE: Data saver mode detection

Task 10: CREATE scripts/lighthouse-ci.js
  - IMPLEMENT: Lighthouse CI configuration
  - ASSERTIONS: Performance budget checks
  - TARGETS: Mobile and desktop configs
  - OUTPUT: JSON report for CI parsing
  - THRESHOLD: Fail on score <90

Task 11: CREATE src/config/performanceBudget.json
  - DEFINE: Performance budgets for all metrics
  - SPECIFY: Bundle size limits
  - SET: Core Web Vitals targets
  - CONFIGURE: Resource type limits
  - VERSION: Track budget changes over time

Task 12: CREATE .github/workflows/performance-monitoring.yml
  - IMPLEMENT: GitHub Action for performance checks
  - RUN: Lighthouse CI on preview deployments
  - COMPARE: Against baseline metrics
  - COMMENT: PR with performance impact
  - BLOCK: Merge if budgets exceeded
```

### Implementation Patterns & Key Details

```typescript
// Enhanced useWebVitals with attribution
import { useEffect } from 'react'
import type { Metric } from 'web-vitals'

export function useWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Only load in production or if explicitly enabled
    if (process.env.NODE_ENV !== 'production' && 
        !import.meta.env.VITE_ENABLE_MONITORING) {
      return
    }

    // Dynamic import for tree-shaking
    import('web-vitals/attribution').then(({
      onCLS,
      onINP,
      onLCP,
      onFCP,
      onTTFB
    }) => {
      const reportMetric = (metric: Metric & { attribution?: any }) => {
        // Calculate rating based on thresholds
        const rating = getRating(metric.name, metric.value)
        
        // Check network conditions
        const connection = (navigator as any).connection
        if (connection?.saveData) return // Skip in data saver mode
        
        // Enrich metric with context
        const enrichedMetric: WebVitalMetric = {
          name: metric.name as WebVitalMetric['name'],
          value: Math.round(metric.value),
          rating,
          delta: metric.delta,
          navigationType: metric.navigationType || 'navigate',
          attribution: metric.attribution
        }

        // Add to performance service
        performanceService.trackWebVital(enrichedMetric)
        
        // Log poor metrics
        if (rating === 'poor') {
          console.warn(`Poor ${metric.name} performance:`, {
            value: metric.value,
            attribution: metric.attribution
          })
        }
      }

      // Track all Core Web Vitals
      onCLS(reportMetric)
      onINP(reportMetric) // Replaces FID in 2024
      onLCP(reportMetric)
      onFCP(reportMetric)
      onTTFB(reportMetric)
    })
  }, [])
}

// Performance Analyzer Service
export class PerformanceAnalyzer {
  private metrics: Map<string, number[]> = new Map()
  private alertThresholds: Map<string, PerformanceThreshold> = new Map()
  
  constructor() {
    this.initializeThresholds()
  }

  private initializeThresholds() {
    // Core Web Vitals thresholds
    this.alertThresholds.set('LCP', {
      metric: 'LCP',
      good: 2500,
      needsImprovement: 4000,
      poor: 4000,
      alerting: {
        enabled: true,
        threshold: 4000,
        window: 5, // 5 minute window
        minSamples: 10
      }
    })

    this.alertThresholds.set('INP', {
      metric: 'INP',
      good: 200,
      needsImprovement: 500,
      poor: 500,
      alerting: {
        enabled: true,
        threshold: 500,
        window: 5,
        minSamples: 5
      }
    })

    this.alertThresholds.set('CLS', {
      metric: 'CLS',
      good: 0.1,
      needsImprovement: 0.25,
      poor: 0.25,
      alerting: {
        enabled: true,
        threshold: 0.25,
        window: 5,
        minSamples: 10
      }
    })
  }

  addMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Keep last 1000 samples
    if (values.length > 1000) {
      values.shift()
    }
    
    // Check for threshold violations
    this.checkThresholds(name, values)
  }

  private checkThresholds(metric: string, values: number[]) {
    const threshold = this.alertThresholds.get(metric)
    if (!threshold?.alerting.enabled) return
    
    // Get recent samples within time window
    const recentSamples = values.slice(-threshold.alerting.minSamples)
    if (recentSamples.length < threshold.alerting.minSamples) return
    
    // Calculate P75 of recent samples
    const p75 = this.percentile(recentSamples, 75)
    
    if (p75 > threshold.alerting.threshold) {
      this.triggerAlert(metric, p75, threshold)
    }
  }

  private triggerAlert(metric: string, value: number, threshold: PerformanceThreshold) {
    // Send to alerting service
    errorReportingService.report({
      level: 'warning',
      message: `Performance degradation detected`,
      context: {
        metric,
        value,
        threshold: threshold.alerting.threshold,
        severity: value > threshold.poor ? 'critical' : 'warning'
      }
    })

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Performance Alert: ${metric} = ${value}ms (threshold: ${threshold.alerting.threshold}ms)`)
    }
  }

  getStats(metric: string): PerformanceStats | null {
    const values = this.metrics.get(metric)
    if (!values || values.length === 0) return null
    
    return {
      count: values.length,
      mean: this.mean(values),
      median: this.percentile(values, 50),
      p75: this.percentile(values, 75),
      p90: this.percentile(values, 90),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
      min: Math.min(...values),
      max: Math.max(...values)
    }
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length
  }
}

// Performance Dashboard Component
export const PerformanceDashboard: FC = () => {
  const [metrics, setMetrics] = useState<Map<string, PerformanceStats>>()
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!autoRefresh) return

    const loadMetrics = async () => {
      const stats = await performanceService.getAggregatedStats(timeRange)
      setMetrics(stats)
    }

    loadMetrics()
    const interval = setInterval(loadMetrics, 5000) // Update every 5s

    return () => clearInterval(interval)
  }, [timeRange, autoRefresh])

  const webVitals = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB']
  const customMetrics = ['API Response', 'DB Query', 'Render Time']

  return (
    <div className="performance-dashboard p-6">
      <div className="dashboard-header flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Performance Monitoring</h1>
        
        <div className="controls flex gap-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded ${autoRefresh ? 'bg-green-500' : 'bg-gray-500'} text-white`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
        </div>
      </div>

      <div className="web-vitals-section mb-8">
        <h2 className="text-xl font-semibold mb-4">Core Web Vitals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {webVitals.map(vital => (
            <MetricCard
              key={vital}
              name={vital}
              stats={metrics?.get(vital)}
              threshold={getThreshold(vital)}
              showTrend
            />
          ))}
        </div>
      </div>

      <div className="custom-metrics-section mb-8">
        <h2 className="text-xl font-semibold mb-4">Application Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {customMetrics.map(metric => (
            <MetricCard
              key={metric}
              name={metric}
              stats={metrics?.get(metric)}
              showTrend
            />
          ))}
        </div>
      </div>

      <div className="alerts-section">
        <h2 className="text-xl font-semibold mb-4">Recent Alerts</h2>
        <AlertsList timeRange={timeRange} />
      </div>
    </div>
  )
}

// Lighthouse CI Configuration
// scripts/lighthouse-ci.js
const { startFlow } = require('lighthouse/lighthouse-core/fraggle-rock/api.js')

async function runLighthouseCI() {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const flow = await startFlow(page, {
    config: {
      extends: 'lighthouse:default',
      settings: {
        throttling: {
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 150,
          downloadThroughputKbps: 1638,
          uploadThroughputKbps: 675
        },
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75
        }
      }
    }
  })

  // Navigate to app
  await flow.navigate('http://localhost:4173')

  // Test interactions
  await flow.startTimespan({ stepName: 'search-interaction' })
  await page.type('[data-testid="search-input"]', 'test song')
  await page.click('[data-testid="search-button"]')
  await flow.endTimespan()

  const report = await flow.generateReport()
  
  // Check against budgets
  const { lhr } = JSON.parse(report)
  const scores = {
    performance: lhr.categories.performance.score * 100,
    accessibility: lhr.categories.accessibility.score * 100,
    'best-practices': lhr.categories['best-practices'].score * 100,
    seo: lhr.categories.seo.score * 100
  }

  // Enforce performance budget
  if (scores.performance < 90) {
    console.error(`❌ Performance score ${scores.performance} is below 90`)
    process.exit(1)
  }

  // Check Core Web Vitals
  const metrics = {
    LCP: lhr.audits['largest-contentful-paint'].numericValue,
    CLS: lhr.audits['cumulative-layout-shift'].numericValue,
    TBT: lhr.audits['total-blocking-time'].numericValue // FID proxy
  }

  if (metrics.LCP > 2500) {
    console.error(`❌ LCP ${metrics.LCP}ms exceeds 2500ms budget`)
    process.exit(1)
  }

  console.log('✅ All performance checks passed!')
  console.log('Scores:', scores)
  console.log('Metrics:', metrics)
  
  await browser.close()
}

runLighthouseCI().catch(console.error)
```

### Integration Points

```yaml
APPLICATION:
  - integrate: "src/app/App.tsx"
  - hook: "useWebVitals() already integrated"
  - enhance: "Add performance context provider"

ROUTING:
  - add: "src/app/routes.tsx"
  - route: "/admin/performance -> PerformancePage"
  - auth: "Admin role required"

ENVIRONMENT:
  - variables: ".env"
  - add: "VITE_METRICS_ENDPOINT=https://api.example.com/metrics"
  - add: "VITE_SENTRY_DSN=your-sentry-dsn"
  - add: "VITE_ENABLE_MONITORING=true"

CI/CD:
  - workflow: ".github/workflows/performance-monitoring.yml"
  - trigger: "On PR and main branch"
  - lighthouse: "Run on preview URLs"
  - budgets: "Enforce in merge checks"

MONITORING:
  - sentry: "Performance monitoring integration"
  - analytics: "Google Analytics events"
  - custom: "Internal metrics endpoint"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# TypeScript compilation
npm run build
# Expected: No errors

# Verify imports are dynamic
grep -r "from 'web-vitals'" src/ --include="*.ts" --include="*.tsx"
# Expected: No direct imports (should use dynamic import)

# ESLint check
npm run lint
# Expected: No errors
```

### Level 2: Metrics Collection (Unit Testing)

```bash
# Test web vitals hooks
npm run test -- src/features/monitoring/hooks/useWebVitals.test.ts
# Expected: All metrics collected correctly

# Test performance analyzer
npm run test -- src/features/monitoring/services/performanceAnalyzer.test.ts
# Expected: Percentiles calculated correctly

# Test threshold detection
npm run test -- src/features/monitoring/utils/thresholds.test.ts
# Expected: Ratings match Web.dev standards

# Coverage check
npm run test:coverage -- src/features/monitoring
# Expected: >85% coverage
```

### Level 3: Integration Testing (Runtime Validation)

```bash
# Start dev server with monitoring
VITE_ENABLE_MONITORING=true npm run dev &
DEV_PID=$!
sleep 5

# Verify metrics collection
# Open Chrome DevTools -> Console
# Expected: See web vitals logged

# Check metric batching
# Open Network tab
# Navigate around app
# Expected: Metrics sent every 5 seconds

# Test performance dashboard
# Navigate to /admin/performance
# Expected: Real-time metrics displayed

# Simulate slow network
# DevTools -> Network -> Slow 3G
# Expected: Poor LCP metric recorded

# Test offline queue
# Go offline in DevTools
# Navigate around
# Go back online
# Expected: Queued metrics sent

kill $DEV_PID
```

### Level 4: Production Validation (Full System)

```bash
# Build and preview
npm run build
npm run preview &
PREVIEW_PID=$!
sleep 3

# Run Lighthouse CI
node scripts/lighthouse-ci.js
# Expected: Score >90, all budgets pass

# Test real user monitoring
# Open in multiple browsers
# Perform various interactions
# Check /admin/performance
# Expected: Metrics from all sessions

# Verify alerting
# Simulate performance degradation
# Expected: Alert triggered within 5 minutes

# Check data retention
# Query metrics API
curl http://localhost:4173/api/metrics?range=30d
# Expected: 30 days of data available

# Validate CI integration
# Create test PR with performance regression
# Expected: CI blocks merge, comments with metrics

kill $PREVIEW_PID

# Performance baseline comparison
node scripts/performance-baseline.js compare
# Expected: No significant regression vs baseline
```

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation successful
- [ ] All tests pass
- [ ] No ESLint errors
- [ ] Coverage >85% for monitoring code

### Metrics Collection

- [ ] All Core Web Vitals tracked (LCP, INP, CLS, FCP, TTFB)
- [ ] Custom business metrics collected
- [ ] Attribution data captured for debugging
- [ ] Network-aware collection working
- [ ] Offline queue functional

### Dashboard & Visualization

- [ ] Real-time dashboard operational
- [ ] Historical data displayed correctly
- [ ] Metric trends visible
- [ ] Export functionality working
- [ ] Mobile responsive design

### Alerting & Thresholds

- [ ] Alerts trigger on degradation
- [ ] Alert latency <5 minutes
- [ ] Threshold configuration working
- [ ] Alert deduplication functional
- [ ] Integration with error tracking

### CI/CD Integration

- [ ] Lighthouse CI runs on PRs
- [ ] Performance budgets enforced
- [ ] Regression detection working
- [ ] PR comments with metrics
- [ ] Baseline tracking functional

---

## Anti-Patterns to Avoid

- ❌ Don't collect metrics on every interaction (causes overhead)
- ❌ Don't send metrics immediately (batch for efficiency)
- ❌ Don't ignore Safari/iOS limitations
- ❌ Don't track metrics in data saver mode
- ❌ Don't expose sensitive data in metrics
- ❌ Don't alert on single outliers (use percentiles)
- ❌ Don't store metrics indefinitely (implement retention)
- ❌ Don't block user interactions for metric collection