import { useRef, useImperativeHandle, forwardRef, useEffect, useMemo, useCallback } from 'react'
import { cn } from '../../../lib/utils'
import type { ValidationResult } from '../hooks/useChordProValidation'
import { useDebounce } from '../hooks/useDebounce'

export interface ChordSyntaxHighlightProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  validation?: ValidationResult
  className?: string
  disabled?: boolean
  autoFocus?: boolean
}

export interface ChordSyntaxHighlightRef {
  focus: () => void
  blur: () => void
  getSelectionRange: () => { start: number; end: number }
  setSelectionRange: (start: number, end: number) => void
  insertText: (text: string, moveCursor?: boolean) => void
}

/**
 * Integrated syntax highlighting using textarea with overlay
 * Both text and colors are visible simultaneously
 */
export const ChordSyntaxHighlight = forwardRef<ChordSyntaxHighlightRef, ChordSyntaxHighlightProps>(
  ({ value, onChange, placeholder, validation, className, disabled = false, autoFocus = false }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const highlightRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    
    // Debounce for performance
    const debouncedValue = useDebounce(value, 100)
    
    // Generate highlighted HTML
    const highlightedHtml = useMemo(() => {
      if (!debouncedValue) return ''
      
      // Escape HTML to prevent XSS
      const html = debouncedValue
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      
      // Store processed segments to avoid double processing
      const segments: Array<{start: number, end: number, html: string}> = []
      
      // Find all special patterns and their positions
      const patterns = [
        // Comments - highest priority
        { regex: /^#.*/gm, class: 'chord-comment' },
        // Directives
        { regex: /\{[^}]+\}/g, class: 'chord-directive' },
        // Section markers
        { regex: /\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Ending|Instrumental|Interlude|Vamp|Breakdown|Refrain)(\s+\d+)?\]/gi, class: 'chord-section' },
        // Chords
        { regex: /\[[A-G][#b]?(?:maj|min|m|M|sus|dim|aug|add)?[0-9]*(?:\/[A-G][#b]?)?\]/g, class: 'chord-symbol' }
      ]
      
      // Collect all matches with their positions
      patterns.forEach(pattern => {
        let match
        const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
        while ((match = regex.exec(html)) !== null) {
          segments.push({
            start: match.index,
            end: match.index + match[0].length,
            html: `<span class="${pattern.class}">${match[0]}</span>`
          })
        }
      })
      
      // Sort segments by position
      segments.sort((a, b) => a.start - b.start)
      
      // Build final HTML with all text preserved
      let result = ''
      let lastEnd = 0
      
      segments.forEach(segment => {
        // Skip overlapping segments
        if (segment.start < lastEnd) return
        
        // Add any text before this segment (THE LYRICS!)
        if (segment.start > lastEnd) {
          result += html.substring(lastEnd, segment.start)
        }
        
        // Add the highlighted segment
        result += segment.html
        lastEnd = segment.end
      })
      
      // Add any remaining text after the last segment
      if (lastEnd < html.length) {
        result += html.substring(lastEnd)
      }
      
      return result
    }, [debouncedValue])
    
    // Sync scroll between textarea and highlight layer
    const handleScroll = useCallback(() => {
      if (textareaRef.current && highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
      }
    }, [])
    
    // Handle textarea changes
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    }, [onChange])
    
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus()
      },
      blur: () => {
        textareaRef.current?.blur()
      },
      getSelectionRange: () => {
        if (textareaRef.current) {
          return {
            start: textareaRef.current.selectionStart,
            end: textareaRef.current.selectionEnd
          }
        }
        return { start: 0, end: 0 }
      },
      setSelectionRange: (start: number, end: number) => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start, end)
        }
      },
      insertText: (text: string, moveCursor = true) => {
        if (textareaRef.current) {
          const start = textareaRef.current.selectionStart
          const end = textareaRef.current.selectionEnd
          const before = value.substring(0, start)
          const after = value.substring(end)
          const newValue = before + text + after
          onChange(newValue)
          
          if (moveCursor) {
            setTimeout(() => {
              if (textareaRef.current) {
                const newPosition = start + text.length
                textareaRef.current.setSelectionRange(newPosition, newPosition)
                textareaRef.current.focus()
              }
            }, 0)
          }
        }
      }
    }), [value, onChange])
    
    // Auto focus
    useEffect(() => {
      if (autoFocus && textareaRef.current) {
        textareaRef.current.focus()
      }
    }, [autoFocus])
    
    return (
      <div className={cn("chord-syntax-container relative h-full", className)}>
        <div ref={containerRef} className="chord-editor-wrapper relative h-full border rounded-md overflow-hidden bg-background">
          {/* Highlight layer - behind textarea, shows colored syntax */}
          <div 
            ref={highlightRef}
            className="chord-highlight-layer absolute inset-0 p-4 overflow-auto pointer-events-none select-none"
            aria-hidden="true"
          >
            <div 
              className="highlight-content"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </div>
          
          {/* Textarea - in front, handles input */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onScroll={handleScroll}
            disabled={disabled}
            placeholder={placeholder || "Enter ChordPro notation...\n\nExample:\n{title: Song Title}\n{key: C}\n\n[Verse]\n[C]This is a [F]sample [G]song"}
            className={cn(
              "chord-textarea absolute inset-0 w-full h-full p-4 resize-none",
              "bg-transparent",
              "font-mono text-sm leading-relaxed",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md",
              "placeholder:text-muted-foreground/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            spellCheck={false}
          />
        </div>
        
        {/* Validation messages */}
        {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="validation-messages mt-2 p-2 bg-background border rounded-md max-h-32 overflow-y-auto">
            {validation.errors.length > 0 && (
              <div className="validation-errors mb-2">
                {validation.errors.map((err, i) => (
                  <div key={i} className="text-sm text-destructive flex items-start gap-1">
                    <span className="text-xs mt-0.5">❌</span>
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="validation-warnings">
                {validation.warnings.map((warn, i) => (
                  <div key={i} className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-1">
                    <span className="text-xs mt-0.5">⚠️</span>
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Inline styles for integrated highlighting */}
        <style>{`
          /* Editor wrapper */
          .chord-editor-wrapper {
            font-family: ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace;
            font-size: 14px;
            line-height: 1.5;
          }
          
          /* Highlight layer */
          .chord-highlight-layer {
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
            white-space: pre-wrap;
            word-wrap: break-word;
            color: #000;
          }
          
          @media (prefers-color-scheme: dark) {
            .chord-highlight-layer {
              color: #fff;
            }
          }
          
          /* Make highlight layer text invisible but preserve layout */
          .highlight-content {
            color: transparent;
          }
          
          /* Textarea styling */
          .chord-textarea {
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
            white-space: pre-wrap;
            word-wrap: break-word;
            color: #000;
            caret-color: #000;
            /* Mix blend mode to show both text and highlights */
            mix-blend-mode: multiply;
          }
          
          @media (prefers-color-scheme: dark) {
            .chord-textarea {
              color: #fff;
              caret-color: #fff;
              mix-blend-mode: screen;
            }
          }
          
          /* Syntax highlighting colors - using background colors */
          .chord-symbol {
            background: rgba(37, 99, 235, 0.2);
            padding: 0 2px;
            border-radius: 2px;
            color: transparent;
          }
          
          .chord-directive {
            background: rgba(124, 58, 237, 0.15);
            padding: 0 2px;
            border-radius: 2px;
            color: transparent;
          }
          
          .chord-section {
            background: rgba(5, 150, 105, 0.15);
            padding: 0 2px;
            border-radius: 2px;
            color: transparent;
          }
          
          .chord-comment {
            background: rgba(107, 114, 128, 0.1);
            padding: 0 2px;
            color: transparent;
          }
          
          /* Dark mode highlighting */
          @media (prefers-color-scheme: dark) {
            .chord-symbol {
              background: rgba(96, 165, 250, 0.25);
            }
            
            .chord-directive {
              background: rgba(167, 139, 250, 0.2);
            }
            
            .chord-section {
              background: rgba(52, 211, 153, 0.2);
            }
            
            .chord-comment {
              background: rgba(156, 163, 175, 0.15);
            }
          }
          
          /* Selection */
          .chord-textarea::selection {
            background-color: rgba(59, 130, 246, 0.3);
          }
          
          /* Scrollbar */
          .chord-textarea::-webkit-scrollbar,
          .chord-highlight-layer::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .chord-textarea::-webkit-scrollbar-track,
          .chord-highlight-layer::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .chord-textarea::-webkit-scrollbar-thumb,
          .chord-highlight-layer::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
          }
          
          @media (prefers-color-scheme: dark) {
            .chord-textarea::-webkit-scrollbar-thumb,
            .chord-highlight-layer::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
            }
          }
          
          /* Validation animations */
          .validation-messages {
            animation: slideUp 0.2s ease-out;
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    )
  }
)

ChordSyntaxHighlight.displayName = 'ChordSyntaxHighlight'