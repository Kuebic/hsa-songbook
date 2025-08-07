# PRP: Fix PWA Offline Integration Test Failures

## Problem Statement
The PWA offline integration tests in `src/features/pwa/__tests__/offline.integration.test.tsx` have 11 failing tests with timeout errors, module resolution issues, and incorrect mock configurations. These tests are critical for ensuring the offline capabilities of the PWA work correctly.

## Context and Research

### Test Failure Analysis
**Current State:** 11 failed tests out of 12 in offline.integration.test.tsx
**Primary Issues:**
1. **Timeout Errors (8 tests):** Tests timing out at 5000ms
2. **Module Resolution (1 test):** Cannot find module '../components/OfflineIndicator' when using require()
3. **Missing UI Elements (2 tests):** UpdatePrompt not rendering expected content due to mock issues

### Codebase Structure (Vertical Slice Architecture)
```
src/features/pwa/                      # PWA Feature Slice
├── __tests__/
│   ├── offline.integration.test.tsx   # FAILING - Integration tests
│   └── setup.ts                        # Test setup for PWA tests
├── components/
│   ├── OfflineIndicator.tsx           # Shows online/offline status
│   ├── UpdatePrompt.tsx               # Shows service worker updates
│   ├── LazyRouteWrapper.tsx           # Handles lazy loading with offline fallback
│   ├── OfflineFallback.tsx           # Fallback UI for offline scenarios
│   └── __tests__/                     # Component unit tests (PASSING)
├── hooks/
│   ├── useServiceWorker.ts            # Service worker integration
│   └── useOnlineStatus.ts             # Online/offline detection
└── index.ts                            # Feature exports
```

### Key Files to Reference
- `/src/features/pwa/__tests__/offline.integration.test.tsx` - The failing test file
- `/src/features/pwa/components/__tests__/LazyRouteWrapper.test.tsx` - Passing test pattern example
- `/src/shared/test-utils/setup.ts` - Global test setup
- `/vitest.config.ts` - Test configuration
- `/src/shared/test-utils/__mocks__/virtual-pwa-register.ts` - PWA mock

### Root Causes Identified

#### 1. ESM vs CommonJS Module Loading
- **Line 203:** Uses `require('../components/OfflineIndicator')` which fails in ESM environment
- **Solution:** Use proper ES6 imports and move mocks to module level

#### 2. Mock Hoisting and Configuration
- Multiple `vi.mock()` calls inside test functions don't hoist properly
- Mocks need to be at module level or properly configured in beforeEach

#### 3. Async Timing Issues
- Default `waitFor` timeout (1000ms) insufficient for complex async operations
- Missing `act()` wrappers for state updates
- Fake timers not properly advanced

#### 4. Missing Mock Implementations
- `mockNavigate` referenced but never defined
- Service worker hook mocks not properly configured for different test scenarios

### External Documentation References
- **Vitest Mocking:** https://vitest.dev/guide/mocking
- **React Testing Library Async:** https://testing-library.com/docs/dom-testing-library/api-async
- **React Suspense Testing:** https://react.dev/reference/react/Suspense#testing
- **Vitest Timers:** https://vitest.dev/guide/mocking#timers

## Implementation Blueprint

### Phase 1: Fix Module Resolution and Mock Setup

```typescript
// Move all mocks to module level (top of file)
import { vi } from 'vitest'

// Mock modules before any imports that use them
vi.mock('../hooks/useOnlineStatus')
vi.mock('../hooks/useServiceWorker')

// Then import components
import { OfflineIndicator } from '../components/OfflineIndicator'
import { UpdatePrompt } from '../components/UpdatePrompt'
import { LazyRouteWrapper } from '../components/LazyRouteWrapper'

// Create mock implementations as constants
const mockUseOnlineStatus = vi.mocked(useOnlineStatus)
const mockUseServiceWorker = vi.mocked(useServiceWorker)
```

### Phase 2: Fix Async Timing Issues

```typescript
// Increase test timeout globally for this suite
describe('PWA Offline Integration', () => {
  // Set longer timeout for integration tests
  vi.setConfig({ testTimeout: 10000 })
  
  // Use proper waitFor with explicit timeout
  await waitFor(
    () => expect(screen.getByText('Expected Text')).toBeInTheDocument(),
    { timeout: 5000 }
  )
  
  // Properly advance timers when using fake timers
  act(() => {
    vi.advanceTimersByTime(3000)
  })
})
```

### Phase 3: Fix Missing Navigation Mock

```typescript
// Add missing navigation mock
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})
```

### Phase 4: Improve Test Structure

```typescript
describe('PWA Offline Integration', () => {
  // Setup proper mock reset in beforeEach
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigatorOnLine(true)
    vi.useFakeTimers()
    
    // Configure default mock returns
    mockUseOnlineStatus.mockReturnValue({
      isOnline: true,
      wasOffline: false
    })
    
    mockUseServiceWorker.mockReturnValue({
      needRefresh: false,
      offlineReady: false,
      updateServiceWorker: vi.fn(),
      close: vi.fn()
    })
  })
  
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })
})
```

## Implementation Tasks

1. **Fix Module Resolution Issues**
   - Move all vi.mock() calls to module level
   - Replace require() with proper ES6 imports
   - Create typed mock constants for better TypeScript support

2. **Fix Timing and Async Issues**
   - Increase test timeouts to 10000ms
   - Add explicit timeout to all waitFor calls
   - Properly wrap state updates in act()
   - Fix fake timer advancement

3. **Fix Missing Mocks**
   - Add react-router-dom navigation mock
   - Configure service worker hook mocks per test
   - Setup proper mock cleanup in afterEach

4. **Refactor Test Structure**
   - Extract common test utilities
   - Create helper functions for mock setup
   - Improve test isolation

5. **Add Missing Assertions**
   - Verify mock calls with proper expectations
   - Add intermediate state checks
   - Improve error messages

## Validation Gates

```bash
# Level 1: Syntax and Type Checking
npm run lint
npm run type-check

# Level 2: Run Only PWA Tests
npx vitest run src/features/pwa/__tests__/offline.integration.test.tsx

# Level 3: Run All PWA Feature Tests
npx vitest run src/features/pwa

# Level 4: Full Test Suite
npm run test

# Level 5: Test Coverage
npm run test:coverage

# Level 6: Build Validation
npm run build

# Level 7: Preview Build
npm run preview
```

## Success Criteria
- All 12 tests in offline.integration.test.tsx pass
- No console errors or warnings
- Tests complete within reasonable time (< 30 seconds total)
- No flaky tests (run 3 times consecutively without failure)
- Maintains existing test coverage (> 80%)

## Gotchas and Edge Cases

### Module Mocking in Vitest
- vi.mock() calls are hoisted automatically
- Cannot use variables defined outside in mock factory
- Mock implementations should be defined after imports

### React 19 Considerations
- Automatic batching affects state update timing
- Suspense boundaries behave differently than React 18
- Transitions API may affect lazy loading behavior

### Timer Considerations
- Using fake timers affects Promise resolution timing
- Need to flush microtasks when mixing timers and promises
- Consider using vi.runAllTimers() vs vi.advanceTimersByTime()

### Navigation Testing
- MemoryRouter required for testing routing
- Navigation state needs proper initialization
- Mock navigation functions must be cleared between tests

## Testing Patterns from Codebase

### Successful Pattern (from LazyRouteWrapper.test.tsx)
```typescript
it('should render children when loaded successfully', async () => {
  const TestComponent = () => <div>Test Component Loaded</div>
  const LazyComponent = lazy(() => Promise.resolve({
    default: TestComponent
  }))
  
  render(
    <LazyRouteWrapper>
      <LazyComponent />
    </LazyRouteWrapper>
  )
  
  await waitFor(() => {
    expect(screen.getByText('Test Component Loaded')).toBeInTheDocument()
  })
})
```

### Key Differences to Apply
- Clean lazy component setup
- Simple Promise resolution
- Clear waitFor with single assertion
- No complex state management in test

## Feature Boundary Considerations

The PWA feature slice should be self-contained with minimal dependencies:
- **Internal:** All PWA components, hooks, and utilities
- **External Dependencies:** 
  - React Router (for navigation)
  - Virtual PWA Register (build-time generated)
  - Shared test utilities

## Risk Mitigation
- Create backup of current test file before changes
- Fix one test at a time to isolate issues
- Run tests in watch mode during development
- Verify no regression in passing tests

## Estimated Complexity: 7/10

**Confidence Level:** 8/10 - High confidence in success due to:
- Clear identification of root causes
- Existing passing test patterns to follow
- Comprehensive research on testing patterns
- Well-structured vertical slice architecture
- Clear validation gates

## Next Steps
1. Implement module-level mocks
2. Fix timing issues systematically
3. Add missing mock implementations
4. Refactor test structure for clarity
5. Run validation gates progressively
6. Document any additional findings

---

*Last Updated: 2025-08-07*
*Framework: React 19 + TypeScript + Vite + Vitest*
*Feature: PWA Offline Integration Testing*