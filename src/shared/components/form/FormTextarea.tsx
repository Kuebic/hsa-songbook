import React, { useState, useRef, useEffect } from 'react'
import { FormField } from './FormField'
import { getFormStyles } from './utils/style-converter'
import type { FormFieldProps } from './types'

export interface FormTextareaProps extends Omit<FormFieldProps, 'children'> {
  placeholder?: string
  rows?: number
  cols?: number
  maxLength?: number
  minLength?: number
  autoResize?: boolean
  autoComplete?: string
  autoFocus?: boolean
  readOnly?: boolean
  wrap?: 'hard' | 'soft'
  spellCheck?: boolean
}

/**
 * FormTextarea component - Multi-line text input with auto-resize option
 * Follows the existing pattern from CreateSetlistForm.tsx (minHeight: 80px, resize: vertical)
 */
export function FormTextarea({
  name,
  placeholder,
  label,
  helperText,
  required,
  disabled,
  className,
  style,
  rows = 3,
  cols,
  maxLength,
  minLength,
  autoResize = false,
  autoComplete,
  autoFocus,
  readOnly,
  wrap = 'soft',
  spellCheck = true,
}: FormTextareaProps) {
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
      <TextareaElement
        placeholder={placeholder}
        rows={rows}
        cols={cols}
        maxLength={maxLength}
        minLength={minLength}
        autoResize={autoResize}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        readOnly={readOnly}
        wrap={wrap}
        spellCheck={spellCheck}
        focused={focused}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false)
          // FormField will handle onBlur for validation
          e.target.onBlur?.(e)
        }}
      />
    </FormField>
  )
}

/**
 * Textarea element component with auto-resize functionality and styling
 */
interface TextareaElementProps {
  placeholder?: string
  rows: number
  cols?: number
  maxLength?: number
  minLength?: number
  autoResize: boolean
  autoComplete?: string
  autoFocus?: boolean
  readOnly?: boolean
  wrap: 'hard' | 'soft'
  spellCheck: boolean
  focused: boolean
  onFocus: () => void
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  // Props injected by FormField
  id?: string
  name?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  hasError?: boolean
  'aria-required'?: string
  'aria-invalid'?: string
  'aria-describedby'?: string
}

function TextareaElement({
  placeholder,
  rows,
  cols,
  maxLength,
  minLength,
  autoResize,
  autoComplete,
  autoFocus,
  readOnly,
  wrap,
  spellCheck,
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
}: TextareaElementProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto-resize functionality
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current
      // Reset height to recalculate
      textarea.style.height = 'auto'
      // Set height based on scroll height
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [value, autoResize])
  
  // Get styles based on current state
  const textareaStyles = getFormStyles('textarea', {
    focused,
    hasError,
    disabled,
  })
  
  // Override resize style if auto-resize is enabled
  const finalStyles = autoResize 
    ? { ...textareaStyles, resize: 'none', overflow: 'hidden' }
    : textareaStyles
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e)
    
    // Auto-resize on input
    if (autoResize) {
      const textarea = e.target
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }
  
  return (
    <textarea
      {...ariaProps}
      ref={textareaRef}
      id={id}
      name={name}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      onFocus={onFocus}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      rows={rows}
      cols={cols}
      maxLength={maxLength}
      minLength={minLength}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      wrap={wrap}
      spellCheck={spellCheck}
      style={finalStyles}
    />
  )
}

/**
 * Specialized textarea components for common use cases
 */
export function AutoResizeTextarea(props: Omit<FormTextareaProps, 'autoResize'>) {
  return <FormTextarea {...props} autoResize={true} />
}

export function CodeTextarea(props: Omit<FormTextareaProps, 'spellCheck' | 'wrap'>) {
  return (
    <FormTextarea 
      {...props} 
      spellCheck={false} 
      wrap="off"
      style={{
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        ...props.style,
      }}
    />
  )
}

export function LongTextarea(props: Omit<FormTextareaProps, 'rows' | 'autoResize'>) {
  return <FormTextarea {...props} rows={8} autoResize={true} />
}