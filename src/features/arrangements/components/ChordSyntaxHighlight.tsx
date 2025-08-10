import { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react'
import AceEditor from 'react-ace'
import { cn } from '../../../lib/utils'
import type { ValidationResult } from '../hooks/useChordProValidation'
import { configureAceForChordPro, chordProTheme } from '../utils/aceChordProMode'

// Import ACE editor core and required extensions
import ace from 'ace-builds'
import 'ace-builds/src-noconflict/mode-text'
import 'ace-builds/src-noconflict/theme-textmate'
import 'ace-builds/src-noconflict/ext-language_tools'
import 'ace-builds/src-noconflict/ext-searchbox'

// Configure ACE to not use workers (avoids loading issues)
ace.config.set('basePath', '/node_modules/ace-builds/src-noconflict')
ace.config.set('modePath', '/node_modules/ace-builds/src-noconflict')
ace.config.set('themePath', '/node_modules/ace-builds/src-noconflict')
ace.config.set('workerPath', '/node_modules/ace-builds/src-noconflict')

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
 * Enhanced textarea with syntax highlighting for ChordPro format
 * Uses ACE Editor for integrated syntax highlighting
 */
export const ChordSyntaxHighlight = forwardRef<ChordSyntaxHighlightRef, ChordSyntaxHighlightProps>(
  ({ value, onChange, placeholder, validation, className, disabled = false, autoFocus = false }, ref) => {
    const aceEditorRef = useRef<any>(null)
    const [isEditorReady, setIsEditorReady] = useState(false)
    
    // Configure ACE Editor when it loads
    useEffect(() => {
      if (aceEditorRef.current && !isEditorReady) {
        const editor = aceEditorRef.current.editor
        const aceInstance = aceEditorRef.current.editor.ace || (window as any).ace || ace
        
        if (aceInstance && editor) {
          configureAceForChordPro(aceInstance, editor)
          setIsEditorReady(true)
          
          // Set focus if needed
          if (autoFocus) {
            editor.focus()
          }
        }
      }
    }, [autoFocus, isEditorReady])
    
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        if (aceEditorRef.current?.editor) {
          aceEditorRef.current.editor.focus()
        }
      },
      blur: () => {
        if (aceEditorRef.current?.editor) {
          aceEditorRef.current.editor.blur()
        }
      },
      getSelectionRange: () => {
        if (aceEditorRef.current?.editor) {
          const selection = aceEditorRef.current.editor.getSelectionRange()
          const startPos = aceEditorRef.current.editor.session.doc.positionToIndex(selection.start)
          const endPos = aceEditorRef.current.editor.session.doc.positionToIndex(selection.end)
          return { start: startPos, end: endPos }
        }
        return { start: 0, end: 0 }
      },
      setSelectionRange: (start: number, end: number) => {
        if (aceEditorRef.current?.editor) {
          const startPos = aceEditorRef.current.editor.session.doc.indexToPosition(start)
          const endPos = aceEditorRef.current.editor.session.doc.indexToPosition(end)
          aceEditorRef.current.editor.selection.setRange({
            start: startPos,
            end: endPos
          })
        }
      },
      insertText: (text: string, moveCursor = true) => {
        if (aceEditorRef.current?.editor) {
          const editor = aceEditorRef.current.editor
          editor.insert(text)
          if (moveCursor) {
            editor.focus()
          }
        }
      }
    }), [])
    
    return (
      <div className={cn("chord-syntax-container relative h-full", className)}>
        <div className="h-full border rounded-md overflow-hidden bg-background">
          <AceEditor
            ref={aceEditorRef}
            mode="text" // Will be changed to chordpro in useEffect
            theme="textmate"
            value={value}
            onChange={onChange}
            name="chord-editor"
            width="100%"
            height="100%"
            fontSize={14}
            showGutter={false}
            showPrintMargin={false}
            highlightActiveLine={true}
            readOnly={disabled}
            placeholder={placeholder || "Enter ChordPro notation...\n\nExample:\n{title: Song Title}\n{key: C}\n\n[Verse]\n[C]This is a [F]sample [G]song"}
            setOptions={{
              useWorker: false,
              showLineNumbers: false,
              tabSize: 2,
              wrap: true,
              fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace'
            }}
            editorProps={{ $blockScrolling: true }}
            className="chord-ace-editor"
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
        
        {/* Inject ChordPro theme styles */}
        <style>{chordProTheme}</style>
        
        {/* Additional ACE Editor styling */}
        <style>{`
          /* ACE Editor container styling */
          .chord-ace-editor {
            font-family: ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace !important;
          }
          
          /* Remove ACE's default border */
          .chord-syntax-container .ace_editor {
            border: none;
          }
          
          /* Ensure proper background in dark mode */
          @media (prefers-color-scheme: dark) {
            .chord-syntax-container .ace_editor,
            .chord-syntax-container .ace_content,
            .chord-syntax-container .ace_scroller {
              background-color: #0f172a;
            }
            
            .chord-syntax-container .ace_active-line {
              background: rgba(255, 255, 255, 0.05);
            }
          }
          
          /* Light mode background */
          .chord-syntax-container .ace_editor,
          .chord-syntax-container .ace_content,
          .chord-syntax-container .ace_scroller {
            background-color: #ffffff;
          }
          
          .chord-syntax-container .ace_active-line {
            background: rgba(0, 0, 0, 0.02);
          }
          
          /* Hide resize handle */
          .chord-syntax-container .ace_editor .ace_scrollbar-v,
          .chord-syntax-container .ace_editor .ace_scrollbar-h {
            scrollbar-width: thin;
          }
          
          .chord-syntax-container .ace_editor .ace_scrollbar-v::-webkit-scrollbar,
          .chord-syntax-container .ace_editor .ace_scrollbar-h::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .chord-syntax-container .ace_editor .ace_scrollbar-v::-webkit-scrollbar-thumb,
          .chord-syntax-container .ace_editor .ace_scrollbar-h::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
          }
          
          @media (prefers-color-scheme: dark) {
            .chord-syntax-container .ace_editor .ace_scrollbar-v::-webkit-scrollbar-thumb,
            .chord-syntax-container .ace_editor .ace_scrollbar-h::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
            }
          }
          
          /* Validation message animations */
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