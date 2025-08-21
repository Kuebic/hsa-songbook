/**
 * Preference service for managing mobile and responsive preferences
 * Handles persistence and synchronization of user preferences
 */

import type { MobilePreferences, PreferenceService } from '../types'

const STORAGE_KEY = 'responsive-preferences'

const defaultPreferences: MobilePreferences = {
  preferReducedMotion: false,
  autoHideToolbar: true,
  enableSwipeGestures: true,
  hapticFeedback: true,
  menuAnimationDuration: 300
}

class PreferenceServiceImpl implements PreferenceService {
  private preferences: MobilePreferences
  private subscribers: Set<(preferences: MobilePreferences) => void> = new Set()

  constructor() {
    this.preferences = this.loadPreferences()
    this.setupMediaQueryListeners()
  }

  private loadPreferences(): MobilePreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...defaultPreferences, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load responsive preferences:', error)
    }
    
    // Detect system preferences
    return {
      ...defaultPreferences,
      preferReducedMotion: this.detectReducedMotion()
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences))
    } catch (error) {
      console.warn('Failed to save responsive preferences:', error)
    }
  }

  private detectReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  private setupMediaQueryListeners(): void {
    if (typeof window === 'undefined') return

    // Listen for changes to reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleReducedMotionChange = () => {
      this.setPreference('preferReducedMotion', reducedMotionQuery.matches)
    }

    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener('change', handleReducedMotionChange)
    } else {
      // Fallback for older browsers
      reducedMotionQuery.addListener(handleReducedMotionChange)
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.getPreferences())
      } catch (error) {
        console.error('Error in preference subscriber:', error)
      }
    })
  }

  public getPreferences(): MobilePreferences {
    return { ...this.preferences }
  }

  public setPreference<K extends keyof MobilePreferences>(
    key: K,
    value: MobilePreferences[K]
  ): void {
    if (this.preferences[key] !== value) {
      this.preferences[key] = value
      this.savePreferences()
      this.notifySubscribers()
    }
  }

  public resetPreferences(): void {
    this.preferences = {
      ...defaultPreferences,
      preferReducedMotion: this.detectReducedMotion()
    }
    this.savePreferences()
    this.notifySubscribers()
  }

  public subscribe(callback: (preferences: MobilePreferences) => void): () => void {
    this.subscribers.add(callback)
    
    // Immediately call with current preferences
    callback(this.getPreferences())
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback)
    }
  }

  // Cleanup method
  public destroy(): void {
    this.subscribers.clear()
  }
}

// Singleton instance
export const preferenceService = new PreferenceServiceImpl()

/**
 * React hook that uses the preference service
 */
export function usePreferences() {
  const [preferences, setPreferences] = React.useState<MobilePreferences>(
    () => preferenceService.getPreferences()
  )

  React.useEffect(() => {
    return preferenceService.subscribe(setPreferences)
  }, [])

  const updatePreference = React.useCallback(<K extends keyof MobilePreferences>(
    key: K,
    value: MobilePreferences[K]
  ) => {
    preferenceService.setPreference(key, value)
  }, [])

  const resetPreferences = React.useCallback(() => {
    preferenceService.resetPreferences()
  }, [])

  return {
    preferences,
    updatePreference,
    resetPreferences
  }
}

/**
 * Hook for specific preference values
 */
export function usePreference<K extends keyof MobilePreferences>(key: K) {
  const { preferences, updatePreference } = usePreferences()
  
  const setValue = React.useCallback((value: MobilePreferences[K]) => {
    updatePreference(key, value)
  }, [key, updatePreference])

  return [preferences[key], setValue] as const
}

/**
 * Preference validators and utilities
 */
export const preferenceValidators = {
  menuAnimationDuration: (value: number): boolean => {
    return value >= 0 && value <= 1000
  },
  
  validatePreferences: (preferences: Partial<MobilePreferences>): MobilePreferences => {
    const validated: MobilePreferences = { ...defaultPreferences }
    
    if (typeof preferences.preferReducedMotion === 'boolean') {
      validated.preferReducedMotion = preferences.preferReducedMotion
    }
    
    if (typeof preferences.autoHideToolbar === 'boolean') {
      validated.autoHideToolbar = preferences.autoHideToolbar
    }
    
    if (typeof preferences.enableSwipeGestures === 'boolean') {
      validated.enableSwipeGestures = preferences.enableSwipeGestures
    }
    
    if (typeof preferences.hapticFeedback === 'boolean') {
      validated.hapticFeedback = preferences.hapticFeedback
    }
    
    if (typeof preferences.menuAnimationDuration === 'number' && 
        preferenceValidators.menuAnimationDuration(preferences.menuAnimationDuration)) {
      validated.menuAnimationDuration = preferences.menuAnimationDuration
    }
    
    return validated
  }
}

/**
 * Preference presets for common configurations
 */
export const preferencePresets = {
  performance: {
    preferReducedMotion: true,
    autoHideToolbar: true,
    enableSwipeGestures: false,
    hapticFeedback: false,
    menuAnimationDuration: 150
  },
  
  accessibility: {
    preferReducedMotion: true,
    autoHideToolbar: false,
    enableSwipeGestures: true,
    hapticFeedback: true,
    menuAnimationDuration: 500
  },
  
  mobile: {
    preferReducedMotion: false,
    autoHideToolbar: true,
    enableSwipeGestures: true,
    hapticFeedback: true,
    menuAnimationDuration: 300
  },
  
  desktop: {
    preferReducedMotion: false,
    autoHideToolbar: false,
    enableSwipeGestures: false,
    hapticFeedback: false,
    menuAnimationDuration: 200
  }
}

/**
 * Apply a preference preset
 */
export function applyPreferencePreset(preset: keyof typeof preferencePresets): void {
  const presetPreferences = preferencePresets[preset]
  Object.entries(presetPreferences).forEach(([key, value]) => {
    preferenceService.setPreference(key as keyof MobilePreferences, value)
  })
}

/**
 * Export preference constants
 */
export const PREFERENCE_KEYS = {
  PREFER_REDUCED_MOTION: 'preferReducedMotion',
  AUTO_HIDE_TOOLBAR: 'autoHideToolbar',
  ENABLE_SWIPE_GESTURES: 'enableSwipeGestures',
  HAPTIC_FEEDBACK: 'hapticFeedback',
  MENU_ANIMATION_DURATION: 'menuAnimationDuration'
} as const

// Re-export React import for the hooks
import React from 'react'