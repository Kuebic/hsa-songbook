import { useParams, useNavigate } from 'react-router-dom'
import { SetlistBuilder } from '@features/setlists'
import { useSetlist, useSetlists } from '@features/setlists'
import { useSongs } from '@features/songs'

export function SetlistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setlist, loading } = useSetlist(id || '')
  const { songs: availableSongs } = useSongs()
  const { addSongToSetlist, removeSongFromSetlist, reorderSongs, updateSetlist } = useSetlists()

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
        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>
          Setlist not found
        </p>
        <button 
          onClick={() => navigate('/setlists')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
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
          backgroundColor: '#f1f5f9',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Back to Setlists
      </button>

      <SetlistBuilder
        setlist={setlist}
        availableSongs={availableSongs}
        onAddSong={(song, notes) => addSongToSetlist(setlist.id, song, notes)}
        onRemoveSong={(index) => removeSongFromSetlist(setlist.id, index)}
        onReorder={(songs) => reorderSongs(setlist.id, songs)}
        onUpdateName={(name) => updateSetlist(setlist.id, { name })}
      />
    </div>
  )
}