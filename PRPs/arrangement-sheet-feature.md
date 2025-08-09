name: "HSA Songbook Arrangement Sheet - Add/Edit Arrangements with Song Page Integration"
description: |
  Build a comprehensive arrangement management system using a modal sheet for adding/editing arrangements and display multiple arrangements on song pages with selection capabilities.

---

## Goal

**Feature Goal**: Enable users to add, edit, and manage multiple arrangements for songs through an intuitive modal sheet interface, with arrangements displayed and selectable on song pages.

**Deliverable**: Modal-based arrangement form sheet with full CRUD operations, integrated arrangement display on song pages with selection UI, and seamless user experience for managing multiple arrangements per song.

**Success Definition**: 
- Users can add new arrangements to songs via modal sheet
- Multiple arrangements are displayed on song detail pages
- Users can switch between different arrangements seamlessly
- Admin users can edit/delete arrangements
- Form validation and error handling work correctly
- Mobile-responsive design with good UX
- All existing arrangement functionality preserved

## User Persona

**Target User**: HSA worship team members, music directors, and congregation members

**Use Case**: Musicians need to create custom arrangements for songs (different keys, simplified versions, performance variations) and easily switch between them during practice or performance.

**User Journey**: 
1. User views a song detail page
2. Sees available arrangements listed (or "Add first arrangement" prompt)
3. Clicks "Add Arrangement" button to open modal sheet
4. Fills out arrangement form with ChordPro data, key, tempo, etc.
5. Saves arrangement and sees it appear on song page
6. Can switch between multiple arrangements using tabs/dropdown
7. Admin users can edit or delete arrangements as needed

**Pain Points Addressed**: 
- Currently only shows first arrangement with no selection UI
- No interface to add arrangements directly from song pages
- No way to manage multiple arrangements per song
- Arrangement functionality exists but is not user-accessible

## Why

- **User Need**: Musicians need different arrangements for various contexts (youth vs adult service, different skill levels, key preferences)
- **Feature Completeness**: Arrangement infrastructure exists but lacks user-facing UI
- **Performance Enhancement**: Multiple arrangements enable flexible worship leading
- **Accessibility**: Different difficulty levels make songs accessible to more musicians
- **User Experience**: Seamless arrangement management improves workflow

## What

Implement a modal-based arrangement management system that integrates with existing song pages, allowing users to add, edit, view, and switch between multiple arrangements while maintaining the vertical slice architecture.

### Current State
- ArrangementForm.tsx exists with comprehensive ChordPro editing
- ArrangementList.tsx exists but not integrated into song pages
- Service layer and hooks fully implemented
- Modal infrastructure complete and working
- SongDetailPage only shows first arrangement

### Target State
- Modal sheet for adding/editing arrangements
- Arrangement list integrated into song detail pages
- Arrangement switcher UI (tabs for ≤4, dropdown for >4)
- Add/Edit/Delete actions based on user permissions
- Mobile-responsive design with touch-friendly interactions

### Success Criteria

- [ ] ArrangementSheet component created using existing Modal infrastructure
- [ ] "Add Arrangement" button visible on song pages for authenticated users
- [ ] ArrangementList integrated into SongDetailPage
- [ ] Arrangement switcher allows selection between multiple arrangements
- [ ] Form validation works with proper error messages
- [ ] Success notifications appear after adding/editing arrangements
- [ ] Mobile responsive with good touch UX
- [ ] Existing arrangement functionality preserved
- [ ] Role-based permissions enforced (admin can delete, users can add/edit)
- [ ] Tests pass with >70% coverage for new components

## All Needed Context

### Context Completeness Check

_This PRP provides comprehensive context including existing arrangement infrastructure analysis, modal patterns, vertical slice architecture, UI/UX best practices, and detailed implementation patterns. All necessary context for successful one-pass implementation is included._

### Documentation & References

```yaml
# MUST READ - Critical Implementation References
- file: /src/features/songs/components/arrangements/ArrangementForm.tsx
  why: Comprehensive arrangement form with ChordPro editor to use in modal
  pattern: Form validation, ChordPro auto-detection, field organization
  gotcha: Uses shared form components requiring FormProvider context

- file: /src/features/songs/components/arrangements/ArrangementList.tsx
  why: Existing arrangement list component to integrate into song pages
  pattern: Role-based actions, visual indicators, empty states
  gotcha: Already handles permissions but not integrated into song pages

- file: /src/shared/components/modal/Modal.tsx
  why: Custom modal infrastructure to wrap arrangement form
  pattern: Size variants, accessibility, animation, backdrop handling
  gotcha: ModalProvider not wrapped in App - works with fallback

- file: /src/features/songs/components/forms/SongFormModal.tsx
  why: Example of form-in-modal pattern to follow
  pattern: Modal wrapper, form submission, loading states, notifications
  gotcha: Shows successful integration pattern with existing forms

- file: /src/features/songs/pages/SongDetailPage.tsx
  why: Target page for arrangement integration
  pattern: Song fetching, arrangement loading, page structure
  gotcha: Currently only shows first arrangement - needs selector UI

- file: /src/features/songs/components/SongViewer.tsx
  why: Component that displays arrangement - needs multi-arrangement support
  pattern: Arrangement display, metadata badges, chord rendering
  gotcha: Receives single arrangement prop - needs refactoring

- file: /src/features/songs/hooks/useArrangementMutations.ts
  why: Existing mutations for arrangement CRUD operations
  pattern: Create, update, delete with auth and error handling
  gotcha: Already includes optimistic updates and notifications

- file: /src/features/songs/services/arrangementService.ts
  why: API service layer for arrangement operations
  pattern: Caching, retry logic, filter support, request deduplication
  gotcha: 30-second cache TTL, handles song-specific filtering

- file: /src/features/songs/validation/schemas/arrangementSchema.ts
  why: Comprehensive validation schemas for arrangements
  pattern: Zod schemas, ChordPro validation, musical constants
  gotcha: Includes field-level schemas for inline editing

- url: https://ui.shadcn.com/docs/components/sheet
  why: Sheet component patterns for React (reference only)
  critical: We'll use existing Modal instead of external sheet library

- url: https://ui.shadcn.com/docs/components/tabs
  why: Tab patterns for arrangement switching UI
  critical: Use tabs for ≤4 arrangements, dropdown for >4

- url: https://react-hook-form.com/docs/useform
  why: Form state management patterns if migrating to React Hook Form
  critical: Current forms use custom FormProvider - maintain consistency
```

### Current Codebase Tree

```bash
src/
├── features/
│   ├── songs/
│   │   ├── components/
│   │   │   ├── arrangements/         # Arrangement components (mostly complete)
│   │   │   │   ├── ArrangementForm.tsx       # Full form (to use in modal)
│   │   │   │   ├── ArrangementList.tsx       # List view (to integrate)
│   │   │   │   ├── SimpleArrangementForm.tsx # Simplified version
│   │   │   │   ├── ChordEditor.tsx           # Advanced editor
│   │   │   │   ├── SimpleChordEditor.tsx     # Basic editor
│   │   │   │   └── KeySelect.tsx             # Key selector
│   │   │   ├── forms/
│   │   │   │   ├── SongForm.tsx              # Main song form
│   │   │   │   ├── SongFormModal.tsx         # Modal pattern example
│   │   │   │   └── AddSongButton.tsx         # Trigger pattern example
│   │   │   ├── SongCard.tsx          # Song card in list
│   │   │   ├── SongList.tsx          # Song grid container
│   │   │   └── SongViewer.tsx        # Song detail display (needs update)
│   │   ├── hooks/
│   │   │   ├── useArrangements.ts            # Fetching arrangements
│   │   │   └── useArrangementMutations.ts    # CRUD operations
│   │   ├── pages/
│   │   │   ├── SongDetailPage.tsx    # Target for integration
│   │   │   └── SongListPage.tsx      # Song library page
│   │   ├── services/
│   │   │   └── arrangementService.ts # API layer (complete)
│   │   ├── types/
│   │   │   └── song.types.ts         # Arrangement interface
│   │   └── validation/
│   │       └── schemas/
│   │           └── arrangementSchema.ts # Validation schemas
│   └── shared/
│       ├── components/
│       │   ├── modal/                 # Modal infrastructure
│       │   │   ├── Modal.tsx          # Main modal component
│       │   │   ├── ModalProvider.tsx  # Context provider
│       │   │   └── useModal.ts        # Modal hook
│       │   ├── form/                  # Form components
│       │   └── notifications/         # Notification system
│       └── utils/
```

### Vertical Slice Architecture Analysis

**Songs Feature Slice Boundaries**:
```yaml
src/features/songs/:              # Complete songs feature slice
  - types/song.types.ts           # Arrangement interface defined here
  - components/arrangements/       # All arrangement UI components
  - hooks/                        # Arrangement state management
  - services/                     # Arrangement API layer
  - pages/                        # Song pages for integration
  - validation/                   # Arrangement validation

WITHIN SLICE (Self-contained):
  - Arrangement CRUD operations
  - Arrangement display components
  - Arrangement form and validation
  - Song-arrangement relationships
  - Arrangement selection logic

SHARED DEPENDENCIES (Allowed):
  - src/shared/components/modal/  # Generic modal infrastructure
  - src/shared/components/form/   # Form components
  - src/shared/components/notifications/ # User feedback
  - src/shared/utils/             # Generic utilities

CROSS-SLICE DEPENDENCIES:
  - features/auth for user permissions (via public API)
  - No other cross-slice dependencies needed
```

### Desired Codebase Tree with New Components

```bash
src/features/songs/
├── components/
│   ├── arrangements/
│   │   ├── ArrangementSheet.tsx      # NEW: Modal wrapper for form
│   │   ├── AddArrangementButton.tsx  # NEW: Trigger button
│   │   ├── ArrangementSwitcher.tsx   # NEW: Tab/dropdown selector
│   │   ├── ArrangementForm.tsx       # EXISTING: Use in sheet
│   │   └── ArrangementList.tsx       # EXISTING: Integrate in page
│   └── SongViewer.tsx                # UPDATE: Support multiple arrangements
├── pages/
│   └── SongDetailPage.tsx            # UPDATE: Add arrangement section
└── index.ts                          # UPDATE: Export new components
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Modal component size prop for large forms
// The existing Modal supports sizes: small, medium, large, fullscreen
// Use size="large" for arrangement form to provide enough space
<Modal size="large" isOpen={isOpen} onClose={onClose}>

// GOTCHA: ArrangementForm uses FormProvider context
// Must wrap with FormProvider if using shared form components
// Alternative: Use SimpleArrangementForm for simpler needs

// CRITICAL: Role-based permissions pattern
const { user } = useAuth()
const canEdit = user?.id === arrangement.userId || user?.role === 'admin'
const canDelete = user?.role === 'admin'

// GOTCHA: Arrangement service caching
// arrangementService has 30-second cache TTL
// Call refresh() after mutations to update cache
const { arrangements, refresh } = useArrangements(songId)

// CRITICAL: ChordPro auto-detection in ArrangementForm
// Form automatically extracts title, key, tempo from ChordPro content
// Don't override these unless user explicitly changes them

// GOTCHA: Modal animations and state
// Modal has enter/exit animations (300ms default)
// Don't unmount form immediately - let modal animation complete

// CRITICAL: Notification integration pattern
const { showNotification } = useNotification()
showNotification({
  type: 'success',
  title: 'Arrangement Added',
  message: 'Your arrangement has been saved'
})
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Existing Arrangement interface (from song.types.ts)
interface Arrangement {
  id: string
  name: string
  songIds: string[]  // Supports multi-song arrangements
  key: string
  tempo?: number
  timeSignature?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  chordData: string  // ChordPro format
  createdBy?: string
  createdAt?: Date
  updatedAt?: Date
}

// Props for new components
interface ArrangementSheetProps {
  isOpen: boolean
  onClose: () => void
  songId: string
  arrangement?: Arrangement  // For editing
  onSuccess?: () => void
}

interface ArrangementSwitcherProps {
  arrangements: Arrangement[]
  selectedId: string
  onSelect: (id: string) => void
  loading?: boolean
}

interface AddArrangementButtonProps {
  songId: string
  onArrangementAdded?: () => void
  variant?: 'primary' | 'secondary'
}
```

### Implementation Tasks (Ordered by Vertical Slice Completion)

```yaml
Task 1: CREATE src/features/songs/components/arrangements/ArrangementSheet.tsx
  - IMPLEMENT: Modal wrapper around ArrangementForm for add/edit operations
  - FOLLOW pattern: src/features/songs/components/forms/SongFormModal.tsx
  - DEPENDENCIES: Modal from shared, ArrangementForm, useArrangementMutations
  - PLACEMENT: Within arrangements subdirectory
  - SLICE BOUNDARY: Stays within songs feature, uses shared modal
  - CRITICAL: Handle both create (no arrangement prop) and edit (with arrangement)

Task 2: CREATE src/features/songs/components/arrangements/AddArrangementButton.tsx
  - IMPLEMENT: Button component that triggers ArrangementSheet modal
  - FOLLOW pattern: src/features/songs/components/forms/AddSongButton.tsx
  - DEPENDENCIES: ArrangementSheet from Task 1, useAuth for permissions
  - PLACEMENT: Within arrangements subdirectory
  - SLICE BOUNDARY: Self-contained trigger component
  - CRITICAL: Only show for authenticated users

Task 3: CREATE src/features/songs/components/arrangements/ArrangementSwitcher.tsx
  - IMPLEMENT: Tab/dropdown component for switching between arrangements
  - FOLLOW pattern: Tabs for ≤4 items, dropdown for >4
  - DEPENDENCIES: None - pure presentation component
  - PLACEMENT: Within arrangements subdirectory
  - SLICE BOUNDARY: Generic switcher within songs feature
  - CRITICAL: Mobile-responsive design, handle loading states

Task 4: UPDATE src/features/songs/components/SongViewer.tsx
  - IMPLEMENT: Support for multiple arrangements with switcher integration
  - FOLLOW pattern: Existing component structure, add arrangement selection
  - DEPENDENCIES: ArrangementSwitcher from Task 3
  - CHANGE: Accept arrangements array instead of single arrangement
  - SLICE BOUNDARY: Update internal to songs feature
  - CRITICAL: Maintain backward compatibility, handle no arrangements case

Task 5: UPDATE src/features/songs/pages/SongDetailPage.tsx
  - IMPLEMENT: Integrate arrangement management section
  - FOLLOW pattern: Current page structure, add arrangements below song info
  - DEPENDENCIES: All components from Tasks 1-4, useArrangements hook
  - INTEGRATION: ArrangementList, AddArrangementButton, updated SongViewer
  - SLICE BOUNDARY: Page-level integration within songs feature
  - CRITICAL: Fetch all arrangements, handle selection state

Task 6: CREATE src/features/songs/components/arrangements/__tests__/ArrangementSheet.test.tsx
  - IMPLEMENT: Unit tests for ArrangementSheet component
  - FOLLOW pattern: Existing test patterns in __tests__ directories
  - COVERAGE: Modal open/close, form submission, error handling
  - DEPENDENCIES: Testing utilities, mock providers
  - SLICE BOUNDARY: Test within feature slice
  - CRITICAL: Test both create and edit modes

Task 7: CREATE src/features/songs/components/arrangements/__tests__/ArrangementSwitcher.test.tsx
  - IMPLEMENT: Unit tests for ArrangementSwitcher
  - FOLLOW pattern: Component testing patterns
  - COVERAGE: Tab/dropdown rendering, selection events, edge cases
  - DEPENDENCIES: Testing library, mock data
  - SLICE BOUNDARY: Isolated component tests
  - CRITICAL: Test responsive behavior (tabs vs dropdown)

Task 8: UPDATE src/features/songs/index.ts
  - IMPLEMENT: Export new public components
  - FOLLOW pattern: Existing export structure
  - EXPORTS: ArrangementSheet, AddArrangementButton, ArrangementSwitcher
  - DEPENDENCIES: Components from previous tasks
  - SLICE BOUNDARY: Define public API for other features
  - CRITICAL: Only export what's needed externally
```

### Implementation Patterns & Key Details

```typescript
// ArrangementSheet.tsx - Modal wrapper pattern
import { Modal } from '@shared/components/modal'
import { ArrangementForm } from './ArrangementForm'
import { useArrangementMutations } from '../../hooks/useArrangementMutations'
import { useNotification } from '@shared/components/notifications'

export function ArrangementSheet({ 
  isOpen, 
  onClose, 
  songId, 
  arrangement,
  onSuccess 
}: ArrangementSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createArrangement, updateArrangement } = useArrangementMutations()
  const { showNotification } = useNotification()
  
  const handleSubmit = async (data: ArrangementFormData) => {
    setIsSubmitting(true)
    try {
      if (arrangement) {
        await updateArrangement(arrangement.id, data)
        showNotification({
          type: 'success',
          title: 'Arrangement Updated',
          message: 'Your changes have been saved'
        })
      } else {
        await createArrangement({ ...data, songIds: [songId] })
        showNotification({
          type: 'success',
          title: 'Arrangement Added',
          message: 'New arrangement created successfully'
        })
      }
      onSuccess?.()
      onClose()
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to save arrangement'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Modal 
      size="large" 
      isOpen={isOpen} 
      onClose={!isSubmitting ? onClose : undefined}
      title={arrangement ? 'Edit Arrangement' : 'Add New Arrangement'}
    >
      <ArrangementForm
        initialData={arrangement}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={onClose}
      />
    </Modal>
  )
}

// ArrangementSwitcher.tsx - Responsive tab/dropdown pattern
export function ArrangementSwitcher({ 
  arrangements, 
  selectedId, 
  onSelect,
  loading 
}: ArrangementSwitcherProps) {
  // Use tabs for ≤4 arrangements, dropdown for >4
  const useTabView = arrangements.length <= 4
  
  if (loading) {
    return <div>Loading arrangements...</div>
  }
  
  if (arrangements.length === 0) {
    return null
  }
  
  if (useTabView) {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {arrangements.map(arr => (
          <button
            key={arr.id}
            onClick={() => onSelect(arr.id)}
            style={{
              padding: '0.5rem 1rem',
              background: selectedId === arr.id ? '#3b82f6' : '#f3f4f6',
              color: selectedId === arr.id ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {arr.name || `${arr.key} - ${arr.difficulty}`}
          </button>
        ))}
      </div>
    )
  }
  
  return (
    <select
      value={selectedId}
      onChange={(e) => onSelect(e.target.value)}
      style={{
        padding: '0.5rem',
        borderRadius: '4px',
        border: '1px solid #d1d5db',
        marginBottom: '1rem'
      }}
    >
      {arrangements.map(arr => (
        <option key={arr.id} value={arr.id}>
          {arr.name || `${arr.key} - ${arr.difficulty}`}
        </option>
      ))}
    </select>
  )
}

// SongDetailPage.tsx - Integration pattern
export function SongDetailPage() {
  const { slug } = useParams()
  const { song } = useSong(slug)
  const { arrangements, refresh } = useArrangements(song?.id)
  const [selectedArrangementId, setSelectedArrangementId] = useState<string>()
  
  // Auto-select first arrangement
  useEffect(() => {
    if (arrangements.length > 0 && !selectedArrangementId) {
      setSelectedArrangementId(arrangements[0].id)
    }
  }, [arrangements])
  
  const selectedArrangement = arrangements.find(a => a.id === selectedArrangementId)
  
  return (
    <div style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Song header section */}
      <h1>{song?.title}</h1>
      
      {/* Arrangement management section */}
      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Arrangements</h2>
          <AddArrangementButton 
            songId={song?.id} 
            onArrangementAdded={refresh}
          />
        </div>
        
        {arrangements.length > 0 ? (
          <>
            <ArrangementSwitcher
              arrangements={arrangements}
              selectedId={selectedArrangementId}
              onSelect={setSelectedArrangementId}
            />
            <ArrangementList
              arrangements={arrangements}
              selectedId={selectedArrangementId}
              onSelect={setSelectedArrangementId}
              onEdit={(arr) => {/* Handle edit */}}
              onDelete={(id) => {/* Handle delete */}}
            />
          </>
        ) : (
          <p>No arrangements yet. Add one to get started!</p>
        )}
      </div>
      
      {/* Song viewer with selected arrangement */}
      {selectedArrangement && (
        <SongViewer
          song={song}
          arrangement={selectedArrangement}
        />
      )}
    </div>
  )
}
```

### Integration Points & Cross-Slice Dependencies

```yaml
WITHIN SONGS SLICE (Self-contained):
  - All arrangement components remain in songs feature
  - Arrangement state management via existing hooks
  - Song-arrangement relationships handled internally
  - Validation and services already in place

SHARED INFRASTRUCTURE USAGE:
  - Modal component for sheet functionality
  - Form components for arrangement form
  - Notification system for user feedback
  - Auth context for permissions

MINIMAL CROSS-SLICE:
  - Only import useAuth from features/auth
  - All other dependencies from shared or internal

API INTEGRATION:
  - Uses existing arrangementService
  - Leverages useArrangementMutations hook
  - Maintains cache consistency with refresh()

ROUTING:
  - No new routes needed
  - Integration happens on existing /songs/:slug page
  - Modal-based interaction keeps user in context
```

## Validation Loop

### Level 1: Syntax & Style (After Each Component)

```bash
# Run after each file creation - fix before proceeding
npm run lint                    # ESLint checks
npm run build                   # Vite build validation
npx tsc --noEmit               # TypeScript type checking

# Check for unused imports and variables
npm run lint -- --rule '@typescript-eslint/no-unused-vars: error'

# Expected: Zero errors. Fix all issues before proceeding.
```

### Level 2: Component Testing (After Each Task)

```bash
# Test new components as created
npm test -- ArrangementSheet.test.tsx
npm test -- ArrangementSwitcher.test.tsx
npm test -- AddArrangementButton.test.tsx

# Test updated components
npm test -- SongViewer.test.tsx
npm test -- SongDetailPage.test.tsx

# Run all arrangement-related tests
npm test -- arrangements/

# Coverage check for new code
npm run test:coverage -- src/features/songs/components/arrangements/

# Expected: All tests pass, >70% coverage on new components
```

### Level 3: Integration Testing (After Task 5)

```bash
# Start development server
npm run dev &
sleep 5  # Allow Vite startup

# Manual testing checklist:
# 1. Navigate to /songs/[any-song-slug]
# 2. Click "Add Arrangement" button
# 3. Fill form and submit
# 4. Verify arrangement appears in list
# 5. Switch between arrangements using tabs/dropdown
# 6. Edit existing arrangement
# 7. Test permissions (admin vs regular user)

# API validation
curl http://localhost:5174/api/arrangements?songId=[id] | jq .
# Expected: Returns arrangement array

# Mobile responsiveness check
# Test on mobile viewport (375px width)
# Verify touch interactions work
# Check modal/sheet displays properly

# Production build validation
npm run build && npm run preview
# Expected: All features work in production build
```

### Level 4: Feature-Specific Validation

```bash
# Vertical slice architecture validation
find src/features/songs -name "*.ts" -o -name "*.tsx" | \
  xargs grep -l "from.*features/[^songs]" | \
  grep -v "from.*features/auth"
# Expected: Only auth imports allowed (for permissions)

# Check new exports are added
grep -E "ArrangementSheet|ArrangementSwitcher|AddArrangementButton" \
  src/features/songs/index.ts
# Expected: All new components exported

# Modal integration validation
grep -r "Modal.*size=\"large\"" src/features/songs/components/arrangements/
# Expected: ArrangementSheet uses large modal

# Notification integration check
grep -r "useNotification" src/features/songs/components/arrangements/
# Expected: ArrangementSheet uses notifications

# Permission check implementation
grep -r "useAuth" src/features/songs/components/arrangements/
# Expected: AddArrangementButton checks auth

# ChordPro validation working
# Test with sample ChordPro content:
echo "[C]This is a [G]test [Am]song [F]chorus" | \
  npm run test -- --grep "ChordPro"
# Expected: Validation passes

# Accessibility validation
npm test -- --grep "aria-|role=|accessible"
# Expected: All accessibility tests pass

# Performance check - no unnecessary re-renders
# Use React DevTools Profiler in browser
# Expected: Switching arrangements doesn't re-render entire page
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] Production build succeeds: `npm run build`
- [ ] Coverage >70% for new components

### Feature Validation

- [ ] Users can add arrangements via modal sheet
- [ ] Multiple arrangements display on song pages
- [ ] Arrangement switcher works (tabs/dropdown)
- [ ] Edit functionality works for existing arrangements
- [ ] Delete works for admin users only
- [ ] Form validation shows proper errors
- [ ] Success notifications appear correctly
- [ ] Mobile responsive design works
- [ ] ChordPro editor functions properly
- [ ] Auto-detection of key/tempo works

### Code Quality Validation

- [ ] Follows existing modal patterns (SongFormModal)
- [ ] Maintains vertical slice architecture
- [ ] No new cross-slice dependencies (except auth)
- [ ] Uses existing services and hooks
- [ ] Consistent styling with existing components
- [ ] Proper TypeScript types throughout
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Empty states displayed appropriately
- [ ] Accessibility standards maintained

### Integration Validation

- [ ] ArrangementList integrated into SongDetailPage
- [ ] SongViewer updated to support multiple arrangements
- [ ] Arrangement service cache refreshes after mutations
- [ ] Permissions properly enforced
- [ ] Modal animations work smoothly
- [ ] Form state persists during modal interactions
- [ ] Navigation works as expected
- [ ] No console errors or warnings

---

## Anti-Patterns to Avoid

**General Implementation Anti-Patterns:**
- ❌ Don't create new modal infrastructure - use existing Modal component
- ❌ Don't bypass existing arrangement services - use useArrangementMutations
- ❌ Don't create new form validation - use existing arrangementSchema
- ❌ Don't hardcode arrangement display logic - use ArrangementList component
- ❌ Don't skip loading/error states - handle all async operations

**Vertical Slice Anti-Patterns:**
- ❌ Don't import from other features (except auth via public API)
- ❌ Don't put arrangement logic outside songs feature
- ❌ Don't create cross-feature dependencies
- ❌ Don't bypass the songs feature public API
- ❌ Don't mix shared and feature-specific logic

**UI/UX Anti-Patterns:**
- ❌ Don't show all arrangements as tabs when >4 (use dropdown)
- ❌ Don't allow form submission during loading
- ❌ Don't forget mobile responsiveness
- ❌ Don't skip empty state handling
- ❌ Don't omit loading indicators

**Modal/Sheet Anti-Patterns:**
- ❌ Don't close modal during form submission
- ❌ Don't forget backdrop click handling
- ❌ Don't skip ESC key support
- ❌ Don't forget focus management
- ❌ Don't create multiple modals for same purpose

**Testing Anti-Patterns:**
- ❌ Don't skip unit tests for new components
- ❌ Don't ignore integration testing
- ❌ Don't forget accessibility testing
- ❌ Don't skip mobile testing
- ❌ Don't deploy without production build validation

---

## Implementation Timeline

**Phase 1 (Day 1): Core Components**
- Task 1: ArrangementSheet component
- Task 2: AddArrangementButton component
- Task 3: ArrangementSwitcher component
- Validation: Level 1 & 2 for each component

**Phase 2 (Day 2): Integration**
- Task 4: Update SongViewer
- Task 5: Update SongDetailPage
- Validation: Level 3 integration testing

**Phase 3 (Day 3): Testing & Polish**
- Task 6-7: Unit tests
- Task 8: Update exports
- Validation: Level 4 and final checklist
- Bug fixes and refinements

---

## Quality Score: 9/10

**Confidence Level for One-Pass Implementation Success: Very High**

**Strengths:**
- ✅ Comprehensive existing infrastructure (90% already built)
- ✅ Clear patterns to follow from existing code
- ✅ Detailed implementation blueprints with code examples
- ✅ All services and hooks already implemented
- ✅ Validation schemas complete
- ✅ Modal infrastructure mature and tested
- ✅ Minimal new code required (mostly integration)

**Minor Risk:**
- ⚠️ ArrangementForm complexity might require debugging (uses FormProvider)

This PRP provides exceptional context for successful implementation. The feature primarily involves integrating existing, well-tested components rather than building from scratch, which significantly reduces implementation risk and increases the likelihood of one-pass success.