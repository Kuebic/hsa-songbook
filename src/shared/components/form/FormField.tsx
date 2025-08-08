import React, { cloneElement, isValidElement } from 'react'
import { useFormField } from './hooks/useFormField'
import { useFormIds, getFieldAriaAttributes } from './utils/aria-helpers'
import { formStyles, mergeFormStyles } from './utils/style-converter'

export interface FormFieldProps {
  name: string
  label?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  children: React.ReactElement
  className?: string
  style?: React.CSSProperties
}

/**
 * FormField wrapper component that handles validation, accessibility, and state
 * Integrates with the existing useValidation pattern from CreateSetlistForm.tsx
 */
export function FormField({
  name,
  label,
  helperText,
  required = false,
  disabled = false,
  children,
  className,
  style,
}: FormFieldProps) {
  const { value, error, hasError, onChange, onBlur } = useFormField(name)
  const { fieldId, labelId, errorId, helperId } = useFormIds(name)
  
  // Get ARIA attributes for accessibility
  const fieldAriaAttributes = getFieldAriaAttributes(
    fieldId,
    hasError ? errorId : undefined,
    helperText ? helperId : undefined,
    undefined,
    {
      required,
      invalid: hasError,
      disabled,
    }
  )
  
  // Container styles
  const containerStyle = mergeFormStyles(
    formStyles.field.container,
    style
  )
  
  // Clone child element and inject props
  const enhancedChild = isValidElement(children)
    ? cloneElement(children, {
        ...fieldAriaAttributes,
        value: children.props.value ?? value,
        onChange: children.props.onChange ?? onChange,
        onBlur: children.props.onBlur ?? onBlur,
        disabled: disabled || children.props.disabled,
        hasError,
        name,
      })
    : children
  
  return (
    <div className={className} style={containerStyle}>
      {/* Label */}
      {label && (
        <label
          id={labelId}
          htmlFor={fieldId}
          style={formStyles.label.base}
        >
          {label}
          {required && (
            <span 
              style={formStyles.label.required}
              aria-label="required"
            >
              *
            </span>
          )}
        </label>
      )}
      
      {/* Input Field */}
      {enhancedChild}
      
      {/* Error Message */}
      {hasError && error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          style={formStyles.error.base}
        >
          {error}
        </div>
      )}
      
      {/* Helper Text */}
      {helperText && !hasError && (
        <div
          id={helperId}
          role="note"
          style={formStyles.helperText.base}
        >
          {helperText}
        </div>
      )}
    </div>
  )
}

