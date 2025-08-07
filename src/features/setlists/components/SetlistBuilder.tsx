import { useState } from 'react'
import type { Setlist, SetlistSong } from '../types/setlist.types'
import type { Song } from '@features/songs'

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
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(setlist.name)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('songIndex', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('songIndex'))
    
    if (dragIndex === dropIndex) return
    
    const newSongs = [...setlist.songs]
    const [draggedSong] = newSongs.splice(dragIndex, 1)
    newSongs.splice(dropIndex, 0, draggedSong)
    
    onReorder(newSongs)
  }

  return (
    <div style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        {editingName ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                fontSize: '1.5rem',
                padding: '0.25rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px'
              }}
            />
            <button
              onClick={() => {
                onUpdateName?.(newName)
                setEditingName(false)
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setNewName(setlist.name)
                setEditingName(false)
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#94a3b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <h2 
            style={{ fontSize: '1.5rem', cursor: 'pointer' }}
            onClick={() => setEditingName(true)}
          >
            {setlist.name} ✏️
          </h2>
        )}
        {setlist.description && (
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            {setlist.description}
          </p>
        )}
      </header>

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
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Select a song to add:</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {availableSongs.map(song => (
              <div
                key={song.id}
                onClick={() => {
                  onAddSong(song)
                  setIsAddingMode(false)
                }}
                style={{
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0'
                }}
              >
                <strong>{song.title}</strong> - {song.artist}
              </div>
            ))}
          </div>
        </div>
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
              <div
                key={`${item.song.id}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                style={{
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'move',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '1.25rem' }}>
                    ☰
                  </span>
                  <div>
                    <strong>{index + 1}. {item.song.title}</strong>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {item.song.artist}
                    </div>
                    {item.notes && (
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: '#059669', 
                        marginTop: '0.25rem' 
                      }}>
                        Note: {item.notes}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => onRemoveSong(index)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}