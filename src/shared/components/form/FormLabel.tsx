import React from 'react'
import { getLabelAriaAttributes } from './utils/aria-helpers'
import { formStyles, mergeFormStyles } from './utils/style-converter'

export interface FormLabelProps {
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
  optional?: boolean
  id?: string
  className?: string
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
}

/**
 * FormLabel component - Standalone label with proper accessibility
 * For use when you need labels outside of FormField
 */
export function FormLabel({
  children,
  htmlFor,
  required = false,
  optional = false,
  id,
  className,
  style,
  size = 'md',
  weight = 'medium',
}: FormLabelProps) {
  const labelId = id || `label-${Math.random().toString(36).substr(2, 9)}`
  
  const sizeStyles = {
    sm: { fontSize: '0.875rem' },
    md: { fontSize: '1rem' },
    lg: { fontSize: '1.125rem' },
  }
  
  const weightStyles = {
    normal: { fontWeight: 400 },
    medium: { fontWeight: 500 },
    semibold: { fontWeight: 600 },
    bold: { fontWeight: 700 },
  }
  
  const labelStyles = mergeFormStyles(
    {
      ...formStyles.label.base,
      ...sizeStyles[size],
      ...weightStyles[weight],
    },
    style
  )
  
  return (
    <label
      {...getLabelAriaAttributes(labelId, htmlFor, required)}
      className={className}
      style={labelStyles}
    >
      {children}
      
      {/* Required indicator */}
      {required && (
        <span 
          style={formStyles.label.required}
          aria-label="required"
        >
          *
        </span>
      )}
      
      {/* Optional indicator */}
      {optional && !required && (
        <span 
          style={{
            ...formStyles.label.required,
            color: '#64748b',
          }}
        >
          (optional)
        </span>
      )}
    </label>
  )
}

/**
 * Form legend component for fieldset groupings
 */
export interface FormLegendProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
}

export function FormLegend({
  children,
  className,
  style,
  size = 'md',
}: FormLegendProps) {
  const sizeStyles = {
    sm: { fontSize: '1rem' },
    md: { fontSize: '1.125rem' },
    lg: { fontSize: '1.25rem' },
  }
  
  const legendStyles = mergeFormStyles(
    {
      fontWeight: 600,
      color: '#374151',
      marginBottom: '1rem',
      padding: 0,
      border: 'none',
      ...sizeStyles[size],
    },
    style
  )
  
  return (
    <legend
      className={className}
      style={legendStyles}
    >
      {children}
    </legend>
  )
}

/**
 * Floating label component for material design style inputs
 */
export interface FormFloatingLabelProps extends FormLabelProps {
  floating?: boolean
  focused?: boolean
  hasValue?: boolean
}

export function FormFloatingLabel({
  children,
  floating = false,
  focused = false,
  hasValue = false,
  ...props
}: FormFloatingLabelProps) {
  const isFloated = floating && (focused || hasValue)
  
  const floatingStyles = floating ? {
    position: 'absolute' as const,
    left: '0.75rem',
    transition: 'all 0.2s ease',
    pointerEvents: 'none' as const,
    backgroundColor: 'white',
    padding: '0 0.25rem',
    zIndex: 1,
    transform: isFloated 
      ? 'translateY(-50%) scale(0.875)' 
      : 'translateY(0) scale(1)',
    top: isFloated ? '0' : '50%',
    color: focused ? '#3b82f6' : '#6b7280',
    fontSize: isFloated ? '0.75rem' : '1rem',
  } : {}
  
  return (
    <FormLabel
      {...props}
      style={{
        ...floatingStyles,
        ...props.style,
      }}
    >
      {children}
    </FormLabel>
  )
}