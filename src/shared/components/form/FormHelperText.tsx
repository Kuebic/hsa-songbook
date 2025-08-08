import React from 'react'
import { getHelperAriaAttributes } from './utils/aria-helpers'
import { formStyles, mergeFormStyles } from './utils/style-converter'

export interface FormHelperTextProps {
  children: React.ReactNode
  id?: string
  className?: string
  style?: React.CSSProperties
  size?: 'sm' | 'md'
  variant?: 'default' | 'muted' | 'warning' | 'info'
}

/**
 * FormHelperText component - Standalone helper text with proper ARIA attributes
 * For use when you need helper text outside of FormField
 */
export function FormHelperText({
  children,
  id,
  className,
  style,
  size = 'sm',
  variant = 'default',
}: FormHelperTextProps) {
  if (!children) return null
  
  const helperId = id || `helper-${Math.random().toString(36).substr(2, 9)}`
  
  const sizeStyles = {
    sm: { fontSize: '0.75rem' },
    md: { fontSize: '0.875rem' },
  }
  
  const variantStyles = {
    default: { color: '#64748b' },
    muted: { color: '#9ca3af' },
    warning: { color: '#f59e0b' },
    info: { color: '#3b82f6' },
  }
  
  const helperStyles = mergeFormStyles(
    {
      ...formStyles.helperText.base,
      ...sizeStyles[size],
      ...variantStyles[variant],
    },
    style
  )
  
  return (
    <div
      {...getHelperAriaAttributes(helperId)}
      className={className}
      style={helperStyles}
    >
      {children}
    </div>
  )
}

/**
 * Character count helper component
 */
export interface FormCharacterCountProps {
  current: number
  max?: number
  id?: string
  className?: string
  style?: React.CSSProperties
}

export function FormCharacterCount({
  current,
  max,
  id,
  className,
  style,
}: FormCharacterCountProps) {
  const isOverLimit = max && current > max
  const isNearLimit = max && current > max * 0.8
  
  const variant = isOverLimit 
    ? 'warning' 
    : isNearLimit 
      ? 'info' 
      : 'muted'
  
  const text = max 
    ? `${current}/${max} characters`
    : `${current} characters`
  
  return (
    <FormHelperText
      id={id}
      className={className}
      style={{
        textAlign: 'right',
        marginTop: '0.25rem',
        ...style,
      }}
      variant={variant}
    >
      {text}
    </FormHelperText>
  )
}

/**
 * Form description component - for longer descriptive text
 */
export interface FormDescriptionProps {
  children: React.ReactNode
  id?: string
  className?: string
  style?: React.CSSProperties
}

export function FormDescription({
  children,
  id,
  className,
  style,
}: FormDescriptionProps) {
  if (!children) return null
  
  const descriptionId = id || `description-${Math.random().toString(36).substr(2, 9)}`
  
  const descriptionStyles = mergeFormStyles(
    {
      color: '#6b7280',
      fontSize: '0.875rem',
      lineHeight: 1.5,
      marginBottom: '1rem',
    },
    style
  )
  
  return (
    <p
      id={descriptionId}
      className={className}
      style={descriptionStyles}
    >
      {children}
    </p>
  )
}

/**
 * Tooltip helper component for additional context
 */
export interface FormTooltipProps {
  children: React.ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  style?: React.CSSProperties
}

export function FormTooltip({
  children,
  content,
  position = 'top',
  className,
  style,
}: FormTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`
  
  const positionStyles = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: '0.5rem',
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '0.5rem',
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: '0.5rem',
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: '0.5rem',
    },
  }
  
  return (
    <div
      className={className}
      style={{ position: 'relative', display: 'inline-block', ...style }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <span aria-describedby={tooltipId}>
        {children}
      </span>
      
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 50,
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            ...positionStyles[position],
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}