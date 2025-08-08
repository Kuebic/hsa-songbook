import { useValidation } from '@shared/validation/hooks'
import type { UseValidationReturn } from '@shared/validation/hooks'
import { z } from 'zod'
import type { FormFieldValue } from '../types'

/**
 * Creates a form adapter that bridges the existing useValidation hook 
 * with the new form components system
 * NOTE: This is not a React component or hook, but uses hooks internally
 */
export function createFormAdapter<T>(schema: z.ZodSchema<T>) {
  // This function should only be called from within React components
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const validation = useValidation(schema)
  
  return {
    validate: validation.validate,
    validateField: (name: string, value: FormFieldValue) => {
      // Bridge field names to validation paths
      // Handle nested object paths (e.g., 'user.name' -> nested validation)
      return validation.validateField(name, value)
    },
    errors: validation.errors,
    clearErrors: validation.clearErrors,
    clearFieldError: validation.clearFieldError,
    isValid: validation.isValid,
    // Additional utilities for form integration
    hasError: (fieldName: string) => Boolean(validation.errors[fieldName]),
    getError: (fieldName: string) => validation.errors[fieldName] || null,
  }
}

/**
 * Hook that provides form-specific validation utilities
 * Wraps the existing useValidation hook with form-specific enhancements
 */
export function useFormValidation<T>(schema: z.ZodSchema<T>): UseValidationReturn<T> & {
  hasError: (fieldName: string) => boolean
  getError: (fieldName: string) => string | null
  validateIfTouched: (fieldName: string, value: FormFieldValue, touched: boolean) => string | null
} {
  const validation = useValidation(schema)
  
  const hasError = (fieldName: string): boolean => {
    return Boolean(validation.errors[fieldName])
  }
  
  const getError = (fieldName: string): string | null => {
    return validation.errors[fieldName] || null
  }
  
  const validateIfTouched = (
    fieldName: string, 
    value: FormFieldValue, 
    touched: boolean
  ): string | null => {
    // Only validate if field has been touched (follows existing pattern)
    if (touched) {
      return validation.validateField(fieldName, value)
    }
    return null
  }
  
  return {
    ...validation,
    hasError,
    getError,
    validateIfTouched
  }
}

/**
 * Utility to extract initial values from a Zod schema
 * Useful for creating default form state
 */
export function getSchemaDefaults<T>(schema: z.ZodSchema<T>): Partial<T> {
  try {
    // Try to parse an empty object to get default values
    const result = schema.safeParse({})
    if (result.success) {
      return result.data
    }
    
    // If that fails, return empty object
    return {}
  } catch {
    return {}
  }
}

/**
 * Utility to validate a single field with proper error handling
 * Matches the pattern used in CreateSetlistForm.tsx
 */
export function validateSingleField<T>(
  schema: z.ZodSchema<T>, 
  fieldName: string, 
  value: FormFieldValue
): string | null {
  try {
    // Create a partial schema for just this field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldSchema = (schema as any).shape?.[fieldName]
    
    if (!fieldSchema) {
      // If field schema not found, return null (no error)
      return null
    }
    
    // Validate the single field
    fieldSchema.parse(value)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || 'Invalid value'
    }
    return null
  }
}

/**
 * Type-safe form data extractor
 * Ensures form values match schema expectations
 */
export function extractFormData<T>(
  values: Record<string, FormFieldValue>,
  schema: z.ZodSchema<T>
): T | null {
  try {
    return schema.parse(values)
  } catch {
    return null
  }
}