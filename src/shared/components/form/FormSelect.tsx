import React, { useState, useRef, useEffect } from 'react'
import { FormField } from './FormField'
import { getFormStyles } from './utils/style-converter'
import { 
  getSelectAriaAttributes, 
  getListboxAriaAttributes, 
  getOptionAriaAttributes 
} from './utils/aria-helpers'
import type { FormFieldProps, SelectOption } from './types'

export interface FormSelectProps extends Omit<FormFieldProps, 'children'> {
  options: SelectOption[]
  placeholder?: string
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  loading?: boolean
  loadingText?: string
  noOptionsText?: string
  maxHeight?: string
}

/**
 * FormSelect component - Accessible select dropdown with keyboard navigation
 * Custom implementation to ensure full accessibility and consistent styling
 */
export function FormSelect({
  name,
  options,
  placeholder = 'Select an option...',
  label,
  helperText,
  required,
  disabled,
  className,
  style,
  multiple = false,
  searchable = false,
  clearable = false,
  loading = false,
  loadingText = 'Loading...',
  noOptionsText = 'No options available',
  maxHeight = '200px',
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [searchValue, setSearchValue] = useState('')
  
  const selectRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Filter options based on search
  const filteredOptions = searchable && searchValue
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchValue.toLowerCase())
      )
    : options
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchValue('')
        setFocusedIndex(-1)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])
  
  return (
    <FormField
      name={name}
      label={label}
      helperText={helperText}
      required={required}
      disabled={disabled}
      className={className}
      style={style}
    >
      <SelectElement
        ref={selectRef}
        options={filteredOptions}
        placeholder={placeholder}
        multiple={multiple}
        searchable={searchable}
        clearable={clearable}
        loading={loading}
        loadingText={loadingText}
        noOptionsText={noOptionsText}
        maxHeight={maxHeight}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        focusedIndex={focusedIndex}
        setFocusedIndex={setFocusedIndex}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        listboxRef={listboxRef}
        searchInputRef={searchInputRef}
      />
    </FormField>
  )
}

/**
 * Select element component with full keyboard navigation and accessibility
 */
interface SelectElementProps {
  options: SelectOption[]
  placeholder: string
  multiple: boolean
  searchable: boolean
  clearable: boolean
  loading: boolean
  loadingText: string
  noOptionsText: string
  maxHeight: string
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  focusedIndex: number
  setFocusedIndex: (index: number) => void
  searchValue: string
  setSearchValue: (value: string) => void
  listboxRef: React.RefObject<HTMLDivElement>
  searchInputRef: React.RefObject<HTMLInputElement>
  // Props injected by FormField
  id?: string
  name?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  hasError?: boolean
  'aria-required'?: string
  'aria-invalid'?: string
  'aria-describedby'?: string
}

const SelectElement = React.forwardRef<HTMLDivElement, SelectElementProps>(({
  options,
  placeholder,
  multiple,
  searchable,
  clearable,
  loading,
  loadingText,
  noOptionsText,
  maxHeight,
  isOpen,
  setIsOpen,
  focusedIndex,
  setFocusedIndex,
  searchValue,
  setSearchValue,
  listboxRef,
  searchInputRef,
  // FormField injected props
  id,
  name,
  value = '',
  onChange,
  disabled,
  hasError,
  ...ariaProps
}, ref) => {
  const listboxId = `${id}-listbox`
  const activeDescendant = focusedIndex >= 0 ? `${id}-option-${focusedIndex}` : undefined
  
  // Find selected option for display
  const selectedOption = options.find(option => option.value === value)
  const displayValue = selectedOption?.label || placeholder
  
  // Get styles
  const selectStyles = getFormStyles('select', { hasError, disabled })
  
  // Handle option selection
  const selectOption = (option: SelectOption) => {
    if (option.disabled) return
    
    // Create synthetic event for form field integration
    const syntheticEvent = {
      target: {
        name,
        value: option.value,
      }
    } as React.ChangeEvent<HTMLInputElement>
    
    onChange?.(syntheticEvent)
    
    if (!multiple) {
      setIsOpen(false)
      setSearchValue('')
      setFocusedIndex(-1)
    }
  }
  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(0)
        } else {
          setFocusedIndex(prev => 
            Math.min(prev + 1, options.length - 1)
          )
        }
        break
        
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(options.length - 1)
        } else {
          setFocusedIndex(prev => Math.max(prev - 1, 0))
        }
        break
        
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(0)
        } else if (focusedIndex >= 0) {
          selectOption(options[focusedIndex])
        }
        break
        
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchValue('')
        setFocusedIndex(-1)
        break
        
      case 'Tab':
        if (isOpen) {
          setIsOpen(false)
          setSearchValue('')
          setFocusedIndex(-1)
        }
        break
        
      default:
        if (!searchable && e.key.length === 1) {
          // Type-ahead functionality
          const firstMatch = options.findIndex(option =>
            option.label.toLowerCase().startsWith(e.key.toLowerCase())
          )
          if (firstMatch >= 0) {
            setFocusedIndex(firstMatch)
            if (!isOpen) {
              setIsOpen(true)
            }
          }
        }
    }
  }
  
  return (
    <div
      ref={ref}
      style={{ position: 'relative' }}
    >
      {/* Select Button */}
      <button
        {...getSelectAriaAttributes(
          id!,
          isOpen,
          listboxId,
          activeDescendant,
          hasError ? `${id}-error` : undefined,
          undefined,
          {
            required: Boolean(ariaProps['aria-required']),
            invalid: hasError,
            disabled,
          }
        )}
        type="button"
        style={{
          ...selectStyles,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onKeyDown={handleKeyDown}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen)
            if (!isOpen) {
              setFocusedIndex(0)
            }
          }
        }}
        disabled={disabled}
      >
        <span style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          color: selectedOption ? 'inherit' : '#9ca3af'
        }}>
          {displayValue}
        </span>
        
        {/* Clear Button */}
        {clearable && selectedOption && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              const syntheticEvent = {
                target: { name, value: '' }
              } as React.ChangeEvent<HTMLInputElement>
              onChange?.(syntheticEvent)
            }}
            style={{
              marginLeft: '0.5rem',
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              color: '#6b7280',
            }}
            aria-label="Clear selection"
          >
            ×
          </button>
        )}
        
        {/* Dropdown Arrow */}
        <span style={{
          marginLeft: '0.5rem',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          fontSize: '0.75rem',
          color: '#6b7280',
        }}>
          ▼
        </span>
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div
          {...getListboxAriaAttributes(listboxId, id!)}
          ref={listboxRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            maxHeight,
            overflowY: 'auto',
            marginTop: '0.25rem',
          }}
        >
          {/* Search Input */}
          {searchable && (
            <div style={{ padding: '0.5rem' }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value)
                  setFocusedIndex(0)
                }}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    listboxRef.current?.focus()
                    setFocusedIndex(0)
                  }
                }}
              />
            </div>
          )}
          
          {/* Loading State */}
          {loading && (
            <div style={{
              padding: '0.75rem',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '0.875rem',
            }}>
              {loadingText}
            </div>
          )}
          
          {/* No Options */}
          {!loading && options.length === 0 && (
            <div style={{
              padding: '0.75rem',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '0.875rem',
            }}>
              {noOptionsText}
            </div>
          )}
          
          {/* Options */}
          {!loading && options.length > 0 && options.map((option, index) => (
            <button
              key={option.value}
              {...getOptionAriaAttributes(
                `${id}-option-${index}`,
                option.value === value,
                index === focusedIndex,
                option.disabled
              )}
              type="button"
              onClick={() => selectOption(option)}
              disabled={option.disabled}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                textAlign: 'left',
                border: 'none',
                cursor: option.disabled ? 'not-allowed' : 'pointer',
                backgroundColor: index === focusedIndex ? '#f3f4f6' : 
                  option.value === value ? '#eff6ff' : 'transparent',
                color: option.disabled ? '#9ca3af' : 'inherit',
                fontSize: '0.875rem',
              }}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {option.label}
              {option.value === value && (
                <span style={{ 
                  float: 'right', 
                  color: '#3b82f6',
                  fontWeight: 'bold' 
                }}>
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

SelectElement.displayName = 'SelectElement'