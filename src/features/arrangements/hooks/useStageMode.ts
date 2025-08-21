import { useState, useCallback, useEffect, useRef } from 'react'

export function useStageMode() {
  const [isStageMode, setIsStageMode] = useState(false)
  const touchStartY = useRef<number | null>(null)
  const scrollTop = useRef<number>(0)
  
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
  
  // Touch gesture support for mobile exit
  useEffect(() => {
    if (!isStageMode) return

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
      scrollTop.current = window.scrollY || document.documentElement.scrollTop
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return

      const touchEndY = e.touches[0].clientY
      const deltaY = touchEndY - touchStartY.current

      // If we're at the top of the page and pulling down significantly
      if (scrollTop.current === 0 && deltaY > 100) {
        // Show a visual indicator that we're about to exit
        const indicator = document.getElementById('stage-exit-indicator')
        if (indicator) {
          const progress = Math.min(deltaY / 150, 1)
          indicator.style.opacity = String(progress)
          indicator.style.transform = `translateY(${Math.min(deltaY - 100, 50)}px)`
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null) return

      const touchEndY = e.changedTouches[0].clientY
      const deltaY = touchEndY - touchStartY.current

      // Hide the indicator
      const indicator = document.getElementById('stage-exit-indicator')
      if (indicator) {
        indicator.style.opacity = '0'
        indicator.style.transform = 'translateY(0)'
      }

      // Exit stage mode if pulled down enough while at top
      if (scrollTop.current === 0 && deltaY > 150) {
        toggleStageMode()
      }

      touchStartY.current = null
    }

    // Add visual indicator element
    if (!document.getElementById('stage-exit-indicator')) {
      const indicator = document.createElement('div')
      indicator.id = 'stage-exit-indicator'
      indicator.innerHTML = '↓ Pull down to exit stage mode'
      indicator.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(0);
        color: white;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.2s, transform 0.2s;
        pointer-events: none;
        z-index: 10000;
      `
      document.body.appendChild(indicator)
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      
      // Remove indicator
      const indicator = document.getElementById('stage-exit-indicator')
      if (indicator) {
        indicator.remove()
      }
    }
  }, [isStageMode, toggleStageMode])

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
      
      // Remove indicator if present
      const indicator = document.getElementById('stage-exit-indicator')
      if (indicator) {
        indicator.remove()
      }
    }
  }, [])
  
  return { isStageMode, toggleStageMode }
}