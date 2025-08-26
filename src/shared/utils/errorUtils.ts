import type { ErrorCategory } from '../../features/monitoring/types/errorTypes'

/**
 * Safely get error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'An unknown error occurred'
}

/**
 * Create a standardized error with additional context
 */
export function createContextualError(
  message: string,
  context: {
    category?: ErrorCategory
    component?: string
    action?: string
    details?: Record<string, unknown>
  }
): Error {
  const error = new Error(message)
  Object.assign(error, context)
  return error
}

/**
 * Check if an error is retryable based on its characteristics
 */
export function isRetryableError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  
  // Network errors are usually retryable
  if (message.includes('network') || 
      message.includes('fetch') ||
      message.includes('timeout')) {
    return true
  }
  
  // Chunk loading errors might be retryable
  if (message.includes('loading chunk') ||
      message.includes('dynamically imported')) {
    return true
  }
  
  // Rate limiting errors are retryable after delay
  if (message.includes('rate limit') ||
      message.includes('too many requests')) {
    return true
  }
  
  // Server errors might be temporary
  if (message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')) {
    return true
  }
  
  return false
}

/**
 * Extract status code from error if available
 */
export function getErrorStatusCode(error: unknown): number | null {
  if (error && typeof error === 'object') {
    if ('status' in error && typeof error.status === 'number') {
      return error.status
    }
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return error.statusCode
    }
    if ('code' in error && typeof error.code === 'number') {
      return error.code
    }
  }
  
  // Try to extract from message
  const message = getErrorMessage(error)
  const statusMatch = message.match(/\b(4\d{2}|5\d{2})\b/)
  if (statusMatch) {
    return parseInt(statusMatch[1], 10)
  }
  
  return null
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: {
    onError?: (error: Error) => void
    fallbackValue?: unknown
    rethrow?: boolean
  }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(getErrorMessage(error))
      
      options?.onError?.(err)
      
      if (options?.rethrow) {
        throw err
      }
      
      return options?.fallbackValue
    }
  }) as T
}

/**
 * Create an error boundary wrapper for async operations
 */
export async function errorBoundaryAsync<T>(
  operation: () => Promise<T>,
  fallback: T | ((error: Error) => T),
  onError?: (error: Error) => void
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const err = error instanceof Error ? error : new Error(getErrorMessage(error))
    onError?.(err)
    return typeof fallback === 'function' ? (fallback as (error: Error) => T)(err) : fallback
  }
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number
    initialDelay?: number
    maxDelay?: number
    shouldRetry?: (error: Error, attempt: number) => boolean
    onRetry?: (error: Error, attempt: number) => void
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = isRetryableError,
    onRetry
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(getErrorMessage(error))
      
      if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
        throw lastError
      }
      
      onRetry?.(lastError, attempt)
      
      const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Format error for user display
 */
export function formatErrorForUser(error: unknown): string {
  const statusCode = getErrorStatusCode(error)
  
  if (statusCode) {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.'
      case 401:
        return 'You need to sign in to access this.'
      case 403:
        return 'You don\'t have permission to do this.'
      case 404:
        return 'The requested resource was not found.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
        return 'Server error. Please try again later.'
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.'
    }
  }
  
  const message = getErrorMessage(error).toLowerCase()
  
  if (message.includes('network')) {
    return 'Connection issue. Please check your internet and try again.'
  }
  
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.'
  }
  
  if (message.includes('validation')) {
    return 'Please check your input and try again.'
  }
  
  return 'Something went wrong. Please try again.'
}

/**
 * Log error with structured context
 */
export function logError(
  error: unknown,
  context: {
    component?: string
    action?: string
    userId?: string
    metadata?: Record<string, unknown>
  } = {}
): void {
  const err = error instanceof Error ? error : new Error(getErrorMessage(error))
  
  const errorLog = {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    ...context
  }
  
  if (import.meta.env.DEV) {
    console.error('Error logged:', errorLog)
  } else {
    // In production, send to monitoring service
    // This would integrate with your error reporting service
    console.error(err)
  }
}