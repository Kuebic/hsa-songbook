import React, { useState } from 'react'
import { FormField } from './FormField'
import { getCheckboxAriaAttributes } from './utils/aria-helpers'
import { designTokens } from './utils/style-converter'
import type { FormFieldProps } from './types'

export interface FormCheckboxProps extends Omit<FormFieldProps, 'children'> {
  checked?: boolean
  indeterminate?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * FormCheckbox component - Accessible checkbox with custom styling
 */
export function FormCheckbox({
  name,
  label,
  helperText,
  required,
  disabled,
  className,
  style,
  checked,
  indeterminate = false,
  size = 'md',
}: FormCheckboxProps) {
  return (
    <FormField
      name={name}
      label={label}
      helperText={helperText}
      required={required}
      disabled={disabled}
      className={className}
      style={style}
    >
      <CheckboxElement
        checked={checked}
        indeterminate={indeterminate}
        size={size}
      />
    </FormField>
  )
}

/**
 * Checkbox element component with custom styling and accessibility
 */
interface CheckboxElementProps {
  checked?: boolean
  indeterminate: boolean
  size: 'sm' | 'md' | 'lg'
  // Props injected by FormField
  id?: string
  name?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  hasError?: boolean
  'aria-required'?: string
  'aria-invalid'?: string
  'aria-describedby'?: string
}

function CheckboxElement({
  checked,
  indeterminate,
  size,
  // FormField injected props
  id,
  name,
  onChange,
  disabled,
  hasError,
  ...ariaProps
}: CheckboxElementProps) {
  const [focused, setFocused] = useState(false)
  
  const sizes = {
    sm: { width: '14px', height: '14px' },
    md: { width: '16px', height: '16px' },
    lg: { width: '20px', height: '20px' },
  }
  
  const checkboxStyles = {
    ...sizes[size],
    appearance: 'none' as const,
    backgroundColor: checked || indeterminate ? designTokens.colors.borderFocus : 'white',
    border: `2px solid ${
      hasError 
        ? designTokens.colors.borderError 
        : (checked || indeterminate) 
          ? designTokens.colors.borderFocus 
          : designTokens.colors.border
    }`,
    borderRadius: '3px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    position: 'relative' as const,
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    outline: focused ? `2px solid ${designTokens.colors.borderFocus}` : 'none',
    outlineOffset: '2px',
  }
  
  const checkmarkStyles = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'white',
    fontSize: size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px',
    fontWeight: 'bold' as const,
    pointerEvents: 'none' as const,
  }
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <input
        {...getCheckboxAriaAttributes(
          id!,
          Boolean(checked),
          indeterminate,
          disabled,
          hasError ? `${id}-error` : undefined,
          undefined,
          {
            required: Boolean(ariaProps['aria-required']),
            invalid: hasError,
          }
        )}
        type="checkbox"
        name={name}
        checked={checked || false}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        style={checkboxStyles}
      />
      
      {/* Custom checkmark */}
      {(checked || indeterminate) && (
        <span style={checkmarkStyles}>
          {indeterminate ? '−' : '✓'}
        </span>
      )}
    </div>
  )
}

/**
 * Checkbox Group component for multiple related checkboxes
 */
export interface CheckboxOption {
  value: string
  label: string
  disabled?: boolean
}

export interface FormCheckboxGroupProps extends Omit<FormFieldProps, 'children' | 'name'> {
  name: string
  options: CheckboxOption[]
  values?: string[]
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
}

export function FormCheckboxGroup({
  name,
  options,
  values = [],
  label,
  helperText,
  required,
  disabled,
  className,
  style,
  orientation = 'vertical',
  size = 'md',
}: FormCheckboxGroupProps) {
  // For checkbox groups, we handle the array of values manually
  // since FormField expects single values
  
  const containerStyle = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    gap: '0.75rem',
    ...style,
  }
  
  return (
    <div className={className} style={containerStyle}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '0.5rem',
          fontWeight: 500,
          color: '#374151',
        }}>
          {label}
          {required && (
            <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
          )}
        </label>
      )}
      
      <div 
        role="group"
        aria-labelledby={label ? `${name}-label` : undefined}
        style={{
          display: 'flex',
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
          gap: '0.5rem',
        }}
      >
        {options.map((option) => (
          <label
            key={option.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: (disabled || option.disabled) ? 'not-allowed' : 'pointer',
              opacity: (disabled || option.disabled) ? 0.6 : 1,
            }}
          >
            <FormCheckbox
              name={`${name}.${option.value}`}
              checked={values.includes(option.value)}
              disabled={disabled || option.disabled}
              size={size}
            />
            <span style={{ fontSize: '0.875rem' }}>{option.label}</span>
          </label>
        ))}
      </div>
      
      {helperText && (
        <div style={{
          color: '#64748b',
          fontSize: '0.875rem',
          marginTop: '0.25rem',
        }}>
          {helperText}
        </div>
      )}
    </div>
  )
}