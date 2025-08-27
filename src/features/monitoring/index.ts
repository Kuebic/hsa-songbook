// Monitoring Feature Module

// Components
// Export both for backwards compatibility during migration
export { ErrorBoundary } from './components/ErrorBoundary'; // Legacy class-based implementation
export { EnhancedErrorBoundary } from './components/EnhancedErrorBoundary'; // New react-error-boundary implementation
export { EnhancedErrorBoundary as ErrorBoundaryV2 } from './components/EnhancedErrorBoundary'; // Alias for clearer migration
export { ErrorFallback } from './components/ErrorFallback';
export { PerformanceMonitor } from './components/PerformanceMonitor';

// Hooks
export { useErrorHandler } from './hooks/useErrorHandler'; // Enhanced with react-error-boundary integration
export { useErrorRecovery } from './hooks/useErrorRecovery'; // New recovery strategies hook
export { useWebVitals } from './hooks/useWebVitals';

// Re-export useErrorBoundary hook from react-error-boundary for convenience
export { useErrorBoundary } from 'react-error-boundary';

// Services
export { errorReportingService } from './services/errorReportingService';
export { performanceService } from './services/performanceService';

// Types
export type {
  ErrorInfo,
  PerformanceMetric,
  ErrorBoundaryState,
  ErrorFallbackProps,
  ErrorBoundaryProps,
  WebVitalsReporter
} from './types/monitoring.types';

// Re-export FallbackProps from react-error-boundary for convenience
export type { FallbackProps } from 'react-error-boundary';