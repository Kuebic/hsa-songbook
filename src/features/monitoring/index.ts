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