export const colors = {
  // Primary palette
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },
  
  // Gray scale for dark mode
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  },
  
  // Semantic colors for syntax highlighting
  chord: {
    light: '#2563eb',  // Blue for light mode
    dark: '#60a5fa',   // Lighter blue for dark mode
    hover: '#93c5fd'   // Hover state
  },
  
  directive: {
    light: '#7c3aed',  // Purple
    dark: '#a78bfa'    // Light purple
  },
  
  section: {
    light: '#059669',  // Green
    dark: '#34d399'    // Light green
  },
  
  comment: {
    light: '#6b7280',  // Gray
    dark: '#9ca3af'    // Light gray
  },
  
  error: {
    light: '#dc2626',
    dark: '#f87171'
  },
  
  // Success and warning colors
  success: {
    light: '#10b981',
    dark: '#34d399'
  },
  
  warning: {
    light: '#f59e0b',
    dark: '#fbbf24'
  }
}

// Type-safe theme colors
export type ColorTheme = 'light' | 'dark' | 'stage'

export const getThemeColors = (theme: ColorTheme) => {
  const isDark = theme === 'dark' || theme === 'stage'
  
  return {
    background: {
      primary: isDark ? colors.gray[900] : '#ffffff',
      secondary: isDark ? colors.gray[800] : colors.gray[50],
      toolbar: isDark ? colors.gray[950] : colors.gray[50],
      preview: theme === 'stage' ? '#000000' : (isDark ? '#0f172a' : '#ffffff')
    },
    text: {
      primary: isDark ? colors.gray[50] : colors.gray[900],
      secondary: isDark ? colors.gray[300] : colors.gray[600],
      tertiary: isDark ? colors.gray[400] : colors.gray[500]
    },
    syntax: {
      chord: theme === 'stage' ? '#ffeb3b' : (isDark ? colors.chord.dark : colors.chord.light),
      directive: theme === 'stage' ? '#ff9800' : (isDark ? colors.directive.dark : colors.directive.light),
      section: theme === 'stage' ? '#4caf50' : (isDark ? colors.section.dark : colors.section.light),
      comment: theme === 'stage' ? '#757575' : (isDark ? colors.comment.dark : colors.comment.light),
      error: theme === 'stage' ? '#f44336' : (isDark ? colors.error.dark : colors.error.light)
    },
    border: {
      default: isDark ? colors.gray[700] : colors.gray[200],
      focus: isDark ? colors.primary[400] : colors.primary[500]
    }
  }
}