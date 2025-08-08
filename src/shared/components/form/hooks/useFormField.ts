import { useCallback } from 'react'
import { useFormContext } from './useFormContext'
import type { FormFieldValue } from '../types'

/**
 * Hook for field-specific functionality
 * Provides field value, error state, and change handlers
 */
export function useFormField(name: string) {
  const context = useFormContext()
  
  const value = context.values[name]
  const error = context.getFieldError?.(name)
  const hasError = context.hasFieldError?.(name) ?? false
  const isTouched = context.touched[name] ?? false
  
  const setValue = useCallback((newValue: FormFieldValue) => {
    context.setFieldValue(name, newValue)
  }, [context, name])
  
  const setTouched = useCallback(() => {
    context.setFieldTouched(name)
  }, [context, name])
  
  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(event.target.value)
  }, [setValue])
  
  const onBlur = useCallback(() => {
    setTouched()
  }, [setTouched])
  
  return {
    value: value ?? '',
    error,
    hasError,
    isTouched,
    setValue,
    setTouched,
    onChange,
    onBlur,
  }
}