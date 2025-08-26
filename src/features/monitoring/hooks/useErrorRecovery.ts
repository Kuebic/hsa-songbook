import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useErrorBoundary } from 'react-error-boundary';

interface ErrorRecoveryConfig {
  resetOnRouteChange?: boolean;
  maxRetries?: number;
  autoRecoverableErrors?: string[];
  onRecovery?: () => void;
}

/**
 * Hook for automatic error recovery strategies
 * Provides auto-reset on route changes and retry logic with limits
 */
export function useErrorRecovery(config?: ErrorRecoveryConfig) {
  const location = useLocation();
  const { resetBoundary } = useErrorBoundary();
  const previousLocation = useRef(location.pathname);
  const [retryCount, setRetryCount] = useState(0);
  const lastErrorTime = useRef<number>(0);

  // Auto-reset on route change if enabled
  useEffect(() => {
    if (config?.resetOnRouteChange && location.pathname !== previousLocation.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ErrorRecovery] Route changed, resetting error boundary');
      }
      resetBoundary();
      previousLocation.current = location.pathname;
      setRetryCount(0);
    }
  }, [location.pathname, resetBoundary, config?.resetOnRouteChange]);

  /**
   * Retry with limit and exponential backoff
   */
  const retryWithLimit = useCallback(() => {
    const maxRetries = config?.maxRetries ?? 3;
    const now = Date.now();
    const timeSinceLastError = now - lastErrorTime.current;
    
    // Reset retry count if enough time has passed (5 minutes)
    if (timeSinceLastError > 5 * 60 * 1000) {
      setRetryCount(0);
    }
    
    if (retryCount < maxRetries) {
      // Calculate backoff delay (exponential: 1s, 2s, 4s, etc.)
      const backoffDelay = Math.pow(2, retryCount) * 1000;
      const shouldRetryImmediately = timeSinceLastError > backoffDelay;
      
      if (shouldRetryImmediately) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        lastErrorTime.current = now;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ErrorRecovery] Retrying (attempt ${newRetryCount}/${maxRetries})`);
        }
        
        // Call recovery callback if provided
        config?.onRecovery?.();
        
        // Reset the error boundary
        resetBoundary();
      } else {
        // Schedule retry after backoff delay
        const remainingDelay = backoffDelay - timeSinceLastError;
        setTimeout(() => {
          retryWithLimit();
        }, remainingDelay);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ErrorRecovery] Scheduling retry in ${remainingDelay}ms`);
        }
      }
    } else {
      console.error('[ErrorRecovery] Max retry attempts reached');
    }
  }, [resetBoundary, config, retryCount]);

  /**
   * Check if an error is auto-recoverable based on configuration
   */
  const isAutoRecoverable = useCallback((error: Error) => {
    if (!config?.autoRecoverableErrors || config.autoRecoverableErrors.length === 0) {
      return false;
    }
    
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();
    
    return config.autoRecoverableErrors.some(pattern => {
      const lowerPattern = pattern.toLowerCase();
      return errorMessage.includes(lowerPattern) || errorName.includes(lowerPattern);
    });
  }, [config?.autoRecoverableErrors]);

  /**
   * Auto-recover from specific errors
   */
  const attemptAutoRecovery = useCallback((error: Error) => {
    if (isAutoRecoverable(error)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ErrorRecovery] Auto-recoverable error detected:', error.message);
      }
      
      // Small delay before auto-recovery to prevent loops
      setTimeout(() => {
        retryWithLimit();
      }, 1000);
      
      return true;
    }
    return false;
  }, [isAutoRecoverable, retryWithLimit]);

  /**
   * Reset the retry counter manually
   */
  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
    lastErrorTime.current = 0;
    if (process.env.NODE_ENV === 'development') {
      console.log('[ErrorRecovery] Retry count reset');
    }
  }, []);

  /**
   * Force reset the error boundary and clear state
   */
  const forceReset = useCallback(() => {
    resetRetryCount();
    resetBoundary();
    config?.onRecovery?.();
  }, [resetBoundary, resetRetryCount, config]);

  return {
    retryWithLimit,
    resetRetryCount,
    forceReset,
    attemptAutoRecovery,
    retryCount,
    maxRetries: config?.maxRetries ?? 3,
    isAutoRecoveryEnabled: !!config?.autoRecoverableErrors?.length,
    isRouteResetEnabled: !!config?.resetOnRouteChange
  };
}