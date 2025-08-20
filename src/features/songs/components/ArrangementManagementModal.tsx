import { useNavigate } from 'react-router-dom'
import { Modal } from '@shared/components/modal/Modal'
import { ArrangementManagementForm } from './ArrangementManagementForm'
import type { Arrangement } from '../types/song.types'
import { generateChordProTemplate } from '../utils/chordProTemplateGenerator'

interface ArrangementManagementModalProps {
  isOpen: boolean
  onClose: () => void
  arrangement?: Arrangement // For editing existing arrangement
  onSuccess?: (arrangement: Arrangement) => void
  songId?: string // For creating new arrangement for specific song
  songTitle?: string // For template generation
}

export function ArrangementManagementModal({ 
  isOpen, 
  onClose, 
  arrangement, 
  onSuccess,
  songId,
  songTitle
}: ArrangementManagementModalProps) {
  const navigate = useNavigate()
  
  const handleSuccess = (savedArrangement: Arrangement) => {
    // Call the success callback first
    onSuccess?.(savedArrangement)
    
    // For new arrangements, navigate to ChordPro editor with template
    if (!arrangement && savedArrangement.slug) {
      // Generate initial ChordPro template with metadata
      const initialTemplate = generateChordProTemplate({
        title: savedArrangement.name,
        subtitle: songTitle || undefined,
        key: savedArrangement.key,
        tempo: savedArrangement.tempo,
        timeSignature: savedArrangement.timeSignature,
        difficulty: savedArrangement.difficulty,
        capo: savedArrangement.capo,
        description: savedArrangement.description
      })
      
      // Store template and arrangement ID in sessionStorage for ChordEditingPage pickup
      const sessionKey = `initial-chordpro-${savedArrangement.slug}`
      sessionStorage.setItem(sessionKey, initialTemplate)
      
      // Also store the arrangement ID for the editor to use
      const idKey = `arrangement-id-${savedArrangement.slug}`
      sessionStorage.setItem(idKey, savedArrangement.id)
      
      // Close modal and navigate to editor
      onClose()
      navigate(`/arrangements/${savedArrangement.slug}/edit`)
    } else {
      // For edits, just close the modal
      onClose()
    }
  }
  
  const handleClose = () => {
    onClose()
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={arrangement ? 'Edit Arrangement' : 'Add New Arrangement'}
      description={
        arrangement 
          ? 'Update the details of this arrangement'
          : 'Fill in the details to add a new arrangement to the song'
      }
      size="large"
      closeOnEsc={true}
      closeOnOverlayClick={false} // Prevent accidental close
      testId="arrangement-management-modal"
    >
      <ArrangementManagementForm
        arrangement={arrangement}
        songId={songId}
        onSuccess={handleSuccess}
        onCancel={handleClose}
        isModal={true}
      />
    </Modal>
  )
}