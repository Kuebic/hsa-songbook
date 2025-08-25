/**
 * Database error classes for consistent error handling
 */

/**
 * Base class for all database-related errors
 */
export class DatabaseError extends Error {
  statusCode?: number
  code?: string
  originalError?: unknown

  constructor(
    message: string,
    statusCode?: number,
    code?: string,
    originalError?: unknown
  ) {
    super(message)
    this.name = 'DatabaseError'
    this.statusCode = statusCode
    this.code = code
    this.originalError = originalError
  }

  /**
   * Determines if the error is retryable
   */
  isRetryable(): boolean {
    // Network errors and timeouts are retryable
    if (this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT') {
      return true
    }
    // 5xx server errors are retryable
    if (this.statusCode && this.statusCode >= 500) {
      return true
    }
    return false
  }

  /**
   * Returns a user-friendly error message
   */
  toUserMessage(): string {
    switch (this.code) {
      case 'NETWORK_ERROR':
        return 'Connection error. Please check your internet connection and try again.'
      case 'NOT_FOUND':
        return 'The requested resource was not found.'
      case 'VALIDATION_ERROR':
        return 'The provided data is invalid. Please check your input.'
      case 'UNAUTHORIZED':
        return 'You are not authorized to perform this action.'
      case 'TIMEOUT':
        return 'The request took too long. Please try again.'
      case 'PGRST116':
        return 'No matching records found.'
      case 'PGRST301':
        return 'Multiple records found when only one was expected.'
      default:
        if (this.statusCode && this.statusCode >= 500) {
          return 'A server error occurred. Please try again later.'
        }
        return this.message || 'An unexpected error occurred.'
    }
  }
}

/**
 * Network-related errors (connection failures, timeouts)
 */
export class NetworkError extends DatabaseError {
  constructor(message = 'Network request failed', originalError?: unknown) {
    super(message, 0, 'NETWORK_ERROR', originalError)
    this.name = 'NetworkError'
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends DatabaseError {
  constructor(resource: string, originalError?: unknown) {
    super(`${resource} not found`, 404, 'NOT_FOUND', originalError)
    this.name = 'NotFoundError'
  }
}

/**
 * Validation errors for invalid data
 */
export class ValidationError extends DatabaseError {
  fields?: Record<string, string>

  constructor(
    message: string,
    fields?: Record<string, string>,
    originalError?: unknown
  ) {
    super(message, 400, 'VALIDATION_ERROR', originalError)
    this.name = 'ValidationError'
    this.fields = fields
  }

  toUserMessage(): string {
    if (this.fields && Object.keys(this.fields).length > 0) {
      const fieldErrors = Object.entries(this.fields)
        .map(([field, error]) => `${field}: ${error}`)
        .join(', ')
      return `Validation errors: ${fieldErrors}`
    }
    return super.toUserMessage()
  }
}

/**
 * Authorization errors
 */
export class UnauthorizedError extends DatabaseError {
  constructor(message = 'Unauthorized access', originalError?: unknown) {
    super(message, 401, 'UNAUTHORIZED', originalError)
    this.name = 'UnauthorizedError'
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends DatabaseError {
  constructor(message = 'Request timeout', originalError?: unknown) {
    super(message, 408, 'TIMEOUT', originalError)
    this.name = 'TimeoutError'
  }
}

/**
 * Helper function to convert Supabase errors to DatabaseError
 */
export function handleSupabaseError(error: unknown): DatabaseError {
  // Handle null or undefined errors
  if (!error) {
    return new DatabaseError('Database operation failed', 500, 'UNKNOWN_ERROR', error)
  }

  // Handle specific Supabase error codes
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const errorWithCode = error as { code: string; message?: string }
    
    if (errorWithCode.code === 'PGRST116') {
      return new NotFoundError('Record', error)
    }
    
    if (errorWithCode.code === 'PGRST301') {
      return new ValidationError('Multiple records found when only one was expected', undefined, error)
    }
    
    if (errorWithCode.code === '23505') {
      return new ValidationError('Duplicate record exists', undefined, error)
    }
  }
  
  // Network errors (case-insensitive)
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const errorWithMessage = error as { message: string }
    if (errorWithMessage.message.toLowerCase().includes('network') || errorWithMessage.message.toLowerCase().includes('fetch')) {
      return new NetworkError(errorWithMessage.message, error)
    }
  }
  
  // Default to generic database error
  const errorObj = error as { message?: string; statusCode?: number; code?: string }
  return new DatabaseError(
    errorObj.message || 'Database operation failed',
    errorObj.statusCode || 500,
    errorObj.code,
    error
  )
}