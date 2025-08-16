import { useState, useCallback } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import { SongFormModal } from '../forms/SongFormModal'
import { useSongMutations } from '@features/songs/hooks/mutations/useSongMutations'
import { useNotification } from '@shared/components/notifications'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'

export function AddSongButton() {
  const { isSignedIn } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const { createSong } = useSongMutations()
  const { addNotification } = useNotification()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleOpenModal = useCallback(() => {
    setShowModal(true)
  }, [])
  
  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setIsSubmitting(false) // Reset submission state
  }, [])
  
  if (!isSignedIn) return null
  
  const handleSubmit = async (data: SongFormData) => {
    setIsSubmitting(true)
    
    try {
      const song = await createSong(data)
      
      addNotification({
        type: 'success',
        title: 'Song created successfully',
        message: `"${song.title}" has been added to the songbook`,
        action: {
          label: 'View Song',
          onClick: () => {
            window.location.href = `/songs/${song.slug}`
          }
        }
      })
      
      handleCloseModal() // Use the callback
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to create song',
        message: error instanceof Error ? error.message : 'Please try again'
      })
      setIsSubmitting(false)
    }
  }
  
  const buttonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'var(--status-success)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background-color 0.2s'
  }
  
  const iconStyles: React.CSSProperties = {
    fontSize: '18px'
  }
  
  return (
    <>
      <button
        onClick={handleOpenModal}
        style={buttonStyles}
        onMouseEnter={e => {
          e.currentTarget.style.opacity = '0.9'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity = '1'
        }}
        aria-label="Add Song"
        title="Add Song"
        data-testid="add-song-button"
      >
        <span style={iconStyles}>➕</span>
        <span>Add Song</span>
      </button>
      
      {showModal && (
        <SongFormModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  )
}