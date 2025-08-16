import { useState } from 'react'
import { PlaybackSongList } from './PlaybackSongList'
import type { PopulatedArrangement } from '../../types/playback.types'

interface PlaybackControlsProps {
  canGoNext: boolean
  canGoPrevious: boolean
  onNext: () => void
  onPrevious: () => void
  onJumpTo: (index: number) => void
  arrangements: PopulatedArrangement[]
  currentIndex: number
}

export function PlaybackControls({
  canGoNext,
  canGoPrevious,
  onNext,
  onPrevious,
  onJumpTo,
  arrangements,
  currentIndex
}: PlaybackControlsProps) {
  const [showSongList, setShowSongList] = useState(false)
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '0.75rem',
      backgroundColor: 'var(--color-card)'
    }}>
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: !canGoPrevious ? 'var(--color-muted)' : 'var(--color-secondary)',
          color: !canGoPrevious ? 'var(--text-secondary)' : 'var(--text-primary)',
          border: 'none',
          borderRadius: '4px',
          cursor: canGoPrevious ? 'pointer' : 'not-allowed',
          fontSize: '1rem',
          fontWeight: '500',
          opacity: !canGoPrevious ? 0.5 : 1,
          transition: 'all 0.2s'
        }}
        aria-label="Previous song"
      >
        ← Previous
      </button>
      
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowSongList(!showSongList)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--text-primary)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          Song List
          <span style={{ fontSize: '0.75rem' }}>▼</span>
        </button>
        
        {showSongList && (
          <PlaybackSongList
            arrangements={arrangements}
            currentIndex={currentIndex}
            onSelect={(index) => {
              onJumpTo(index)
              setShowSongList(false)
            }}
            onClose={() => setShowSongList(false)}
          />
        )}
      </div>
      
      <button
        onClick={onNext}
        disabled={!canGoNext}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: !canGoNext ? 'var(--color-muted)' : 'var(--color-primary)',
          color: !canGoNext ? 'var(--text-secondary)' : 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: canGoNext ? 'pointer' : 'not-allowed',
          fontSize: '1rem',
          fontWeight: '500',
          opacity: !canGoNext ? 0.5 : 1,
          transition: 'all 0.2s'
        }}
        aria-label="Next song"
      >
        Next →
      </button>
    </div>
  )
}