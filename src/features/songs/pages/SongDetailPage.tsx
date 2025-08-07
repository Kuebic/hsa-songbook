import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { SongViewer } from '../components/SongViewer'
import { useSong } from '../hooks/useSongs'
import { songService } from '../services/songService'
import type { Arrangement } from '../types/song.types'

export function SongDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { song, loading, error } = useSong(slug || '', true)
  const [arrangement, setArrangement] = useState<Arrangement | null>(null)

  useEffect(() => {
    if (song) {
      songService.getArrangementsBySongId(song.id).then(arrangements => {
        if (arrangements.length > 0) {
          setArrangement(arrangements[0])
        }
      })
    }
  }, [song])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading song...
      </div>
    )
  }

  if (error || !song) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>
          {error || 'Song not found'}
        </p>
        <button 
          onClick={() => navigate('/songs')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Songs
        </button>
      </div>
    )
  }

  return (
    <div>
      <button 
        onClick={() => navigate('/songs')}
        style={{
          margin: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#f1f5f9',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Back to Songs
      </button>
      
      <SongViewer song={song} arrangement={arrangement || undefined} />
    </div>
  )
}