# Song Form Components Implementation PRP

## Executive Summary
Create comprehensive song form components using the existing shared form library, implementing the SongForm with proper field layout, theme autocomplete with controlled vocabulary, and source dropdown with predefined options. This builds upon the modal infrastructure and validation schemas.

**Confidence Score: 9.5/10** - Very high confidence due to existing form component library and clear patterns.

## Context and Research Findings

### Current State Analysis
**Existing Infrastructure:**
- Complete shared form component library in `src/shared/components/form/`
- Form components with TypeScript support, validation, and accessibility
- Example implementation in `SongForm.example.tsx`
- Modal infrastructure from PRP 1
- Validation schemas from PRP 2

**Form Components Available:**
- Form, FormSection, FormField, FormRow, FormGroup
- FormInput, FormTextarea, FormSelect, FormCheckbox
- FormButton, SubmitButton, CancelButton
- FormError, FormLabel, FormHelperText
- Character counting, auto-resize, validation integration

### Requirements from Documentation
From `claude_md_files/song-form.md`:
- Multi-section form (Basic Info, Categorization, Notes)
- Theme autocomplete with normalization
- Source dropdown from controlled list
- Character limits with counters
- Duplicate detection warnings
- Permission-based field visibility

### Vertical Slice Architecture
```
src/features/songs/components/
├── forms/
│   ├── SongForm.tsx              # Main form component
│   ├── SongForm.test.tsx         # Form tests
│   ├── SongFormModal.tsx         # Modal wrapper
│   ├── SongFormModal.test.tsx    # Modal tests
│   ├── fields/
│   │   ├── ThemeCombobox.tsx     # Theme autocomplete
│   │   ├── SourceSelect.tsx      # Source dropdown
│   │   ├── YearInput.tsx         # Year validation
│   │   └── CCLIInput.tsx         # CCLI format
│   ├── sections/
│   │   ├── BasicInfoSection.tsx  # Title, artist, year
│   │   ├── CategorizationSection.tsx # Source, themes
│   │   └── NotesSection.tsx      # Notes, metadata
│   └── DuplicateWarning.tsx      # Similar songs alert
```

## Implementation Blueprint

### Phase 1: Custom Field Components

```typescript
// src/features/songs/components/forms/fields/ThemeCombobox.tsx
import { useState, useCallback, useMemo } from 'react'
import { FormField, FormLabel, FormHelperText, FormError } from '@shared/components/form'
import { suggestThemes, normalizeTheme } from '@features/songs/validation/utils/themeNormalization'
import { NORMALIZED_THEMES } from '@features/songs/validation/constants/themes'

interface ThemeComboboxProps {
  value: string[]
  onChange: (themes: string[]) => void
  error?: string
  maxThemes?: number
  required?: boolean
}

export function ThemeCombobox({ 
  value = [], 
  onChange, 
  error, 
  maxThemes = 10,
  required = false 
}: ThemeComboboxProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  
  const allThemes = useMemo(() => 
    Object.keys(NORMALIZED_THEMES).sort(),
    []
  )
  
  const suggestions = useMemo(() => 
    inputValue ? suggestThemes(inputValue) : allThemes,
    [inputValue, allThemes]
  )
  
  const handleAddTheme = useCallback((theme: string) => {
    if (value.length >= maxThemes) return
    
    const normalized = normalizeTheme(theme)
    if (!value.includes(normalized)) {
      onChange([...value, normalized])
    }
    setInputValue('')
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }, [value, onChange, maxThemes])
  
  const handleRemoveTheme = useCallback((theme: string) => {
    onChange(value.filter(t => t !== theme))
  }, [value, onChange])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (e.key === 'ArrowDown') {
        setShowSuggestions(true)
        setHighlightedIndex(0)
      }
      return
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleAddTheme(suggestions[highlightedIndex])
        } else if (inputValue) {
          handleAddTheme(inputValue)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        break
      case 'Tab':
        if (showSuggestions) {
          setShowSuggestions(false)
          setHighlightedIndex(-1)
        }
        break
    }
  }, [showSuggestions, suggestions, highlightedIndex, inputValue, handleAddTheme])
  
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%'
  }
  
  const tagsContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '8px'
  }
  
  const tagStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    fontSize: '14px'
  }
  
  const removeButtonStyles: React.CSSProperties = {
    marginLeft: '8px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0 4px',
    fontSize: '16px',
    color: '#64748b'
  }
  
  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    outline: 'none'
  }
  
  const suggestionsStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: '200px',
    overflow: 'auto',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    marginTop: '4px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 1000
  }
  
  const suggestionStyles = (isHighlighted: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    cursor: 'pointer',
    backgroundColor: isHighlighted ? '#f1f5f9' : 'transparent',
    fontSize: '14px'
  })
  
  return (
    <FormField>
      <FormLabel required={required}>Themes</FormLabel>
      
      {value.length > 0 && (
        <div style={tagsContainerStyles}>
          {value.map(theme => (
            <span key={theme} style={tagStyles}>
              {theme}
              <button
                type="button"
                onClick={() => handleRemoveTheme(theme)}
                style={removeButtonStyles}
                aria-label={`Remove ${theme}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      <div style={containerStyles}>
        <input
          type="text"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
            setHighlightedIndex(-1)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Type to search themes...' : 'Add more themes...'}
          style={{
            ...inputStyles,
            borderColor: error ? '#ef4444' : '#e2e8f0'
          }}
          aria-label="Theme search"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          disabled={value.length >= maxThemes}
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <div style={suggestionsStyles} role="listbox">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                style={suggestionStyles(index === highlightedIndex)}
                onClick={() => handleAddTheme(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <FormHelperText>
        {value.length}/{maxThemes} themes selected. Start typing to search or add custom themes.
      </FormHelperText>
      
      {error && <FormError>{error}</FormError>}
    </FormField>
  )
}

// src/features/songs/components/forms/fields/SourceSelect.tsx
import { FormSelect } from '@shared/components/form'
import { SONG_SOURCES } from '@features/songs/validation/constants/sources'

interface SourceSelectProps {
  value?: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
}

export function SourceSelect({ value, onChange, error, required }: SourceSelectProps) {
  return (
    <FormSelect
      label="Source"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      error={error}
      required={required}
      placeholder="Select a source..."
    >
      <option value="">Select a source...</option>
      {SONG_SOURCES.map(source => (
        <option key={source} value={source}>
          {source.replace(/-/g, ' ')}
        </option>
      ))}
    </FormSelect>
  )
}
```

### Phase 2: Form Sections

```typescript
// src/features/songs/components/forms/sections/BasicInfoSection.tsx
import { FormSection, FormRow, FormInput, FormGroup } from '@shared/components/form'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'

interface BasicInfoSectionProps {
  data: Partial<SongFormData>
  errors: Record<string, string>
  onChange: (field: keyof SongFormData, value: any) => void
}

export function BasicInfoSection({ data, errors, onChange }: BasicInfoSectionProps) {
  const currentYear = new Date().getFullYear()
  
  return (
    <FormSection title="Basic Information">
      <FormInput
        label="Title"
        value={data.title || ''}
        onChange={e => onChange('title', e.target.value)}
        error={errors.title}
        required
        maxLength={200}
        showCharacterCount
        placeholder="Enter song title..."
      />
      
      <FormRow>
        <FormInput
          label="Artist"
          value={data.artist || ''}
          onChange={e => onChange('artist', e.target.value)}
          error={errors.artist}
          maxLength={100}
          placeholder="Original artist or composer..."
        />
        
        <FormInput
          label="Year"
          type="number"
          value={data.compositionYear?.toString() || ''}
          onChange={e => onChange('compositionYear', 
            e.target.value ? parseInt(e.target.value) : undefined
          )}
          error={errors.compositionYear}
          min={1000}
          max={currentYear}
          placeholder="Year composed..."
        />
      </FormRow>
      
      <FormInput
        label="CCLI Number"
        value={data.ccli || ''}
        onChange={e => onChange('ccli', e.target.value)}
        error={errors.ccli}
        pattern="[0-9]{5,7}"
        placeholder="5-7 digit CCLI number..."
        helperText="Copyright Licensing International number (if applicable)"
      />
    </FormSection>
  )
}

// src/features/songs/components/forms/sections/CategorizationSection.tsx
import { FormSection } from '@shared/components/form'
import { ThemeCombobox } from '../fields/ThemeCombobox'
import { SourceSelect } from '../fields/SourceSelect'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'

interface CategorizationSectionProps {
  data: Partial<SongFormData>
  errors: Record<string, string>
  onChange: (field: keyof SongFormData, value: any) => void
}

export function CategorizationSection({ data, errors, onChange }: CategorizationSectionProps) {
  return (
    <FormSection title="Categorization">
      <SourceSelect
        value={data.source}
        onChange={value => onChange('source', value)}
        error={errors.source}
      />
      
      <ThemeCombobox
        value={data.themes || []}
        onChange={themes => onChange('themes', themes)}
        error={errors.themes}
        required
        maxThemes={10}
      />
    </FormSection>
  )
}

// src/features/songs/components/forms/sections/NotesSection.tsx
import { FormSection, FormTextarea, FormCheckbox } from '@shared/components/form'
import { useAuth } from '@features/auth/hooks/useAuth'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'

interface NotesSectionProps {
  data: Partial<SongFormData>
  errors: Record<string, string>
  onChange: (field: keyof SongFormData, value: any) => void
}

export function NotesSection({ data, errors, onChange }: NotesSectionProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  
  return (
    <FormSection title="Additional Information">
      <FormTextarea
        label="Notes"
        value={data.notes || ''}
        onChange={e => onChange('notes', e.target.value)}
        error={errors.notes}
        rows={4}
        maxLength={2000}
        showCharacterCount
        autoResize
        placeholder="Any additional notes about this song..."
        helperText="Include performance notes, historical context, or special instructions"
      />
      
      {isAdmin && (
        <FormCheckbox
          label="Make this song public"
          checked={data.isPublic || false}
          onChange={e => onChange('isPublic', e.target.checked)}
          helperText="Public songs are visible to all users"
        />
      )}
    </FormSection>
  )
}
```

### Phase 3: Main Song Form

```typescript
// src/features/songs/components/forms/SongForm.tsx
import { useState, useCallback, useEffect } from 'react'
import { Form, FormActions, SubmitButton, CancelButton } from '@shared/components/form'
import { BasicInfoSection } from './sections/BasicInfoSection'
import { CategorizationSection } from './sections/CategorizationSection'
import { NotesSection } from './sections/NotesSection'
import { DuplicateWarning } from './DuplicateWarning'
import { songFormSchema, type SongFormData } from '@features/songs/validation/schemas/songFormSchema'
import { useDuplicateDetection } from '@features/songs/validation/hooks/useDuplicateDetection'
import type { Song } from '@features/songs/types/song.types'

interface SongFormProps {
  initialData?: Partial<Song>
  onSubmit: (data: SongFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function SongForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: SongFormProps) {
  const [formData, setFormData] = useState<Partial<SongFormData>>(() => ({
    title: initialData?.title || '',
    artist: initialData?.artist || '',
    compositionYear: initialData?.compositionYear,
    ccli: initialData?.ccli || '',
    source: initialData?.source,
    themes: initialData?.themes || [],
    notes: initialData?.notes || '',
    isPublic: initialData?.metadata?.isPublic || false
  }))
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  
  const { similarSongs, checkForDuplicates, clearSimilarSongs } = useDuplicateDetection()
  
  // Check for duplicates when title or artist changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title && formData.title.length > 3) {
        checkForDuplicates(formData.title, formData.artist)
      } else {
        clearSimilarSongs()
      }
    }, 500) // Debounce
    
    return () => clearTimeout(timer)
  }, [formData.title, formData.artist, checkForDuplicates, clearSimilarSongs])
  
  const handleChange = useCallback((field: keyof SongFormData, value: any) => {
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
  }, [errors])
  
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
      
      // Mark all fields as touched to show errors
      setTouched(new Set(Object.keys(newErrors)))
      return false
    }
    
    setErrors({})
    return true
  }, [formData])
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
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
  
  const getFieldError = (field: string): string | undefined => {
    return touched.has(field) ? errors[field] : undefined
  }
  
  const formStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '100%'
  }
  
  return (
    <form onSubmit={handleSubmit} style={formStyles}>
      {similarSongs.length > 0 && !initialData && (
        <DuplicateWarning 
          similarSongs={similarSongs}
          onContinue={() => clearSimilarSongs()}
        />
      )}
      
      <BasicInfoSection
        data={formData}
        errors={Object.fromEntries(
          Object.entries(errors).filter(([key]) => 
            ['title', 'artist', 'compositionYear', 'ccli'].includes(key)
          )
        )}
        onChange={handleChange}
      />
      
      <CategorizationSection
        data={formData}
        errors={Object.fromEntries(
          Object.entries(errors).filter(([key]) => 
            ['source', 'themes'].includes(key)
          )
        )}
        onChange={handleChange}
      />
      
      <NotesSection
        data={formData}
        errors={Object.fromEntries(
          Object.entries(errors).filter(([key]) => 
            ['notes', 'isPublic'].includes(key)
          )
        )}
        onChange={handleChange}
      />
      
      <FormActions>
        <CancelButton onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </CancelButton>
        <SubmitButton disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Song' : 'Create Song')}
        </SubmitButton>
      </FormActions>
    </form>
  )
}
```

### Phase 4: Song Form Modal

```typescript
// src/features/songs/components/forms/SongFormModal.tsx
import { Modal } from '@shared/components/modal'
import { SongForm } from './SongForm'
import type { Song } from '@features/songs/types/song.types'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'

interface SongFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SongFormData) => Promise<void>
  song?: Song
  isSubmitting?: boolean
}

export function SongFormModal({
  isOpen,
  onClose,
  onSubmit,
  song,
  isSubmitting
}: SongFormModalProps) {
  const handleSubmit = async (data: SongFormData) => {
    await onSubmit(data)
    // Parent component will close modal on success
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
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  )
}

// src/features/songs/components/forms/DuplicateWarning.tsx
import type { SimilarSong } from '@features/songs/validation/utils/duplicateDetection'

interface DuplicateWarningProps {
  similarSongs: SimilarSong[]
  onContinue: () => void
}

export function DuplicateWarning({ similarSongs, onContinue }: DuplicateWarningProps) {
  const warningStyles: React.CSSProperties = {
    padding: '16px',
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    marginBottom: '16px'
  }
  
  const titleStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#92400e',
    marginBottom: '8px'
  }
  
  const listStyles: React.CSSProperties = {
    margin: '8px 0',
    paddingLeft: '20px'
  }
  
  const buttonStyles: React.CSSProperties = {
    marginTop: '12px',
    padding: '6px 12px',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  }
  
  return (
    <div style={warningStyles}>
      <div style={titleStyles}>
        ⚠️ Similar songs found in the database
      </div>
      <p style={{ color: '#92400e', fontSize: '14px' }}>
        The following songs may be duplicates:
      </p>
      <ul style={listStyles}>
        {similarSongs.slice(0, 5).map(({ song, similarity }) => (
          <li key={song.id} style={{ color: '#92400e', fontSize: '14px' }}>
            <strong>{song.title}</strong>
            {song.artist && ` by ${song.artist}`}
            {similarity === 'exact' && ' (Exact match)'}
            {similarity === 'very-similar' && ' (Very similar)'}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onContinue} style={buttonStyles}>
        Continue Anyway
      </button>
    </div>
  )
}
```

### Phase 5: Comprehensive Tests

```typescript
// src/features/songs/components/forms/SongForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SongForm } from './SongForm'

describe('SongForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  
  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnCancel.mockClear()
  })
  
  it('renders all form sections', () => {
    render(
      <SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    )
    
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    expect(screen.getByText('Categorization')).toBeInTheDocument()
    expect(screen.getByText('Additional Information')).toBeInTheDocument()
  })
  
  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    render(
      <SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    )
    
    // Try to submit without required fields
    await user.click(screen.getByRole('button', { name: /create song/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
      expect(screen.getByText(/at least one theme is required/i)).toBeInTheDocument()
    })
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })
  
  it('submits valid form data', async () => {
    const user = userEvent.setup()
    
    render(
      <SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    )
    
    // Fill required fields
    await user.type(screen.getByLabelText(/title/i), 'Amazing Grace')
    await user.type(screen.getByLabelText(/artist/i), 'John Newton')
    
    // Add theme
    const themeInput = screen.getByPlaceholderText(/type to search themes/i)
    await user.type(themeInput, 'grace')
    await user.click(screen.getByText('grace'))
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /create song/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Amazing Grace',
          artist: 'John Newton',
          themes: ['grace']
        })
      )
    })
  })
  
  it('shows duplicate warnings', async () => {
    const user = userEvent.setup()
    
    // Mock duplicate detection hook
    vi.mock('@features/songs/validation/hooks/useDuplicateDetection', () => ({
      useDuplicateDetection: () => ({
        similarSongs: [
          { song: { id: '1', title: 'Amazing Grace' }, similarity: 'exact', distance: 0 }
        ],
        checkForDuplicates: vi.fn(),
        clearSimilarSongs: vi.fn()
      })
    }))
    
    render(
      <SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    )
    
    await user.type(screen.getByLabelText(/title/i), 'Amazing Grace')
    
    await waitFor(() => {
      expect(screen.getByText(/similar songs found/i)).toBeInTheDocument()
    })
  })
})
```

## Validation Gates

### Level 1: Type Checking & Linting
```bash
npm run lint
npm run type-check
```

### Level 2: Component Tests
```bash
npm run test -- src/features/songs/components/forms/
```

### Level 3: Integration Tests
```bash
npm run test -- --coverage src/features/songs/
```

### Level 4: Manual Testing
- [ ] Form renders correctly
- [ ] All fields validate properly
- [ ] Theme autocomplete works
- [ ] Duplicate detection triggers
- [ ] Form submits successfully
- [ ] Cancel button works
- [ ] Character counters update
- [ ] Admin-only fields show conditionally

## File Creation Order

1. `src/features/songs/components/forms/fields/ThemeCombobox.tsx`
2. `src/features/songs/components/forms/fields/SourceSelect.tsx`
3. `src/features/songs/components/forms/sections/BasicInfoSection.tsx`
4. `src/features/songs/components/forms/sections/CategorizationSection.tsx`
5. `src/features/songs/components/forms/sections/NotesSection.tsx`
6. `src/features/songs/components/forms/DuplicateWarning.tsx`
7. `src/features/songs/components/forms/SongForm.tsx`
8. `src/features/songs/components/forms/SongFormModal.tsx`
9. Test files for all components

## Success Metrics

- ✅ All form fields render correctly
- ✅ Validation works on all fields
- ✅ Theme autocomplete functional
- ✅ Duplicate detection accurate
- ✅ Form submits valid data
- ✅ Character counters work
- ✅ Accessibility compliant
- ✅ Mobile responsive
- ✅ < 2s form load time

## Common Pitfalls to Avoid

1. **Uncontrolled components** - Keep all form state controlled
2. **Validation timing** - Validate on blur, not every keystroke
3. **Theme normalization** - Always normalize before comparison
4. **Async validation** - Debounce duplicate checks
5. **Form reset** - Clear form after successful submission
6. **Error persistence** - Clear errors when field changes
7. **Loading states** - Disable form during submission

## External Resources

- [React Hook Form Alternative Patterns](https://react-hook-form.com/)
- [Accessible Autocomplete](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [Form Design Best Practices](https://www.nngroup.com/articles/web-form-design/)

## Conclusion

This implementation provides a comprehensive, accessible song form that leverages the existing form component library while adding song-specific functionality like theme autocomplete and duplicate detection.

**Confidence Score: 9.5/10** - Very high confidence due to existing infrastructure and clear patterns.