import { useState } from 'react'
import type { ViewerControlsProps } from '../types/viewer.types'

export function ViewerControls({
  currentKey,
  onTranspose,
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
  
  const handleTransposeUp = () => {
    onTranspose(1)
  }
  
  const handleTransposeDown = () => {
    onTranspose(-1)
  }
  
  if (isMinimalMode) {
    // In minimal mode, show only essential floating controls
    return (
      <div style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        display: 'flex',
        gap: '0.5rem',
        zIndex: 1000
      }}>
        <button
          onClick={onToggleMinimalMode}
          style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1.25rem'
          }}
          aria-label="Exit minimal mode"
        >
          ✕
        </button>
      </div>
    )
  }
  
  return (
    <div className="viewer-controls" style={{
      position: 'sticky',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e2e8f0',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Transpose:</span>
          <button
            onClick={handleTransposeDown}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
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
            backgroundColor: '#eff6ff',
            color: '#1e40af',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            minWidth: '3rem',
            textAlign: 'center'
          }}>
            {currentKey}
          </span>
          <button
            onClick={handleTransposeUp}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
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
        
        {/* Auto-scroll Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={onToggleScroll}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isScrolling ? '#dc2626' : '#10b981',
              color: '#ffffff',
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
                accentColor: '#10b981'
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
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
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
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              padding: '1rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              minWidth: '250px'
            }}>
              <h3 style={{
                margin: '0 0 1rem 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1e293b'
              }}>Display Settings</h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: '#64748b',
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
                    accentColor: '#3b82f6'
                  }}
                />
              </div>
              
              <button
                onClick={onToggleMinimalMode}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
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