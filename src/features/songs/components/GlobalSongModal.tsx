import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SongManagementModal } from './SongManagementModal'
import { useSongModal } from '../contexts/SongModalContext'
import { useNotification } from '@shared/components/notifications'
import type { Song } from '../types/song.types'

export function GlobalSongModal() {
  const navigate = useNavigate()
  const { addNotification } = useNotification()
  const { isOpen, selectedSong, closeModal } = useSongModal()
  
  const handleSuccess = useCallback((song: Song) => {
    // Show success notification
    addNotification({
      type: 'success',
      title: selectedSong ? 'Song Updated' : 'Song Created',
      message: selectedSong 
        ? `"${song.title}" has been updated successfully`
        : `"${song.title}" has been added to the library`
    })
    
    // Navigate to the song's detail page
    navigate(`/songs/${song.slug}`)
  }, [navigate, addNotification, selectedSong])
  
  return (
    <SongManagementModal
      isOpen={isOpen}
      onClose={closeModal}
      song={selectedSong}
      onSuccess={handleSuccess}
    />
  )
}