# Add Song Button with Modal Popup - Implementation PRP

## Executive Summary

Implement a functional "Add Song" button in the application header that opens the existing SongManagementModal for authenticated users to create new songs. The button component (`AddSongButton.tsx`) already exists as a placeholder and needs to be completed with proper authentication checks, modal integration, and success handling.

**Confidence Score: 9.5/10** - All infrastructure is in place, only implementation needed.

## Context & Current State

### Existing Infrastructure
1. **AddSongButton Component** (`src/features/songs/components/ui/AddSongButton.tsx`): Currently returns null, needs implementation
2. **SongManagementModal** (`src/features/songs/components/SongManagementModal.tsx`): Fully implemented and tested
3. **useSongManagementModal Hook** (`src/features/songs/hooks/useSongManagementModal.ts`): Ready to use for modal state management
4. **Button Component** (`src/shared/components/ui/Button.tsx`): Shadcn/ui-based button with variants
5. **Layout Integration** (`src/shared/components/Layout.tsx`, Line 113): Button already positioned in header

### Key Files to Reference
```
src/features/songs/components/ui/AddSongButton.tsx (Lines 1-11) - Component to implement
src/features/songs/components/SongManagementModal.tsx (Lines 1-46) - Modal to integrate
src/features/songs/hooks/useSongManagementModal.ts (Lines 1-58) - Hook for modal state
src/shared/components/ui/Button.tsx (Lines 1-28) - Button component to use
src/features/auth/hooks/useAuth.ts (Lines 267-296) - Authentication hook
src/shared/components/notifications/useNotification.ts - Notification system
```

## Technical Specifications

### Component Architecture (Vertical Slice)

```
src/features/songs/
├── components/
│   └── ui/
│       └── AddSongButton.tsx        # Main implementation
├── hooks/
│   └── useSongManagementModal.ts    # Already implemented
└── components/
    ├── SongManagementModal.tsx      # Already implemented
    └── SongManagementForm.tsx       # Already implemented
```

### Implementation Blueprint

```typescript
// src/features/songs/components/ui/AddSongButton.tsx
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/components/ui/Button'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useSongManagementModal } from '../../hooks/useSongManagementModal'
import { SongManagementModal } from '../SongManagementModal'
import { useNotification } from '@shared/components/notifications'
import type { Song } from '../../types/song.types'

export function AddSongButton() {
  const navigate = useNavigate()
  const { isSignedIn, isLoaded, user } = useAuth()
  const { addNotification } = useNotification()
  const { isOpen, closeModal, openCreateModal } = useSongManagementModal()
  
  const handleSuccess = useCallback((song: Song) => {
    // Show success notification
    addNotification({
      type: 'success',
      title: 'Song Created',
      message: `"${song.title}" has been added to the library`
    })
    
    // Navigate to the new song's detail page
    navigate(`/songs/${song.slug}`)
  }, [navigate, addNotification])
  
  // Don't render until auth state is loaded
  if (!isLoaded) return null
  
  // Only show for authenticated users (including anonymous)
  if (!isSignedIn) return null
  
  return (
    <>
      <Button 
        onClick={openCreateModal}
        variant="default"
        size="sm"
        aria-label="Add new song"
        title="Add a new song to the library"
      >
        <span style={{ marginRight: '4px' }}>+</span>
        Add Song
      </Button>
      
      <SongManagementModal
        isOpen={isOpen}
        onClose={closeModal}
        onSuccess={handleSuccess}
      />
    </>
  )
}
```

## Implementation Checklist

### Phase 1: Core Button Implementation
- [ ] Import necessary dependencies (Button, useAuth, hooks)
- [ ] Add authentication check with `isLoaded` guard
- [ ] Implement button with proper variant and size
- [ ] Add click handler to open modal
- [ ] Include accessibility attributes (aria-label, title)

### Phase 2: Modal Integration
- [ ] Import and use `useSongManagementModal` hook
- [ ] Add `SongManagementModal` component to render tree
- [ ] Connect modal state (isOpen, onClose)
- [ ] Implement success callback handler

### Phase 3: Success Flow
- [ ] Add notification system integration
- [ ] Implement navigation to new song page
- [ ] Handle modal closure after success
- [ ] Ensure proper cleanup

### Phase 4: Polish & Edge Cases
- [ ] Add loading state handling if needed
- [ ] Verify mobile responsiveness
- [ ] Test with different user roles (admin, regular, anonymous)
- [ ] Ensure proper keyboard navigation

## Authentication & Permissions

### Permission Matrix
```typescript
// Button visibility logic
if (!isLoaded) return null                    // Wait for auth to load
if (!isSignedIn) return null                  // Hide for non-authenticated
if (user?.is_anonymous) // Show with notice   // Anonymous users can create
if (user?.email) // Full access               // Regular users full access
```

### Guest User Considerations
The SongManagementForm already handles guest users with a notice at the bottom of the form. No additional handling needed in the button component.

## Styling Guidelines

### Button Styling
- Use `variant="default"` for primary action (blue background)
- Use `size="sm"` to fit header space (h-8 rounded-md px-3 text-xs)
- Include plus icon for visual clarity
- Maintain consistent spacing with other header elements

### Responsive Design
- Button text should remain visible on mobile
- Consider icon-only variant for very small screens (< 400px)
- Ensure modal works on all screen sizes (already handled by Modal component)

## Error Handling

### Network Errors
The SongManagementForm already handles all error cases:
- Form validation errors
- Network failures
- Duplicate detection
- Permission errors

### Error Boundary
The Layout component wraps pages in ErrorBoundary, so catastrophic errors are handled.

## Testing Scenarios

### Manual Testing Checklist
1. **Authentication States**
   - [ ] Button hidden when not signed in
   - [ ] Button visible when signed in
   - [ ] Button works for anonymous users
   
2. **Modal Behavior**
   - [ ] Modal opens on button click
   - [ ] Modal closes on cancel
   - [ ] Modal closes after successful creation
   - [ ] ESC key closes modal
   
3. **Success Flow**
   - [ ] Success notification appears
   - [ ] Navigation to new song works
   - [ ] Song appears in list after creation
   
4. **Edge Cases**
   - [ ] Multiple rapid clicks handled
   - [ ] Works with keyboard navigation (Tab + Enter)
   - [ ] Mobile touch events work correctly

## Validation Gates

```bash
# 1. Type checking - MUST PASS
npm run build

# 2. Linting - MUST PASS
npm run lint

# 3. Component renders without errors
# Start dev server and verify button appears in header
npm run dev
# Navigate to http://localhost:5173
# Verify button appears when logged in

# 4. Functional testing
# Click button -> Modal opens
# Fill form -> Submit -> Success notification -> Navigate to song

# 5. Test with different auth states
# Sign out -> Button should disappear
# Sign in -> Button should appear
# Use anonymous login -> Button should work

# 6. Mobile responsiveness
# Open browser dev tools
# Test at 320px, 768px, 1024px widths
# Verify button and modal work at all sizes

# 7. Accessibility check
# Tab navigation should reach button
# Enter key should open modal
# Screen reader should announce "Add new song" button
```

## Implementation Steps (Priority Order)

1. **Update AddSongButton.tsx** (15 minutes)
   - Copy the implementation blueprint
   - Adjust imports to match exact file paths
   - Save file

2. **Test Authentication States** (5 minutes)
   - Sign out and verify button hidden
   - Sign in and verify button visible
   - Test anonymous user flow

3. **Test Modal Integration** (5 minutes)
   - Click button to open modal
   - Fill form with test data
   - Submit and verify success

4. **Verify Success Flow** (5 minutes)
   - Check notification appears
   - Verify navigation to new song
   - Confirm song in list

5. **Run Validation Gates** (5 minutes)
   - Execute all validation commands
   - Fix any issues that arise

## Common Pitfalls to Avoid

1. **Don't forget `isLoaded` check** - Prevents flash of wrong auth state
2. **Don't modify existing files** - Only update AddSongButton.tsx
3. **Don't add unnecessary dependencies** - Everything needed is already available
4. **Don't create new hooks** - Use existing useSongManagementModal
5. **Don't forget cleanup** - Modal handles its own cleanup via the hook

## Success Criteria

- [ ] Button appears in header for authenticated users only
- [ ] Clicking button opens the song creation modal
- [ ] Successfully creating a song shows notification
- [ ] After creation, user is navigated to the new song's page
- [ ] All validation gates pass
- [ ] Works on mobile devices
- [ ] Accessible via keyboard navigation

## External Documentation References

- [React 19 Hooks Documentation](https://react.dev/reference/react/hooks)
- [React Router v7 Navigation](https://reactrouter.com/en/main/hooks/use-navigate)
- [Shadcn/ui Button Component](https://ui.shadcn.com/docs/components/button)
- [Tanstack Query Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

## Notes for Implementation

This is a straightforward implementation since all the complex infrastructure is already in place. The main task is connecting the existing pieces:

1. The AddSongButton component exists but needs implementation
2. The modal system is fully functional and tested
3. The authentication system is mature and reliable
4. The notification system is ready to use
5. Navigation patterns are established

The implementation should take approximately 30-45 minutes including testing.

---

**Implementation Confidence: 9.5/10**

The only reason this isn't 10/10 is the need to verify the exact import paths during implementation. All systems are in place and working, making this a low-risk, high-confidence implementation.