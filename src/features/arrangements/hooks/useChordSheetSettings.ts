import { useState, useEffect, useCallback, useRef } from 'react'
import type { ChordSheetSettings } from '../types/viewer.types'
import { chordPreferencesService } from '../services/chordPreferencesService'

const STORAGE_KEY = 'chord-sheet-settings'

// Use preferences from the service as defaults
const getDefaultSettings = (): ChordSheetSettings => {
  const prefs = chordPreferencesService.getPreferences();
  return {
    fontSize: prefs.fontSize,
    fontFamily: prefs.fontFamily,
    scrollSpeed: prefs.autoScrollSpeed || 30,
    isScrolling: false
  };
}

export function useChordSheetSettings() {
  const [settings, setSettings] = useState<ChordSheetSettings>(() => {
    try {
      // First check for legacy settings
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const legacy = JSON.parse(saved);
        // Migrate to new preferences service
        chordPreferencesService.updatePreferences({
          fontSize: legacy.fontSize,
          fontFamily: legacy.fontFamily,
          autoScrollSpeed: legacy.scrollSpeed
        });
        // Remove legacy storage
        localStorage.removeItem(STORAGE_KEY);
        return { ...getDefaultSettings(), ...legacy };
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    return getDefaultSettings();
  })

  const scrollIntervalRef = useRef<number | undefined>(undefined)

  // Sync with preferences service
  useEffect(() => {
    const unsubscribe = chordPreferencesService.subscribe((newPrefs) => {
      setSettings(prev => ({
        ...prev,
        fontSize: newPrefs.fontSize,
        fontFamily: newPrefs.fontFamily,
        scrollSpeed: newPrefs.autoScrollSpeed || prev.scrollSpeed
      }));
    });

    return unsubscribe;
  }, [])

  // Handle auto-scroll
  useEffect(() => {
    if (settings.isScrolling) {
      const pixelsPerFrame = settings.scrollSpeed / 60 // Convert to pixels per frame (60fps)
      
      scrollIntervalRef.current = window.setInterval(() => {
        window.scrollBy(0, pixelsPerFrame)
      }, 1000 / 60) // 60fps
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
  }, [settings.isScrolling, settings.scrollSpeed])

  const setFontSize = useCallback((size: number) => {
    // Update both local state and preferences service
    setSettings(prev => ({ ...prev, fontSize: size }))
    chordPreferencesService.setPreference('fontSize', size)
  }, [])

  const setFontFamily = useCallback((family: string) => {
    // Update both local state and preferences service
    setSettings(prev => ({ ...prev, fontFamily: family }))
    chordPreferencesService.setPreference('fontFamily', family)
  }, [])

  const setScrollSpeed = useCallback((speed: number) => {
    // Update both local state and preferences service
    setSettings(prev => ({ ...prev, scrollSpeed: speed }))
    chordPreferencesService.setPreference('autoScrollSpeed', speed)
  }, [])

  const toggleScroll = useCallback(() => {
    setSettings(prev => ({ ...prev, isScrolling: !prev.isScrolling }))
  }, [])

  const resetSettings = useCallback(() => {
    // Reset preferences service which will trigger sync
    chordPreferencesService.resetPreferences()
    setSettings(getDefaultSettings())
  }, [])

  return {
    ...settings,
    setFontSize,
    setFontFamily,
    setScrollSpeed,
    toggleScroll,
    resetSettings
  }
}