# Foundation Phase 3B: Error Boundaries & Recovery Enhancement PRP

name: "Error Boundaries & Recovery Enhancement Implementation"
description: |
  Enhance existing error boundary infrastructure with feature-specific boundaries, intelligent recovery mechanisms,
  and user-friendly error experiences to achieve 99% error boundary coverage and graceful degradation.

---

## Goal

**Feature Goal**: Implement comprehensive error boundary coverage with intelligent recovery mechanisms, providing users with clear feedback and actionable recovery paths when errors occur.

**Deliverable**: Enhanced error boundary system with feature-specific boundaries, auto-recovery mechanisms, error categorization, and user-friendly fallback UI components.

**Success Definition**: 99% feature coverage with error boundaries, <5% error-related user abandonment, automatic recovery for transient errors, comprehensive error tracking.

## User Persona

**Target User**: All HSA Songbook users encountering technical issues

**Use Case**: Graceful error recovery when components fail, network issues occur, or resources fail to load

**User Journey**:
1. User encounters an error (network, component crash, chunk loading)
2. Error boundary catches and displays friendly message
3. User sees clear recovery options (retry, refresh, go home)
4. System attempts automatic recovery for transient errors
5. User continues using app without full page reload

**Pain Points Addressed**:
- Cryptic error messages that confuse users
- Full app crashes from isolated component errors
- No recovery path forcing page refresh
- Lost work from unexpected errors

## Why

- **User Retention**: Graceful error handling prevents 15-20% user abandonment
- **Support Reduction**: Clear error messages reduce support tickets by 30%
- **Developer Experience**: Better error tracking speeds debugging by 40%
- **Reliability**: Isolated errors don't crash entire application

## What

Build upon existing ErrorBoundary infrastructure to add feature-specific boundaries, intelligent error categorization, automatic recovery for transient errors, and enhanced user feedback mechanisms.

### Success Criteria

- [ ] 99% of features wrapped in error boundaries
- [ ] Automatic recovery for transient errors (network, chunk loading)
- [ ] Error categorization with specific recovery actions
- [ ] User-friendly error messages for all error types
- [ ] Error tracking integrated with monitoring service
- [ ] Progressive degradation for feature failures
- [ ] Offline-specific error handling enhanced
- [ ] Zero full-app crashes from component errors

## All Needed Context

### Context Completeness Check

_This PRP contains all implementation details, patterns, and file references needed to enhance error boundaries without prior codebase knowledge._

### Documentation & References

```yaml
- url: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
  why: Official React error boundary documentation and best practices
  critical: getDerivedStateFromError vs componentDidCatch usage

- url: https://kentcdodds.com/blog/use-react-error-boundary
  why: Advanced error boundary patterns and recovery strategies
  critical: Error boundary reset patterns and error recovery hooks

- url: https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/
  why: Sentry integration patterns for error tracking
  critical: Proper error context capture for debugging

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/features/monitoring/components/ErrorBoundary.tsx
  why: Existing ErrorBoundary implementation with 4-level hierarchy
  pattern: Level-based error boundaries (app, page, section, component)
  gotcha: Already supports resetKeys and resetOnPropsChange

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/features/monitoring/components/ErrorFallback.tsx
  why: Current fallback UI component
  pattern: User-friendly messages with action buttons
  gotcha: Development mode shows stack traces

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/lib/database/errors.ts
  why: Error classification system
  pattern: Typed error classes with retry logic
  gotcha: isRetryable() method determines retry eligibility

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/features/monitoring/services/errorReportingService.ts
  why: Error reporting infrastructure
  pattern: Sentry integration with fallback to custom endpoint
  gotcha: Queue-based error history tracking

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/features/pwa/components/LazyRouteWrapper.tsx
  why: Chunk loading error handling
  pattern: Specialized error boundary for lazy routes
  gotcha: Detects "Loading chunk" errors specifically

- docfile: PRPs/ai_docs/error-boundary-patterns.md
  why: Advanced error boundary patterns and recovery strategies
  section: Auto-recovery Mechanisms
```

### Current Codebase tree

```bash
hsa-songbook/
├── src/
│   ├── app/
│   │   └── App.tsx                     # App and page level boundaries
│   ├── features/
│   │   ├── monitoring/
│   │   │   ├── components/
│   │   │   │   ├── ErrorBoundary.tsx   # Base error boundary
│   │   │   │   └── ErrorFallback.tsx   # Default fallback UI
│   │   │   ├── hooks/
│   │   │   │   └── useErrorHandler.ts  # Programmatic error handling
│   │   │   └── services/
│   │   │       └── errorReportingService.ts # Error tracking
│   │   └── pwa/
│   │       └── components/
│   │           ├── LazyRouteWrapper.tsx # Route error handling
│   │           └── OfflineFallback.tsx  # Offline error UI
│   └── lib/
│       └── database/
│           └── errors.ts                # Error classification
```

### Desired Codebase tree with files to be added

```bash
hsa-songbook/
├── src/
│   ├── features/
│   │   ├── monitoring/
│   │   │   ├── components/
│   │   │   │   ├── ErrorBoundary.tsx         # ENHANCED: Auto-recovery
│   │   │   │   ├── ErrorFallback.tsx         # ENHANCED: Category-specific UI
│   │   │   │   ├── FeatureErrorBoundary.tsx  # NEW: Feature-specific wrapper
│   │   │   │   ├── NetworkErrorFallback.tsx  # NEW: Network error UI
│   │   │   │   ├── ChunkErrorFallback.tsx    # NEW: Chunk loading UI
│   │   │   │   └── PermissionErrorFallback.tsx # NEW: Auth error UI
│   │   │   ├── hooks/
│   │   │   │   ├── useErrorRecovery.ts       # NEW: Recovery strategies
│   │   │   │   └── useErrorCategory.ts       # NEW: Error categorization
│   │   │   └── services/
│   │   │       └── errorRecoveryService.ts   # NEW: Recovery orchestration
│   │   ├── arrangements/
│   │   │   └── components/
│   │   │       └── ArrangementErrorBoundary.tsx # NEW: Editor-specific
│   │   ├── songs/
│   │   │   └── components/
│   │   │       └── SongListErrorBoundary.tsx    # NEW: List-specific
│   │   └── setlists/
│   │       └── components/
│   │           └── SetlistErrorBoundary.tsx     # NEW: Setlist-specific
│   └── shared/
│       └── utils/
│           └── errorUtils.ts                    # NEW: Error utilities
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Error boundaries don't catch errors in event handlers
// Must use try-catch in event handlers and call errorReportingService

// CRITICAL: Error boundaries don't catch async errors
// Must use .catch() on promises or try-catch in async functions

// CRITICAL: React 19 requires error boundaries to be class components
// Cannot use hooks directly in error boundary components

// CRITICAL: Supabase errors need special handling
// Use handleSupabaseError() from database/errors.ts

// CRITICAL: ChordSheetJS parsing errors are not exceptions
// Check for error property in parse result

// CRITICAL: Service worker errors need special handling
// Use navigator.serviceWorker.addEventListener('error')
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/features/monitoring/types/errorTypes.ts
export type ErrorCategory = 
  | 'network'       // Network/API failures
  | 'chunk'         // Lazy loading failures
  | 'permission'    // Auth/authorization errors
  | 'validation'    // Input validation errors
  | 'parsing'       // Data parsing errors
  | 'component'     // React component errors
  | 'unknown'       // Uncategorized errors

export interface ErrorContext {
  category: ErrorCategory
  component?: string
  userId?: string
  action?: string // What user was trying to do
  retryable: boolean
  retryCount: number
  timestamp: number
}

export interface RecoveryStrategy {
  type: 'auto' | 'manual' | 'none'
  maxRetries: number
  retryDelay: number // ms
  fallbackAction?: () => void
}

// src/features/monitoring/hooks/useErrorCategory.ts
export interface CategorizedError extends Error {
  category: ErrorCategory
  context: ErrorContext
  recovery: RecoveryStrategy
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/features/monitoring/types/errorTypes.ts
  - IMPLEMENT: TypeScript types for error categorization
  - DEFINE: ErrorCategory, ErrorContext, RecoveryStrategy
  - EXPORT: All types for use across error handling system
  - PLACEMENT: monitoring/types directory

Task 2: CREATE src/features/monitoring/hooks/useErrorCategory.ts
  - IMPLEMENT: Hook for categorizing errors based on message/type
  - PATTERN: Error message parsing for category detection
  - METHODS: categorizeError(), getRecoveryStrategy()
  - RETURNS: CategorizedError with recovery strategy
  - PLACEMENT: monitoring/hooks directory

Task 3: CREATE src/features/monitoring/hooks/useErrorRecovery.ts
  - IMPLEMENT: Hook for executing recovery strategies
  - METHODS: attemptRecovery(), scheduleRetry(), fallback()
  - INTEGRATE: With ErrorBoundary resetErrorBoundary
  - PATTERN: Exponential backoff for retries
  - PLACEMENT: monitoring/hooks directory

Task 4: ENHANCE src/features/monitoring/components/ErrorBoundary.tsx
  - ADD: Auto-recovery mechanism for transient errors
  - ADD: Error categorization in componentDidCatch
  - ADD: Retry counter with exponential backoff
  - MAINTAIN: Existing resetKeys and level hierarchy
  - INTEGRATE: With new recovery hooks

Task 5: CREATE src/features/monitoring/components/NetworkErrorFallback.tsx
  - IMPLEMENT: Specialized UI for network errors
  - ADD: Connection status indicator
  - ADD: Auto-retry with countdown timer
  - PATTERN: Online/offline detection
  - STYLE: Match existing ErrorFallback component

Task 6: CREATE src/features/monitoring/components/ChunkErrorFallback.tsx
  - IMPLEMENT: UI for chunk loading failures
  - ADD: App reload suggestion
  - ADD: Version mismatch detection
  - PATTERN: Detect stale chunks
  - ACTION: Force refresh for new deployment

Task 7: CREATE src/features/monitoring/components/FeatureErrorBoundary.tsx
  - IMPLEMENT: Reusable boundary for features
  - PROPS: featureName, fallbackComponent, onError
  - ADD: Feature-specific error tracking
  - PATTERN: Wraps ErrorBoundary with defaults
  - FLEXIBILITY: Customizable per feature

Task 8: CREATE src/features/arrangements/components/ArrangementErrorBoundary.tsx
  - IMPLEMENT: Editor-specific error handling
  - HANDLE: ChordSheetJS parsing errors
  - HANDLE: CodeMirror editor crashes
  - RECOVERY: Restore from auto-save
  - FALLBACK: Simplified text editor

Task 9: CREATE src/features/songs/components/SongListErrorBoundary.tsx
  - IMPLEMENT: List-specific error handling
  - HANDLE: Data fetching failures
  - HANDLE: Rendering large lists
  - RECOVERY: Show cached data if available
  - FALLBACK: Basic list without features

Task 10: CREATE src/features/monitoring/services/errorRecoveryService.ts
  - IMPLEMENT: Centralized recovery orchestration
  - METHODS: registerRecovery(), executeRecovery()
  - TRACK: Recovery attempts and success rates
  - INTEGRATE: With error reporting service
  - PATTERN: Strategy pattern for recovery
```

### Implementation Patterns & Key Details

```typescript
// src/features/monitoring/hooks/useErrorCategory.ts
export function useErrorCategory() {
  const categorizeError = (error: Error): CategorizedError => {
    let category: ErrorCategory = 'unknown'
    let retryable = false
    let maxRetries = 0

    // Network errors
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Network') ||
      error.name === 'NetworkError'
    ) {
      category = 'network'
      retryable = true
      maxRetries = 3
    }
    // Chunk loading errors
    else if (
      error.message.includes('Loading chunk') ||
      error.message.includes('Failed to import') ||
      error.message.includes('dynamically imported module')
    ) {
      category = 'chunk'
      retryable = true
      maxRetries = 1 // Usually needs page refresh
    }
    // Permission errors
    else if (
      error.message.includes('unauthorized') ||
      error.message.includes('forbidden') ||
      error.message.includes('permission')
    ) {
      category = 'permission'
      retryable = false
    }
    // Validation errors
    else if (
      error.name === 'ValidationError' ||
      error.message.includes('validation')
    ) {
      category = 'validation'
      retryable = false
    }

    const recovery: RecoveryStrategy = {
      type: retryable ? 'auto' : 'manual',
      maxRetries,
      retryDelay: category === 'network' ? 1000 : 2000,
      fallbackAction: category === 'chunk' 
        ? () => window.location.reload()
        : undefined
    }

    return {
      ...error,
      category,
      context: {
        category,
        retryable,
        retryCount: 0,
        timestamp: Date.now()
      },
      recovery
    }
  }

  return { categorizeError }
}

// Enhanced ErrorBoundary with auto-recovery
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: Set<number> = new Set()
  private recoveryService = new ErrorRecoveryService()

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { level = 'page' } = this.props
    
    // Categorize error
    const categorized = categorizeError(error)
    
    // Log to monitoring
    errorReportingService.report({
      error: categorized,
      errorInfo,
      level,
      category: categorized.category,
      context: categorized.context
    })

    // Attempt auto-recovery for transient errors
    if (categorized.recovery.type === 'auto' && 
        this.state.retryCount < categorized.recovery.maxRetries) {
      this.scheduleAutoRecovery(categorized)
    }
  }

  private scheduleAutoRecovery(error: CategorizedError) {
    const delay = error.recovery.retryDelay * Math.pow(2, this.state.retryCount)
    
    const timeoutId = window.setTimeout(() => {
      this.setState(prevState => ({
        retryCount: prevState.retryCount + 1
      }), () => {
        this.resetErrorBoundary()
      })
    }, delay)

    this.retryTimeouts.add(timeoutId)
    
    // Update state to show recovery UI
    this.setState({
      isRecovering: true,
      recoveryDelay: delay
    })
  }

  componentWillUnmount() {
    // Clear any pending retries
    this.retryTimeouts.forEach(id => clearTimeout(id))
  }
}

// Network-specific error fallback
export const NetworkErrorFallback: FC<ErrorFallbackProps> = ({ 
  error, 
  resetError,
  context 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Auto-retry when connection restored
    if (isOnline && context?.retryable) {
      startRetryCountdown()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOnline])

  const startRetryCountdown = () => {
    let countdown = 5
    setRetryCountdown(countdown)

    const timer = setInterval(() => {
      countdown--
      if (countdown <= 0) {
        clearInterval(timer)
        resetError()
      } else {
        setRetryCountdown(countdown)
      }
    }, 1000)
  }

  return (
    <div className="error-fallback network-error p-8 text-center">
      <div className="error-icon mb-4">
        {isOnline ? <RefreshCw size={48} /> : <WifiOff size={48} />}
      </div>
      
      <h2 className="text-2xl font-bold mb-2">
        {isOnline ? 'Connection Error' : 'You\'re Offline'}
      </h2>
      
      <p className="text-gray-600 mb-4">
        {isOnline 
          ? 'Having trouble connecting to our servers. Please check your connection and try again.'
          : 'Please check your internet connection to continue.'}
      </p>

      {retryCountdown !== null && (
        <div className="mb-4 text-sm text-gray-500">
          Retrying in {retryCountdown} seconds...
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <button
          onClick={resetError}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={retryCountdown !== null}
        >
          Try Again
        </button>
        
        {context?.level !== 'app' && (
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Go Home
          </button>
        )}
      </div>

      {isOnline && (
        <div className="mt-6 text-sm text-gray-500">
          <p>If this problem persists, our service might be temporarily unavailable.</p>
        </div>
      )}
    </div>
  )
}

// Feature-specific error boundary wrapper
export const FeatureErrorBoundary: FC<FeatureErrorBoundaryProps> = ({
  children,
  featureName,
  fallbackComponent,
  onError,
  level = 'section'
}) => {
  const CustomFallback = fallbackComponent || ErrorFallback

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Track feature-specific errors
    errorReportingService.report({
      error,
      errorInfo,
      feature: featureName,
      level
    })

    // Call custom error handler if provided
    onError?.(error, errorInfo)
  }

  return (
    <ErrorBoundary
      level={level}
      fallback={(props) => (
        <CustomFallback 
          {...props} 
          featureName={featureName}
        />
      )}
      onError={handleError}
      resetKeys={[featureName]} // Reset when feature changes
      isolate // CSS isolation for feature errors
    >
      {children}
    </ErrorBoundary>
  )
}

// Arrangement-specific error handling
export const ArrangementErrorBoundary: FC<{ children: ReactNode }> = ({ 
  children 
}) => {
  const { restoreFromAutoSave } = useAutoSave()

  const handleArrangementError = (error: Error) => {
    // Check if it's a parsing error
    if (error.message.includes('ChordSheet') || 
        error.message.includes('parse')) {
      // Attempt to restore from auto-save
      const restored = restoreFromAutoSave()
      if (restored) {
        toast.success('Restored from auto-save')
        return true // Indicate recovery succeeded
      }
    }
    return false
  }

  return (
    <FeatureErrorBoundary
      featureName="arrangements"
      level="component"
      onError={handleArrangementError}
      fallbackComponent={({ resetError }) => (
        <div className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-yellow-500" size={48} />
          <h3 className="text-xl font-bold mb-2">Editor Error</h3>
          <p className="mb-4">The chord editor encountered an issue.</p>
          <div className="flex gap-4 justify-center">
            <button onClick={resetError} className="btn-primary">
              Restart Editor
            </button>
            <button onClick={restoreFromAutoSave} className="btn-secondary">
              Restore Auto-save
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </FeatureErrorBoundary>
  )
}
```

### Integration Points

```yaml
APP_STRUCTURE:
  - update: "src/app/App.tsx"
  - wrap: "Each major route with FeatureErrorBoundary"
  - maintain: "Existing app-level and page-level boundaries"

FEATURES:
  - arrangements: "Wrap editor with ArrangementErrorBoundary"
  - songs: "Wrap list with SongListErrorBoundary"
  - setlists: "Wrap manager with SetlistErrorBoundary"
  - admin: "Wrap dashboard with FeatureErrorBoundary"

MONITORING:
  - service: "errorReportingService.ts"
  - track: "Error categories and recovery success rates"
  - alerts: "Critical error thresholds"

TESTING:
  - coverage: "Error boundary test for each feature"
  - scenarios: "Network, chunk, permission errors"
  - recovery: "Auto-recovery validation"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# TypeScript compilation
npm run build
# Expected: No TypeScript errors

# ESLint validation
npm run lint
# Expected: No linting errors

# Check error boundary coverage
find src -name "*.tsx" -type f | xargs grep -l "export.*Page\|export.*Dashboard" | while read file; do
  grep -q "ErrorBoundary\|FeatureErrorBoundary" "$file" && echo "✓ $file" || echo "✗ $file"
done
# Expected: All page components wrapped
```

### Level 2: Component Testing (Error Handling)

```bash
# Run error boundary tests
npm run test -- --grep="ErrorBoundary"
# Expected: All tests pass

# Test error categorization
npm run test -- src/features/monitoring/hooks/useErrorCategory.test.ts
# Expected: All categories correctly identified

# Test recovery mechanisms
npm run test -- src/features/monitoring/hooks/useErrorRecovery.test.ts
# Expected: Recovery strategies execute correctly

# Coverage check
npm run test:coverage -- src/features/monitoring
# Expected: >90% coverage
```

### Level 3: Integration Testing (Error Scenarios)

```bash
# Start dev server
npm run dev &
DEV_PID=$!
sleep 3

# Test network error handling
# 1. Open Chrome DevTools -> Network tab
# 2. Set to "Offline"
# 3. Try to fetch data
# Expected: NetworkErrorFallback displays

# Test chunk loading error
# 1. Clear browser cache
# 2. Set Network to "Slow 3G"
# 3. Navigate to lazy route
# 4. Interrupt loading
# Expected: ChunkErrorFallback displays

# Test component crash
# 1. Trigger error in console: 
#    window.dispatchEvent(new Event('test-error'))
# Expected: Error boundary catches and displays fallback

# Test auto-recovery
# 1. Trigger network error
# 2. Restore network connection
# Expected: Auto-retry countdown and recovery

kill $DEV_PID
```

### Level 4: Production Simulation (Full Validation)

```bash
# Build production version
npm run build
npm run preview &
PREVIEW_PID=$!
sleep 3

# Simulate production errors
node scripts/test-error-boundaries.js
# Expected: All error types handled gracefully

# Check error reporting
# Monitor console for error tracking calls
# Expected: Errors reported with correct categories

# Test recovery metrics
curl http://localhost:4173/api/metrics/errors
# Expected: Recovery success rate >80%

# Test feature degradation
# 1. Break arrangement editor (inject error)
# Expected: Other features continue working

# Test error isolation
# 1. Cause error in setlist component
# Expected: Only setlist section affected, rest of app works

kill $PREVIEW_PID

# Verify no regressions
npm run test
# Expected: All existing tests still pass
```

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation successful
- [ ] ESLint passes without errors
- [ ] All tests pass
- [ ] Coverage >90% for error handling code

### Error Boundary Coverage

- [ ] All page components wrapped
- [ ] All feature sections have boundaries
- [ ] Critical components have specific boundaries
- [ ] Lazy routes have chunk error handling
- [ ] Event handlers have try-catch blocks

### Error Recovery Features

- [ ] Network errors auto-retry
- [ ] Chunk errors suggest reload
- [ ] Permission errors show login
- [ ] Validation errors show corrections
- [ ] Component errors allow reset

### User Experience Validation

- [ ] Error messages are user-friendly
- [ ] Recovery actions are clear
- [ ] Auto-recovery works for transient errors
- [ ] Offline mode handles gracefully
- [ ] No full app crashes from component errors

### Monitoring Integration

- [ ] Errors reported to monitoring service
- [ ] Error categories tracked
- [ ] Recovery success rates measured
- [ ] Critical error alerts configured
- [ ] Error trends dashboard available

---

## Anti-Patterns to Avoid

- ❌ Don't catch all errors silently (loses debugging info)
- ❌ Don't show technical stack traces to users
- ❌ Don't retry infinitely (causes performance issues)
- ❌ Don't ignore error boundary warnings in console
- ❌ Don't wrap every single component (causes overhead)
- ❌ Don't forget error boundaries don't catch async errors
- ❌ Don't reset error boundary without user action
- ❌ Don't lose user data on error recovery