import { useState, useEffect, useCallback, useRef } from 'react'
import type { ChordSheetSettings } from '../types/viewer.types'

const STORAGE_KEY = 'chord-sheet-settings'

const DEFAULT_SETTINGS: ChordSheetSettings = {
  fontSize: 16,
  fontFamily: 'monospace',
  scrollSpeed: 30,
  isScrolling: false
}

export function useChordSheetSettings() {
  const [settings, setSettings] = useState<ChordSheetSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    return DEFAULT_SETTINGS
  })

  const scrollIntervalRef = useRef<number | undefined>(undefined)

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }, [settings])

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
    setSettings(prev => ({ ...prev, fontSize: size }))
  }, [])

  const setFontFamily = useCallback((family: string) => {
    setSettings(prev => ({ ...prev, fontFamily: family }))
  }, [])

  const setScrollSpeed = useCallback((speed: number) => {
    setSettings(prev => ({ ...prev, scrollSpeed: speed }))
  }, [])

  const toggleScroll = useCallback(() => {
    setSettings(prev => ({ ...prev, isScrolling: !prev.isScrolling }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
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