import { useState } from 'react'
import {
  FormSection,
  FormInput,
  FormSelect,
  FormTextarea,
  FormRow,
  FormCheckbox
} from '@shared/components/form'
import { 
  MUSICAL_KEYS, 
  TIME_SIGNATURES, 
  // DIFFICULTY_LEVELS, // Temporarily commented out
  MAJOR_KEYS,
  MINOR_KEYS,
  getTempoLabel
} from '@features/songs/validation/constants/musicalKeys'
import { chordProValidation } from '@features/songs/validation/schemas/arrangementSchema'
import type { ArrangementFormData } from '@features/songs/validation/schemas/arrangementSchema'

interface ArrangementFormProps {
  data: Partial<ArrangementFormData>
  onChange: (field: keyof ArrangementFormData, value: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  errors?: Record<string, string>
  showInSongForm?: boolean
  isRequired?: boolean
  songTitle?: string
}

export function ArrangementForm({
  data,
  onChange,
  errors = {},
  showInSongForm = false,
  isRequired = false,
  songTitle
}: ArrangementFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [autoDetectedKey, setAutoDetectedKey] = useState<string | null>(null)
  
  const sectionTitle = showInSongForm 
    ? 'Add Arrangement (Optional)' 
    : 'Arrangement Details'
  
  const handleChordDataChange = (value: string) => {
    onChange('chordData', value)
    
    // Auto-detect key from ChordPro data
    const extractedKey = chordProValidation.extractKey(value)
    if (extractedKey && MUSICAL_KEYS.includes(extractedKey as string)) {
      setAutoDetectedKey(extractedKey)
      if (!data.key) {
        onChange('key', extractedKey)
      }
    }
    
    // Auto-detect title if not in song form
    if (!showInSongForm && !data.name) {
      const extractedTitle = chordProValidation.extractTitle(value)
      if (extractedTitle) {
        onChange('name', extractedTitle)
      }
    }
  }
  
  const getChordProExample = () => {
    const title = songTitle || data.name || 'Song Title'
    return `{title: ${title}}
{artist: Artist Name}
{key: G}
{tempo: 120}

[Intro]
[G] [D] [Em] [C]

[Verse 1]
[G]Amazing [D]grace how [Em]sweet the [C]sound
That [G]saved a [D]wretch like [G]me
I [G]once was [D]lost but [Em]now I'm [C]found
Was [G]blind but [D]now I [G]see

[Chorus]
[C]How sweet the [G]sound
That [Em]saved a [C]wretch like [G]me`
  }
  
  const formatValidationIcon = () => {
    if (!data.chordData) return null
    
    const isValid = chordProValidation.isValid(data.chordData)
    return (
      <span style={{
        marginLeft: '8px',
        fontSize: '16px',
        color: isValid ? '#22c55e' : '#ef4444'
      }}>
        {isValid ? '✓' : '⚠'}
      </span>
    )
  }
  
  return (
    <FormSection title={sectionTitle}>
      <FormInput
        label="Arrangement Name"
        value={data.name || ''}
        onChange={e => onChange('name', e.target.value)}
        error={errors.name}
        required={isRequired}
        placeholder={
          showInSongForm 
            ? `e.g., Key of G, Acoustic Version, Simple Chords...`
            : "e.g., Acoustic Version, Key of G..."
        }
        helperText={
          showInSongForm 
            ? "Give this arrangement a descriptive name"
            : "A descriptive name for this arrangement"
        }
      />
      
      <FormTextarea
        label={`Chord Data (ChordPro Format)${formatValidationIcon()}`}
        value={data.chordData || ''}
        onChange={e => handleChordDataChange(e.target.value)}
        error={errors.chordData}
        required={isRequired}
        rows={12}
        fontFamily="monospace"
        placeholder={getChordProExample()}
        helperText={
          <div>
            <div>Enter chords in ChordPro format. Place chords in brackets before the syllable.</div>
            {autoDetectedKey && (
              <div style={{ marginTop: '4px', color: '#22c55e', fontSize: '12px' }}>
                ✓ Auto-detected key: {autoDetectedKey}
              </div>
            )}
            {data.chordData && !chordProValidation.isValid(data.chordData) && (
              <div style={{ marginTop: '4px', color: '#ef4444', fontSize: '12px' }}>
                ⚠ ChordPro format not detected. Add chord brackets [C] or directives {'{key: G}'}
              </div>
            )}
          </div>
        }
        style={{
          lineHeight: '1.4',
          fontSize: '13px'
        }}
      />
      
      <FormRow>
        <FormSelect
          label="Musical Key"
          value={data.key || ''}
          onChange={e => onChange('key', e.target.value)}
          error={errors.key}
          helperText={autoDetectedKey ? `Auto-detected: ${autoDetectedKey}` : undefined}
        >
          <option value="">Select key...</option>
          <optgroup label="Major Keys">
            {MAJOR_KEYS.map(key => (
              <option key={key} value={key}>{key} Major</option>
            ))}
          </optgroup>
          <optgroup label="Minor Keys">
            {MINOR_KEYS.map(key => (
              <option key={key} value={key}>{key.replace('m', '')} Minor</option>
            ))}
          </optgroup>
        </FormSelect>
        
        <FormSelect
          label="Difficulty"
          value={data.difficulty || ''}
          onChange={e => onChange('difficulty', e.target.value)}
          error={errors.difficulty}
        >
          <option value="">Select difficulty...</option>
          <option value="beginner">Beginner - Simple chords, easy strumming</option>
          <option value="intermediate">Intermediate - Bar chords, moderate complexity</option>
          <option value="advanced">Advanced - Complex chords, advanced techniques</option>
        </FormSelect>
      </FormRow>
      
      {/* Advanced options toggle */}
      <div style={{ marginTop: '16px' }}>
        <FormCheckbox
          label="Show advanced options"
          checked={showAdvanced}
          onChange={e => setShowAdvanced(e.target.checked)}
          helperText="Tempo, time signature, capo, and more"
        />
      </div>
      
      {showAdvanced && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            marginBottom: '16px',
            color: '#374151'
          }}>
            Advanced Settings
          </h4>
          
          <FormRow>
            <FormInput
              label="Tempo (BPM)"
              type="number"
              value={data.tempo?.toString() || ''}
              onChange={e => onChange('tempo', e.target.value ? Number(e.target.value) : undefined)}
              error={errors.tempo}
              min={40}
              max={300}
              placeholder="e.g., 120"
              helperText={data.tempo ? getTempoLabel(data.tempo) : 'Beats per minute (40-300)'}
            />
            
            <FormSelect
              label="Time Signature"
              value={data.timeSignature || ''}
              onChange={e => onChange('timeSignature', e.target.value)}
              error={errors.timeSignature}
            >
              <option value="">Select time signature...</option>
              {TIME_SIGNATURES.map(sig => (
                <option key={sig} value={sig}>{sig}</option>
              ))}
            </FormSelect>
          </FormRow>
          
          <FormRow>
            <FormInput
              label="Capo Position"
              type="number"
              value={data.capo?.toString() || ''}
              onChange={e => onChange('capo', e.target.value ? Number(e.target.value) : undefined)}
              error={errors.capo}
              min={0}
              max={12}
              placeholder="0"
              helperText="Fret number for capo placement (0 = no capo)"
            />
            
            <FormInput
              label="Duration (minutes)"
              type="number"
              value={data.duration ? (data.duration / 60).toFixed(1) : ''}
              onChange={e => {
                const minutes = e.target.value ? Number(e.target.value) : undefined
                onChange('duration', minutes ? Math.round(minutes * 60) : undefined)
              }}
              error={errors.duration}
              min={0.1}
              max={60}
              step={0.1}
              placeholder="e.g., 3.5"
              helperText="Approximate song duration"
            />
          </FormRow>
          
          <FormInput
            label="Tags"
            value={data.tags?.join(', ') || ''}
            onChange={e => {
              const tags = e.target.value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
              onChange('tags', tags)
            }}
            error={errors.tags}
            placeholder="acoustic, simple, youth-friendly, fingerpicking"
            helperText="Comma-separated tags to describe this arrangement"
          />
          
          <FormTextarea
            label="Additional Notes"
            value={data.notes || ''}
            onChange={e => onChange('notes', e.target.value)}
            error={errors.notes}
            rows={3}
            maxLength={1000}
            showCharacterCount
            placeholder="Any additional notes about this arrangement, performance tips, or variations..."
            helperText="Optional notes for performers"
          />
        </div>
      )}
      
      {/* ChordPro help */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#eff6ff',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#1e40af'
      }}>
        <strong>ChordPro Quick Reference:</strong>
        <ul style={{ marginTop: '8px', marginLeft: '16px', lineHeight: '1.4' }}>
          <li><code>[Am]</code> - Place chord above lyrics</li>
          <li><code>{'{title: Song Name}'}</code> - Song metadata</li>
          <li><code>{'{key: G}'}</code> - Musical key</li>
          <li><code>[Verse], [Chorus], [Bridge]</code> - Song sections</li>
        </ul>
      </div>
    </FormSection>
  )
}