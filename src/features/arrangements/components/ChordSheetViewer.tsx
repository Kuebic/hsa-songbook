import React, { useMemo, useRef } from 'react'
import { clsx } from 'clsx'
import { useUnifiedChordRenderer } from '../hooks/useUnifiedChordRenderer'
import type { ChordSheetViewerProps } from '../types/viewer.types'
import '../styles/unified-chord-display.css'
import '../styles/chordsheet.css'

interface EnhancedChordSheetViewerProps extends ChordSheetViewerProps {
  isStageMode?: boolean
  transposition?: number
}

const ChordSheetViewerComponent: React.FC<EnhancedChordSheetViewerProps> = ({ 
  chordProText, 
  onCenterTap,
  className,
  isStageMode = false,
  transposition = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { renderChordSheet, preferences } = useUnifiedChordRenderer()
  
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
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div 
        ref={scrollContainerRef}
        className="chord-sheet-scroll-container"
        style={{ 
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          maxHeight: '100%',
          padding: isStageMode ? '2rem' : '0.5rem 1rem'
        }}
        dangerouslySetInnerHTML={{ __html: formattedHtml }}
      />
    </div>
  )
}

export const ChordSheetViewer = React.memo(ChordSheetViewerComponent)