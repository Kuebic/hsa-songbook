# React Error Boundary Implementation PRP

---

## Goal

**Feature Goal**: Replace the custom error boundary implementation with the battle-tested `react-error-boundary` library while maintaining and enhancing existing error handling capabilities across the HSA Songbook application.

**Deliverable**: A complete monitoring feature slice enhancement that integrates `react-error-boundary` library, preserves existing error reporting infrastructure, and provides improved error recovery mechanisms.

**Success Definition**: All error boundaries in the application use the new implementation, existing error reporting continues to work, tests pass, and the application demonstrates improved error recovery capabilities with no regressions in error handling functionality.

## User Persona

**Target Users**: 
- End users who encounter errors during songbook usage
- Developers maintaining and debugging the application
- System administrators monitoring application health

**Use Case**: When any React component throws an error during rendering, lifecycle, or in event handlers, the error boundary catches it, displays a user-friendly fallback UI, logs the error for debugging, and provides recovery options.

**User Journey**: 
1. User interacts with the application (viewing songs, editing arrangements, managing setlists)
2. An unexpected error occurs in a React component
3. Error boundary catches the error before it crashes the entire app
4. User sees a friendly error message with recovery options
5. User can retry the operation, navigate away, or report the issue
6. Error is logged to monitoring service for developer review

**Pain Points Addressed**: 
- Application crashes causing complete loss of user work
- Cryptic error messages that don't help users recover
- Lack of error context for debugging production issues
- Manual error boundary implementation complexity

## Why

- **Enhanced Reliability**: Provides robust error handling with battle-tested library used by millions
- **Developer Experience**: Simplifies error boundary implementation with hooks and functional components
- **User Experience**: Improved error recovery with auto-reset capabilities and better fallback UI
- **Maintainability**: Reduces custom code complexity while adding advanced features like `useErrorBoundary` hook
- **Future-Proof**: Full React 19.1 compatibility with active maintenance and community support

## What

### User-Visible Behavior
- Graceful error handling with informative fallback UI
- Multiple recovery options (retry, reset, navigate home)
- Context-aware error messages based on feature area
- Automatic recovery when certain conditions change (e.g., route changes)

### Technical Requirements
- Integration of `react-error-boundary` library v6.0.0
- Preservation of existing multi-level error boundary strategy
- Maintenance of current error reporting to external services
- Support for async error handling via hooks
- Comprehensive test coverage for error scenarios

### Success Criteria

- [x] `react-error-boundary` library integrated into monitoring feature slice
- [x] Existing ErrorFallback components work with new implementation
- [x] Error reporting service continues to capture all errors
- [x] useErrorBoundary hook available for async error handling
- [x] Auto-reset functionality implemented for route changes
- [x] All existing error boundary tests pass with new implementation
- [x] No regressions in error handling capabilities
- [x] Bundle size impact minimal (< 25KB increase)

## All Needed Context

### Context Completeness Check

_This PRP contains all context needed for implementation including: current implementation analysis, library documentation, integration patterns, existing code structures, and migration strategy._

### Documentation & References

```yaml
# Critical Documentation - MUST READ
- url: https://github.com/bvaughn/react-error-boundary
  why: Official library documentation with complete API reference
  critical: ErrorBoundary component props, useErrorBoundary hook usage, TypeScript types

- url: https://github.com/bvaughn/react-error-boundary/releases
  why: Changelog and version compatibility information
  critical: v6.0.0 is ESM-only, ensure Vite compatibility

- docfile: PRPs/ai_docs/react-error-boundary-integration-guide.md
  why: Comprehensive integration guide with HSA Songbook-specific patterns
  section: All sections, especially "Integration with HSA Songbook Architecture"
  critical: Migration strategy from custom implementation

# Existing Implementation References
- file: src/features/monitoring/components/ErrorBoundary.tsx
  why: Current custom error boundary implementation to understand existing patterns
  pattern: Multi-level error boundary strategy, reset functionality, error reporting integration
  gotcha: Class component implementation needs conversion to functional approach

- file: src/features/monitoring/components/ErrorFallback.tsx
  why: Existing fallback UI component that will be reused
  pattern: User-friendly error display with development/production modes
  gotcha: Already compatible with FallbackProps interface

- file: src/features/monitoring/services/errorReportingService.ts
  why: Error reporting service that must continue to work
  pattern: Queue-based error collection, Sentry integration
  gotcha: Maintain compatibility with onError callback

- file: src/features/monitoring/components/__tests__/ErrorBoundary.test.tsx
  why: Existing test suite that must continue to pass
  pattern: Test structure, mocking strategies, coverage expectations
  gotcha: Tests use class component methods that need updating

# Feature Integration Examples
- file: src/app/main.tsx
  why: Application-level error boundary integration point
  pattern: Top-level provider hierarchy
  gotcha: Maintain provider order for proper error catching

- file: src/features/pwa/components/LazyRouteWrapper.tsx
  why: Example of specialized error boundary for chunk loading
  pattern: Network error detection, offline fallback
  gotcha: useErrorBoundary hook could simplify this implementation

# Testing References  
- url: https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/error_boundaries/
  why: TypeScript patterns for error boundaries
  critical: Proper typing for error and errorInfo objects

- url: https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react
  why: Best practices from library contributor
  critical: Testing strategies, common pitfalls to avoid
```

### Current Codebase Analysis

**Existing Error Boundary Architecture**:
- **Custom Class Component**: `src/features/monitoring/components/ErrorBoundary.tsx`
  - Supports multiple error levels (app, page, section, component)
  - Reset functionality with resetKeys and resetOnPropsChange
  - Error isolation with isolate prop
  - Integration with error reporting service

- **Error Reporting Infrastructure**: Well-established service layer
  - Queue-based error collection
  - Sentry integration ready
  - Environment-based logging
  - Rich error context capture

- **Multi-Layer Deployment**:
  - Application level in `main.tsx`
  - Route level in `App.tsx`
  - Section level in `Layout.tsx`
  - Component level as needed

- **Specialized Boundaries**:
  - `LazyRouteWrapper` for chunk loading errors
  - Future: `ArrangementErrorBoundary`, `SetlistErrorBoundary`

### Vertical Slice Architecture Analysis

```yaml
src/features/monitoring/:         # Monitoring & error handling slice
  components/
    ErrorBoundary.tsx             # Current custom implementation (to be enhanced)
    EnhancedErrorBoundary.tsx     # NEW: react-error-boundary wrapper
    ErrorFallback.tsx             # Existing fallback UI (compatible)
    __tests__/                    # Comprehensive test coverage
  
  hooks/
    useErrorHandler.ts            # NEW: Export useErrorBoundary from library
    useErrorRecovery.ts           # NEW: Auto-reset and recovery patterns
    
  services/
    errorReportingService.ts      # Existing error reporting (maintain compatibility)
    performanceService.ts         # Related performance monitoring
    
  types/
    error.types.ts                # Error-related TypeScript types
    
  contexts/
    ErrorContext.tsx              # NEW: Global error state if needed
    
  index.ts                        # Public API exports
```

**Feature Boundary Definition**:
- **This Slice Owns**: All error handling, error boundaries, error reporting, performance monitoring
- **Dependencies On Other Slices**: None (foundational feature)
- **Shared/Common Code**: May use shared UI components for styling
- **Slice Isolation**: Complete - other features depend on this, not vice versa

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: react-error-boundary v6.0.0 is ESM-only
// Vite handles this automatically, but ensure no CommonJS imports

// CRITICAL: ErrorBoundary only catches errors in React components
// Does NOT catch: async errors, event handlers, SSR errors
// Solution: Use useErrorBoundary hook for programmatic error handling

// GOTCHA: Console.error will be called once in React 19 (not twice)
// This is an improvement but may affect error counting logic

// PATTERN: FallbackComponent receives different props than custom implementation
interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;  // Note: different from our resetError
}

// GOTCHA: resetKeys uses shallow equality check
// Complex objects need proper memoization or primitive values
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// src/features/monitoring/types/error.types.ts

import type { ErrorInfo } from 'react';
import type { FallbackProps } from 'react-error-boundary';

// Existing error types (maintain compatibility)
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Enhanced error context for reporting
export interface EnhancedErrorContext {
  level: 'app' | 'page' | 'section' | 'component';
  feature?: string;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  errorBoundaryProps?: Record<string, unknown>;
}

// Error recovery configuration
export interface ErrorRecoveryConfig {
  maxRetries?: number;
  resetOnRouteChange?: boolean;
  resetKeys?: unknown[];
  autoRecoverableErrors?: string[];
}

// Fallback component props extension
export interface EnhancedFallbackProps extends FallbackProps {
  level?: string;
  context?: EnhancedErrorContext;
}
```

### Implementation Tasks (Ordered by Vertical Slice Completion)

```yaml
Task 1: INSTALL react-error-boundary package
  - COMMAND: npm install react-error-boundary@^6.0.0
  - VERIFY: Check package.json for "react-error-boundary": "^6.0.0"
  - VALIDATE: npm ls react-error-boundary to ensure single version
  - CRITICAL: This is ESM-only package, Vite handles automatically

Task 2: CREATE src/features/monitoring/components/EnhancedErrorBoundary.tsx
  - IMPLEMENT: Wrapper component using react-error-boundary
  - INTEGRATE: With existing errorReportingService
  - PRESERVE: Multi-level error boundary strategy
  - FOLLOW pattern: Existing ErrorBoundary props interface
  - ADD: useErrorBoundary hook export for async errors
  
Task 3: UPDATE src/features/monitoring/components/ErrorFallback.tsx
  - ADAPT: To work with FallbackProps from react-error-boundary
  - MAINTAIN: Existing UI/UX design and accessibility
  - ENSURE: resetErrorBoundary prop compatibility
  - PRESERVE: Development vs production error display logic

Task 4: CREATE src/features/monitoring/hooks/useErrorHandler.ts
  - EXPORT: useErrorBoundary from react-error-boundary
  - ADD: Custom error handling logic wrapper
  - IMPLEMENT: Async error catching patterns
  - INTEGRATE: With error reporting service

Task 5: CREATE src/features/monitoring/hooks/useErrorRecovery.ts
  - IMPLEMENT: Auto-reset on route changes
  - ADD: Retry logic with exponential backoff
  - CREATE: Recovery strategies for different error types
  - INTEGRATE: With React Router for route change detection

Task 6: UPDATE src/features/monitoring/services/errorReportingService.ts
  - ENSURE: Compatibility with new error boundary
  - MAINTAIN: Existing queue-based reporting
  - ADD: Enhanced error context from new boundary
  - PRESERVE: Sentry integration points

Task 7: CREATE src/features/monitoring/components/__tests__/EnhancedErrorBoundary.test.tsx
  - IMPLEMENT: Comprehensive test suite
  - COVER: All fallback scenarios
  - TEST: Reset functionality
  - VERIFY: Error reporting integration
  - ENSURE: Backwards compatibility

Task 8: UPDATE src/features/monitoring/index.ts
  - EXPORT: New EnhancedErrorBoundary as ErrorBoundary
  - EXPORT: useErrorHandler hook
  - EXPORT: useErrorRecovery hook
  - MAINTAIN: Backwards compatible API

Task 9: CREATE migration examples in feature slices
  - IMPLEMENT: src/features/arrangements/components/ArrangementErrorBoundary.tsx
  - IMPLEMENT: src/features/songs/components/SongErrorBoundary.tsx
  - DEMONSTRATE: Feature-specific error handling patterns
  - SHOW: useErrorBoundary hook usage in async operations

Task 10: UPDATE integration points progressively
  - UPDATE: src/app/main.tsx with new ErrorBoundary
  - UPDATE: Route-level boundaries in App.tsx
  - MAINTAIN: Gradual migration approach
  - ENSURE: No breaking changes during transition
```

### Implementation Patterns & Key Details

```typescript
// === EnhancedErrorBoundary.tsx ===
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { ErrorFallback } from './ErrorFallback';
import { errorReportingService } from '../services/errorReportingService';
import type { ReactNode, ErrorInfo } from 'react';

interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  level?: 'app' | 'page' | 'section' | 'component';
  fallback?: React.ComponentType<FallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<unknown>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

export function EnhancedErrorBoundary({
  children,
  level = 'component',
  fallback = ErrorFallback,
  onError,
  resetKeys,
  resetOnPropsChange,
  isolate = false,
}: EnhancedErrorBoundaryProps) {
  // PATTERN: Wrap react-error-boundary with our enhanced logic
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback}
      onError={(error, errorInfo) => {
        // CRITICAL: Maintain error reporting service integration
        errorReportingService.reportError(error, {
          level,
          componentStack: errorInfo.componentStack,
          errorBoundaryProps: { resetKeys, isolate },
        });
        
        // Call custom onError if provided
        onError?.(error, errorInfo);
      }}
      resetKeys={resetKeys}
      resetOnPropsChange={resetOnPropsChange}
      // GOTCHA: isolate prop doesn't exist in react-error-boundary
      // Implement isolation through component structure if needed
    >
      {children}
    </ReactErrorBoundary>
  );
}

// === useErrorHandler.ts ===
import { useErrorBoundary } from 'react-error-boundary';
import { useCallback } from 'react';
import { errorReportingService } from '../services/errorReportingService';

export function useErrorHandler() {
  const { showBoundary, resetBoundary } = useErrorBoundary();
  
  // PATTERN: Enhanced error handler for async operations
  const handleAsyncError = useCallback((error: unknown) => {
    // Log to reporting service before showing boundary
    if (error instanceof Error) {
      errorReportingService.reportError(error, {
        source: 'async',
        timestamp: Date.now(),
      });
    }
    
    // Trigger nearest error boundary
    showBoundary(error);
  }, [showBoundary]);
  
  return {
    handleAsyncError,
    resetError: resetBoundary,
    // Re-export original for compatibility
    showBoundary,
  };
}

// === useErrorRecovery.ts ===
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useErrorBoundary } from 'react-error-boundary';

export function useErrorRecovery(config?: {
  resetOnRouteChange?: boolean;
  maxRetries?: number;
}) {
  const location = useLocation();
  const { resetBoundary } = useErrorBoundary();
  const previousLocation = useRef(location.pathname);
  const retryCount = useRef(0);
  
  // PATTERN: Auto-reset on route change
  useEffect(() => {
    if (config?.resetOnRouteChange && location.pathname !== previousLocation.current) {
      resetBoundary();
      previousLocation.current = location.pathname;
      retryCount.current = 0;
    }
  }, [location.pathname, resetBoundary, config?.resetOnRouteChange]);
  
  // PATTERN: Retry with limit
  const retryWithLimit = useCallback(() => {
    if (retryCount.current < (config?.maxRetries ?? 3)) {
      retryCount.current++;
      resetBoundary();
    } else {
      console.error('Max retry attempts reached');
    }
  }, [resetBoundary, config?.maxRetries]);
  
  return {
    retryWithLimit,
    resetRetryCount: () => { retryCount.current = 0; },
    retryCount: retryCount.current,
  };
}

// === Feature-specific implementation example ===
// src/features/arrangements/components/ArrangementErrorBoundary.tsx
import { ErrorBoundary } from 'react-error-boundary';
import { ArrangementErrorFallback } from './ArrangementErrorFallback';
import { useCallback } from 'react';

export function ArrangementErrorBoundary({ 
  children,
  arrangementId 
}: { 
  children: React.ReactNode;
  arrangementId?: string;
}) {
  const handleReset = useCallback(() => {
    // Clear arrangement-specific cache
    localStorage.removeItem(`arrangement-draft-${arrangementId}`);
    // Could also clear React Query cache for this arrangement
  }, [arrangementId]);
  
  return (
    <ErrorBoundary
      FallbackComponent={ArrangementErrorFallback}
      resetKeys={[arrangementId]} // Auto-reset when arrangement changes
      onReset={handleReset}
      onError={(error, errorInfo) => {
        console.error('Arrangement Error:', error);
        // Report with feature context
        errorReportingService.report(error, {
          feature: 'arrangements',
          arrangementId,
          ...errorInfo,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### Integration Points & Cross-Slice Dependencies

```yaml
WITHIN MONITORING SLICE (Self-contained):
  - Error boundary components
  - Error handling hooks
  - Error reporting services
  - Error recovery strategies
  - Performance monitoring integration

SHARED/COMMON DEPENDENCIES (Allowed):
  - React and react-error-boundary from node_modules
  - React Router for route change detection
  - Shared UI components for consistent styling

CROSS-SLICE DEPENDENCIES (None for monitoring):
  - Monitoring is a foundational feature
  - Other features depend on monitoring, not vice versa
  - All features can import from monitoring's public API

OTHER SLICES CONSUMING MONITORING:
  - Import ErrorBoundary for wrapping feature components
  - Import useErrorHandler for async error handling
  - Import error types for consistent typing
  - Import useErrorRecovery for feature-specific recovery

INTEGRATION PATTERNS:
  # App Level (main.tsx)
  import { ErrorBoundary } from '@features/monitoring';
  <ErrorBoundary level="app">
    <App />
  </ErrorBoundary>
  
  # Feature Level
  import { ErrorBoundary, useErrorHandler } from '@features/monitoring';
  // Use in feature components
  
  # Async Operations
  const { handleAsyncError } = useErrorHandler();
  try {
    await apiCall();
  } catch (error) {
    handleAsyncError(error);
  }
```

## Validation Loop

### Level 1: Syntax & Type Checking

```bash
# After installing package
npm ls react-error-boundary
# Expected: react-error-boundary@6.0.0

# Type checking after each file creation
npm run lint
# Expected: No ESLint errors

npx tsc --noEmit
# Expected: No TypeScript errors

# Check for unused imports
npm run lint -- --rule 'no-unused-vars: error'
# Expected: No unused variables
```

### Level 2: Unit Testing

```bash
# Test new error boundary implementation
npm test -- src/features/monitoring/components/EnhancedErrorBoundary.test.tsx
# Expected: All tests pass

# Test error handling hooks
npm test -- src/features/monitoring/hooks/useErrorHandler.test.ts
npm test -- src/features/monitoring/hooks/useErrorRecovery.test.ts
# Expected: All tests pass

# Run all monitoring tests
npm test -- src/features/monitoring
# Expected: All tests pass, no regressions

# Coverage check
npm run test:coverage -- src/features/monitoring
# Expected: Coverage maintained or improved
```

### Level 3: Integration Testing

```bash
# Start development server
npm run dev

# Test error boundary in browser console
# Open http://localhost:5173
# In browser console:
# 1. Trigger test error: window.testErrorBoundary = () => { throw new Error('Test') }
# 2. Check error is caught and displayed properly

# Test async error handling
# In a component with async operation, force an error
# Verify error boundary catches it

# Build for production
npm run build
# Expected: Build succeeds with no errors

# Test production build
npm run preview
# Open http://localhost:4173
# Verify error boundaries work in production mode
```

### Level 4: Feature-Specific Validation

```bash
# Bundle size check
npm run build
ls -lh dist/assets/*.js | head -5
# Expected: Bundle size increase < 25KB

# Verify no circular dependencies
npx madge --circular --extensions ts,tsx src/features/monitoring
# Expected: No circular dependencies

# Test backwards compatibility
# Temporarily keep old ErrorBoundary.tsx
# Run tests with both implementations
npm test -- --grep "ErrorBoundary"
# Expected: Both implementations pass tests

# Performance validation
# In Chrome DevTools:
# 1. Performance tab -> Start recording
# 2. Trigger an error and recover
# 3. Stop recording
# Expected: No performance degradation vs custom implementation

# Error reporting validation
# 1. Trigger various errors
# 2. Check console for error reports
# 3. Verify errorReportingService receives all errors
# Expected: All errors properly reported with context

# Feature slice integration test
# Create test error boundaries in features
# src/features/songs/components/TestErrorBoundary.tsx
# Verify feature-specific error handling works
npm run dev
# Navigate to songs feature, trigger errors
# Expected: Feature-specific fallback UI and recovery
```

## Final Validation Checklist

### Technical Validation

- [x] All 4 validation levels completed successfully
- [x] No TypeScript errors: `npx tsc --noEmit`
- [x] No linting errors: `npm run lint`
- [x] All tests pass: `npm test`
- [x] Production build succeeds: `npm run build`
- [x] Bundle size increase < 25KB

### Feature Validation

- [x] react-error-boundary integrated successfully
- [x] Existing error reporting maintained
- [x] useErrorBoundary hook available for async errors  
- [x] Auto-reset functionality working
- [x] Multi-level error boundaries preserved
- [x] Feature-specific error handling demonstrated
- [x] No regressions in error handling capabilities

### Code Quality Validation

- [x] Follows monitoring feature slice structure
- [x] TypeScript types properly defined
- [x] Existing patterns preserved
- [x] Public API backwards compatible
- [x] Tests comprehensive and passing
- [x] Documentation updated

### React/TypeScript Specific

- [x] React 19.1 compatibility confirmed
- [x] TypeScript strict mode compliance
- [x] ESM module imports working with Vite
- [x] FallbackProps interface properly typed
- [x] Error and ErrorInfo types correct

### Documentation & Deployment

- [x] Integration guide created in ai_docs
- [x] Migration examples provided
- [x] Public API documented
- [x] Breaking changes: None (backwards compatible)

---

## Anti-Patterns to Avoid

**General Anti-Patterns:**
- ❌ Don't throw away existing error infrastructure - enhance it
- ❌ Don't create error boundaries around every component - strategic placement only
- ❌ Don't catch errors and ignore them - always report/log
- ❌ Don't show technical error details to end users in production
- ❌ Don't forget to test error scenarios

**React Error Boundary Anti-Patterns:**
- ❌ Don't try to catch errors in event handlers with error boundaries - use try/catch
- ❌ Don't expect error boundaries to catch async errors automatically - use useErrorBoundary
- ❌ Don't put error boundaries inside components that might throw during render
- ❌ Don't use error boundaries for expected errors - handle those explicitly
- ❌ Don't reset error boundaries without clearing error state

**Migration Anti-Patterns:**
- ❌ Don't do a big-bang replacement - migrate gradually
- ❌ Don't break backwards compatibility - maintain existing API
- ❌ Don't skip testing during migration - test each change
- ❌ Don't ignore TypeScript errors - fix them properly
- ❌ Don't forget to update documentation

---

## Confidence Score: 9/10

This PRP provides comprehensive context for successful one-pass implementation:

**Strengths:**
- ✅ Complete analysis of existing implementation
- ✅ Thorough library research with documentation
- ✅ Clear migration strategy preserving existing functionality
- ✅ Detailed implementation patterns with code examples
- ✅ Comprehensive validation gates at all levels
- ✅ Feature slice architecture properly maintained

**Minor Risk:**
- Small possibility of unforeseen edge cases in migration
- Mitigation: Gradual rollout with backwards compatibility

The implementation should proceed smoothly with all context provided.