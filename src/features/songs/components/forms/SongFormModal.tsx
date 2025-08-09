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
      // Parent component will close modal on success
    } catch (error) {
      // Error handling should be done by parent component
      console.error('Error submitting form:', error)
    }
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
    >
      <SongForm
        initialData={song}
        existingSongs={existingSongs}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  )
}