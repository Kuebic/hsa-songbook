# Foundation Phase 4A: Sentry Integration & Production Error Tracking - Implementation PRP

## Goal

**Feature Goal**: Complete the production error tracking infrastructure by integrating Sentry SDK and connecting existing monitoring services

**Deliverable**: Production-ready error tracking with automatic capture, context enrichment, and sensitive data scrubbing

**Success Definition**: All unhandled errors captured with meaningful stack traces, user context, and zero sensitive data exposure

## Context

```yaml
existing_infrastructure:
  error_boundaries: "src/features/monitoring/components/ErrorBoundary.tsx:55-89"
  error_service: "src/features/monitoring/services/errorReportingService.ts:25-34"
  logger_todo: "src/lib/logger.ts:61 # TODO: Send to Sentry"
  web_vitals: "src/features/monitoring/hooks/useWebVitals.ts"
  performance_service: "src/features/monitoring/services/performanceService.ts"

environment_variables:
  documented: "docs/QUICK-REFERENCE.md:403 # VITE_SENTRY_DSN"
  vite_env: "src/vite-env.d.ts:20-23 # Window.Sentry type already defined"
  
patterns_to_follow:
  error_context: "src/features/monitoring/services/errorReportingService.ts:45-58"
  performance_metrics: "src/features/monitoring/services/performanceService.ts:19-31"
  test_mocking: "src/features/monitoring/components/__tests__/ErrorBoundary.test.tsx:9-13"

sentry_docs:
  react_guide: "https://docs.sentry.io/platforms/javascript/guides/react/#install"
  vite_plugin: "https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/vite/"
  data_scrubbing: "https://docs.sentry.io/platforms/javascript/configuration/filtering/#using-beforesend"
  react_router: "https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/"

bundle_impact:
  base_sdk: "~15KB gzipped"
  with_tracing: "~20KB gzipped"
  with_replay: "~30KB gzipped"
```

## Implementation Tasks

### 1. Install Sentry Dependencies [install-dependencies]
```bash
npm install @sentry/react@^8.0.0 --save
npm install @sentry/vite-plugin@^2.0.0 --save-dev
```

### 2. Create Sentry Configuration Service [create-sentry-service]
Create `src/lib/sentry.ts` following pattern from `src/lib/supabase.ts`:
- Environment-aware initialization (DEV vs PROD)
- Lazy loading for performance
- Type-safe configuration
- Integration with existing ErrorBoundary at line 55

### 3. Update Vite Configuration [update-vite-config]
Enhance `vite.config.ts` with Sentry plugin:
- Source map generation and upload
- Release tracking with git SHA
- Security: delete source maps after upload
- Follow existing plugin pattern at lines 40-60

### 4. Complete Logger Integration [complete-logger-todo]
Update `src/lib/logger.ts:61` to send errors to Sentry:
- Preserve existing sanitization at lines 25-45
- Add Sentry.captureException with context
- Maintain development console logging
- Follow existing error structure from errorReportingService

### 5. Enhance Error Reporting Service [enhance-error-service]
Update `src/features/monitoring/services/errorReportingService.ts`:
- Replace custom endpoint with Sentry at lines 25-34
- Preserve existing context enrichment pattern
- Add user context from Clerk authentication
- Maintain error history and queue functionality

### 6. Configure Data Scrubbing [configure-scrubbing]
Implement beforeSend hook following sanitization pattern from `logger.ts:25-45`:
- Remove passwords, tokens, API keys
- Scrub email addresses in production
- Filter out known non-critical errors (ChunkLoadError)
- Preserve error categorization logic

### 7. Add React Router Integration [add-router-integration]
Configure navigation tracking in `src/app/App.tsx`:
- Track route changes as breadcrumbs
- Monitor navigation performance
- Follow existing useWebVitals pattern at line 30

### 8. Create Environment Configuration [create-env-config]
Add to `.env.example` and document:
```env
VITE_SENTRY_DSN=
VITE_SENTRY_ORG=
VITE_SENTRY_PROJECT=hsa-songbook
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_SAMPLE_RATE=1.0
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

### 9. Update Type Definitions [update-types]
Enhance `src/vite-env.d.ts` Sentry types (lines 20-23):
- Add complete Sentry SDK types
- Include configuration interfaces
- Export for use in services

### 10. Add Test Mocks [add-test-mocks]
Create `src/shared/test-utils/sentry-mock.ts`:
- Mock Sentry.captureException
- Mock Sentry.withScope
- Follow pattern from ErrorBoundary.test.tsx:9-13

## Validation Gates

### Level 1: Installation & Build
```bash
# Dependencies installed correctly
npm list @sentry/react @sentry/vite-plugin

# TypeScript compilation passes
npm run build

# No bundle size regression (< 200KB baseline + 30KB)
npm run analyze
```

### Level 2: Development Testing
```bash
# Development server runs without errors
npm run dev

# Test suite passes with mocks
npm run test -- src/features/monitoring

# Linting passes
npm run lint
```

### Level 3: Integration Testing
```javascript
// Test error capture in development console
// 1. Set VITE_SENTRY_DSN in .env.local
// 2. Open browser console
// 3. Trigger test error: window.testError()
// 4. Verify Sentry SDK loads but doesn't send (DEV mode)
```

### Level 4: Production Simulation
```bash
# Build production bundle
npm run build

# Set production env vars
VITE_SENTRY_DSN=your-dsn npm run preview

# Verify in browser:
# - Errors captured to Sentry
# - Source maps work
# - No sensitive data exposed
```

## Final Validation Checklist

- [ ] Sentry SDK installed and configured
- [ ] Logger TODO at line 61 completed
- [ ] Error boundaries integrated with Sentry
- [ ] Source maps upload working in production build
- [ ] Sensitive data properly scrubbed
- [ ] User context attached to errors
- [ ] React Router navigation tracked
- [ ] Bundle size impact < 30KB gzipped
- [ ] All existing tests passing
- [ ] Error capture verified in staging environment
- [ ] Documentation updated with setup instructions
- [ ] Environment variables documented

## Risk Mitigation

```yaml
risks:
  bundle_size:
    mitigation: "Lazy load Sentry in production only"
  sensitive_data:
    mitigation: "Comprehensive beforeSend scrubbing"
  source_map_exposure:
    mitigation: "Delete after upload, use auth tokens"
  dev_experience:
    mitigation: "Disable in development mode"
```

## Success Metrics

- **Error Visibility**: 100% of production errors captured
- **Context Quality**: All errors include user context and breadcrumbs  
- **Performance Impact**: < 5% overhead on initial load
- **Security**: Zero sensitive data in error reports
- **Developer Experience**: No impact on local development

## Dependencies

- Active Sentry account with project created
- Environment variables configured in deployment platform
- CI/CD access for auth token (source map uploads)

## Implementation Time Estimate

- **Setup & Configuration**: 2 hours
- **Integration & Testing**: 3 hours  
- **Documentation & Deployment**: 1 hour
- **Total**: ~6 hours

## Notes

- Existing monitoring infrastructure is exceptionally well-prepared for Sentry integration
- ErrorBoundary component already has proper hierarchy and context handling
- Performance monitoring can be added incrementally after error tracking is stable
- Consider Session Replay for Phase 4B if error tracking proves valuable