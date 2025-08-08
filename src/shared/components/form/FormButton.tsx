import React, { useState, useContext } from 'react'
import { FormContext } from './context/FormContextInstance'
import { getButtonAriaAttributes } from './utils/aria-helpers'
import { formStyles, mergeFormStyles } from './utils/style-converter'

export interface FormButtonProps {
  children: React.ReactNode
  type?: 'submit' | 'reset' | 'button'
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  style?: React.CSSProperties
  id?: string
  autoFocus?: boolean
}

/**
 * FormButton component - Consistent button styling for forms
 * Integrates with form context for submit handling
 */
export function FormButton({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  loadingText,
  onClick,
  className,
  style,
  id,
  autoFocus,
}: FormButtonProps) {
  const [hovered, setHovered] = useState(false)
  
  // Get form context if available, otherwise null
  // This is safe because we handle the null case in handleClick
  const formContext = useContext(FormContext)
  
  const isDisabled = disabled || loading
  const displayText = loading && loadingText ? loadingText : children
  
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return
    
    if (type === 'submit' && formContext?.handleSubmit) {
      e.preventDefault()
      await formContext.handleSubmit()
    } else if (type === 'reset' && formContext?.resetForm) {
      e.preventDefault()
      formContext.resetForm()
    }
    
    onClick?.(e)
  }
  
  // Get button styles based on variant, size, and state
  const buttonStyles = getButtonStyles(variant, size, {
    disabled: isDisabled,
    hovered,
    loading,
  })
  
  const finalStyles = mergeFormStyles(buttonStyles, style)
  
  return (
    <button
      {...getButtonAriaAttributes(id || `button-${Math.random()}`, type, isDisabled)}
      className={className}
      style={finalStyles}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={isDisabled}
      autoFocus={autoFocus}
    >
      {loading && (
        <span 
          style={{ 
            marginRight: '0.5rem',
            display: 'inline-block',
            animation: 'spin 1s linear infinite',
          }}
        >
          ⟳
        </span>
      )}
      {displayText}
    </button>
  )
}

/**
 * Get button styles based on variant, size, and state
 */
function getButtonStyles(
  variant: 'primary' | 'secondary' | 'outline' | 'ghost',
  size: 'sm' | 'md' | 'lg',
  state: { disabled: boolean; hovered: boolean; loading: boolean }
): React.CSSProperties {
  const baseStyles = formStyles.button.base
  
  // Size styles
  const sizeStyles = {
    sm: { 
      padding: '0.375rem 0.75rem', 
      fontSize: '0.875rem' 
    },
    md: { 
      padding: '0.5rem 1rem', 
      fontSize: '1rem' 
    },
    lg: { 
      padding: '0.75rem 1.5rem', 
      fontSize: '1.125rem' 
    },
  }
  
  // Variant styles
  const variantStyles = {
    primary: {
      base: formStyles.button.primary,
      hover: formStyles.button.primaryHover,
    },
    secondary: {
      base: formStyles.button.secondary,
      hover: formStyles.button.secondaryHover,
    },
    outline: {
      base: {
        backgroundColor: 'transparent',
        color: formStyles.button.primary.backgroundColor,
        border: `1px solid ${formStyles.button.primary.backgroundColor}`,
      },
      hover: {
        backgroundColor: formStyles.button.primary.backgroundColor,
        color: 'white',
      },
    },
    ghost: {
      base: {
        backgroundColor: 'transparent',
        color: '#374151',
        border: 'none',
      },
      hover: {
        backgroundColor: '#f3f4f6',
      },
    },
  }
  
  let styles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant].base,
  }
  
  // Apply hover styles
  if (state.hovered && !state.disabled) {
    styles = {
      ...styles,
      ...variantStyles[variant].hover,
    }
  }
  
  // Apply disabled styles
  if (state.disabled) {
    styles = {
      ...styles,
      ...formStyles.button.disabled,
    }
  }
  
  // Loading cursor
  if (state.loading) {
    styles.cursor = 'wait'
  }
  
  return styles
}

/**
 * Specialized button components for common form actions
 */
export function SubmitButton(props: Omit<FormButtonProps, 'type'>) {
  return <FormButton {...props} type="submit" variant="primary" />
}

export function CancelButton(props: Omit<FormButtonProps, 'type' | 'variant'>) {
  return <FormButton {...props} type="button" variant="secondary" />
}

export function ResetButton(props: Omit<FormButtonProps, 'type' | 'variant'>) {
  return <FormButton {...props} type="reset" variant="outline" />
}

export function DeleteButton(props: Omit<FormButtonProps, 'variant'>) {
  return (
    <FormButton 
      {...props} 
      variant="outline" 
      style={{
        color: '#ef4444',
        borderColor: '#ef4444',
        ...props.style,
      }}
    />
  )
}