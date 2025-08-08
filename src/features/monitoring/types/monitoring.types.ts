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