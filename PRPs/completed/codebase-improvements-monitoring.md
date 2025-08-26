# PRP: Codebase Improvements - Monitoring & Error Handling

## Feature: Complete High-Priority Recommendations from Codebase Review

Implement comprehensive monitoring, error handling, and performance tracking infrastructure following the codebase review recommendations. This PRP creates a new `monitoring` feature slice following the established vertical slice architecture pattern.

## Context & Research

### Codebase Review Recommendations (High Priority)
1. **Fix Test Coverage**: Resolve vitest coverage configuration error
2. **Add Error Boundaries**: Implement React error boundaries for better UX
3. **Performance Monitoring**: Add web vitals tracking
4. **Bundle Analysis**: Implement bundle size monitoring

### Current State Analysis

#### Test Configuration Issue
- **Problem**: Coverage disabled by default, `TypeError: input.replace is not a function` error
- **Root Cause**: Coverage is set to `enabled: false` in vitest.config.ts
- **Solution**: Enable coverage and fix configuration

#### Vertical Slice Architecture Pattern
The codebase follows a strict vertical slice architecture. Each feature contains:
```
feature-name/
├── components/       # UI components
├── hooks/           # Business logic hooks  
├── pages/           # Feature pages
├── services/        # API/external services
├── types/           # TypeScript definitions
├── utils/           # Feature utilities
├── __tests__/       # Co-located tests
└── index.ts        # Public API exports
```

Reference implementation: `/src/features/songs/` and `/src/features/pwa/`

#### React 19 Error Handling Changes
- Error boundaries continue to work with `getDerivedStateFromError()` and `componentDidCatch()`
- React 19 reduced error duplication (single error instead of three)
- Uncaught errors report to `window.reportError`
- Caught errors report to `console.error`

### External Documentation

#### Error Boundaries
- **React Documentation**: https://react.dev/reference/react/Component
- **React 19 Changes**: https://react.dev/blog/2024/12/05/react-19
- **react-error-boundary**: https://github.com/bvaughn/react-error-boundary
- **TypeScript Guide**: https://github.com/typescript-cheatsheets/react/blob/main/docs/basic/getting-started/error-boundaries.md

#### Web Vitals
- **Official Package**: https://www.npmjs.com/package/web-vitals
- **Google Guide**: https://web.dev/articles/vitals
- **2025 Core Metrics**: LCP < 2.5s, INP < 200ms, CLS < 0.1

#### Bundle Analysis
- **rollup-plugin-visualizer**: https://github.com/btd/rollup-plugin-visualizer
- **vite-bundle-visualizer**: https://www.npmjs.com/package/vite-bundle-visualizer

## Implementation Blueprint

### Phase 1: Fix Test Coverage Configuration

#### 1.1 Update vitest.config.ts
```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/shared/test-utils/setup.ts',
    include: ['src/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}', 'src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    isolate: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true
      }
    },
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    coverage: {
      enabled: true, // CHANGE: Enable coverage by default
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'], // ADD: lcov for CI integration
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/shared/test-utils/**',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/*.types.ts',
        '**/index.ts',
        '**/__tests__/**',
        '**/__mocks__/**',
        'src/main.tsx', // Entry point
        'src/vite-env.d.ts'
      ],
      thresholds: { // ADD: Coverage thresholds
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  }
})
```

#### 1.2 Update package.json scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ci": "vitest run --coverage --reporter=json --reporter=default"
  }
}
```

### Phase 2: Create Monitoring Feature Slice

#### 2.1 Directory Structure
```
src/features/monitoring/
├── components/
│   ├── ErrorBoundary.tsx
│   ├── ErrorFallback.tsx
│   ├── PerformanceMonitor.tsx
│   └── __tests__/
│       ├── ErrorBoundary.test.tsx
│       └── ErrorFallback.test.tsx
├── hooks/
│   ├── useErrorHandler.ts
│   ├── useWebVitals.ts
│   └── __tests__/
│       └── useWebVitals.test.ts
├── services/
│   ├── errorReportingService.ts
│   └── performanceService.ts
├── types/
│   └── monitoring.types.ts
├── utils/
│   ├── webVitalsReporter.ts
│   └── errorLogger.ts
└── index.ts
```

#### 2.2 Install Dependencies
```bash
npm install web-vitals react-error-boundary
npm install -D rollup-plugin-visualizer @types/web-vitals
```

#### 2.3 Types Definition (types/monitoring.types.ts)
```typescript
import type { Metric } from 'web-vitals';

export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  id: string;
  attribution?: Record<string, unknown>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorBoundaryKey: number;
}

export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  errorInfo?: React.ErrorInfo;
}

export type WebVitalsReporter = (metric: Metric) => void;
```

#### 2.4 Error Boundary Component (components/ErrorBoundary.tsx)
```typescript
import React, { type Component, ReactNode, ErrorInfo as ReactErrorInfo } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { errorReportingService } from '../services/errorReportingService';
import type { ErrorBoundaryState, ErrorFallbackProps } from '../types/monitoring.types';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ReactErrorInfo) => void;
  level?: 'app' | 'page' | 'section' | 'component';
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorBoundaryKey: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary Caught:', error, errorInfo);
    }
    
    // Report to monitoring service
    errorReportingService.reportError(error, {
      componentStack: errorInfo.componentStack,
      level,
      timestamp: Date.now()
    });
    
    // Call custom error handler
    onError?.(error, errorInfo);
    
    // Update state with error info
    this.setState({ errorInfo });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError) {
      // Reset on prop changes if configured
      if (resetOnPropsChange && prevProps.children !== this.props.children) {
        this.resetErrorBoundary();
      }
      
      // Reset on key changes
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorBoundaryKey: prevState.errorBoundaryKey + 1
    }));
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback: Fallback = ErrorFallback, isolate } = this.props;

    if (hasError && error) {
      const errorProps: ErrorFallbackProps = {
        error,
        resetErrorBoundary: this.resetErrorBoundary,
        errorInfo
      };

      if (isolate) {
        // Isolate the error to prevent cascading
        return (
          <div style={{ isolation: 'isolate' }}>
            <Fallback {...errorProps} />
          </div>
        );
      }

      return <Fallback {...errorProps} />;
    }

    return <>{children}</>;
  }
}
```

#### 2.5 Error Fallback Component (components/ErrorFallback.tsx)
```typescript
import React from 'react';
import type { ErrorFallbackProps } from '../types/monitoring.types';

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div role="alert" style={styles.container}>
      <div style={styles.content}>
        <h2 style={styles.title}>Oops! Something went wrong</h2>
        <p style={styles.message}>
          We're sorry for the inconvenience. The application encountered an unexpected error.
        </p>
        
        {import.meta.env.DEV && (
          <details style={styles.details}>
            <summary style={styles.summary}>Error Details (Development Only)</summary>
            <pre style={styles.errorStack}>{error.message}</pre>
            <pre style={styles.errorStack}>{error.stack}</pre>
          </details>
        )}
        
        <div style={styles.actions}>
          <button onClick={resetErrorBoundary} style={styles.button}>
            Try Again
          </button>
          <button onClick={() => window.location.href = '/'} style={styles.buttonSecondary}>
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '2rem',
    backgroundColor: '#f9fafb'
  },
  content: {
    maxWidth: '600px',
    textAlign: 'center' as const,
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '1rem'
  },
  message: {
    color: '#6b7280',
    marginBottom: '1.5rem',
    lineHeight: 1.6
  },
  details: {
    marginTop: '1rem',
    marginBottom: '1rem',
    textAlign: 'left' as const,
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '4px',
    padding: '1rem'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 500,
    color: '#991b1b',
    marginBottom: '0.5rem'
  },
  errorStack: {
    fontSize: '0.875rem',
    overflow: 'auto',
    backgroundColor: '#fee2e2',
    padding: '0.5rem',
    borderRadius: '4px',
    marginTop: '0.5rem'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center'
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer'
  }
};
```

#### 2.6 Web Vitals Hook (hooks/useWebVitals.ts)
```typescript
import { useEffect } from 'react';
import type { Metric } from 'web-vitals';
import { performanceService } from '../services/performanceService';

export function useWebVitals(reporter?: (metric: Metric) => void) {
  useEffect(() => {
    // Only load in production
    if (import.meta.env.PROD) {
      // Lazy load web-vitals to avoid affecting initial bundle
      import('web-vitals/attribution').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
        const handleMetric = (metric: Metric) => {
          // Report to custom reporter if provided
          reporter?.(metric);
          
          // Always report to performance service
          performanceService.reportMetric(metric);
        };

        // Core Web Vitals
        onCLS(handleMetric); // Cumulative Layout Shift
        onINP(handleMetric); // Interaction to Next Paint (replaced FID)
        onLCP(handleMetric); // Largest Contentful Paint
        
        // Additional metrics
        onFCP(handleMetric); // First Contentful Paint
        onTTFB(handleMetric); // Time to First Byte
      });
    }
  }, [reporter]);
}
```

#### 2.7 Performance Service (services/performanceService.ts)
```typescript
import type { Metric } from 'web-vitals';

class PerformanceService {
  private buffer: Metric[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  reportMetric(metric: Metric) {
    // Add to buffer
    this.buffer.push(metric);
    
    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric);
    }
    
    // Schedule flush
    this.scheduleFlush();
  }

  private scheduleFlush() {
    if (this.flushTimer) return;
    
    this.flushTimer = setTimeout(() => {
      this.flush();
      this.flushTimer = null;
    }, 5000); // Flush every 5 seconds
  }

  private flush() {
    if (this.buffer.length === 0) return;
    
    const metrics = [...this.buffer];
    this.buffer = [];
    
    // Send to analytics service
    if (typeof window !== 'undefined' && 'gtag' in window) {
      metrics.forEach(metric => {
        (window as any).gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_category: 'Web Vitals',
          event_label: metric.id,
          non_interaction: true
        });
      });
    }
    
    // Send to custom endpoint
    if (import.meta.env.VITE_METRICS_ENDPOINT) {
      fetch(import.meta.env.VITE_METRICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, timestamp: Date.now() })
      }).catch(error => {
        console.error('Failed to send metrics:', error);
      });
    }
  }

  // Get current metrics snapshot
  getSnapshot() {
    return [...this.buffer];
  }
}

export const performanceService = new PerformanceService();
```

#### 2.8 Error Reporting Service (services/errorReportingService.ts)
```typescript
interface ErrorContext {
  componentStack?: string;
  level?: string;
  timestamp: number;
  [key: string]: unknown;
}

class ErrorReportingService {
  private errorQueue: Array<{ error: Error; context: ErrorContext }> = [];

  reportError(error: Error, context: ErrorContext) {
    // Add to queue
    this.errorQueue.push({ error, context });
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error reported:', error, context);
    }
    
    // Send to monitoring service
    this.sendToMonitoring(error, context);
  }

  private sendToMonitoring(error: Error, context: ErrorContext) {
    // Example: Sentry integration
    if (typeof window !== 'undefined' && 'Sentry' in window) {
      (window as any).Sentry.captureException(error, {
        extra: context,
        level: context.level || 'error'
      });
    }
    
    // Custom error endpoint
    if (import.meta.env.VITE_ERROR_ENDPOINT) {
      fetch(import.meta.env.VITE_ERROR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(err => {
        console.error('Failed to report error:', err);
      });
    }
  }

  getErrorHistory() {
    return [...this.errorQueue];
  }

  clearErrorHistory() {
    this.errorQueue = [];
  }
}

export const errorReportingService = new ErrorReportingService();
```

#### 2.9 Public API (index.ts)
```typescript
// Monitoring Feature Module

// Components
export { ErrorBoundary } from './components/ErrorBoundary';
export { ErrorFallback } from './components/ErrorFallback';
export { PerformanceMonitor } from './components/PerformanceMonitor';

// Hooks
export { useErrorHandler } from './hooks/useErrorHandler';
export { useWebVitals } from './hooks/useWebVitals';

// Services
export { errorReportingService } from './services/errorReportingService';
export { performanceService } from './services/performanceService';

// Types
export type {
  ErrorInfo,
  PerformanceMetric,
  ErrorBoundaryState,
  ErrorFallbackProps,
  WebVitalsReporter
} from './types/monitoring.types';
```

### Phase 3: Integrate Monitoring into App

#### 3.1 Update App.tsx
```typescript
import { ErrorBoundary, useWebVitals } from '@features/monitoring';

function App() {
  // Initialize web vitals monitoring
  useWebVitals();

  return (
    <ErrorBoundary level="app">
      <BrowserRouter>
        {/* Existing app content */}
        <Routes>
          <Route path="/" element={
            <ErrorBoundary level="page">
              <HomePage />
            </ErrorBoundary>
          } />
          {/* Other routes with error boundaries */}
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

#### 3.2 Update Layout.tsx
```typescript
import { ErrorBoundary } from '@features/monitoring';

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <ErrorBoundary level="section" isolate>
        <Header />
      </ErrorBoundary>
      
      <main>
        <ErrorBoundary level="section">
          {children}
        </ErrorBoundary>
      </main>
      
      <ErrorBoundary level="section" isolate>
        <Footer />
      </ErrorBoundary>
    </div>
  );
}
```

### Phase 4: Add Bundle Analysis

#### 4.1 Update vite.config.ts
```typescript
import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // existing PWA config
    }),
    // Bundle analysis plugin
    visualizer({
      filename: 'dist/stats.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
      title: 'HSA Songbook - Bundle Analysis'
    }) as PluginOption
  ],
  build: {
    sourcemap: true, // Enable for accurate bundle analysis
    rollupOptions: {
      output: {
        manualChunks: {
          'clerk': ['@clerk/clerk-react'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'monitoring': ['web-vitals', 'react-error-boundary']
        }
      }
    }
  },
  // existing config...
});
```

#### 4.2 Add Bundle Analysis Script
```json
// package.json
{
  "scripts": {
    "analyze": "npm run build && open dist/stats.html",
    "analyze:ci": "npm run build && npx vite-bundle-visualizer --format json > bundle-stats.json"
  }
}
```

### Phase 5: CI/CD Integration

#### 5.1 Create GitHub Action for Bundle Analysis
```yaml
# .github/workflows/bundle-analysis.yml
name: Bundle Analysis

on:
  pull_request:
    branches: [main]

jobs:
  bundle-analysis:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build and analyze bundle
        run: |
          npm run build
          npx vite-bundle-visualizer --format json > bundle-stats.json
      
      - name: Upload bundle stats
        uses: actions/upload-artifact@v4
        with:
          name: bundle-stats
          path: |
            dist/stats.html
            bundle-stats.json
      
      - name: Comment PR with bundle size
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const stats = JSON.parse(fs.readFileSync('bundle-stats.json', 'utf8'));
            const totalSize = stats.bundleSize;
            const comment = `📦 Bundle Size Report\n\nTotal Size: ${totalSize}`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

#### 5.2 Create GitHub Action for Test Coverage
```yaml
# .github/workflows/test-coverage.yml
name: Test Coverage

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  coverage:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm run test:ci
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true
```

## Validation Gates

Execute these commands in sequence to validate the implementation:

### Level 1: Configuration Validation
```bash
# Verify test coverage is working
npm run test:coverage
# Should show coverage report without errors

# Verify bundle analysis is configured
npm run build
# Should generate dist/stats.html

# Check TypeScript compilation
npx tsc --noEmit
# Should complete without errors
```

### Level 2: Feature Validation
```bash
# Run all tests including new monitoring tests
npm test
# All tests should pass

# Test error boundary in development
npm run dev
# Manually trigger an error and verify fallback UI

# Check web vitals logging
npm run build && npm run preview
# Open console and verify web vitals are logged
```

### Level 3: Integration Validation
```bash
# Full linting check
npm run lint
# Should show zero errors

# Production build
npm run build
# Should complete successfully

# Preview production build
npm run preview
# Test error boundaries and performance monitoring
```

### Level 4: CI/CD Validation
```bash
# Simulate CI test run
npm run test:ci
# Should generate coverage reports

# Generate bundle analysis
npm run analyze:ci
# Should create bundle-stats.json

# Check all validation gates pass
npm run lint && npm run test:coverage && npm run build
# All commands should succeed
```

## Success Criteria

1. ✅ Test coverage enabled and working without errors
2. ✅ Coverage thresholds enforced (70% minimum)
3. ✅ Error boundaries implemented at multiple levels (app, page, section)
4. ✅ User-friendly error fallback UI with recovery options
5. ✅ Web vitals monitoring integrated and reporting metrics
6. ✅ Bundle analysis visualization available
7. ✅ All tests passing including new monitoring tests
8. ✅ Zero ESLint errors maintained
9. ✅ CI/CD workflows created for coverage and bundle analysis
10. ✅ Production build successful with all features integrated

## Implementation Order

1. **Fix test coverage configuration** (Phase 1)
2. **Create monitoring feature slice structure** (Phase 2.1)
3. **Install dependencies** (Phase 2.2)
4. **Implement types and services** (Phase 2.3, 2.7, 2.8)
5. **Create ErrorBoundary and ErrorFallback components** (Phase 2.4, 2.5)
6. **Implement useWebVitals hook** (Phase 2.6)
7. **Create public API exports** (Phase 2.9)
8. **Write comprehensive tests for monitoring features**
9. **Integrate monitoring into App and Layout** (Phase 3)
10. **Add bundle analysis to Vite config** (Phase 4)
11. **Create CI/CD workflows** (Phase 5)
12. **Run all validation gates**

## Risk Mitigation

- **Test Coverage Errors**: If coverage still fails, check for conflicting vitest versions
- **Error Boundary Issues**: Test in production mode as development behavior differs
- **Web Vitals Not Reporting**: Ensure lazy loading and production-only checks
- **Bundle Size Increase**: Monitor the monitoring package impact (should be < 20KB)
- **CI/CD Failures**: Ensure GitHub Actions permissions are configured

## Notes

- This implementation follows the established vertical slice architecture pattern
- Error boundaries are strategically placed, not just one global boundary
- Web vitals are lazy-loaded to avoid impacting initial bundle
- Bundle analysis is automated in CI/CD for continuous monitoring
- All code follows existing TypeScript strict mode and ESLint configurations

## References

- Existing vertical slice pattern: `/src/features/songs/` and `/src/features/pwa/`
- Test setup: `/src/shared/test-utils/setup.ts`
- TypeScript config: `/tsconfig.app.json`
- Vite config: `/vite.config.ts`

---

**Confidence Score: 9/10**

This PRP provides comprehensive context, clear implementation steps following existing patterns, and executable validation gates. The only uncertainty is potential edge cases in CI/CD integration which may require minor adjustments based on repository settings.