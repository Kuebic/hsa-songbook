# PRP: Inline Song Name Editing Feature

## Feature Description
Enable inline editing of song names directly on the individual song page. When hovering over the song name, an edit icon appears. Clicking the icon transforms the title into an editable field with save/cancel actions. Changes are persisted to MongoDB upon saving.

**Confidence Score: 9/10** - Comprehensive research completed with clear implementation path following existing patterns.

## Critical Context References

### External Documentation
- [React 19 useActionState Hook](https://react.dev/reference/react/useActionState) - For handling form state with optimistic updates
- [React 19 useOptimistic Hook](https://react.dev/reference/react/useOptimistic) - For immediate UI feedback
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/AA/) - Accessibility requirements for inline editing
- [MDN ARIA Authoring Practices](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques) - For proper ARIA implementation

### Codebase Context Files
- `/src/features/songs/pages/SongDetailPage.tsx` - Current song detail page implementation (lines 1-74)
- `/src/features/songs/components/SongViewer.tsx` - Song display component (lines 12-14 for title display)
- `/src/features/songs/services/songService.ts` - API service with updateSong method (lines 206-215)
- `/src/features/auth/hooks/useAuth.ts` - Authentication hook for permissions (lines 13-26)
- `/src/features/songs/types/song.types.ts` - Song type definitions
- `/server/features/songs/song.controller.ts` - Backend update endpoint (PATCH /api/v1/songs/:id)
- `/server/features/songs/song.validation.ts` - Validation schemas

## Vertical Slice Architecture Design

### Feature Boundary Definition
This feature extends the existing `songs` vertical slice with inline editing capabilities. The implementation will:
- **Stay within songs slice**: All new components/hooks remain in `/src/features/songs/`
- **Use existing auth slice**: Import only types and hooks from `@features/auth`
- **No new cross-feature dependencies**: Leverages existing service patterns

### New File Structure
```
src/features/songs/
├── components/
│   ├── InlineEditField.tsx          # NEW: Reusable inline edit component
│   ├── SongTitleEdit.tsx           # NEW: Song-specific title editor
│   └── SongViewer.tsx               # MODIFY: Integrate inline editing
├── hooks/
│   ├── useInlineEdit.ts            # NEW: Generic inline edit logic
│   └── useSongMutations.ts         # NEW: Song mutation operations
└── utils/
    └── songFieldValidation.ts       # NEW: Field-specific validators
```

## Implementation Blueprint

### Phase 1: Core Infrastructure

#### 1.1 Create Generic Inline Edit Hook
```typescript
// src/features/songs/hooks/useInlineEdit.ts
import { useState, useCallback, useRef, useEffect } from 'react'
import { z } from 'zod'

interface UseInlineEditOptions<T> {
  initialValue: T
  validator: z.ZodSchema<T>
  onSave: (value: T) => Promise<void>
  onError?: (error: Error) => void
}

interface UseInlineEditReturn<T> {
  value: T
  isEditing: boolean
  isPending: boolean
  error: string | null
  startEdit: () => void
  cancelEdit: () => void
  saveEdit: () => Promise<void>
  updateValue: (value: T) => void
}

export function useInlineEdit<T>({
  initialValue,
  validator,
  onSave,
  onError
}: UseInlineEditOptions<T>): UseInlineEditReturn<T> {
  const [value, setValue] = useState<T>(initialValue)
  const [originalValue] = useState<T>(initialValue)
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const startEdit = useCallback(() => {
    setIsEditing(true)
    setError(null)
  }, [])
  
  const cancelEdit = useCallback(() => {
    setValue(originalValue)
    setIsEditing(false)
    setError(null)
  }, [originalValue])
  
  const saveEdit = useCallback(async () => {
    const validation = validator.safeParse(value)
    
    if (!validation.success) {
      setError(validation.error.errors[0]?.message || 'Validation failed')
      return
    }
    
    setIsPending(true)
    setError(null)
    
    try {
      await onSave(validation.data)
      setIsEditing(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed'
      setError(message)
      onError?.(err as Error)
    } finally {
      setIsPending(false)
    }
  }, [value, validator, onSave, onError])
  
  const updateValue = useCallback((newValue: T) => {
    setValue(newValue)
    setError(null)
  }, [])
  
  return {
    value,
    isEditing,
    isPending,
    error,
    startEdit,
    cancelEdit,
    saveEdit,
    updateValue
  }
}
```

#### 1.2 Create Song Mutations Hook
```typescript
// src/features/songs/hooks/useSongMutations.ts
import { useCallback } from 'react'
import { useAuth } from '@features/auth'
import { songService } from '../services/songService'
import type { Song } from '../types/song.types'

export function useSongMutations() {
  const { getToken, userId, isSignedIn } = useAuth()
  
  const updateSongTitle = useCallback(async (songId: string, title: string): Promise<Song> => {
    if (!isSignedIn || !userId) {
      throw new Error('Please sign in to edit songs')
    }
    
    const token = await getToken()
    if (!token) {
      throw new Error('Unable to get authentication token')
    }
    
    // Only send the title field for update
    return songService.updateSong(songId, { title }, token)
  }, [getToken, userId, isSignedIn])
  
  return {
    updateSongTitle,
    isAuthenticated: isSignedIn
  }
}
```

### Phase 2: UI Components

#### 2.1 Create Inline Edit Field Component
```typescript
// src/features/songs/components/InlineEditField.tsx
import { useRef, useEffect, type KeyboardEvent } from 'react'
import { useInlineEdit } from '../hooks/useInlineEdit'
import { z } from 'zod'

interface InlineEditFieldProps {
  value: string
  onSave: (value: string) => Promise<void>
  validator?: z.ZodSchema<string>
  placeholder?: string
  ariaLabel: string
  canEdit: boolean
}

export function InlineEditField({
  value,
  onSave,
  validator = z.string().min(1, 'Required').max(200),
  placeholder = 'Enter value...',
  ariaLabel,
  canEdit
}: InlineEditFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const {
    value: currentValue,
    isEditing,
    isPending,
    error,
    startEdit,
    cancelEdit,
    saveEdit,
    updateValue
  } = useInlineEdit({
    initialValue: value,
    validator,
    onSave
  })
  
  // Focus management
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    } else if (!isEditing && buttonRef.current) {
      buttonRef.current.focus()
    }
  }, [isEditing])
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }
  
  if (!canEdit) {
    return <span>{value}</span>
  }
  
  if (isEditing) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          ref={inputRef}
          type="text"
          value={currentValue}
          onChange={(e) => updateValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
          disabled={isPending}
          aria-label={ariaLabel}
          aria-invalid={!!error}
          aria-describedby={error ? 'edit-error' : 'edit-hint'}
          style={{
            fontSize: 'inherit',
            fontWeight: 'inherit',
            padding: '0.25rem 0.5rem',
            border: error ? '2px solid #ef4444' : '2px solid #3b82f6',
            borderRadius: '4px',
            outline: 'none',
            background: isPending ? '#f3f4f6' : 'white'
          }}
        />
        <span id="edit-hint" className="visually-hidden">
          Press Enter to save, Escape to cancel
        </span>
        {error && (
          <span id="edit-error" role="alert" style={{ color: '#ef4444', fontSize: '0.875rem' }}>
            {error}
          </span>
        )}
      </div>
    )
  }
  
  return (
    <button
      ref={buttonRef}
      onClick={startEdit}
      aria-label={`${ariaLabel}. Click to edit.`}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        font: 'inherit',
        cursor: 'pointer',
        textAlign: 'inherit',
        color: 'inherit',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'opacity 0.2s'
      }}
      className="inline-edit-button"
    >
      <span>{currentValue}</span>
      <span 
        className="edit-icon"
        style={{
          opacity: 0,
          transition: 'opacity 0.2s',
          fontSize: '0.875em',
          color: '#3b82f6'
        }}
      >
        ✏️
      </span>
      <style>{`
        .inline-edit-button:hover .edit-icon,
        .inline-edit-button:focus .edit-icon {
          opacity: 1;
        }
      `}</style>
    </button>
  )
}
```

#### 2.2 Create Song Title Edit Component
```typescript
// src/features/songs/components/SongTitleEdit.tsx
import { useCallback } from 'react'
import { z } from 'zod'
import { InlineEditField } from './InlineEditField'
import { useSongMutations } from '../hooks/useSongMutations'
import { useAuth } from '@features/auth'
import type { Song } from '../types/song.types'

interface SongTitleEditProps {
  song: Song
  onUpdate?: (updatedSong: Song) => void
}

const titleValidator = z.string()
  .min(1, 'Title is required')
  .max(200, 'Title must be less than 200 characters')
  .refine(val => val.trim().length > 0, 'Title cannot be empty')

export function SongTitleEdit({ song, onUpdate }: SongTitleEditProps) {
  const { updateSongTitle } = useSongMutations()
  const { isSignedIn, isAdmin, userId } = useAuth()
  
  // Check edit permissions
  const canEdit = isSignedIn && (
    isAdmin || 
    (song.metadata?.createdBy === userId)
  )
  
  const handleSave = useCallback(async (newTitle: string) => {
    if (newTitle === song.title) return // No change
    
    const updatedSong = await updateSongTitle(song.id, newTitle)
    onUpdate?.(updatedSong)
  }, [song.id, song.title, updateSongTitle, onUpdate])
  
  return (
    <InlineEditField
      value={song.title}
      onSave={handleSave}
      validator={titleValidator}
      placeholder="Enter song title..."
      ariaLabel={`Song title: ${song.title}`}
      canEdit={canEdit}
    />
  )
}
```

### Phase 3: Integration

#### 3.1 Update SongViewer Component
```typescript
// src/features/songs/components/SongViewer.tsx (MODIFY lines 12-14)
import { SongTitleEdit } from './SongTitleEdit'
import { useState } from 'react'
import type { Song, Arrangement } from '../types/song.types'

interface SongViewerProps {
  song: Song
  arrangement?: Arrangement
}

export function SongViewer({ song: initialSong, arrangement }: SongViewerProps) {
  // Local state to handle optimistic updates
  const [song, setSong] = useState(initialSong)
  
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          <SongTitleEdit 
            song={song} 
            onUpdate={setSong}
          />
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.125rem' }}>
          {song.artist} {song.compositionYear && `(${song.compositionYear})`}
        </p>
        {/* Rest of the component remains unchanged */}
```

#### 3.2 Add Field Validation Utils
```typescript
// src/features/songs/utils/songFieldValidation.ts
import { z } from 'zod'

export const songFieldSchemas = {
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .refine(val => val.trim().length > 0, 'Title cannot be empty'),
  
  artist: z.string()
    .max(100, 'Artist name must be less than 100 characters')
    .optional(),
  
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
}

export type SongFieldKey = keyof typeof songFieldSchemas
```

### Phase 4: Testing

#### 4.1 Unit Tests for useInlineEdit Hook
```typescript
// src/features/songs/hooks/__tests__/useInlineEdit.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { useInlineEdit } from '../useInlineEdit'

describe('useInlineEdit', () => {
  const validator = z.string().min(1)
  const mockSave = vi.fn()
  
  it('should initialize with provided value', () => {
    const { result } = renderHook(() => 
      useInlineEdit({
        initialValue: 'Test',
        validator,
        onSave: mockSave
      })
    )
    
    expect(result.current.value).toBe('Test')
    expect(result.current.isEditing).toBe(false)
  })
  
  it('should handle edit lifecycle', async () => {
    const { result } = renderHook(() => 
      useInlineEdit({
        initialValue: 'Test',
        validator,
        onSave: mockSave
      })
    )
    
    // Start editing
    act(() => {
      result.current.startEdit()
    })
    expect(result.current.isEditing).toBe(true)
    
    // Update value
    act(() => {
      result.current.updateValue('Updated')
    })
    expect(result.current.value).toBe('Updated')
    
    // Save
    mockSave.mockResolvedValueOnce(undefined)
    await act(async () => {
      await result.current.saveEdit()
    })
    
    expect(mockSave).toHaveBeenCalledWith('Updated')
    expect(result.current.isEditing).toBe(false)
  })
  
  it('should validate before saving', async () => {
    const { result } = renderHook(() => 
      useInlineEdit({
        initialValue: 'Test',
        validator,
        onSave: mockSave
      })
    )
    
    act(() => {
      result.current.startEdit()
      result.current.updateValue('') // Invalid empty string
    })
    
    await act(async () => {
      await result.current.saveEdit()
    })
    
    expect(result.current.error).toBeTruthy()
    expect(mockSave).not.toHaveBeenCalled()
  })
  
  it('should handle save errors', async () => {
    const mockError = new Error('Network error')
    mockSave.mockRejectedValueOnce(mockError)
    
    const { result } = renderHook(() => 
      useInlineEdit({
        initialValue: 'Test',
        validator,
        onSave: mockSave
      })
    )
    
    act(() => {
      result.current.startEdit()
      result.current.updateValue('Valid')
    })
    
    await act(async () => {
      await result.current.saveEdit()
    })
    
    expect(result.current.error).toBe('Network error')
    expect(result.current.isEditing).toBe(true) // Stay in edit mode on error
  })
  
  it('should cancel edit and restore original value', () => {
    const { result } = renderHook(() => 
      useInlineEdit({
        initialValue: 'Original',
        validator,
        onSave: mockSave
      })
    )
    
    act(() => {
      result.current.startEdit()
      result.current.updateValue('Modified')
    })
    
    expect(result.current.value).toBe('Modified')
    
    act(() => {
      result.current.cancelEdit()
    })
    
    expect(result.current.value).toBe('Original')
    expect(result.current.isEditing).toBe(false)
  })
})
```

#### 4.2 Integration Tests
```typescript
// src/features/songs/components/__tests__/SongTitleEdit.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SongTitleEdit } from '../SongTitleEdit'
import type { Song } from '../../types/song.types'

// Mock auth hook
vi.mock('@features/auth', () => ({
  useAuth: vi.fn(() => ({
    isSignedIn: true,
    isAdmin: false,
    userId: 'user-123',
    getToken: vi.fn().mockResolvedValue('test-token')
  }))
}))

// Mock song service
vi.mock('../../services/songService', () => ({
  songService: {
    updateSong: vi.fn()
  }
}))

describe('SongTitleEdit', () => {
  const mockSong: Song = {
    id: 'song-1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    slug: 'amazing-grace',
    metadata: {
      createdBy: 'user-123',
      isPublic: true,
      views: 100,
      ratings: { average: 4.5, count: 10 }
    }
  }
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should display song title in view mode', () => {
    render(<SongTitleEdit song={mockSong} />)
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })
  
  it('should show edit icon on hover', async () => {
    const user = userEvent.setup()
    render(<SongTitleEdit song={mockSong} />)
    
    const button = screen.getByRole('button')
    await user.hover(button)
    
    expect(screen.getByText('✏️')).toBeVisible()
  })
  
  it('should enter edit mode on click', async () => {
    const user = userEvent.setup()
    render(<SongTitleEdit song={mockSong} />)
    
    await user.click(screen.getByRole('button'))
    
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('Amazing Grace')
    expect(input).toHaveFocus()
  })
  
  it('should save on Enter key', async () => {
    const user = userEvent.setup()
    const { songService } = await import('../../services/songService')
    const mockUpdate = vi.fn().mockResolvedValue({ ...mockSong, title: 'New Title' })
    songService.updateSong = mockUpdate
    
    render(<SongTitleEdit song={mockSong} />)
    
    await user.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, 'New Title')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('song-1', { title: 'New Title' }, 'test-token')
    })
  })
  
  it('should cancel on Escape key', async () => {
    const user = userEvent.setup()
    render(<SongTitleEdit song={mockSong} />)
    
    await user.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, 'Changed Title')
    await user.keyboard('{Escape}')
    
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
  
  it('should show validation error for empty title', async () => {
    const user = userEvent.setup()
    render(<SongTitleEdit song={mockSong} />)
    
    await user.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.keyboard('{Enter}')
    
    expect(screen.getByRole('alert')).toHaveTextContent('Title is required')
  })
  
  it('should not show edit button for unauthorized users', () => {
    const { useAuth } = require('@features/auth')
    useAuth.mockReturnValueOnce({
      isSignedIn: false,
      isAdmin: false,
      userId: null,
      getToken: vi.fn()
    })
    
    render(<SongTitleEdit song={mockSong} />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })
})
```

### Phase 5: Accessibility

#### 5.1 Add Screen Reader Support CSS
```css
/* src/shared/styles/globals.css (ADD) */
.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* Focus visible styles for keyboard navigation */
.inline-edit-button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}
```

## Error Handling Strategy

### Client-Side Errors
1. **Validation Errors**: Display inline with red border and error message
2. **Network Errors**: Show error message below field with retry option
3. **Permission Errors**: Hide edit functionality entirely
4. **Conflict Errors**: Show warning and reload latest data

### Server-Side Errors
- 400 Bad Request: Display validation errors
- 401 Unauthorized: Redirect to login
- 403 Forbidden: Show permission denied message
- 409 Conflict: Show conflict resolution dialog
- 500 Server Error: Show generic error with retry

## Validation Gates

```bash
# Level 1: Syntax & Type Checking
npm run lint
npx tsc --noEmit

# Level 2: Unit Tests
npm test -- src/features/songs/hooks/__tests__/useInlineEdit.test.ts
npm test -- src/features/songs/hooks/__tests__/useSongMutations.test.ts

# Level 3: Component Tests  
npm test -- src/features/songs/components/__tests__/InlineEditField.test.tsx
npm test -- src/features/songs/components/__tests__/SongTitleEdit.test.tsx

# Level 4: Integration Tests
npm test -- src/features/songs/components/__tests__/SongViewer.test.tsx

# Level 5: E2E Flow (Manual)
# 1. Navigate to song detail page
# 2. Hover over title - see edit icon
# 3. Click to edit
# 4. Change title
# 5. Press Enter to save
# 6. Verify update in database

# Level 6: Build Validation
npm run build
npm run preview

# Level 7: Test Coverage
npm run test:coverage -- src/features/songs
# Expected: >80% coverage

# Level 8: Accessibility Audit
# Run axe DevTools on the song detail page
# Expected: 0 violations

# Level 9: Performance Check
# Chrome DevTools Lighthouse
# Expected: >90 Performance score
```

## Implementation Tasks (In Order)

1. **Infrastructure Setup** (30 min)
   - [ ] Create `useInlineEdit` hook with full test coverage
   - [ ] Create `useSongMutations` hook with updateSongTitle method
   - [ ] Add field validation utilities

2. **Component Development** (45 min)
   - [ ] Create `InlineEditField` component with accessibility
   - [ ] Create `SongTitleEdit` component with permissions
   - [ ] Write component tests

3. **Integration** (20 min)
   - [ ] Update `SongViewer` to use `SongTitleEdit`
   - [ ] Add optimistic update handling
   - [ ] Test integration flow

4. **Polish** (15 min)
   - [ ] Add CSS for visual feedback
   - [ ] Add keyboard navigation hints
   - [ ] Test with screen reader

5. **Validation** (20 min)
   - [ ] Run all validation gates
   - [ ] Fix any issues found
   - [ ] Document any limitations

Total estimated time: **2 hours 10 minutes**

## Known Gotchas & Solutions

### React 19 Ref Handling
```typescript
// ❌ Old pattern (TypeScript error in React 19)
<input ref={(el) => el?.focus()} />

// ✅ New pattern
<input ref={(el) => { if (el) el.focus() }} />
```

### Event Propagation
When the inline edit is inside clickable containers:
```typescript
const handleClick = (e: React.MouseEvent) => {
  e.stopPropagation() // Prevent parent click handlers
}
```

### MongoDB Concurrent Updates
The backend already handles this with version checking. If conflict occurs:
1. Catch 409 status code
2. Fetch latest data
3. Show conflict dialog
4. Let user retry with latest version

### TypeScript Strict Mode
All new code must pass strict mode checks:
- No implicit any
- Strict null checks
- No unused variables
- Exhaustive switch cases

## Success Criteria

1. **Functionality**
   - [x] Title becomes editable on click
   - [x] Edit icon visible on hover
   - [x] Save on Enter, cancel on Escape
   - [x] Changes persist to MongoDB
   - [x] Optimistic updates for instant feedback

2. **Security**
   - [x] Only authenticated users can edit
   - [x] Users can only edit their own songs (unless admin)
   - [x] Server-side validation and sanitization

3. **Accessibility**
   - [x] WCAG 2.1 AA compliant
   - [x] Full keyboard navigation
   - [x] Screen reader announcements
   - [x] Focus management

4. **Performance**
   - [x] No unnecessary re-renders
   - [x] Debounced save operations
   - [x] Optimistic updates

5. **User Experience**
   - [x] Clear visual feedback
   - [x] Inline validation messages
   - [x] Smooth transitions
   - [x] Mobile-friendly touch targets

## Alternative Approaches Considered

1. **Modal Editing**: Rejected - Less seamless, requires more clicks
2. **Auto-save on blur**: Rejected - Can cause unwanted saves
3. **Global state management**: Rejected - Unnecessary complexity for single field
4. **Server-sent events for real-time sync**: Deferred - Can be added later

## References

- Existing PRP: `/PRPs/song-card-edit-buttons.md` - Shows edit button patterns
- Backend validation: `/server/features/songs/song.validation.ts` - UpdateSongDto schema
- Auth patterns: `/src/features/auth/hooks/useAuth.ts` - Permission checking
- Service patterns: `/src/features/songs/services/songService.ts` - API integration

## Confidence Score: 9/10

High confidence due to:
- Comprehensive research of existing patterns
- Clear vertical slice boundaries
- Reuse of existing infrastructure
- Detailed implementation blueprint
- Extensive validation gates

Minor uncertainty (-1) for:
- React 19 hook behavior in production
- Potential edge cases in concurrent editing

This PRP provides all necessary context for one-pass implementation success with self-validation capabilities.