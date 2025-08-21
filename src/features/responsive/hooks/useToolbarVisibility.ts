/**
 * Hook for managing toolbar visibility based on scroll behavior
 * Integrates with scroll direction and user preferences
 */

import { useState, useEffect, useCallback } from 'react'
import { useScrollDirection } from './useScrollDirection'
import { usePrefersReducedMotion } from './useViewport'
import type { ToolbarVisibilityReturn } from '../types'

export function useToolbarVisibility(
  autoHideThreshold = 100,
  scrollThreshold = 10
): ToolbarVisibilityReturn {
  const [isVisible, setIsVisible] = useState(true)
  const [isUserHidden, setIsUserHidden] = useState(false)
  const [isPermanentlyHidden, setIsPermanentlyHidden] = useState(false)
  const [autoHideEnabled, setAutoHideEnabled] = useState(true)
  const [isPinned, setIsPinned] = useState(false)
  const [height, setHeight] = useState(0)
  
  const { scrollDirection, scrollY } = useScrollDirection(scrollThreshold)

  // Auto-hide logic based on scroll behavior
  useEffect(() => {
    if (!autoHideEnabled || isUserHidden || isPermanentlyHidden || isPinned) return

    // Always show when at top of page
    if (scrollY <= autoHideThreshold) {
      setIsVisible(true)
      return
    }

    // Hide on scroll down, show on scroll up
    if (scrollDirection === 'down') {
      setIsVisible(false)
    } else if (scrollDirection === 'up') {
      setIsVisible(true)
    }
  }, [
    scrollDirection, 
    scrollY, 
    autoHideEnabled, 
    isUserHidden, 
    isPermanentlyHidden,
    isPinned,
    autoHideThreshold
  ])

  // Manual visibility controls
  const show = useCallback(() => {
    setIsVisible(true)
    setIsUserHidden(false)
  }, [])

  const hide = useCallback(() => {
    setIsVisible(false)
    setIsUserHidden(true)
  }, [])

  const toggle = useCallback(() => {
    if (isVisible) {
      hide()
    } else {
      show()
    }
  }, [isVisible, hide, show])

  const setAutoHide = useCallback((enabled: boolean) => {
    setAutoHideEnabled(enabled)
    // If disabling auto-hide, make sure toolbar is visible
    if (!enabled) {
      setIsVisible(true)
      setIsUserHidden(false)
    }
  }, [])

  const setPermanentlyHidden = useCallback((hidden: boolean) => {
    setIsPermanentlyHidden(hidden)
    if (hidden) {
      setIsVisible(false)
    } else {
      setIsVisible(true)
      setIsUserHidden(false)
    }
  }, [])

  // Pin/unpin functionality
  const pin = useCallback(() => {
    setIsPinned(true)
    setIsVisible(true)
    setIsUserHidden(false)
  }, [])

  const unpin = useCallback(() => {
    setIsPinned(false)
  }, [])

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('toolbar-preferences')
      if (stored) {
        const preferences = JSON.parse(stored)
        if (typeof preferences.autoHideEnabled === 'boolean') {
          setAutoHideEnabled(preferences.autoHideEnabled)
        }
      }
    } catch (error) {
      console.warn('Failed to load toolbar preferences:', error)
    }
  }, [])

  // Save auto-hide preference
  useEffect(() => {
    try {
      const preferences = { autoHideEnabled }
      localStorage.setItem('toolbar-preferences', JSON.stringify(preferences))
    } catch (error) {
      console.warn('Failed to save toolbar preferences:', error)
    }
  }, [autoHideEnabled])

  return {
    isVisible: isPermanentlyHidden ? false : isVisible,
    isUserHidden,
    isPermanentlyHidden,
    autoHideEnabled,
    isPinned,
    height,
    show,
    hide,
    toggle,
    setAutoHide,
    setPermanentlyHidden,
    pin,
    unpin,
    setHeight
  }
}

/**
 * Hook for managing floating action button visibility
 * Shows FAB when toolbar is hidden
 */
export function useFABVisibility(toolbarVisible: boolean, delay = 300) {
  const [isFABVisible, setIsFABVisible] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (toolbarVisible) {
      // Hide FAB immediately when toolbar shows
      setIsFABVisible(false)
    } else {
      // Show FAB with delay when toolbar hides
      const timer = setTimeout(() => {
        setIsFABVisible(true)
      }, prefersReducedMotion ? 0 : delay)

      return () => clearTimeout(timer)
    }
  }, [toolbarVisible, delay, prefersReducedMotion])

  return isFABVisible
}

/**
 * Hook for smart toolbar behavior based on context
 */
export function useSmartToolbar(options: {
  hideOnMobile?: boolean
  hideOnScroll?: boolean
  hideInEditor?: boolean
  showOnInteraction?: boolean
} = {}) {
  const {
    hideOnMobile: _hideOnMobile = false,
    hideOnScroll = true,
    hideInEditor: _hideInEditor = false,
    showOnInteraction = true
  } = options

  const [interactionTime, setInteractionTime] = useState(Date.now())
  const [isInteractionRecent, setIsInteractionRecent] = useState(true)
  
  const toolbar = useToolbarVisibility()

  // Track user interactions
  useEffect(() => {
    if (!showOnInteraction) return

    const interactions = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll']
    
    const handleInteraction = () => {
      setInteractionTime(Date.now())
      setIsInteractionRecent(true)
    }

    interactions.forEach(event => {
      document.addEventListener(event, handleInteraction, { passive: true })
    })

    return () => {
      interactions.forEach(event => {
        document.removeEventListener(event, handleInteraction)
      })
    }
  }, [showOnInteraction])

  // Hide toolbar after period of inactivity
  useEffect(() => {
    if (!showOnInteraction) return

    const timer = setTimeout(() => {
      setIsInteractionRecent(false)
    }, 3000) // 3 seconds of inactivity

    return () => clearTimeout(timer)
  }, [interactionTime, showOnInteraction])

  // Apply context-specific visibility rules
  useEffect(() => {
    if (!hideOnScroll) {
      toolbar.setAutoHide(false)
    } else if (!isInteractionRecent && showOnInteraction) {
      toolbar.setAutoHide(true)
    }
  }, [hideOnScroll, isInteractionRecent, showOnInteraction, toolbar])

  return {
    ...toolbar,
    isInteractionRecent
  }
}

/**
 * Hook for toolbar animation states
 */
export function useToolbarAnimation(isVisible: boolean) {
  const [animationState, setAnimationState] = useState<'visible' | 'hiding' | 'hidden' | 'showing'>('visible')
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimationState(isVisible ? 'visible' : 'hidden')
      return
    }

    if (isVisible) {
      setAnimationState('showing')
      const timer = setTimeout(() => {
        setAnimationState('visible')
      }, 300) // Match CSS transition duration
      
      return () => clearTimeout(timer)
    } else {
      setAnimationState('hiding')
      const timer = setTimeout(() => {
        setAnimationState('hidden')
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, prefersReducedMotion])

  return {
    animationState,
    shouldRender: animationState !== 'hidden',
    isAnimating: animationState === 'hiding' || animationState === 'showing',
    transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
    opacity: isVisible ? 1 : 0
  }
}