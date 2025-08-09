import { useCallback } from 'react'
import { useSongMutations, type UseSongMutationsProps } from './useSongMutations'
import type { SongFormData } from '../../validation/schemas/songFormSchema'
import type { Song } from '../../types/song.types'

export interface UseUpdateSongOptions extends UseSongMutationsProps {
  onSuccess?: (song: Song) => void
  onError?: (error: Error) => void
}

export function useUpdateSong(options: UseUpdateSongOptions = {}) {
  const { onSuccess, onError, ...mutationProps } = options
  const { 
    updateSong, 
    updateSongTitle, 
    updateSongField, 
    isUpdating, 
    error, 
    clearError, 
    optimisticSongs 
  } = useSongMutations(mutationProps)
  
  const handleUpdate = useCallback(async (id: string, data: Partial<SongFormData>) => {
    clearError()
    
    try {
      const updatedSong = await updateSong(id, data)
      onSuccess?.(updatedSong)
      return updatedSong
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update song')
      onError?.(error)
      throw error
    }
  }, [updateSong, clearError, onSuccess, onError])
  
  const handleUpdateTitle = useCallback(async (id: string, title: string) => {
    clearError()
    
    try {
      const updatedSong = await updateSongTitle(id, title)
      onSuccess?.(updatedSong)
      return updatedSong
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update song title')
      onError?.(error)
      throw error
    }
  }, [updateSongTitle, clearError, onSuccess, onError])
  
  const handleUpdateField = useCallback(async (
    id: string, 
    field: keyof Song, 
    value: unknown
  ) => {
    clearError()
    
    try {
      const updatedSong = await updateSongField(id, field, value)
      onSuccess?.(updatedSong)
      return updatedSong
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Failed to update song ${field}`)
      onError?.(error)
      throw error
    }
  }, [updateSongField, clearError, onSuccess, onError])
  
  return {
    updateSong: handleUpdate,
    updateSongTitle: handleUpdateTitle,
    updateSongField: handleUpdateField,
    isUpdating,
    error,
    clearError,
    optimisticSongs
  }
}