import React from 'react';
import { Component } from 'react';
import type { ReactNode, ErrorInfo as ReactErrorInfo } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { errorReportingService } from '../services/errorReportingService';
import type { 
  ErrorLevel,
  CategorizedError,
  ErrorContext,
  ErrorBoundaryState,
  ErrorFallbackProps 
} from '../types/errorTypes';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ReactErrorInfo) => void;
  level?: ErrorLevel;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  enableAutoRecovery?: boolean;
  maxRetries?: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: Set<number> = new Set();
  private categorizeError?: (error: Error) => CategorizedError;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  async componentDidMount() {
    // Dynamically import categorization to avoid circular deps
    if (this.props.enableAutoRecovery) {
      try {
        const { categorizeError } = await import('../utils/errorCategorization');
        this.categorizeError = categorizeError;
      } catch (error) {
        console.warn('Failed to load error categorization:', error);
      }
    }
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    const { onError, level = 'component', enableAutoRecovery = true, maxRetries = 3 } = this.props;
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary Caught:', error, errorInfo);
    }
    
    // Categorize error if available
    let categorized: CategorizedError | undefined;
    if (this.categorizeError) {
      categorized = this.categorizeError(error);
    }
    
    // Report to monitoring service with enhanced context
    errorReportingService.reportError(error, {
      componentStack: errorInfo.componentStack || undefined,
      level,
      timestamp: Date.now(),
      category: categorized?.category,
      retryable: categorized?.context.retryable
    });
    
    // Call custom error handler
    onError?.(error, errorInfo);
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Attempt auto-recovery for transient errors
    if (enableAutoRecovery && categorized && 
        categorized.recovery.type === 'auto' && 
        this.state.retryCount < Math.min(categorized.recovery.maxRetries, maxRetries)) {
      this.scheduleAutoRecovery(categorized);
    }
  }

  private scheduleAutoRecovery(error: CategorizedError) {
    const delay = error.recovery.retryDelay * Math.pow(2, this.state.retryCount);
    
    const timeoutId = window.setTimeout(() => {
      this.setState(prevState => ({
        retryCount: prevState.retryCount + 1,
        isRecovering: false
      }), () => {
        this.resetErrorBoundary();
      });
      this.retryTimeouts.delete(timeoutId);
    }, delay);

    this.retryTimeouts.add(timeoutId);
    
    // Update state to show recovery UI
    this.setState({
      isRecovering: true,
      recoveryDelay: delay
    });
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

  componentWillUnmount() {
    // Clear any pending retries
    this.retryTimeouts.forEach(id => clearTimeout(id));
    this.retryTimeouts.clear();
  }

  resetErrorBoundary = () => {
    // Clear any pending retries first
    this.retryTimeouts.forEach(id => clearTimeout(id));
    this.retryTimeouts.clear();
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      recoveryDelay: undefined
    });
  };

  render() {
    const { hasError, error, isRecovering, recoveryDelay, retryCount } = this.state;
    const { children, fallback: Fallback = ErrorFallback, isolate, level } = this.props;

    if (hasError && error) {
      // Create enhanced context for error
      const context: ErrorContext = {
        category: this.categorizeError ? this.categorizeError(error).category : 'unknown',
        retryable: this.categorizeError ? this.categorizeError(error).context.retryable : false,
        retryCount,
        timestamp: Date.now(),
        level
      };

      const errorProps: ErrorFallbackProps = {
        error,
        resetError: this.resetErrorBoundary,
        context,
        level
      };

      // Add recovery state to props if recovering
      if (isRecovering && recoveryDelay) {
        (errorProps as ErrorFallbackProps & { isRecovering?: boolean; recoveryDelay?: number }).isRecovering = true;
        (errorProps as ErrorFallbackProps & { isRecovering?: boolean; recoveryDelay?: number }).recoveryDelay = recoveryDelay;
      }

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