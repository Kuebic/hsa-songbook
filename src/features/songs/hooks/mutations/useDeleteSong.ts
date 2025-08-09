import { useCallback } from 'react'
import { useSongMutations, type UseSongMutationsProps } from './useSongMutations'

export interface UseDeleteSongOptions extends UseSongMutationsProps {
  onSuccess?: (id: string) => void
  onError?: (error: Error) => void
}

export function useDeleteSong(options: UseDeleteSongOptions = {}) {
  const { onSuccess, onError, ...mutationProps } = options
  const { deleteSong, isDeleting, error, clearError, optimisticSongs } = useSongMutations(mutationProps)
  
  const handleDelete = useCallback(async (id: string) => {
    clearError()
    
    try {
      await deleteSong(id)
      onSuccess?.(id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete song')
      onError?.(error)
      throw error
    }
  }, [deleteSong, clearError, onSuccess, onError])
  
  const handleDeleteWithConfirmation = useCallback(async (id: string, songTitle?: string) => {
    const message = songTitle 
      ? `Are you sure you want to delete "${songTitle}"? This action cannot be undone.`
      : 'Are you sure you want to delete this song? This action cannot be undone.'
      
    if (window.confirm(message)) {
      return handleDelete(id)
    }
  }, [handleDelete])
  
  return {
    deleteSong: handleDelete,
    deleteSongWithConfirmation: handleDeleteWithConfirmation,
    isDeleting,
    error,
    clearError,
    optimisticSongs
  }
}