import { useState, useCallback, useMemo } from 'react'
import { getSuggestedThemes, normalizeTheme } from '../../../validation/utils/themeNormalization'
import { NORMALIZED_THEMES } from '../../../validation/constants/themes'

interface ThemeComboboxProps {
  value?: string[]
  onChange: (themes: string[]) => void
  error?: string
  maxThemes?: number
  required?: boolean
  disabled?: boolean
}

export function ThemeCombobox({ 
  value = [], 
  onChange, 
  error, 
  maxThemes = 10,
  required = false,
  disabled = false
}: ThemeComboboxProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  
  // Get all available themes
  const allThemes = useMemo(() => {
    return Object.keys(NORMALIZED_THEMES)
  }, [])
  
  // Get suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue) {
      return allThemes.slice(0, 10)
    }
    return getSuggestedThemes(inputValue, 10)
  }, [inputValue, allThemes])
  
  // Add a theme to the list
  const handleAddTheme = useCallback((theme: string) => {
    if (value.length >= maxThemes) return
    
    const normalizedTheme = normalizeTheme(theme)
    if (!value.includes(normalizedTheme)) {
      onChange([...value, normalizedTheme])
    }
    setInputValue('')
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }, [value, onChange, maxThemes])
  
  // Remove a theme from the list
  const handleRemoveTheme = useCallback((theme: string) => {
    onChange(value.filter(t => t !== theme))
  }, [value, onChange])
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleAddTheme(suggestions[highlightedIndex])
      } else if (inputValue) {
        handleAddTheme(inputValue)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    }
  }, [highlightedIndex, suggestions, inputValue, handleAddTheme])
  
  // Styles
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

  const tagsContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '8px'
  }
  
  const tagStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    backgroundColor: 'var(--color-accent)',
    borderRadius: '4px',
    fontSize: '14px',
    color: 'var(--color-accent-foreground)'
  }
  
  const removeButtonStyles: React.CSSProperties = {
    marginLeft: '4px',
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: '1',
    padding: '0 2px'
  }
  
  const containerStyles: React.CSSProperties = {
    position: 'relative'
  }
  
  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid',
    borderRadius: '6px',
    backgroundColor: disabled ? 'var(--color-muted)' : 'var(--color-card)',
    color: 'var(--text-primary)',
    transition: 'border-color 0.15s ease-in-out',
    outline: 'none'
  }
  
  const suggestionsStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    backgroundColor: 'var(--color-popover)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10
  }
  
  const suggestionStyles = (isHighlighted: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    cursor: 'pointer',
    backgroundColor: isHighlighted ? 'var(--color-accent)' : 'transparent',
    fontSize: '14px'
  })

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
  
  return (
    <div style={fieldStyles}>
      <label htmlFor="themes" style={labelStyles}>
        Themes
        {required && <span style={{ color: 'var(--color-destructive)' }}> *</span>}
      </label>
      
      {value.length > 0 && (
        <div 
          style={tagsContainerStyles}
          role="region"
          aria-label="Selected themes"
          aria-live="polite"
        >
          {value.map(theme => (
            <span key={theme} style={tagStyles}>
              {theme}
              <button
                type="button"
                onClick={() => handleRemoveTheme(theme)}
                style={removeButtonStyles}
                aria-label={`Remove ${theme}`}
                disabled={disabled}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      <div style={containerStyles}>
        <input
          id="themes"
          type="text"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
            setHighlightedIndex(-1)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Type to search themes...' : 'Add more themes...'}
          style={{
            ...inputStyles,
            borderColor: error ? 'var(--color-destructive)' : 'var(--color-border)'
          }}
          aria-label="Theme search"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          disabled={disabled || value.length >= maxThemes}
        />
        
        {showSuggestions && suggestions.length > 0 && !disabled && (
          <div style={suggestionsStyles} role="listbox">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                style={suggestionStyles(index === highlightedIndex)}
                onClick={() => handleAddTheme(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {!error && (
        <div style={helperStyles}>
          {value.length}/{maxThemes} themes selected. Start typing to search or add custom themes.
        </div>
      )}
      
      {error && (
        <div id="themes-error" style={errorStyles} role="alert">
          {error}
        </div>
      )}
    </div>
  )
}