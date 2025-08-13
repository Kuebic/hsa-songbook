import { useState, useEffect } from 'react'

export interface ResponsiveLayout {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLandscape: boolean
  viewportWidth: number
  viewportHeight: number
  deviceType: 'mobile' | 'tablet' | 'desktop'
}

/**
 * Hook to manage responsive layout detection and provide device information
 * @returns {ResponsiveLayout} Object containing device and viewport information
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const [layout, setLayout] = useState<ResponsiveLayout>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024
    const height = typeof window !== 'undefined' ? window.innerHeight : 768
    
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      isLandscape: width > height,
      viewportWidth: width,
      viewportHeight: height,
      deviceType: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
    }
  })
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const handleResize = () => {
      // Debounce resize events for performance
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const width = window.innerWidth
        const height = window.innerHeight
        
        setLayout({
          isMobile: width < 768,
          isTablet: width >= 768 && width < 1024,
          isDesktop: width >= 1024,
          isLandscape: width > height,
          viewportWidth: width,
          viewportHeight: height,
          deviceType: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
        })
      }, 150) // 150ms debounce
    }
    
    // Add event listeners
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    // Handle virtual keyboard on mobile (for better mobile experience)
    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
    }
    
    // Initial check
    handleResize()
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
      }
    }
  }, [])
  
  return layout
}

/**
 * Helper hook to check if the device has touch capability
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)
  
  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - vendor prefix
        navigator.msMaxTouchPoints > 0
      )
    }
    
    checkTouch()
  }, [])
  
  return isTouch
}

/**
 * Helper hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }
    
    // Set initial value
    handleChange()
    
    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])
  
  return prefersReducedMotion
}