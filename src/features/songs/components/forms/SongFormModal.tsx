import { useCallback } from 'react'
import { Modal } from '@shared/components/modal'
import { SongForm } from './SongForm'
import type { Song } from '../../types/song.types'
import type { SongFormData } from '../../validation/schemas/songFormSchema'

interface SongFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SongFormData) => Promise<void>
  song?: Song
  existingSongs?: Song[]
  isSubmitting?: boolean
}

export function SongFormModal({
  isOpen,
  onClose,
  onSubmit,
  song,
  existingSongs = [],
  isSubmitting = false
}: SongFormModalProps) {
  
  const handleSubmit = async (data: SongFormData) => {
    try {
      await onSubmit(data)
      // Parent component handles closing
    } catch (error) {
      console.error('Error submitting form:', error)
      // Keep modal open on error
    }
  }
  
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose()
    }
  }, [isSubmitting, onClose])
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={song ? `Edit Song: ${song.title}` : 'Add New Song'}
      description={
        song 
          ? 'Update the song information below'
          : 'Fill in the form to add a new song to the songbook'
      }
      size="large"
      closeOnEsc={!isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      showCloseButton={!isSubmitting}
      data-testid="song-form-modal"
    >
      <SongForm
        initialData={song}
        existingSongs={existingSongs}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  )
}