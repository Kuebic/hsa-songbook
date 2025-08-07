import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SongList } from '../components/SongList'
import { useSongs } from '../hooks/useSongs'
import type { Song } from '../types/song.types'

export function SongListPage() {
  const navigate = useNavigate()
  const { songs, loading, error } = useSongs()

  // Memoize sorted songs to avoid re-sorting on every render
  const sortedSongs = useMemo(() => {
    if (!songs || songs.length === 0) return songs
    // Sort songs alphabetically by title
    return [...songs].sort((a, b) => a.title.localeCompare(b.title))
  }, [songs])

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
        songs={sortedSongs}
        loading={loading}
        error={error}
        onSongClick={handleSongClick}
      />
    </div>
  )
}