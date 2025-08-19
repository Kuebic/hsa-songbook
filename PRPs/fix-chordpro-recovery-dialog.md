name: "TypeScript PRP - Fix ChordPro Editor Recovery Dialog Behavior"
description: |

---

## Goal

**Feature Goal**: Fix the ChordPro editor recovery dialog to appear only when necessary, close properly after user interaction, and ensure both "Discard Changes" and "Recover Changes" options work correctly.

**Deliverable**: Corrected recovery dialog behavior in the ChordPro editor component with proper state management and user action handling.

**Success Definition**: Recovery dialog appears only when there are actual unsaved drafts, disappears immediately after user selection, and both recovery/discard actions execute correctly without modal reappearance.

## User Persona

**Target User**: Content editors and song arrangement creators using the ChordPro editor

**Use Case**: User returns to edit an arrangement after browser crash, tab closure, or accidental navigation away with unsaved changes

**User Journey**: 
1. User navigates to ChordPro editor for an arrangement
2. System checks for unsaved drafts from previous session
3. IF draft exists: Recovery dialog appears with preview
4. User chooses to either recover or discard changes
5. Dialog closes immediately after selection
6. Editor loads with chosen state (recovered content or fresh start)

**Pain Points Addressed**: 
- Prevents frustrating loss of work due to unexpected closures
- Eliminates annoying persistent modals that won't close
- Provides clear preview of what will be recovered

## Why

- **Business Value**: Reduces user frustration and support tickets related to lost work
- **User Impact**: Ensures reliable auto-save recovery without UI annoyances
- **Integration**: Critical for editor reliability and professional user experience
- **Problems Solved**: Modal appearing when unnecessary, modal not closing after selection, recovery/discard actions not properly clearing state

## What

The recovery dialog currently has three main issues:
1. Modal appears even when there's no real draft to recover
2. Modal doesn't close properly after user makes a selection
3. Recovery state persists causing modal to reappear

### Success Criteria

- [ ] Recovery dialog only appears when actual draft exists for current arrangement/user
- [ ] Modal closes immediately when user clicks "Recover Changes"
- [ ] Modal closes immediately when user clicks "Discard Changes"
- [ ] Draft is properly loaded when recovering
- [ ] Draft is properly deleted when discarding
- [ ] Modal does not reappear after user makes a selection
- [ ] No console errors during recovery flow

## All Needed Context

### Context Completeness Check

_Validated: This PRP contains all implementation details, patterns, and gotchas needed for successful one-pass implementation._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://react.dev/reference/react/useEffect#removing-unnecessary-object-dependencies
  why: Understanding useEffect dependencies to prevent infinite loops
  critical: Modal state updates triggering unwanted re-renders

- url: https://react.dev/learn/synchronizing-with-effects#you-might-not-need-an-effect
  why: Proper state synchronization between hasDraft and showRecoveryModal
  critical: Avoiding duplicate state that causes sync issues

- url: https://headlessui.com/react/dialog
  why: Reference for proper modal lifecycle management
  critical: Understanding controlled vs uncontrolled modal patterns

- file: src/features/arrangements/components/ChordProEditor/index.tsx
  why: Main editor component managing recovery dialog state
  pattern: Lines 180-196 show problematic useEffect causing modal persistence
  gotcha: showRecoveryModal local state duplicates hasDraft causing sync issues

- file: src/features/arrangements/components/ChordProEditor/RecoveryDialog.tsx
  why: Recovery dialog component implementation
  pattern: Proper modal props and action handlers
  gotcha: onDiscard is async but modal close happens synchronously

- file: src/features/arrangements/hooks/useSessionRecovery.ts
  why: Core recovery hook managing draft detection and recovery
  pattern: acceptDraft() method properly clears hasDraft state
  gotcha: discardDraft is async and can throw errors

- file: src/shared/components/modal/Modal.tsx
  why: Base modal component with proper open/close lifecycle
  pattern: isOpen prop controls dialog.showModal() and dialog.close()
  gotcha: Modal has built-in animation delays that must complete

- docfile: src/features/arrangements/docs/AUTO_SAVE_ARCHITECTURE.md
  why: Complete understanding of draft storage and recovery flow
  section: Recovery Flow and Conditions
```

### Current Codebase Structure

```bash
src/features/arrangements/
├── components/
│   └── ChordProEditor/
│       ├── index.tsx                 # Main editor with recovery state management
│       ├── RecoveryDialog.tsx        # Recovery modal component
│       └── ...other editor components
├── hooks/
│   ├── useSessionRecovery.ts         # Draft detection and recovery logic
│   ├── useAutoSave.ts               # Auto-save functionality
│   └── useExitSave.ts               # MongoDB save on exit
├── services/
│   └── EditorStorageService.ts      # Storage layer (IndexedDB/SessionStorage)
└── types/
    └── command.types.ts             # Command history types

src/shared/components/modal/
├── Modal.tsx                         # Base modal component
├── hooks/
│   ├── useModal.ts                  # Modal stacking context
│   └── useModalFocus.ts             # Focus management
└── types/
    └── modal.types.ts               # Modal prop types
```

### Problematic Code Analysis

**Current Issue in ChordProEditor/index.tsx (lines 180-196):**
```typescript
// Local state duplicating hasDraft from hook
const [showRecoveryModal, setShowRecoveryModal] = useState(false);

// Problematic useEffect causing modal persistence
useEffect(() => {
  if (hasDraft && !isCheckingRecovery) {
    setShowRecoveryModal(true);  // Sets local state
  } else {
    setShowRecoveryModal(false);
  }
}, [hasDraft, isCheckingRecovery]);

// Problem: When user clicks recover/discard, hasDraft becomes false
// but if the draft clearing fails or is delayed, hasDraft might 
// become true again, causing modal to reappear
```

**Current Recovery Handlers (lines 254-272):**
```typescript
const handleRecoverDraft = useCallback(() => {
  const draft = recoverDraft();
  if (draft) {
    updateContent(draft.content);
    acceptDraft(); // Updates hasDraft to false in hook
  }
  setShowRecoveryModal(false); // Local state update
}, [recoverDraft, updateContent, acceptDraft]);

const handleDiscardDraft = useCallback(async () => {
  setShowRecoveryModal(false); // Immediate close
  try {
    await discardDraft(); // Async operation that updates hasDraft
  } catch (error) {
    console.error('Failed to discard draft:', error);
  }
}, [discardDraft]);
```

### Known Gotchas & Issues

```typescript
// CRITICAL: Duplicate state between showRecoveryModal and hasDraft causes sync issues
// CRITICAL: useEffect re-triggers when hasDraft changes, potentially reopening modal
// CRITICAL: Async discardDraft might fail silently, leaving draft in place
// CRITICAL: acceptDraft() only clears hook state, doesn't delete actual draft
// GOTCHA: Modal animation duration (200ms) must complete before state changes
// GOTCHA: Recovery dialog forces user choice (no ESC/overlay close)
```

## Implementation Blueprint

### Implementation Tasks

```yaml
Task 1: FIX src/features/arrangements/components/ChordProEditor/index.tsx - Modal State Management
  - REMOVE: Duplicate showRecoveryModal state (line 181)
  - REMOVE: Problematic useEffect synchronizing states (lines 184-191)
  - USE: hasDraft directly from useSessionRecovery hook for modal visibility
  - IMPLEMENT: Proper one-time check for draft on mount only
  - PATTERN: Direct binding of modal visibility to hook state

Task 2: FIX src/features/arrangements/components/ChordProEditor/index.tsx - Recovery Handler
  - UPDATE: handleRecoverDraft to properly clear draft after recovery
  - ADD: await discardDraft() call after successful recovery to remove storage
  - ENSURE: acceptDraft() is called to update hook state
  - ADD: Error handling for draft clearing failures
  - PATTERN: Complete cleanup after successful recovery

Task 3: FIX src/features/arrangements/components/ChordProEditor/index.tsx - Discard Handler  
  - UPDATE: handleDiscardDraft to properly await async operation
  - ADD: Proper error handling with user notification
  - ENSURE: Modal closes only after successful discard
  - ADD: Loading state during async operation if needed
  - PATTERN: Proper async/await with error boundaries

Task 4: UPDATE src/features/arrangements/components/ChordProEditor/index.tsx - Modal Props
  - CHANGE: RecoveryDialog isOpen prop to use hasDraft directly
  - ENSURE: No intermediate state variables
  - VERIFY: Modal animations complete properly
  - TEST: Modal lifecycle with proper open/close transitions

Task 5: FIX src/features/arrangements/hooks/useSessionRecovery.ts - Accept Draft Behavior
  - UPDATE: acceptDraft to also delete the draft from storage
  - ENSURE: Draft is removed after successful recovery
  - ADD: Try-catch for storage deletion failures
  - PATTERN: Complete cleanup on accept, not just state update

Task 6: ADD Defensive Check in useSessionRecovery.ts - Mount Behavior
  - ADD: Flag to prevent re-checking after user action
  - IMPLEMENT: "hasUserActed" state to prevent re-triggering
  - ENSURE: Check only runs once on mount unless explicitly refreshed
  - PATTERN: One-time initialization pattern
```

### Implementation Patterns & Key Details

```typescript
// PATTERN 1: Direct state binding without intermediate variables
// In ChordProEditor/index.tsx around line 254

// REMOVE this pattern:
const [showRecoveryModal, setShowRecoveryModal] = useState(false);
useEffect(() => {
  if (hasDraft && !isCheckingRecovery) {
    setShowRecoveryModal(true);
  }
}, [hasDraft, isCheckingRecovery]);

// REPLACE with direct binding:
// Just use hasDraft directly in the RecoveryDialog component
<RecoveryDialog
  isOpen={hasDraft && !isCheckingRecovery}  // Direct binding
  onRecover={handleRecoverDraft}
  onDiscard={handleDiscardDraft}
  // ... other props
/>

// PATTERN 2: Complete recovery handler with cleanup
const handleRecoverDraft = useCallback(async () => {
  const draft = recoverDraft();
  if (draft) {
    // Load the draft content
    updateContent(draft.content);
    
    // Mark as accepted in hook state
    acceptDraft();
    
    // Important: Also delete the draft from storage
    try {
      await discardDraft(); // This ensures draft is removed
    } catch (error) {
      console.error('Failed to clear recovered draft:', error);
      // Non-critical error, continue
    }
  }
}, [recoverDraft, updateContent, acceptDraft, discardDraft]);

// PATTERN 3: Proper async discard handler
const handleDiscardDraft = useCallback(async () => {
  try {
    // Await the async discard operation
    await discardDraft();
    // Modal will close automatically when hasDraft becomes false
  } catch (error) {
    console.error('Failed to discard draft:', error);
    // Could show error toast here if notification system exists
  }
}, [discardDraft]);

// PATTERN 4: Updated acceptDraft in useSessionRecovery.ts
const acceptDraft = useCallback(async () => {
  // Clear the state first
  setRecoveryState(prev => ({ 
    ...prev, 
    hasDraft: false,
    draftData: null 
  }));
  
  // Also delete the draft from storage
  try {
    await storageService.current.deleteDraft(arrangementId, userId);
  } catch (error) {
    console.error('Failed to delete accepted draft:', error);
    // Non-critical, draft will age out eventually
  }
}, [arrangementId, userId]);

// PATTERN 5: One-time mount check in useSessionRecovery.ts
const hasCheckedRef = useRef(false);

useEffect(() => {
  if (!enabled || hasCheckedRef.current) {
    return; // Only check once
  }
  
  hasCheckedRef.current = true;
  checkForDraft();
}, [enabled]); // Remove other dependencies to prevent re-runs
```

### Integration Points

```yaml
WITHIN FEATURE (arrangements):
  - ChordProEditor/index.tsx controls modal visibility
  - RecoveryDialog.tsx handles user interaction
  - useSessionRecovery.ts manages draft state
  - EditorStorageService.ts handles storage operations

SHARED DEPENDENCIES:
  - Modal component provides base dialog functionality
  - Theme context for styling
  - Auth context for user identification

STORAGE LAYERS:
  - SessionStorage for quick access (4MB limit)
  - IndexedDB for persistent storage (50MB limit)
  - Compression with LZ-String for efficiency

STATE FLOW:
  1. Component mount → useSessionRecovery checks for draft
  2. If draft exists → hasDraft becomes true
  3. RecoveryDialog opens (isOpen={hasDraft})
  4. User action → handler updates state and storage
  5. hasDraft becomes false → modal closes
  6. No re-checking occurs after user action
```

## Validation Loop

### Level 1: Syntax & Type Checking

```bash
# Run after making changes
npm run lint                    # ESLint checks
npx tsc --noEmit               # TypeScript validation

# Expected: Zero errors
```

### Level 2: Component Testing

```bash
# Test the affected components
npm test -- ChordProEditor
npm test -- RecoveryDialog
npm test -- useSessionRecovery

# Expected: All tests pass
```

### Level 3: Integration Testing

```bash
# Start dev server
npm run dev

# Manual test flow:
# 1. Open editor, make changes, close tab
# 2. Reopen editor - recovery dialog should appear
# 3. Click "Recover Changes" - modal should close, content restored
# 4. Repeat test with "Discard Changes" - modal should close, fresh editor
# 5. Verify modal doesn't reappear after either action
# 6. Check browser console for any errors

# Expected: Smooth recovery flow, no console errors
```

### Level 4: Edge Case Testing

```bash
# Test scenarios:
# 1. Multiple tabs with same arrangement
# 2. User logout during edit session
# 3. Storage quota exceeded
# 4. Network failure during discard
# 5. Rapid navigation away and back

# Verification commands:
# Check IndexedDB state
# In browser console:
await window.indexedDB.databases()

# Check SessionStorage
Object.keys(sessionStorage).filter(k => k.includes('chord-editor'))

# Expected: Proper cleanup, no orphaned drafts
```

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation passes: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`
- [ ] Tests pass: `npm test`
- [ ] Dev server runs without errors: `npm run dev`
- [ ] No console errors during recovery flow

### Feature Validation

- [ ] Recovery dialog only appears when draft exists
- [ ] Modal closes immediately on "Recover Changes"
- [ ] Modal closes immediately on "Discard Changes"
- [ ] Recovered content loads correctly
- [ ] Discarded draft is deleted from storage
- [ ] Modal does not reappear after user action
- [ ] Edge cases handled gracefully

### Code Quality Validation

- [ ] No duplicate state between component and hook
- [ ] Direct state binding used (no intermediate variables)
- [ ] Async operations properly awaited
- [ ] Error handling in place for storage failures
- [ ] One-time mount check implemented
- [ ] Storage cleanup after recovery/discard

### User Experience Validation

- [ ] Smooth modal open/close animations
- [ ] Clear feedback on user actions
- [ ] No UI flickering or jumping
- [ ] Responsive to user input
- [ ] Accessible keyboard navigation maintained

---

## Anti-Patterns Avoided

✅ No duplicate state synchronization with useEffect
✅ No unhandled async operations  
✅ No infinite re-render loops
✅ No orphaned drafts in storage
✅ No ignored error states
✅ No race conditions between state updates