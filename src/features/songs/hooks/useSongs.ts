import { useState, useEffect } from 'react'
import type { Song, SongFilter } from '../types/song.types'
import { songService } from '../services/songService'

export function useSongs(filter?: SongFilter) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSongs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = filter 
        ? await songService.searchSongs(filter)
        : await songService.getAllSongs()
      setSongs(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch songs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSongs()
  }, [filter])

  const refreshSongs = () => {
    fetchSongs()
  }

  return { songs, loading, error, refreshSongs }
}

export function useSong(idOrSlug: string, isSlug = false) {
  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSong = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = isSlug
          ? await songService.getSongBySlug(idOrSlug)
          : await songService.getSongById(idOrSlug)
        setSong(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch song')
      } finally {
        setLoading(false)
      }
    }

    fetchSong()
  }, [idOrSlug, isSlug])

  return { song, loading, error }
}