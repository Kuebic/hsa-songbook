/**
 * Hook for managing responsive navigation state
 * Handles mobile menu state, animations, and breakpoint changes
 */

import { useState, useEffect, useCallback } from 'react'
import { useViewport } from './useViewport'
import type { ResponsiveNavReturn } from '../types'

export function useResponsiveNav(): ResponsiveNavReturn {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMenuAnimating, setIsMenuAnimating] = useState(false)
  const viewport = useViewport()

  // Current breakpoint for state management
  const currentBreakpoint = viewport.isMobile 
    ? 'mobile' 
    : viewport.isTablet 
    ? 'tablet' 
    : 'desktop'

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev)
  }, [])

  const openMenu = useCallback(() => {
    setIsMenuOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  // Close menu when switching from mobile to desktop
  useEffect(() => {
    if (!viewport.isMobile && isMenuOpen) {
      setIsMenuOpen(false)
    }
  }, [viewport.isMobile, isMenuOpen])

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        closeMenu()
      }
    }

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen, closeMenu])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen && viewport.isMobile) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow
      
      // Prevent scrolling
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isMenuOpen, viewport.isMobile])

  const setAnimating = useCallback((animating: boolean) => {
    setIsMenuAnimating(animating)
  }, [])

  return {
    isMenuOpen,
    isMenuAnimating,
    currentBreakpoint,
    toggleMenu,
    openMenu,
    closeMenu,
    setAnimating
  }
}

/**
 * Hook for managing navigation item state
 */
export function useNavItemState() {
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const setActive = useCallback((item: string | null) => {
    setActiveItem(item)
  }, [])

  const setHovered = useCallback((item: string | null) => {
    setHoveredItem(item)
  }, [])

  return {
    activeItem,
    hoveredItem,
    setActive,
    setHovered
  }
}

/**
 * Hook for managing navigation animations
 */
export function useNavAnimations(isOpen: boolean) {
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed')

  useEffect(() => {
    if (isOpen) {
      setAnimationState('opening')
      // Trigger opening animation
      const timer = setTimeout(() => {
        setAnimationState('open')
      }, 50) // Small delay to ensure CSS transition triggers
      
      return () => clearTimeout(timer)
    } else {
      setAnimationState('closing')
      // Allow closing animation to complete
      const timer = setTimeout(() => {
        setAnimationState('closed')
      }, 300) // Match CSS transition duration
      
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  return {
    animationState,
    isAnimating: animationState === 'opening' || animationState === 'closing',
    shouldRender: animationState !== 'closed'
  }
}

/**
 * Hook for handling navigation keyboard interactions
 */
export function useNavKeyboardHandling(
  isOpen: boolean,
  onClose: () => void,
  onNavigate?: (direction: 'up' | 'down') => void
) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          onClose()
          break
        case 'ArrowUp':
          if (onNavigate) {
            event.preventDefault()
            onNavigate('up')
          }
          break
        case 'ArrowDown':
          if (onNavigate) {
            event.preventDefault()
            onNavigate('down')
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onNavigate])
}

/**
 * Hook for managing navigation persistence
 */
export function useNavPersistence() {
  const [preferences, setPreferences] = useState({
    rememberMenuState: false,
    animationDuration: 300,
    closeOnNavigation: true
  })

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nav-preferences')
      if (stored) {
        setPreferences(prev => ({ ...prev, ...JSON.parse(stored) }))
      }
    } catch (error) {
      console.warn('Failed to load navigation preferences:', error)
    }
  }, [])

  // Save preferences to localStorage
  const updatePreference = useCallback(<K extends keyof typeof preferences>(
    key: K,
    value: typeof preferences[K]
  ) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value }
      try {
        localStorage.setItem('nav-preferences', JSON.stringify(updated))
      } catch (error) {
        console.warn('Failed to save navigation preferences:', error)
      }
      return updated
    })
  }, [])

  return {
    preferences,
    updatePreference
  }
}