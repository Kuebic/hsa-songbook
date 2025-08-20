import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useCreateSong } from '../hooks/mutations/useCreateSong'
import { useUpdateSong } from '../hooks/mutations/useUpdateSong'
import { useSongs } from '../hooks/useSongs'
import { useRealtimeDuplicateDetection } from '../validation/hooks/useDuplicateDetection'
import { useAutoSlugGeneration } from '../validation/hooks/useSlugGeneration'
import { songFormSchema, type SongFormData } from '../validation/schemas/songFormSchema'
import { SONG_SOURCES, SOURCE_METADATA, type SongSource } from '../validation/constants/sources'
import { normalizeThemes } from '../validation/utils/themeNormalization'
import { useNotification } from '@shared/components/notifications'
import type { Song } from '../types/song.types'

interface SongManagementFormProps {
  song?: Song // For editing existing song
  onSuccess?: (song: Song) => void
  onCancel?: () => void
  isModal?: boolean
}

interface FormState {
  title: string
  artist: string
  compositionYear: string
  ccli: string
  source: string
  themes: string[]
  notes: string
  isPublic: boolean
}

interface ValidationErrors {
  title?: string
  artist?: string
  compositionYear?: string
  ccli?: string
  source?: string
  themes?: string
  notes?: string
}

export function SongManagementForm({ song, onSuccess, onCancel, isModal = false }: SongManagementFormProps) {
  const { user, isAdmin } = useAuth()
  const { addNotification } = useNotification()
  const titleInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [formState, setFormState] = useState<FormState>({
    title: song?.title || '',
    artist: song?.artist || '',
    compositionYear: song?.compositionYear?.toString() || '',
    ccli: song?.ccli || '',
    source: song?.source || '',
    themes: song?.themes || [],
    notes: song?.notes || '',
    isPublic: song?.metadata?.isPublic ?? false
  })
  
  const [themeInput, setThemeInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Hooks for data fetching and mutations
  const { songs } = useSongs()
  const { createSong } = useCreateSong()
  const { updateSong } = useUpdateSong()
  
  // Ensure songs is always an array
  const existingSongs = useMemo(() => songs || [], [songs])
  
  // Artist autocomplete
  const [artistSuggestions, setArtistSuggestions] = useState<string[]>([])
  const [showArtistSuggestions, setShowArtistSuggestions] = useState(false)
  
  // Theme suggestions
  const [themeSuggestions, setThemeSuggestions] = useState<string[]>([])
  const [showThemeSuggestions, setShowThemeSuggestions] = useState(false)
  
  // Duplicate detection
  const duplicateDetection = useRealtimeDuplicateDetection(
    formState.title,
    formState.artist,
    existingSongs.filter((s: Song) => s.id !== song?.id), // Exclude current song when editing
    {
      debounceDelay: 300,
      onDuplicatesFound: (duplicates) => {
        console.log('Similar songs found:', duplicates)
      }
    }
  )
  
  // Slug generation
  const existingSlugs = existingSongs.map((s: Song) => s.slug).filter(Boolean)
  const slugGeneration = useAutoSlugGeneration(
    formState.title,
    formState.artist,
    existingSlugs,
    {
      includeArtistInitials: true,
      debounceDelay: 500
    }
  )
  
  // Focus on title field when form opens
  useEffect(() => {
    if (isModal && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100)
    }
  }, [isModal])
  
  // Generate artist suggestions
  useEffect(() => {
    if (formState.artist.length >= 2) {
      const artists = Array.from(new Set(
        existingSongs
          .map((s: Song) => s.artist)
          .filter(Boolean)
          .filter((a: string) => a.toLowerCase().includes(formState.artist.toLowerCase()))
      )).slice(0, 5)
      setArtistSuggestions(artists)
    } else {
      setArtistSuggestions([])
    }
  }, [formState.artist, existingSongs])
  
  // Generate theme suggestions from all existing themes
  useEffect(() => {
    if (themeInput.length >= 2) {
      const allThemes = Array.from(new Set(
        existingSongs.flatMap((s: Song) => s.themes || [])
      ))
      const suggestions = allThemes
        .filter((t: string) => t.toLowerCase().includes(themeInput.toLowerCase()))
        .filter((t: string) => !formState.themes.includes(t))
        .slice(0, 10)
      setThemeSuggestions(suggestions)
    } else {
      setThemeSuggestions([])
    }
  }, [themeInput, existingSongs, formState.themes])
  
  const handleFieldChange = (field: keyof FormState, value: string | boolean | string[]) => {
    setFormState(prev => ({ ...prev, [field]: value }))
    // Clear validation error for this field
    setValidationErrors(prev => ({ ...prev, [field]: undefined }))
  }
  
  const handleAddTheme = () => {
    const normalizedTheme = themeInput.trim()
    if (normalizedTheme && !formState.themes.includes(normalizedTheme) && formState.themes.length < 10) {
      handleFieldChange('themes', [...formState.themes, normalizedTheme])
      setThemeInput('')
      setShowThemeSuggestions(false)
    }
  }
  
  const handleRemoveTheme = (theme: string) => {
    handleFieldChange('themes', formState.themes.filter(t => t !== theme))
  }
  
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}
    
    // Prepare data for validation
    const dataToValidate: Partial<SongFormData> = {
      title: formState.title,
      artist: formState.artist || undefined,
      compositionYear: formState.compositionYear ? parseInt(formState.compositionYear) : undefined,
      ccli: formState.ccli || undefined,
      source: formState.source as SongSource || undefined,
      themes: formState.themes,
      notes: formState.notes || undefined,
      isPublic: formState.isPublic
    }
    
    // Validate using Zod schema
    const result = songFormSchema.safeParse(dataToValidate)
    
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof ValidationErrors
        errors[field] = issue.message
      })
      setValidationErrors(errors)
      return false
    }
    
    // Check for exact duplicates
    if (!song && duplicateDetection.hasExactMatch) {
      errors.title = 'A song with this exact title and artist already exists'
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
      const formData: SongFormData = {
        title: formState.title.trim(),
        artist: formState.artist.trim() || undefined,
        compositionYear: formState.compositionYear ? parseInt(formState.compositionYear) : undefined,
        ccli: formState.ccli.trim() || undefined,
        source: formState.source as SongSource || undefined,
        themes: normalizeThemes(formState.themes),
        notes: formState.notes.trim() || undefined,
        isPublic: formState.isPublic,
        slug: song?.slug || slugGeneration.slug || undefined
      }
      
      let result: Song
      
      if (song) {
        // Update existing song
        result = await updateSong(song.id, formData)
        addNotification({
          type: 'success',
          title: 'Song Updated',
          message: `"${result.title}" has been successfully updated`
        })
      } else {
        // Create new song
        result = await createSong(formData)
        addNotification({
          type: 'success',
          title: 'Song Created',
          message: `"${result.title}" has been added to the catalog`
        })
      }
      
      onSuccess?.(result)
    } catch (error) {
      console.error('Failed to save song:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save song'
      setValidationErrors({ 
        title: errorMessage
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
  const canEdit = song ? (isAdmin || song.metadata?.createdBy === user?.id) : true
  const canCreate = user !== null // Including anonymous users
  
  if (!canCreate && !song) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Please sign in to add new songs</p>
      </div>
    )
  }
  
  if (!canEdit) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>You don't have permission to edit this song</p>
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
      {/* Title Field with Duplicate Detection */}
      <div>
        <label htmlFor="title" style={labelStyles}>
          Title *
        </label>
        <input
          ref={titleInputRef}
          id="title"
          type="text"
          value={formState.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          style={{
            ...inputStyles,
            borderColor: validationErrors.title ? '#dc2626' : undefined
          }}
          placeholder="Enter song title"
          required
        />
        {validationErrors.title && (
          <div style={errorStyles}>{validationErrors.title}</div>
        )}
        
        {/* Duplicate Detection Results */}
        {duplicateDetection.duplicates.length > 0 && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accent-foreground)',
            border: duplicateDetection.hasExactMatch ? '1px solid var(--status-error)' : '1px solid var(--status-warning)',
            borderRadius: '4px',
            fontSize: '0.875rem'
          }}>
            <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
              {duplicateDetection.hasExactMatch ? '⚠️ Exact match found:' : 'ℹ️ Similar songs found:'}
            </div>
            {duplicateDetection.duplicates.slice(0, 3).map((dup) => (
              <div key={dup.song.id} style={{ marginBottom: '0.25rem' }}>
                <strong>{dup.song.title}</strong>
                {dup.song.artist && ` by ${dup.song.artist}`}
                {dup.song.compositionYear && ` (${dup.song.compositionYear})`}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Artist Field with Autocomplete */}
      <div style={{ position: 'relative' }}>
        <label htmlFor="artist" style={labelStyles}>
          Artist
        </label>
        <input
          id="artist"
          type="text"
          value={formState.artist}
          onChange={(e) => handleFieldChange('artist', e.target.value)}
          onFocus={() => setShowArtistSuggestions(true)}
          onBlur={() => setTimeout(() => setShowArtistSuggestions(false), 200)}
          style={inputStyles}
          placeholder="Enter artist name"
        />
        {validationErrors.artist && (
          <div style={errorStyles}>{validationErrors.artist}</div>
        )}
        
        {/* Artist Suggestions Dropdown */}
        {showArtistSuggestions && artistSuggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            marginTop: '0.25rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 10
          }}>
            {artistSuggestions.map((artist) => (
              <div
                key={artist}
                style={{
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleFieldChange('artist', artist)
                  setShowArtistSuggestions(false)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-muted)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {artist}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Year and CCLI Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="year" style={labelStyles}>
            Composition Year
          </label>
          <input
            id="year"
            type="number"
            value={formState.compositionYear}
            onChange={(e) => handleFieldChange('compositionYear', e.target.value)}
            style={inputStyles}
            placeholder="e.g., 1985"
            min="1000"
            max={new Date().getFullYear()}
          />
          {validationErrors.compositionYear && (
            <div style={errorStyles}>{validationErrors.compositionYear}</div>
          )}
        </div>
        
        <div>
          <label htmlFor="ccli" style={labelStyles}>
            CCLI Number
          </label>
          <input
            id="ccli"
            type="text"
            value={formState.ccli}
            onChange={(e) => handleFieldChange('ccli', e.target.value)}
            style={inputStyles}
            placeholder="5-7 digits"
            pattern="\d{5,7}"
          />
          {validationErrors.ccli && (
            <div style={errorStyles}>{validationErrors.ccli}</div>
          )}
        </div>
      </div>
      
      {/* Source/Category Field */}
      <div>
        <label htmlFor="source" style={labelStyles}>
          Category *
        </label>
        <select
          id="source"
          value={formState.source}
          onChange={(e) => handleFieldChange('source', e.target.value)}
          style={inputStyles}
          required
        >
          <option value="">Select a category</option>
          {SONG_SOURCES.map((source) => (
            <option key={source} value={source}>
              {SOURCE_METADATA[source].label}
            </option>
          ))}
        </select>
        {validationErrors.source && (
          <div style={errorStyles}>{validationErrors.source}</div>
        )}
      </div>
      
      {/* Themes Field */}
      <div>
        <label htmlFor="themes" style={labelStyles}>
          Themes * (1-10 required)
        </label>
        
        {/* Current Themes */}
        {formState.themes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {formState.themes.map((theme) => (
              <span
                key={theme}
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
                {theme}
                <button
                  type="button"
                  onClick={() => handleRemoveTheme(theme)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'currentColor',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '1.25rem',
                    lineHeight: 1
                  }}
                  aria-label={`Remove ${theme}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        
        {/* Theme Input */}
        <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
          <input
            id="themes"
            type="text"
            value={themeInput}
            onChange={(e) => setThemeInput(e.target.value)}
            onFocus={() => setShowThemeSuggestions(true)}
            onBlur={() => setTimeout(() => setShowThemeSuggestions(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTheme()
              }
            }}
            style={{ ...inputStyles, flex: 1 }}
            placeholder={formState.themes.length >= 10 ? 'Maximum themes reached' : 'Add a theme'}
            disabled={formState.themes.length >= 10}
          />
          <button
            type="button"
            onClick={handleAddTheme}
            disabled={!themeInput.trim() || formState.themes.length >= 10}
            style={{
              ...primaryButtonStyles,
              opacity: !themeInput.trim() || formState.themes.length >= 10 ? 0.5 : 1,
              cursor: !themeInput.trim() || formState.themes.length >= 10 ? 'not-allowed' : 'pointer'
            }}
          >
            Add
          </button>
          
          {/* Theme Suggestions Dropdown */}
          {showThemeSuggestions && themeSuggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              marginTop: '0.25rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 10,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {themeSuggestions.map((theme) => (
                <div
                  key={theme}
                  style={{
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setThemeInput(theme)
                    handleAddTheme()
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-muted)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {theme}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {validationErrors.themes && (
          <div style={errorStyles}>{validationErrors.themes}</div>
        )}
      </div>
      
      {/* Notes Field */}
      <div>
        <label htmlFor="notes" style={labelStyles}>
          Notes
        </label>
        <textarea
          id="notes"
          value={formState.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          style={textareaStyles}
          placeholder="Additional notes about this song"
          maxLength={2000}
        />
        {validationErrors.notes && (
          <div style={errorStyles}>{validationErrors.notes}</div>
        )}
      </div>
      
      {/* Public Checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          id="isPublic"
          type="checkbox"
          checked={formState.isPublic}
          onChange={(e) => handleFieldChange('isPublic', e.target.checked)}
          style={{ width: 'auto' }}
        />
        <label htmlFor="isPublic" style={{ ...labelStyles, margin: 0 }}>
          Make this song public
        </label>
      </div>
      
      {/* Generated Slug Preview */}
      {!song && slugGeneration.slug && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-accent-foreground)',
          border: '1px solid var(--status-info)',
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}>
          <strong>URL Slug:</strong> {slugGeneration.slug}
        </div>
      )}
      
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
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = 'var(--color-muted)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
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
          {isSubmitting ? 'Saving...' : (song ? 'Update Song' : 'Create Song')}
        </button>
      </div>
      
      {/* Guest User Notice */}
      {user?.is_anonymous && !song && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-accent-foreground)',
          border: '1px solid var(--status-warning)',
          borderRadius: '4px',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          You're adding this song as a guest. Consider creating an account to manage your songs later.
        </div>
      )}
    </form>
  )
}