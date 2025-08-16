interface PlayerControlsProps {
  onPrevious: () => void
  onNext: () => void
  canGoPrevious: boolean
  canGoNext: boolean
  autoScroll: boolean
  onToggleAutoScroll: () => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  scrollSpeed: number
  onScrollSpeedChange: (speed: number) => void
}

export function PlayerControls({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  autoScroll,
  onToggleAutoScroll,
  fontSize,
  onFontSizeChange,
  scrollSpeed,
  onScrollSpeedChange
}: PlayerControlsProps) {
  return (
    <div className="player-controls" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem',
      borderTop: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-background)',
      flexShrink: 0,
      gap: '1rem'
    }}>
      {/* Navigation Controls */}
      <div className="navigation-controls" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: canGoPrevious ? 'var(--color-primary)' : 'var(--color-muted)',
            color: canGoPrevious ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: canGoPrevious ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
          aria-label="Previous song"
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3.86 8.753l5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"/>
          </svg>
          Previous
        </button>
        
        <button
          onClick={onNext}
          disabled={!canGoNext}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: canGoNext ? 'var(--color-primary)' : 'var(--color-muted)',
            color: canGoNext ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: canGoNext ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
          aria-label="Next song"
        >
          Next
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
          </svg>
        </button>
      </div>
      
      {/* Auto-scroll Controls */}
      <div className="scroll-controls" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <button
          onClick={onToggleAutoScroll}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: autoScroll ? 'var(--color-primary)' : 'transparent',
            color: autoScroll ? 'white' : 'var(--text-primary)',
            border: `1px solid ${autoScroll ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
          aria-label={autoScroll ? 'Stop auto-scroll' : 'Start auto-scroll'}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            {autoScroll ? (
              <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h2a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 9 14H7a1.5 1.5 0 0 1-1.5-1.5v-9Z"/>
            ) : (
              <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
            )}
          </svg>
          {autoScroll ? 'Pause' : 'Auto-scroll'}
        </button>
        
        {autoScroll && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <label style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              Speed:
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scrollSpeed}
              onChange={(e) => onScrollSpeedChange(parseFloat(e.target.value))}
              style={{
                width: '80px'
              }}
              aria-label="Scroll speed"
            />
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              minWidth: '2rem'
            }}>
              {scrollSpeed.toFixed(1)}x
            </span>
          </div>
        )}
      </div>
      
      {/* Font Size Controls */}
      <div className="font-controls" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <label style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          Font:
        </label>
        <button
          onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
          style={{
            padding: '0.25rem 0.5rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: 'var(--text-primary)'
          }}
          aria-label="Decrease font size"
        >
          A−
        </button>
        <span style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          minWidth: '2.5rem',
          textAlign: 'center'
        }}>
          {fontSize}px
        </span>
        <button
          onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
          style={{
            padding: '0.25rem 0.5rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: 'var(--text-primary)'
          }}
          aria-label="Increase font size"
        >
          A+
        </button>
      </div>
      
      {/* Keyboard shortcuts hint */}
      <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <span>← → Navigate</span>
        <span>Space Auto-scroll</span>
        <span>F Fullscreen</span>
        <span>1-9 Jump</span>
      </div>
    </div>
  )
}