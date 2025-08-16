import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PlayableSetlist } from '../types/setlist.types'

interface PlaybackContextType {
  // State
  setlist: PlayableSetlist | null
  currentIndex: number
  isPlaying: boolean
  isFullscreen: boolean
  
  // Navigation
  history: number[]
  canGoBack: boolean
  canGoForward: boolean
  
  // Customization
  currentKey?: string
  fontSize: number
  autoScroll: boolean
  scrollSpeed: number
  
  // Methods
  play: (setlist: PlayableSetlist) => void
  pause: () => void
  next: () => void
  previous: () => void
  jumpTo: (index: number) => void
  updateKey: (key: string) => void
  toggleFullscreen: () => void
  setFontSize: (size: number) => void
  setAutoScroll: (enabled: boolean) => void
  setScrollSpeed: (speed: number) => void
  exit: () => void
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined)

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [setlist, setSetlist] = useState<PlayableSetlist | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [history, setHistory] = useState<number[]>([])
  const [currentKey, setCurrentKey] = useState<string>()
  const [fontSize, setFontSize] = useState(16)
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(1)
  
  const play = useCallback((newSetlist: PlayableSetlist) => {
    setSetlist(newSetlist)
    setCurrentIndex(0)
    setHistory([0])
    setIsPlaying(true)
    navigate(`/setlist/${newSetlist.id}/play`)
  }, [navigate])
  
  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])
  
  const next = useCallback(() => {
    if (!setlist) return
    
    const nextIndex = Math.min(currentIndex + 1, setlist.arrangements.length - 1)
    if (nextIndex !== currentIndex) {
      setHistory(prev => [...prev, nextIndex])
      setCurrentIndex(nextIndex)
    }
  }, [setlist, currentIndex])
  
  const previous = useCallback(() => {
    if (!setlist) return
    
    const prevIndex = Math.max(currentIndex - 1, 0)
    if (prevIndex !== currentIndex) {
      setHistory(prev => [...prev, prevIndex])
      setCurrentIndex(prevIndex)
    }
  }, [setlist, currentIndex])
  
  const jumpTo = useCallback((index: number) => {
    if (!setlist || index < 0 || index >= setlist.arrangements.length) return
    
    setHistory(prev => [...prev, index])
    setCurrentIndex(index)
  }, [setlist])
  
  const updateKey = useCallback((key: string) => {
    setCurrentKey(key)
  }, [])
  
  const toggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } catch (error) {
        console.error('Failed to enter fullscreen:', error)
      }
    } else {
      try {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } catch (error) {
        console.error('Failed to exit fullscreen:', error)
      }
    }
  }, [isFullscreen])
  
  const exit = useCallback(() => {
    setSetlist(null)
    setCurrentIndex(0)
    setHistory([])
    setIsPlaying(false)
    setIsFullscreen(false)
    navigate(-1)
  }, [navigate])
  
  // Keyboard shortcuts - now all callbacks are defined
  useEffect(() => {
    if (!isPlaying) return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          next()
          break
        case 'ArrowLeft':
          previous()
          break
        case ' ':
          e.preventDefault()
          setAutoScroll(prev => !prev)
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen()
          } else {
            exit()
          }
          break
        default:
          // Number keys for jumping
          if (e.key >= '1' && e.key <= '9') {
            const index = parseInt(e.key) - 1
            if (index < (setlist?.arrangements.length || 0)) {
              jumpTo(index)
            }
          }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, isFullscreen, setlist, next, previous, exit, jumpTo, toggleFullscreen])
  
  const value: PlaybackContextType = {
    setlist,
    currentIndex,
    isPlaying,
    isFullscreen,
    history,
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < (setlist?.arrangements.length || 0) - 1,
    currentKey,
    fontSize,
    autoScroll,
    scrollSpeed,
    play,
    pause,
    next,
    previous,
    jumpTo,
    updateKey,
    toggleFullscreen,
    setFontSize,
    setAutoScroll,
    setScrollSpeed,
    exit,
  }
  
  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  )
}

export function usePlayback() {
  const context = useContext(PlaybackContext)
  if (!context) {
    throw new Error('usePlayback must be used within PlaybackProvider')
  }
  return context
}