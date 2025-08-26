import { useCallback } from 'react'
import type { 
  ErrorCategory, 
  CategorizedError, 
  RecoveryStrategy,
  ErrorContext 
} from '../types/errorTypes'

export function useErrorCategory() {
  const categorizeError = useCallback((error: Error): CategorizedError => {
    let category: ErrorCategory = 'unknown'
    let retryable = false
    let maxRetries = 0

    const errorMessage = error.message?.toLowerCase() || ''
    const errorName = error.name?.toLowerCase() || ''

    // Network errors
    if (
      errorMessage.includes('fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('networkerror') ||
      errorName === 'networkerror' ||
      errorMessage.includes('err_network') ||
      errorMessage.includes('err_internet_disconnected')
    ) {
      category = 'network'
      retryable = true
      maxRetries = 3
    }
    // Chunk loading errors
    else if (
      errorMessage.includes('loading chunk') ||
      errorMessage.includes('failed to import') ||
      errorMessage.includes('dynamically imported module') ||
      errorMessage.includes('loading css chunk') ||
      errorMessage.includes('failed to fetch dynamically imported module')
    ) {
      category = 'chunk'
      retryable = true
      maxRetries = 1 // Usually needs page refresh
    }
    // Permission errors
    else if (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('permission') ||
      errorMessage.includes('not authenticated') ||
      errorMessage.includes('401') ||
      errorMessage.includes('403')
    ) {
      category = 'permission'
      retryable = false
    }
    // Validation errors
    else if (
      errorName === 'validationerror' ||
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('required')
    ) {
      category = 'validation'
      retryable = false
    }
    // Parsing errors
    else if (
      errorMessage.includes('parse') ||
      errorMessage.includes('syntax') ||
      errorMessage.includes('unexpected token') ||
      errorMessage.includes('json') ||
      errorMessage.includes('chordsheet')
    ) {
      category = 'parsing'
      retryable = false
    }
    // Component errors
    else if (
      errorMessage.includes('cannot read') ||
      errorMessage.includes('cannot access') ||
      errorMessage.includes('undefined is not') ||
      errorMessage.includes('null is not') ||
      errorName === 'typeerror' ||
      errorName === 'referenceerror'
    ) {
      category = 'component'
      retryable = true // May be transient state issue
      maxRetries = 1
    }

    const recovery: RecoveryStrategy = {
      type: retryable ? 'auto' : 'manual',
      maxRetries,
      retryDelay: category === 'network' ? 1000 : 2000,
      fallbackAction: category === 'chunk' 
        ? () => window.location.reload()
        : undefined
    }

    const context: ErrorContext = {
      category,
      retryable,
      retryCount: 0,
      timestamp: Date.now()
    }

    const categorizedError = Object.create(error) as CategorizedError
    Object.assign(categorizedError, {
      ...error,
      category,
      context,
      recovery
    })

    return categorizedError
  }, [])

  const getRecoveryStrategy = useCallback(
    (error: Error | CategorizedError): RecoveryStrategy => {
      if ('recovery' in error) {
        return error.recovery
      }
      
      const categorized = categorizeError(error)
      return categorized.recovery
    },
    [categorizeError]
  )

  const isRetryableError = useCallback(
    (error: Error | CategorizedError): boolean => {
      if ('context' in error) {
        return error.context.retryable
      }
      
      const categorized = categorizeError(error)
      return categorized.context.retryable
    },
    [categorizeError]
  )

  const getErrorMessage = useCallback(
    (error: Error | CategorizedError): string => {
      const category = 'category' in error ? error.category : categorizeError(error).category

      switch (category) {
        case 'network':
          return 'Connection issue. Please check your internet and try again.'
        case 'chunk':
          return 'Loading error. The app may need to be refreshed.'
        case 'permission':
          return 'You don\'t have permission to access this. Please sign in.'
        case 'validation':
          return 'Invalid input. Please check your data and try again.'
        case 'parsing':
          return 'Data format error. The content couldn\'t be processed.'
        case 'component':
          return 'Something went wrong. Please try again.'
        default:
          return 'An unexpected error occurred. Please try again.'
      }
    },
    [categorizeError]
  )

  return {
    categorizeError,
    getRecoveryStrategy,
    isRetryableError,
    getErrorMessage
  }
}