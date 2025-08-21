/**
 * Breakpoint definitions and utilities for responsive design
 * Following mobile-first approach
 */

import type { Breakpoints, BreakpointQueries } from '../types'

// Breakpoint values in pixels
export const breakpoints: Breakpoints = {
  mobile: 768,   // Up to 767px
  tablet: 1024,  // 768px to 1023px  
  desktop: 1440, // 1024px to 1439px
  large: 1440    // 1440px and up
}

// Media query strings
export const breakpointQueries: BreakpointQueries = {
  mobile: `(max-width: ${breakpoints.mobile - 1}px)`,
  tablet: `(min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.tablet - 1}px)`,
  desktop: `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
  large: `(min-width: ${breakpoints.desktop}px)`,
  mobileOnly: `(max-width: ${breakpoints.mobile - 1}px)`,
  tabletOnly: `(min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.tablet - 1}px)`,
  desktopOnly: `(min-width: ${breakpoints.tablet}px)`,
  tabletAndUp: `(min-width: ${breakpoints.mobile}px)`,
  mobileAndTablet: `(max-width: ${breakpoints.tablet - 1}px)`
}

/**
 * Get current device type based on viewport width
 */
export function getDeviceType(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width < breakpoints.mobile) return 'mobile'
  if (width < breakpoints.tablet) return 'tablet'
  return 'desktop'
}

/**
 * Check if viewport matches a specific breakpoint
 */
export function matchesBreakpoint(width: number, breakpoint: keyof Breakpoints): boolean {
  switch (breakpoint) {
    case 'mobile':
      return width < breakpoints.mobile
    case 'tablet':
      return width >= breakpoints.mobile && width < breakpoints.tablet
    case 'desktop':
      return width >= breakpoints.tablet && width < breakpoints.desktop
    case 'large':
      return width >= breakpoints.desktop
    default:
      return false
  }
}

/**
 * Get CSS media query for a breakpoint
 */
export function getMediaQuery(breakpoint: keyof BreakpointQueries): string {
  return breakpointQueries[breakpoint]
}

/**
 * Check if a media query matches in the browser
 */
export function mediaQueryMatches(query: string): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(query).matches
}

/**
 * Create a media query listener
 */
export function createMediaQueryListener(
  query: string,
  callback: (matches: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const mediaQuery = window.matchMedia(query)
  
  const handleChange = () => {
    callback(mediaQuery.matches)
  }

  // Initial call
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
}

/**
 * Touch device detection utilities
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - vendor prefix property
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Safe area detection
 */
export function hasSafeArea(): boolean {
  if (typeof window === 'undefined') return false
  
  return CSS.supports('padding-top: env(safe-area-inset-top)')
}

/**
 * Get safe area insets
 */
export function getSafeAreaInsets() {
  if (!hasSafeArea()) {
    return { top: 0, bottom: 0, left: 0, right: 0 }
  }

  // These values come from CSS env() and may not be available in JS
  // They should be used in CSS primarily
  return {
    top: 'env(safe-area-inset-top)',
    bottom: 'env(safe-area-inset-bottom)', 
    left: 'env(safe-area-inset-left)',
    right: 'env(safe-area-inset-right)'
  }
}