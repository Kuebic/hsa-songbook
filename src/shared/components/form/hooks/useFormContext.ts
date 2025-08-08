import { useContext } from 'react'
import { FormContext } from '../context/FormContextInstance'
import type { FormContextValue } from '../types'

/**
 * Hook to use form context
 * Throws error if used outside FormProvider
 */
export function useFormContext<T = unknown>(): FormContextValue<T> {
  const context = useContext(FormContext)
  
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider')
  }
  
  return context as FormContextValue<T>
}