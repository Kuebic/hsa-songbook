import { useState, useCallback } from 'react'
import { z, ZodError } from 'zod'
import type { ZodSchema } from 'zod'

export interface ValidationState {
  errors: Record<string, string>
  isValid: boolean
}

export interface UseValidationReturn<T> {
  validate: (data: unknown) => T | null
  validateField: (field: string, value: unknown) => string | null
  errors: Record<string, string>
  clearErrors: () => void
  clearFieldError: (field: string) => void
  isValid: boolean
}

/**
 * Hook for form validation using Zod schemas
 * @param schema - The Zod schema to validate against
 * @returns Validation utilities
 */
export function useValidation<T>(schema: ZodSchema<T>): UseValidationReturn<T> {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback((data: unknown): T | null => {
    try {
      const result = schema.parse(data)
      setErrors({})
      return result
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach((err) => {
          const path = err.path.join('.')
          if (!fieldErrors[path]) {
            fieldErrors[path] = err.message
          }
        })
        setErrors(fieldErrors)
      }
      return null
    }
  }, [schema])

  const validateField = useCallback((field: string, value: unknown): string | null => {
    try {
      // For single field validation, create a partial schema
      const partialSchema = z.object({ [field]: z.unknown() })
      partialSchema.parse({ [field]: value })
      
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
      return null
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues[0]?.message || 'Invalid value'
        setErrors(prev => ({
          ...prev,
          [field]: errorMessage
        }))
        return errorMessage
      }
      return null
    }
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const isValid = Object.keys(errors).length === 0

  return {
    validate,
    validateField,
    errors,
    clearErrors,
    clearFieldError,
    isValid
  }
}

/**
 * Hook for input validation with debouncing
 * @param validator - Function to validate the input
 * @param delay - Debounce delay in milliseconds
 */
export function useDebounceValidation(
  validator: (value: string) => string | null,
  delay: number = 300
) {
  const [error, setError] = useState<string | null>(null)
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

  const validate = useCallback((value: string) => {
    if (timer) {
      clearTimeout(timer)
    }

    const newTimer = setTimeout(() => {
      const validationError = validator(value)
      setError(validationError)
    }, delay)

    setTimer(newTimer)
  }, [validator, delay, timer])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { error, validate, clearError }
}