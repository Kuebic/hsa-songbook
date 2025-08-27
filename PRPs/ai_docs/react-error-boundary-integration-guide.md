# React Error Boundary Integration Guide

## Library Overview
**Package**: react-error-boundary v6.0.0  
**Author**: Brian Vaughn (React Core Team)  
**License**: MIT  
**Size**: 21.9 kB unpacked  
**Weekly Downloads**: 6.7M+  
**React Compatibility**: React 16.8+ (including React 19.1)  

## Core Features
- Functional component support (no class components needed)
- Built-in reset functionality
- Multiple fallback UI strategies
- Full TypeScript support
- Lightweight with minimal performance overhead
- Works with all React renderers (DOM, Native, etc.)

## Installation
```bash
npm install react-error-boundary
```

## TypeScript Types

```typescript
interface ErrorBoundaryProps {
  fallback?: React.ComponentType<any> | React.ReactElement | null;
  fallbackRender?: (props: FallbackProps) => React.ReactNode;
  FallbackComponent?: React.ComponentType<FallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: (details: { reason: string; args: Array<unknown> }) => void;
  resetKeys?: Array<unknown>;
  resetOnPropsChange?: boolean;
  isolateErrorBoundary?: boolean;
  children: React.ReactNode;
}

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}
```

## Basic Implementation

### Simple Error Boundary
```typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <YourApp />
    </ErrorBoundary>
  );
}
```

### With Error Logging
```typescript
function logErrorToService(error: Error, errorInfo: ErrorInfo) {
  console.error('Caught error:', error, errorInfo);
  // Send to error reporting service
}

<ErrorBoundary 
  FallbackComponent={ErrorFallback}
  onError={logErrorToService}
>
  <App />
</ErrorBoundary>
```

## Advanced Patterns

### useErrorBoundary Hook
Programmatically trigger error boundaries from async operations:

```typescript
import { useErrorBoundary } from 'react-error-boundary';

function AsyncComponent() {
  const { showBoundary } = useErrorBoundary();

  async function handleSubmit() {
    try {
      await fetchData();
    } catch (error) {
      showBoundary(error);
    }
  }

  return <button onClick={handleSubmit}>Submit</button>;
}
```

### Auto-Reset Pattern
Reset error boundary when specific props change:

```typescript
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  resetKeys={[userId]}  // Reset when userId changes
  onReset={() => {
    // Clean up any cached state
    clearCache();
  }}
>
  <UserDashboard userId={userId} />
</ErrorBoundary>
```

### Multiple Error Boundaries
Layer error boundaries for granular error handling:

```typescript
// App-level boundary
<ErrorBoundary FallbackComponent={AppErrorFallback}>
  <Router>
    {/* Page-level boundaries */}
    <Route path="/songs" element={
      <ErrorBoundary FallbackComponent={PageErrorFallback}>
        <SongsPage />
      </ErrorBoundary>
    } />
  </Router>
</ErrorBoundary>
```

## Testing Strategies

### Unit Testing with Vitest
```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from 'react-error-boundary';
import { vi } from 'vitest';

function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  const originalError = console.error;
  
  beforeAll(() => {
    console.error = vi.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
  });

  it('catches and displays errors', () => {
    render(
      <ErrorBoundary fallback={<div>Error caught</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error caught')).toBeInTheDocument();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary fallback={<div>Error caught</div>}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
```

## Performance Considerations

### Bundle Impact
- **Size**: 21.9 kB unpacked (minimal for the functionality provided)
- **Runtime**: Zero performance impact during normal operation
- **Memory**: Only stores error state when an error occurs

### Best Practices
1. Place error boundaries strategically - not around every component
2. Use multiple boundaries for different error contexts
3. Log errors to monitoring services in production
4. Provide meaningful fallback UI with recovery options
5. Test error scenarios thoroughly

## React 19.1 Compatibility

### Confirmed Working Features
- ✅ All core ErrorBoundary functionality
- ✅ Hooks (useErrorBoundary)
- ✅ TypeScript support with React 19 types
- ✅ Server Components compatibility with "use client"
- ✅ Improved error logging (no duplicate console errors)

### React 19 Improvements
- Single error logging instead of duplicate errors
- Better error context preservation
- Enhanced componentStack information
- Works seamlessly with React 19's improved error handling

## Integration with HSA Songbook Architecture

### Recommended Implementation Strategy

1. **Replace Custom ErrorBoundary Gradually**
   - Keep existing monitoring/components/ErrorBoundary.tsx during transition
   - Implement react-error-boundary in new features first
   - Migrate existing features incrementally

2. **Leverage Existing Infrastructure**
   - Use existing ErrorFallback components as FallbackComponent
   - Integrate with existing errorReportingService
   - Maintain multi-level error boundary strategy

3. **Feature-Specific Error Boundaries**
   ```typescript
   // features/arrangements/components/ArrangementErrorBoundary.tsx
   import { ErrorBoundary } from 'react-error-boundary';
   import { ArrangementErrorFallback } from './ArrangementErrorFallback';
   
   export function ArrangementErrorBoundary({ children }: { children: React.ReactNode }) {
     return (
       <ErrorBoundary
         FallbackComponent={ArrangementErrorFallback}
         resetKeys={['arrangement']}
         onError={(error, errorInfo) => {
           errorReportingService.report(error, {
             feature: 'arrangements',
             ...errorInfo
           });
         }}
       >
         {children}
       </ErrorBoundary>
     );
   }
   ```

## Migration Path from Custom Implementation

### Phase 1: Add Library
```bash
npm install react-error-boundary
```

### Phase 2: Create Wrapper Component
```typescript
// features/monitoring/components/EnhancedErrorBoundary.tsx
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './ErrorFallback';
import { errorReportingService } from '../services/errorReportingService';

export function EnhancedErrorBoundary({ 
  children,
  level = 'component' 
}: { 
  children: React.ReactNode;
  level?: 'app' | 'page' | 'section' | 'component';
}) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        errorReportingService.report(error, {
          level,
          ...errorInfo
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### Phase 3: Update Feature Slices
Replace custom ErrorBoundary usage in each feature slice with the new implementation.

## Documentation Resources

### Official Sources
- **GitHub**: https://github.com/bvaughn/react-error-boundary
- **NPM**: https://www.npmjs.com/package/react-error-boundary
- **Changelog**: https://github.com/bvaughn/react-error-boundary/releases

### Integration Guides
- **React Docs**: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- **Sentry Integration**: https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/
- **TypeScript Patterns**: https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/error_boundaries/

### Tutorials & Best Practices
- **LogRocket Guide**: https://blog.logrocket.com/react-error-handling-react-error-boundary/
- **Kent C. Dodds Article**: https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react
- **Refine.dev Tutorial**: https://refine.dev/blog/react-error-boundaries/

## Key Takeaways

1. **Production Ready**: 6.7M+ weekly downloads, actively maintained
2. **Developer Experience**: Simple API, great TypeScript support
3. **Performance**: Minimal overhead, only active during errors
4. **Flexibility**: Multiple fallback strategies, hooks for async errors
5. **Testing**: Easy to test with standard React testing tools
6. **Future Proof**: Full React 19.1 compatibility

This library is the recommended solution for error boundaries in modern React applications, providing a robust, well-tested alternative to custom implementations.