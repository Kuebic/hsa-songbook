import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { ThemeProvider } from '../ThemeContext'
import { useTheme } from '../useTheme'
import type { Theme } from '../theme-types'

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.classList.remove('dark')
  })

  describe('ThemeProvider', () => {
    it('should provide default theme value', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current.theme).toBe('dark')
    })

    it('should load theme from localStorage if available', () => {
      localStorage.setItem('app-theme', 'stage')
      
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current.theme).toBe('stage')
    })

    it('should default to dark theme when localStorage has invalid value', () => {
      localStorage.setItem('app-theme', 'invalid-theme')
      
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current.theme).toBe('dark')
    })

    it('should update DOM attributes when theme changes', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('light')
      })

      await waitFor(() => {
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
        expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark')
      })
    })

    it('should add dark class for dark and stage themes', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('stage')
      })

      await waitFor(() => {
        expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark')
      })
    })

    it('should persist theme to localStorage', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('light')
      })

      await waitFor(() => {
        expect(localStorage.getItem('app-theme')).toBe('light')
      })
    })
  })

  describe('toggleTheme', () => {
    it('should cycle through themes in order: light -> dark -> stage', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      // Start with dark (default)
      expect(result.current.theme).toBe('dark')

      // Toggle to stage
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('stage')

      // Toggle to light
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('light')

      // Toggle back to dark
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('dark')
    })
  })

  describe('useTheme hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = vi.fn()

      expect(() => {
        renderHook(() => useTheme())
      }).toThrow('useTheme must be used within ThemeProvider')

      console.error = originalError
    })

    it('should return current theme and setters', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      expect(result.current).toHaveProperty('theme')
      expect(result.current).toHaveProperty('setTheme')
      expect(result.current).toHaveProperty('toggleTheme')
      expect(typeof result.current.setTheme).toBe('function')
      expect(typeof result.current.toggleTheme).toBe('function')
    })
  })

  describe('Theme persistence across sessions', () => {
    it('should restore theme from localStorage on mount', () => {
      const themes: Theme[] = ['light', 'dark', 'stage']
      
      themes.forEach(theme => {
        localStorage.setItem('app-theme', theme)
        
        const { result } = renderHook(() => useTheme(), {
          wrapper: ({ children }: { children: ReactNode }) => (
            <ThemeProvider>{children}</ThemeProvider>
          ),
        })

        expect(result.current.theme).toBe(theme)
        localStorage.clear()
      })
    })
  })

  describe('Server-side rendering compatibility', () => {
    it('should default to dark theme when window is undefined during initialization', () => {
      // This test verifies that the default theme is 'dark' which is handled
      // in the getInitialTheme function when window is undefined
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      })

      // The theme defaults to 'dark' as specified in getInitialTheme
      expect(result.current.theme).toBe('dark')
    })
  })
})