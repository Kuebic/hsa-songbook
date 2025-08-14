import { useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SetlistBuilder } from '@features/setlists'
import type { SetlistSong } from '@features/setlists'
import { useSetlist, useSetlists } from '@features/setlists'
import { useSongs } from '@features/songs'
import type { Song } from '@features/songs'

export function SetlistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setlist, loading } = useSetlist(id || '')
  const { songs: availableSongs } = useSongs()
  const { addSongToSetlist, removeSongFromSetlist, reorderSongs, updateSetlist } = useSetlists()

  // Memoize available songs that aren't already in the setlist
  const filteredAvailableSongs = useMemo(() => {
    if (!setlist || !availableSongs) return availableSongs
    
    const songIdsInSetlist = new Set(setlist.songs.map(s => s.song.id))
    return availableSongs.filter(song => !songIdsInSetlist.has(song.id))
  }, [availableSongs, setlist])

  // Memoize callback functions to prevent unnecessary re-renders
  const handleAddSong = useCallback((song: Song, notes?: string) => {
    if (setlist) {
      addSongToSetlist(setlist.id, song, notes)
    }
  }, [setlist, addSongToSetlist])

  const handleRemoveSong = useCallback((index: number) => {
    if (setlist) {
      removeSongFromSetlist(setlist.id, index)
    }
  }, [setlist, removeSongFromSetlist])

  const handleReorderSongs = useCallback((songs: SetlistSong[]) => {
    if (setlist) {
      reorderSongs(setlist.id, songs)
    }
  }, [setlist, reorderSongs])

  const handleUpdateName = useCallback((name: string) => {
    if (setlist) {
      updateSetlist(setlist.id, { name })
    }
  }, [setlist, updateSetlist])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading setlist...
      </div>
    )
  }

  if (!setlist) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--status-error)', marginBottom: '1rem' }}>
          Setlist not found
        </p>
        <button 
          onClick={() => navigate('/setlists')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--status-info)',
            color: 'var(--color-background)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Setlists
        </button>
      </div>
    )
  }

  return (
    <div>
      <button 
        onClick={() => navigate('/setlists')}
        style={{
          margin: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--color-accent)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Back to Setlists
      </button>

      <SetlistBuilder
        setlist={setlist}
        availableSongs={filteredAvailableSongs}
        onAddSong={handleAddSong}
        onRemoveSong={handleRemoveSong}
        onReorder={handleReorderSongs}
        onUpdateName={handleUpdateName}
      />
    </div>
  )
}