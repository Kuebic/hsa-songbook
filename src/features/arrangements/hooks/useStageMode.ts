import { useState, useCallback, useEffect } from 'react'

export function useStageMode() {
  const [isStageMode, setIsStageMode] = useState(false)
  
  const toggleStageMode = useCallback(async () => {
    if (!isStageMode) {
      // Enter stage mode
      try {
        await document.documentElement.requestFullscreen()
      } catch (err) {
        console.warn('Fullscreen request failed:', err)
      }
      
      document.body.classList.add('stage-mode')
      
      // Hide section labels and other non-essential elements
      document.querySelectorAll('.verse-label, .section-label, .comment').forEach(el => {
        (el as HTMLElement).classList.add('stage-hidden')
      })
      
      // Add stage mode specific styles
      document.documentElement.style.setProperty('--stage-bg-color', '#000000')
      document.documentElement.style.setProperty('--stage-text-color', '#ffffff')
      document.documentElement.style.setProperty('--stage-chord-color', '#00ff00')
      
    } else {
      // Exit stage mode
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen()
        } catch (err) {
          console.warn('Exit fullscreen failed:', err)
        }
      }
      
      document.body.classList.remove('stage-mode')
      
      // Show hidden elements
      document.querySelectorAll('.stage-hidden').forEach(el => {
        (el as HTMLElement).classList.remove('stage-hidden')
      })
      
      // Remove stage mode specific styles
      document.documentElement.style.removeProperty('--stage-bg-color')
      document.documentElement.style.removeProperty('--stage-text-color')
      document.documentElement.style.removeProperty('--stage-chord-color')
    }
    
    setIsStageMode(!isStageMode)
  }, [isStageMode])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F key to toggle stage mode
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Check if we're not in an input field
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          toggleStageMode()
        }
      }
      
      // Escape to exit stage mode
      if (e.key === 'Escape' && isStageMode) {
        toggleStageMode()
      }
    }
    
    // Print shortcut handling
    const handlePrintShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        // Let the print handler in the component handle this
        // We just need to ensure stage mode doesn't interfere
        if (isStageMode) {
          e.preventDefault()
          // Exit stage mode before printing
          toggleStageMode()
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handlePrintShortcut)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handlePrintShortcut)
    }
  }, [toggleStageMode, isStageMode])
  
  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isStageMode) {
        // If fullscreen was exited externally, exit stage mode
        document.body.classList.remove('stage-mode')
        document.querySelectorAll('.stage-hidden').forEach(el => {
          (el as HTMLElement).classList.remove('stage-hidden')
        })
        document.documentElement.style.removeProperty('--stage-bg-color')
        document.documentElement.style.removeProperty('--stage-text-color')
        document.documentElement.style.removeProperty('--stage-chord-color')
        setIsStageMode(false)
      }
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [isStageMode])
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Ensure we clean up stage mode if component unmounts while active
      if (document.body.classList.contains('stage-mode')) {
        document.body.classList.remove('stage-mode')
        document.querySelectorAll('.stage-hidden').forEach(el => {
          (el as HTMLElement).classList.remove('stage-hidden')
        })
        document.documentElement.style.removeProperty('--stage-bg-color')
        document.documentElement.style.removeProperty('--stage-text-color')
        document.documentElement.style.removeProperty('--stage-chord-color')
      }
    }
  }, [])
  
  return { isStageMode, toggleStageMode }
}