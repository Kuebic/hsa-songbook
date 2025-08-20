import { Modal } from '@shared/components/modal/Modal'
import { SongManagementForm } from './SongManagementForm'
import type { Song } from '../types/song.types'

interface SongManagementModalProps {
  isOpen: boolean
  onClose: () => void
  song?: Song // For editing existing song
  onSuccess?: (song: Song) => void
}

export function SongManagementModal({ 
  isOpen, 
  onClose, 
  song, 
  onSuccess 
}: SongManagementModalProps) {
  const handleSuccess = (savedSong: Song) => {
    onSuccess?.(savedSong)
    onClose()
  }
  
  const handleClose = () => {
    onClose()
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={song ? 'Edit Song' : 'Add New Song'}
      description={
        song 
          ? 'Update the details of this song'
          : 'Fill in the details to add a new song to the catalog'
      }
      size="large"
      closeOnEsc={true}
      closeOnOverlayClick={false} // Prevent accidental close
      testId="song-management-modal"
    >
      <SongManagementForm
        song={song}
        onSuccess={handleSuccess}
        onCancel={handleClose}
        isModal={true}
      />
    </Modal>
  )
}