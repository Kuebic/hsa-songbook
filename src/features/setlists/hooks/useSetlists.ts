import { useState, useCallback, useEffect } from 'react'
import type { Setlist, SetlistSong } from '../types/setlist.types'
import type { Song } from '@features/songs'

// Use localStorage for persistence (mock backend)
const STORAGE_KEY = 'hsa-songbook-setlists'

function loadSetlists(): Setlist[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveSetlists(setlists: Setlist[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(setlists))
}

export function useSetlists() {
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSetlists(loadSetlists())
    setLoading(false)
  }, [])

  const createSetlist = useCallback((name: string, description?: string): Setlist => {
    const newSetlist: Setlist = {
      id: Date.now().toString(),
      name,
      description,
      songs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false
    }
    
    const updated = [...setlists, newSetlist]
    setSetlists(updated)
    saveSetlists(updated)
    
    return newSetlist
  }, [setlists])

  const updateSetlist = useCallback((id: string, updates: Partial<Setlist>) => {
    const updated = setlists.map(sl => 
      sl.id === id 
        ? { ...sl, ...updates, updatedAt: new Date() }
        : sl
    )
    setSetlists(updated)
    saveSetlists(updated)
  }, [setlists])

  const deleteSetlist = useCallback((id: string) => {
    const updated = setlists.filter(sl => sl.id !== id)
    setSetlists(updated)
    saveSetlists(updated)
  }, [setlists])

  const addSongToSetlist = useCallback((setlistId: string, song: Song, notes?: string) => {
    const setlist = setlists.find(sl => sl.id === setlistId)
    if (!setlist) return

    const newSong: SetlistSong = {
      song,
      notes,
      order: setlist.songs.length
    }

    updateSetlist(setlistId, {
      songs: [...setlist.songs, newSong]
    })
  }, [setlists, updateSetlist])

  const removeSongFromSetlist = useCallback((setlistId: string, songIndex: number) => {
    const setlist = setlists.find(sl => sl.id === setlistId)
    if (!setlist) return

    const updated = setlist.songs.filter((_, index) => index !== songIndex)
    updateSetlist(setlistId, { songs: updated })
  }, [setlists, updateSetlist])

  const reorderSongs = useCallback((setlistId: string, songs: SetlistSong[]) => {
    updateSetlist(setlistId, { 
      songs: songs.map((song, index) => ({ ...song, order: index }))
    })
  }, [updateSetlist])

  return {
    setlists,
    loading,
    createSetlist,
    updateSetlist,
    deleteSetlist,
    addSongToSetlist,
    removeSongFromSetlist,
    reorderSongs
  }
}

export function useSetlist(id: string) {
  const [setlist, setSetlist] = useState<Setlist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const setlists = loadSetlists()
    const found = setlists.find(sl => sl.id === id)
    setSetlist(found || null)
    setLoading(false)
  }, [id])

  return { setlist, loading }
}