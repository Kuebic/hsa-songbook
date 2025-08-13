import { useState, useEffect, useCallback } from 'react'
import type { EditorTheme } from '../components/ThemeSelector'

const THEME_STORAGE_KEY = 'chordpro-editor-theme'

interface UseEditorThemeReturn {
  currentTheme: EditorTheme
  setTheme: (theme: EditorTheme) => void
  toggleTheme: () => void
  systemTheme: EditorTheme
}

/**
 * Hook to manage editor theme state and persistence
 * Supports system preference detection and localStorage persistence
 */
export function useEditorTheme(initialTheme?: EditorTheme): UseEditorThemeReturn {
  // Detect system preference
  const getSystemTheme = (): EditorTheme => {
    if (typeof window === 'undefined') return 'light'
    
    // Check for system dark mode preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    
    return 'light'
  }
  
  const [systemTheme, setSystemTheme] = useState<EditorTheme>(getSystemTheme())
  
  // Initialize theme from localStorage or initial prop
  const getInitialTheme = (): EditorTheme => {
    if (typeof window === 'undefined') return initialTheme || 'light'
    
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored && ['light', 'dark', 'stage'].includes(stored)) {
        return stored as EditorTheme
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error)
    }
    
    return initialTheme || systemTheme
  }
  
  const [currentTheme, setCurrentTheme] = useState<EditorTheme>(getInitialTheme())
  
  // Set theme and persist to localStorage
  const setTheme = useCallback((theme: EditorTheme) => {
    setCurrentTheme(theme)
    
    // Persist to localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
    
    // Apply theme to document root for CSS variables
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      
      // Also set a class for additional styling hooks
      document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-stage')
      document.documentElement.classList.add(`theme-${theme}`)
    }
  }, [])
  
  // Toggle between themes
  const toggleTheme = useCallback(() => {
    const themes: EditorTheme[] = ['light', 'dark', 'stage']
    const currentIndex = themes.indexOf(currentTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }, [currentTheme, setTheme])
  
  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light'
      setSystemTheme(newSystemTheme)
      
      // If no theme is explicitly set, follow system preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (!stored) {
        setTheme(newSystemTheme)
      }
    }
    
    // Add event listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange as unknown as EventListener)
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange as unknown as EventListener)
      }
    }
  }, [setTheme])
  
  // Apply theme on mount
  useEffect(() => {
    setTheme(currentTheme)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount, not when currentTheme changes to avoid infinite loop
  
  return {
    currentTheme,
    setTheme,
    toggleTheme,
    systemTheme
  }
}

/**
 * Helper hook to get theme-specific colors
 */
export function useThemeColors(theme: EditorTheme) {
  const isDark = theme === 'dark' || theme === 'stage'
  
  return {
    background: {
      primary: isDark ? '#1f2937' : '#ffffff',
      secondary: isDark ? '#111827' : '#f9fafb',
      preview: theme === 'stage' ? '#000000' : (isDark ? '#0f172a' : '#ffffff')
    },
    text: {
      primary: isDark ? '#f9fafb' : '#111827',
      secondary: isDark ? '#d1d5db' : '#6b7280',
      tertiary: isDark ? '#9ca3af' : '#9ca3af'
    },
    syntax: {
      chord: theme === 'stage' ? '#ffeb3b' : (isDark ? '#60a5fa' : '#2563eb'),
      directive: theme === 'stage' ? '#ff9800' : (isDark ? '#a78bfa' : '#7c3aed'),
      section: theme === 'stage' ? '#4caf50' : (isDark ? '#34d399' : '#059669'),
      comment: theme === 'stage' ? '#757575' : (isDark ? '#9ca3af' : '#6b7280'),
      error: theme === 'stage' ? '#f44336' : (isDark ? '#f87171' : '#dc2626')
    }
  }
}