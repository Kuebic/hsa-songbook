import { useState, useEffect } from 'react'
import { SongTitleEdit } from './SongTitleEdit'
import type { Song } from '../types/song.types'

interface SongViewerProps {
  song: Song
}

export function SongViewer({ 
  song: initialSong
}: SongViewerProps) {
  // Local state to handle optimistic updates
  const [song, setSong] = useState(initialSong)
  
  // Update local state when prop changes
  useEffect(() => {
    setSong(initialSong)
  }, [initialSong])
  
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          <SongTitleEdit 
            song={song} 
            onUpdate={setSong}
          />
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
          {song.artist} {song.compositionYear && `(${song.compositionYear})`}
        </p>
        {song.ccli && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            CCLI: {song.ccli}
          </p>
        )}
      </header>

{/* ArrangementSwitcher removed - arrangements are now managed via the ArrangementList below */}

      {song.notes && (
        <div style={{ 
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'rgba(var(--status-warning), 0.1)',
          borderRadius: '8px',
          borderLeft: '4px solid var(--status-warning)'
        }}>
          <strong>Notes:</strong> {song.notes}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Themes</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {song.themes?.map(theme => (
            <span 
              key={theme}
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: 'rgba(var(--status-info), 0.1)',
                borderRadius: '4px',
                color: 'var(--status-info)'
              }}
            >
              {theme}
            </span>
          )) || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No themes available</span>}
        </div>
      </div>

      {song.source && (
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Source: {song.source}
        </p>
      )}
    </div>
  )
}