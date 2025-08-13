import { useMemo, useRef } from 'react'
import { clsx } from 'clsx'
import { useTransposition } from '../hooks/useTransposition'
import { useUnifiedChordRenderer } from '../hooks/useUnifiedChordRenderer'
import type { ChordSheetViewerProps } from '../types/viewer.types'
import '../styles/unified-chord-display.css'
import '../styles/chordsheet.css'

export function ChordSheetViewer({ 
  chordProText, 
  onCenterTap,
  className 
}: ChordSheetViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { transposition } = useTransposition()
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
      className={clsx("chord-sheet-container", className)}
      onClick={handleCenterTap}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <div 
        className="chord-sheet-content"
        dangerouslySetInnerHTML={{ __html: formattedHtml }}
        style={{ height: '100%', overflow: 'auto' }}
      />
    </div>
  )
}