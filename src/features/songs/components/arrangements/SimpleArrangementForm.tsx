import { useState, useEffect, useRef } from 'react'
import { SimpleSection, SimpleInput, SimpleTextarea } from '../forms/utils/SimpleFormInputs'
import { KeySelector } from '../forms/KeySelector'
import { DIFFICULTY_LEVELS } from '../../validation/constants/musicalKeys'
import { splitArrangementName, combineArrangementName } from '../../utils/arrangementNaming'
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
  // Split the initial name if provided
  const initialSplit = initialData?.name 
    ? splitArrangementName(initialData.name, songTitle)
    : { songTitle: songTitle || '', arrangementSuffix: 'Standard' }
  
  const [arrangementSuffix, setArrangementSuffix] = useState(initialSplit.arrangementSuffix)
  
  const [data, setData] = useState<Partial<ArrangementFormData>>(() => {
    return {
      name: initialData?.name || combineArrangementName(songTitle || '', initialSplit.arrangementSuffix),
      key: initialData?.key || 'C', // Default to C major
      tempo: initialData?.tempo || 120,
      capo: initialData?.capo,
      timeSignature: initialData?.timeSignature || '4/4',
      difficulty: initialData?.difficulty || 'intermediate',
      chordProText: '', // Start with empty ChordPro - will be added in editor
      notes: initialData?.notes || (initialData as Record<string, unknown>)?.description as string || ''
    }
  })

  const handleChange = (field: keyof ArrangementFormData, value: string | number | undefined) => {
    const newData = { ...data, [field]: value }
    setData(newData)
    onChange(newData)
  }
  
  const handleArrangementSuffixChange = (suffix: string) => {
    setArrangementSuffix(suffix)
    const fullName = combineArrangementName(songTitle || '', suffix)
    handleChange('name', fullName)
  }
  
  const hasInitialized = useRef(false)
  
  // Call onChange with initial data when component mounts
  useEffect(() => {
    if (!hasInitialized.current) {
      onChange(data)
      hasInitialized.current = true
    }
  }, [onChange, data])


  return (
    <SimpleSection title="Arrangement Details">
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="arrangement-name" style={{
          display: 'block',
          marginBottom: '4px',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text-primary)'
        }}>
          Arrangement Name <span style={{ color: 'var(--color-destructive)' }}>*</span>
        </label>
        {songTitle ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '8px 12px',
              backgroundColor: 'var(--color-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px 0 0 6px',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap'
            }}>
              {songTitle} -
            </div>
            <input
              id="arrangement-name"
              name="arrangement-name"
              type="text"
              value={arrangementSuffix}
              onChange={(e) => handleArrangementSuffixChange(e.target.value)}
              placeholder="e.g., Standard, Acoustic, Simplified"
              disabled={disabled}
              required
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid var(--color-border)',
                borderLeft: 'none',
                borderRadius: '0 6px 6px 0',
                backgroundColor: disabled ? 'var(--color-muted)' : 'var(--color-card)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>
        ) : (
          <input
            id="arrangement-name"
            name="arrangement-name"
            type="text"
            value={data.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Standard, Acoustic, Piano, Simplified"
            disabled={disabled}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              backgroundColor: disabled ? 'var(--color-muted)' : 'var(--color-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        )}
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          {songTitle 
            ? "Enter a descriptive name for this arrangement variant"
            : "Enter the full arrangement name"}
        </div>
      </div>

      <KeySelector
        value={data.key || ''}
        onChange={(value) => handleChange('key', value)}
        disabled={disabled}
        required
      />

      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontSize: '14px', 
          fontWeight: '500', 
          color: 'var(--text-primary)' 
        }}>
          Difficulty Level <span style={{ color: 'var(--color-destructive)' }}>*</span>
        </label>
        <select
          name="arrangement-difficulty"
          value={data.difficulty || 'intermediate'}
          onChange={(e) => handleChange('difficulty', e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            backgroundColor: disabled ? 'var(--color-muted)' : 'var(--color-card)',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
          required
        >
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