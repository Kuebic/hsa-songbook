import { useEffect } from 'react'
import { useTheme } from '@shared/contexts/useTheme'
import type { Theme } from '@shared/contexts/theme-types'

// Re-export type for backward compatibility
export type EditorTheme = Theme

/**
 * Hook to use the global theme in the editor context
 * This is now a wrapper around the global theme that adds editor-specific utilities
 */
export function useEditorTheme() {
  const { theme: currentTheme, setTheme, toggleTheme } = useTheme()
  
  // Apply theme to document root for CSS variables when used in editor
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // The global theme already sets data-theme, but we can add editor-specific classes if needed
      const editorElements = document.querySelectorAll('.chord-pro-editor-wrapper')
      editorElements.forEach(element => {
        element.setAttribute('data-theme', currentTheme)
      })
    }
  }, [currentTheme])
  
  return {
    currentTheme,
    setTheme,
    toggleTheme,
    systemTheme: currentTheme // For backward compatibility
  }
}

/**
 * Helper hook to get theme-specific colors
 * These colors work with the global theme values
 */
export function useThemeColors(theme?: Theme) {
  const { theme: globalTheme } = useTheme()
  const activeTheme = theme || globalTheme
  const isDark = activeTheme === 'dark' || activeTheme === 'stage'
  
  return {
    background: {
      primary: isDark ? '#1f2937' : '#ffffff',
      secondary: isDark ? '#111827' : '#f9fafb',
      preview: activeTheme === 'stage' ? '#000000' : (isDark ? '#0f172a' : '#ffffff')
    },
    text: {
      primary: isDark ? '#f9fafb' : '#111827',
      secondary: isDark ? '#d1d5db' : '#6b7280',
      tertiary: isDark ? '#9ca3af' : '#9ca3af'
    },
    syntax: {
      chord: activeTheme === 'stage' ? '#ffeb3b' : (isDark ? '#60a5fa' : '#2563eb'),
      directive: activeTheme === 'stage' ? '#ff9800' : (isDark ? '#a78bfa' : '#7c3aed'),
      section: activeTheme === 'stage' ? '#4caf50' : (isDark ? '#34d399' : '#059669'),
      comment: activeTheme === 'stage' ? '#757575' : (isDark ? '#9ca3af' : '#6b7280'),
      error: activeTheme === 'stage' ? '#f44336' : (isDark ? '#f87171' : '#dc2626')
    }
  }
}