import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/hooks/useAuth'
import { playbackService } from '../services/playbackService'

export function usePlaybackMode(setlistId?: string) {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [keyOverrides, setKeyOverrides] = useState(new Map<string, string>())
  const [_history, setHistory] = useState<number[]>([0])
  
  // Fetch setlist with populated arrangements
  const { data: setlist, isLoading, error } = useQuery({
    queryKey: ['setlists', 'playback', setlistId],
    queryFn: async () => {
      const token = await getToken()
      return playbackService.getPlayableSetlist(setlistId!, token || undefined)
    },
    enabled: !!setlistId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Current arrangement with key override
  const currentArrangement = useMemo(() => {
    if (!setlist?.arrangements[currentIndex]) return null
    const arr = setlist.arrangements[currentIndex]
    
    return {
      ...arr,
      playbackKey: keyOverrides.get(arr.arrangementId) || 
                   arr.keyOverride || 
                   arr.arrangement.key
    }
  }, [setlist, currentIndex, keyOverrides])
  
  // Navigation methods
  const navigateNext = useCallback(() => {
    if (!setlist) return
    
    const nextIndex = Math.min(currentIndex + 1, setlist.arrangements.length - 1)
    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex)
      setHistory(prev => [...prev, nextIndex])
      
      // Preload next+1 if exists
      if (setlist.arrangements[nextIndex + 1]) {
        playbackService.preloadArrangement(
          setlist.arrangements[nextIndex + 1].arrangementId
        )
      }
    }
  }, [currentIndex, setlist])
  
  const navigatePrevious = useCallback(() => {
    const prevIndex = Math.max(currentIndex - 1, 0)
    if (prevIndex !== currentIndex) {
      setCurrentIndex(prevIndex)
      setHistory(prev => [...prev, prevIndex])
    }
  }, [currentIndex])
  
  const jumpTo = useCallback((index: number) => {
    if (!setlist) return
    
    const targetIndex = Math.max(0, Math.min(index, setlist.arrangements.length - 1))
    setCurrentIndex(targetIndex)
    setHistory(prev => [...prev, targetIndex])
    
    // Preload adjacent
    if (setlist.arrangements[targetIndex + 1]) {
      playbackService.preloadArrangement(
        setlist.arrangements[targetIndex + 1].arrangementId
      )
    }
  }, [setlist])
  
  const updateKey = useCallback((arrangementId: string, key: string) => {
    setKeyOverrides(prev => new Map(prev).set(arrangementId, key))
  }, [])
  
  const exitPlayback = useCallback(() => {
    navigate(`/setlists/${setlistId}`)
  }, [navigate, setlistId])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Skip if in input field
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          navigateNext()
          break
        case 'ArrowLeft':
          e.preventDefault()
          navigatePrevious()
          break
        case 'Escape':
          e.preventDefault()
          exitPlayback()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [navigateNext, navigatePrevious, exitPlayback])
  
  return {
    // State
    setlist,
    currentArrangement,
    currentIndex,
    totalCount: setlist?.arrangements.length || 0,
    isLoading,
    error,
    
    // Navigation
    canGoNext: currentIndex < (setlist?.arrangements.length || 0) - 1,
    canGoPrevious: currentIndex > 0,
    navigateNext,
    navigatePrevious,
    jumpTo,
    exitPlayback,
    
    // Key management
    updateKey,
    keyOverrides,
  }
}