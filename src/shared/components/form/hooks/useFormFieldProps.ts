import { useFormField } from './useFormField'
import { useFormIds } from '../utils/aria-helpers'

/**
 * Hook for creating form fields with common patterns
 * Useful for creating custom field components
 */
export function useFormFieldProps(name: string) {
  const { value, error, hasError, onChange, onBlur } = useFormField(name)
  const { fieldId } = useFormIds(name)
  
  return {
    id: fieldId,
    name,
    value: value ?? '',
    onChange,
    onBlur,
    hasError,
    error,
  }
}