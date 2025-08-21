# HSA Songbook MVP Feature Verification List

This document provides a systematic guide for verifying every feature of the HSA Songbook MVP, organized from most foundational to advanced features.

## 1. Core Infrastructure & App Foundation

### Files to Check:
- **Entry Point**: `src/app/main.tsx`
- **Layout & Theme**: `src/shared/components/Layout.tsx`, `src/shared/components/ThemeToggle.tsx`
- **Error Handling**: `src/features/monitoring/components/ErrorBoundary.tsx`, `src/features/monitoring/components/ErrorFallback.tsx`
- **Global Styles**: Various feature-specific CSS files

### What to Verify:
- App initializes without errors
- Theme toggle works (light/dark mode)
- Error boundaries catch and display errors gracefully
- Layout renders correctly on different screen sizes

## 2. Authentication System

### Files to Check:
- **Core Auth**: `src/features/auth/hooks/useAuth.ts`
- **Components**: `src/features/auth/components/AuthButtons.tsx`, `src/features/auth/components/UserMenu.tsx`
- **Protected Routes**: `src/features/auth/components/ProtectedRoute.tsx`

### What to Verify:
- Login/logout functionality works
- Protected routes redirect unauthenticated users
- User menu displays current user info
- Auth state persists across page refreshes

## 3. Data Layer & State Management

### Files to Check:
- **React Query Setup**: Check usage in service files
- **IndexedDB Storage**: `idb` usage in `src/features/arrangements/services/EditorStorageService.ts`
- **Local Storage Hooks**: `src/features/arrangements/hooks/useLocalStorage.ts`

### What to Verify:
- Data caching works properly
- Offline data persistence
- State synchronization across components
- Optimistic updates function correctly

## 4. Songs Core Feature

### Files to Check:
- **Song List**: `src/features/songs/components/SongList.tsx`, `src/features/songs/pages/SongListPage.tsx`
- **Song Card**: `src/features/songs/components/SongCard.tsx`
- **Song Details**: `src/features/songs/components/SongViewer.tsx`, `src/features/songs/pages/SongDetailPage.tsx`
- **Song Service**: `src/features/songs/services/songService.ts`
- **Song Mutations**: `src/features/songs/hooks/useSongMutations.ts`

### What to Verify:
- Song list displays all songs
- Song cards show correct information
- Click on song navigates to detail view
- Song data loads from backend/cache

## 5. Song Management Features

### Files to Check:
- **Create/Edit Songs**: `src/features/songs/components/forms/SongForm.tsx`
- **Inline Editing**: `src/features/songs/components/InlineEditField.tsx`
- **Form Validation**: `src/features/songs/validation/schemas/songFormSchema.ts`
- **Duplicate Detection**: `src/features/songs/validation/utils/duplicateDetection.ts`

### What to Verify:
- Can create new songs
- Can edit existing songs
- Form validation prevents invalid data
- Duplicate song detection works
- Inline editing saves changes

## 6. Arrangements System

### Files to Check:
- **Arrangement List**: `src/features/songs/components/arrangements/ArrangementList.tsx`
- **Arrangement Form**: `src/features/songs/components/arrangements/ArrangementForm.tsx`
- **Simple Form**: `src/features/songs/components/arrangements/SimpleArrangementForm.tsx`
- **Arrangement Service**: `src/features/songs/services/arrangementService.ts`

### What to Verify:
- Can add arrangements to songs
- Can edit existing arrangements
- Multiple arrangements per song work
- Arrangement switching functions properly

## 7. ChordPro Editor

### Files to Check:
- **Main Editor**: `src/features/arrangements/components/ChordProEditor/index.tsx`
- **Text Area**: `src/features/arrangements/components/ChordProEditor/ChordProTextArea.tsx`
- **Preview Pane**: `src/features/arrangements/components/ChordProEditor/PreviewPane.tsx`
- **Syntax Highlighting**: `src/features/arrangements/components/ChordProEditor/SyntaxHighlighter.tsx`
- **Auto-Save**: `src/features/arrangements/hooks/useAutoSave.ts`

### What to Verify:
- ChordPro syntax highlighting works
- Live preview updates as you type
- Auto-save prevents data loss
- Chord directives are recognized
- Undo/redo functionality works

## 8. Chord Display & Transposition

### Files to Check:
- **Chord Viewer**: `src/features/arrangements/components/ChordSheetViewer.tsx`
- **Transpose Controls**: `src/features/arrangements/components/TransposeControls.tsx`
- **Key Selector**: `src/features/arrangements/components/KeySelector.tsx`
- **Enharmonic Toggle**: `src/features/arrangements/components/EnharmonicToggle.tsx`

### What to Verify:
- Chords display correctly above lyrics
- Transpose up/down changes all chords
- Key selector updates arrangement key
- Enharmonic toggle switches between sharps/flats
- Capo position calculations work

## 9. Setlists Feature

### Files to Check:
- **Setlist Grid**: `src/features/setlists/components/SetlistGrid.tsx`
- **Create Setlist**: `src/features/setlists/components/CreateSetlistForm.tsx`
- **Setlist Builder**: `src/features/setlists/components/SetlistBuilder.tsx`
- **Drag & Drop**: `src/features/setlists/hooks/useDragAndDropEnhanced.ts`
- **Setlist Service**: `src/features/setlists/services/setlistService.ts`

### What to Verify:
- Can create new setlists
- Can add songs to setlists
- Drag & drop reordering works
- Setlist saves persist
- Can delete/edit setlists

## 10. Playback Mode

### Files to Check:
- **Playback Controls**: `src/features/setlists/components/playback/PlaybackControls.tsx`
- **Playback Mode**: `src/features/setlists/components/playback/PlaybackMode.tsx`
- **Playback Context**: `src/features/setlists/contexts/PlaybackContext.tsx`

### What to Verify:
- Playback mode displays songs fullscreen
- Next/previous navigation works
- Auto-scroll functionality
- Transpose during playback
- Exit playback returns to setlist

## 11. Search Functionality

### Files to Check:
- **Search Bar**: `src/features/search/components/SearchBar.tsx`
- **Search Results**: `src/features/search/components/SearchResults.tsx`
- **Search Hook**: `src/features/search/hooks/useSearch.ts`

### What to Verify:
- Search finds songs by title
- Search finds songs by artist
- Search finds songs by lyrics
- Search results update as you type
- Click result navigates to song

## 12. PWA Features

### Files to Check:
- **Service Worker**: `src/features/pwa/hooks/useServiceWorker.ts`
- **Install Prompt**: `src/features/pwa/components/InstallPrompt.tsx`
- **Offline Indicator**: `src/features/pwa/components/OfflineIndicator.tsx`
- **Update Prompt**: `src/features/pwa/components/UpdatePrompt.tsx`
- **Offline Fallback**: `src/features/pwa/components/OfflineFallback.tsx`

### What to Verify:
- Install prompt appears on supported browsers
- App works offline after first load
- Offline indicator shows when disconnected
- Update prompt appears for new versions
- Cached data available offline

## 13. Ratings & Reviews

### Files to Check:
- **Rating Widget**: `src/features/songs/components/ratings/RatingWidget.tsx`
- **Review Form**: `src/features/songs/components/ratings/ReviewForm.tsx`
- **Review Service**: `src/features/songs/services/reviewService.ts`

### What to Verify:
- Can rate songs (1-5 stars)
- Can write text reviews
- Reviews display for each song
- Average rating calculates correctly
- Only authenticated users can review

## 14. Admin Features

### Files to Check:
- **Admin Dashboard**: `src/features/songs/components/admin/AdminDashboard.tsx`
- **Theme Manager**: `src/features/songs/components/admin/ThemeManager.tsx`
- **Duplicate Manager**: `src/features/songs/components/admin/DuplicateManager.tsx`

### What to Verify:
- Admin dashboard accessible to admins only
- Can manage song themes/categories
- Duplicate detection and merging works
- Bulk operations function properly

## 15. Notification System

### Files to Check:
- **Notification Provider**: `src/shared/components/notifications/NotificationProvider.tsx`
- **Notification Hook**: `src/shared/components/notifications/useNotification.ts`

### What to Verify:
- Success notifications appear for actions
- Error notifications show on failures
- Notifications auto-dismiss
- Multiple notifications stack properly

## 16. Modal System

### Files to Check:
- **Modal Provider**: `src/shared/components/modal/ModalProvider.tsx`
- **Modal Hook**: `src/shared/components/modal/hooks/useModal.ts`

### What to Verify:
- Modals open/close properly
- ESC key closes modals
- Click outside closes modals
- Modal focus management works
- Nested modals handled correctly

## Testing Order Recommendation

1. Start with Core Infrastructure (Section 1)
2. Verify Authentication (Section 2)
3. Check Data Layer (Section 3)
4. Test Songs Core Feature (Section 4)
5. Verify Song Management (Section 5)
6. Test Arrangements (Section 6)
7. Verify ChordPro Editor (Section 7)
8. Test Chord Display (Section 8)
9. Continue with remaining features in order

## Notes

- Test each feature in both online and offline modes
- Verify mobile responsiveness for all features
- Check accessibility (keyboard navigation, screen readers)
- Test with different user roles (guest, user, admin)
- Verify data persistence across sessions


---

  Recommended Approach:

  1. Delete broken tests

  Start clean rather than fixing outdated tests

  2. Focus on integration tests first

  - Test user workflows, not implementation
  - Example: "User can create a song with arrangements"
  - These survive refactoring better

  3. Add unit tests for critical logic

  - Transposition algorithms
  - ChordPro parsing
  - Validation logic
  - Not for simple components

  4. Use Testing Library best practices

  - Test behavior, not implementation
  - Query by role/text, not test-ids
  - Don't test framework code

  5. Start with the most important features

  - Authentication flow
  - Song creation/editing
  - Arrangement editing
  - Setlist building

  Want me to help you:
  1. Remove the broken tests
  2. Set up a clean testing foundation
  3. Write a few example tests showing best practices?

  This would give you a fresh start with maintainable tests that actually provide value.
