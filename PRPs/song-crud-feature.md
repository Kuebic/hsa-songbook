# Song CRUD Feature Implementation PRP

## Executive Summary
Implement a complete vertical slice for song creation and editing functionality in HSA Songbook, featuring a modal-based form interface accessible via a header plus button. This PRP provides comprehensive context for one-pass implementation success with self-validation.

**Confidence Score: 9/10** - High confidence due to comprehensive research, existing patterns, and clear implementation path.

## Context and Research Findings

### Codebase Architecture Analysis
The HSA Songbook follows a **vertical slice architecture** where each feature is self-contained with components, hooks, services, pages, and types. The songs feature (`src/features/songs/`) already has complete CRUD operations in the backend but lacks frontend forms.

**Key Existing Files to Reference:**
- `src/features/songs/services/songService.ts` - Complete CRUD API methods
- `src/features/songs/types/song.types.ts` - Song and Arrangement interfaces
- `src/features/songs/hooks/useSongs.ts` - Data fetching hooks
- `src/features/auth/hooks/useAuth.ts` - Authentication state
- `src/shared/components/Layout.tsx` - Header component for plus button
- `server/features/songs/song.model.ts` - MongoDB schema
- `server/features/songs/song.controller.ts` - API endpoints

### Backend API Analysis
**Existing Endpoints:**
- `POST /api/v1/songs` - Create song (auth required)
- `PATCH /api/v1/songs/:id` - Update song (auth required)
- Headers: `x-user-id` for authentication

**MongoDB Schema:**
```typescript
interface ISong {
  title: string (required, max 200)
  artist?: string (max 100)
  slug: string (auto-generated, unique)
  compositionYear?: number (1000-current)
  ccli?: string
  themes: string[]
  source?: string (max 200)
  notes?: string (max 2000)
  defaultArrangementId?: ObjectId
  metadata: {
    createdBy: ObjectId (required)
    isPublic: boolean (default: false)
    ratings: { average: number, count: number }
    views: number
  }
}
```

### UI Patterns and Styling
- **No external UI libraries** - Custom inline styles approach
- **Color Palette**: Slate (`#1e293b`, `#64748b`) and Blue (`#3b82f6`)
- **Form Pattern**: Controlled components with useState
- **Modal Pattern**: No existing modal framework - will use HTML dialog element
- **Icons**: Unicode emojis (`➕` for add, `✏️` for edit)

### React 19 Features to Leverage
- **useActionState**: Form submission with error handling
- **useFormStatus**: Loading states
- **useOptimistic**: Optimistic UI updates
- **Native form validation**: Built-in HTML5 validation

## Feature Requirements

### User Stories
1. As a user, I can click a plus button in the header to add a new song
2. As a user, I can edit existing songs by clicking an edit button
3. As a user, I can see validation errors before submission
4. As a user, I can see loading states during save operations
5. As an admin, I can make songs public/private

### Technical Requirements
- Modal-based form interface using HTML dialog element
- Form validation using Zod schema
- Optimistic updates for better UX
- Authentication required for create/edit
- Proper error handling and display
- Accessibility compliance (ARIA, focus management)
- Mobile-responsive design

## Implementation Blueprint

### Vertical Slice Structure
```
src/features/songs/
├── components/
│   ├── SongFormModal.tsx      # NEW - Main modal component
│   ├── SongFormModal.test.tsx # NEW - Modal tests
│   ├── SongForm.tsx           # NEW - Form component
│   ├── SongForm.test.tsx      # NEW - Form tests
│   └── SongFormFields.tsx     # NEW - Form field components
├── hooks/
│   ├── useSongForm.ts         # NEW - Form state management
│   └── useSongMutations.ts    # NEW - Create/update mutations
├── utils/
│   └── songValidation.ts      # NEW - Zod schemas
└── types/
    └── songForm.types.ts      # NEW - Form-specific types
```

### Component Hierarchy
```
Layout (header)
  └── AddSongButton
      └── SongFormModal
          ├── dialog element
          └── SongForm
              ├── FormHeader
              ├── SongFormFields
              │   ├── TitleField
              │   ├── ArtistField
              │   ├── ThemesField
              │   ├── MetadataFields
              │   └── NotesField
              └── FormActions
```

## Detailed Implementation Steps

### Step 1: Create Validation Schema
```typescript
// src/features/songs/utils/songValidation.ts
import { z } from 'zod'

export const SongFormSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  artist: z.string()
    .max(100, 'Artist must be less than 100 characters')
    .optional(),
  compositionYear: z.number()
    .min(1000, 'Year must be after 1000')
    .max(new Date().getFullYear(), 'Year cannot be in the future')
    .optional(),
  ccli: z.string().optional(),
  themes: z.array(z.string()).default([]),
  source: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  isPublic: z.boolean().default(false)
})

export type SongFormData = z.infer<typeof SongFormSchema>
```

### Step 2: Create Form Hooks
```typescript
// src/features/songs/hooks/useSongMutations.ts
import { useAuth } from '@features/auth'
import { songService } from '../services/songService'
import { useOptimistic } from 'react'

export function useSongMutations() {
  const { getToken, userId } = useAuth()
  
  const createSong = async (data: SongFormData) => {
    const token = await getToken()
    return songService.createSong({
      ...data,
      metadata: { createdBy: userId, isPublic: data.isPublic }
    }, token)
  }
  
  const updateSong = async (id: string, data: Partial<SongFormData>) => {
    const token = await getToken()
    return songService.updateSong(id, data, token)
  }
  
  return { createSong, updateSong }
}
```

### Step 3: Create Modal Component
```typescript
// src/features/songs/components/SongFormModal.tsx
import { useRef, useEffect } from 'react'
import { SongForm } from './SongForm'
import { Song } from '../types/song.types'

interface SongFormModalProps {
  isOpen: boolean
  onClose: () => void
  song?: Song
  onSuccess?: () => void
}

export function SongFormModal({ isOpen, onClose, song, onSuccess }: SongFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    
    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])
  
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }
  
  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onKeyDown={handleEscape}
      style={{
        padding: 0,
        border: 'none',
        borderRadius: '8px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        maxWidth: '600px',
        width: '90vw',
        maxHeight: '90vh',
        overflow: 'hidden'
      }}
      aria-labelledby="modal-title"
    >
      <div style={{
        backgroundColor: 'white',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <SongForm
          song={song}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </div>
    </dialog>
  )
}
```

### Step 4: Create Form Component
```typescript
// src/features/songs/components/SongForm.tsx
import { useActionState } from 'react'
import { SongFormSchema } from '../utils/songValidation'
import { useSongMutations } from '../hooks/useSongMutations'
import { SongFormFields } from './SongFormFields'

export function SongForm({ song, onClose, onSuccess }) {
  const { createSong, updateSong } = useSongMutations()
  
  const [formState, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const data = Object.fromEntries(formData)
      const themes = formData.getAll('themes').filter(Boolean) as string[]
      
      const result = SongFormSchema.safeParse({
        ...data,
        themes,
        compositionYear: data.compositionYear ? Number(data.compositionYear) : undefined,
        isPublic: data.isPublic === 'true'
      })
      
      if (!result.success) {
        return { errors: result.error.flatten().fieldErrors }
      }
      
      try {
        if (song) {
          await updateSong(song.id, result.data)
        } else {
          await createSong(result.data)
        }
        onSuccess?.()
        onClose()
        return { success: true }
      } catch (error) {
        return { error: error.message }
      }
    },
    {}
  )
  
  return (
    <form action={formAction} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SongFormFields song={song} errors={formState?.errors} />
      <FormActions isPending={isPending} onCancel={onClose} />
    </form>
  )
}
```

### Step 5: Add Button to Header
```typescript
// Update src/shared/components/Layout.tsx
import { useState } from 'react'
import { SongFormModal } from '@features/songs/components/SongFormModal'
import { useAuth } from '@features/auth'

export function Layout({ children }: LayoutProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { isSignedIn } = useAuth()
  
  return (
    <>
      <nav style={{ /* existing styles */ }}>
        <div style={{ /* existing container styles */ }}>
          {/* existing nav content */}
          {isSignedIn && (
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Add new song"
            >
              ➕
            </button>
          )}
        </div>
      </nav>
      
      {children}
      
      <SongFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Trigger refetch of songs
          window.location.reload() // Simple solution, can optimize later
        }}
      />
    </>
  )
}
```

### Step 6: Testing Implementation
```typescript
// src/features/songs/components/__tests__/SongForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SongForm } from '../SongForm'

describe('SongForm', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<SongForm onClose={vi.fn()} />)
    
    const submitButton = screen.getByRole('button', { name: /save/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })
  })
  
  it('creates new song with valid data', async () => {
    const user = userEvent.setup()
    const mockOnSuccess = vi.fn()
    
    render(<SongForm onClose={vi.fn()} onSuccess={mockOnSuccess} />)
    
    await user.type(screen.getByLabelText('Title'), 'Amazing Grace')
    await user.type(screen.getByLabelText('Artist'), 'John Newton')
    await user.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })
})
```

## Error Handling Strategy

### Client-Side Validation
- Zod schema validation on form submission
- Real-time field validation on blur
- Clear error messages below each field
- Prevent submission with invalid data

### Server-Side Error Handling
```typescript
// Handle specific error cases
if (error.response?.status === 409) {
  return { error: 'A song with this title already exists' }
} else if (error.response?.status === 401) {
  return { error: 'Please sign in to create songs' }
} else {
  return { error: 'Failed to save song. Please try again.' }
}
```

### Network Error Recovery
- Retry logic with exponential backoff (already in songService)
- Optimistic updates with rollback on failure
- Local storage draft saving for form data

## Accessibility Requirements

### ARIA Implementation
```typescript
// Form field with proper ARIA
<div role="group" aria-labelledby="themes-label">
  <label id="themes-label">Themes</label>
  <input
    aria-describedby={errors?.themes ? 'themes-error' : undefined}
    aria-invalid={!!errors?.themes}
  />
  {errors?.themes && (
    <div id="themes-error" role="alert">{errors.themes}</div>
  )}
</div>
```

### Focus Management
- Auto-focus first field on modal open
- Trap focus within modal
- Return focus to trigger button on close
- Keyboard navigation support (Tab, Shift+Tab, Escape)

## Validation Gates

### Level 1: Type Checking & Linting
```bash
npm run lint && npm run type-check
```

### Level 2: Unit Tests
```bash
npm run test -- src/features/songs/components/__tests__/
```

### Level 3: Integration Tests
```bash
# Test complete form flow
npm run test -- --run
```

### Level 4: Build Verification
```bash
npm run build && npm run preview
```

### Level 5: Manual Testing Checklist
- [ ] Plus button appears when logged in
- [ ] Modal opens with proper focus
- [ ] Form validates on submission
- [ ] Error messages display correctly
- [ ] Loading state during save
- [ ] Success creates new song
- [ ] Edit mode populates existing data
- [ ] Escape key closes modal
- [ ] Mobile responsive layout

## Performance Optimizations

### Code Splitting
```typescript
// Lazy load modal component
const SongFormModal = lazy(() => import('./components/SongFormModal'))
```

### Memoization
```typescript
// Memoize expensive computations
const themes = useMemo(() => 
  allThemes.filter(theme => 
    theme.toLowerCase().includes(searchTerm.toLowerCase())
  ), [searchTerm]
)
```

### Request Deduplication
- Already implemented in songService
- Caching with 30-second TTL

## Security Considerations

### Input Sanitization
- Zod validation prevents injection
- MongoDB sanitize middleware on backend
- HTML entity encoding for display

### Authentication
- Required for all mutations
- User ID passed in headers
- Role-based access for public/private toggle

## Migration Path

### Phase 1: Basic Implementation (Current PRP)
- Create and edit songs
- Basic field validation
- Modal interface

### Phase 2: Enhanced Features
- Rich text editor for notes
- Bulk theme selection
- Auto-save drafts

### Phase 3: Arrangement Integration
- Add arrangement from song form
- ChordPro editor
- Key/tempo settings

## Dependencies

### Required Packages
```bash
npm install zod
```

### Existing Dependencies Used
- React 19.1.0
- TypeScript 5.8.3
- Vite 7.0.6
- @clerk/clerk-react 5.39.0

## File Creation Order

1. `src/features/songs/utils/songValidation.ts` - Validation schemas
2. `src/features/songs/types/songForm.types.ts` - Form types
3. `src/features/songs/hooks/useSongMutations.ts` - API mutations
4. `src/features/songs/components/SongFormFields.tsx` - Field components
5. `src/features/songs/components/SongForm.tsx` - Form logic
6. `src/features/songs/components/SongFormModal.tsx` - Modal wrapper
7. Update `src/shared/components/Layout.tsx` - Add button
8. `src/features/songs/components/__tests__/SongForm.test.tsx` - Tests

## Success Metrics

- Zero TypeScript errors
- All tests passing
- Successful build
- No accessibility violations
- Sub-200ms form response time
- 90%+ code coverage for new components

## Common Pitfalls to Avoid

1. **Don't forget auth headers** - Pass x-user-id for all mutations
2. **Handle modal backdrop clicks** - Prevent accidental closures
3. **Validate on backend too** - Never trust client validation alone
4. **Test error states** - Network failures, validation errors
5. **Mobile keyboard issues** - Test on actual devices

## External Resources

- [React 19 Form Handling](https://react.dev/reference/react-dom/components/form)
- [HTML Dialog Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
- [Zod Documentation](https://zod.dev/)
- [ARIA Forms Guide](https://www.w3.org/WAI/tutorials/forms/)

## Conclusion

This PRP provides a complete blueprint for implementing song CRUD functionality following HSA Songbook's established patterns. The vertical slice architecture ensures clean separation of concerns while React 19 features provide modern form handling capabilities. With comprehensive validation, testing, and accessibility considerations, this implementation will deliver a robust, user-friendly song management system.

**Implementation Time Estimate**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low (uses established patterns)