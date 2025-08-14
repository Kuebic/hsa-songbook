import { useState } from 'react'
import { TransposeControls } from './TransposeControls'
import type { ViewerControlsProps } from '../types/viewer.types'

export function ViewerControls({
  currentKey,
  onTranspose,
  transposition,
  fontSize,
  onFontSizeChange,
  scrollSpeed,
  onScrollSpeedChange,
  isScrolling,
  onToggleScroll,
  isMinimalMode,
  onToggleMinimalMode
}: ViewerControlsProps) {
  const [showSettings, setShowSettings] = useState(false)
  
  // Use enhanced transposition if available, fallback to legacy
  const handleTransposeUp = () => {
    if (transposition) {
      transposition.transpose(1)
    } else if (onTranspose) {
      onTranspose(1)
    }
  }
  
  const handleTransposeDown = () => {
    if (transposition) {
      transposition.transpose(-1)
    } else if (onTranspose) {
      onTranspose(-1)
    }
  }
  
  const displayKey = transposition?.currentKey || currentKey
  
  if (isMinimalMode) {
    // In minimal/stage mode, show only essential floating controls
    return (
      <div className="viewer-controls minimal" style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        display: 'flex',
        gap: '0.5rem',
        zIndex: 1000
      }}>
        {/* Exit button */}
        <button
          onClick={onToggleMinimalMode}
          className="stage-mode-exit"
          style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1.25rem',
            transition: 'all 0.2s'
          }}
          aria-label="Exit stage mode"
          title="Exit stage mode (ESC)"
        >
          ✕
        </button>
        
        {/* Minimal transpose controls */}
        {(transposition || onTranspose) && (
          transposition ? (
            <TransposeControls
              currentKey={transposition.currentKey}
              originalKey={transposition.originalKey}
              semitones={transposition.semitones}
              onTranspose={transposition.transpose}
              onReset={transposition.reset}
              canTransposeUp={transposition.canTransposeUp}
              canTransposeDown={transposition.canTransposeDown}
              variant="stage"
            />
          ) : (
            <>
              <button
                onClick={() => onTranspose?.(-1)}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
                aria-label="Transpose down"
                title="Transpose down"
              >
                −
              </button>
              <span style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'var(--stage-chord-color, #00ff00)',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                minWidth: '2.5rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center'
              }}>
                {displayKey}
              </span>
              <button
                onClick={() => onTranspose?.(1)}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
                aria-label="Transpose up"
                title="Transpose up"
              >
                +
              </button>
            </>
          )
        )}
      </div>
    )
  }
  
  return (
    <div className="viewer-controls" style={{
      position: 'sticky',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'var(--color-background)',
      borderTop: '1px solid var(--color-border)',
      padding: '1rem',
      zIndex: 100
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Transpose Controls */}
        {transposition ? (
          <TransposeControls
            currentKey={transposition.currentKey}
            originalKey={transposition.originalKey}
            semitones={transposition.semitones}
            onTranspose={transposition.transpose}
            onReset={transposition.reset}
            canTransposeUp={transposition.canTransposeUp}
            canTransposeDown={transposition.canTransposeDown}
            variant="controls"
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Transpose:</span>
            <button
              onClick={handleTransposeDown}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-accent)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
              aria-label="Transpose down"
            >
              −
            </button>
            <span style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-primary)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              minWidth: '3rem',
              textAlign: 'center'
            }}>
              {displayKey}
            </span>
            <button
              onClick={handleTransposeUp}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-accent)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
              aria-label="Transpose up"
            >
              +
            </button>
          </div>
        )}
        
        {/* Auto-scroll Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={onToggleScroll}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isScrolling ? 'var(--status-error)' : 'var(--status-success)',
              color: 'var(--color-background)',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isScrolling ? '⏸ Pause' : '▶ Auto-scroll'}
          </button>
          {isScrolling && (
            <input
              type="range"
              min="10"
              max="100"
              value={scrollSpeed}
              onChange={(e) => onScrollSpeedChange(Number(e.target.value))}
              style={{
                width: '100px',
                accentColor: 'var(--status-success)'
              }}
              aria-label="Scroll speed"
            />
          )}
        </div>
        
        {/* Settings Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '0.5rem',
              backgroundColor: 'var(--color-accent)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}
            aria-label="Settings"
          >
            ⚙
          </button>
          
          {showSettings && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: '0.5rem',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
              padding: '1rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              minWidth: '250px'
            }}>
              <h3 style={{
                margin: '0 0 1rem 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>Display Settings</h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem'
                }}>
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) => onFontSizeChange(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--color-primary)'
                  }}
                />
              </div>
              
              <button
                onClick={onToggleMinimalMode}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: 'var(--color-foreground)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Enter Minimal Mode
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}