import { z } from 'zod'
import type { UseValidationReturn } from '@shared/validation/hooks'

// Core form field types
export type FormFieldValue = string | number | boolean | Date | undefined

export interface FormFieldProps {
  name: string
  label?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  value?: FormFieldValue
  onChange?: (value: FormFieldValue) => void
  onBlur?: () => void
}

export interface FormContextValue<T = unknown> {
  validation: UseValidationReturn<T>
  values: Record<string, FormFieldValue>
  setFieldValue: (name: string, value: FormFieldValue) => void
  errors: Record<string, string>
  touched: Record<string, boolean>
  setFieldTouched: (name: string) => void
  isValid: boolean
  // Additional methods for form management
  handleSubmit?: (event?: React.FormEvent) => Promise<T | null>
  resetForm?: () => void
  getFieldError?: (name: string) => string | undefined
  hasFieldError?: (name: string) => boolean
}

// Validation adapter interface  
export interface ValidationAdapter<T> {
  schema: z.ZodSchema<T>
  validation: UseValidationReturn<T>
  values: T
  onSubmit: (data: T) => void | Promise<void>
}

// Style mapping for Tailwind to inline styles
export interface StyleMapping {
  base: React.CSSProperties
  focus: React.CSSProperties
  error: React.CSSProperties
  disabled: React.CSSProperties
}

// Select option type
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

// Radio option type
export interface RadioOption {
  value: string
  label: string
  disabled?: boolean
}

// Form layout types
export interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export interface FormActionsProps {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
  style?: React.CSSProperties
}