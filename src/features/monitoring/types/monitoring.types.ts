import type { Metric } from 'web-vitals';
import type { ReactNode, ErrorInfo as ReactErrorInfo } from 'react';
import type { FallbackProps } from 'react-error-boundary';

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

// Maintains compatibility with existing code while aliasing to react-error-boundary's FallbackProps
export interface ErrorFallbackProps extends FallbackProps {
  errorInfo?: React.ErrorInfo; // Additional prop for backwards compatibility
}

// ErrorBoundaryProps for backwards compatibility with existing API
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ReactErrorInfo) => void;
  level?: 'app' | 'page' | 'section' | 'component';
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

export type WebVitalsReporter = (metric: Metric) => void;