/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Map CSS variables to Tailwind utilities
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          foreground: 'var(--color-destructive-foreground)',
        },
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        
        // Form-specific colors (keeping for backward compatibility)
        'border-error': '#ef4444',
        'border-focus': '#3b82f6',
        error: '#ef4444',
        'helper-text': '#64748b',
        'form-bg': '#f8fafc',
        'disabled-bg': '#f8fafc',
        success: '#10b981',
        'button-cancel': '#94a3b8'
      },
      fontSize: {
        'error': '0.875rem',
        'helper': '0.875rem'
      },
      spacing: {
        'field': '1rem',
        'field-padding': '0.5rem'
      },
      borderRadius: {
        'form': '4px'
      }
    },
  },
  plugins: [],
}