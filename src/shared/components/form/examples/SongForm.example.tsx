import React, { useState } from 'react'
import { z } from 'zod'
import {
  Form,
  FormSection,
  FormActions,
  FormRow,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormRadioGroup,
  SubmitButton,
  CancelButton,
  ResetButton,
  FormDescription,
  FormCharacterCount,
  songTitleSchema,
  songArtistSchema,
  songLyricsSchema,
  songNotesSchema,
} from '../index'

/**
 * Extended song schema for demonstration purposes
 * Shows integration with existing validation schemas
 */
const songFormSchema = z.object({
  title: songTitleSchema,
  artist: songArtistSchema,
  lyrics: songLyricsSchema,
  notes: songNotesSchema,
  key: z.string().min(1, 'Key is required'),
  tempo: z.number().min(60, 'Tempo must be at least 60 BPM').max(200, 'Tempo must be at most 200 BPM'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean(),
  allowCopying: z.boolean(),
  category: z.string().min(1, 'Category is required'),
})

type SongFormData = z.infer<typeof songFormSchema>

/**
 * Comprehensive form example demonstrating all form components
 * Integration with existing validation system and schemas
 */
export function SongFormExample() {
  const [submitted, setSubmitted] = useState<SongFormData | null>(null)
  const [lyricsLength, setLyricsLength] = useState(0)
  const [notesLength, setNotesLength] = useState(0)
  
  const handleSubmit = (data: SongFormData) => {
    console.log('Form submitted:', data)
    setSubmitted(data)
    alert('Song submitted successfully! Check console for data.')
  }
  
  const handleCancel = () => {
    console.log('Form cancelled')
    alert('Form cancelled')
  }
  
  // Sample options for dropdowns
  const keyOptions = [
    { value: 'C', label: 'C Major' },
    { value: 'D', label: 'D Major' },
    { value: 'E', label: 'E Major' },
    { value: 'F', label: 'F Major' },
    { value: 'G', label: 'G Major' },
    { value: 'A', label: 'A Major' },
    { value: 'B', label: 'B Major' },
    { value: 'Cm', label: 'C Minor' },
    { value: 'Dm', label: 'D Minor' },
    { value: 'Em', label: 'E Minor' },
  ]
  
  const categoryOptions = [
    { value: 'worship', label: 'Worship' },
    { value: 'hymn', label: 'Hymn' },
    { value: 'contemporary', label: 'Contemporary' },
    { value: 'gospel', label: 'Gospel' },
    { value: 'traditional', label: 'Traditional' },
  ]
  
  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner - Easy chords and rhythms' },
    { value: 'intermediate', label: 'Intermediate - Moderate complexity' },
    { value: 'advanced', label: 'Advanced - Complex arrangements' },
  ]
  
  const tagOptions = [
    { value: 'praise', label: 'Praise' },
    { value: 'slow', label: 'Slow/Contemplative' },
    { value: 'upbeat', label: 'Upbeat' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'scripture', label: 'Scripture-based' },
  ]
  
  // Initial form values
  const initialValues: Partial<SongFormData> = {
    tempo: 120,
    difficulty: 'intermediate',
    isPublic: true,
    allowCopying: false,
  }
  
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: '#374151' }}>
        Song Form Example - Form Component Library Demo
      </h1>
      
      <FormDescription>
        This comprehensive form demonstrates all form components from the shared form library.
        It integrates with the existing validation system and follows WCAG 2.1 AA accessibility standards.
      </FormDescription>
      
      <Form
        schema={songFormSchema}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validateOnBlur={true}
        validateOnChange={false}
      >
        {/* Basic Information Section */}
        <FormSection 
          title="Basic Information" 
          description="Enter the basic details about the song"
        >
          <FormRow>
            <FormInput
              name="title"
              label="Song Title"
              placeholder="Enter the song title"
              required
              helperText="The official title of the song"
            />
            
            <FormInput
              name="artist"
              label="Artist/Composer"
              placeholder="Enter artist or composer name"
              required
              helperText="Original artist or composer"
            />
          </FormRow>
          
          <FormRow>
            <FormSelect
              name="key"
              label="Musical Key"
              options={keyOptions}
              placeholder="Select a key"
              required
              helperText="The key signature of the song"
            />
            
            <FormInput
              name="tempo"
              type="number"
              label="Tempo (BPM)"
              placeholder="120"
              min={60}
              max={200}
              step={1}
              required
              helperText="Beats per minute (60-200)"
            />
          </FormRow>
          
          <FormSelect
            name="category"
            label="Category"
            options={categoryOptions}
            placeholder="Select a category"
            required
            helperText="Primary category for this song"
          />
        </FormSection>
        
        {/* Song Content Section */}
        <FormSection 
          title="Song Content" 
          description="Enter the lyrics and any additional notes"
        >
          <FormTextarea
            name="lyrics"
            label="Lyrics (ChordPro Format)"
            placeholder="Enter lyrics in ChordPro format..."
            required
            rows={8}
            autoResize
            helperText="Use ChordPro format: [C]Amazing [F]Grace how [G]sweet the [C]sound"
            onChange={(e) => setLyricsLength(e.target.value.length)}
          />
          <FormCharacterCount 
            current={lyricsLength} 
            max={10000} 
          />
          
          <FormTextarea
            name="notes"
            label="Performance Notes"
            placeholder="Optional performance notes, arrangement details, etc."
            rows={3}
            helperText="Additional notes for performers (optional)"
            onChange={(e) => setNotesLength(e.target.value.length)}
          />
          <FormCharacterCount 
            current={notesLength} 
            max={500} 
          />
        </FormSection>
        
        {/* Difficulty and Tags Section */}
        <FormSection 
          title="Classification" 
          description="Set the difficulty level and tags"
        >
          <FormRadioGroup
            name="difficulty"
            label="Difficulty Level"
            options={difficultyOptions}
            required
            helperText="Choose the appropriate skill level for this arrangement"
          />
          
          <FormCheckboxGroup
            name="tags"
            label="Tags"
            options={tagOptions}
            orientation="horizontal"
            helperText="Select applicable tags (optional)"
          />
        </FormSection>
        
        {/* Permissions Section */}
        <FormSection 
          title="Permissions" 
          description="Set visibility and usage permissions"
        >
          <FormCheckbox
            name="isPublic"
            label="Make this song publicly visible"
            helperText="Public songs can be viewed by all users"
          />
          
          <FormCheckbox
            name="allowCopying"
            label="Allow other users to copy this arrangement"
            helperText="Enables other users to create their own versions"
          />
        </FormSection>
        
        {/* Form Actions */}
        <FormActions align="left">
          <SubmitButton>
            Submit Song
          </SubmitButton>
          
          <CancelButton onClick={handleCancel}>
            Cancel
          </CancelButton>
          
          <ResetButton>
            Reset Form
          </ResetButton>
        </FormActions>
      </Form>
      
      {/* Submission Result Display */}
      {submitted && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #0ea5e9',
        }}>
          <h3 style={{ color: '#0c4a6e', marginBottom: '1rem' }}>
            Form Submitted Successfully!
          </h3>
          <pre style={{ 
            fontSize: '0.875rem',
            backgroundColor: '#fff',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
          }}>
            {JSON.stringify(submitted, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Usage Instructions */}
      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        backgroundColor: '#fefce8',
        borderRadius: '8px',
        border: '1px solid #facc15',
      }}>
        <h3 style={{ color: '#a16207', marginBottom: '1rem' }}>
          Form Component Features Demonstrated:
        </h3>
        <ul style={{ color: '#a16207', fontSize: '0.875rem', lineHeight: 1.6 }}>
          <li><strong>FormInput</strong>: Text inputs with validation and helper text</li>
          <li><strong>FormTextarea</strong>: Auto-resizing textarea with character counts</li>
          <li><strong>FormSelect</strong>: Accessible dropdown with keyboard navigation</li>
          <li><strong>FormRadioGroup</strong>: Radio buttons with keyboard support</li>
          <li><strong>FormCheckbox</strong>: Individual and grouped checkboxes</li>
          <li><strong>FormSection</strong>: Semantic fieldset groupings</li>
          <li><strong>FormRow</strong>: Side-by-side field layouts</li>
          <li><strong>FormActions</strong>: Button group with consistent styling</li>
          <li><strong>Validation</strong>: Integration with existing Zod schemas</li>
          <li><strong>Accessibility</strong>: WCAG 2.1 AA compliance throughout</li>
          <li><strong>Keyboard Navigation</strong>: Full keyboard support</li>
        </ul>
      </div>
    </div>
  )
}