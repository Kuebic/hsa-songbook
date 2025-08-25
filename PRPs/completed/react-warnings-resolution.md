name: "React Warnings Resolution PRP - Foundation Phase 1"
description: |

---

## Goal

**Feature Goal**: Eliminate all 29 React warnings by fixing Fast Refresh issues and hook dependencies

**Deliverable**: Clean console output with zero React warnings during development

**Success Definition**: Development server runs without any React warnings, Fast Refresh works properly, and all hooks have correct dependencies

## User Persona

**Target User**: Developers working on the HSA Songbook codebase

**Use Case**: Developers need a clean console to identify real issues and maintain high code quality

**User Journey**: 
1. Developer starts dev server with `npm run dev`
2. Console shows clean output without warnings
3. Fast Refresh works when editing components
4. Hook changes trigger proper re-renders
5. Development velocity increases without warning noise

**Pain Points Addressed**: 
- Fast Refresh breaks with exported constants (10 warnings)
- Hook dependency warnings indicate potential bugs (19 warnings)
- Console noise makes debugging difficult
- Development velocity reduced by 20%

## Why

- Improves developer experience with clean console output
- Enables Fast Refresh for instant feedback during development
- Prevents potential bugs from incorrect hook dependencies
- Increases development velocity by 20%
- Maintains code quality standards

## What

Fix all 29 React warnings by:
- Extracting constants and hooks to separate files (10 Fast Refresh warnings)
- Adding missing hook dependencies (10 warnings)
- Removing unnecessary dependencies (5 warnings)
- Fixing unknown/incorrect dependencies (4 warnings)
- Following established patterns in the codebase

### Success Criteria

- [ ] Zero Fast Refresh warnings in console
- [ ] Zero hook dependency warnings
- [ ] Fast Refresh works when editing components
- [ ] All ESLint React rules pass
- [ ] No regression in functionality
- [ ] Console output is clean during development

## All Needed Context

### Context Completeness Check

_All problematic files, specific line numbers, and established patterns are documented below for systematic warning resolution._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/features/songs/contexts/SongModalContext.tsx
  why: Has Fast Refresh warning - exports both component and constant
  pattern: Line 7 exports MODAL_TYPES constant alongside component
  gotcha: Must extract MODAL_TYPES to separate file

- file: src/features/songs/contexts/SongFormModal.tsx
  why: Imports MODAL_TYPES that needs extraction
  pattern: Line 12 imports from SongModalContext
  gotcha: Update import after extracting constant

- file: src/features/songs/index.tsx
  why: Has Fast Refresh warning - exports hooks alongside components
  pattern: Lines 1-8 export multiple hooks, lines 11-14 export components
  gotcha: Already has re-export pattern to follow (lines 16-17)

- file: src/features/search/index.tsx
  why: Example of correct pattern - re-exports from separate files
  pattern: All exports come from other files, no local definitions
  gotcha: This is the pattern to follow

- file: src/features/setlists/index.tsx
  why: Has Fast Refresh warning and hook dependency issues
  pattern: Exports both SetlistCard component and useSetlistCard hook
  gotcha: Lines 201, 241, 245 have missing dependencies

- file: src/features/responsive/hooks/useScrollDirection.ts
  why: Has hook dependency warning
  pattern: Line 38 useEffect missing 'threshold' dependency
  gotcha: Already a hooks-only file (correct structure)

- file: src/features/responsive/hooks/useViewport.ts
  why: Has hook dependency warning
  pattern: Line 51 missing 'debounceDelay' dependency
  gotcha: Consider if dependency is actually needed

- file: src/features/arrangements/components/PreviewDisplay.tsx
  why: Has unnecessary dependency warning
  pattern: Line 82 includes unnecessary 'settings' dependency
  gotcha: Can safely remove without affecting functionality

- file: src/shared/components/notifications/NotificationProvider.tsx
  why: Has unknown dependency warning
  pattern: Line 86 references 'notifications' incorrectly
  gotcha: Should be 'state.notifications'

- docfile: PRPs/foundation-phase1-critical-fixes-prd.md
  why: Original requirements for React warning fixes
  section: Epic 2: Fix React Warnings (lines 153-191)
```

### Current Warning Breakdown

```yaml
Fast Refresh Warnings (10):
  - src/features/songs/contexts/SongModalContext.tsx:7 - MODAL_TYPES export
  - src/features/auth/contexts/AuthContext.tsx:17-26 - PLANS constant
  - src/features/songs/index.tsx:1-8 - Multiple hooks exported
  - src/features/responsive/index.tsx:1 - useViewport hook
  - src/features/responsive/index.tsx:2 - useScrollDirection hook  
  - src/features/multilingual/index.tsx:3 - useMultilingualSearch hook
  - src/features/monitoring/index.tsx:3 - useWebVitals hook
  - src/features/setlists/index.tsx:344 - useSetlistCard hook
  - src/features/editor/index.tsx:1 - CodeEditor export
  - src/features/pwa/hooks/useServiceWorker.ts:11-19 - Stub export

Hook Dependency Warnings (19):
  Missing Dependencies (10):
    - useScrollDirection.ts:38 - missing 'threshold'
    - useViewport.ts:51 - missing 'debounceDelay'
    - SongModalContext.tsx:64 - missing 'isOpen'
    - SongActions.tsx:44 - missing 'deleteMutation'
    - AuthContext.tsx:193 - missing 'login'
    - ChordProEditor.tsx:195 - missing 'onContentChange'
    - ArrangementCard.tsx:91 - missing 'navigate'
    - TransposeToolbar.tsx:73 - missing 'onTranspose'
    - index.tsx:201 - missing 'song'
    - index.tsx:241 - missing 'navigate'
    
  Unnecessary Dependencies (5):
    - PreviewDisplay.tsx:82 - unnecessary 'settings'
    - ArrangementViewerPage.tsx:156 - unnecessary 'id'
    - SongCard.tsx:38 - unnecessary 'isDeleting'
    - ChordEditingPage.tsx:123 - unnecessary 'content'
    - index.tsx:245 - unnecessary 'setlists'
    
  Unknown/Incorrect Dependencies (4):
    - NotificationProvider.tsx:86 - unknown 'notifications'
    - SongListPage.tsx:78 - incorrect 'searchQuery'
    - SetlistsPage.tsx:92 - incorrect 'userId'
    - HomePage.tsx:45 - unknown 'features'
```

### Established Patterns in Codebase

```bash
# Correct pattern examples already in codebase:

src/features/search/
├── index.tsx                 # Re-exports only
├── hooks/
│   └── useSearch.ts         # Hook definitions
└── components/
    └── SearchBar.tsx        # Component definitions

src/features/arrangements/hooks/
├── useArrangements.ts       # Hooks in separate files
├── useChordProParser.ts
└── index.ts                 # Re-exports

src/features/songs/constants/
└── index.ts                 # Constants in separate file
```

## Implementation Blueprint

### Data models and structure

```typescript
// Pattern for extracting constants
// src/features/songs/constants/index.ts
export const MODAL_TYPES = {
  ADD: 'add',
  EDIT: 'edit',
  VIEW: 'view'
} as const

export type ModalType = typeof MODAL_TYPES[keyof typeof MODAL_TYPES]

// Pattern for re-export index files
// src/features/songs/index.tsx
// Hooks
export { useSongs } from './hooks/useSongs'
export { useSongMutations } from './hooks/useSongMutations'

// Components  
export { SongListPage } from './pages/SongListPage'
export { SongDetailPage } from './pages/SongDetailPage'
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EXTRACT constants from SongModalContext
  - CREATE: src/features/songs/constants/modal.ts
  - MOVE: MODAL_TYPES constant from SongModalContext.tsx line 7
  - UPDATE: SongModalContext.tsx to import from constants file
  - UPDATE: SongFormModal.tsx line 12 to import from constants file
  - PATTERN: Export const with 'as const' assertion for type safety

Task 2: EXTRACT constants from AuthContext
  - CREATE: src/features/auth/constants/plans.ts
  - MOVE: PLANS constant from AuthContext.tsx lines 17-26
  - UPDATE: AuthContext.tsx to import from constants file
  - PATTERN: Keep type exports with constants

Task 3: FIX songs/index.tsx Fast Refresh warnings
  - MOVE: Hook exports (lines 1-8) to comment, reference actual files
  - KEEP: Component exports (lines 11-14)
  - PATTERN: Re-export from actual file locations like search/index.tsx

Task 4: FIX responsive/index.tsx Fast Refresh warnings
  - CHANGE: Direct exports to re-exports from hooks directory
  - PATTERN: export { useViewport } from './hooks/useViewport'
  - PATTERN: export { useScrollDirection } from './hooks/useScrollDirection'

Task 5: FIX multilingual/index.tsx Fast Refresh warning
  - CHANGE: Line 3 to re-export from hooks file
  - PATTERN: export { useMultilingualSearch } from './hooks/useMultilingualSearch'

Task 6: FIX monitoring/index.tsx Fast Refresh warning
  - CHANGE: Line 3 to re-export from hooks file
  - PATTERN: export { useWebVitals } from './hooks/useWebVitals'

Task 7: FIX setlists/index.tsx Fast Refresh warnings
  - EXTRACT: useSetlistCard hook to src/features/setlists/hooks/useSetlistCard.ts
  - MOVE: Hook code from line 344 to new file
  - UPDATE: index.tsx to import and use the hook
  - RE-EXPORT: Hook at bottom of index.tsx

Task 8: FIX editor/index.tsx Fast Refresh warning
  - VERIFY: CodeEditor is a component, not mixed with non-components
  - PATTERN: Ensure clean re-export pattern

Task 9: FIX missing hook dependencies (10 warnings)
  - UPDATE: useScrollDirection.ts:38 - add 'threshold' to deps
  - UPDATE: useViewport.ts:51 - add 'debounceDelay' to deps
  - UPDATE: SongModalContext.tsx:64 - add 'isOpen' to deps
  - UPDATE: SongActions.tsx:44 - add 'deleteMutation' to deps
  - UPDATE: AuthContext.tsx:193 - add 'login' to deps or use ref
  - UPDATE: ChordProEditor.tsx:195 - add 'onContentChange' to deps
  - UPDATE: ArrangementCard.tsx:91 - add 'navigate' to deps
  - UPDATE: TransposeToolbar.tsx:73 - add 'onTranspose' to deps
  - UPDATE: setlists/index.tsx:201 - add 'song' to deps
  - UPDATE: setlists/index.tsx:241 - add 'navigate' to deps

Task 10: REMOVE unnecessary hook dependencies (5 warnings)
  - UPDATE: PreviewDisplay.tsx:82 - remove 'settings' from deps
  - UPDATE: ArrangementViewerPage.tsx:156 - remove 'id' from deps
  - UPDATE: SongCard.tsx:38 - remove 'isDeleting' from deps
  - UPDATE: ChordEditingPage.tsx:123 - remove 'content' from deps
  - UPDATE: setlists/index.tsx:245 - remove 'setlists' from deps

Task 11: FIX incorrect hook dependencies (4 warnings)
  - UPDATE: NotificationProvider.tsx:86 - change to 'state.notifications'
  - UPDATE: SongListPage.tsx:78 - correct reference to 'searchQuery'
  - UPDATE: SetlistsPage.tsx:92 - correct reference to 'userId'
  - UPDATE: HomePage.tsx:45 - remove or correct 'features' reference

Task 12: FIX useServiceWorker stub export
  - UPDATE: src/features/pwa/hooks/useServiceWorker.ts
  - KEEP: Stub for now (will be fixed in PWA re-enablement)
  - ADD: Comment explaining temporary stub
```

### Implementation Patterns & Key Details

```typescript
// PATTERN 1: Extract constants to separate file
// src/features/songs/constants/modal.ts
export const MODAL_TYPES = {
  ADD: 'add',
  EDIT: 'edit',
  VIEW: 'view'
} as const

export type ModalType = typeof MODAL_TYPES[keyof typeof MODAL_TYPES]

// src/features/songs/contexts/SongModalContext.tsx
import { MODAL_TYPES, ModalType } from '../constants/modal'
// Remove line 7 constant definition
// Rest of component unchanged

// PATTERN 2: Fix re-export structure
// src/features/songs/index.tsx
// Hooks - re-export from actual locations
export { useSongs } from './hooks/useSongs'
export { useSongMutations } from './hooks/useSongMutations'
export { useSongForm } from './hooks/useSongForm'

// Components - re-export from actual locations
export { SongListPage } from './pages/SongListPage'
export { SongDetailPage } from './pages/SongDetailPage'
export { SongCard } from './components/SongCard'

// PATTERN 3: Fix missing dependencies
// Before:
useEffect(() => {
  if (threshold > 0) {
    // logic
  }
}, []) // Warning: missing 'threshold'

// After:
useEffect(() => {
  if (threshold > 0) {
    // logic
  }
}, [threshold]) // Fixed: 'threshold' added

// PATTERN 4: Fix unnecessary dependencies
// Before:
const memoized = useMemo(() => {
  return computeValue(data)
}, [data, settings]) // Warning: 'settings' not used

// After:
const memoized = useMemo(() => {
  return computeValue(data)
}, [data]) // Fixed: removed unused 'settings'

// PATTERN 5: Fix incorrect references
// Before:
useEffect(() => {
  console.log(notifications) // Warning: 'notifications' not defined
}, [notifications])

// After:
useEffect(() => {
  console.log(state.notifications) // Fixed: correct reference
}, [state.notifications])

// PATTERN 6: Extract hooks to separate files
// src/features/setlists/hooks/useSetlistCard.ts
export function useSetlistCard(setlist: Setlist) {
  // Move entire hook implementation here
  const navigate = useNavigate()
  
  const handleClick = useCallback(() => {
    navigate(`/setlists/${setlist.id}`)
  }, [navigate, setlist.id]) // Correct dependencies
  
  return { handleClick }
}

// src/features/setlists/index.tsx
import { useSetlistCard } from './hooks/useSetlistCard'

export function SetlistCard({ setlist }: SetlistCardProps) {
  const { handleClick } = useSetlistCard(setlist)
  // Rest of component
}

// Re-export at bottom
export { useSetlistCard } from './hooks/useSetlistCard'
```

### Integration Points

```yaml
IMPORTS:
  - Update all files importing extracted constants
  - Update all files importing moved hooks
  - Verify no broken imports after changes

ESLINT:
  - Rules already configured in eslint.config.js
  - react-hooks/exhaustive-deps rule will validate fixes
  - Run npm run lint after each task

FAST REFRESH:
  - Test after each extraction
  - Edit component and verify instant updates
  - No full page reloads should occur
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after EACH file modification
npm run lint
npm run build

# Expected: Zero errors, warnings decreasing with each fix
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run tests for affected features
npm run test -- src/features/songs
npm run test -- src/features/setlists
npm run test -- src/features/responsive

# Full test suite
npm run test

# Expected: All tests pass, no regressions
```

### Level 3: Integration Testing (System Validation)

```bash
# Start development server
npm run dev

# Check console output
# Expected: ZERO React warnings

# Test Fast Refresh
# 1. Edit a component (add a console.log)
# 2. Save the file
# 3. Component should update without page reload
# 4. State should be preserved

# Test each affected feature
# 1. Songs: Create/edit song modal works
# 2. Auth: Login/logout works
# 3. Setlists: Card navigation works
# 4. Responsive: Resize detection works

# Expected: All features work, Fast Refresh works
```

### Level 4: Domain-Specific Validation

```bash
# Verify Fast Refresh for all fixed files
for file in $(find src -name "*.tsx" -o -name "*.ts"); do
  echo "// test" >> $file
  sleep 1
  git checkout -- $file
done
# Expected: No "Fast refresh only works..." warnings

# Check hook re-render behavior
# Add console.logs to hooks with fixed dependencies
# Verify they re-run when dependencies change
# Verify they DON'T re-run unnecessarily

# Performance check
# Use React DevTools Profiler
# Verify no unnecessary re-renders from fixed hooks

# Bundle size check
npm run build
# Verify bundle size hasn't increased significantly

# Expected: Proper hook behavior, no performance regression
```

## Final Validation Checklist

### Technical Validation

- [ ] Zero React warnings in console
- [ ] npm run lint passes without errors
- [ ] npm run build completes successfully
- [ ] All tests pass: npm run test
- [ ] Fast Refresh works for all components

### Feature Validation

- [ ] All 10 Fast Refresh warnings resolved
- [ ] All 10 missing dependencies added
- [ ] All 5 unnecessary dependencies removed
- [ ] All 4 incorrect dependencies fixed
- [ ] No functionality regressions

### Code Quality Validation

- [ ] Follows established file structure patterns
- [ ] Constants properly extracted with type exports
- [ ] Hooks in dedicated files
- [ ] Clean re-export pattern in index files
- [ ] No eslint-disable comments for react-hooks

### Documentation & Deployment

- [ ] Import statements updated throughout codebase
- [ ] No broken imports
- [ ] Clean git diff (only necessary changes)
- [ ] Console output is clean for other developers

---

## Anti-Patterns to Avoid

- ❌ Don't mix component and non-component exports in same file
- ❌ Don't ignore hook dependency warnings (they indicate bugs)
- ❌ Don't use eslint-disable for react-hooks rules
- ❌ Don't add unnecessary dependencies "just to fix warnings"
- ❌ Don't create deeply nested import paths
- ❌ Don't forget to update all import statements
- ❌ Don't skip testing after fixes
- ❌ Don't mix hooks and components in index.tsx files