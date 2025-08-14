import React, { useMemo } from 'react'
import { SongList } from '@features/songs'
import type { Song } from '@features/songs'

interface SearchResultsProps {
  results: Song[]
  loading: boolean
  error: string | null
  query: string
  onSongClick?: (song: Song) => void
}

const SearchResultsComponent: React.FC<SearchResultsProps> = ({ 
  results, 
  loading, 
  error, 
  query,
  onSongClick 
}) => {
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
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)'
      }}>
        <p style={{ 
          margin: 0, 
          color: 'var(--text-secondary)' 
        }}>
          {loading ? 'Searching...' : (
            <>Found {results.length} {resultCountLabel} for "{query}"</>
          )}
        </p>
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

export const SearchResults = React.memo(SearchResultsComponent)