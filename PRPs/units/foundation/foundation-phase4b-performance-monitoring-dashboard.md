# Foundation Phase 4B: Performance Monitoring & Web Vitals Dashboard - Implementation PRP

## Goal

**Feature Goal**: Create comprehensive performance monitoring dashboard leveraging existing web vitals and database monitoring infrastructure

**Deliverable**: Real-time performance dashboard with web vitals visualization, database metrics, and performance budget enforcement

**Success Definition**: All Core Web Vitals tracked and visualized, performance regressions detected automatically, database queries monitored

## Context

```yaml
existing_infrastructure:
  web_vitals: "src/features/monitoring/hooks/useWebVitals.ts # v5.1.0 with attribution"
  performance_service: "src/features/monitoring/services/performanceService.ts:19-31"
  db_monitor: "src/lib/database/monitoring/performanceMonitor.ts # 520 lines enterprise-grade"
  visual_component: "src/features/monitoring/components/PerformanceMonitor.tsx"

metrics_collection:
  core_web_vitals: "CLS, INP (replaced FID), LCP, FCP, TTFB"
  attribution_data: "web-vitals/attribution build already used"
  buffering: "performanceService with 5s flush intervals"
  db_metrics: "Query duration, connection pool, health checks"

performance_targets:
  lcp: "< 2.5s good, < 4s needs improvement"
  inp: "< 200ms good, < 500ms needs improvement"  
  cls: "< 0.1 good, < 0.25 needs improvement"
  bundle_size: "< 200KB target from package.json"

visualization_options:
  recharts: "Lightweight SVG, good for real-time updates"
  apex_charts: "Interactive dashboards, time-series data"
  existing_ui: "Tailwind CSS 4.1, ShadCN components"

reference_docs:
  web_vitals: "https://web.dev/articles/vitals"
  recharts: "https://recharts.org/en-US/guide"
  performance_api: "https://developer.mozilla.org/en-US/docs/Web/API/Performance_API"
```

## Implementation Tasks

### 1. Install Visualization Dependencies [install-viz-deps]
```bash
npm install recharts@^2.12.0 --save
npm install date-fns@^3.6.0 --save  # For time formatting
```

### 2. Create Performance Dashboard Layout [create-dashboard-layout]
Create `src/features/monitoring/pages/PerformanceDashboard.tsx`:
- Grid layout with Tailwind CSS classes
- Responsive design using existing patterns
- Follow layout from `src/app/pages/AdminDashboard.tsx`
- Integration with existing PerformanceMonitor component

### 3. Implement Web Vitals Chart Component [implement-vitals-chart]
Create `src/features/monitoring/components/WebVitalsChart.tsx`:
- Real-time line chart for Core Web Vitals
- Color coding: green (good), yellow (needs improvement), red (poor)
- Use existing metric thresholds from useWebVitals hook
- Attribution data in tooltips

### 4. Create Database Performance Panel [create-db-panel]
Create `src/features/monitoring/components/DatabaseMetricsPanel.tsx`:
- Query performance histogram (P50, P95, P99)
- Connection pool utilization gauge
- Slow query alerts list
- Export functionality using existing CSV/JSON methods

### 5. Build Performance Budget Status [build-budget-status]
Create `src/features/monitoring/components/PerformanceBudgetStatus.tsx`:
- Bundle size tracking against 200KB target
- Web Vitals against thresholds
- Visual indicators for pass/fail
- Historical trend analysis

### 6. Enhance Performance Service [enhance-perf-service]
Update `src/features/monitoring/services/performanceService.ts`:
- Add metric aggregation methods
- Implement rolling window calculations
- Add performance score computation
- Subscribe pattern for real-time updates

### 7. Create Performance Context [create-perf-context]
Create `src/features/monitoring/contexts/PerformanceContext.tsx`:
- Centralized performance state management
- Real-time metric streaming
- Historical data caching in IndexedDB
- Follow pattern from `src/shared/contexts/ThemeContext.tsx`

### 8. Implement Custom Metrics Tracking [implement-custom-metrics]
Enhance tracking for HSA-specific operations:
- ChordPro parsing performance
- Song search response times
- Setlist operations duration
- PWA cache performance

### 9. Add Performance Alerts [add-perf-alerts]
Create `src/features/monitoring/components/PerformanceAlerts.tsx`:
- Threshold-based alerting
- Toast notifications for degradations
- Integration with existing notification system
- Alert history in IndexedDB

### 10. Create Performance API Routes [create-api-routes]
Add performance data endpoints:
- GET `/api/performance/metrics` - Current metrics
- GET `/api/performance/history` - Historical data
- POST `/api/performance/export` - Export functionality
- Use existing database monitor export methods

### 11. Implement CI/CD Performance Gates [implement-ci-gates]
Create `.github/workflows/performance-budget.yml`:
- Bundle size checking with bundlesize
- Lighthouse CI for Core Web Vitals
- Fail PR if budgets exceeded
- Performance regression detection

### 12. Add Performance Testing [add-perf-testing]
Create `src/features/monitoring/__tests__/performance.test.ts`:
- Mock performance observers
- Test metric calculations
- Verify threshold detection
- Follow existing test patterns

## Validation Gates

### Level 1: Component Rendering
```bash
# Install dependencies
npm install

# TypeScript compilation
npm run build

# Component tests pass
npm run test -- src/features/monitoring/components
```

### Level 2: Dashboard Integration
```bash
# Development server with dashboard
npm run dev
# Navigate to /admin/performance

# Verify metrics collection
# Open DevTools Console
# Check for web-vitals logs

# Test real-time updates
# Perform actions and observe charts
```

### Level 3: Performance Budget Enforcement
```bash
# Run bundle analyzer
npm run analyze

# Check against budgets
# Main bundle < 200KB
# Total JS < 500KB

# Run Lighthouse locally
npx lighthouse http://localhost:5173 --view
```

### Level 4: Production Monitoring
```bash
# Build for production
npm run build

# Preview with metrics
npm run preview

# Verify in browser:
# - Real metrics collected
# - Charts update in real-time
# - Export functionality works
# - Alerts trigger correctly
```

## Final Validation Checklist

- [ ] Recharts installed and configured
- [ ] Web Vitals dashboard displays all Core Web Vitals
- [ ] Database performance metrics visualized
- [ ] Performance budget status indicators working
- [ ] Real-time updates every 5 seconds
- [ ] Attribution data displayed in tooltips
- [ ] Export functionality (JSON/CSV) working
- [ ] Performance alerts triggering correctly
- [ ] Responsive design on mobile devices
- [ ] Historical data stored in IndexedDB
- [ ] CI/CD performance gates configured
- [ ] Documentation updated with dashboard usage

## Risk Mitigation

```yaml
risks:
  chart_performance:
    mitigation: "Limit data points, use virtualization for large datasets"
  memory_leaks:
    mitigation: "Proper cleanup in useEffect, unsubscribe patterns"
  data_storage:
    mitigation: "Rotate old data, compress with LZ-String"
  false_positives:
    mitigation: "Statistical analysis, ignore outliers"
```

## Success Metrics

- **Visibility**: 100% of performance metrics visualized
- **Real-time**: Updates within 5 seconds of collection
- **Actionable**: Clear indicators of performance issues
- **Historical**: 30 days of trend data available
- **Exportable**: All data exportable for analysis

## Dependencies

- Phase 4A (Sentry Integration) recommended but not required
- Existing monitoring services fully functional
- Admin authentication for dashboard access

## Implementation Time Estimate

- **Dashboard Components**: 4 hours
- **Chart Implementation**: 3 hours
- **Performance Gates**: 2 hours
- **Testing & Documentation**: 2 hours
- **Total**: ~11 hours

## Notes

- Leverage extensive existing monitoring infrastructure
- Database performance monitor is enterprise-grade, just needs visualization
- Web vitals implementation is modern and complete (v5.1.0)
- Consider adding Grafana integration in future phase
- Performance Context can be extended for A/B testing metrics