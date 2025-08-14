import { RotateCcw, Check, X } from 'lucide-react'
import { TransposeControls } from '../TransposeControls'
import { useTransposeKeyboard } from '../../hooks/useTransposeKeyboard'
import type { EditorTranspositionState } from './hooks/useEditorTransposition'

interface TransposeBarProps {
  transposition: EditorTranspositionState & {
    previewTranspose: (steps: number) => void
    setPreviewSemitones: (semitones: number) => void
    applyTransposition: () => void
    cancelPreview: () => void
    resetTransposition: () => void
    canTransposeUp: boolean
    canTransposeDown: boolean
    hasChanges: boolean
    isTransposed: boolean
  }
  className?: string
}

export function TransposeBar({ 
  transposition,
  className = ''
}: TransposeBarProps) {
  const {
    previewSemitones,
    currentKey,
    isPreviewMode,
    previewTranspose,
    applyTransposition,
    cancelPreview,
    resetTransposition,
    canTransposeUp,
    canTransposeDown,
    hasChanges,
    isTransposed
  } = transposition
  
  // Enable keyboard shortcuts
  useTransposeKeyboard(
    previewTranspose,
    cancelPreview,
    true // enabled
  )
  
  return (
    <div className={`transpose-bar ${className}`}>
      <div className="transpose-bar-inner">
        {/* Transpose controls */}
        <div className="transpose-controls-wrapper">
          <TransposeControls
            currentKey={currentKey}
            originalKey={currentKey} // In editor, we track changes differently
            semitones={previewSemitones}
            onTranspose={previewTranspose}
            onReset={cancelPreview}
            canTransposeUp={canTransposeUp}
            canTransposeDown={canTransposeDown}
            variant="editor"
          />
          
          {/* Preview/Apply actions */}
          {hasChanges && (
            <div className="transpose-actions">
              <button
                onClick={applyTransposition}
                className="transpose-action-button apply"
                title="Apply transposition to content"
                aria-label="Apply transposition"
              >
                <Check className="w-4 h-4" />
                <span>Apply</span>
              </button>
              
              <button
                onClick={cancelPreview}
                className="transpose-action-button cancel"
                title="Cancel transposition preview"
                aria-label="Cancel preview"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
          
          {/* Reset to original (if content has been transposed) */}
          {isTransposed && !hasChanges && (
            <button
              onClick={resetTransposition}
              className="transpose-action-button reset"
              title="Reset to original key"
              aria-label="Reset to original"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Original</span>
            </button>
          )}
        </div>
        
        {/* Status indicator */}
        {isPreviewMode && (
          <div className="transpose-status">
            <span className="status-badge preview">
              Preview Mode
            </span>
            <span className="status-text">
              Changes not yet applied
            </span>
          </div>
        )}
      </div>
    </div>
  )
}