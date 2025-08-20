import { useState } from 'react'
import {
  FormSection,
  FormInput,
  FormSelect,
  FormTextarea,
  FormRow,
  FormCheckbox
} from '@shared/components/form'
import { KeySelector } from '@shared/components/KeySelector'
import { 
  TIME_SIGNATURES, 
  // DIFFICULTY_LEVELS, // Temporarily commented out
  getTempoLabel
} from '@features/songs/validation/constants/musicalKeys'
import { splitArrangementName, combineArrangementName } from '../../utils/arrangementNaming'
import type { ArrangementFormData } from '@features/songs/validation/schemas/arrangementSchema'

interface ArrangementFormProps {
  data: Partial<ArrangementFormData>
  onChange: (field: keyof ArrangementFormData, value: ArrangementFormData[keyof ArrangementFormData]) => void
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
  
  // Split the arrangement name for editing
  const { arrangementSuffix } = splitArrangementName(data.name || '', songTitle)
  const [editingSuffix, setEditingSuffix] = useState(arrangementSuffix || '')
  
  const sectionTitle = showInSongForm 
    ? 'Add Arrangement (Optional)' 
    : 'Arrangement Details'
  
  const handleArrangementSuffixChange = (suffix: string) => {
    setEditingSuffix(suffix)
    const fullName = combineArrangementName(songTitle || '', suffix)
    onChange('name', fullName)
  }
  
  
  return (
    <FormSection title={sectionTitle}>
      {songTitle ? (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            Arrangement Name {isRequired && <span style={{ color: 'var(--color-destructive)' }}>*</span>}
          </label>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '0' }}>
            <div style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--color-muted)',
              border: '1px solid var(--color-border)',
              borderRight: 'none',
              borderRadius: '0.375rem 0 0 0.375rem',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center'
            }}>
              {songTitle} -
            </div>
            <input
              type="text"
              value={editingSuffix}
              onChange={(e) => handleArrangementSuffixChange(e.target.value)}
              placeholder="e.g., Standard, Acoustic, Simplified"
              required={isRequired}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                fontSize: '14px',
                border: '1px solid var(--color-border)',
                borderRadius: '0 0.375rem 0.375rem 0',
                backgroundColor: 'var(--color-card)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)'
              }}
            />
          </div>
          {errors.name && (
            <div style={{ marginTop: '0.25rem', fontSize: '12px', color: 'var(--color-destructive)' }}>
              {errors.name}
            </div>
          )}
          <div style={{ marginTop: '0.25rem', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Enter a descriptive name for this arrangement variant
          </div>
        </div>
      ) : (
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
      )}

      <KeySelector
        value={data.key || ''}
        onChange={(value) => onChange('key', value)}
        error={errors.key}
        disabled={false}
        required={isRequired}
      />
      
      <FormRow>
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