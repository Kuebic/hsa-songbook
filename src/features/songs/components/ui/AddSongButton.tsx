import { useState } from 'react'
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
      
      setShowModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to create song',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const buttonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#10b981',
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
        onClick={() => setShowModal(true)}
        style={buttonStyles}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#059669'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#10b981'
        }}
        aria-label="Add new song"
        title="Add new song"
      >
        <span style={iconStyles}>➕</span>
        <span>Add Song</span>
      </button>
      
      <SongFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  )
}