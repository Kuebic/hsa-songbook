import { useState, useEffect } from 'react'
import { SimpleSection, SimpleInput, SimpleTextarea } from '../forms/utils/SimpleFormInputs'
import { SimpleChordEditor } from './SimpleChordEditor'
import { DIFFICULTY_LEVELS } from '../../validation/constants/musicalKeys'
import type { ArrangementFormData } from '../../validation/schemas/arrangementSchema'

interface SimpleArrangementFormProps {
  initialData?: Partial<ArrangementFormData>
  onChange: (data: Partial<ArrangementFormData>) => void
  disabled?: boolean
  compact?: boolean
  songTitle?: string // Add song title for auto-generation
}

export function SimpleArrangementForm({
  initialData,
  onChange,
  disabled = false,
  compact = false,
  songTitle
}: SimpleArrangementFormProps) {
  const [data, setData] = useState<Partial<ArrangementFormData>>(() => {
    // Generate default ChordPro template if no initial data
    const existingChordData = initialData?.chordProText || (initialData as Record<string, unknown>)?.chordData as string
    const defaultChordData = existingChordData || (songTitle ? 
      `{title: ${songTitle}}
{key: C}
{tempo: 120}

[Verse]
[C]Add your lyrics here with [F]chords above
[G]Each line shows the [C]progression

[Chorus]
[Am]This is where the [F]chorus goes
[C]With the main [G]melody [C]flows` : '')

    return {
      name: initialData?.name || (songTitle ? `${songTitle} - Standard` : ''),
      key: initialData?.key || 'C', // Default to C major
      tempo: initialData?.tempo || 120,
      capo: initialData?.capo,
      timeSignature: initialData?.timeSignature || '4/4',
      difficulty: initialData?.difficulty || 'intermediate',
      chordProText: defaultChordData,
      notes: initialData?.notes || (initialData as Record<string, unknown>)?.description as string || ''
    }
  })

  const handleChange = (field: keyof ArrangementFormData, value: string | number | undefined) => {
    const newData = { ...data, [field]: value }
    setData(newData)
    onChange(newData)
  }
  
  // Call onChange with initial data when component mounts or songTitle changes
  useEffect(() => {
    onChange(data)
  }, []) // Only run once on mount

  const handleChordDataChange = (value: string) => {
    const newData = { ...data, chordProText: value }
    
    // Auto-detect key from ChordPro data
    const keyMatch = value.match(/\{key\s*:\s*([^}]+)\}/i)
    if (keyMatch && keyMatch[1]) {
      const extractedKey = keyMatch[1].trim()
      newData.key = extractedKey
    }
    
    // Auto-detect tempo
    const tempoMatch = value.match(/\{tempo\s*:\s*(\d+)\}/i)
    if (tempoMatch && tempoMatch[1]) {
      newData.tempo = parseInt(tempoMatch[1], 10)
    }
    
    // Auto-detect time signature
    const timeMatch = value.match(/\{time\s*:\s*([^}]+)\}/i)
    if (timeMatch && timeMatch[1]) {
      newData.timeSignature = timeMatch[1].trim()
    }
    
    setData(newData)
    onChange(newData)
  }

  return (
    <SimpleSection title="Arrangement Details">
      <SimpleInput
        name="arrangement-name"
        label="Arrangement Name"
        value={data.name || ''}
        onChange={(value) => handleChange('name', value)}
        placeholder="e.g., Standard, Acoustic, Piano, Simplified"
        disabled={disabled}
        required
        helperText="This will be the display name for this arrangement (auto-filled with song title)"
      />


      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontSize: '14px', 
          fontWeight: '500', 
          color: '#374151' 
        }}>
          Difficulty Level <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <select
          name="arrangement-difficulty"
          value={data.difficulty || ''}
          onChange={(e) => handleChange('difficulty', e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            backgroundColor: disabled ? '#f9fafb' : '#ffffff',
            outline: 'none'
          }}
          required
        >
          <option value="">Select difficulty...</option>
          {DIFFICULTY_LEVELS.map(level => (
            <option key={level} value={level}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {!compact && (
        <>
          <SimpleInput
            name="arrangement-tempo"
            label="Tempo (BPM)"
            type="number"
            value={data.tempo?.toString() || ''}
            onChange={(value) => handleChange('tempo', value ? parseInt(value, 10) : undefined)}
            placeholder="e.g., 120"
            min={40}
            max={200}
            disabled={disabled}
          />

          <SimpleInput
            name="arrangement-capo"
            label="Capo Fret"
            type="number"
            value={data.capo?.toString() || ''}
            onChange={(value) => handleChange('capo', value ? parseInt(value, 10) : undefined)}
            placeholder="e.g., 2"
            min={0}
            max={12}
            disabled={disabled}
          />

          <SimpleInput
            name="arrangement-time-signature"
            label="Time Signature"
            value={data.timeSignature || ''}
            onChange={(value) => handleChange('timeSignature', value)}
            placeholder="e.g., 4/4, 3/4, 6/8"
            disabled={disabled}
          />
        </>
      )}

      <SimpleChordEditor
        value={data.chordProText || ''}
        onChange={handleChordDataChange}
        disabled={disabled}
        placeholder="Enter ChordPro format content...\n\nExample:\n{title: Amazing Grace}\n{key: G}\n{tempo: 90}\n\n[Verse]\n[G]Amazing [C]grace how [D]sweet the [G]sound\nThat [G]saved a [D]wretch like [G]me\n\n* This field is required for creating arrangements"
      />

      {!compact && (
        <>
          <SimpleTextarea
            name="arrangement-notes"
            label="Performance Notes"
            value={data.notes || ''}
            onChange={(value) => handleChange('notes', value)}
            placeholder="Add performance instructions, special techniques, or other notes..."
            rows={3}
            maxLength={1000}
            showCharacterCount
            disabled={disabled}
          />

        </>
      )}
    </SimpleSection>
  )
}