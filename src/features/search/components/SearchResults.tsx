import { useMemo } from 'react'
import { SongList } from '@features/songs'
import type { Song } from '@features/songs'

interface SearchResultsProps {
  results: Song[]
  loading: boolean
  error: string | null
  query: string
  onSongClick?: (song: Song) => void
}

export function SearchResults({ 
  results, 
  loading, 
  error, 
  query,
  onSongClick 
}: SearchResultsProps) {
  // Memoize the result count label to avoid recalculating on every render
  const resultCountLabel = useMemo(() => {
    return results.length === 1 ? 'song' : 'songs'
  }, [results.length])

  if (!query) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#94a3b8' 
      }}>
        Enter a search term to find songs
      </div>
    )
  }

  return (
    <div>
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #e2e8f0' 
      }}>
        {loading ? (
          <p>Searching...</p>
        ) : (
          <p>
            Found <strong>{results.length}</strong> {resultCountLabel} 
            {query && ` for "${query}"`}
          </p>
        )}
      </div>
      
      <SongList 
        songs={results}
        loading={loading}
        error={error}
        onSongClick={onSongClick}
      />
    </div>
  )
}