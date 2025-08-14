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
        color: 'var(--text-tertiary)' 
      }}>
        Enter a search term to find songs
      </div>
    )
  }

  return (
    <div>
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid var(--color-border)' 
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