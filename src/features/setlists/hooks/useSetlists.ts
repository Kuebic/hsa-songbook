import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import type { Setlist, SetlistArrangement } from '../types/setlist.types'
import type { Arrangement } from '@features/songs'

// Use localStorage for persistence (mock backend)
// In production, this would be replaced with API calls
const STORAGE_KEY = 'hsa-songbook-setlists'

function loadSetlists(userId?: string | null): Setlist[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const allSetlists = stored ? JSON.parse(stored) : []
    
    // If no user, only return public setlists
    if (!userId) {
      return allSetlists.filter((sl: Setlist) => sl.isPublic)
    }
    
    // Return user's setlists and public setlists
    return allSetlists.filter((sl: Setlist) => 
      sl.createdBy === userId || sl.isPublic
    )
  } catch {
    return []
  }
}

function saveSetlists(setlists: Setlist[]) {
  // In a real app, this would save per user
  // For now, we save all setlists but filter on load
  const stored = localStorage.getItem(STORAGE_KEY)
  const allSetlists = stored ? JSON.parse(stored) : []
  
  // Merge with existing setlists from other users
  const otherUsersSetlists = allSetlists.filter((sl: Setlist) => {
    const userSetlistIds = setlists.map(s => s.id)
    return !userSetlistIds.includes(sl.id)
  })
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...otherUsersSetlists, ...setlists]))
}

export function useSetlists() {
  const { userId, isSignedIn } = useAuth()
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSetlists(loadSetlists(userId))
    setLoading(false)
  }, [userId])

  const createSetlist = useCallback((name: string, description?: string): Setlist => {
    if (!isSignedIn || !userId) {
      throw new Error('You must be signed in to create a setlist')
    }
    
    const newSetlist: Setlist = {
      id: Date.now().toString(),
      name,
      description,
      arrangements: [],
      likes: 0,
      likedBy: [],
      allowDuplication: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      createdBy: userId
    }
    
    const updated = [...setlists, newSetlist]
    setSetlists(updated)
    saveSetlists(updated)
    
    return newSetlist
  }, [setlists, isSignedIn, userId])

  const updateSetlist = useCallback((id: string, updates: Partial<Setlist>) => {
    // Check if user owns this setlist
    const setlist = setlists.find(sl => sl.id === id)
    if (setlist && setlist.createdBy && userId && setlist.createdBy !== userId) {
      // For now, allow edits in development mode
      // throw new Error('You can only edit your own setlists')
    }
    
    const updated = setlists.map(sl => 
      sl.id === id 
        ? { ...sl, ...updates, updatedAt: new Date() }
        : sl
    )
    setSetlists(updated)
    saveSetlists(updated)
  }, [setlists, userId])

  const deleteSetlist = useCallback((id: string) => {
    // Check if user owns this setlist
    const setlist = setlists.find(sl => sl.id === id)
    if (setlist && setlist.createdBy && userId && setlist.createdBy !== userId) {
      // For now, allow deletion in development mode
      // throw new Error('You can only delete your own setlists')
    }
    
    const updated = setlists.filter(sl => sl.id !== id)
    setSetlists(updated)
    saveSetlists(updated)
  }, [setlists, userId])

  const addArrangementToSetlist = useCallback((setlistId: string, arrangement: Arrangement, notes?: string) => {
    const setlist = setlists.find(sl => sl.id === setlistId)
    if (!setlist) return

    const newArrangement: SetlistArrangement = {
      arrangementId: arrangement.id,
      arrangement,
      notes,
      order: setlist.arrangements.length,
      addedAt: new Date(),
      addedBy: userId || 'anonymous'
    }

    updateSetlist(setlistId, {
      arrangements: [...setlist.arrangements, newArrangement]
    })
  }, [setlists, updateSetlist, userId])

  const removeArrangementFromSetlist = useCallback((setlistId: string, arrangementIndex: number) => {
    const setlist = setlists.find(sl => sl.id === setlistId)
    if (!setlist) return

    const updated = setlist.arrangements.filter((_, index) => index !== arrangementIndex)
    updateSetlist(setlistId, { arrangements: updated })
  }, [setlists, updateSetlist])

  const reorderArrangements = useCallback((setlistId: string, arrangements: SetlistArrangement[]) => {
    updateSetlist(setlistId, { 
      arrangements: arrangements.map((arrangement, index) => ({ ...arrangement, order: index }))
    })
  }, [updateSetlist])

  return {
    setlists,
    loading,
    createSetlist,
    updateSetlist,
    deleteSetlist,
    addArrangementToSetlist,
    removeArrangementFromSetlist,
    reorderArrangements
  }
}

export function useSetlist(id: string) {
  const { userId } = useAuth()
  const [setlist, setSetlist] = useState<Setlist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const setlists = loadSetlists(userId)
    const found = setlists.find(sl => sl.id === id)
    setSetlist(found || null)
    setLoading(false)
  }, [id, userId])

  return { setlist, loading }
}