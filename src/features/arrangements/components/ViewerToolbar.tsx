import { Printer, Eye, EyeOff, ListPlus, Maximize } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { TransposeControls } from './TransposeControls'
import type { EnhancedTranspositionState } from '../hooks/useTransposition'

interface ViewerToolbarProps {
  onPrint: () => void
  onToggleStageMode: () => void
  onAddToSetlist?: () => void
  isStageMode: boolean
  // Enhanced transposition props
  transposition?: EnhancedTranspositionState & {
    transpose: (steps: number) => void
    reset: () => void
  }
  // Other controls
  fontSize?: number
  onFontSizeChange?: (size: number) => void
  scrollSpeed?: number
  onScrollSpeedChange?: (speed: number) => void
  isScrolling?: boolean
  onToggleScroll?: () => void
}

export function ViewerToolbar({ 
  onPrint, 
  onToggleStageMode, 
  onAddToSetlist,
  isStageMode,
  transposition,
  fontSize,
  onFontSizeChange,
  scrollSpeed,
  onScrollSpeedChange,
  isScrolling,
  onToggleScroll
}: ViewerToolbarProps) {
  
  return (
    <div className="viewer-toolbar">
      <div className="toolbar-group">
        {/* Print Button */}
        <button
          onClick={onPrint}
          className="toolbar-button"
          title="Print chord sheet (Ctrl+P)"
          aria-label="Print"
        >
          <Printer className="icon" />
          <span className="label">Print</span>
        </button>
        
        {/* Stage Mode Toggle */}
        <button
          onClick={onToggleStageMode}
          className={cn('toolbar-button', isStageMode && 'active')}
          title="Toggle stage mode (F)"
          aria-label="Stage mode"
        >
          {isStageMode ? <EyeOff className="icon" /> : <Eye className="icon" />}
          <span className="label">Stage</span>
        </button>
        
        {/* Fullscreen Button */}
        <button
          onClick={async () => {
            if (!document.fullscreenElement) {
              await document.documentElement.requestFullscreen()
            } else {
              await document.exitFullscreen()
            }
          }}
          className="toolbar-button"
          title="Toggle fullscreen"
          aria-label="Fullscreen"
        >
          <Maximize className="icon" />
          <span className="label">Fullscreen</span>
        </button>
        
        {/* Add to Setlist (Future Feature) */}
        {onAddToSetlist && (
          <button
            onClick={onAddToSetlist}
            className="toolbar-button"
            title="Add to setlist"
            aria-label="Add to setlist"
          >
            <ListPlus className="icon" />
            <span className="label">Setlist</span>
          </button>
        )}
      </div>
      
      {/* Existing controls integration */}
      <div className="toolbar-group toolbar-controls">
        {/* Transpose Controls */}
        {transposition && (
          <TransposeControls
            currentKey={transposition.currentKey}
            originalKey={transposition.originalKey}
            semitones={transposition.semitones}
            onTranspose={transposition.transpose}
            onReset={transposition.reset}
            canTransposeUp={transposition.canTransposeUp}
            canTransposeDown={transposition.canTransposeDown}
            variant="toolbar"
          />
        )}
        
        {/* Auto-scroll Control */}
        {onToggleScroll && (
          <div className="control-group">
            <button
              onClick={onToggleScroll}
              className={cn(
                'control-button scroll-button',
                isScrolling && 'active'
              )}
            >
              {isScrolling ? '⏸ Pause' : '▶ Scroll'}
            </button>
            {isScrolling && onScrollSpeedChange && (
              <input
                type="range"
                min="10"
                max="100"
                value={scrollSpeed}
                onChange={(e) => onScrollSpeedChange(Number(e.target.value))}
                className="speed-slider"
                aria-label="Scroll speed"
              />
            )}
          </div>
        )}
        
        {/* Font Size Control */}
        {fontSize && onFontSizeChange && (
          <div className="control-group">
            <span className="control-label">Size:</span>
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="font-slider"
              aria-label="Font size"
            />
            <span className="size-value">{fontSize}px</span>
          </div>
        )}
      </div>
    </div>
  )
}