/**
 * Enhanced activity detection hook
 * Tracks user interactions with debouncing and throttling for performance
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { debounce } from '../utils/debounce'

export interface UseActivityDetectionOptions {
  enabled?: boolean
  delay?: number
  detectMouse?: boolean
  detectTouch?: boolean
  detectScroll?: boolean
  detectKeyboard?: boolean
  debounceMs?: number
  throttleMs?: number
}

export interface ActivityState {
  isActive: boolean
  lastActivity: number
  activityType: 'mouse' | 'touch' | 'scroll' | 'keyboard' | null
  inactivityDuration: number
}

export function useActivityDetection({
  enabled = true,
  delay = 3000,
  detectMouse = true,
  detectTouch = true,
  detectScroll = true,
  detectKeyboard = true,
  debounceMs = 100,
  throttleMs = 100
}: UseActivityDetectionOptions = {}): ActivityState {
  const [isActive, setIsActive] = useState(true)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [activityType, setActivityType] = useState<ActivityState['activityType']>(null)
  const [inactivityDuration, setInactivityDuration] = useState(0)
  
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const rafRef = useRef<number | undefined>(undefined)
  const lastScrollTime = useRef(0)
  const lastMouseTime = useRef(0)

  // Debounced activity handler
  const handleActivity = useCallback((type: ActivityState['activityType']) => {
    if (!enabled) return

    const now = Date.now()
    
    // Throttle scroll and mouse events
    if (type === 'scroll') {
      if (now - lastScrollTime.current < throttleMs) return
      lastScrollTime.current = now
    }
    
    if (type === 'mouse') {
      if (now - lastMouseTime.current < throttleMs) return
      lastMouseTime.current = now
    }

    // Cancel any existing RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    // Use RAF for smooth updates
    rafRef.current = requestAnimationFrame(() => {
      setIsActive(true)
      setLastActivity(now)
      setActivityType(type)
      setInactivityDuration(0)

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout for inactivity
      timeoutRef.current = setTimeout(() => {
        setIsActive(false)
        setInactivityDuration(delay)
      }, delay)
    })
  }, [enabled, delay, throttleMs])

  // Create debounced handlers for different event types
  const debouncedMouseHandler = useMemo(
    () => {
      const handler = () => handleActivity('mouse')
      return debounce(handler, debounceMs)
    },
    [handleActivity, debounceMs]
  )

  const debouncedKeyboardHandler = useMemo(
    () => {
      const handler = () => handleActivity('keyboard')
      return debounce(handler, debounceMs)
    },
    [handleActivity, debounceMs]
  )

  // Touch doesn't need debouncing
  const touchHandler = useCallback(() => {
    handleActivity('touch')
  }, [handleActivity])

  // Scroll handler with passive option
  const scrollHandler = useCallback(() => {
    handleActivity('scroll')
  }, [handleActivity])

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return

    const events: Array<[string, () => void, AddEventListenerOptions?]> = []

    if (detectMouse) {
      events.push(['mousemove', debouncedMouseHandler, { passive: true }])
      events.push(['mousedown', debouncedMouseHandler, { passive: true }])
    }

    if (detectTouch) {
      events.push(['touchstart', touchHandler, { passive: true }])
      events.push(['touchmove', touchHandler, { passive: true }])
    }

    if (detectScroll) {
      events.push(['scroll', scrollHandler, { passive: true, capture: true }])
    }

    if (detectKeyboard) {
      events.push(['keydown', debouncedKeyboardHandler])
      events.push(['keyup', debouncedKeyboardHandler])
    }

    // Add all event listeners
    events.forEach(([event, handler, options]) => {
      window.addEventListener(event, handler, options)
    })

    // Initial activity
    handleActivity(null)

    // Cleanup
    return () => {
      events.forEach(([event, handler, options]) => {
        window.removeEventListener(event, handler, options as EventListenerOptions)
      })

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [
    enabled,
    detectMouse,
    detectTouch,
    detectScroll,
    detectKeyboard,
    debouncedMouseHandler,
    touchHandler,
    scrollHandler,
    debouncedKeyboardHandler,
    handleActivity
  ])

  // Track inactivity duration
  useEffect(() => {
    if (!isActive && enabled) {
      const interval = setInterval(() => {
        setInactivityDuration(prev => prev + 1000)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isActive, enabled])

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleActivity(null)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handleActivity])

  return {
    isActive,
    lastActivity,
    activityType,
    inactivityDuration
  }
}

// Hook for monitoring specific element activity
export function useElementActivity(
  elementRef: React.RefObject<HTMLElement>,
  options: UseActivityDetectionOptions = {}
): ActivityState {
  const [isActive, setIsActive] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [activityType, setActivityType] = useState<ActivityState['activityType']>(null)
  const [inactivityDuration, setInactivityDuration] = useState(0)
  
  const {
    enabled = true,
    delay = 3000,
    detectMouse = true,
    detectTouch = true,
    detectScroll = true,
    detectKeyboard = true,
    debounceMs = 100
  } = options

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const handleActivity = useCallback((type: ActivityState['activityType']) => {
    if (!enabled) return

    const now = Date.now()
    setIsActive(true)
    setLastActivity(now)
    setActivityType(type)
    setInactivityDuration(0)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setIsActive(false)
      setInactivityDuration(delay)
    }, delay)
  }, [enabled, delay])

  // Create debounced handlers
  const debouncedHandlers = useMemo(() => {
    const mouseHandler = () => handleActivity('mouse')
    const keyboardHandler = () => handleActivity('keyboard')
    
    return {
      mouse: debounce(mouseHandler, debounceMs),
      keyboard: debounce(keyboardHandler, debounceMs),
      touch: () => handleActivity('touch'),
      scroll: () => handleActivity('scroll')
    }
  }, [handleActivity, debounceMs])

  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    const events: Array<[string, () => void, AddEventListenerOptions?]> = []

    if (detectMouse) {
      events.push(['mouseenter', debouncedHandlers.mouse, { passive: true }])
      events.push(['mousemove', debouncedHandlers.mouse, { passive: true }])
      events.push(['mousedown', debouncedHandlers.mouse, { passive: true }])
    }

    if (detectTouch) {
      events.push(['touchstart', debouncedHandlers.touch, { passive: true }])
    }

    if (detectScroll) {
      events.push(['scroll', debouncedHandlers.scroll, { passive: true }])
    }

    if (detectKeyboard) {
      events.push(['keydown', debouncedHandlers.keyboard])
      events.push(['keyup', debouncedHandlers.keyboard])
    }

    events.forEach(([event, handler, options]) => {
      element.addEventListener(event, handler, options)
    })

    return () => {
      events.forEach(([event, handler, options]) => {
        element.removeEventListener(event, handler, options as EventListenerOptions)
      })

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [
    elementRef,
    enabled,
    detectMouse,
    detectTouch,
    detectScroll,
    detectKeyboard,
    debouncedHandlers
  ])

  // Track inactivity duration
  useEffect(() => {
    if (!isActive && enabled) {
      const interval = setInterval(() => {
        setInactivityDuration(prev => prev + 1000)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isActive, enabled])

  return {
    isActive,
    lastActivity,
    activityType,
    inactivityDuration
  }
}

export default useActivityDetection