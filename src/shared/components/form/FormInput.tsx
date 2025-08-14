import React, { useState } from 'react'
import { FormField } from './FormField'
import { designTokens, getFieldBorderColor, getFieldBackgroundColor } from '../../styles/tokens'
import type { FormFieldProps } from './types'

export interface FormInputProps extends Omit<FormFieldProps, 'children'> {
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search' | 'number'
  placeholder?: string
  maxLength?: number
  minLength?: number
  pattern?: string
  autoComplete?: string
  autoFocus?: boolean
  readOnly?: boolean
  step?: string | number
  min?: string | number
  max?: string | number
  size?: number
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
}

/**
 * FormInput component - Text input with full accessibility and validation
 * Follows the existing pattern from CreateSetlistForm.tsx
 */
export function FormInput({
  name,
  type = 'text',
  placeholder,
  label,
  helperText,
  required,
  disabled,
  className,
  style,
  maxLength,
  minLength,
  pattern,
  autoComplete,
  autoFocus,
  readOnly,
  step,
  min,
  max,
  size,
  inputMode,
}: FormInputProps) {
  const [focused, setFocused] = useState(false)
  
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
      <InputElement
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        readOnly={readOnly}
        step={step}
        min={min}
        max={max}
        size={size}
        inputMode={inputMode}
        focused={focused}
        onFocus={() => setFocused(true)}
        onBlur={(_e) => {
          setFocused(false)
          // FormField will handle onBlur for validation
        }}
      />
    </FormField>
  )
}

/**
 * Input element component with styling and state management
 */
interface InputElementProps {
  type: string
  placeholder?: string
  maxLength?: number
  minLength?: number
  pattern?: string
  autoComplete?: string
  autoFocus?: boolean
  readOnly?: boolean
  step?: string | number
  min?: string | number
  max?: string | number
  size?: number
  inputMode?: string
  focused: boolean
  onFocus: () => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
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

function InputElement({
  type,
  placeholder,
  maxLength,
  minLength,
  pattern,
  autoComplete,
  autoFocus,
  readOnly,
  step,
  min,
  max,
  size,
  inputMode,
  focused,
  onFocus,
  onBlur,
  // FormField injected props
  id,
  name,
  value = '',
  onChange,
  disabled,
  hasError,
  ...ariaProps
}: InputElementProps) {
  
  // Determine field states for styling
  const borderState = disabled ? 'disabled' : 
    hasError ? 'error' : 
    focused ? 'focused' : 'default'
  
  const backgroundState = disabled ? 'disabled' : 
    hasError ? 'error' : 'default'
  
  // Get styles based on current state
  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.normal,
    lineHeight: designTokens.typography.lineHeight.normal,
    minHeight: '44px',
    border: `1px solid ${getFieldBorderColor(borderState)}`,
    borderRadius: designTokens.radius.md,
    backgroundColor: getFieldBackgroundColor(backgroundState),
    color: disabled ? designTokens.colors.text.disabled : designTokens.colors.text.primary,
    transition: `border-color ${designTokens.transitions.fast}, background-color ${designTokens.transitions.fast}, box-shadow ${designTokens.transitions.fast}`,
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? 0.6 : 1,
    ...(focused && {
      boxShadow: designTokens.shadows.focus
    })
  }
  
  return (
    <input
      {...ariaProps}
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      maxLength={maxLength}
      minLength={minLength}
      pattern={pattern}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      step={step}
      min={min}
      max={max}
      size={size}
      inputMode={inputMode as React.HTMLAttributes<HTMLInputElement>['inputMode']}
      style={inputStyles}
    />
  )
}

/**
 * Specialized input components for common use cases
 */
export function EmailInput(props: Omit<FormInputProps, 'type'>) {
  return <FormInput {...props} type="email" inputMode="email" />
}

export function PasswordInput(props: Omit<FormInputProps, 'type'>) {
  return <FormInput {...props} type="password" autoComplete="current-password" />
}

export function NumberInput(props: Omit<FormInputProps, 'type'>) {
  return <FormInput {...props} type="number" inputMode="numeric" />
}

export function TelInput(props: Omit<FormInputProps, 'type'>) {
  return <FormInput {...props} type="tel" inputMode="tel" />
}

export function UrlInput(props: Omit<FormInputProps, 'type'>) {
  return <FormInput {...props} type="url" inputMode="url" />
}

export function SearchInput(props: Omit<FormInputProps, 'type'>) {
  return <FormInput {...props} type="search" inputMode="search" />
}