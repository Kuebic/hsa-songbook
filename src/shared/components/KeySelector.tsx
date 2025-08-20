import { useState } from 'react'

interface KeySelectorProps {
  value?: string
  currentKey?: string  // Support old prop name
  onChange?: (key: string) => void
  onKeySelect?: (key: string) => void  // Support old prop name
  error?: string
  disabled?: boolean
  label?: string
  required?: boolean
  className?: string  // Support className for styling
}

// Organized as requested: major | minor layout
const KEY_LAYOUT = [
  ['Ab', 'A', 'A#'],
  ['Bb', 'B', ''],
  ['', 'C', 'C#'],
  ['Db', 'D', 'D#'],
  ['Eb', 'E', ''],
  ['', 'F', 'F#'],
  ['Gb', 'G', 'G#']
]

export function KeySelector({
  value = '',
  currentKey,  // Support old prop name
  onChange,
  onKeySelect,  // Support old prop name
  error,
  disabled = false,
  label = 'Musical Key',
  required = false,
  className
}: KeySelectorProps) {
  // Support both prop names for backward compatibility
  const actualValue = value || currentKey || ''
  const handleChange = onChange || onKeySelect || (() => {})
  const [keyType, setKeyType] = useState<'major' | 'minor'>(() => {
    return actualValue?.endsWith('m') ? 'minor' : 'major'
  })

  const handleKeyTypeChange = (newType: 'major' | 'minor') => {
    setKeyType(newType)
    
    // If there's a current selection, convert it
    if (actualValue) {
      const baseKey = actualValue.replace('m', '')
      const newValue = newType === 'minor' ? `${baseKey}m` : baseKey
      handleChange(newValue)
    }
  }

  const handleKeyClick = (key: string) => {
    if (!key || disabled) return
    
    const finalKey = keyType === 'minor' ? `${key}m` : key
    handleChange(finalKey)
  }

  const isKeySelected = (key: string) => {
    if (!key) return false
    const expectedKey = keyType === 'minor' ? `${key}m` : key
    return actualValue === expectedKey
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '500',
        color: 'var(--text-primary)'
      }}>
        {label} {required && <span style={{ color: 'var(--color-destructive)' }}>*</span>}
      </label>

      {/* Major/Minor Toggle */}
      <div style={{
        display: 'flex',
        marginBottom: '12px',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        overflow: 'hidden',
        width: 'fit-content'
      }}>
        <button
          type="button"
          onClick={() => handleKeyTypeChange('major')}
          disabled={disabled}
          style={{
            padding: '6px 16px',
            fontSize: '13px',
            border: 'none',
            backgroundColor: keyType === 'major' ? 'var(--color-primary)' : 'var(--color-card)',
            color: keyType === 'major' ? 'var(--color-primary-foreground)' : 'var(--text-primary)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Major
        </button>
        <button
          type="button"
          onClick={() => handleKeyTypeChange('minor')}
          disabled={disabled}
          style={{
            padding: '6px 16px',
            fontSize: '13px',
            border: 'none',
            backgroundColor: keyType === 'minor' ? 'var(--color-primary)' : 'var(--color-card)',
            color: keyType === 'minor' ? 'var(--color-primary-foreground)' : 'var(--text-primary)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Minor
        </button>
      </div>

      {/* Key Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px',
        maxWidth: '180px',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '8px'
      }}>
        {KEY_LAYOUT.map((row, rowIndex) => 
          row.map((key, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              type="button"
              onClick={() => handleKeyClick(key)}
              disabled={disabled || !key}
              style={{
                padding: '8px 4px',
                fontSize: '13px',
                fontWeight: '500',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                backgroundColor: isKeySelected(key) 
                  ? 'var(--color-primary)' 
                  : key 
                    ? 'var(--color-card)' 
                    : 'transparent',
                color: isKeySelected(key) 
                  ? 'var(--color-primary-foreground)' 
                  : 'var(--text-primary)',
                cursor: key && !disabled ? 'pointer' : 'default',
                opacity: key ? 1 : 0,
                transition: 'all 0.2s',
                minHeight: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (key && !disabled && !isKeySelected(key)) {
                  e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                }
              }}
              onMouseLeave={(e) => {
                if (key && !disabled && !isKeySelected(key)) {
                  e.currentTarget.style.backgroundColor = 'var(--color-card)'
                }
              }}
            >
              {key && (
                <>
                  {key}
                  {keyType === 'minor' && <span style={{ fontSize: '10px', marginLeft: '1px' }}>m</span>}
                </>
              )}
            </button>
          ))
        )}
      </div>

      {/* Current Selection Display */}
      {value && (
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          Selected: <strong style={{ color: 'var(--color-primary)' }}>{value}</strong>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: 'var(--color-destructive)'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}