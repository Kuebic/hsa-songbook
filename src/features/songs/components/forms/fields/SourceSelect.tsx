import { SONG_SOURCES, SOURCE_METADATA } from '../../../validation/constants/sources'

interface SourceSelectProps {
  value?: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  disabled?: boolean
}

export function SourceSelect({ 
  value, 
  onChange, 
  error, 
  required = false,
  disabled = false
}: SourceSelectProps) {
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
  
  // Group sources by category
  const sourcesByCategory = SONG_SOURCES.reduce((acc, source) => {
    const category = SOURCE_METADATA[source].category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(source)
    return acc
  }, {} as Record<string, typeof SONG_SOURCES[number][]>)
  
  return (
    <div style={fieldStyles}>
      <label htmlFor="source" style={labelStyles}>
        Source
        {required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      
      <select
        id="source"
        name="source"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={selectStyles}
        aria-invalid={!!error}
        aria-describedby={error ? 'source-error' : undefined}
      >
        <option value="">Select a source...</option>
        
        {Object.entries(sourcesByCategory).map(([category, sources]) => (
          <optgroup key={category} label={category} style={optionGroupStyles}>
            {sources.map(source => (
              <option key={source} value={source}>
                {SOURCE_METADATA[source].label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      
      {!error && (
        <div style={helperStyles}>
          Select the source or origin of this song
        </div>
      )}
      
      {error && (
        <div id="source-error" style={errorStyles} role="alert">
          {error}
        </div>
      )}
    </div>
  )
}