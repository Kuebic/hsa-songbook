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
      const sentry = (window as any).Sentry;
      if (sentry && typeof sentry.captureException === 'function') {
        sentry.captureException(error, {
          extra: context,
          level: context.level || 'error'
        });
      }
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