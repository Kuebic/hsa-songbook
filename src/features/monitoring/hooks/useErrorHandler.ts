import { useCallback } from 'react';
import { errorReportingService } from '../services/errorReportingService';

interface UseErrorHandlerOptions {
  level?: string;
  context?: Record<string, unknown>;
}

export function useErrorHandler(options?: UseErrorHandlerOptions) {
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

  const clearErrorHistory = useCallback(() => {
    errorReportingService.clearErrorHistory();
  }, []);

  const getErrorHistory = useCallback(() => {
    return errorReportingService.getErrorHistory();
  }, []);

  return {
    handleError,
    clearErrorHistory,
    getErrorHistory
  };
}