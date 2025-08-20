import { useCallback } from 'react'
import { useAuth } from '@features/auth'
import { songService } from '../services/songService'
import type { Song } from '../types/song.types'

export function useSongMutations() {
  const { getToken, userId, isSignedIn } = useAuth()
  
  const updateSongTitle = useCallback(async (songId: string, title: string): Promise<Song> => {
    if (!isSignedIn || !userId) {
      throw new Error('Please sign in to edit songs')
    }
    
    const token = await getToken()
    if (!token) {
      throw new Error('Unable to get authentication token')
    }
    
    // Only send the title field for update
    return songService.updateSong(songId, { title })
  }, [getToken, userId, isSignedIn])
  
  const updateSongField = useCallback(async (
    songId: string, 
    field: keyof Song, 
    value: unknown
  ): Promise<Song> => {
    if (!isSignedIn || !userId) {
      throw new Error('Please sign in to edit songs')
    }
    
    const token = await getToken()
    if (!token) {
      throw new Error('Unable to get authentication token')
    }
    
    // Send only the specific field for update
    return songService.updateSong(songId, { [field]: value })
  }, [getToken, userId, isSignedIn])
  
  return {
    updateSongTitle,
    updateSongField,
    isAuthenticated: isSignedIn
  }
}