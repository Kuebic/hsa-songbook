import { useNavigate } from 'react-router-dom'
import { SongList } from '../components/SongList'
import { useSongs } from '../hooks/useSongs'
import type { Song } from '../types/song.types'

export function SongListPage() {
  const navigate = useNavigate()
  const { songs, loading, error } = useSongs()

  const handleSongClick = (song: Song) => {
    navigate(`/songs/${song.slug}`)
  }

  return (
    <div>
      <header style={{ padding: '2rem', borderBottom: '1px solid #e2e8f0' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Song Library</h1>
        <p style={{ color: '#64748b' }}>
          Browse and search our collection of worship songs
        </p>
      </header>
      
      <SongList 
        songs={songs}
        loading={loading}
        error={error}
        onSongClick={handleSongClick}
      />
    </div>
  )
}