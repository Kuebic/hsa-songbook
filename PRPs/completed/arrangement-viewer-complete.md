# BASE PRP - Complete Arrangement Viewer Feature

## 🎯 Objective
Complete the arrangement viewer feature by integrating server-side chord decompression, adding shadcn-ui components for better UI, creating comprehensive test coverage, and resolving all TypeScript/linting errors.

## 📚 Context & Research

### Server-Side ChordProText Integration
The server now provides decompressed `chordProText` field in ArrangementResponse (server/features/arrangements/arrangement.types.ts:92). The compression service uses ZSTD with proper UTF-8 support and handles ChordPro format correctly.

**Key Files:**
- `server/features/arrangements/arrangement.service.ts:380-382` - chordProText decompression logic
- `server/features/arrangements/arrangement.types.ts:92` - ArrangementResponse type with chordProText
- `server/shared/services/compressionService.ts` - ZSTD compression/decompression utilities

### Current UI Framework Status
The project uses a **custom form component system** with Tailwind CSS. Shadcn-ui is NOT currently integrated but all prerequisites are present:
- ✅ React 19.1 + TypeScript
- ✅ Tailwind CSS 4.1.11 with Vite plugin
- ✅ clsx + tailwind-merge utilities
- ✅ Existing cn() utility function

### Testing Infrastructure
- **Vitest 3.2.4** with jsdom environment
- **@testing-library/react** for component testing
- **MSW** for API mocking
- **jest-axe** for accessibility testing
- **70% coverage threshold** required

### TypeScript/Linting Issues Summary
- **72 TypeScript errors** blocking build
- **67 ESLint errors, 7 warnings**
- Main issues: missing type declarations, unused variables, explicit any usage, React hook dependencies

## 🏗️ Implementation Blueprint

### Phase 1: Fix Critical TypeScript Errors
```typescript
// 1. Install missing type definitions
npm i --save-dev @types/jest-axe

// 2. Fix arrangement viewer type issues in:
// - src/features/arrangements/hooks/useArrangementViewer.ts
// - src/features/arrangements/hooks/useChordSheetSettings.ts
// - src/features/arrangements/hooks/useMinimalMode.ts
// - src/features/arrangements/pages/ArrangementViewerPage.tsx

// 3. Update arrangement service integration to use chordProText
```

### Phase 2: Integrate Server ChordProText
```typescript
// src/features/arrangements/hooks/useArrangementViewer.ts
export function useArrangementViewer(slug: string) {
  // ...existing code...
  
  // Map server response with chordProText
  setArrangement({
    id: data.id,
    name: data.name,
    slug: data.slug,
    key: data.key,
    tempo: data.tempo,
    difficulty: data.difficulty,
    chordProText: data.chordProText || '', // Now properly decompressed from server
    tags: data.tags
  })
}
```

### Phase 3: Setup Shadcn-ui (Optional Enhancement)
```bash
# 1. Update Tailwind config for global usage
# 2. Initialize shadcn-ui
npx shadcn@latest init

# 3. Add required components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add slider
npx shadcn@latest add toggle
```

### Phase 4: Create Comprehensive Tests
```typescript
// src/features/arrangements/__tests__/ArrangementViewerPage.test.tsx
describe('ArrangementViewerPage', () => {
  // Test data fetching
  // Test chord sheet rendering
  // Test transposition
  // Test minimal mode
  // Test controls interaction
})

// src/features/arrangements/hooks/__tests__/useArrangementViewer.test.ts
// src/features/arrangements/hooks/__tests__/useMinimalMode.test.ts
// src/features/arrangements/hooks/__tests__/useTransposition.test.ts
// src/features/arrangements/hooks/__tests__/useChordSheetSettings.test.ts
```

### Phase 5: Fix Remaining Linting Issues
```typescript
// Fix unused variables by prefixing with underscore
// Replace any types with proper definitions
// Add missing React hook dependencies
// Remove unused imports
```

## 📋 Task List (Execute in Order)

### Critical Fixes (Must Do First)
1. [ ] Install @types/jest-axe package
2. [ ] Fix useChordSheetSettings hook - useRef type issue
3. [ ] Fix useMinimalMode hook - screen.orientation type casting
4. [ ] Fix ArrangementViewerPage - remove unused variables
5. [ ] Update useArrangementViewer to properly map chordProText from server

### Server Integration
6. [ ] Test arrangement API endpoint returns chordProText
7. [ ] Update arrangement service types to include chordProText
8. [ ] Verify ChordSheetViewer receives decompressed text

### UI Enhancement (Optional but Recommended)
9. [ ] Setup shadcn-ui configuration
10. [ ] Replace custom ViewerControls with shadcn components
11. [ ] Add proper theming support

### Testing
12. [ ] Create test file structure for arrangements feature
13. [ ] Write hook tests using renderHook pattern
14. [ ] Write component tests with MSW for API mocking
15. [ ] Add accessibility tests with jest-axe
16. [ ] Ensure 70% coverage threshold

### Final Cleanup
17. [ ] Fix all remaining TypeScript errors
18. [ ] Fix all ESLint errors
19. [ ] Run full validation suite
20. [ ] Document any remaining known issues

## 🔍 Validation Gates

```bash
# Level 1: Type Checking
npm run type-check || npx tsc --noEmit

# Level 2: Linting
npm run lint

# Level 3: Unit Tests
npm run test src/features/arrangements

# Level 4: Test Coverage
npm run test:coverage -- src/features/arrangements

# Level 5: Build Validation
npm run build

# Level 6: Preview Production Build
npm run preview

# Level 7: Bundle Analysis (if configured)
npm run analyze || npx vite-bundle-visualizer
```

## 📁 Files to Create/Modify

### Must Create:
```
src/features/arrangements/__tests__/
├── components/
│   ├── ChordSheetViewer.test.tsx
│   ├── ViewerHeader.test.tsx
│   └── ViewerControls.test.tsx
├── hooks/
│   ├── useArrangementViewer.test.ts
│   ├── useMinimalMode.test.ts
│   ├── useTransposition.test.ts
│   └── useChordSheetSettings.test.ts
├── pages/
│   └── ArrangementViewerPage.test.tsx
└── integration/
    └── ArrangementViewer.integration.test.tsx
```

### Must Modify:
```
src/features/arrangements/hooks/useArrangementViewer.ts    # Map chordProText
src/features/arrangements/hooks/useChordSheetSettings.ts   # Fix useRef type
src/features/arrangements/hooks/useMinimalMode.ts         # Fix orientation type
src/features/arrangements/pages/ArrangementViewerPage.tsx  # Remove unused vars
src/features/songs/services/arrangementService.ts         # Ensure proper types
```

### Optional Shadcn Migration:
```
tailwind.config.js                                        # Remove prefix, add CSS vars
src/components/ui/                                        # Shadcn components
src/lib/utils.ts                                         # Shadcn utilities
components.json                                          # Shadcn configuration
```

## 🚨 Critical Gotchas

1. **React 19 Compatibility**: Some packages may have peer dependency warnings - use `--force` if needed
2. **Tailwind v4 vs v3**: Shadcn docs are for v3, but project uses v4 - check compatibility
3. **ChordSheetJS Types**: Library may not have TypeScript definitions - create ambient declarations if needed
4. **Screen Orientation API**: Not available in all environments - use type guards
5. **useRef Initial Value**: Must match the ref type exactly or use union with null

## 📊 Success Criteria

- [ ] All TypeScript errors resolved (0 errors on `npm run type-check`)
- [ ] All ESLint errors resolved (0 errors on `npm run lint`)
- [ ] Arrangement viewer displays decompressed chord sheets
- [ ] Test coverage ≥70% for arrangement feature
- [ ] Build completes successfully
- [ ] Production preview works without console errors

## 🎓 External Resources

- [Shadcn-ui Vite Setup](https://ui.shadcn.com/docs/installation/vite)
- [Vitest Component Testing](https://vitest.dev/guide/testing-react)
- [React Testing Library Patterns](https://testing-library.com/docs/react-testing-library/example-intro)
- [TypeScript Strict Mode Guide](https://www.typescriptlang.org/tsconfig#strict)
- [MSW Integration Testing](https://mswjs.io/docs/getting-started)

## 🔧 Example Implementations

### Fix useRef Type Issue:
```typescript
// Before:
const scrollIntervalRef = useRef<number>()

// After:
const scrollIntervalRef = useRef<number | undefined>(undefined)
```

### Fix Screen Orientation:
```typescript
// Before:
orientation.lock('landscape')

// After:
if ('orientation' in screen && screen.orientation) {
  (screen.orientation as any).lock('landscape').catch(() => {})
}
```

### Test Pattern for Hooks:
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useArrangementViewer } from '../useArrangementViewer'
import { server } from '@/test-utils/msw-server'

describe('useArrangementViewer', () => {
  it('fetches and returns arrangement data', async () => {
    const { result } = renderHook(() => useArrangementViewer('test-slug'))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.arrangement?.chordProText).toBeDefined()
  })
})
```

## 📈 Confidence Score: 8/10

Strong confidence due to:
- ✅ Server-side decompression already implemented
- ✅ Clear understanding of codebase patterns
- ✅ Well-defined testing infrastructure
- ✅ Specific error fixes identified

Minor risks:
- ⚠️ React 19 compatibility with some packages
- ⚠️ Tailwind v4 shadcn-ui integration may need adjustments

## 🏁 Summary

This PRP provides a comprehensive roadmap to complete the arrangement viewer feature. The server-side decompression is already implemented, so the main focus is on client integration, testing, and code quality improvements. The optional shadcn-ui migration would improve UI consistency but is not critical for functionality.

Execute the tasks in order, running validation gates after each phase to ensure stability. The feature should be production-ready after completing all tasks.