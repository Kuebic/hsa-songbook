import React from 'react'
import { getErrorAriaAttributes } from './utils/aria-helpers'
import { formStyles, mergeFormStyles } from './utils/style-converter'

export interface FormErrorProps {
  children: React.ReactNode
  id?: string
  live?: boolean
  className?: string
  style?: React.CSSProperties
}

/**
 * FormError component - Standalone error message with proper ARIA attributes
 * For use when you need error display outside of FormField
 */
export function FormError({
  children,
  id,
  live = true,
  className,
  style,
}: FormErrorProps) {
  if (!children) return null
  
  const errorStyles = mergeFormStyles(formStyles.error.base, style)
  const errorId = id || `error-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div
      {...getErrorAriaAttributes(errorId, live)}
      className={className}
      style={errorStyles}
    >
      {children}
    </div>
  )
}

/**
 * Multiple error messages component
 */
export interface FormErrorListProps {
  errors: string[]
  id?: string
  className?: string
  style?: React.CSSProperties
}

export function FormErrorList({
  errors,
  id,
  className,
  style,
}: FormErrorListProps) {
  if (!errors || errors.length === 0) return null
  
  const listStyles = mergeFormStyles(
    {
      ...formStyles.error.base,
      listStyle: 'disc',
      paddingLeft: '1.25rem',
      margin: '0.25rem 0',
    },
    style
  )
  
  const errorId = id || `errors-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <ul
      {...getErrorAriaAttributes(errorId, true)}
      className={className}
      style={listStyles}
    >
      {errors.map((error, index) => (
        <li key={index} style={{ marginBottom: '0.25rem' }}>
          {error}
        </li>
      ))}
    </ul>
  )
}

/**
 * Inline error component - smaller, for inline validation messages
 */
export interface FormInlineErrorProps extends FormErrorProps {
  icon?: boolean
}

export function FormInlineError({
  children,
  icon = true,
  ...props
}: FormInlineErrorProps) {
  if (!children) return null
  
  const inlineStyles = {
    ...formStyles.error.base,
    fontSize: '0.75rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  }
  
  return (
    <FormError {...props} style={{ ...inlineStyles, ...props.style }}>
      {icon && <span>⚠</span>}
      {children}
    </FormError>
  )
}