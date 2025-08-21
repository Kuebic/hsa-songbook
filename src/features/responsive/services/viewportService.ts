/**
 * Viewport service for managing viewport calculations and subscriptions
 * Centralized service for viewport-related functionality
 */

import { getDeviceType, hasSafeArea } from '../utils/breakpoints'
import { debounce } from '../utils/debounce'
import type { ViewportData, ViewportService } from '../types'

class ViewportServiceImpl implements ViewportService {
  private subscribers: Set<(viewport: ViewportData) => void> = new Set()
  private currentViewport: ViewportData
  private debouncedUpdate: () => void

  constructor() {
    this.currentViewport = this.calculateViewport()
    this.debouncedUpdate = debounce(() => {
      this.updateViewport()
    }, 100)

    this.setupEventListeners()
  }

  private calculateViewport(): ViewportData {
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
    const vh = height * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
    document.documentElement.style.setProperty('--vw', `${width * 0.01}px`)

    // Calculate modern viewport units
    let dvh = height
    const svh = height
    const lvh = height

    // Use Visual Viewport API when available for more accurate values
    if (window.visualViewport) {
      dvh = window.visualViewport.height
      // SVH and LVH would need browser-specific detection
      // For now, we'll use the standard values
    }

    const deviceType = getDeviceType(width)

    return {
      width,
      height,
      dvh,
      svh,
      lvh,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      orientation: width > height ? 'landscape' : 'portrait',
      hasNotch: hasSafeArea()
    }
  }

  private updateViewport(): void {
    const newViewport = this.calculateViewport()
    
    // Only update if viewport actually changed
    if (this.hasViewportChanged(this.currentViewport, newViewport)) {
      this.currentViewport = newViewport
      this.notifySubscribers()
    }
  }

  private hasViewportChanged(old: ViewportData, current: ViewportData): boolean {
    return (
      old.width !== current.width ||
      old.height !== current.height ||
      old.orientation !== current.orientation ||
      old.isMobile !== current.isMobile ||
      old.isTablet !== current.isTablet ||
      old.isDesktop !== current.isDesktop
    )
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.currentViewport)
      } catch (error) {
        console.error('Error in viewport subscriber:', error)
      }
    })
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return

    // Standard resize events
    window.addEventListener('resize', this.debouncedUpdate)
    window.addEventListener('orientationchange', this.debouncedUpdate)
    
    // Visual Viewport API for better mobile support
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.debouncedUpdate)
      window.visualViewport.addEventListener('scroll', this.debouncedUpdate)
    }
  }

  public getCurrentViewport(): ViewportData {
    return { ...this.currentViewport }
  }

  public subscribe(callback: (viewport: ViewportData) => void): () => void {
    this.subscribers.add(callback)
    
    // Immediately call with current viewport
    callback(this.getCurrentViewport())
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback)
    }
  }

  public calculateViewportUnits(): { dvh: number; svh: number; lvh: number } {
    if (typeof window === 'undefined') {
      return { dvh: 768, svh: 768, lvh: 768 }
    }

    let dvh = window.innerHeight
    const svh = window.innerHeight
    const lvh = window.innerHeight

    // Use Visual Viewport API when available
    if (window.visualViewport) {
      dvh = window.visualViewport.height
      // Additional logic could be added here for svh/lvh
    }

    return { dvh, svh, lvh }
  }

  public isTouch(): boolean {
    if (typeof window === 'undefined') return false
    
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - vendor prefix property
      navigator.msMaxTouchPoints > 0
    )
  }

  // Cleanup method for testing or when service needs to be destroyed
  public destroy(): void {
    if (typeof window === 'undefined') return

    window.removeEventListener('resize', this.debouncedUpdate)
    window.removeEventListener('orientationchange', this.debouncedUpdate)
    
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.debouncedUpdate)
      window.visualViewport.removeEventListener('scroll', this.debouncedUpdate)
    }
    
    this.subscribers.clear()
  }
}

// Singleton instance
export const viewportService = new ViewportServiceImpl()

/**
 * React hook that uses the viewport service
 */
export function useViewportService() {
  const [viewport, setViewport] = React.useState<ViewportData>(
    () => viewportService.getCurrentViewport()
  )

  React.useEffect(() => {
    return viewportService.subscribe(setViewport)
  }, [])

  return viewport
}

/**
 * Helper functions for common viewport queries
 */
export const viewportQueries = {
  isMobile: () => viewportService.getCurrentViewport().isMobile,
  isTablet: () => viewportService.getCurrentViewport().isTablet,
  isDesktop: () => viewportService.getCurrentViewport().isDesktop,
  isPortrait: () => viewportService.getCurrentViewport().orientation === 'portrait',
  isLandscape: () => viewportService.getCurrentViewport().orientation === 'landscape',
  hasNotch: () => viewportService.getCurrentViewport().hasNotch,
  getWidth: () => viewportService.getCurrentViewport().width,
  getHeight: () => viewportService.getCurrentViewport().height
}

/**
 * Viewport breakpoint matchers
 */
export const breakpointMatchers = {
  mobile: (viewport: ViewportData) => viewport.isMobile,
  tablet: (viewport: ViewportData) => viewport.isTablet,
  desktop: (viewport: ViewportData) => viewport.isDesktop,
  portrait: (viewport: ViewportData) => viewport.orientation === 'portrait',
  landscape: (viewport: ViewportData) => viewport.orientation === 'landscape',
  touch: () => viewportService.isTouch(),
  
  // Combined matchers
  mobilePortrait: (viewport: ViewportData) => viewport.isMobile && viewport.orientation === 'portrait',
  mobileLandscape: (viewport: ViewportData) => viewport.isMobile && viewport.orientation === 'landscape',
  tabletAndUp: (viewport: ViewportData) => viewport.isTablet || viewport.isDesktop,
  mobileAndTablet: (viewport: ViewportData) => viewport.isMobile || viewport.isTablet
}

// Re-export React import for the hook
import React from 'react'