import { useCallback } from 'react';
import { useErrorBoundary } from 'react-error-boundary';
import { errorReportingService } from '../services/errorReportingService';

interface UseErrorHandlerOptions {
  level?: string;
  context?: Record<string, unknown>;
}

/**
 * Enhanced error handler hook that integrates with react-error-boundary
 * Provides programmatic error handling for async operations and error reporting
 */
export function useErrorHandler(options?: UseErrorHandlerOptions) {
  // Get the error boundary context from react-error-boundary
  const { showBoundary, resetBoundary } = useErrorBoundary();

  const handleError = useCallback((error: Error | unknown, errorInfo?: React.ErrorInfo) => {
    // Ensure we have an Error object
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Build context
    const context = {
      level: options?.level || 'component',
      timestamp: Date.now(),
      ...options?.context,
      ...(errorInfo && { componentStack: errorInfo.componentStack || undefined })
    };
    
    // Report the error
    errorReportingService.reportError(errorObj, context);
    
    // Log in development
    if (import.meta.env.DEV) {
      console.error('Error handled:', errorObj, context);
    }
  }, [options?.level, options?.context]);

  /**
   * Handle async errors and trigger the nearest error boundary
   * Useful for errors in event handlers, promises, and async functions
   */
  const handleAsyncError = useCallback((error: unknown) => {
    // Ensure we have an Error object
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Report the error before showing boundary
    errorReportingService.reportError(errorObj, {
      level: options?.level || 'component',
      source: 'async',
      timestamp: Date.now(),
      ...options?.context
    });
    
    // Trigger the nearest error boundary to display fallback UI
    showBoundary(errorObj);
  }, [showBoundary, options?.level, options?.context]);

  /**
   * Wrapper for async functions that automatically catches and handles errors
   */
  const withErrorHandler = useCallback(<T extends (...args: unknown[]) => Promise<unknown>>(
    asyncFunction: T
  ): T => {
    return (async (...args) => {
      try {
        return await asyncFunction(...args);
      } catch (error) {
        handleAsyncError(error);
        throw error; // Re-throw to maintain function signature
      }
    }) as T;
  }, [handleAsyncError]);

  const clearErrorHistory = useCallback(() => {
    errorReportingService.clearErrorHistory();
  }, []);

  const getErrorHistory = useCallback(() => {
    return errorReportingService.getErrorHistory();
  }, []);

  return {
    handleError,           // Original synchronous error handler
    handleAsyncError,      // New async error handler that triggers boundary
    resetError: resetBoundary, // Reset the error boundary
    withErrorHandler,      // Wrapper for async functions
    showBoundary,         // Direct access to show boundary (from react-error-boundary)
    clearErrorHistory,
    getErrorHistory
  };
}