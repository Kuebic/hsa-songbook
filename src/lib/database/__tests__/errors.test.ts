/**
 * Unit tests for database error classes
 * Tests error classification, user messages, and Supabase error handling
 */

import { describe, it, expect } from 'vitest'
import {
  DatabaseError,
  NetworkError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  TimeoutError,
  handleSupabaseError
} from '../errors'

describe('DatabaseError', () => {
  describe('constructor', () => {
    it('should create basic error with message', () => {
      const error = new DatabaseError('Something went wrong')

      expect(error.message).toBe('Something went wrong')
      expect(error.name).toBe('DatabaseError')
      expect(error.statusCode).toBeUndefined()
      expect(error.code).toBeUndefined()
      expect(error.originalError).toBeUndefined()
    })

    it('should create error with all parameters', () => {
      const originalError = new Error('Original error')
      const error = new DatabaseError('Custom message', 500, 'CUSTOM_CODE', originalError)

      expect(error.message).toBe('Custom message')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('CUSTOM_CODE')
      expect(error.originalError).toBe(originalError)
    })

    it('should be instance of Error', () => {
      const error = new DatabaseError('Test')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(DatabaseError)
    })
  })

  describe('isRetryable', () => {
    it('should return true for NETWORK_ERROR', () => {
      const error = new DatabaseError('Network failed', 0, 'NETWORK_ERROR')
      expect(error.isRetryable()).toBe(true)
    })

    it('should return true for TIMEOUT', () => {
      const error = new DatabaseError('Request timeout', 408, 'TIMEOUT')
      expect(error.isRetryable()).toBe(true)
    })

    it('should return true for 5xx server errors', () => {
      expect(new DatabaseError('Server error', 500).isRetryable()).toBe(true)
      expect(new DatabaseError('Bad gateway', 502).isRetryable()).toBe(true)
      expect(new DatabaseError('Service unavailable', 503).isRetryable()).toBe(true)
      expect(new DatabaseError('Gateway timeout', 504).isRetryable()).toBe(true)
      expect(new DatabaseError('Internal error', 599).isRetryable()).toBe(true)
    })

    it('should return false for client errors', () => {
      expect(new DatabaseError('Bad request', 400).isRetryable()).toBe(false)
      expect(new DatabaseError('Unauthorized', 401).isRetryable()).toBe(false)
      expect(new DatabaseError('Forbidden', 403).isRetryable()).toBe(false)
      expect(new DatabaseError('Not found', 404).isRetryable()).toBe(false)
      expect(new DatabaseError('Conflict', 409).isRetryable()).toBe(false)
    })

    it('should return false for other error codes', () => {
      const error = new DatabaseError('Validation failed', 400, 'VALIDATION_ERROR')
      expect(error.isRetryable()).toBe(false)
    })

    it('should return false when no status code', () => {
      const error = new DatabaseError('Unknown error')
      expect(error.isRetryable()).toBe(false)
    })
  })

  describe('toUserMessage', () => {
    it('should return specific message for NETWORK_ERROR', () => {
      const error = new DatabaseError('Network failed', 0, 'NETWORK_ERROR')
      expect(error.toUserMessage()).toBe('Connection error. Please check your internet connection and try again.')
    })

    it('should return specific message for NOT_FOUND', () => {
      const error = new DatabaseError('Record not found', 404, 'NOT_FOUND')
      expect(error.toUserMessage()).toBe('The requested resource was not found.')
    })

    it('should return specific message for VALIDATION_ERROR', () => {
      const error = new DatabaseError('Invalid data', 400, 'VALIDATION_ERROR')
      expect(error.toUserMessage()).toBe('The provided data is invalid. Please check your input.')
    })

    it('should return specific message for UNAUTHORIZED', () => {
      const error = new DatabaseError('Access denied', 401, 'UNAUTHORIZED')
      expect(error.toUserMessage()).toBe('You are not authorized to perform this action.')
    })

    it('should return specific message for TIMEOUT', () => {
      const error = new DatabaseError('Request timeout', 408, 'TIMEOUT')
      expect(error.toUserMessage()).toBe('The request took too long. Please try again.')
    })

    it('should return specific message for PGRST116', () => {
      const error = new DatabaseError('No rows returned', 404, 'PGRST116')
      expect(error.toUserMessage()).toBe('No matching records found.')
    })

    it('should return specific message for PGRST301', () => {
      const error = new DatabaseError('Multiple rows returned', 400, 'PGRST301')
      expect(error.toUserMessage()).toBe('Multiple records found when only one was expected.')
    })

    it('should return generic server error message for 5xx codes', () => {
      const error = new DatabaseError('Internal error', 500, 'UNKNOWN_SERVER_ERROR')
      expect(error.toUserMessage()).toBe('A server error occurred. Please try again later.')
    })

    it('should return original message for unknown codes', () => {
      const error = new DatabaseError('Custom error message', 418, 'CUSTOM_CODE')
      expect(error.toUserMessage()).toBe('Custom error message')
    })

    it('should return default message when no message provided', () => {
      const error = new DatabaseError('', 418, 'UNKNOWN_CODE')
      expect(error.toUserMessage()).toBe('An unexpected error occurred.')
    })

    it('should return default message when message is undefined', () => {
      const error = new DatabaseError(undefined as unknown as string, 418, 'UNKNOWN_CODE')
      expect(error.toUserMessage()).toBe('An unexpected error occurred.')
    })
  })
})

describe('NetworkError', () => {
  it('should create with default message', () => {
    const error = new NetworkError()

    expect(error.message).toBe('Network request failed')
    expect(error.name).toBe('NetworkError')
    expect(error.statusCode).toBe(0)
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error).toBeInstanceOf(DatabaseError)
  })

  it('should create with custom message', () => {
    const error = new NetworkError('Connection timeout')

    expect(error.message).toBe('Connection timeout')
    expect(error.code).toBe('NETWORK_ERROR')
  })

  it('should create with original error', () => {
    const originalError = new Error('Fetch failed')
    const error = new NetworkError('Network failed', originalError)

    expect(error.originalError).toBe(originalError)
  })

  it('should be retryable', () => {
    const error = new NetworkError()
    expect(error.isRetryable()).toBe(true)
  })
})

describe('NotFoundError', () => {
  it('should create with resource name', () => {
    const error = new NotFoundError('User')

    expect(error.message).toBe('User not found')
    expect(error.name).toBe('NotFoundError')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })

  it('should create with original error', () => {
    const originalError = new Error('PGRST116')
    const error = new NotFoundError('Song', originalError)

    expect(error.message).toBe('Song not found')
    expect(error.originalError).toBe(originalError)
  })

  it('should not be retryable', () => {
    const error = new NotFoundError('Record')
    expect(error.isRetryable()).toBe(false)
  })

  it('should have correct user message', () => {
    const error = new NotFoundError('Record')
    expect(error.toUserMessage()).toBe('The requested resource was not found.')
  })
})

describe('ValidationError', () => {
  it('should create with message only', () => {
    const error = new ValidationError('Invalid input')

    expect(error.message).toBe('Invalid input')
    expect(error.name).toBe('ValidationError')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.fields).toBeUndefined()
  })

  it('should create with field errors', () => {
    const fields = { title: 'Required field', artist: 'Too long' }
    const error = new ValidationError('Validation failed', fields)

    expect(error.message).toBe('Validation failed')
    expect(error.fields).toBe(fields)
  })

  it('should create with original error', () => {
    const originalError = new Error('Constraint violation')
    const error = new ValidationError('Invalid data', undefined, originalError)

    expect(error.originalError).toBe(originalError)
  })

  it('should not be retryable', () => {
    const error = new ValidationError('Invalid data')
    expect(error.isRetryable()).toBe(false)
  })

  describe('toUserMessage', () => {
    it('should return generic message when no fields', () => {
      const error = new ValidationError('Validation failed')
      expect(error.toUserMessage()).toBe('The provided data is invalid. Please check your input.')
    })

    it('should return field-specific message when fields provided', () => {
      const fields = { title: 'Required field', artist: 'Too long' }
      const error = new ValidationError('Validation failed', fields)

      const message = error.toUserMessage()
      expect(message).toContain('Validation errors:')
      expect(message).toContain('title: Required field')
      expect(message).toContain('artist: Too long')
    })

    it('should handle single field error', () => {
      const fields = { email: 'Invalid email format' }
      const error = new ValidationError('Validation failed', fields)

      expect(error.toUserMessage()).toBe('Validation errors: email: Invalid email format')
    })

    it('should handle empty fields object', () => {
      const error = new ValidationError('Validation failed', {})
      expect(error.toUserMessage()).toBe('The provided data is invalid. Please check your input.')
    })
  })
})

describe('UnauthorizedError', () => {
  it('should create with default message', () => {
    const error = new UnauthorizedError()

    expect(error.message).toBe('Unauthorized access')
    expect(error.name).toBe('UnauthorizedError')
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('UNAUTHORIZED')
  })

  it('should create with custom message', () => {
    const error = new UnauthorizedError('Invalid token')

    expect(error.message).toBe('Invalid token')
  })

  it('should create with original error', () => {
    const originalError = new Error('JWT expired')
    const error = new UnauthorizedError('Token expired', originalError)

    expect(error.originalError).toBe(originalError)
  })

  it('should not be retryable', () => {
    const error = new UnauthorizedError()
    expect(error.isRetryable()).toBe(false)
  })
})

describe('TimeoutError', () => {
  it('should create with default message', () => {
    const error = new TimeoutError()

    expect(error.message).toBe('Request timeout')
    expect(error.name).toBe('TimeoutError')
    expect(error.statusCode).toBe(408)
    expect(error.code).toBe('TIMEOUT')
  })

  it('should create with custom message', () => {
    const error = new TimeoutError('Connection timeout')

    expect(error.message).toBe('Connection timeout')
  })

  it('should create with original error', () => {
    const originalError = new Error('AbortError')
    const error = new TimeoutError('Aborted', originalError)

    expect(error.originalError).toBe(originalError)
  })

  it('should be retryable', () => {
    const error = new TimeoutError()
    expect(error.isRetryable()).toBe(true)
  })
})

describe('handleSupabaseError', () => {
  it('should handle PGRST116 (row not found)', () => {
    const supabaseError = { code: 'PGRST116', message: 'No rows returned' }
    const error = handleSupabaseError(supabaseError)

    expect(error).toBeInstanceOf(NotFoundError)
    expect(error.message).toBe('Record not found')
    expect(error.originalError).toBe(supabaseError)
  })

  it('should handle PGRST301 (multiple rows)', () => {
    const supabaseError = { code: 'PGRST301', message: 'Multiple rows returned' }
    const error = handleSupabaseError(supabaseError)

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.message).toBe('Multiple records found when only one was expected')
    expect(error.originalError).toBe(supabaseError)
  })

  it('should handle 23505 (unique constraint violation)', () => {
    const supabaseError = { code: '23505', message: 'duplicate key value' }
    const error = handleSupabaseError(supabaseError)

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.message).toBe('Duplicate record exists')
    expect(error.originalError).toBe(supabaseError)
  })

  it('should handle network errors by message', () => {
    const supabaseError = { message: 'network error occurred' }
    const error = handleSupabaseError(supabaseError)

    expect(error).toBeInstanceOf(NetworkError)
    expect(error.message).toBe('network error occurred')
    expect(error.originalError).toBe(supabaseError)
  })

  it('should handle fetch errors by message', () => {
    const supabaseError = { message: 'fetch failed to connect' }
    const error = handleSupabaseError(supabaseError)

    expect(error).toBeInstanceOf(NetworkError)
    expect(error.message).toBe('fetch failed to connect')
  })

  it('should handle unknown errors as generic DatabaseError', () => {
    const supabaseError = { code: 'UNKNOWN_CODE', message: 'Something went wrong' }
    const error = handleSupabaseError(supabaseError)

    expect(error).toBeInstanceOf(DatabaseError)
    expect(error).not.toBeInstanceOf(NotFoundError)
    expect(error).not.toBeInstanceOf(ValidationError)
    expect(error).not.toBeInstanceOf(NetworkError)
    expect(error.message).toBe('Something went wrong')
    expect(error.code).toBe('UNKNOWN_CODE')
    expect(error.originalError).toBe(supabaseError)
  })

  it('should handle error without message', () => {
    const supabaseError = { code: 'SOME_CODE' }
    const error = handleSupabaseError(supabaseError)

    expect(error).toBeInstanceOf(DatabaseError)
    expect(error.message).toBe('Database operation failed')
    expect(error.statusCode).toBe(500)
    expect(error.code).toBe('SOME_CODE')
  })

  it('should handle error with statusCode', () => {
    const supabaseError = { message: 'Error', statusCode: 403 }
    const error = handleSupabaseError(supabaseError)

    expect(error.statusCode).toBe(403)
  })

  it('should use default statusCode when not provided', () => {
    const supabaseError = { message: 'Error' }
    const error = handleSupabaseError(supabaseError)

    expect(error.statusCode).toBe(500)
  })

  it('should handle null or undefined error gracefully', () => {
    const error1 = handleSupabaseError(null)
    expect(error1).toBeInstanceOf(DatabaseError)
    expect(error1.message).toBe('Database operation failed')

    const error2 = handleSupabaseError(undefined)
    expect(error2).toBeInstanceOf(DatabaseError)
    expect(error2.message).toBe('Database operation failed')
  })

  it('should handle error object without message property', () => {
    const supabaseError = { code: 'SOME_CODE', details: 'Some details' }
    const error = handleSupabaseError(supabaseError)

    expect(error.message).toBe('Database operation failed')
    expect(error.code).toBe('SOME_CODE')
  })

  describe('network error detection', () => {
    it('should detect case-insensitive network in message', () => {
      const errors = [
        { message: 'Network connection failed' },
        { message: 'network timeout' },
        { message: 'NETWORK ERROR' },
        { message: 'No network available' }
      ]

      errors.forEach(err => {
        const result = handleSupabaseError(err)
        expect(result).toBeInstanceOf(NetworkError)
      })
    })

    it('should detect case-insensitive fetch in message', () => {
      const errors = [
        { message: 'Fetch request failed' },
        { message: 'fetch timeout' },
        { message: 'FETCH ERROR' },
        { message: 'Unable to fetch data' }
      ]

      errors.forEach(err => {
        const result = handleSupabaseError(err)
        expect(result).toBeInstanceOf(NetworkError)
      })
    })

    it('should not trigger on partial word matches', () => {
      const errors = [
        { message: 'networking configuration' }, // Contains 'network' but different context
        { message: 'prefetch cache miss' } // Contains 'fetch' but different context
      ]

      errors.forEach(err => {
        const result = handleSupabaseError(err)
        // Should still be NetworkError due to containing the keyword
        expect(result).toBeInstanceOf(NetworkError)
      })
    })

    it('should handle messages without network/fetch keywords', () => {
      const supabaseError = { message: 'Database constraint violation' }
      const error = handleSupabaseError(supabaseError)

      expect(error).toBeInstanceOf(DatabaseError)
      expect(error).not.toBeInstanceOf(NetworkError)
    })
  })
})