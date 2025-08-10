import { useRef, useImperativeHandle, forwardRef, useEffect, useState, useCallback } from 'react'
import { cn } from '../../../lib/utils'
import type { ValidationResult } from '../hooks/useChordProValidation'

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
 * Simple enhanced textarea with built-in ChordPro syntax highlighting
 * Uses contenteditable for rich text editing
 */
export const ChordSyntaxHighlight = forwardRef<ChordSyntaxHighlightRef, ChordSyntaxHighlightProps>(
  ({ value, onChange, placeholder, validation, className, disabled = false, autoFocus = false }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null)
    const [isEditing, setIsEditing] = useState(false)
    
    // Apply syntax highlighting
    const applyHighlighting = useCallback((text: string) => {
      if (!text) return placeholder ? `<span class="placeholder">${placeholder}</span>` : ''
      
      // Escape HTML
      let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      
      // Apply ChordPro highlighting
      // Comments
      html = html.replace(/^#.*/gm, '<span class="syntax-comment">$&</span>')
      
      // Directives
      html = html.replace(
        /\{([^:}]+):\s*([^}]*)\}/g,
        '<span class="syntax-directive">{$1: $2}</span>'
      )
      
      // Section directives
      html = html.replace(
        /\{(start_of_chorus|end_of_chorus|soc|eoc|start_of_verse|end_of_verse|sov|eov)\}/gi,
        '<span class="syntax-directive">{$1}</span>'
      )
      
      // Section markers
      html = html.replace(
        /\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Ending|Instrumental|Interlude|Vamp|Breakdown|Refrain)(\s+\d+)?\]/gi,
        '<span class="syntax-section">[$1$2]</span>'
      )
      
      // Chords
      html = html.replace(
        /\[([A-G][#b]?(?:maj|min|m|M|sus|dim|aug|add)?[0-9]*(?:\/[A-G][#b]?)?)\]/g,
        '<span class="syntax-chord">[$1]</span>'
      )
      
      // Convert newlines to <br> for display
      html = html.replace(/\n/g, '<br>')
      
      return html
    }, [placeholder])
    
    // Update display when value changes
    useEffect(() => {
      if (editorRef.current && !isEditing) {
        editorRef.current.innerHTML = applyHighlighting(value)
      }
    }, [value, isEditing, applyHighlighting])
    
    // Handle input
    const handleInput = useCallback(() => {
      if (editorRef.current) {
        const text = editorRef.current.innerText || ''
        onChange(text)
      }
    }, [onChange])
    
    // Handle focus
    const handleFocus = useCallback(() => {
      setIsEditing(true)
      if (editorRef.current) {
        // Switch to plain text for editing
        editorRef.current.innerText = value
      }
    }, [value])
    
    // Handle blur
    const handleBlur = useCallback(() => {
      setIsEditing(false)
      if (editorRef.current) {
        // Re-apply highlighting
        editorRef.current.innerHTML = applyHighlighting(value)
      }
    }, [value, applyHighlighting])
    
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        editorRef.current?.focus()
      },
      blur: () => {
        editorRef.current?.blur()
      },
      getSelectionRange: () => {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          return {
            start: range.startOffset,
            end: range.endOffset
          }
        }
        return { start: 0, end: 0 }
      },
      setSelectionRange: (start: number, end: number) => {
        if (editorRef.current) {
          const range = document.createRange()
          const textNode = editorRef.current.firstChild
          if (textNode) {
            range.setStart(textNode, Math.min(start, textNode.textContent?.length || 0))
            range.setEnd(textNode, Math.min(end, textNode.textContent?.length || 0))
            const selection = window.getSelection()
            selection?.removeAllRanges()
            selection?.addRange(range)
          }
        }
      },
      insertText: (text: string, moveCursor = true) => {
        if (editorRef.current) {
          const selection = window.getSelection()
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            range.deleteContents()
            const textNode = document.createTextNode(text)
            range.insertNode(textNode)
            if (moveCursor) {
              range.setStartAfter(textNode)
              range.setEndAfter(textNode)
              selection.removeAllRanges()
              selection.addRange(range)
            }
            handleInput()
          }
        }
      }
    }), [handleInput])
    
    // Auto focus
    useEffect(() => {
      if (autoFocus && editorRef.current) {
        editorRef.current.focus()
      }
    }, [autoFocus])
    
    return (
      <div className={cn("chord-syntax-container relative h-full", className)}>
        <div className="h-full border rounded-md overflow-hidden bg-background">
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              "chord-editor-content w-full h-full p-4 overflow-auto",
              "font-mono text-sm leading-relaxed",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            suppressContentEditableWarning={true}
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
        
        {/* Inline styles for syntax highlighting */}
        <style>{`
          .chord-editor-content {
            font-family: ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          
          .chord-editor-content .placeholder {
            color: #9ca3af;
            font-style: italic;
          }
          
          /* Syntax highlighting colors */
          .chord-editor-content .syntax-chord {
            color: #2563eb;
            font-weight: bold;
          }
          
          .chord-editor-content .syntax-directive {
            color: #7c3aed;
            font-weight: 600;
          }
          
          .chord-editor-content .syntax-section {
            color: #059669;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .chord-editor-content .syntax-comment {
            color: #6b7280;
            font-style: italic;
          }
          
          /* Dark mode */
          @media (prefers-color-scheme: dark) {
            .chord-editor-content .syntax-chord {
              color: #60a5fa;
            }
            
            .chord-editor-content .syntax-directive {
              color: #a78bfa;
            }
            
            .chord-editor-content .syntax-section {
              color: #34d399;
            }
            
            .chord-editor-content .syntax-comment {
              color: #9ca3af;
            }
          }
          
          /* When editing (plain text mode) */
          .chord-editor-content:focus {
            color: inherit;
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