import { useMemo, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { useUnifiedChordRenderer } from '../hooks/useUnifiedChordRenderer'
import { useChordSheetSettings } from '../hooks/useChordSheetSettings'
import type { ChordSheetViewerProps } from '../types/viewer.types'
import '../styles/unified-chord-display.css'
import '../styles/chordsheet.css'

interface EnhancedChordSheetViewerProps extends ChordSheetViewerProps {
  isStageMode?: boolean
  transposition?: number
  isScrolling?: boolean
  scrollSpeed?: number
}

export function ChordSheetViewer({ 
  chordProText, 
  onCenterTap,
  className,
  isStageMode = false,
  transposition = 0,
  isScrolling: externalIsScrolling,
  scrollSpeed: externalScrollSpeed
}: EnhancedChordSheetViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { renderChordSheet, preferences } = useUnifiedChordRenderer()
  const { isScrolling: localIsScrolling, scrollSpeed: localScrollSpeed } = useChordSheetSettings()
  
  // Use external props if provided, otherwise use local settings
  const isScrolling = externalIsScrolling !== undefined ? externalIsScrolling : localIsScrolling
  const scrollSpeed = externalScrollSpeed !== undefined ? externalScrollSpeed : localScrollSpeed
  
  const formattedHtml = useMemo(() => {
    if (!chordProText) {
      return '<div class="empty">No chord sheet available</div>'
    }
    
    try {
      // Use unified renderer for consistency with preview
      return renderChordSheet(chordProText, { 
        transpose: transposition,
        fontSize: preferences.fontSize,
        fontFamily: preferences.fontFamily
      })
    } catch (error) {
      console.error('ChordSheet parse error:', error)
      return '<div class="error">Unable to parse chord sheet</div>'
    }
  }, [chordProText, transposition, renderChordSheet, preferences])
  
  // Handle auto-scroll within the content container
  useEffect(() => {
    if (isScrolling && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const pixelsPerFrame = scrollSpeed / 60 // Convert to pixels per frame (60fps)
      
      const scrollInterval = setInterval(() => {
        // Scroll the container, not the window
        container.scrollTop += pixelsPerFrame
        
        // Stop scrolling when we reach the bottom
        if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
          clearInterval(scrollInterval)
        }
      }, 1000 / 60) // 60fps
      
      return () => clearInterval(scrollInterval)
    }
  }, [isScrolling, scrollSpeed])
  
  const handleCenterTap = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    
    // Check if click is within center area (40% of container)
    const threshold = 0.4
    if (
      Math.abs(clickX - centerX) < rect.width * threshold / 2 &&
      Math.abs(clickY - centerY) < rect.height * threshold / 2
    ) {
      onCenterTap?.()
    }
  }
  
  return (
    <div 
      ref={containerRef}
      className={clsx(
        "chord-sheet-container",
        isStageMode && "stage-mode-content",
        className
      )}
      onClick={handleCenterTap}
      style={{ 
        height: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div 
        ref={scrollContainerRef}
        className="chord-sheet-scroll-container"
        style={{ 
          height: '100%',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <div 
          className="chord-sheet-content"
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
          style={{ 
            minHeight: '100%',
            padding: isStageMode ? '2rem' : '1rem'
          }}
        />
      </div>
    </div>
  )
}