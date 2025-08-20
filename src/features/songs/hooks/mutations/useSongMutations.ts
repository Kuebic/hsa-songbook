import { useState, useCallback, useOptimistic, useTransition } from 'react'
import { useAuth } from '@features/auth'
import { songService } from '../../services/songService'
// Note: Offline queue functionality removed
import {
  createOptimisticSong,
  updateOptimisticSong,
  replaceOptimisticSong,
  removeOptimisticSong
} from '../utils/optimisticUpdates'
import type { Song } from '../../types/song.types'
import type { SongFormData } from '../../validation/schemas/songFormSchema'

type OptimisticUpdatePayload = 
  | { type: 'create'; payload: Song }
  | { type: 'update'; payload: { id: string; data: Partial<SongFormData> } }
  | { type: 'replace'; payload: { tempId: string; realSong: Song } }
  | { type: 'delete'; payload: string }
  | { type: 'remove'; payload: string }
  | { type: 'rate'; payload: { id: string; rating: number } }

export interface UseSongMutationsReturn {
  createSong: (data: SongFormData) => Promise<Song>
  updateSong: (id: string, data: Partial<SongFormData>) => Promise<Song>
  updateSongTitle: (id: string, title: string) => Promise<Song>
  updateSongField: (id: string, field: keyof Song, value: unknown) => Promise<Song>
  deleteSong: (id: string) => Promise<void>
  rateSong: (id: string, rating: number) => Promise<void>
  
  // State
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isRating: boolean
  error: Error | null
  
  // Optimistic songs for display
  optimisticSongs: Song[]
  
  // Utility methods
  clearError: () => void
  isAuthenticated: boolean
}

export interface UseSongMutationsProps {
  /** Initial songs array for optimistic updates */
  initialSongs?: Song[]
  /** Callback when songs are updated for external state synchronization */
  onSongsUpdate?: (songs: Song[]) => void
}

export function useSongMutations(props: UseSongMutationsProps = {}): UseSongMutationsReturn {
  const { getToken, userId, isSignedIn, user } = useAuth()
  const { initialSongs = [], onSongsUpdate } = props
  const [_isPending, startTransition] = useTransition()
  
  const [optimisticSongs, addOptimisticUpdate] = useOptimistic(
    initialSongs,
    (state: Song[], update: OptimisticUpdatePayload) => {
      let newState: Song[]
      
      switch (update.type) {
        case 'create':
          newState = [...state, update.payload]
          break
          
        case 'update':
          newState = state.map(song =>
            song.id === update.payload.id
              ? updateOptimisticSong(song, update.payload.data)
              : song
          )
          break
          
        case 'replace':
          newState = replaceOptimisticSong(state, update.payload.tempId, update.payload.realSong)
          break
          
        case 'delete':
          newState = state.filter(song => song.id !== update.payload)
          break
          
        case 'remove':
          newState = removeOptimisticSong(state, update.payload)
          break
          
        case 'rate':
          newState = state.map(song =>
            song.id === update.payload.id
              ? {
                  ...song,
                  metadata: {
                    ...song.metadata,
                    ratings: {
                      ...song.metadata.ratings || { average: 0, count: 0 },
                      average: update.payload.rating
                    }
                  }
                }
              : song
          )
          break
      }
      
      // Notify parent of state change
      onSongsUpdate?.(newState)
      return newState
    }
  )
  
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRating, setIsRating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  const createSong = useCallback(async (formData: SongFormData): Promise<Song> => {
    if (!isSignedIn || !userId || !user) {
      throw new Error('Authentication required')
    }
    
    setIsCreating(true)
    setError(null)
    
    // Create optimistic song
    const optimisticSong = createOptimisticSong(formData, userId)
    
    // Add optimistic update immediately
    startTransition(() => {
      addOptimisticUpdate({ type: 'create', payload: optimisticSong })
    })
    
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }
      
      // Note: Offline functionality removed for now
      
      // Make API call
      const newSong = await songService.createSong(formData)
      
      // Replace optimistic song with real one
      startTransition(() => {
        addOptimisticUpdate({ 
          type: 'replace', 
          payload: { tempId: optimisticSong.id, realSong: newSong } 
        })
      })
      
      return newSong
    } catch (err) {
      // Remove optimistic song on error
      startTransition(() => {
        addOptimisticUpdate({ type: 'remove', payload: optimisticSong.id })
      })
      
      const error = err instanceof Error ? err : new Error('Failed to create song')
      setError(error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [user, userId, isSignedIn, getToken, addOptimisticUpdate])
  
  const updateSong = useCallback(async (
    id: string,
    updates: Partial<SongFormData>
  ): Promise<Song> => {
    if (!isSignedIn || !userId) {
      throw new Error('Authentication required')
    }
    
    setIsUpdating(true)
    setError(null)
    
    // Find existing song
    const existingSong = optimisticSongs.find(s => s.id === id)
    if (!existingSong) {
      throw new Error('Song not found')
    }
    
    // Apply optimistic update
    startTransition(() => {
      addOptimisticUpdate({ type: 'update', payload: { id, data: updates } })
    })
    
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }
      
      // Note: Offline functionality removed for now
      
      // Make API call
      const updatedSong = await songService.updateSong(id, updates)
      
      // Update with real data
      startTransition(() => {
        addOptimisticUpdate({ 
          type: 'replace', 
          payload: { tempId: id, realSong: updatedSong } 
        })
      })
      
      return updatedSong
    } catch (err) {
      // Revert optimistic update on error
      startTransition(() => {
        addOptimisticUpdate({ 
          type: 'replace', 
          payload: { tempId: id, realSong: existingSong } 
        })
      })
      
      const error = err instanceof Error ? err : new Error('Failed to update song')
      setError(error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [userId, isSignedIn, optimisticSongs, getToken, addOptimisticUpdate])
  
  const updateSongTitle = useCallback(async (id: string, title: string): Promise<Song> => {
    return updateSong(id, { title })
  }, [updateSong])
  
  const updateSongField = useCallback(async (
    id: string,
    field: keyof Song,
    value: unknown
  ): Promise<Song> => {
    return updateSong(id, { [field]: value } as Partial<SongFormData>)
  }, [updateSong])
  
  const deleteSong = useCallback(async (id: string): Promise<void> => {
    if (!isSignedIn || !userId) {
      throw new Error('Authentication required')
    }
    
    setIsDeleting(true)
    setError(null)
    
    // Find song to delete
    const songToDelete = optimisticSongs.find(s => s.id === id)
    if (!songToDelete) {
      throw new Error('Song not found')
    }
    
    // Apply optimistic delete
    startTransition(() => {
      addOptimisticUpdate({ type: 'delete', payload: id })
    })
    
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }
      
      // Note: Offline functionality removed for now
      
      // Make API call
      await songService.deleteSong(id)
      
      // Delete is already applied optimistically, no need to revert
    } catch (err) {
      // Revert optimistic delete on error
      startTransition(() => {
        addOptimisticUpdate({ type: 'create', payload: songToDelete })
      })
      
      const error = err instanceof Error ? err : new Error('Failed to delete song')
      setError(error)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [userId, isSignedIn, optimisticSongs, getToken, addOptimisticUpdate])
  
  const rateSong = useCallback(async (id: string, rating: number): Promise<void> => {
    if (!isSignedIn || !userId) {
      throw new Error('Authentication required')
    }
    
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }
    
    setIsRating(true)
    setError(null)
    
    // Find song to rate
    const song = optimisticSongs.find(s => s.id === id)
    if (!song) {
      throw new Error('Song not found')
    }
    
    const previousRating = song.metadata.ratings?.average || 0
    
    // Apply optimistic rating update
    startTransition(() => {
      addOptimisticUpdate({ type: 'rate', payload: { id, rating } })
    })
    
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }
      
      // Note: Offline functionality removed for now
      
      // Note: Song rating functionality not implemented in service
      // This would need to be implemented if rating feature is needed
      
      // Rating update is already applied optimistically
    } catch (err) {
      // Revert optimistic rating on error
      startTransition(() => {
        addOptimisticUpdate({ type: 'rate', payload: { id, rating: previousRating } })
      })
      
      const error = err instanceof Error ? err : new Error('Failed to rate song')
      setError(error)
      throw error
    } finally {
      setIsRating(false)
    }
  }, [userId, isSignedIn, optimisticSongs, getToken, addOptimisticUpdate])
  
  return {
    createSong,
    updateSong,
    updateSongTitle,
    updateSongField,
    deleteSong,
    rateSong,
    
    isCreating,
    isUpdating,
    isDeleting,
    isRating,
    error,
    
    optimisticSongs,
    
    clearError,
    isAuthenticated: isSignedIn ?? false
  }
}