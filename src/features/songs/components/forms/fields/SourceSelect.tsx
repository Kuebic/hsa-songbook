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
    color: 'var(--text-primary)'
  }

  const selectStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid',
    borderColor: error ? 'var(--color-destructive)' : 'var(--color-border)',
    borderRadius: '6px',
    backgroundColor: disabled ? 'var(--color-muted)' : 'var(--color-card)',
    color: 'var(--text-primary)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'border-color 0.15s ease-in-out'
  }
  
  const optionGroupStyles: React.CSSProperties = {
    fontWeight: '600',
    color: 'var(--text-primary)'
  }

  const helperStyles: React.CSSProperties = {
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--text-secondary)'
  }

  const errorStyles: React.CSSProperties = {
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--color-destructive)'
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
        {required && <span style={{ color: 'var(--color-destructive)' }}> *</span>}
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