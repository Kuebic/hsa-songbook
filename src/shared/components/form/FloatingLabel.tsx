import React, { useState, useEffect } from 'react'
import { designTokens } from '../../styles/tokens'

export interface FloatingLabelProps {
  label: string
  required?: boolean
  children: React.ReactElement
  hasValue?: boolean
  isFocused?: boolean
  hasError?: boolean
  id?: string
}

/**
 * FloatingLabel component for modern form field labeling
 * Provides a floating label effect that moves above the input when focused or filled
 */
export function FloatingLabel({ 
  label, 
  required = false,
  children,
  hasValue: externalHasValue,
  isFocused: externalIsFocused,
  hasError = false,
  id
}: FloatingLabelProps) {
  const [localFocused, setLocalFocused] = useState(false)
  const [localHasValue, setLocalHasValue] = useState(false)
  
  // Use external state if provided, otherwise use local state
  const isFocused = externalIsFocused !== undefined ? externalIsFocused : localFocused
  const hasValue = externalHasValue !== undefined ? externalHasValue : localHasValue
  
  // Clone the child element to add focus/blur handlers if not externally controlled
  const enhancedChild = React.cloneElement(children, {
    onFocus: (e: React.FocusEvent) => {
      if (externalIsFocused === undefined) {
        setLocalFocused(true)
      }
      // Call original onFocus if it exists
      if (children.props.onFocus) {
        children.props.onFocus(e)
      }
    },
    onBlur: (e: React.FocusEvent) => {
      if (externalIsFocused === undefined) {
        setLocalFocused(false)
      }
      if (externalHasValue === undefined) {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        setLocalHasValue(target.value.length > 0)
      }
      // Call original onBlur if it exists
      if (children.props.onBlur) {
        children.props.onBlur(e)
      }
    },
    onChange: (e: React.ChangeEvent) => {
      if (externalHasValue === undefined) {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        setLocalHasValue(target.value.length > 0)
      }
      // Call original onChange if it exists
      if (children.props.onChange) {
        children.props.onChange(e)
      }
    },
    id: id || children.props.id,
    style: {
      ...children.props.style,
      paddingTop: '20px', // Extra padding for floating label
      paddingBottom: '8px',
    }
  })
  
  // Check initial value
  useEffect(() => {
    if (externalHasValue === undefined && children.props.value) {
      setLocalHasValue(String(children.props.value).length > 0)
    }
  }, [children.props.value, externalHasValue])
  
  const isFloating = hasValue || isFocused
  
  const labelStyles: React.CSSProperties = {
    position: 'absolute',
    left: designTokens.spacing.md,
    transition: designTokens.transitions.fast,
    pointerEvents: 'none',
    transformOrigin: 'left top',
    ...(isFloating ? {
      top: '6px',
      fontSize: designTokens.typography.fontSize.xs,
      transform: 'scale(0.85)',
      backgroundColor: designTokens.colors.background.primary,
      padding: `0 ${designTokens.spacing.xs}`,
      marginLeft: `-${designTokens.spacing.xs}`,
      color: hasError 
        ? designTokens.colors.text.error 
        : (isFocused ? designTokens.colors.border.focused : designTokens.colors.text.tertiary),
    } : {
      top: '20px',
      fontSize: designTokens.typography.fontSize.base,
      transform: 'scale(1)',
      color: designTokens.colors.text.secondary,
    })
  }
  
  return (
    <div style={{ position: 'relative' }}>
      <label 
        htmlFor={id || children.props.id}
        style={labelStyles}
      >
        {label}
        {required && (
          <span style={{ 
            color: designTokens.colors.text.error,
            marginLeft: designTokens.spacing.xs 
          }}>
            *
          </span>
        )}
      </label>
      {enhancedChild}
    </div>
  )
}

/**
 * FloatingLabelField - Wrapper component that combines FloatingLabel with a form field
 * Provides a complete floating label field experience
 */
export interface FloatingLabelFieldProps {
  label: string
  required?: boolean
  error?: string
  helperText?: string
  children: React.ReactElement
  className?: string
  style?: React.CSSProperties
}

export function FloatingLabelField({
  label,
  required = false,
  error,
  helperText,
  children,
  className,
  style
}: FloatingLabelFieldProps) {
  const [hasValue, setHasValue] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  
  return (
    <div 
      className={className}
      style={{
        marginBottom: designTokens.spacing.lg,
        ...style
      }}
    >
      <FloatingLabel
        label={label}
        required={required}
        hasValue={hasValue}
        isFocused={isFocused}
        hasError={!!error}
      >
        {React.cloneElement(children, {
          onFocus: (e: React.FocusEvent) => {
            setIsFocused(true)
            if (children.props.onFocus) {
              children.props.onFocus(e)
            }
          },
          onBlur: (e: React.FocusEvent) => {
            setIsFocused(false)
            const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            setHasValue(target.value.length > 0)
            if (children.props.onBlur) {
              children.props.onBlur(e)
            }
          },
          onChange: (e: React.ChangeEvent) => {
            const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            setHasValue(target.value.length > 0)
            if (children.props.onChange) {
              children.props.onChange(e)
            }
          }
        })}
      </FloatingLabel>
      
      {/* Helper text or error message */}
      {(error || helperText) && (
        <div style={{
          marginTop: designTokens.spacing.xs,
          fontSize: designTokens.typography.fontSize.sm,
          color: error ? designTokens.colors.text.error : designTokens.colors.text.secondary,
        }}>
          {error || helperText}
        </div>
      )}
    </div>
  )
}