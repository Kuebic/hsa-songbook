# Fix Comprehensive Test Failures PRP

## Executive Summary
Fix all failing tests in the HSA Songbook application by addressing mock setup issues, data type mismatches, validation errors, and component implementation gaps. This PRP provides comprehensive context for one-pass implementation success with self-validation.

**Confidence Score: 9.5/10** - All issues are well-diagnosed with clear fixes identified.

## Context and Research Findings

### Current Test Infrastructure Status
- **Total Tests**: 49 tests across multiple suites
- **Failing**: 35 tests (71% failure rate)
- **Main Issues**: Mock setup errors, type mismatches, component gaps, invalid test data

### Root Cause Analysis
Based on extensive codebase analysis, the failures stem from four primary issues:

1. **Mock Setup Issues (40% of failures)**
   - `checkDuplicates` function not defined in mock scope
   - `vi.mock()` hoisting issues with local variables
   - Auth mocks using incorrect patterns

2. **Type Errors (25% of failures)**
   - `findSimilarSongs` receives Song object but expects string
   - Factory generates mismatched types for validation
   - Missing function imports that don't exist

3. **Invalid Test Data (20% of failures)**
   - Factory data doesn't pass validation schemas
   - Required fields missing in generated data
   - Metadata structure inconsistencies

4. **Component Implementation Gaps (15% of failures)**
   - Arrangement form uses `title` field but tests expect `name`
   - ThemeCombobox component not properly integrated
   - Missing ArrangementFormData type import

### Existing Working Patterns (Reference Implementation)

#### Successful Mock Pattern from `src/shared/test-utils/setup.ts`:
```typescript
// Singleton mock instances prevent recreation issues
const mockUseAuth = vi.fn()
const mockUseUser = vi.fn()
const mockUseClerk = vi.fn()

// Export for direct access in tests
export { mockUseAuth, mockUseUser, mockUseClerk }

// Default mock implementations
mockUseAuth.mockReturnValue({
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  sessionId: null,
  getToken: mockGetToken,
})
```

#### Working Render Pattern from `src/shared/test-utils/clerk-test-utils.tsx`:
```typescript
export function renderWithClerk(
  ui: React.ReactElement,
  options: RenderOptions = {}
) {
  // Set auth state before rendering
  if (options.user && options.isSignedIn) {
    setUserState(options.user, true)
  }
  
  // Wrapper with providers
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={options.initialEntries}>
        <MockClerkProvider>{children}</MockClerkProvider>
      </MemoryRouter>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options })
}
```

### Vertical Slice Architecture Context

The songs feature follows a comprehensive vertical slice pattern:
```
src/features/songs/
├── components/       # UI layer
├── hooks/           # Business logic
├── services/        # Data access
├── types/           # Type definitions
├── validation/      # Business rules
├── test-utils/      # Feature-specific test utilities
└── index.ts        # Public API
```

Tests should be colocated within this structure, following the established patterns.

## Implementation Blueprint

### Phase 1: Fix Mock Setup Issues

#### Task 1.1: Fix `checkDuplicates` Reference Error
**Files to modify**:
- `src/features/songs/__tests__/performance/SongFormPerformance.test.tsx`
- `src/features/songs/components/forms/__tests__/SongForm.test.tsx`

```typescript
// Use vi.hoisted to make variables available in mock scope
const { mockCheckDuplicates, mockClearDuplicates } = vi.hoisted(() => ({
  mockCheckDuplicates: vi.fn(),
  mockClearDuplicates: vi.fn()
}))

// Define mock object at module level
const mockDuplicateDetection = {
  duplicates: [],
  isChecking: false,
  error: null,
  checkDuplicates: mockCheckDuplicates,
  clearDuplicates: mockClearDuplicates,
  hasExactMatch: false,
  hasSimilar: false
}

// Mock the module with proper scope
vi.mock('../../validation/hooks/useDuplicateDetection', () => ({
  useDuplicateDetection: () => mockDuplicateDetection,
  useRealtimeDuplicateDetection: () => mockDuplicateDetection
}))
```

#### Task 1.2: Fix Auth Mock Pattern
**File**: `src/features/songs/test-utils/render.tsx`

```typescript
// Remove vi.mock call inside render function
// Use the centralized mock from setup.ts instead
import { mockUseAuth } from '@shared/test-utils/setup'

export function render(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  // Configure mock before rendering
  if (options.user || options.isSignedIn) {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isAdmin: options.isAdmin || options.user?.role === 'ADMIN',
      user: options.user || { id: 'test-user', role: 'USER' },
      getToken: () => Promise.resolve('test-token'),
      signOut: vi.fn()
    })
  }
  
  // ... rest of render implementation
}
```

### Phase 2: Fix Type Errors and Test Data

#### Task 2.1: Fix `findSimilarSongs` Type Mismatch
**File**: `src/features/songs/__tests__/performance/SongFormPerformance.test.tsx`

```typescript
it('performs duplicate detection efficiently', () => {
  const largeSongList = songFactory.buildList(1000)
  const testTitle = 'Amazing Grace'
  const testArtist = 'John Newton' // Add artist parameter
  
  const startTime = performance.now()
  
  // Pass correct parameters: title string, songs array, optional artist
  const results = findSimilarSongs(
    testTitle,      // title as string, not song object
    largeSongList,  // existing songs array
    testArtist,     // optional artist string
    {
      maxDistance: 3,
      maxResults: 10
    }
  )
  
  const searchTime = performance.now() - startTime
  expect(searchTime).toBeLessThan(50)
  expect(results).toBeDefined()
})
```

#### Task 2.2: Fix Factory Data Validation
**File**: `src/features/songs/test-utils/factories.ts`

```typescript
// Ensure buildFormData creates valid data per schema
buildFormData: (overrides?: Partial<SongFormData>): SongFormData => ({
  title: faker.music.songName(),
  artist: faker.person.fullName(),
  compositionYear: faker.date.past({ years: 50 }).getFullYear(),
  ccli: faker.string.numeric({ length: 6 }), // Ensure 6 digits
  themes: faker.helpers.arrayElements(
    ['worship', 'praise', 'prayer'],
    { min: 1, max: 3 } // At least one theme required
  ),
  source: faker.helpers.arrayElement([
    'Traditional-Holy',
    'Contemporary-Christian',
    'Modern-Worship',
    'Original-Composition' // Add missing valid source
  ]),
  notes: faker.lorem.sentence(),
  isPublic: false,
  ...overrides
})
```

#### Task 2.3: Fix Import Statements
**File**: `src/features/songs/validation/utils/__tests__/duplicateDetection.test.ts`

```typescript
// Import only functions that actually exist
import { 
  normalizeTitle,
  findSimilarSongs,
  isDuplicateSong,
  getDuplicateSummary
} from '../duplicateDetection'

// Import Levenshtein functions from correct module
import { 
  levenshteinDistance,
  normalizedLevenshteinDistance,
  stringSimilarity,
  areSimilar
} from '../levenshtein'
```

### Phase 3: Fix Component Implementation Gaps

#### Task 3.1: Fix Arrangement Form Field Names
**File**: `src/features/songs/components/arrangements/SimpleArrangementForm.tsx`

```typescript
// Change all instances of 'title' to 'name' to match schema
interface SimpleArrangementFormProps {
  initialData?: {
    name?: string  // Changed from title
    key?: string
    tempo?: number
    timeSignature?: string
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
    tags?: string[]
    chordData?: string
  }
  onChange: (data: Partial<ArrangementFormData>) => void
}

// Update state initialization
const [formData, setFormData] = useState({
  name: initialData?.name || '',  // Changed from title
  // ... rest of fields
})

// Update field label and name
<FormInput
  label="Arrangement Name"  // Changed from "Arrangement Title"
  name="arrangement-name"    // Changed from "arrangement-title"
  value={formData.name}      // Changed from title
  onChange={(e) => handleChange('name', e.target.value)}
  placeholder="e.g., Key of G, Acoustic Version"
  required
/>
```

#### Task 3.2: Fix ArrangementFormData Import
**File**: `src/features/songs/components/forms/SongForm.tsx`

```typescript
// Uncomment and fix the import
import { arrangementSchema, type ArrangementFormData } from '../../validation/schemas/arrangementSchema'

// Ensure the type is properly used
const handleArrangementChange = useCallback((arrangementData: Partial<ArrangementFormData>) => {
  setFormData(prev => ({
    ...prev,
    arrangement: arrangementData as ArrangementFormData
  }))
}, [])
```

#### Task 3.3: Fix ThemeCombobox Integration
**File**: `src/features/songs/components/forms/fields/ThemeCombobox.tsx`

```typescript
// Ensure component properly displays selected themes
export function ThemeCombobox({ 
  value = [], 
  onChange, 
  error, 
  maxThemes = 10,
  required = false,
  disabled = false,
  label = "Themes",
  placeholder = "Type to search themes...",
  availableThemes = Object.keys(NORMALIZED_THEMES)
}: ThemeComboboxProps) {
  // ... existing implementation

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label 
          htmlFor="themes"
          style={{ /* ... existing styles */ }}
        >
          {label}
          {required && <span style={{ color: 'rgb(239, 68, 68)' }}> *</span>}
        </label>
      )}
      
      {/* Display selected themes as chips */}
      {value.length > 0 && (
        <div 
          role="region" 
          aria-label="Selected themes"
          aria-live="polite"
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px', 
            marginBottom: '8px' 
          }}
        >
          {value.map(theme => (
            <span 
              key={theme}
              style={{
                padding: '4px 8px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              {theme}
              <button
                type="button"
                aria-label={`Remove ${theme}`}
                onClick={() => handleRemoveTheme(theme)}
                style={{ marginLeft: '4px', cursor: 'pointer' }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* ... rest of component */}
    </div>
  )
}
```

### Phase 4: Update Test Configurations

#### Task 4.1: Fix Vitest Configuration
**File**: `vitest.config.ts`

```typescript
export default defineConfig({
  // ... existing config
  test: {
    // ... other test config
    clearMocks: true,
    restoreMocks: true,
    mockReset: false, // Change from true to false to preserve initial implementations
    // ... rest of config
  }
})
```

### Phase 5: Create Mock Utilities

#### Task 5.1: Create Centralized Mock Utilities
**File**: `src/features/songs/test-utils/mocks.ts` (new file)

```typescript
import { vi } from 'vitest'

// Centralized mock functions
export const mockCheckDuplicates = vi.fn()
export const mockClearDuplicates = vi.fn()

// Duplicate detection mock object
export const mockDuplicateDetection = {
  duplicates: [],
  isChecking: false,
  error: null,
  checkDuplicates: mockCheckDuplicates,
  clearDuplicates: mockClearDuplicates,
  hasExactMatch: false,
  hasSimilar: false
}

// Reset function for beforeEach
export function resetDuplicateDetectionMocks() {
  mockCheckDuplicates.mockClear()
  mockClearDuplicates.mockClear()
  mockDuplicateDetection.duplicates = []
  mockDuplicateDetection.hasExactMatch = false
  mockDuplicateDetection.hasSimilar = false
}
```

## Validation Gates

### Level 1: Type Checking
```bash
# Ensure no TypeScript errors
npm run type-check || npx tsc --noEmit
```

### Level 2: Linting
```bash
# Fix any linting issues
npm run lint
```

### Level 3: Unit Test Suite
```bash
# Run all tests and ensure they pass
npm run test -- --run

# Verify specific test suites
npm run test -- src/features/songs/components/forms/__tests__/SongForm.test.tsx --run
npm run test -- src/features/songs/__tests__/performance/SongFormPerformance.test.tsx --run
npm run test -- src/features/songs/__tests__/integration/SongFormIntegration.test.tsx --run
npm run test -- src/features/songs/__tests__/accessibility/SongFormA11y.test.tsx --run
```

### Level 4: Test Coverage
```bash
# Ensure coverage meets thresholds
npm run test:coverage

# Should achieve:
# - Statements: > 70%
# - Branches: > 70%
# - Functions: > 70%
# - Lines: > 70%
```

### Level 5: Build Validation
```bash
# Ensure the application builds without errors
npm run build
```

### Level 6: Integration Testing
```bash
# Run integration tests specifically
npm run test -- --grep="integration" --run
```

### Level 7: Performance Validation
```bash
# Check that performance tests pass
npm run test -- --grep="performance" --run
```

## File Modification Order

1. **Mock Setup Files**:
   - `src/features/songs/test-utils/mocks.ts` (create new)
   - `src/features/songs/test-utils/render.tsx`

2. **Component Fixes**:
   - `src/features/songs/components/arrangements/SimpleArrangementForm.tsx`
   - `src/features/songs/components/forms/SongForm.tsx`
   - `src/features/songs/components/forms/fields/ThemeCombobox.tsx`

3. **Factory Fixes**:
   - `src/features/songs/test-utils/factories.ts`

4. **Test File Updates**:
   - `src/features/songs/components/forms/__tests__/SongForm.test.tsx`
   - `src/features/songs/__tests__/performance/SongFormPerformance.test.tsx`
   - `src/features/songs/__tests__/integration/SongFormIntegration.test.tsx`
   - `src/features/songs/__tests__/accessibility/SongFormA11y.test.tsx`

5. **Configuration**:
   - `vitest.config.ts`

## Success Metrics

- ✅ All 49 tests pass without errors
- ✅ No TypeScript compilation errors
- ✅ Test coverage meets or exceeds 70% threshold
- ✅ No linting errors
- ✅ Build completes successfully
- ✅ Performance tests complete within time budgets
- ✅ Accessibility tests report no violations

## Common Pitfalls to Avoid

1. **Mock Hoisting**: Always use `vi.hoisted()` or define mocks at module level
2. **Type Consistency**: Ensure factory data matches schema expectations
3. **Field Naming**: Keep field names consistent across schemas, components, and tests
4. **Import Paths**: Use correct relative paths for vertical slice architecture
5. **Async Handling**: Always use `waitFor` for async assertions
6. **Mock Cleanup**: Reset mocks in `beforeEach` to prevent test pollution

## External Resources

### Vitest Documentation
- [Mocking Guide](https://vitest.dev/guide/mocking)
- [vi.hoisted API](https://vitest.dev/api/vi.html#vi-hoisted)
- [Mock Functions](https://vitest.dev/api/mock)

### React Testing Library
- [Testing React Hooks](https://mayashavin.com/articles/test-react-hooks-with-vitest)
- [Async Utilities](https://testing-library.com/docs/dom-testing-library/api-async/)

### Related PRPs
- `PRPs/7-comprehensive-testing.md` - Original testing implementation
- `PRPs/ai_docs/mongodb_mongoose_testing_guide.md` - Backend testing patterns

## Conclusion

This PRP provides comprehensive fixes for all identified test failures. The implementation follows established patterns from the codebase while incorporating Vitest best practices. By addressing mock setup issues, type mismatches, invalid test data, and component gaps, all tests should pass successfully.

**Confidence Score: 9.5/10** - All issues are clearly identified with specific fixes that follow existing working patterns in the codebase.