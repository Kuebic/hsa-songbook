import React, { Component, type ReactNode, type ErrorInfo as ReactErrorInfo } from 'react';
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
      componentStack: errorInfo.componentStack || undefined,
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