import { useMemo } from 'react'
import ChordSheetJS from 'chordsheetjs'
import { cn } from '../../../lib/utils'
import type { ValidationResult } from '../hooks/useChordProValidation'
import '../styles/chordsheet.css'

interface ChordPreviewPaneProps {
  content: string
  validation?: ValidationResult
  className?: string
  showMetadata?: boolean
  showValidation?: boolean
}

/**
 * Enhanced preview pane for ChordPro content
 * Renders the chord sheet with proper formatting and metadata display
 */
export function ChordPreviewPane({ 
  content, 
  validation,
  className,
  showMetadata = true,
  showValidation = false
}: ChordPreviewPaneProps) {
  // Parse and format the ChordPro content
  const { htmlOutput, metadata, parseError } = useMemo(() => {
    try {
      if (!content || !content.trim()) {
        return { 
          htmlOutput: '<div class="empty-preview">Enter ChordPro notation to see preview...</div>',
          metadata: null,
          parseError: null
        }
      }

      const parser = new ChordSheetJS.ChordProParser()
      const song = parser.parse(content)
      const formatter = new ChordSheetJS.HtmlTableFormatter()
      
      // Format HTML with custom classes for styling
      const html = formatter.format(song)
        .replace(/<table/g, '<table class="chord-table"')
        .replace(/<td class="chord">/g, '<td class="chord-cell">')
        .replace(/<td class="lyrics">/g, '<td class="lyrics-cell">')
      
      return {
        htmlOutput: html,
        metadata: song.metadata,
        parseError: null
      }
    } catch (error) {
      return {
        htmlOutput: '',
        metadata: null,
        parseError: error instanceof Error ? error.message : 'Failed to parse ChordPro content'
      }
    }
  }, [content])
  
  // Use validation from props or show parse error
  const effectiveValidation = validation || (parseError ? {
    isValid: false,
    errors: [parseError],
    warnings: [],
    metadata: metadata || {}
  } : null)
  
  return (
    <div className={cn("chord-preview-pane h-full flex flex-col bg-background", className)}>
      {/* Metadata header */}
      {showMetadata && (metadata || effectiveValidation?.metadata) && (
        <div className="preview-metadata px-4 py-3 border-b bg-muted/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {(metadata?.title || effectiveValidation?.metadata?.title) && (
              <div>
                <span className="font-medium text-muted-foreground">Title:</span>{' '}
                <span className="text-foreground">{metadata?.title || effectiveValidation?.metadata?.title}</span>
              </div>
            )}
            {(metadata?.artist || effectiveValidation?.metadata?.artist) && (
              <div>
                <span className="font-medium text-muted-foreground">Artist:</span>{' '}
                <span className="text-foreground">{metadata?.artist || effectiveValidation?.metadata?.artist}</span>
              </div>
            )}
            {(metadata?.key || effectiveValidation?.metadata?.key) && (
              <div>
                <span className="font-medium text-muted-foreground">Key:</span>{' '}
                <span className="text-foreground">{metadata?.key || effectiveValidation?.metadata?.key}</span>
              </div>
            )}
            {(metadata?.tempo || effectiveValidation?.metadata?.tempo) && (
              <div>
                <span className="font-medium text-muted-foreground">Tempo:</span>{' '}
                <span className="text-foreground">{metadata?.tempo || effectiveValidation?.metadata?.tempo}</span>
              </div>
            )}
            {(metadata?.time || effectiveValidation?.metadata?.time) && (
              <div>
                <span className="font-medium text-muted-foreground">Time:</span>{' '}
                <span className="text-foreground">{metadata?.time || effectiveValidation?.metadata?.time}</span>
              </div>
            )}
            {(metadata?.capo || effectiveValidation?.metadata?.capo) && (
              <div>
                <span className="font-medium text-muted-foreground">Capo:</span>{' '}
                <span className="text-foreground">{metadata?.capo || effectiveValidation?.metadata?.capo}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Validation messages (optional) */}
      {showValidation && effectiveValidation && !effectiveValidation.isValid && (
        <div className="preview-validation px-4 py-2 bg-destructive/10 border-b border-destructive/20">
          {effectiveValidation.errors.map((error, i) => (
            <div key={i} className="text-sm text-destructive flex items-start gap-1">
              <span>•</span>
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Main preview content */}
      <div className="preview-content flex-1 overflow-auto p-4">
        {parseError ? (
          <div className="error-container p-4 rounded-md bg-destructive/10 border border-destructive/20">
            <h3 className="font-semibold text-destructive mb-2">Parse Error</h3>
            <p className="text-sm text-destructive/80">{parseError}</p>
          </div>
        ) : (
          <div 
            className="chord-sheet-container"
          >
            <div
              className="chord-sheet-content"
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
            />
          </div>
        )}
      </div>
      
      {/* Custom styles for the preview */}
      <style>{`
        .chord-preview-pane .empty-preview {
          padding: 2rem;
          text-align: center;
          color: var(--muted-foreground);
          font-style: italic;
        }
        
        .chord-preview-pane .chord-sheet-container {
          line-height: 1.8;
          font-size: 14px;
        }
        
        .chord-preview-pane .chord-table {
          border-collapse: collapse;
          width: auto;
          margin-bottom: 0.5rem;
        }
        
        .chord-preview-pane .chord-cell {
          color: #2563eb;
          font-weight: bold;
          padding: 0 0.25rem;
          font-size: 0.9em;
          vertical-align: bottom;
        }
        
        .chord-preview-pane .lyrics-cell {
          padding: 0 0.25rem;
          vertical-align: top;
        }
        
        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          .chord-preview-pane .chord-cell {
            color: #60a5fa;
          }
        }
        
        /* Print styles */
        @media print {
          .preview-metadata,
          .preview-validation {
            display: none;
          }
          
          .chord-preview-pane .chord-cell {
            color: #000;
          }
        }
      `}</style>
    </div>
  )
}