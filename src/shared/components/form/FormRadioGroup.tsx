import React, { useState } from 'react'
import { FormField } from './FormField'
import { 
  getRadioGroupAriaAttributes, 
  getRadioAriaAttributes 
} from './utils/aria-helpers'
import { designTokens } from './utils/style-converter'
import type { FormFieldProps, RadioOption } from './types'

export interface FormRadioGroupProps extends Omit<FormFieldProps, 'children'> {
  options: RadioOption[]
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
}

/**
 * FormRadioGroup component - Accessible radio button group with keyboard navigation
 */
export function FormRadioGroup({
  name,
  options,
  label,
  helperText,
  required,
  disabled,
  className,
  style,
  orientation = 'vertical',
  size = 'md',
}: FormRadioGroupProps) {
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
      <RadioGroupElement
        options={options}
        orientation={orientation}
        size={size}
      />
    </FormField>
  )
}

/**
 * Radio group element with keyboard navigation and accessibility
 */
interface RadioGroupElementProps {
  options: RadioOption[]
  orientation: 'horizontal' | 'vertical'
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

function RadioGroupElement({
  options,
  orientation,
  size,
  // FormField injected props
  id,
  name,
  value,
  onChange,
  disabled,
  hasError,
  ...ariaProps
}: RadioGroupElementProps) {
  const [focusedIndex, setFocusedIndex] = useState(() => {
    const selectedIndex = options.findIndex(option => option.value === value)
    return selectedIndex >= 0 ? selectedIndex : 0
  })
  
  // Handle keyboard navigation for radio group
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index
    
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        nextIndex = (index + 1) % options.length
        // Skip disabled options
        while (options[nextIndex]?.disabled && nextIndex !== index) {
          nextIndex = (nextIndex + 1) % options.length
        }
        break
        
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        nextIndex = index === 0 ? options.length - 1 : index - 1
        // Skip disabled options
        while (options[nextIndex]?.disabled && nextIndex !== index) {
          nextIndex = nextIndex === 0 ? options.length - 1 : nextIndex - 1
        }
        break
        
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        while (options[nextIndex]?.disabled && nextIndex < options.length - 1) {
          nextIndex++
        }
        break
        
      case 'End':
        e.preventDefault()
        nextIndex = options.length - 1
        while (options[nextIndex]?.disabled && nextIndex > 0) {
          nextIndex--
        }
        break
        
      default:
        return
    }
    
    if (nextIndex !== index && !options[nextIndex]?.disabled) {
      setFocusedIndex(nextIndex)
      // Auto-select on navigation (standard radio behavior)
      const selectedOption = options[nextIndex]
      if (selectedOption && onChange) {
        const syntheticEvent = {
          target: {
            name,
            value: selectedOption.value,
          }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }
  }
  
  const containerStyle = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    gap: '0.75rem',
  }
  
  return (
    <div
      {...getRadioGroupAriaAttributes(
        id!,
        undefined,
        hasError ? `${id}-error` : undefined,
        undefined,
        {
          required: Boolean(ariaProps['aria-required']),
          invalid: hasError,
          disabled,
        }
      )}
      style={containerStyle}
    >
      {options.map((option, index) => (
        <RadioOption
          key={option.value}
          option={option}
          name={name!}
          checked={value === option.value}
          focused={focusedIndex === index}
          size={size}
          disabled={disabled || option.disabled}
          onChange={onChange}
          onFocus={() => setFocusedIndex(index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        />
      ))}
    </div>
  )
}

/**
 * Individual radio option component
 */
interface RadioOptionProps {
  option: RadioOption
  name: string
  checked: boolean
  focused: boolean
  size: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFocus: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

function RadioOption({
  option,
  name,
  checked,
  focused,
  size,
  disabled,
  onChange,
  onFocus,
  onKeyDown,
}: RadioOptionProps) {
  const radioId = `${name}-${option.value}`
  
  const sizes = {
    sm: { width: '14px', height: '14px' },
    md: { width: '16px', height: '16px' },
    lg: { width: '20px', height: '20px' },
  }
  
  const radioStyles = {
    ...sizes[size],
    appearance: 'none' as const,
    backgroundColor: 'white',
    border: `2px solid ${checked ? designTokens.colors.borderFocus : designTokens.colors.border}`,
    borderRadius: '50%',
    cursor: disabled ? 'not-allowed' : 'pointer',
    position: 'relative' as const,
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    outline: focused ? `2px solid ${designTokens.colors.borderFocus}` : 'none',
    outlineOffset: '2px',
  }
  
  const dotStyles = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px',
    height: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px',
    backgroundColor: designTokens.colors.borderFocus,
    borderRadius: '50%',
    opacity: checked ? 1 : 0,
    transition: 'opacity 0.2s ease',
  }
  
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <input
          {...getRadioAriaAttributes(radioId, checked, disabled)}
          type="radio"
          name={name}
          value={option.value}
          checked={checked}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          disabled={disabled}
          tabIndex={focused ? 0 : -1}
          style={radioStyles}
        />
        
        {/* Custom radio dot */}
        <span style={dotStyles} />
      </div>
      
      <span style={{ 
        fontSize: '0.875rem',
        color: disabled ? '#9ca3af' : 'inherit'
      }}>
        {option.label}
      </span>
    </label>
  )
}