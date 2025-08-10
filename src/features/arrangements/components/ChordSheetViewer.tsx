import { useMemo, useRef } from 'react'
import { ChordProParser, HtmlTableFormatter } from 'chordsheetjs'
import { clsx } from 'clsx'
import { useTransposition } from '../hooks/useTransposition'
import { useChordSheetSettings } from '../hooks/useChordSheetSettings'
import type { ChordSheetViewerProps } from '../types/viewer.types'
import '../styles/chordsheet.css'

export function ChordSheetViewer({ 
  chordProText, 
  onCenterTap,
  className 
}: ChordSheetViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { transposition } = useTransposition()
  const { fontSize, fontFamily } = useChordSheetSettings()
  
  const formattedHtml = useMemo(() => {
    if (!chordProText) {
      return '<div class="empty">No chord sheet available</div>'
    }
    
    try {
      const parser = new ChordProParser()
      const song = parser.parse(chordProText)
      
      if (transposition !== 0) {
        song.transpose(transposition)
      }
      
      // Use HtmlTableFormatter for better inline chord display
      const formatter = new HtmlTableFormatter()
      const html = formatter.format(song)
      
      // Add our custom classes for styling
      return html
        .replace(/<table/g, '<table class="chord-table"')
        .replace(/<td class="chord">/g, '<td class="chord-cell">')
        .replace(/<td class="lyrics">/g, '<td class="lyrics-cell">')
    } catch (error) {
      console.error('ChordSheet parse error:', error)
      return '<div class="error">Unable to parse chord sheet</div>'
    }
  }, [chordProText, transposition])
  
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
      style={{
        fontSize: `${fontSize}px`,
        fontFamily
      }}
    >
      <div 
        className="chord-sheet-content"
        dangerouslySetInnerHTML={{ __html: formattedHtml }}
      />
    </div>
  )
}