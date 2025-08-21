/**
 * Hook for detecting scroll direction and managing scroll-based UI behavior
 * Useful for auto-hiding toolbars and other scroll-responsive components
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { rafThrottle } from '../utils/debounce'
import type { ScrollDirectionData } from '../types'

export function useScrollDirection(threshold = 10): ScrollDirectionData {
  const [scrollData, setScrollData] = useState<ScrollDirectionData>({
    scrollDirection: null,
    isScrolling: false,
    scrollY: 0,
    previousScrollY: 0
  })

  const ticking = useRef(false)
  const scrollTimer = useRef<NodeJS.Timeout | null>(null)

  const updateScrollDirection = useCallback(
    rafThrottle(() => {
      const scrollY = window.scrollY
      const previousScrollY = scrollData.previousScrollY

      if (Math.abs(scrollY - previousScrollY) < threshold) {
        ticking.current = false
        return
      }

      const direction = scrollY > previousScrollY ? 'down' : 'up'
      
      setScrollData(prev => ({
        scrollDirection: direction,
        isScrolling: true,
        scrollY,
        previousScrollY: prev.scrollY
      }))

      ticking.current = false

      // Clear existing timer
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current)
      }

      // Set scroll end timer
      scrollTimer.current = setTimeout(() => {
        setScrollData(prev => ({
          ...prev,
          isScrolling: false
        }))
      }, 150)
    }),
    [threshold, scrollData.previousScrollY]
  )

  const onScroll = useCallback(() => {
    if (!ticking.current) {
      updateScrollDirection()
      ticking.current = true
    }
  }, [updateScrollDirection])

  useEffect(() => {
    // Set initial scroll position
    setScrollData(prev => ({
      ...prev,
      scrollY: window.scrollY,
      previousScrollY: window.scrollY
    }))

    window.addEventListener('scroll', onScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current)
      }
    }
  }, [onScroll])

  return scrollData
}

/**
 * Hook for scroll-based element visibility
 */
export function useScrollVisibility(
  threshold = 100,
  hideOnScrollDown = true,
  showOnScrollUp = true
): { isVisible: boolean; scrollDirection: 'up' | 'down' | null } {
  const { scrollDirection, scrollY } = useScrollDirection()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Always show when at top
    if (scrollY <= threshold) {
      setIsVisible(true)
      return
    }

    // Handle scroll direction changes
    if (scrollDirection === 'down' && hideOnScrollDown) {
      setIsVisible(false)
    } else if (scrollDirection === 'up' && showOnScrollUp) {
      setIsVisible(true)
    }
  }, [scrollDirection, scrollY, threshold, hideOnScrollDown, showOnScrollUp])

  return { isVisible, scrollDirection }
}

/**
 * Hook for scroll-based animations
 */
export function useScrollAnimation() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isAtTop, setIsAtTop] = useState(true)
  const [isAtBottom, setIsAtBottom] = useState(false)

  const updateScrollProgress = useCallback(
    rafThrottle(() => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? scrollTop / docHeight : 0

      setScrollProgress(Math.min(1, Math.max(0, progress)))
      setIsAtTop(scrollTop <= 10)
      setIsAtBottom(progress > 0.95)
    }),
    []
  )

  useEffect(() => {
    updateScrollProgress()
    window.addEventListener('scroll', updateScrollProgress, { passive: true })
    window.addEventListener('resize', updateScrollProgress, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateScrollProgress)
      window.removeEventListener('resize', updateScrollProgress)
    }
  }, [updateScrollProgress])

  return {
    scrollProgress,
    isAtTop,
    isAtBottom,
    scrollPercentage: Math.round(scrollProgress * 100)
  }
}

/**
 * Hook for detecting scroll to specific elements
 */
export function useScrollToElement() {
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set())
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map())

  const registerElement = useCallback((id: string, element: HTMLElement) => {
    elementsRef.current.set(id, element)
  }, [])

  const unregisterElement = useCallback((id: string) => {
    elementsRef.current.delete(id)
    setVisibleElements(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const checkVisibility = useCallback(
    rafThrottle(() => {
      const newVisibleElements = new Set<string>()

      elementsRef.current.forEach((element, id) => {
        const rect = element.getBoundingClientRect()
        const isVisible = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth
        )

        if (isVisible) {
          newVisibleElements.add(id)
        }
      })

      setVisibleElements(newVisibleElements)
    }),
    []
  )

  useEffect(() => {
    checkVisibility()
    window.addEventListener('scroll', checkVisibility, { passive: true })
    window.addEventListener('resize', checkVisibility, { passive: true })

    return () => {
      window.removeEventListener('scroll', checkVisibility)
      window.removeEventListener('resize', checkVisibility)
    }
  }, [checkVisibility])

  return {
    visibleElements,
    registerElement,
    unregisterElement,
    isElementVisible: (id: string) => visibleElements.has(id)
  }
}

/**
 * Hook for smooth scrolling behavior
 */
export function useSmoothScroll() {
  const scrollTo = useCallback((
    target: number | HTMLElement | string,
    options: { behavior?: 'smooth' | 'instant'; block?: 'start' | 'center' | 'end' } = {}
  ) => {
    const { behavior = 'smooth', block = 'start' } = options

    if (typeof target === 'number') {
      window.scrollTo({
        top: target,
        behavior
      })
    } else if (typeof target === 'string') {
      const element = document.querySelector(target) as HTMLElement
      if (element) {
        element.scrollIntoView({ behavior, block })
      }
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior, block })
    }
  }, [])

  const scrollToTop = useCallback(() => {
    scrollTo(0)
  }, [scrollTo])

  const scrollToBottom = useCallback(() => {
    scrollTo(document.body.scrollHeight)
  }, [scrollTo])

  return {
    scrollTo,
    scrollToTop,
    scrollToBottom
  }
}