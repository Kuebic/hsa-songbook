import { useState } from 'react'
import type { Setlist, SetlistSong } from '../types/setlist.types'
import type { Song } from '@features/songs'
import { SetlistHeader } from './SetlistHeader'
import { SongSelector } from './SongSelector'
import { SetlistSongItem } from './SetlistSongItem'
import { useDragAndDrop } from '../hooks/useDragAndDrop'

interface SetlistBuilderProps {
  setlist: Setlist
  availableSongs?: Song[]
  onAddSong: (song: Song, notes?: string) => void
  onRemoveSong: (index: number) => void
  onReorder: (songs: SetlistSong[]) => void
  onUpdateName?: (name: string) => void
}

export function SetlistBuilder({
  setlist,
  availableSongs = [],
  onAddSong,
  onRemoveSong,
  onReorder,
  onUpdateName
}: SetlistBuilderProps) {
  const [isAddingMode, setIsAddingMode] = useState(false)
  const { handleDragStart, handleDragOver, handleDrop } = useDragAndDrop(setlist.songs, onReorder)

  const handleSongSelect = (song: Song) => {
    onAddSong(song)
    setIsAddingMode(false)
  }

  return (
    <div style={{ padding: '1rem' }}>
      <SetlistHeader setlist={setlist} onUpdateName={onUpdateName} />

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setIsAddingMode(!isAddingMode)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          {isAddingMode ? 'Cancel' : '+ Add Song'}
        </button>
      </div>

      {isAddingMode && (
        <SongSelector 
          availableSongs={availableSongs} 
          onSelectSong={handleSongSelect}
        />
      )}

      <div>
        <h3 style={{ marginBottom: '1rem' }}>
          Songs ({setlist.songs.length})
        </h3>
        
        {setlist.songs.length === 0 ? (
          <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
            No songs in this setlist yet. Click "Add Song" to get started.
          </p>
        ) : (
          <div>
            {setlist.songs.map((item, index) => (
              <SetlistSongItem
                key={`${item.song.id}-${index}`}
                item={item}
                index={index}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onRemove={() => onRemoveSong(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}