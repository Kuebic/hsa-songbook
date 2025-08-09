import { useState, useCallback } from 'react'
import { useSongMutations } from '../../hooks/mutations/useSongMutations'
import type { SongFormData } from '../../validation/schemas/songFormSchema'
import type { Song } from '../../types/song.types'

interface UseSongFormSubmitOptions {
  /** Initial songs for optimistic updates */
  initialSongs?: Song[]
  /** Callback when songs are updated */
  onSongsUpdate?: (songs: Song[]) => void
  /** Success callback */
  onSuccess?: (song: Song) => void
  /** Error callback */
  onError?: (error: Error) => void
  /** Show native notifications */
  showNotifications?: boolean
}

export function useSongFormSubmit(options: UseSongFormSubmitOptions = {}) {
  const { 
    initialSongs,
    onSongsUpdate,
    onSuccess,
    onError,
    showNotifications = true
  } = options
  
  const { 
    createSong, 
    updateSong, 
    error, 
    clearError, 
    optimisticSongs,
    isCreating,
    isUpdating
  } = useSongMutations({
    initialSongs,
    onSongsUpdate
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = useCallback(async (
    data: SongFormData,
    songId?: string
  ) => {
    setIsSubmitting(true)
    clearError()
    
    try {
      let result: Song
      
      if (songId) {
        result = await updateSong(songId, data)
      } else {
        result = await createSong(data)
      }
      
      onSuccess?.(result)
      
      // Show success notification
      if (showNotifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Song saved successfully', {
          body: `${result.title} has been ${songId ? 'updated' : 'created'}`,
          icon: '/icon.svg'
        })
      }
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save song')
      onError?.(error)
      
      // Show error notification
      if (showNotifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Failed to save song', {
          body: error.message,
          icon: '/icon.svg'
        })
      }
      
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [createSong, updateSong, clearError, onSuccess, onError, showNotifications])
  
  const handleCreateSubmit = useCallback(async (data: SongFormData) => {
    return handleSubmit(data)
  }, [handleSubmit])
  
  const handleUpdateSubmit = useCallback(async (songId: string, data: SongFormData) => {
    return handleSubmit(data, songId)
  }, [handleSubmit])
  
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }, [])
  
  return {
    handleSubmit,
    handleCreateSubmit,
    handleUpdateSubmit,
    isSubmitting: isSubmitting || isCreating || isUpdating,
    isCreating,
    isUpdating,
    error,
    clearError,
    optimisticSongs,
    requestNotificationPermission
  }
}