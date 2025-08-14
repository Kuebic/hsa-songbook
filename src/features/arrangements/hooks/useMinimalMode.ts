import { useState, useCallback, useEffect } from 'react'
import type { MinimalModeState } from '../types/viewer.types'

export function useMinimalMode(): MinimalModeState {
  const [isMinimal, setIsMinimal] = useState(false)
  
  const toggleMinimal = useCallback(() => {
    const newState = !isMinimal
    setIsMinimal(newState)
    
    // Handle fullscreen API
    if (newState && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err)
      })
    } else if (!newState && document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.warn('Exit fullscreen failed:', err)
      })
    }
    
    // Lock orientation on mobile (if supported)
    if (newState && 'orientation' in screen) {
      const orientation = screen.orientation as ScreenOrientation | undefined
      if (orientation && 'lock' in orientation) {
        (orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> }).lock?.('landscape').catch(() => {
          // Orientation lock may fail, that's okay
        })
      }
    }
  }, [isMinimal])
  
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMinimal) {
        toggleMinimal()
      }
    }
    
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isMinimal, toggleMinimal])
  
  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isMinimal) {
        setIsMinimal(false)
      }
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [isMinimal])
  
  return { isMinimal, toggleMinimal }
}