import { useState, useCallback, useEffect, useMemo } from 'react'
import { songService } from '@features/songs'
import type { Song, SongFilter } from '@features/songs'

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SongFilter>({})
  const [results, setResults] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memoize the search filter to avoid recreating it on every search
  const searchFilter = useMemo(() => ({
    ...filters,
    searchQuery
  }), [filters, searchQuery])

  const performSearch = useCallback(async () => {
    if (!searchQuery && Object.keys(filters).length === 0) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const songs = await songService.searchSongs(searchFilter)
      setResults(songs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filters, searchFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [performSearch])

  const updateFilters = useCallback((newFilters: Partial<SongFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setSearchQuery('')
    setResults([])
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilters,
    clearFilters,
    results,
    loading,
    error
  }
}