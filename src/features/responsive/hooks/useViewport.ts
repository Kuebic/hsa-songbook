/**
 * Enhanced viewport hook with modern viewport units support
 * Extends the existing useResponsiveLayout hook with dvh/svh/lvh support
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { debounce } from '../utils/debounce'
import { getDeviceType, hasSafeArea } from '../utils/breakpoints'
import type { ViewportData } from '../types'

/**
 * Enhanced viewport hook that provides viewport data with modern units support
 */
function calculateViewportData(): ViewportData {
  // SSR safety
  if (typeof window === 'undefined') {
    return {
      width: 1024,
      height: 768,
      dvh: 768,
      svh: 768,
      lvh: 768,
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      orientation: 'landscape',
      hasNotch: false
    }
  }

  const width = window.innerWidth
  const height = window.innerHeight
  
  // Set CSS custom properties for viewport units fallback
  // This helps with browsers that don't support dvh/svh/lvh
  const vh = height * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
  document.documentElement.style.setProperty('--vw', `${width * 0.01}px`)

  // Calculate viewport units
  // In modern browsers, these should match the CSS values
  const dvh = height // Dynamic viewport height (changes with browser UI)
  const svh = height // Small viewport height (browser UI visible)
  const lvh = height // Large viewport height (browser UI hidden)

  // For more accurate values, we could use the Visual Viewport API
  let actualDvh = dvh
  const actualSvh = svh
  const actualLvh = lvh

  if (window.visualViewport) {
    actualDvh = window.visualViewport.height
    // SVH and LVH would need additional detection logic
    // For now, we'll use the standard values
  }

  const deviceType = getDeviceType(width)

  return {
    width,
    height,
    dvh: actualDvh,
    svh: actualSvh,
    lvh: actualLvh,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    orientation: width > height ? 'landscape' : 'portrait',
    hasNotch: hasSafeArea()
  }
}

export function useViewport(): ViewportData {
  const [viewport, setViewport] = useState<ViewportData>(calculateViewportData)

  const handleResize = useCallback(() => {
    setViewport(calculateViewportData())
  }, [])

  const debouncedHandleResize = useMemo(
    () => debounce(handleResize, 100),
    [handleResize]
  )

  useEffect(() => {
    // Standard resize events
    window.addEventListener('resize', debouncedHandleResize)
    window.addEventListener('orientationchange', debouncedHandleResize)
    
    // Visual Viewport API for better mobile support
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', debouncedHandleResize)
      window.visualViewport.addEventListener('scroll', debouncedHandleResize)
    }

    return () => {
      window.removeEventListener('resize', debouncedHandleResize)
      window.removeEventListener('orientationchange', debouncedHandleResize)
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', debouncedHandleResize)
        window.visualViewport.removeEventListener('scroll', debouncedHandleResize)
      }
    }
  }, [debouncedHandleResize])

  return viewport
}

/**
 * Hook to subscribe to specific viewport changes
 */
export function useViewportChange(
  callback: (viewport: ViewportData) => void,
  deps: (keyof ViewportData)[] = ['width', 'height']
): void {
  const viewport = useViewport()

  useEffect(() => {
    callback(viewport)
    // Note: Using computed dependencies - ESLint warning is expected for dynamic deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, viewport, ...deps.map(dep => viewport[dep])])
}

/**
 * Hook to check if viewport matches a specific condition
 */
export function useViewportMatch(
  predicate: (viewport: ViewportData) => boolean
): boolean {
  const viewport = useViewport()
  return predicate(viewport)
}

/**
 * Hook for device-specific viewport information
 */
export function useDeviceViewport() {
  const viewport = useViewport()
  
  return {
    ...viewport,
    isPortrait: viewport.orientation === 'portrait',
    isLandscape: viewport.orientation === 'landscape',
    isSmallMobile: viewport.isMobile && viewport.width < 480,
    isLargeMobile: viewport.isMobile && viewport.width >= 480,
    isSmallTablet: viewport.isTablet && viewport.width < 900,
    isLargeTablet: viewport.isTablet && viewport.width >= 900,
    hasVirtualKeyboard: window.visualViewport 
      ? window.visualViewport.height < viewport.height * 0.75
      : false
  }
}

/**
 * Hook to get safe area values (for notched devices)
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  })

  useEffect(() => {
    if (!hasSafeArea()) return

    // Unfortunately, we can't easily get safe area values in JavaScript
    // They're primarily available in CSS via env()
    // This hook provides the detection, CSS should handle the actual values
    
    const updateSafeArea = () => {
      // In a real implementation, you might need platform-specific detection
      // For now, we'll provide a basic detection
      setSafeArea({
        top: 0, // Would need platform-specific logic
        bottom: 0,
        left: 0,
        right: 0
      })
    }

    updateSafeArea()
    window.addEventListener('orientationchange', updateSafeArea)

    return () => {
      window.removeEventListener('orientationchange', updateSafeArea)
    }
  }, [])

  return {
    ...safeArea,
    hasNotch: hasSafeArea()
  }
}

/**
 * Hook to detect if the user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    // Set initial value
    handleChange()

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  return prefersReducedMotion
}

/**
 * Hook to detect touch capability
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - vendor prefix property  
        navigator.msMaxTouchPoints > 0
      )
    }

    checkTouch()
  }, [])

  return isTouch
}