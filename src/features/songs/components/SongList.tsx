import React from 'react'
import { SongCard } from './SongCard'
import type { Song } from '../types/song.types'

interface SongListProps {
  songs: Song[]
  onSongClick?: (song: Song) => void
  onSongUpdate?: (song: Song) => void
  onSongDelete?: (songId: string) => void
  loading?: boolean
  error?: string | null
}

const SongListComponent: React.FC<SongListProps> = ({ 
  songs, 
  onSongClick, 
  onSongUpdate, 
  onSongDelete, 
  loading, 
  error 
}) => {
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading songs...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'var(--status-error)', textAlign: 'center' }}>
        Error: {error}
      </div>
    )
  }

  if (!songs || songs.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No songs found
      </div>
    )
  }

  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem',
        padding: '1rem'
      }}
    >
      {songs?.map(song => (
        <SongCard 
          key={song.id} 
          song={song} 
          onClick={onSongClick}
          onUpdate={onSongUpdate}
          onDelete={onSongDelete}
        />
      ))}
    </div>
  )
}

export const SongList = React.memo(SongListComponent)