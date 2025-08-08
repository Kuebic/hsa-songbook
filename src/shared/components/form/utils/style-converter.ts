import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { StyleMapping } from '../types'

/**
 * Utility to combine Tailwind classes
 * Uses tailwind-merge to handle conflicts properly
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Design tokens matching the existing codebase patterns
 * Extracted from CreateSetlistForm.tsx and other components
 */
export const designTokens = {
  colors: {
    border: '#e2e8f0',
    borderError: '#ef4444',
    borderFocus: '#3b82f6',
    error: '#ef4444',
    helperText: '#64748b',
    formBg: '#f8fafc',
    disabledBg: '#f8fafc',
    success: '#10b981',
    successHover: '#059669',
    buttonCancel: '#94a3b8',
    buttonCancelHover: '#64748b',
    white: '#ffffff',
    gray700: '#374151',
  },
  spacing: {
    fieldPadding: '0.5rem',
    fieldMargin: '1rem',
    borderRadius: '4px',
  },
  typography: {
    fontSize: '1rem',
    errorFontSize: '0.875rem',
    fontWeight: 500,
  },
  transitions: {
    borderColor: 'border-color 0.2s ease',
    colors: 'background-color 0.2s ease, color 0.2s ease',
  }
} as const

/**
 * Form component style mappings
 * Converts design intent to actual CSS styles
 */
export const formStyles = {
  input: {
    base: {
      width: '100%',
      padding: designTokens.spacing.fieldPadding,
      border: `1px solid ${designTokens.colors.border}`,
      borderRadius: designTokens.spacing.borderRadius,
      fontSize: designTokens.typography.fontSize,
      transition: designTokens.transitions.borderColor,
      outline: 'none',
    } as React.CSSProperties,
    
    focus: {
      borderColor: designTokens.colors.borderFocus,
    } as React.CSSProperties,
    
    error: {
      borderColor: designTokens.colors.borderError,
    } as React.CSSProperties,
    
    disabled: {
      backgroundColor: designTokens.colors.disabledBg,
      cursor: 'not-allowed',
      opacity: 0.6,
    } as React.CSSProperties,
  } satisfies StyleMapping,

  textarea: {
    base: {
      width: '100%',
      padding: designTokens.spacing.fieldPadding,
      border: `1px solid ${designTokens.colors.border}`,
      borderRadius: designTokens.spacing.borderRadius,
      fontSize: designTokens.typography.fontSize,
      transition: designTokens.transitions.borderColor,
      minHeight: '80px',
      resize: 'vertical',
      outline: 'none',
    } as React.CSSProperties,
    
    focus: {
      borderColor: designTokens.colors.borderFocus,
    } as React.CSSProperties,
    
    error: {
      borderColor: designTokens.colors.borderError,
    } as React.CSSProperties,
    
    disabled: {
      backgroundColor: designTokens.colors.disabledBg,
      cursor: 'not-allowed',
      opacity: 0.6,
    } as React.CSSProperties,
  } satisfies StyleMapping,

  select: {
    base: {
      width: '100%',
      padding: designTokens.spacing.fieldPadding,
      border: `1px solid ${designTokens.colors.border}`,
      borderRadius: designTokens.spacing.borderRadius,
      fontSize: designTokens.typography.fontSize,
      transition: designTokens.transitions.borderColor,
      backgroundColor: designTokens.colors.white,
      cursor: 'pointer',
      outline: 'none',
    } as React.CSSProperties,
    
    focus: {
      borderColor: designTokens.colors.borderFocus,
    } as React.CSSProperties,
    
    error: {
      borderColor: designTokens.colors.borderError,
    } as React.CSSProperties,
    
    disabled: {
      backgroundColor: designTokens.colors.disabledBg,
      cursor: 'not-allowed',
      opacity: 0.6,
    } as React.CSSProperties,
  } satisfies StyleMapping,

  label: {
    base: {
      display: 'block',
      marginBottom: '0.25rem',
      fontWeight: designTokens.typography.fontWeight,
      color: designTokens.colors.gray700,
    } as React.CSSProperties,
    
    required: {
      color: designTokens.colors.error,
      marginLeft: '0.25rem',
    } as React.CSSProperties,
  },

  error: {
    base: {
      color: designTokens.colors.error,
      fontSize: designTokens.typography.errorFontSize,
      marginTop: '0.25rem',
      margin: '0',
    } as React.CSSProperties,
  },

  helperText: {
    base: {
      color: designTokens.colors.helperText,
      fontSize: designTokens.typography.errorFontSize,
      marginTop: '0.25rem',
      margin: '0',
    } as React.CSSProperties,
  },

  button: {
    base: {
      padding: `${designTokens.spacing.fieldPadding} 1rem`,
      border: 'none',
      borderRadius: designTokens.spacing.borderRadius,
      cursor: 'pointer',
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      transition: designTokens.transitions.colors,
    } as React.CSSProperties,
    
    primary: {
      backgroundColor: designTokens.colors.success,
      color: designTokens.colors.white,
    } as React.CSSProperties,
    
    primaryHover: {
      backgroundColor: designTokens.colors.successHover,
    } as React.CSSProperties,
    
    secondary: {
      backgroundColor: designTokens.colors.buttonCancel,
      color: designTokens.colors.white,
    } as React.CSSProperties,
    
    secondaryHover: {
      backgroundColor: designTokens.colors.buttonCancelHover,
    } as React.CSSProperties,
    
    disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    } as React.CSSProperties,
  },

  field: {
    container: {
      marginBottom: designTokens.spacing.fieldMargin,
    } as React.CSSProperties,
  },

  form: {
    container: {
      padding: '1.5rem',
      backgroundColor: designTokens.colors.formBg,
      borderRadius: '8px',
    } as React.CSSProperties,
    
    actions: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '1rem',
    } as React.CSSProperties,
  }
}

/**
 * Get combined styles for form elements
 * Handles state-based style merging (focus, error, disabled)
 */
export function getFormStyles(
  element: keyof typeof formStyles,
  state: {
    focused?: boolean
    hasError?: boolean
    disabled?: boolean
  } = {}
): React.CSSProperties {
  const baseStyles = formStyles[element] as Record<string, React.CSSProperties>
  
  if (!baseStyles) {
    return {}
  }
  
  let combinedStyles = { ...baseStyles.base }
  
  if (state.hasError && baseStyles.error) {
    combinedStyles = { ...combinedStyles, ...baseStyles.error }
  }
  
  if (state.focused && baseStyles.focus) {
    combinedStyles = { ...combinedStyles, ...baseStyles.focus }
  }
  
  if (state.disabled && baseStyles.disabled) {
    combinedStyles = { ...combinedStyles, ...baseStyles.disabled }
  }
  
  return combinedStyles
}

/**
 * Utility to merge custom styles with form styles
 * Allows component-specific style overrides
 */
export function mergeFormStyles(
  formStyles: React.CSSProperties,
  customStyles?: React.CSSProperties
): React.CSSProperties {
  return customStyles ? { ...formStyles, ...customStyles } : formStyles
}