import { useState, useEffect, useCallback } from 'react'
import type { ChordSheetSettings } from '../types/viewer.types'
import { chordPreferencesService } from '../services/chordPreferencesService'

const STORAGE_KEY = 'chord-sheet-settings'

// Use preferences from the service as defaults
const getDefaultSettings = (): ChordSheetSettings => {
  const prefs = chordPreferencesService.getPreferences();
  return {
    fontSize: prefs.fontSize,
    fontFamily: prefs.fontFamily
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
          fontFamily: legacy.fontFamily
        });
        // Remove legacy storage
        localStorage.removeItem(STORAGE_KEY);
        return { ...getDefaultSettings(), fontSize: legacy.fontSize, fontFamily: legacy.fontFamily };
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    return getDefaultSettings();
  })

  // Sync with preferences service
  useEffect(() => {
    const unsubscribe = chordPreferencesService.subscribe((newPrefs) => {
      setSettings({
        fontSize: newPrefs.fontSize,
        fontFamily: newPrefs.fontFamily
      });
    });

    return unsubscribe;
  }, [])

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

  const resetSettings = useCallback(() => {
    // Reset preferences service which will trigger sync
    chordPreferencesService.resetPreferences()
    setSettings(getDefaultSettings())
  }, [])

  return {
    ...settings,
    setFontSize,
    setFontFamily,
    resetSettings
  }
}