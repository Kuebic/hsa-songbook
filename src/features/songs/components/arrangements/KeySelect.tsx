import React from 'react'

const MUSICAL_KEYS = [
  // Major keys
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  // Minor keys
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm'
]

interface KeySelectProps {
  value?: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  disabled?: boolean
}

export function KeySelect({ 
  value, 
  onChange, 
  error, 
  required = false,
  disabled = false
}: KeySelectProps) {
  const fieldStyles: React.CSSProperties = {
    marginBottom: '16px'
  }

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  }

  const selectStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid',
    borderColor: error ? '#ef4444' : '#e2e8f0',
    borderRadius: '6px',
    backgroundColor: disabled ? '#f9fafb' : '#ffffff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'border-color 0.15s ease-in-out'
  }
  
  const optionGroupStyles: React.CSSProperties = {
    fontWeight: '600',
    color: '#374151'
  }

  const helperStyles: React.CSSProperties = {
    marginTop: '4px',
    fontSize: '12px',
    color: '#6b7280'
  }

  const errorStyles: React.CSSProperties = {
    marginTop: '4px',
    fontSize: '12px',
    color: '#ef4444'
  }

  const majorKeys = MUSICAL_KEYS.filter(key => !key.endsWith('m'))
  const minorKeys = MUSICAL_KEYS.filter(key => key.endsWith('m'))

  return (
    <div style={fieldStyles}>
      <label htmlFor="key-select" style={labelStyles}>
        Key
        {required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      
      <select
        id="key-select"
        name="key"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={selectStyles}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? 'key-select-error' : undefined}
      >
        <option value="">Select a key...</option>
        
        <optgroup label="Major Keys" style={optionGroupStyles}>
          {majorKeys.map(key => (
            <option key={key} value={key}>
              {key} major
            </option>
          ))}
        </optgroup>
        
        <optgroup label="Minor Keys" style={optionGroupStyles}>
          {minorKeys.map(key => (
            <option key={key} value={key}>
              {key} minor
            </option>
          ))}
        </optgroup>
      </select>

      <div style={helperStyles}>
        The musical key of the arrangement. Will be auto-detected from ChordPro content.
      </div>
      
      {error && (
        <div id="key-select-error" style={errorStyles} role="alert">
          {error}
        </div>
      )}
    </div>
  )
}