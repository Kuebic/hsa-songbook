/**
 * @file useArrangementStagePrefs.ts
 * @description Hook for managing per-arrangement stage theme preferences
 * Allows customization of display settings when app is in stage theme
 */

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@shared/contexts/ThemeContext'

export interface ArrangementStagePreferences {
  arrangementId: string
  // Only applied when app theme is "stage"
  stageOverrides?: {
    fontSize?: number        // 12-32
    chordColor?: string     // hex color
    lyricColor?: string     // hex color
    showSections?: boolean
    showComments?: boolean
    lineSpacing?: number    // 1.0-2.0
    customCSS?: string      // Advanced users
  }
  updatedAt: number
}

interface UseArrangementStagePrefsReturn {
  preferences: ArrangementStagePreferences | null
  isStageTheme: boolean
  updatePreference: <K extends keyof NonNullable<ArrangementStagePreferences['stageOverrides']>>(
    key: K,
    value: NonNullable<ArrangementStagePreferences['stageOverrides']>[K]
  ) => void
  resetToDefaults: () => void
  exportPreferences: () => string
  importPreferences: (json: string) => void
}

const STORAGE_KEY = 'arrangement-stage-prefs'

/**
 * Default stage preferences
 */
const DEFAULT_STAGE_PREFS: ArrangementStagePreferences['stageOverrides'] = {
  fontSize: 18,
  chordColor: '#fbbf24',
  lyricColor: '#ffffff',
  showSections: true,
  showComments: false,
  lineSpacing: 1.5
}

/**
 * Load preferences from localStorage
 */
function loadPreferences(arrangementId: string): ArrangementStagePreferences | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}-${arrangementId}`)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load arrangement preferences:', error)
  }
  return null
}

/**
 * Save preferences to localStorage
 */
function savePreferences(prefs: ArrangementStagePreferences): void {
  try {
    localStorage.setItem(
      `${STORAGE_KEY}-${prefs.arrangementId}`,
      JSON.stringify(prefs)
    )
  } catch (error) {
    console.error('Failed to save arrangement preferences:', error)
  }
}

/**
 * Apply stage overrides to the document
 */
function applyStageOverrides(prefs: ArrangementStagePreferences['stageOverrides']): void {
  if (!prefs) return

  const root = document.documentElement
  
  // Apply CSS custom properties for stage overrides
  if (prefs.fontSize) {
    root.style.setProperty('--stage-font-size', `${prefs.fontSize}px`)
  }
  if (prefs.chordColor) {
    root.style.setProperty('--stage-chord-color', prefs.chordColor)
  }
  if (prefs.lyricColor) {
    root.style.setProperty('--stage-lyric-color', prefs.lyricColor)
  }
  if (prefs.lineSpacing) {
    root.style.setProperty('--stage-line-spacing', String(prefs.lineSpacing))
  }
  
  // Apply custom CSS if provided
  if (prefs.customCSS) {
    let styleElement = document.getElementById('stage-custom-css')
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'stage-custom-css'
      document.head.appendChild(styleElement)
    }
    styleElement.textContent = prefs.customCSS
  }
}

/**
 * Clear stage overrides from the document
 */
function clearStageOverrides(): void {
  const root = document.documentElement
  root.style.removeProperty('--stage-font-size')
  root.style.removeProperty('--stage-chord-color')
  root.style.removeProperty('--stage-lyric-color')
  root.style.removeProperty('--stage-line-spacing')
  
  const customCSSElement = document.getElementById('stage-custom-css')
  if (customCSSElement) {
    customCSSElement.remove()
  }
}

/**
 * Hook for managing per-arrangement stage theme preferences
 */
export function useArrangementStagePrefs(arrangementId: string): UseArrangementStagePrefsReturn {
  const { theme } = useTheme()
  const isStageTheme = theme === 'stage'
  const [preferences, setPreferences] = useState<ArrangementStagePreferences | null>(null)

  // Load preferences on mount and when arrangement changes
  useEffect(() => {
    if (arrangementId) {
      const loaded = loadPreferences(arrangementId)
      if (loaded) {
        setPreferences(loaded)
      } else {
        // Create default preferences for this arrangement
        const defaultPrefs: ArrangementStagePreferences = {
          arrangementId,
          stageOverrides: { ...DEFAULT_STAGE_PREFS },
          updatedAt: Date.now()
        }
        setPreferences(defaultPrefs)
      }
    }
  }, [arrangementId])

  // Apply/clear overrides based on theme
  useEffect(() => {
    if (isStageTheme && preferences?.stageOverrides) {
      applyStageOverrides(preferences.stageOverrides)
    } else {
      clearStageOverrides()
    }
    
    // Cleanup on unmount
    return () => {
      clearStageOverrides()
    }
  }, [isStageTheme, preferences])

  /**
   * Update a specific preference
   */
  const updatePreference = useCallback(<K extends keyof NonNullable<ArrangementStagePreferences['stageOverrides']>>(
    key: K,
    value: NonNullable<ArrangementStagePreferences['stageOverrides']>[K]
  ) => {
    setPreferences(prev => {
      if (!prev) return null
      
      const updated: ArrangementStagePreferences = {
        ...prev,
        stageOverrides: {
          ...prev.stageOverrides,
          [key]: value
        },
        updatedAt: Date.now()
      }
      
      savePreferences(updated)
      
      // Apply immediately if in stage theme
      if (isStageTheme) {
        applyStageOverrides(updated.stageOverrides!)
      }
      
      return updated
    })
  }, [isStageTheme])

  /**
   * Reset to default preferences
   */
  const resetToDefaults = useCallback(() => {
    const defaultPrefs: ArrangementStagePreferences = {
      arrangementId,
      stageOverrides: { ...DEFAULT_STAGE_PREFS },
      updatedAt: Date.now()
    }
    
    setPreferences(defaultPrefs)
    savePreferences(defaultPrefs)
    
    if (isStageTheme) {
      applyStageOverrides(defaultPrefs.stageOverrides!)
    }
  }, [arrangementId, isStageTheme])

  /**
   * Export preferences as JSON
   */
  const exportPreferences = useCallback((): string => {
    return JSON.stringify(preferences, null, 2)
  }, [preferences])

  /**
   * Import preferences from JSON
   */
  const importPreferences = useCallback((json: string): void => {
    try {
      const imported = JSON.parse(json)
      if (imported && imported.stageOverrides) {
        const updated: ArrangementStagePreferences = {
          arrangementId,
          stageOverrides: imported.stageOverrides,
          updatedAt: Date.now()
        }
        
        setPreferences(updated)
        savePreferences(updated)
        
        if (isStageTheme) {
          applyStageOverrides(updated.stageOverrides!)
        }
      }
    } catch (error) {
      console.error('Failed to import preferences:', error)
      throw new Error('Invalid JSON format')
    }
  }, [arrangementId, isStageTheme])

  return {
    preferences,
    isStageTheme,
    updatePreference,
    resetToDefaults,
    exportPreferences,
    importPreferences
  }
}