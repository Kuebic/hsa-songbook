import { useState } from 'react'
import { sanitizeInput } from '@shared/validation'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search songs, artists, themes...', 
  onClear 
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (inputValue: string) => {
    // Sanitize input to prevent XSS
    const sanitized = sanitizeInput(inputValue)
    
    // Validate length
    if (sanitized.length > 100) {
      setError('Search query is too long')
      return
    }
    
    setError(null)
    onChange(sanitized)
  }

  return (
    <div>
      <div 
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px'
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '0.75rem 2.5rem 0.75rem 2.5rem',
            fontSize: '1rem',
            border: `2px solid ${error ? 'var(--status-error)' : isFocused ? 'var(--status-info)' : 'var(--color-border)'}`,
            borderRadius: '8px',
            outline: 'none',
            transition: 'border-color 0.2s',
            backgroundColor: 'var(--color-input)'
          }}
        />
      
      <span 
        style={{
          position: 'absolute',
          left: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-tertiary)',
          pointerEvents: 'none'
        }}
      >
        🔍
      </span>
      
      {value && (
        <button
          onClick={onClear}
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            padding: '0.25rem',
            fontSize: '1.25rem',
            lineHeight: 1
          }}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
      </div>
      {error && (
        <p style={{ 
          color: 'var(--status-error)', 
          fontSize: '0.875rem', 
          marginTop: '0.25rem',
          maxWidth: '600px'
        }}>
          {error}
        </p>
      )}
    </div>
  )
}