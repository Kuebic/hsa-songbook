import { RotateCcw } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { EnharmonicToggle } from './EnharmonicToggle'
import { KeySelector } from './KeySelector'

interface TransposeControlsProps {
  currentKey?: string
  originalKey?: string
  semitones: number
  onTranspose: (steps: number) => void
  onReset: () => void
  canTransposeUp?: boolean
  canTransposeDown?: boolean
  variant?: 'toolbar' | 'controls' | 'stage' | 'editor'
  className?: string
  // Enharmonic support
  showEnharmonicToggle?: boolean
  showKeySelector?: boolean
  onEnharmonicToggle?: () => void
  onKeySelect?: (key: string) => void
}

export function TransposeControls({
  currentKey,
  originalKey,
  semitones,
  onTranspose,
  onReset,
  canTransposeUp = true,
  canTransposeDown = true,
  variant = 'controls',
  className,
  showEnharmonicToggle = false,
  showKeySelector = false,
  onEnharmonicToggle,
  onKeySelect
}: TransposeControlsProps) {
  const isTransposed = semitones !== 0
  
  // Format semitones display
  const formatSemitones = () => {
    if (semitones === 0) return ''
    return semitones > 0 ? `+${semitones}` : `${semitones}`
  }
  
  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'toolbar':
        return {
          container: 'flex items-center gap-2',
          button: 'toolbar-button transpose-button',
          display: 'key-display',
          resetButton: 'toolbar-button reset-button'
        }
      case 'stage':
        return {
          container: 'flex items-center gap-2',
          button: 'stage-transpose-button',
          display: 'stage-key-display',
          resetButton: 'stage-reset-button'
        }
      case 'editor':
        return {
          container: 'flex items-center gap-2 px-2',
          button: 'editor-transpose-button',
          display: 'editor-key-display',
          resetButton: 'editor-reset-button'
        }
      default:
        return {
          container: 'flex items-center gap-2',
          button: 'control-button transpose-button',
          display: 'key-display',
          resetButton: 'control-button reset-button'
        }
    }
  }
  
  const styles = getVariantStyles()
  
  return (
    <div className={cn(styles.container, 'transpose-controls', className)}>
      {/* Transpose down button */}
      <button
        onClick={() => onTranspose(-1)}
        disabled={!canTransposeDown}
        className={cn(
          styles.button,
          !canTransposeDown && 'disabled'
        )}
        aria-label="Transpose down one semitone"
        title="Transpose down (Alt+-)"
      >
        <span className="transpose-symbol">−</span>
      </button>
      
      {/* Key and semitone display */}
      <div className={cn(styles.display, 'flex flex-col items-center')}>
        <span className={cn(
          'key-value',
          isTransposed && 'transposed'
        )}>
          {currentKey || '?'}
        </span>
        {isTransposed && (
          <span className="semitone-display text-xs">
            {formatSemitones()}
          </span>
        )}
      </div>
      
      {/* Transpose up button */}
      <button
        onClick={() => onTranspose(1)}
        disabled={!canTransposeUp}
        className={cn(
          styles.button,
          !canTransposeUp && 'disabled'
        )}
        aria-label="Transpose up one semitone"
        title="Transpose up (Alt++)"
      >
        <span className="transpose-symbol">+</span>
      </button>
      
      {/* Reset button - only show when transposed */}
      {isTransposed && (
        <button
          onClick={onReset}
          className={cn(styles.resetButton, 'reset-button')}
          aria-label="Reset to original key"
          title={`Reset to ${originalKey || 'original'} (Alt+0)`}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}
      
      {/* Enharmonic toggle */}
      {showEnharmonicToggle && currentKey && (
        <EnharmonicToggle
          currentKey={currentKey}
          onToggle={onEnharmonicToggle || (() => {})}
          variant="button"
        />
      )}
      
      {/* Key selector dropdown */}
      {showKeySelector && (
        <KeySelector
          currentKey={currentKey}
          onKeySelect={onKeySelect || (() => {})}
          className="transpose-key-selector"
        />
      )}
    </div>
  )
}