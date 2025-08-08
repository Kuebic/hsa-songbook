import { useState, useCallback } from 'react'
import { z } from 'zod'
import { useFormValidation } from '../utils/validation-adapter'
import { FormContext } from './FormContextInstance'
import type { FormFieldValue, FormContextValue } from '../types'

export interface FormProviderProps<T = unknown> {
  children: React.ReactNode
  schema: z.ZodSchema<T>
  initialValues?: Partial<T>
  onSubmit?: (data: T) => void | Promise<void>
  validateOnBlur?: boolean
  validateOnChange?: boolean
}

/**
 * FormProvider component that manages form state and validation
 */
export function FormProvider<T = unknown>({ 
  children, 
  schema, 
  initialValues = {},
  onSubmit,
  validateOnBlur = true,
  validateOnChange = false
}: FormProviderProps<T>) {
  const validation = useFormValidation(schema)
  
  // Form values state
  const [values, setValues] = useState<Record<string, FormFieldValue>>(() => {
    const initial: Record<string, FormFieldValue> = {}
    
    // Initialize with provided initial values
    Object.entries(initialValues).forEach(([key, value]) => {
      initial[key] = value as FormFieldValue
    })
    
    return initial
  })
  
  // Touched fields state (tracks which fields have been interacted with)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  /**
   * Set value for a specific field
   */
  const setFieldValue = useCallback((name: string, value: FormFieldValue) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Validate on change if enabled and field has been touched
    if (validateOnChange && touched[name]) {
      validation.validateField(name, value)
    }
    
    // Clear existing error if field now has a value (optimistic validation)
    if (value && validation.hasError(name)) {
      validation.clearFieldError(name)
    }
  }, [validation, validateOnChange, touched])
  
  /**
   * Mark field as touched (user has interacted with it)
   */
  const setFieldTouched = useCallback((name: string) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))
    
    // Validate on blur if enabled
    if (validateOnBlur) {
      const fieldValue = values[name]
      validation.validateField(name, fieldValue)
    }
  }, [validation, validateOnBlur, values])
  
  /**
   * Submit handler that validates entire form
   */
  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault()
    }
    
    // Mark all fields as touched
    const allFieldNames = Object.keys(values)
    const touchedUpdate: Record<string, boolean> = {}
    allFieldNames.forEach(name => {
      touchedUpdate[name] = true
    })
    setTouched(touchedUpdate)
    
    // Validate entire form
    const validatedData = validation.validate(values)
    
    if (validatedData && onSubmit) {
      try {
        await onSubmit(validatedData)
      } catch (error) {
        console.error('Form submission error:', error)
      }
    }
    
    return validatedData
  }, [values, validation, onSubmit])
  
  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setValues(initialValues as Record<string, FormFieldValue>)
    setTouched({})
    validation.clearErrors()
  }, [initialValues, validation])
  
  /**
   * Get field error (only show if field has been touched)
   */
  const getFieldError = useCallback((name: string): string | undefined => {
    return touched[name] ? validation.getError(name) || undefined : undefined
  }, [touched, validation])
  
  /**
   * Check if field has error (only if touched)
   */
  const hasFieldError = useCallback((name: string): boolean => {
    return touched[name] ? validation.hasError(name) : false
  }, [touched, validation])
  
  // Context value
  const contextValue: FormContextValue<T> = {
    validation,
    values,
    setFieldValue,
    errors: validation.errors,
    touched,
    setFieldTouched,
    isValid: validation.isValid,
    // Additional methods for form management
    handleSubmit,
    resetForm,
    getFieldError,
    hasFieldError,
  }
  
  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  )
}

