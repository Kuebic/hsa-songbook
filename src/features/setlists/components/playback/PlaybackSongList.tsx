import { useEffect, useRef } from 'react'
import type { PopulatedArrangement } from '../../types/playback.types'

interface PlaybackSongListProps {
  arrangements: PopulatedArrangement[]
  currentIndex: number
  onSelect: (index: number) => void
  onClose: () => void
}

export function PlaybackSongList({
  arrangements,
  currentIndex,
  onSelect,
  onClose
}: PlaybackSongListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])
  
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])
  
  return (
    <div
      ref={listRef}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '0.5rem',
        backgroundColor: 'var(--color-popover)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxHeight: '300px',
        minWidth: '250px',
        overflow: 'auto',
        zIndex: 50
      }}
    >
      <div style={{ padding: '0.5rem' }}>
        {arrangements.map((item, index) => (
          <button
            key={item.arrangementId || index}
            onClick={() => onSelect(index)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.75rem',
              backgroundColor: index === currentIndex ? 'var(--color-accent)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (index !== currentIndex) {
                e.currentTarget.style.backgroundColor = 'var(--color-muted)'
              }
            }}
            onMouseLeave={(e) => {
              if (index !== currentIndex) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                minWidth: '1.5rem'
              }}>
                {index + 1}.
              </span>
              <span style={{
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                fontWeight: index === currentIndex ? '600' : '400'
              }}>
                {item.arrangement?.name || 'Untitled'}
              </span>
            </div>
            {item.keyOverride && (
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--color-muted)',
                padding: '0.125rem 0.375rem',
                borderRadius: '3px'
              }}>
                {item.keyOverride}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}