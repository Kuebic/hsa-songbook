import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useArrangementMutations } from '../hooks/mutations/useArrangementMutations'
import { useSongs } from '../hooks/useSongs'
import { arrangementSchema, type ArrangementFormData } from '../validation/schemas/arrangementSchema'
import { MUSICAL_KEYS, TIME_SIGNATURES, DIFFICULTY_LEVELS } from '../validation/constants/musicalKeys'
import { useNotification } from '@shared/components/notifications'
import type { Arrangement } from '../types/song.types'

interface ArrangementManagementFormProps {
  arrangement?: Arrangement // For editing existing arrangement
  songId?: string // For creating new arrangement for specific song
  onSuccess?: (arrangement: Arrangement) => void
  onCancel?: () => void
  isModal?: boolean
}

interface FormState {
  name: string
  slug: string
  key: string
  tempo: string
  timeSignature: string
  difficulty: string
  tags: string[]
  description: string
  notes: string
  capo: string
  duration: string
}

interface ValidationErrors {
  name?: string
  slug?: string
  key?: string
  tempo?: string
  timeSignature?: string
  difficulty?: string
  tags?: string
  description?: string
  notes?: string
  capo?: string
  duration?: string
}

export function ArrangementManagementForm({ 
  arrangement, 
  songId, 
  onSuccess, 
  onCancel, 
  isModal = false 
}: ArrangementManagementFormProps) {
  const { user, isAdmin } = useAuth()
  const { addNotification } = useNotification()
  const nameInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [formState, setFormState] = useState<FormState>({
    name: arrangement?.name || '',
    slug: arrangement?.slug || '',
    key: arrangement?.key || '',
    tempo: arrangement?.tempo?.toString() || '',
    timeSignature: arrangement?.timeSignature || '4/4',
    difficulty: arrangement?.difficulty || 'beginner',
    tags: arrangement?.tags || [],
    description: arrangement?.description || '',
    notes: arrangement?.description || '', // Using description as notes for now
    capo: '',
    duration: arrangement?.duration?.toString() || ''
  })
  
  const [tagInput, setTagInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Hooks for data fetching and mutations
  const { songs } = useSongs()
  const { createArrangement, updateArrangement } = useArrangementMutations()
  
  // Ensure songs is always an array
  const existingSongs = useMemo(() => songs || [], [songs])
  
  // Current song for context
  const currentSong = useMemo(() => {
    if (songId) {
      return existingSongs.find(s => s.id === songId)
    }
    if (arrangement?.songIds?.[0]) {
      return existingSongs.find(s => s.id === arrangement.songIds[0])
    }
    return null
  }, [songId, arrangement, existingSongs])
  
  // Auto-suggest a default name but allow full editing
  useEffect(() => {
    if (!arrangement && currentSong && !formState.name) {
      // Just suggest "Arrangement 1", "Arrangement 2", etc. without song title
      setFormState(prev => ({
        ...prev,
        name: 'New Arrangement'
      }))
    }
  }, [currentSong, arrangement, formState.name])
  
  // Auto-generate slug from name
  useEffect(() => {
    if (formState.name && !arrangement) {
      const slug = formState.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormState(prev => ({ ...prev, slug }))
    }
  }, [formState.name, arrangement])
  
  // Focus on name field when form opens
  useEffect(() => {
    if (isModal && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100)
    }
  }, [isModal])
  
  const handleFieldChange = (field: keyof FormState, value: string | string[]) => {
    setFormState(prev => ({ ...prev, [field]: value }))
    // Clear validation error for this field
    setValidationErrors(prev => ({ ...prev, [field]: undefined }))
  }
  
  const handleAddTag = () => {
    const normalizedTag = tagInput.trim()
    if (normalizedTag && !formState.tags.includes(normalizedTag) && formState.tags.length < 10) {
      handleFieldChange('tags', [...formState.tags, normalizedTag])
      setTagInput('')
    }
  }
  
  const handleRemoveTag = (tag: string) => {
    handleFieldChange('tags', formState.tags.filter(t => t !== tag))
  }
  
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}
    
    // Prepare data for validation
    const dataToValidate: Partial<ArrangementFormData> = {
      name: formState.name,
      slug: formState.slug || undefined,
      key: formState.key || undefined,
      tempo: formState.tempo ? parseInt(formState.tempo) : undefined,
      timeSignature: formState.timeSignature || undefined,
      difficulty: formState.difficulty as 'beginner' | 'intermediate' | 'advanced' || undefined,
      tags: formState.tags,
      description: formState.description || undefined,
      notes: formState.notes || undefined,
      capo: formState.capo ? parseInt(formState.capo) : undefined,
      duration: formState.duration ? parseInt(formState.duration) : undefined,
      songIds: songId ? [songId] : arrangement?.songIds
    }
    
    // Validate using Zod schema
    const result = arrangementSchema.safeParse(dataToValidate)
    
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof ValidationErrors
        errors[field] = issue.message
      })
      setValidationErrors(errors)
      return false
    }
    
    setValidationErrors({})
    return true
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const formData: ArrangementFormData = {
        name: formState.name.trim(),
        slug: formState.slug.trim() || undefined,
        key: formState.key,
        tempo: formState.tempo ? parseInt(formState.tempo) : undefined,
        timeSignature: formState.timeSignature || '4/4',
        difficulty: formState.difficulty as 'beginner' | 'intermediate' | 'advanced' || 'beginner',
        tags: formState.tags,
        chordProText: '', // Will be added in the ChordPro editor
        description: formState.description.trim() || undefined,
        notes: formState.notes.trim() || undefined,
        capo: formState.capo ? parseInt(formState.capo) : undefined,
        duration: formState.duration ? parseInt(formState.duration) : undefined,
        songIds: songId ? [songId] : arrangement?.songIds || []
      }
      
      let result: Arrangement
      
      if (arrangement) {
        // Update existing arrangement
        result = await updateArrangement(arrangement.id, formData)
        addNotification({
          type: 'success',
          title: 'Arrangement Updated',
          message: `"${result.name}" has been successfully updated`
        })
      } else {
        // Create new arrangement
        result = await createArrangement(formData)
        addNotification({
          type: 'success',
          title: 'Arrangement Created',
          message: `"${result.name}" has been added to the catalog`
        })
      }
      
      onSuccess?.(result)
    } catch (error) {
      console.error('Failed to save arrangement:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save arrangement'
      setValidationErrors({ 
        name: errorMessage
      })
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Check permissions
  const canEdit = arrangement ? (isAdmin || arrangement.createdBy === user?.id) : true
  const canCreate = user !== null // Including anonymous users
  
  if (!canCreate && !arrangement) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Please sign in to add new arrangements</p>
      </div>
    )
  }
  
  if (!canEdit) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>You don't have permission to edit this arrangement</p>
      </div>
    )
  }
  
  // Styles
  const formStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    maxWidth: isModal ? '100%' : '600px',
    margin: isModal ? 0 : '0 auto',
    padding: isModal ? 0 : '2rem'
  }
  
  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-primary)'
  }
  
  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    backgroundColor: 'var(--color-background)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s'
  }
  
  const textareaStyles: React.CSSProperties = {
    ...inputStyles,
    minHeight: '100px',
    resize: 'vertical'
  }
  
  const errorStyles: React.CSSProperties = {
    color: 'var(--color-destructive)',
    fontSize: '0.75rem',
    marginTop: '0.25rem'
  }
  
  const buttonStyles: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none'
  }
  
  const primaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-primary-foreground)'
  }
  
  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--color-border)'
  }
  
  return (
    <form onSubmit={handleSubmit} style={formStyles}>
      {/* Current Song Context */}
      {currentSong && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-accent-foreground)',
          border: '1px solid var(--status-info)',
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}>
          <strong>Song:</strong> {currentSong.title}
          {currentSong.artist && ` by ${currentSong.artist}`}
        </div>
      )}
      
      {/* Name Field */}
      <div>
        <label htmlFor="name" style={labelStyles}>
          Arrangement Name *
        </label>
        <input
          ref={nameInputRef}
          id="name"
          type="text"
          value={formState.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          style={{
            ...inputStyles,
            borderColor: validationErrors.name ? '#dc2626' : undefined
          }}
          placeholder="e.g., 'Acoustic Version', 'Original', 'Jazz Arrangement'"
          required
        />
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Choose any name you like for this arrangement
        </div>
        {validationErrors.name && (
          <div style={errorStyles}>{validationErrors.name}</div>
        )}
      </div>
      
      {/* Musical Properties */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        <div>
          <label htmlFor="key" style={labelStyles}>
            Key
          </label>
          <select
            id="key"
            value={formState.key}
            onChange={(e) => handleFieldChange('key', e.target.value)}
            style={inputStyles}
          >
            <option value="">Select key</option>
            {MUSICAL_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          {validationErrors.key && (
            <div style={errorStyles}>{validationErrors.key}</div>
          )}
        </div>
        
        <div>
          <label htmlFor="tempo" style={labelStyles}>
            Tempo (BPM)
          </label>
          <input
            id="tempo"
            type="number"
            value={formState.tempo}
            onChange={(e) => handleFieldChange('tempo', e.target.value)}
            style={inputStyles}
            placeholder="e.g., 120"
            min="40"
            max="240"
          />
          {validationErrors.tempo && (
            <div style={errorStyles}>{validationErrors.tempo}</div>
          )}
        </div>
        
        <div>
          <label htmlFor="timeSignature" style={labelStyles}>
            Time Signature
          </label>
          <select
            id="timeSignature"
            value={formState.timeSignature}
            onChange={(e) => handleFieldChange('timeSignature', e.target.value)}
            style={inputStyles}
          >
            {TIME_SIGNATURES.map((sig) => (
              <option key={sig} value={sig}>
                {sig}
              </option>
            ))}
          </select>
          {validationErrors.timeSignature && (
            <div style={errorStyles}>{validationErrors.timeSignature}</div>
          )}
        </div>
        
        <div>
          <label htmlFor="difficulty" style={labelStyles}>
            Difficulty *
          </label>
          <select
            id="difficulty"
            value={formState.difficulty}
            onChange={(e) => handleFieldChange('difficulty', e.target.value)}
            style={inputStyles}
            required
          >
            {DIFFICULTY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
          {validationErrors.difficulty && (
            <div style={errorStyles}>{validationErrors.difficulty}</div>
          )}
        </div>
      </div>
      
      {/* Tags Field */}
      <div>
        <label htmlFor="tags" style={labelStyles}>
          Tags (0-10 optional)
        </label>
        
        {/* Current Tags */}
        {formState.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {formState.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-accent-foreground)',
                  borderRadius: '16px',
                  fontSize: '0.875rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'currentColor',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '1.25rem',
                    lineHeight: 1
                  }}
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        
        {/* Tag Input */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              }
            }}
            style={{ ...inputStyles, flex: 1 }}
            placeholder={formState.tags.length >= 10 ? 'Maximum tags reached' : 'Add a tag'}
            disabled={formState.tags.length >= 10}
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!tagInput.trim() || formState.tags.length >= 10}
            style={{
              ...primaryButtonStyles,
              opacity: !tagInput.trim() || formState.tags.length >= 10 ? 0.5 : 1,
              cursor: !tagInput.trim() || formState.tags.length >= 10 ? 'not-allowed' : 'pointer'
            }}
          >
            Add
          </button>
        </div>
        
        {validationErrors.tags && (
          <div style={errorStyles}>{validationErrors.tags}</div>
        )}
      </div>
      
      
      {/* Description Field */}
      <div>
        <label htmlFor="description" style={labelStyles}>
          Description
        </label>
        <textarea
          id="description"
          value={formState.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          style={textareaStyles}
          placeholder="Describe this arrangement"
          maxLength={1000}
        />
        {validationErrors.description && (
          <div style={errorStyles}>{validationErrors.description}</div>
        )}
      </div>
      
      {/* Form Actions */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              ...secondaryButtonStyles,
              opacity: isSubmitting ? 0.6 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          style={{
            ...primaryButtonStyles,
            opacity: isSubmitting ? 0.6 : 1,
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (arrangement ? 'Update Arrangement' : 'Create Arrangement')}
        </button>
      </div>
      
      {/* Guest User Notice */}
      {user?.is_anonymous && !arrangement && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-accent-foreground)',
          border: '1px solid var(--status-warning)',
          borderRadius: '4px',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          You're adding this arrangement as a guest. Consider creating an account to manage your arrangements later.
        </div>
      )}
    </form>
  )
}