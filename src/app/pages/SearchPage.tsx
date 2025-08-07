import { useNavigate } from 'react-router-dom'
import { SearchBar, SearchResults, useSearch } from '@features/search'
import type { Song } from '@features/songs'

export function SearchPage() {
  const navigate = useNavigate()
  const { searchQuery, setSearchQuery, results, loading, error, clearFilters } = useSearch()

  const handleSongClick = (song: Song) => {
    navigate(`/songs/${song.slug}`)
  }

  return (
    <div>
      <header style={{ 
        padding: '2rem', 
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: 'white'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Search Songs</h1>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={clearFilters}
          />
        </div>
      </header>

      <SearchResults 
        results={results}
        loading={loading}
        error={error}
        query={searchQuery}
        onSongClick={handleSongClick}
      />
    </div>
  )
}