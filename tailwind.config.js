/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'form-',
  content: ['./src/shared/components/form/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: '#e2e8f0',
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