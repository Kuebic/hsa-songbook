import { useCallback } from 'react'
import { useSongMutations, type UseSongMutationsProps } from './useSongMutations'
import type { SongFormData } from '../../validation/schemas/songFormSchema'
import type { Song } from '../../types/song.types'

export interface UseCreateSongOptions extends UseSongMutationsProps {
  onSuccess?: (song: Song) => void
  onError?: (error: Error) => void
}

export function useCreateSong(options: UseCreateSongOptions = {}) {
  const { onSuccess, onError, ...mutationProps } = options
  const { createSong, isCreating, error, clearError, optimisticSongs } = useSongMutations(mutationProps)
  
  const handleCreate = useCallback(async (formData: SongFormData) => {
    clearError()
    
    try {
      const newSong = await createSong(formData)
      onSuccess?.(newSong)
      return newSong
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create song')
      onError?.(error)
      throw error
    }
  }, [createSong, clearError, onSuccess, onError])
  
  return {
    createSong: handleCreate,
    isCreating,
    error,
    clearError,
    optimisticSongs
  }
}