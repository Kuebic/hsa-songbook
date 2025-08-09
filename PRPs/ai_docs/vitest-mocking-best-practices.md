# Vitest Mocking Best Practices

## Essential Documentation Links

### Official Vitest Documentation
- **Main Mocking Guide**: https://vitest.dev/guide/mocking
- **Mock Functions API**: https://vitest.dev/api/mock
- **Vi API Reference**: https://vitest.dev/api/vi.html
- **Module Mocking**: https://main.vitest.dev/guide/mocking-modules

### React Testing Library with Vitest
- **Testing React hooks with Vitest**: https://mayashavin.com/articles/test-react-hooks-with-vitest
- **Bulletproof React Testing**: https://vaskort.medium.com/bulletproof-react-testing-with-vitest-rtl-deeaabce9fef
- **Vitest & React Testing Library Guide**: https://medium.com/@andrewjeremy12345/the-secret-sauce-to-lightning-fast-react-tests-vitest-react-testing-library-e96be5c04b92
- **Comprehensive Vitest Testing Guide**: https://dev.to/samuel_kinuthia/testing-react-applications-with-vitest-a-comprehensive-guide-2jm8

## Common Issues and Solutions

### 1. Variable Not Defined in Mock Scope

**Problem**: Variables used in `vi.mock()` are not available due to hoisting
```typescript
// This will fail
const mockFn = vi.fn()
vi.mock('./module', () => ({
  someFunction: mockFn // Error: mockFn is not defined
}))
```

**Solution**: Use `vi.hoisted()`
```typescript
const { mockFn } = vi.hoisted(() => ({
  mockFn: vi.fn()
}))

vi.mock('./module', () => ({
  someFunction: mockFn // Works!
}))
```

### 2. Mock Cleanup Between Tests

**Problem**: Mocks persist between tests causing unexpected behavior

**Solution**: Configure proper cleanup
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    clearMocks: true,     // Clear mock calls
    restoreMocks: true,   // Restore original implementations
    mockReset: false,     // Don't reset to empty functions
  }
})
```

### 3. TypeScript Type Issues with Mocks

**Problem**: Mocked functions lose type information

**Solution**: Use `vi.mocked()` for type safety
```typescript
import { vi } from 'vitest'
import { myFunction } from './module'

vi.mock('./module')

const mockedFunction = vi.mocked(myFunction)
mockedFunction.mockReturnValue('typed value') // Full TypeScript support
```

### 4. Mocking React Hooks

**Pattern for Custom Hooks**:
```typescript
// Mock at module level
vi.mock('../hooks/useCustomHook', () => ({
  useCustomHook: vi.fn(() => ({
    data: null,
    loading: false,
    error: null,
    refetch: vi.fn()
  }))
}))

// Override in specific tests
import { useCustomHook } from '../hooks/useCustomHook'
const mockUseCustomHook = vi.mocked(useCustomHook)

beforeEach(() => {
  mockUseCustomHook.mockClear()
})

it('handles loading state', () => {
  mockUseCustomHook.mockReturnValue({
    data: null,
    loading: true,
    error: null,
    refetch: vi.fn()
  })
  // Test implementation
})
```

### 5. Module-Level Mock Organization

**Best Practice**: Define mocks at module level
```typescript
// Define mock object outside of tests
const mockApi = {
  getData: vi.fn(),
  postData: vi.fn(),
  deleteData: vi.fn()
}

// Mock the module
vi.mock('../services/api', () => ({
  api: mockApi
}))

// Use in tests
describe('API Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })
  
  it('fetches data', async () => {
    mockApi.getData.mockResolvedValue({ data: 'test' })
    // Test implementation
  })
})
```

## Testing Patterns

### Singleton Mock Pattern
```typescript
// shared/test-utils/setup.ts
const mockAuth = vi.fn()
export { mockAuth }

// Set default implementation
mockAuth.mockReturnValue({
  isAuthenticated: false,
  user: null
})
```

### Render with Providers Pattern
```typescript
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider1>
        <Provider2>
          {children}
        </Provider2>
      </Provider1>
    )
  }
  
  return render(ui, { wrapper: Wrapper, ...options })
}
```

### Async Testing Pattern
```typescript
import { renderHook, waitFor } from '@testing-library/react'

it('updates async state', async () => {
  const { result } = renderHook(() => useAsyncHook())
  
  act(() => {
    result.current.trigger()
  })
  
  await waitFor(() => {
    expect(result.current.data).toBeDefined()
  })
})
```

## Key Takeaways

1. **Always hoist variables** used in `vi.mock()` with `vi.hoisted()`
2. **Define mocks at module level** to avoid scope issues
3. **Use `vi.mocked()` for TypeScript** type safety
4. **Configure cleanup properly** in vitest.config.ts
5. **Create centralized mock utilities** for commonly mocked modules
6. **Use singleton pattern** for shared mocks across tests
7. **Reset mocks in beforeEach** to ensure test isolation
8. **Use proper async utilities** (`waitFor`, `act`) for async tests

## Debugging Tips

1. **Check mock calls**: Use `console.log(mockFn.mock.calls)` to debug
2. **Verify mock state**: Use `expect(mockFn).toHaveBeenCalledTimes(n)`
3. **Check hoisting**: Ensure `vi.mock()` is at module level
4. **Validate cleanup**: Verify mocks are reset between tests
5. **Type checking**: Use `vi.mocked()` to maintain TypeScript types