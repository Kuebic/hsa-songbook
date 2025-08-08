import { createContext } from 'react'
import type { FormContextValue } from '../types'

/**
 * Form Context for managing form state and validation
 */
export const FormContext = createContext<FormContextValue | null>(null)