/**
 * Design tokens for consistent styling across the application
 * Following 8-point grid system and modern design principles
 */

export const designTokens = {
  // Spacing (8-point grid)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  
  // Colors with professional palette - using CSS variables for theme support
  colors: {
    background: {
      primary: 'var(--color-background)',
      secondary: 'var(--color-secondary)', // Off-white for form sections
      tertiary: 'var(--color-muted)',
      hover: 'var(--color-card-hover)',
      disabled: 'var(--color-muted)'
    },
    border: {
      default: 'var(--color-border)',
      focused: 'var(--color-primary)',
      error: 'var(--color-destructive)',
      success: 'var(--status-success)',
      hover: 'var(--color-border)'
    },
    text: {
      primary: 'var(--text-primary)',
      secondary: 'var(--text-secondary)',
      tertiary: 'var(--text-tertiary)',
      error: 'var(--status-error)',
      success: 'var(--status-success)',
      disabled: 'var(--text-tertiary)'
    }
  },
  
  // Shadows for depth
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    focus: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out'
  },
  
  // Border radius
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  
  // Typography
  typography: {
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    modal: 30,
    popover: 40,
    tooltip: 50
  }
} as const

// Helper function to get field border color based on state
export function getFieldBorderColor(state: 'default' | 'focused' | 'error' | 'success' | 'disabled'): string {
  switch (state) {
    case 'focused':
      return 'var(--color-primary)'
    case 'error':
      return 'var(--color-destructive)'
    case 'success':
      return 'var(--status-success)'
    case 'disabled':
      return 'var(--color-border)'
    default:
      return 'var(--color-border)'
  }
}

// Helper function to get field background color based on state
export function getFieldBackgroundColor(state: 'default' | 'error' | 'success' | 'disabled'): string {
  switch (state) {
    case 'error':
      return 'var(--color-destructive-foreground)'
    case 'success':
      return 'var(--color-card)'
    case 'disabled':
      return 'var(--color-muted)'
    default:
      return 'var(--color-card)'
  }
}

// Type exports for TypeScript
export type DesignTokens = typeof designTokens
export type SpacingToken = keyof typeof designTokens.spacing
export type ColorToken = keyof typeof designTokens.colors
export type ShadowToken = keyof typeof designTokens.shadows
export type TransitionToken = keyof typeof designTokens.transitions
export type RadiusToken = keyof typeof designTokens.radius