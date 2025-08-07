import { useState } from 'react'

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

  return (
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
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.75rem 2.5rem 0.75rem 2.5rem',
          fontSize: '1rem',
          border: `2px solid ${isFocused ? '#3b82f6' : '#e2e8f0'}`,
          borderRadius: '8px',
          outline: 'none',
          transition: 'border-color 0.2s',
          backgroundColor: 'var(--input-bg, white)'
        }}
      />
      
      <span 
        style={{
          position: 'absolute',
          left: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#94a3b8',
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
            color: '#94a3b8',
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
  )
}