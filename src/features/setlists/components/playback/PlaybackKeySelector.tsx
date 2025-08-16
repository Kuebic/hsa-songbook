import { useState, useRef, useEffect } from 'react'

interface PlaybackKeySelectorProps {
  currentKey?: string
  originalKey?: string
  onKeyChange: (key: string) => void
}

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function PlaybackKeySelector({ 
  currentKey = 'C', 
  originalKey = 'C', 
  onKeyChange 
}: PlaybackKeySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          backgroundColor: 'var(--color-card)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.875rem'
        }}
      >
        <span style={{ fontWeight: '600', fontSize: '1rem' }}>
          Key: {currentKey}
        </span>
        {currentKey !== originalKey && (
          <span style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-secondary)' 
          }}>
            (Original: {originalKey})
          </span>
        )}
        <span style={{ fontSize: '0.75rem' }}>▼</span>
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '0.25rem',
          backgroundColor: 'var(--color-popover)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 10,
          minWidth: '200px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          <div style={{ padding: '0.5rem' }}>
            <div style={{ 
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontWeight: '600',
              borderBottom: '1px solid var(--color-border)',
              marginBottom: '0.5rem'
            }}>
              Major Keys
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '0.25rem',
              marginBottom: '0.5rem'
            }}>
              {KEYS.map(key => (
                <button
                  key={key}
                  onClick={() => {
                    onKeyChange(key)
                    setIsOpen(false)
                  }}
                  style={{
                    padding: '0.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: key === currentKey 
                      ? 'var(--color-primary)' 
                      : 'transparent',
                    color: key === currentKey 
                      ? 'white' 
                      : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: key === currentKey ? '600' : '400',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (key !== currentKey) {
                      e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (key !== currentKey) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
            
            <div style={{ 
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontWeight: '600',
              borderBottom: '1px solid var(--color-border)',
              marginBottom: '0.5rem'
            }}>
              Minor Keys
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '0.25rem' 
            }}>
              {KEYS.map(key => {
                const minorKey = `${key}m`
                return (
                  <button
                    key={minorKey}
                    onClick={() => {
                      onKeyChange(minorKey)
                      setIsOpen(false)
                    }}
                    style={{
                      padding: '0.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: minorKey === currentKey 
                        ? 'var(--color-primary)' 
                        : 'transparent',
                      color: minorKey === currentKey 
                        ? 'white' 
                        : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: minorKey === currentKey ? '600' : '400',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (minorKey !== currentKey) {
                        e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (minorKey !== currentKey) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    {minorKey}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}