import { useState, useCallback, useMemo } from 'react'
import { FormActions, SubmitButton, CancelButton } from '@shared/components/form'
import { SimpleCheckbox } from './utils/SimpleFormInputs'
import { BasicInfoSection } from './sections/BasicInfoSection'
import { CategorizationSection } from './sections/CategorizationSection'
import { NotesSection } from './sections/NotesSection'
import { DuplicateWarning } from './DuplicateWarning'
import { SimpleArrangementForm } from '../arrangements/SimpleArrangementForm'
import { songFormSchema, type SongFormData } from '../../validation/schemas/songFormSchema'
import type { ArrangementFormData } from '../../validation/schemas/arrangementSchema'
import { useRealtimeDuplicateDetection } from '../../validation/hooks/useDuplicateDetection'
import type { Song } from '../../types/song.types'

interface SongFormProps {
  initialData?: Partial<Song>
  existingSongs?: Song[]
  onSubmit: (data: SongFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function SongForm({ 
  initialData, 
  existingSongs = [],
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: SongFormProps) {
  // Initialize form data from initial data
  const [formData, setFormData] = useState<Partial<SongFormData>>(() => ({
    title: initialData?.title || '',
    artist: initialData?.artist || '',
    compositionYear: initialData?.compositionYear,
    ccli: initialData?.ccli || '',
    source: initialData?.source,
    themes: initialData?.themes || [],
    notes: initialData?.notes || '',
    isPublic: initialData?.metadata?.isPublic || false,
    slug: initialData?.slug,
    arrangement: undefined
  }))
  
  const [includeArrangement, setIncludeArrangement] = useState(false)
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(true)
  
  // Use real-time duplicate detection
  const { 
    duplicates: similarSongs,
    hasExactMatch
  } = useRealtimeDuplicateDetection(
    formData.title || '',
    formData.artist,
    existingSongs,
    {
      debounceDelay: 500,
      verySimilarThreshold: 3,
      maxResults: 10
    }
  )
  
  // Handle field changes
  const handleChange = useCallback((field: keyof SongFormData, value: SongFormData[keyof SongFormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTouched(prev => new Set(prev).add(field))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
    
    // Reset duplicate warning when title/artist changes
    if (field === 'title' || field === 'artist') {
      setShowDuplicateWarning(true)
    }
  }, [errors])
  
  // Handle arrangement changes
  const handleArrangementChange = useCallback((arrangementData: Partial<ArrangementFormData>) => {
    setFormData(prev => ({
      ...prev,
      arrangement: arrangementData as ArrangementFormData
    }))
  }, [])
  
  // Validate form
  const validateForm = useCallback((): boolean => {
    const result = songFormSchema.safeParse(formData)
    
    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as string
        if (field && !newErrors[field]) {
          newErrors[field] = issue.message
        }
      })
      setErrors(newErrors)
      
      // Mark all fields with errors as touched to show errors
      setTouched(new Set([...touched, ...Object.keys(newErrors)]))
      return false
    }
    
    setErrors({})
    return true
  }, [formData, touched])
  
  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    if (!validateForm()) {
      return
    }
    
    try {
      const validatedData = songFormSchema.parse(formData)
      await onSubmit(validatedData)
    } catch (error) {
      console.error('Form submission error:', error)
      // Error handling would be done by parent component
    }
  }, [formData, validateForm, onSubmit])
  
  // Get field error (only show if field is touched)
  const getFieldError = useCallback((field: string): string | undefined => {
    return touched.has(field) ? errors[field] : undefined
  }, [touched, errors])
  
  // Prepare errors for each section
  const basicInfoErrors = useMemo(() => ({
    title: getFieldError('title') || '',
    artist: getFieldError('artist') || '',
    compositionYear: getFieldError('compositionYear') || '',
    ccli: getFieldError('ccli') || ''
  }), [getFieldError])
  
  const categorizationErrors = useMemo(() => ({
    source: getFieldError('source') || '',
    themes: getFieldError('themes') || ''
  }), [getFieldError])
  
  const notesErrors = useMemo(() => ({
    notes: getFieldError('notes') || '',
    isPublic: getFieldError('isPublic') || ''
  }), [getFieldError])
  
  // const arrangementErrors = useMemo(() => ({
  //   arrangement: getFieldError('arrangement') || ''
  // }), [getFieldError]) // Temporarily commented out
  
  const formStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '100%'
  }
  
  const shouldShowDuplicateWarning = 
    showDuplicateWarning && 
    similarSongs.length > 0 && 
    !initialData && // Don't show for edit mode
    !isSubmitting
  
  return (
    <form onSubmit={handleSubmit} style={formStyles} noValidate>
      {shouldShowDuplicateWarning && (
        <DuplicateWarning 
          similarSongs={similarSongs}
          onContinue={() => setShowDuplicateWarning(false)}
        />
      )}
      
      <BasicInfoSection
        data={formData}
        errors={basicInfoErrors}
        onChange={handleChange}
        disabled={isSubmitting}
      />
      
      <CategorizationSection
        data={formData}
        errors={categorizationErrors}
        onChange={handleChange}
        disabled={isSubmitting}
      />
      
      <NotesSection
        data={formData}
        errors={notesErrors}
        onChange={handleChange}
        disabled={isSubmitting}
      />
      
      {/* Arrangement Section */}
      <div style={{
        padding: '20px',
        backgroundColor: 'var(--color-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)'
      }}>
        <SimpleCheckbox
          name="includeArrangement"
          label="Add arrangement to this song"
          checked={includeArrangement}
          onChange={setIncludeArrangement}
          disabled={isSubmitting}
          helperText="Include musical notation, chords, and performance instructions"
        />
        
        {includeArrangement && (
          <div style={{ marginTop: '16px' }}>
            <SimpleArrangementForm
              initialData={formData.arrangement}
              onChange={handleArrangementChange}
              disabled={isSubmitting}
              compact={true}
              songTitle={formData.title || 'New Song'}
            />
          </div>
        )}
      </div>
      
      <FormActions align="right">
        <CancelButton onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </CancelButton>
        <SubmitButton 
          disabled={isSubmitting || (hasExactMatch && showDuplicateWarning)}
          onClick={() => handleSubmit()}
        >
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Song' : 'Create Song')}
        </SubmitButton>
      </FormActions>
    </form>
  )
}