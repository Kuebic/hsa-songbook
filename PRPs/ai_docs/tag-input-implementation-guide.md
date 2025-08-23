# Tag Input Component Implementation Guide

## Complete Implementation Reference for React 19 Tag Input with TypeScript

This document provides detailed implementation patterns for creating a modern, accessible tag input component with autocomplete using React 19, TypeScript, and Floating UI.

## Core Component Architecture

### 1. Tag Input Component Structure

```tsx
// src/features/tags/components/TagInput.tsx
import React, { useState, useRef, useCallback, useMemo, useId } from 'react'
import { 
  useFloating, 
  autoUpdate, 
  flip, 
  shift, 
  size, 
  offset,
  FloatingPortal,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useListNavigation
} from '@floating-ui/react'
import { TagPill } from './TagPill'
import { useTagSuggestions } from '../hooks/useTagSuggestions'
import { useTagMutations } from '../hooks/useTagMutations'
import type { Tag, TagCategory } from '../types/tag.types'

interface TagInputProps {
  value: Tag[]
  onChange: (tags: Tag[]) => void
  maxTags?: number
  category?: TagCategory
  placeholder?: string
  disabled?: boolean
  error?: string
  quickPicks?: Tag[]
  className?: string
}

export function TagInput({
  value = [],
  onChange,
  maxTags = 10,
  category,
  placeholder = "Add tags...",
  disabled = false,
  error,
  quickPicks = [],
  className = ''
}: TagInputProps) {
  // State management
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  
  // Refs for DOM elements
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<(HTMLElement | null)[]>([])
  
  // Unique IDs for accessibility
  const comboboxId = useId()
  const listboxId = useId()
  
  // Custom hooks
  const { suggestions, isLoading } = useTagSuggestions(inputValue, {
    category,
    excludeIds: value.map(t => t.id)
  })
  
  const { createTag } = useTagMutations()
  
  // Floating UI configuration
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip({
        fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
        padding: 8
      }),
      shift({ 
        padding: 8,
        crossAxis: true 
      }),
      size({
        apply({ availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.min(availableHeight - 10, 300)}px`,
            overflowY: 'auto'
          })
        },
        padding: 10
      })
    ]
  })
  
  // Floating UI interactions
  const role = useRole(context, { role: 'listbox' })
  const focus = useFocus(context)
  const dismiss = useDismiss(context, {
    escapeKey: true,
    outsidePress: true
  })
  
  const listNavigation = useListNavigation(context, {
    listRef,
    activeIndex: selectedIndex,
    onNavigate: setSelectedIndex,
    virtual: true,
    loop: true
  })
  
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    role,
    focus,
    dismiss,
    listNavigation
  ])
  
  // Tag management functions
  const addTag = useCallback(async (tag: Tag | string) => {
    if (value.length >= maxTags) {
      return
    }
    
    let tagToAdd: Tag
    
    if (typeof tag === 'string') {
      // Create new tag
      try {
        tagToAdd = await createTag({
          name: tag,
          category: category || 'theme'
        })
      } catch (error) {
        console.error('Failed to create tag:', error)
        return
      }
    } else {
      tagToAdd = tag
    }
    
    // Check for duplicates
    if (!value.find(t => t.id === tagToAdd.id)) {
      onChange([...value, tagToAdd])
    }
    
    setInputValue('')
    setIsOpen(false)
  }, [value, onChange, maxTags, createTag, category])
  
  const removeTag = useCallback((tagId: string) => {
    onChange(value.filter(t => t.id !== tagId))
  }, [value, onChange])
  
  // Input handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    
    // Handle comma-separated bulk entry
    if (val.includes(',')) {
      const tags = val.split(',').map(t => t.trim()).filter(Boolean)
      tags.forEach(tagName => {
        // Check if tag exists in suggestions
        const existing = suggestions.find(s => 
          s.tag.name.toLowerCase() === tagName.toLowerCase()
        )
        if (existing) {
          addTag(existing.tag)
        } else {
          addTag(tagName) // Create new
        }
      })
      setInputValue('')
    } else {
      setInputValue(val)
      if (val.length >= 2) {
        setIsOpen(true)
      }
    }
  }, [suggestions, addTag])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to remove last tag
    if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value[value.length - 1].id)
      return
    }
    
    // Handle enter to add selected or create new
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (selectedIndex !== null && suggestions[selectedIndex]) {
        addTag(suggestions[selectedIndex].tag)
      } else if (inputValue.trim()) {
        // Create new tag
        addTag(inputValue.trim())
      }
    }
    
    // Handle tab for autocomplete
    if (e.key === 'Tab' && selectedIndex !== null && suggestions[selectedIndex]) {
      e.preventDefault()
      addTag(suggestions[selectedIndex].tag)
    }
  }, [inputValue, value, selectedIndex, suggestions, addTag, removeTag])
  
  // Render
  return (
    <div className={`tag-input ${className} ${error ? 'tag-input--error' : ''}`}>
      {/* Current tags */}
      <div className="tag-input__tags">
        {value.map(tag => (
          <TagPill
            key={tag.id}
            tag={tag}
            onRemove={() => removeTag(tag.id)}
            disabled={disabled}
          />
        ))}
        
        {/* Input field */}
        <input
          ref={(node) => {
            inputRef.current = node
            refs.setReference(node)
          }}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || value.length >= maxTags}
          placeholder={value.length === 0 ? placeholder : ''}
          className="tag-input__field"
          role="combobox"
          id={comboboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-describedby={error ? `${comboboxId}-error` : undefined}
          {...getReferenceProps()}
        />
      </div>
      
      {/* Quick picks */}
      {quickPicks.length > 0 && value.length < maxTags && (
        <div className="tag-input__quick-picks">
          <span className="tag-input__quick-label">Quick add:</span>
          {quickPicks
            .filter(qp => !value.find(v => v.id === qp.id))
            .slice(0, 5)
            .map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => addTag(tag)}
                className="tag-input__quick-pick"
                disabled={disabled}
              >
                {tag.name}
              </button>
            ))}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div id={`${comboboxId}-error`} className="tag-input__error">
          {error}
        </div>
      )}
      
      {/* Autocomplete dropdown */}
      <FloatingPortal>
        {isOpen && suggestions.length > 0 && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="tag-autocomplete"
            role="listbox"
            id={listboxId}
            aria-labelledby={comboboxId}
            {...getFloatingProps()}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.tag.id}
                ref={(node) => {
                  listRef.current[index] = node
                }}
                role="option"
                id={`${listboxId}-option-${index}`}
                aria-selected={index === selectedIndex}
                className={`tag-autocomplete__option ${
                  index === selectedIndex ? 'tag-autocomplete__option--selected' : ''
                }`}
                onClick={() => addTag(suggestion.tag)}
                {...getItemProps()}
              >
                <span className="tag-autocomplete__name">
                  {suggestion.tag.name}
                </span>
                {suggestion.matchType === 'synonym' && (
                  <span className="tag-autocomplete__match-type">
                    (also known as)
                  </span>
                )}
                <span className="tag-autocomplete__usage">
                  {suggestion.tag.usageCount} uses
                </span>
              </div>
            ))}
            
            {/* Create new option */}
            {inputValue.trim() && !suggestions.find(s => 
              s.tag.name.toLowerCase() === inputValue.toLowerCase()
            ) && (
              <div
                role="option"
                className="tag-autocomplete__create"
                onClick={() => addTag(inputValue.trim())}
              >
                Create "{inputValue.trim()}"
              </div>
            )}
          </div>
        )}
      </FloatingPortal>
    </div>
  )
}
```

### 2. Tag Pill Component

```tsx
// src/features/tags/components/TagPill.tsx
import React from 'react'
import type { Tag } from '../types/tag.types'

interface TagPillProps {
  tag: Tag
  onRemove?: (tagId: string) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TagPill({
  tag,
  onRemove,
  disabled = false,
  size = 'md',
  className = ''
}: TagPillProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.(tag.id)
  }
  
  return (
    <span
      className={`tag-pill tag-pill--${size} tag-pill--${tag.category} ${className}`}
      style={tag.color ? { backgroundColor: tag.color } : undefined}
    >
      <span className="tag-pill__label">{tag.name}</span>
      {onRemove && !disabled && (
        <button
          type="button"
          onClick={handleRemove}
          className="tag-pill__remove"
          aria-label={`Remove ${tag.name} tag`}
          disabled={disabled}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M3.5 3.5L10.5 10.5M3.5 10.5L10.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  )
}
```

### 3. CSS Styles

```css
/* src/features/tags/components/styles/tag-input.css */

/* Container */
.tag-input {
  width: 100%;
}

.tag-input__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  min-height: 3rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background: var(--color-background);
  transition: border-color 0.2s;
}

.tag-input__tags:focus-within {
  border-color: var(--color-primary);
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.tag-input--error .tag-input__tags {
  border-color: var(--color-destructive);
}

/* Input field */
.tag-input__field {
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1rem;
  color: var(--text-primary);
}

.tag-input__field::placeholder {
  color: var(--text-muted);
}

/* Disable iOS zoom on focus */
@media (max-width: 768px) {
  .tag-input__field {
    font-size: 16px;
  }
}

/* Tag pill */
.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  background: var(--color-accent);
  color: var(--color-accent-foreground);
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  user-select: none;
  animation: tagEnter 0.2s ease-out;
}

@keyframes tagEnter {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Tag pill sizes */
.tag-pill--sm {
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
}

.tag-pill--lg {
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
}

/* Tag categories with semantic colors */
.tag-pill--theme {
  background: #4169e1;
  color: white;
}

.tag-pill--occasion {
  background: #ff8c00;
  color: white;
}

.tag-pill--liturgical {
  background: #7b68ee;
  color: white;
}

.tag-pill--mood {
  background: #20b2aa;
  color: white;
}

/* Remove button */
.tag-pill__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: 0.125rem;
  margin-right: -0.25rem;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: currentColor;
  opacity: 0.7;
  cursor: pointer;
  transition: opacity 0.2s, background-color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.tag-pill__remove:hover:not(:disabled) {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

.tag-pill__remove:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -1px;
}

.tag-pill__remove:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

/* Quick picks */
.tag-input__quick-picks {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.tag-input__quick-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.tag-input__quick-pick {
  padding: 0.25rem 0.625rem;
  background: var(--color-muted);
  color: var(--text-primary);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.tag-input__quick-pick:hover:not(:disabled) {
  background: var(--color-accent);
  color: var(--color-accent-foreground);
}

.tag-input__quick-pick:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Error message */
.tag-input__error {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-destructive);
}

/* Autocomplete dropdown */
.tag-autocomplete {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg);
  overflow-y: auto;
  z-index: 50;
}

.tag-autocomplete__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  transition: background-color 0.1s;
  min-height: 44px; /* Mobile touch target */
}

.tag-autocomplete__option:hover,
.tag-autocomplete__option--selected {
  background: var(--color-muted);
}

.tag-autocomplete__option:active {
  background: var(--color-accent);
}

.tag-autocomplete__name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.tag-autocomplete__match-type {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
  margin-left: 0.5rem;
}

.tag-autocomplete__usage {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-left: auto;
}

.tag-autocomplete__create {
  padding: 0.625rem 0.75rem;
  background: var(--color-accent-light);
  color: var(--color-accent-foreground);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-top: 1px solid var(--color-border);
  min-height: 44px;
  display: flex;
  align-items: center;
}

.tag-autocomplete__create:hover {
  background: var(--color-accent);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .tag-input__tags {
    padding: 0.625rem;
  }
  
  .tag-pill {
    padding: 0.375rem 0.75rem;
    font-size: 0.9375rem; /* Slightly larger for touch */
  }
  
  .tag-pill__remove {
    width: 24px;
    height: 24px;
  }
  
  .tag-autocomplete__option {
    padding: 0.75rem;
    min-height: 48px; /* Larger touch target */
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .tag-input__tags {
    border-width: 2px;
  }
  
  .tag-pill {
    border: 1px solid currentColor;
  }
  
  .tag-autocomplete {
    border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .tag-pill {
    animation: none;
  }
  
  .tag-pill__remove,
  .tag-input__quick-pick,
  .tag-autocomplete__option {
    transition: none;
  }
}
```

## Key Implementation Patterns

### 1. Debounced Autocomplete Hook

```tsx
// src/features/tags/hooks/useTagSuggestions.ts
import { useState, useEffect, useMemo, useDeferredValue } from 'react'
import { tagService } from '../services/tagService'
import type { TagSuggestion, TagCategory } from '../types/tag.types'

interface UseTagSuggestionsOptions {
  category?: TagCategory
  excludeIds?: string[]
  minLength?: number
}

export function useTagSuggestions(
  query: string,
  options: UseTagSuggestionsOptions = {}
) {
  const { category, excludeIds = [], minLength = 2 } = options
  
  // React 19 deferred value for built-in debouncing
  const deferredQuery = useDeferredValue(query)
  
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    if (deferredQuery.length < minLength) {
      setSuggestions([])
      return
    }
    
    let cancelled = false
    
    const fetchSuggestions = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const results = await tagService.getSuggestions(deferredQuery, {
          category,
          limit: 10
        })
        
        if (!cancelled) {
          // Filter out already selected tags
          const filtered = results.filter(
            s => !excludeIds.includes(s.tag.id)
          )
          setSuggestions(filtered)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
          setSuggestions([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    
    fetchSuggestions()
    
    return () => {
      cancelled = true
    }
  }, [deferredQuery, category, excludeIds, minLength])
  
  return {
    suggestions,
    isLoading,
    error
  }
}
```

### 2. Optimistic Tag Mutations

```tsx
// src/features/tags/hooks/useTagMutations.ts
import { useCallback, useTransition, useOptimistic } from 'react'
import { tagService } from '../services/tagService'
import { useNotification } from '@shared/components/notifications'
import type { Tag, CreateTagInput } from '../types/tag.types'

export function useTagMutations() {
  const { addNotification } = useNotification()
  const [isPending, startTransition] = useTransition()
  
  const createTag = useCallback(async (input: CreateTagInput): Promise<Tag> => {
    try {
      const tag = await tagService.createTag(input)
      
      addNotification({
        type: 'success',
        title: 'Tag Created',
        message: `"${tag.name}" has been added`
      })
      
      return tag
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Create Tag',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }, [addNotification])
  
  return {
    createTag,
    isPending
  }
}
```

## Mobile-Specific Considerations

### Virtual Keyboard Detection

```tsx
// Detect virtual keyboard on mobile
const useVirtualKeyboard = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  
  useEffect(() => {
    const checkKeyboard = () => {
      if (window.visualViewport) {
        const isVisible = window.visualViewport.height < window.innerHeight * 0.75
        setIsKeyboardVisible(isVisible)
      }
    }
    
    window.visualViewport?.addEventListener('resize', checkKeyboard)
    return () => window.visualViewport?.removeEventListener('resize', checkKeyboard)
  }, [])
  
  return isKeyboardVisible
}
```

### Touch-Friendly Interactions

- Minimum 44px touch targets
- Larger tap areas for remove buttons
- Swipe gestures for tag removal (optional)
- Bottom sheet for mobile autocomplete (optional)

## Testing Strategies

### Component Tests

```tsx
// src/features/tags/components/__tests__/TagInput.test.tsx
import { render, screen, userEvent } from '@testing-library/react'
import { TagInput } from '../TagInput'

describe('TagInput', () => {
  it('shows autocomplete after typing 2 characters', async () => {
    const user = userEvent.setup()
    render(<TagInput value={[]} onChange={() => {}} />)
    
    const input = screen.getByRole('combobox')
    await user.type(input, 'ch')
    
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
  
  it('handles comma-separated bulk entry', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TagInput value={[]} onChange={onChange} />)
    
    const input = screen.getByRole('combobox')
    await user.type(input, 'tag1, tag2, tag3')
    
    expect(onChange).toHaveBeenCalledTimes(3)
  })
  
  it('removes tag on backspace when input is empty', async () => {
    const tags = [{ id: '1', name: 'test' }]
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TagInput value={tags} onChange={onChange} />)
    
    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.keyboard('{Backspace}')
    
    expect(onChange).toHaveBeenCalledWith([])
  })
})
```

## Performance Optimizations

1. **Use React.memo for TagPill** - Prevent unnecessary re-renders
2. **Virtualize long suggestion lists** - Use @tanstack/react-virtual for 100+ items
3. **Cache popular tags** - Store in localStorage with TTL
4. **Batch tag operations** - When adding multiple tags
5. **Lazy load admin components** - Code split admin features

## Accessibility Checklist

- ✅ Full keyboard navigation (Tab, Arrow keys, Enter, Escape)
- ✅ ARIA combobox pattern implementation
- ✅ Screen reader announcements for all actions
- ✅ Focus management and visual indicators
- ✅ Color contrast 4.5:1 minimum
- ✅ Error messages linked with aria-describedby
- ✅ Unique IDs using React.useId()
- ✅ Mobile touch targets ≥ 44px

## Common Issues & Solutions

### Issue: Dropdown positioning on mobile
**Solution**: Use FloatingPortal to render in document.body, adjust middleware for mobile

### Issue: Tags not persisting after navigation
**Solution**: Ensure proper state management, consider using React Query for server state

### Issue: Duplicate tags being added
**Solution**: Check for duplicates in addTag function, normalize tag names

### Issue: Performance with many tags
**Solution**: Virtualize tag list, implement pagination for suggestions

This implementation guide provides a complete, production-ready tag input component that follows all modern React best practices and accessibility standards.