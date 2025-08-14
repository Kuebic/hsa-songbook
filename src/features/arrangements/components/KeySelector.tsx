import React from 'react'

interface KeyOption {
  value: string
  label: string
}

interface KeySelectorProps {
  currentKey?: string
  onKeySelect: (key: string) => void
  className?: string
  disabled?: boolean
}

const COMMON_KEYS: KeyOption[] = [
  { value: 'C', label: 'C Major' },
  { value: 'G', label: 'G Major' },
  { value: 'D', label: 'D Major' },
  { value: 'A', label: 'A Major' },
  { value: 'E', label: 'E Major' },
  { value: 'B', label: 'B Major' },
  { value: 'F', label: 'F Major' },
  { value: 'Bb', label: 'B♭ Major' },
  { value: 'Eb', label: 'E♭ Major' },
  { value: 'Ab', label: 'A♭ Major' },
  { value: 'Db', label: 'D♭ Major' },
  { value: 'Gb', label: 'G♭ Major' },
]

const MINOR_KEYS: KeyOption[] = [
  { value: 'Am', label: 'A Minor' },
  { value: 'Em', label: 'E Minor' },
  { value: 'Bm', label: 'B Minor' },
  { value: 'F#m', label: 'F# Minor' },
  { value: 'C#m', label: 'C# Minor' },
  { value: 'G#m', label: 'G# Minor' },
  { value: 'Dm', label: 'D Minor' },
  { value: 'Gm', label: 'G Minor' },
  { value: 'Cm', label: 'C Minor' },
  { value: 'Fm', label: 'F Minor' },
  { value: 'Bbm', label: 'B♭ Minor' },
  { value: 'Ebm', label: 'E♭ Minor' },
]

// Generate all chromatic keys
const ALL_MAJOR_KEYS: KeyOption[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
].map(key => ({
  value: key,
  label: `${key} Major`
}))

const ALL_MINOR_KEYS: KeyOption[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
].map(key => ({
  value: `${key}m`,
  label: `${key} Minor`
}))

export function KeySelector({ 
  currentKey,
  onKeySelect,
  className = '',
  disabled = false
}: KeySelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newKey = e.target.value
    if (newKey && newKey !== currentKey) {
      onKeySelect(newKey)
    }
  }
  
  return (
    <div className={`key-selector-container ${className}`}>
      <label htmlFor="key-selector" className="key-selector-label">
        Key:
      </label>
      <select 
        id="key-selector"
        value={currentKey || ''}
        onChange={handleChange}
        className="key-selector"
        disabled={disabled}
        aria-label="Select musical key"
      >
        <option value="">Select a key...</option>
        
        <optgroup label="Common Keys">
          {COMMON_KEYS.map(key => (
            <option key={key.value} value={key.value}>
              {key.label}
            </option>
          ))}
        </optgroup>
        
        <optgroup label="Minor Keys">
          {MINOR_KEYS.map(key => (
            <option key={key.value} value={key.value}>
              {key.label}
            </option>
          ))}
        </optgroup>
        
        <optgroup label="All Major Keys">
          {ALL_MAJOR_KEYS.map(key => (
            <option key={`major-${key.value}`} value={key.value}>
              {key.label}
            </option>
          ))}
        </optgroup>
        
        <optgroup label="All Minor Keys">
          {ALL_MINOR_KEYS.map(key => (
            <option key={`minor-${key.value}`} value={key.value}>
              {key.label}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  )
}