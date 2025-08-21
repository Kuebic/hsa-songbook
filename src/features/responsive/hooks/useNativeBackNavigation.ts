import { useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useViewport } from './useViewport'
import type { NavigationState, UseNativeBackNavigationOptions, UseNativeBackNavigationReturn } from '../types/navigation.types'

/**
 * Hook to handle native browser back navigation on mobile devices
 * Replaces explicit back buttons with popstate event handling
 */
export function useNativeBackNavigation(options: UseNativeBackNavigationOptions): UseNativeBackNavigationReturn {
  const navigate = useNavigate()
  const location = useLocation()
  const viewport = useViewport()
  const { enabled = true, fallbackPath = '/songs', onNavigate, arrangement } = options
  
  // Use ref to avoid stale closure issues with event listeners
  const navigationStateRef = useRef<NavigationState>({})
  
  // Initialize navigation state from location or sessionStorage
  useEffect(() => {
    const state = location.state as NavigationState
    const sessionState = sessionStorage.getItem(`nav-state-${arrangement?.id}`)
    
    navigationStateRef.current = state || 
      (sessionState ? JSON.parse(sessionState) : {})
  }, [location.state, arrangement?.id])
  
  // Handle popstate event for browser back button
  const handlePopState = useCallback((event: PopStateEvent) => {
    // Get state from event or fallback to ref
    const state = event.state || navigationStateRef.current
    
    // Navigation priority:
    // 1. State from navigation (fromSong)
    // 2. Arrangement's songSlug
    // 3. Fallback path
    if (state?.fromSong) {
      navigate(`/songs/${state.fromSong}`)
    } else if (arrangement?.songSlug) {
      navigate(`/songs/${arrangement.songSlug}`)
    } else {
      navigate(fallbackPath)
    }
    
    // Clean up sessionStorage
    if (arrangement?.id) {
      sessionStorage.removeItem(`nav-state-${arrangement.id}`)
    }
    
    onNavigate?.()
  }, [navigate, arrangement, fallbackPath, onNavigate])
  
  // Setup popstate listener
  useEffect(() => {
    if (!enabled || !viewport.isMobile) return
    
    // Store current state in sessionStorage for persistence
    if (arrangement?.id && navigationStateRef.current) {
      sessionStorage.setItem(
        `nav-state-${arrangement.id}`,
        JSON.stringify(navigationStateRef.current)
      )
    }
    
    // Add popstate listener
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [enabled, viewport.isMobile, handlePopState, arrangement?.id])
  
  return {
    isEnabled: enabled && viewport.isMobile,
    navigationState: navigationStateRef.current,
    handleBack: () => window.history.back()
  }
}