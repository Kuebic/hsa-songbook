import { useState } from 'react'
import { Modal } from '@shared/components/modal'
import { SimpleArrangementForm } from './SimpleArrangementForm'
import { useArrangementMutations } from '../../hooks/useArrangementMutations'
import { useNotification } from '@shared/components/notifications'
import { arrangementSchema } from '../../validation/schemas/arrangementSchema'
import { generateUniqueSlug } from '../../validation/utils/slugGeneration'
import type { Arrangement } from '../../types/song.types'
import type { ArrangementFormData } from '../../validation/schemas/arrangementSchema'

interface ArrangementSheetProps {
  isOpen: boolean
  onClose: () => void
  songId: string
  songTitle?: string
  arrangement?: Arrangement // For editing
  onSuccess?: () => void
}

export function ArrangementSheet({ 
  isOpen, 
  onClose, 
  songId,
  songTitle,
  arrangement,
  onSuccess 
}: ArrangementSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<ArrangementFormData>>(() => ({
    name: arrangement?.name || '',
    key: arrangement?.key || '',
    tempo: arrangement?.tempo,
    timeSignature: arrangement?.timeSignature || '4/4',
    difficulty: arrangement?.difficulty || 'intermediate',
    chordProText: arrangement?.chordProText || '',
    notes: arrangement?.notes || '',
    tags: arrangement?.tags || [],
    capo: arrangement?.capo,
    duration: arrangement?.duration
  }))
  
  const { createArrangement, updateArrangement } = useArrangementMutations()
  const { addNotification } = useNotification()
  
  const handleFormChange = (data: Partial<ArrangementFormData>) => {
    setFormData(data)
  }
  
  const handleSubmit = async () => {
    // Check songId format
    const mongoIdRegex = /^[0-9a-fA-F]{24}$/
    const isValidMongoId = mongoIdRegex.test(songId)
    console.log('🔍 songId validation:', {
      songId,
      length: songId.length,
      isValidMongoId,
      regex: mongoIdRegex.toString()
    })
    
    console.log('📋 Form data before validation:', formData)
    console.log('📋 Data to validate:', {
      ...formData,
      songIds: [songId]
    })
    
    // Validate the form data using the schema
    const validationResult = arrangementSchema.safeParse({
      ...formData,
      songIds: [songId] // Associate with the current song
    })
    
    console.log('✅/❌ Validation result:', {
      success: validationResult.success,
      errors: validationResult.error?.errors
    })
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error?.errors?.map(err => `${err.path.join('.')}: ${err.message}`).join(', ') || 'Validation failed'
      console.error('❌ Validation failed with errors:', validationResult.error?.errors)
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: errorMessages
      })
      return
    }
    
    setIsSubmitting(true)
    try {
      // Generate slug for new arrangements only
      let slug: string | undefined
      if (!arrangement) {
        slug = await generateUniqueSlug({
          title: validationResult.data.name,
          existingSlugs: [], // We don't have existing slugs readily available
          includeArtistInitials: false, // Not using artist for arrangement slugs
          randomIdLength: 6
        })
      }
      
      const dataToSubmit = {
        // Required fields
        name: validationResult.data.name,
        songIds: validationResult.data.songIds,
        chordProText: validationResult.data.chordProText,
        difficulty: validationResult.data.difficulty || 'intermediate',
        
        // Optional fields with server defaults
        timeSignature: validationResult.data.timeSignature || '4/4',
        tags: validationResult.data.tags || [],
        isPublic: false,
        
        // Include slug for new arrangements
        ...(slug && { slug }),
        
        // Optional fields only if present
        ...(validationResult.data.key && { key: validationResult.data.key }),
        ...(validationResult.data.tempo && { tempo: Number(validationResult.data.tempo) }),
        ...(validationResult.data.capo && { capo: Number(validationResult.data.capo) }),
        ...(validationResult.data.notes && { description: validationResult.data.notes }), // Map notes -> description
      }
      
      console.log('📝 ArrangementSheet submitting data:', dataToSubmit)
      console.log('📝 songId type and value:', typeof songId, songId)
      console.log('📝 songIds array:', dataToSubmit.songIds)
      
      if (arrangement) {
        await updateArrangement(arrangement.id, dataToSubmit)
        addNotification({
          type: 'success',
          title: 'Arrangement Updated',
          message: 'Your changes have been saved successfully'
        })
      } else {
        await createArrangement(dataToSubmit)
        addNotification({
          type: 'success',
          title: 'Arrangement Created',
          message: 'New arrangement has been added successfully'
        })
      }
      
      onSuccess?.()
      onClose()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save arrangement'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    if (!isSubmitting) {
      onClose()
    }
  }
  
  return (
    <Modal 
      size="large" 
      isOpen={isOpen} 
      onClose={handleCancel}
      title={arrangement ? `Edit Arrangement: ${arrangement.name}` : 'Add New Arrangement'}
      description={songTitle ? `Creating arrangement for "${songTitle}"` : undefined}
      closeOnEsc={!isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      showCloseButton={!isSubmitting}
    >
      <div style={{ padding: '1rem' }}>
        <SimpleArrangementForm
          initialData={formData}
          onChange={handleFormChange}
          disabled={isSubmitting}
          compact={false}
          songTitle={songTitle}
        />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '0.5rem', 
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Saving...' : (arrangement ? 'Update Arrangement' : 'Create Arrangement')}
          </button>
        </div>
      </div>
    </Modal>
  )
}