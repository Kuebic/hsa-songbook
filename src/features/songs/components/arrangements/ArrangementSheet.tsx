import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@shared/components/modal'
import { SimpleArrangementForm } from './SimpleArrangementForm'
import { useArrangementMutations } from '../../hooks/useArrangementMutations'
import { useNotification } from '@shared/components/notifications'
import { useAuth } from '@features/auth'
import { arrangementSchema } from '../../validation/schemas/arrangementSchema'
import { generateUniqueSlug } from '../../validation/utils/slugGeneration'
import { generateInitialChordPro } from '../../utils/chordProGenerator'
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
    chordProText: arrangement?.chordProText || arrangement?.chordData || '', // Handle both field names
    notes: arrangement?.description || arrangement?.notes || '', // Handle both field names
    tags: arrangement?.tags || [],
    capo: arrangement?.capo,
    duration: arrangement?.duration
  }))
  
  const { createArrangement, updateArrangement, deleteArrangement } = useArrangementMutations()
  const { addNotification } = useNotification()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  
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
        // Update existing arrangement - stay on current page
        await updateArrangement(arrangement.id, dataToSubmit)
        addNotification({
          type: 'success',
          title: 'Arrangement Updated',
          message: 'Your changes have been saved successfully'
        })
        onSuccess?.()
        onClose()
      } else {
        // Create new arrangement and navigate to chord editor
        await createArrangement(dataToSubmit)
        
        // Generate initial ChordPro content with form data
        const initialChordPro = generateInitialChordPro(validationResult.data, songTitle)
        
        // Store initial ChordPro content for the editor
        sessionStorage.setItem(`initial-chordpro-${slug}`, initialChordPro)
        
        addNotification({
          type: 'success',
          title: 'Arrangement Created',
          message: 'Opening chord editor with starter template...'
        })
        onClose()
        onSuccess?.()
        // Navigate to chord editor for the new arrangement
        navigate(`/arrangements/${slug}/edit`)
      }
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
  
  const handleDelete = async () => {
    if (!arrangement) return
    
    // Confirm deletion
    const confirmed = window.confirm(`Are you sure you want to delete "${arrangement.name}"? This action cannot be undone.`)
    if (!confirmed) return
    
    setIsSubmitting(true)
    try {
      await deleteArrangement(arrangement.id)
      addNotification({
        type: 'success',
        title: 'Arrangement Deleted',
        message: `"${arrangement.name}" has been deleted successfully`
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete arrangement'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Modal 
      size="large" 
      isOpen={isOpen} 
      onClose={handleCancel}
      title={arrangement ? `Edit Arrangement: ${arrangement.name}` : 'Add New Arrangement'}
      description={
        arrangement
          ? `Editing arrangement details for "${songTitle}"`
          : `Create arrangement for "${songTitle}" - you'll add the chord chart in the next step`
      }
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
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '0.5rem', 
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          {/* Delete button - only show when editing existing arrangement and user is admin */}
          <div>
            {arrangement && isAdmin && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                  fontSize: '14px'
                }}
              >
                Delete Arrangement
              </button>
            )}
          </div>
          
          {/* Cancel and Save buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
              {isSubmitting 
                ? 'Saving...' 
                : (arrangement ? 'Update Arrangement' : 'Create & Open Editor')
              }
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}