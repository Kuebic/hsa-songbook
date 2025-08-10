import { useMemo } from 'react'
import ChordSheetJS from 'chordsheetjs'
import { cn } from '../../../lib/utils'
import '../styles/chordsheet.css'

interface ChordPreviewProps {
  chordProText: string
  className?: string
  showMetadata?: boolean
}

export function ChordPreview({ 
  chordProText, 
  className,
  showMetadata = true 
}: ChordPreviewProps) {
  const { htmlOutput, metadata } = useMemo(() => {
    try {
      if (!chordProText.trim()) {
        return { 
          htmlOutput: '<div class="empty text-muted-foreground p-4">Enter ChordPro format to see preview...</div>',
          metadata: null
        }
      }

      const parser = new ChordSheetJS.ChordProParser()
      const song = parser.parse(chordProText)
      const formatter = new ChordSheetJS.HtmlTableFormatter()
      
      // Format HTML with custom classes for styling
      const html = formatter.format(song)
        .replace(/<table/g, '<table class="chord-table"')
        .replace(/<td class="chord">/g, '<td class="chord-cell">')
        .replace(/<td class="lyrics">/g, '<td class="lyrics-cell">')
      
      return {
        htmlOutput: html,
        metadata: song.metadata
      }
    } catch (error) {
      return {
        htmlOutput: `<div class="error text-destructive p-4">
          <p><strong>ChordPro Parse Error:</strong></p>
          <p>${error instanceof Error ? error.message : 'Invalid format'}</p>
        </div>`,
        metadata: null
      }
    }
  }, [chordProText])

  return (
    <div className={cn("h-full overflow-auto bg-background", className)}>
      {showMetadata && metadata && (
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
            {metadata.title && (
              <div><span className="font-medium">Title:</span> {metadata.title}</div>
            )}
            {metadata.artist && (
              <div><span className="font-medium">Artist:</span> {metadata.artist}</div>
            )}
            {metadata.key && (
              <div><span className="font-medium">Key:</span> {metadata.key}</div>
            )}
            {metadata.tempo && (
              <div><span className="font-medium">Tempo:</span> {metadata.tempo}</div>
            )}
          </div>
        </div>
      )}
      
      <div 
        className="chord-sheet-container"
      >
        <div
          className="chord-sheet-content"
          dangerouslySetInnerHTML={{ __html: htmlOutput }}
        />
      </div>
    </div>
  )
}