import React, { useState, useContext } from 'react'
import { FormContext } from './context/FormContextInstance'
import { getButtonAriaAttributes } from './utils/aria-helpers'
import { formStyles, mergeFormStyles } from './utils/style-converter'
import { designTokens } from '../../styles/tokens'

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
    <>
      <style>{`
        @keyframes buttonSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
              marginRight: designTokens.spacing.sm,
              display: 'inline-block',
              animation: 'buttonSpin 1s linear infinite',
              width: '1em',
              height: '1em',
            }}
          >
            ⟳
          </span>
        )}
        {displayText}
      </button>
    </>
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
  const baseStyles: React.CSSProperties = {
    ...formStyles.button.base,
    borderRadius: designTokens.radius.md,
    fontWeight: designTokens.typography.fontWeight.medium,
    transition: designTokens.transitions.fast,
    cursor: 'pointer',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px', // Touch-friendly minimum
  }
  
  // Size styles with design tokens
  const sizeStyles = {
    sm: { 
      padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
      fontSize: designTokens.typography.fontSize.sm,
      minHeight: '36px',
    },
    md: { 
      padding: `12px ${designTokens.spacing.lg}`,
      fontSize: designTokens.typography.fontSize.base,
      minHeight: '44px',
    },
    lg: { 
      padding: `${designTokens.spacing.md} ${designTokens.spacing.xl}`,
      fontSize: designTokens.typography.fontSize.lg,
      minHeight: '52px',
    },
  }
  
  // Enhanced variant styles with design tokens
  const variantStyles = {
    primary: {
      base: {
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-primary-foreground)',
        boxShadow: designTokens.shadows.sm,
      },
      hover: {
        backgroundColor: 'var(--color-primary)',
        opacity: 0.9,
        boxShadow: designTokens.shadows.md,
        transform: 'translateY(-1px)',
      },
    },
    secondary: {
      base: {
        backgroundColor: 'var(--color-secondary)',
        color: 'var(--color-secondary-foreground)',
        border: `1px solid var(--color-border)`,
      },
      hover: {
        backgroundColor: 'var(--color-muted)',
        borderColor: 'var(--color-border)',
      },
    },
    outline: {
      base: {
        backgroundColor: 'transparent',
        color: 'var(--color-primary)',
        border: `1px solid var(--color-primary)`,
      },
      hover: {
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-primary-foreground)',
      },
    },
    ghost: {
      base: {
        backgroundColor: 'transparent',
        color: 'var(--text-primary)',
        border: 'none',
      },
      hover: {
        backgroundColor: 'var(--color-card-hover)',
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
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
      backgroundColor: 'var(--color-muted)',
      color: 'var(--text-tertiary)',
    }
  }
  
  // Loading cursor
  if (state.loading) {
    styles.cursor = 'wait'
    styles.opacity = 0.8
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
        color: 'var(--status-error)',
        borderColor: 'var(--status-error)',
        ...props.style,
      }}
    />
  )
}