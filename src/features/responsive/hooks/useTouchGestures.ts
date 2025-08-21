/**
 * Hook for detecting touch gestures like swipes, taps, and presses
 * Useful for mobile navigation interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { TouchGestureData, SwipeGestureOptions } from '../types'

export function useTouchGestures(
  targetRef: React.RefObject<HTMLElement>,
  options: SwipeGestureOptions = {}
): TouchGestureData {
  const {
    threshold = 50,
    velocity = 0.3,
    preventScrollOnTouch = false
  } = options

  const [gestureData, setGestureData] = useState<TouchGestureData>({
    isSwipeLeft: false,
    isSwipeRight: false,
    isSwipeUp: false,
    isSwipeDown: false,
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0
  })

  const touchStartTime = useRef<number>(0)
  const touchStartPos = useRef({ x: 0, y: 0 })

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (preventScrollOnTouch) {
      event.preventDefault()
    }

    const touch = event.touches[0]
    if (!touch) return

    touchStartTime.current = Date.now()
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }

    setGestureData(prev => ({
      ...prev,
      touchStartX: touch.clientX,
      touchStartY: touch.clientY,
      isSwipeLeft: false,
      isSwipeRight: false,
      isSwipeUp: false,
      isSwipeDown: false
    }))
  }, [preventScrollOnTouch])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    const touch = event.changedTouches[0]
    if (!touch) return

    const touchEndTime = Date.now()
    const touchDuration = touchEndTime - touchStartTime.current
    
    const deltaX = touch.clientX - touchStartPos.current.x
    const deltaY = touch.clientY - touchStartPos.current.y
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const swipeVelocity = distance / touchDuration

    // Determine if this qualifies as a swipe
    const isSwipe = distance >= threshold && swipeVelocity >= velocity

    if (isSwipe) {
      // Determine primary direction
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
      
      setGestureData(prev => ({
        ...prev,
        touchEndX: touch.clientX,
        touchEndY: touch.clientY,
        isSwipeLeft: isHorizontal && deltaX < -threshold,
        isSwipeRight: isHorizontal && deltaX > threshold,
        isSwipeUp: !isHorizontal && deltaY < -threshold,
        isSwipeDown: !isHorizontal && deltaY > threshold
      }))
    } else {
      // Reset swipe states for non-swipe gestures
      setGestureData(prev => ({
        ...prev,
        touchEndX: touch.clientX,
        touchEndY: touch.clientY,
        isSwipeLeft: false,
        isSwipeRight: false,
        isSwipeUp: false,
        isSwipeDown: false
      }))
    }
  }, [threshold, velocity])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (preventScrollOnTouch) {
      event.preventDefault()
    }
  }, [preventScrollOnTouch])

  useEffect(() => {
    const element = targetRef.current
    if (!element) return

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScrollOnTouch })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScrollOnTouch })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchmove', handleTouchMove)
    }
  }, [targetRef, handleTouchStart, handleTouchEnd, handleTouchMove, preventScrollOnTouch])

  return gestureData
}

/**
 * Hook for swipe-to-navigate functionality
 */
export function useSwipeNavigation(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  options?: SwipeGestureOptions
) {
  const containerRef = useRef<HTMLElement>(null!)
  const gestures = useTouchGestures(containerRef, options)

  useEffect(() => {
    if (gestures.isSwipeLeft && onSwipeLeft) {
      onSwipeLeft()
    }
  }, [gestures.isSwipeLeft, onSwipeLeft])

  useEffect(() => {
    if (gestures.isSwipeRight && onSwipeRight) {
      onSwipeRight()
    }
  }, [gestures.isSwipeRight, onSwipeRight])

  useEffect(() => {
    if (gestures.isSwipeUp && onSwipeUp) {
      onSwipeUp()
    }
  }, [gestures.isSwipeUp, onSwipeUp])

  useEffect(() => {
    if (gestures.isSwipeDown && onSwipeDown) {
      onSwipeDown()
    }
  }, [gestures.isSwipeDown, onSwipeDown])

  return {
    containerRef,
    gestures
  }
}

/**
 * Hook for detecting long press gestures
 */
export function useLongPress(
  onLongPress: () => void,
  onPress?: () => void,
  delay = 500
) {
  const [isPressed, setIsPressed] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const elementRef = useRef<HTMLElement>(null)

  const start = useCallback((event: Event) => {
    event.preventDefault()
    setIsPressed(true)
    
    timerRef.current = setTimeout(() => {
      onLongPress()
      setIsPressed(false)
    }, delay)
  }, [onLongPress, delay])

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    
    if (isPressed) {
      setIsPressed(false)
      if (onPress) {
        onPress()
      }
    }
  }, [isPressed, onPress])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Touch events
    element.addEventListener('touchstart', start)
    element.addEventListener('touchend', clear)
    element.addEventListener('touchcancel', clear)
    element.addEventListener('touchmove', clear)

    // Mouse events for desktop
    element.addEventListener('mousedown', start)
    element.addEventListener('mouseup', clear)
    element.addEventListener('mouseleave', clear)

    return () => {
      element.removeEventListener('touchstart', start)
      element.removeEventListener('touchend', clear)
      element.removeEventListener('touchcancel', clear)
      element.removeEventListener('touchmove', clear)
      element.removeEventListener('mousedown', start)
      element.removeEventListener('mouseup', clear)
      element.removeEventListener('mouseleave', clear)
      
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [start, clear])

  return {
    elementRef,
    isPressed
  }
}

/**
 * Hook for detecting pinch/zoom gestures
 */
export function usePinchZoom(
  onPinch?: (scale: number, deltaScale: number) => void,
  onPinchStart?: () => void,
  onPinchEnd?: () => void
) {
  const [isPinching, setIsPinching] = useState(false)
  const [scale, setScale] = useState(1)
  const elementRef = useRef<HTMLElement>(null)
  const initialDistance = useRef<number>(0)
  const previousScale = useRef<number>(1)

  const getDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0
    
    const touch1 = touches[0]
    const touch2 = touches[1]
    
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }, [])

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (event.touches.length === 2) {
      setIsPinching(true)
      initialDistance.current = getDistance(event.touches)
      previousScale.current = scale
      
      if (onPinchStart) {
        onPinchStart()
      }
    }
  }, [getDistance, scale, onPinchStart])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isPinching || event.touches.length !== 2) return

    event.preventDefault()
    
    const currentDistance = getDistance(event.touches)
    const deltaScale = currentDistance / initialDistance.current
    const newScale = previousScale.current * deltaScale

    setScale(newScale)
    
    if (onPinch) {
      onPinch(newScale, deltaScale)
    }
  }, [isPinching, getDistance, onPinch])

  const handleTouchEnd = useCallback(() => {
    if (isPinching) {
      setIsPinching(false)
      
      if (onPinchEnd) {
        onPinchEnd()
      }
    }
  }, [isPinching, onPinchEnd])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    elementRef,
    isPinching,
    scale
  }
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh(
  onRefresh: () => void | Promise<void>,
  threshold = 60,
  maxDistance = 120
) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const elementRef = useRef<HTMLElement>(null)
  const startY = useRef<number>(0)

  const handleTouchStart = useCallback((event: TouchEvent) => {
    // Only trigger if we're at the top of the page
    if (window.scrollY === 0) {
      startY.current = event.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing) return

    const currentY = event.touches[0].clientY
    const deltaY = currentY - startY.current

    if (deltaY > 0) {
      setIsPulling(true)
      setPullDistance(Math.min(deltaY, maxDistance))
      
      // Prevent default scroll behavior when pulling
      if (deltaY > 10) {
        event.preventDefault()
      }
    }
  }, [isRefreshing, maxDistance])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setIsPulling(false)
    setPullDistance(0)
  }, [pullDistance, threshold, isRefreshing, onRefresh])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    elementRef,
    isPulling,
    pullDistance,
    isRefreshing,
    shouldTrigger: pullDistance >= threshold
  }
}