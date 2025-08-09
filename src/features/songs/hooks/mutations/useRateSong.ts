import { useCallback } from 'react'
import { useSongMutations, type UseSongMutationsProps } from './useSongMutations'

export interface UseRateSongOptions extends UseSongMutationsProps {
  onSuccess?: (id: string, rating: number) => void
  onError?: (error: Error) => void
}

export function useRateSong(options: UseRateSongOptions = {}) {
  const { onSuccess, onError, ...mutationProps } = options
  const { rateSong, isRating, error, clearError, optimisticSongs } = useSongMutations(mutationProps)
  
  const handleRate = useCallback(async (id: string, rating: number) => {
    clearError()
    
    // Validate rating range
    if (rating < 1 || rating > 5) {
      const error = new Error('Rating must be between 1 and 5')
      onError?.(error)
      throw error
    }
    
    try {
      await rateSong(id, rating)
      onSuccess?.(id, rating)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to rate song')
      onError?.(error)
      throw error
    }
  }, [rateSong, clearError, onSuccess, onError])
  
  const handleRateWithFeedback = useCallback(async (
    id: string, 
    rating: number, 
    showNotification = true
  ) => {
    try {
      await handleRate(id, rating)
      
      if (showNotification && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Song rated!', {
          body: `You rated this song ${rating} star${rating !== 1 ? 's' : ''}`,
          icon: '/icon.svg'
        })
      }
    } catch (error) {
      if (showNotification && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Failed to rate song', {
          body: error instanceof Error ? error.message : 'Unknown error occurred',
          icon: '/icon.svg'
        })
      }
      throw error
    }
  }, [handleRate])
  
  return {
    rateSong: handleRate,
    rateSongWithFeedback: handleRateWithFeedback,
    isRating,
    error,
    clearError,
    optimisticSongs
  }
}