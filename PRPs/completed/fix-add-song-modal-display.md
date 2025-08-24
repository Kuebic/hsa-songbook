# PRP: Fix Add Song Modal Display Issue

## Feature: Ensure Add Song Form Only Shows When Button is Clicked

### Problem Statement
The add-new-song form is currently always visible when it should only pop up when the "Add Song" button is selected. This creates a poor user experience and blocks the main interface.

## Critical Context

### Current Implementation Analysis

**File Structure:**
- `/src/features/songs/components/ui/AddSongButton.tsx` - Controls modal state
- `/src/features/songs/components/forms/SongFormModal.tsx` - Modal wrapper for form
- `/src/features/songs/components/forms/SongForm.tsx` - The actual form component
- `/src/shared/components/modal/Modal.tsx` - Base modal component using HTML dialog
- `/src/shared/components/Layout.tsx` - Renders AddSongButton in navigation (line 111)

**Current Modal Flow:**
1. AddSongButton manages `showModal` state (initialized as `false`)
2. Clicking button sets `showModal` to `true` 
3. SongFormModal receives `isOpen={showModal}` prop
4. Modal component uses native HTML `<dialog>` element
5. Dialog shows/hides based on `isOpen` prop

### Vertical Slice Architecture Context

The application follows a feature-first vertical slice architecture:
- **Songs Feature**: Self-contained with components, hooks, types, services
- **Shared Infrastructure**: Modal system in `/src/shared/components/modal/`
- **Clean Public APIs**: Features expose controlled interfaces through index.ts

### Modal System Architecture

**Current Modal Implementation (`/src/shared/components/modal/Modal.tsx`):**
- Uses native HTML `<dialog>` element for accessibility
- Focus management via `useModalFocus` hook
- Modal stacking via `useModal` context
- Proper ARIA attributes (labelledby, describedby, modal)
- ESC key and backdrop click handling

### Best Practices Reference

**React 19 Modal Best Practices:**
- Native `<dialog>` element preferred for built-in accessibility
- Proper focus trap and restoration
- ARIA attributes for screen readers
- Keyboard navigation support
- Background content hidden from assistive tech

Documentation: https://clhenrick.io/blog/react-a11y-modal-dialog/

## Root Cause Analysis

### Potential Issues to Investigate

1. **State Initialization Issue**
   - Check if `showModal` state is being overridden
   - Verify no props are forcing modal open
   - Check for re-render issues causing state reset

2. **Event Handling Problems**
   - Verify `onClose` callback properly updates state
   - Check for event propagation issues
   - Ensure no competing event listeners

3. **Modal Component Issues**
   - Dialog element might not be closing properly
   - Animation timing might be interfering
   - Browser compatibility with dialog element

4. **Global State Interference**
   - Check if auth state changes trigger modal
   - Verify no URL params force modal open
   - Check for localStorage/sessionStorage persistence

## Implementation Blueprint

### Phase 1: Diagnostic Investigation

```typescript
// Add debug logging to AddSongButton.tsx
console.log('[AddSongButton] Render - showModal:', showModal)

// Add to modal state changes
const handleOpenModal = () => {
  console.log('[AddSongButton] Opening modal')
  setShowModal(true)
}

const handleCloseModal = () => {
  console.log('[AddSongButton] Closing modal')
  setShowModal(false)
}

// Check SongFormModal props
console.log('[SongFormModal] isOpen:', isOpen)

// Monitor Modal component lifecycle
console.log('[Modal] Dialog state - isOpen:', isOpen)
```

### Phase 2: Fix Implementation

```typescript
// Enhanced AddSongButton with controlled state
export function AddSongButton() {
  const { isSignedIn } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const { createSong } = useSongMutations()
  const { addNotification } = useNotification()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Debug: Log state on every render
  useEffect(() => {
    console.log('[AddSongButton] Modal state:', showModal)
  }, [showModal])
  
  if (!isSignedIn) return null
  
  const handleOpenModal = useCallback(() => {
    setShowModal(true)
  }, [])
  
  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setIsSubmitting(false) // Reset submission state
  }, [])
  
  const handleSubmit = async (data: SongFormData) => {
    setIsSubmitting(true)
    
    try {
      const song = await createSong(data)
      
      addNotification({
        type: 'success',
        title: 'Song created successfully',
        message: `"${song.title}" has been added to the songbook`,
        action: {
          label: 'View Song',
          onClick: () => {
            window.location.href = `/songs/${song.slug}`
          }
        }
      })
      
      handleCloseModal() // Use the callback
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to create song',
        message: error instanceof Error ? error.message : 'Please try again'
      })
      setIsSubmitting(false)
    }
  }
  
  return (
    <>
      <button
        onClick={handleOpenModal}
        style={buttonStyles}
        aria-label="Add new song"
        title="Add new song"
        data-testid="add-song-button"
      >
        <span style={iconStyles}>➕</span>
        <span>Add Song</span>
      </button>
      
      {/* Only render modal when needed */}
      {showModal && (
        <SongFormModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  )
}
```

### Phase 3: Enhanced Modal Control

```typescript
// Update SongFormModal to ensure proper cleanup
export function SongFormModal({
  isOpen,
  onClose,
  onSubmit,
  song,
  existingSongs = [],
  isSubmitting = false
}: SongFormModalProps) {
  // Ensure modal closes on unmount
  useEffect(() => {
    return () => {
      if (isOpen) {
        onClose()
      }
    }
  }, [isOpen, onClose])
  
  const handleSubmit = async (data: SongFormData) => {
    try {
      await onSubmit(data)
      // Parent component handles closing
    } catch (error) {
      console.error('Error submitting form:', error)
      // Keep modal open on error
    }
  }
  
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose()
    }
  }, [isSubmitting, onClose])
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={song ? `Edit Song: ${song.title}` : 'Add New Song'}
      description={
        song 
          ? 'Update the song information below'
          : 'Fill in the form to add a new song to the songbook'
      }
      size="large"
      closeOnEsc={!isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      showCloseButton={!isSubmitting}
      data-testid="song-form-modal"
    >
      <SongForm
        initialData={song}
        existingSongs={existingSongs}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  )
}
```

### Phase 4: Add Tests

```typescript
// __tests__/AddSongButton.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddSongButton } from '../AddSongButton'

describe('AddSongButton', () => {
  it('should not show modal initially', () => {
    render(<AddSongButton />)
    expect(screen.queryByTestId('song-form-modal')).not.toBeInTheDocument()
  })
  
  it('should show modal when button clicked', async () => {
    render(<AddSongButton />)
    const button = screen.getByTestId('add-song-button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByTestId('song-form-modal')).toBeInTheDocument()
    })
  })
  
  it('should hide modal when close button clicked', async () => {
    render(<AddSongButton />)
    const button = screen.getByTestId('add-song-button')
    fireEvent.click(button)
    
    const closeButton = await screen.findByLabelText('Close dialog')
    fireEvent.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByTestId('song-form-modal')).not.toBeInTheDocument()
    })
  })
})
```

## Implementation Tasks

1. **Add diagnostic logging** to identify current state behavior
2. **Update AddSongButton** with controlled callbacks and conditional rendering
3. **Enhance SongFormModal** with proper cleanup and state management
4. **Update Modal component** if needed for better state control
5. **Add comprehensive tests** for modal show/hide behavior
6. **Remove debug logging** after fix is verified

## Files to Modify

1. `/src/features/songs/components/ui/AddSongButton.tsx` - Main fix location
2. `/src/features/songs/components/forms/SongFormModal.tsx` - Enhanced cleanup
3. `/src/features/songs/components/ui/__tests__/AddSongButton.test.tsx` - Add tests
4. `/src/shared/components/modal/Modal.tsx` - Only if core issues found

## Validation Gates

```bash
# Type checking
npm run build

# Linting
npm run lint

# Run existing tests
npm run test

# Manual verification
npm run dev
# 1. Navigate to application
# 2. Verify modal is NOT visible on page load
# 3. Click "Add Song" button
# 4. Verify modal appears
# 5. Click close button or ESC
# 6. Verify modal disappears
# 7. Test form submission
# 8. Verify modal closes after successful submission
```

## Success Criteria

- [ ] Modal is NOT visible when page loads
- [ ] Modal only appears when "Add Song" button is clicked
- [ ] Modal closes properly via close button, ESC key, and backdrop click
- [ ] Modal closes after successful form submission
- [ ] Modal stays open on validation errors
- [ ] No console errors or warnings
- [ ] All existing tests pass
- [ ] New tests verify modal behavior

## Risk Mitigation

- **Browser Compatibility**: Test in Chrome, Firefox, Safari for dialog element support
- **State Management**: Use React DevTools to monitor state changes
- **Performance**: Profile re-renders to ensure no performance regression
- **Accessibility**: Test with screen readers to ensure modal announcements work

## Alternative Solutions

If the current approach doesn't work:

1. **Replace conditional rendering** with CSS visibility control
2. **Use React Portal** directly instead of dialog element
3. **Implement custom modal** without native dialog
4. **Use established library** like react-modal

## Confidence Score: 8/10

High confidence in identifying and fixing the issue. The modal system is well-structured, and the fix involves proper state management and event handling. The diagnostic approach will quickly identify the root cause.

## References

- Current Implementation: `/src/features/songs/components/ui/AddSongButton.tsx`
- Modal System: `/src/shared/components/modal/Modal.tsx`
- React Modal Best Practices: https://clhenrick.io/blog/react-a11y-modal-dialog/
- Native Dialog Element: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog