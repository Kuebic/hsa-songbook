# Comprehensive Testing Implementation PRP

## Executive Summary
Implement comprehensive testing coverage for the entire song forms feature, including unit tests for all components, integration tests for form-to-API flows, end-to-end tests for complete user journeys, and performance/accessibility testing. This ensures production-ready quality and maintainability.

**Confidence Score: 9.5/10** - Very high confidence with established testing patterns and comprehensive coverage strategy.

## Context and Research Findings

### Current Testing Infrastructure
**Existing Test Setup:**
- Vitest for unit and integration tests
- React Testing Library for component tests
- MSW for API mocking
- Coverage reporting with c8
- 357 existing test files as examples
- Sophisticated test utilities and patterns

**Test Patterns Observed:**
- Tiered timeouts (2s unit, 5s service, 10s database, 15s integration)
- Custom matchers for MongoDB and compression
- Factory functions for test data
- Comprehensive mocking strategies

**Coverage Requirements:**
- Target: 90% code coverage
- All critical paths tested
- Edge cases covered
- Error scenarios validated

### Testing Strategy
```
Testing Pyramid:
├── Unit Tests (70%)
│   ├── Components
│   ├── Hooks
│   ├── Utilities
│   └── Validation
├── Integration Tests (20%)
│   ├── API Integration
│   ├── Form Submission
│   └── State Management
├── E2E Tests (10%)
│   ├── User Journeys
│   ├── Critical Paths
│   └── Cross-browser
└── Non-functional Tests
    ├── Performance
    ├── Accessibility
    └── Security
```

## Implementation Blueprint

### Phase 1: Test Utilities and Factories

```typescript
// src/features/songs/test-utils/factories.ts
import { faker } from '@faker-js/faker'
import type { Song, Arrangement } from '@features/songs/types/song.types'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'

export const songFactory = {
  build: (overrides?: Partial<Song>): Song => ({
    id: faker.string.uuid(),
    _id: faker.string.uuid(),
    title: faker.music.songName(),
    artist: faker.person.fullName(),
    slug: faker.helpers.slugify(faker.music.songName()).toLowerCase(),
    compositionYear: faker.date.past().getFullYear(),
    ccli: faker.string.numeric(6),
    themes: faker.helpers.arrayElements(
      ['worship', 'praise', 'prayer', 'salvation', 'grace'],
      faker.number.int({ min: 1, max: 3 })
    ),
    source: faker.helpers.arrayElement([
      'Traditional-Holy',
      'Contemporary-Christian',
      'Modern-Worship'
    ]),
    notes: faker.lorem.sentence(),
    metadata: {
      createdBy: faker.string.uuid(),
      lastModifiedBy: faker.string.uuid(),
      isPublic: faker.datatype.boolean(),
      ratings: {
        average: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
        count: faker.number.int({ min: 0, max: 100 })
      },
      views: faker.number.int({ min: 0, max: 1000 }),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    },
    ...overrides
  }),
  
  buildList: (count: number, overrides?: Partial<Song>): Song[] => {
    return Array.from({ length: count }, () => songFactory.build(overrides))
  },
  
  buildFormData: (overrides?: Partial<SongFormData>): SongFormData => ({
    title: faker.music.songName(),
    artist: faker.person.fullName(),
    compositionYear: faker.date.past().getFullYear(),
    ccli: faker.string.numeric(6),
    themes: faker.helpers.arrayElements(
      ['worship', 'praise', 'prayer'],
      faker.number.int({ min: 1, max: 3 })
    ),
    source: 'Traditional-Holy',
    notes: faker.lorem.sentence(),
    isPublic: false,
    ...overrides
  })
}

export const arrangementFactory = {
  build: (overrides?: Partial<Arrangement>): Arrangement => ({
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(['Key of G', 'Acoustic Version', 'Original']),
    songIds: [faker.string.uuid()],
    key: faker.helpers.arrayElement(['C', 'G', 'D', 'A', 'E']),
    tempo: faker.number.int({ min: 60, max: 180 }),
    timeSignature: '4/4',
    difficulty: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
    tags: faker.helpers.arrayElements(['acoustic', 'simple', 'youth'], 2),
    chordData: `{title: ${faker.music.songName()}}
{key: G}

[G]This is a [C]test [D]song`,
    ...overrides
  })
}

// src/features/songs/test-utils/render.tsx
import { ReactElement } from 'react'
import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { NotificationProvider } from '@shared/components/notifications'
import { AuthProvider } from '@features/auth/providers/AuthProvider'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: { id: string; role: string }
  initialRoute?: string
}

export function render(
  ui: ReactElement,
  {
    user = null,
    initialRoute = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Mock auth context if user provided
  if (user) {
    vi.mock('@features/auth/hooks/useAuth', () => ({
      useAuth: () => ({
        isSignedIn: true,
        user,
        getToken: () => Promise.resolve('test-token')
      })
    }))
  }
  
  // Set initial route
  window.history.pushState({}, 'Test page', initialRoute)
  
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    )
  }
  
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything
export * from '@testing-library/react'
export { render }
```

### Phase 2: Component Unit Tests

```typescript
// src/features/songs/components/forms/__tests__/SongForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '../../test-utils/render'
import userEvent from '@testing-library/user-event'
import { SongForm } from '../SongForm'
import { songFactory } from '../../test-utils/factories'

describe('SongForm Component', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Rendering', () => {
    it('renders all form sections', () => {
      render(<SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Categorization')).toBeInTheDocument()
      expect(screen.getByText('Additional Information')).toBeInTheDocument()
    })
    
    it('renders with initial data when editing', () => {
      const song = songFactory.build()
      
      render(
        <SongForm 
          initialData={song}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      )
      
      expect(screen.getByDisplayValue(song.title)).toBeInTheDocument()
      expect(screen.getByDisplayValue(song.artist!)).toBeInTheDocument()
    })
    
    it('shows admin-only fields for admin users', () => {
      render(
        <SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { user: { id: 'admin-user', role: 'ADMIN' } }
      )
      
      expect(screen.getByLabelText(/make this song public/i)).toBeInTheDocument()
    })
    
    it('hides admin fields for regular users', () => {
      render(
        <SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { user: { id: 'regular-user', role: 'USER' } }
      )
      
      expect(screen.queryByLabelText(/make this song public/i)).not.toBeInTheDocument()
    })
  })
  
  describe('Validation', () => {
    it('shows validation errors for required fields', async () => {
      const user = userEvent.setup()
      
      render(<SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      
      // Try to submit without filling required fields
      await user.click(screen.getByRole('button', { name: /create song/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
        expect(screen.getByText(/at least one theme is required/i)).toBeInTheDocument()
      })
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
    
    it('validates CCLI format', async () => {
      const user = userEvent.setup()
      
      render(<SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      
      const ccliInput = screen.getByLabelText(/ccli number/i)
      await user.type(ccliInput, 'ABC123') // Invalid format
      
      await user.click(screen.getByRole('button', { name: /create song/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/ccli must be 5-7 digits/i)).toBeInTheDocument()
      })
    })
    
    it('validates year range', async () => {
      const user = userEvent.setup()
      
      render(<SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      
      const yearInput = screen.getByLabelText(/year/i)
      await user.type(yearInput, '3000') // Future year
      
      await user.click(screen.getByRole('button', { name: /create song/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/year cannot be in the future/i)).toBeInTheDocument()
      })
    })
    
    it('limits character count for text fields', async () => {
      const user = userEvent.setup()
      
      render(<SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      
      const notesTextarea = screen.getByLabelText(/notes/i)
      const longText = 'a'.repeat(2001) // Exceeds 2000 character limit
      
      await user.type(notesTextarea, longText)
      
      // Check character counter
      expect(screen.getByText(/2000\/2000/)).toBeInTheDocument()
      
      // Verify truncation
      expect(notesTextarea).toHaveValue('a'.repeat(2000))
    })
  })
  
  describe('Theme Selection', () => {
    it('allows adding themes from autocomplete', async () => {
      const user = userEvent.setup()
      
      render(<SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      
      const themeInput = screen.getByPlaceholderText(/type to search themes/i)
      
      await user.type(themeInput, 'wor')
      
      // Autocomplete should show suggestions
      await waitFor(() => {
        expect(screen.getByText('worship')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('worship'))
      
      // Theme should be added as a tag
      expect(screen.getByText('worship', { selector: 'span' })).toBeInTheDocument()
    })
    
    it('normalizes theme names', async () => {
      const user = userEvent.setup()
      
      render(<SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      
      const themeInput = screen.getByPlaceholderText(/type to search themes/i)
      
      await user.type(themeInput, 'Christmas')
      await user.click(screen.getByText('christmas')) // Should be normalized to lowercase
      
      expect(screen.getByText('christmas', { selector: 'span' })).toBeInTheDocument()
    })
    
    it('limits number of themes to 10', async () => {
      const user = userEvent.setup()
      
      render(<SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      
      const themeInput = screen.getByPlaceholderText(/type to search themes/i)
      
      // Add 10 themes
      for (let i = 0; i < 10; i++) {
        await user.type(themeInput, `theme${i}`)
        await user.keyboard('{Enter}')
      }
      
      // Input should be disabled
      expect(themeInput).toBeDisabled()
      expect(screen.getByText(/10\/10 themes selected/i)).toBeInTheDocument()
    })
  })
  
  describe('Duplicate Detection', () => {
    it('shows duplicate warning for similar titles', async () => {
      const user = userEvent.setup()
      
      // Mock duplicate detection hook
      vi.mock('@features/songs/validation/hooks/useDuplicateDetection', () => ({
        useDuplicateDetection: () => ({
          similarSongs: [
            {
              song: songFactory.build({ title: 'Amazing Grace' }),
              similarity: 'exact',
              distance: 0
            }
          ],
          checkForDuplicates: vi.fn(),
          clearSimilarSongs: vi.fn()
        })
      }))
      
      render(<SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      
      await user.type(screen.getByLabelText(/title/i), 'Amazing Grace')
      
      await waitFor(() => {
        expect(screen.getByText(/similar songs found/i)).toBeInTheDocument()
        expect(screen.getByText(/amazing grace/i)).toBeInTheDocument()
      })
    })
    
    it('allows continuing despite duplicates', async () => {
      const user = userEvent.setup()
      
      // Mock with duplicates
      vi.mock('@features/songs/validation/hooks/useDuplicateDetection', () => ({
        useDuplicateDetection: () => ({
          similarSongs: [{ song: songFactory.build(), similarity: 'exact', distance: 0 }],
          checkForDuplicates: vi.fn(),
          clearSimilarSongs: vi.fn()
        })
      }))
      
      render(<SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      
      await user.click(screen.getByRole('button', { name: /continue anyway/i }))
      
      // Warning should be dismissed
      await waitFor(() => {
        expect(screen.queryByText(/similar songs found/i)).not.toBeInTheDocument()
      })
    })
  })
  
  describe('Form Submission', () => {
    it('submits valid form data', async () => {
      const user = userEvent.setup()
      
      render(<SongForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
      
      // Fill required fields
      await user.type(screen.getByLabelText(/title/i), 'Test Song')
      await user.type(screen.getByLabelText(/artist/i), 'Test Artist')
      
      // Add theme
      const themeInput = screen.getByPlaceholderText(/type to search themes/i)
      await user.type(themeInput, 'worship')
      await user.keyboard('{Enter}')
      
      // Submit
      await user.click(screen.getByRole('button', { name: /create song/i }))
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Song',
            artist: 'Test Artist',
            themes: ['worship']
          })
        )
      })
    })
    
    it('disables submit button while submitting', async () => {
      const user = userEvent.setup()
      
      // Mock slow submission
      mockOnSubmit.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isSubmitting={true}
        />
      )
      
      const submitButton = screen.getByRole('button', { name: /saving/i })
      expect(submitButton).toBeDisabled()
    })
  })
})
```

### Phase 3: Integration Tests

```typescript
// src/features/songs/__tests__/integration/SongFormIntegration.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '../../test-utils/render'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { SongFormModal } from '../../components/forms/SongFormModal'
import { songFactory } from '../../test-utils/factories'

const server = setupServer(
  // Mock API endpoints
  http.post('/api/v1/songs', async ({ request }) => {
    const data = await request.json()
    
    // Validate request
    if (!data.title) {
      return HttpResponse.json(
        { 
          success: false, 
          error: { message: 'Title is required' } 
        },
        { status: 400 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        ...songFactory.build(),
        ...data,
        id: 'new-song-id',
        slug: data.title.toLowerCase().replace(/\s+/g, '-')
      }
    })
  }),
  
  http.patch('/api/v1/songs/:id', async ({ request, params }) => {
    const data = await request.json()
    
    return HttpResponse.json({
      success: true,
      data: {
        ...songFactory.build(),
        ...data,
        id: params.id
      }
    })
  }),
  
  http.get('/api/v1/songs', () => {
    return HttpResponse.json({
      success: true,
      data: songFactory.buildList(10)
    })
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Song Form Integration', () => {
  describe('Create Song Flow', () => {
    it('successfully creates a song via API', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()
      
      render(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={async (data) => {
            const response = await fetch('/api/v1/songs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
            const result = await response.json()
            if (result.success) {
              mockOnSuccess(result.data)
            }
          }}
        />
      )
      
      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Integration Test Song')
      await user.type(screen.getByLabelText(/artist/i), 'Test Artist')
      
      // Add theme
      const themeInput = screen.getByPlaceholderText(/type to search themes/i)
      await user.type(themeInput, 'worship')
      await user.keyboard('{Enter}')
      
      // Submit
      await user.click(screen.getByRole('button', { name: /create song/i }))
      
      // Verify API call and success
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Integration Test Song',
            artist: 'Test Artist',
            slug: 'integration-test-song'
          })
        )
      })
    })
    
    it('handles API validation errors', async () => {
      const user = userEvent.setup()
      
      server.use(
        http.post('/api/v1/songs', () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                message: 'Validation failed',
                errors: ['Title already exists']
              }
            },
            { status: 400 }
          )
        })
      )
      
      render(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={async (data) => {
            const response = await fetch('/api/v1/songs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
            const result = await response.json()
            if (!result.success) {
              throw new Error(result.error.errors[0])
            }
          }}
        />
      )
      
      // Fill and submit
      await user.type(screen.getByLabelText(/title/i), 'Duplicate Song')
      const themeInput = screen.getByPlaceholderText(/type to search themes/i)
      await user.type(themeInput, 'worship')
      await user.keyboard('{Enter}')
      
      await user.click(screen.getByRole('button', { name: /create song/i }))
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/title already exists/i)).toBeInTheDocument()
      })
    })
    
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup()
      
      server.use(
        http.post('/api/v1/songs', () => {
          return HttpResponse.error()
        })
      )
      
      render(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={async (data) => {
            const response = await fetch('/api/v1/songs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
            if (!response.ok) {
              throw new Error('Network error')
            }
          }}
        />
      )
      
      // Fill and submit
      await user.type(screen.getByLabelText(/title/i), 'Test Song')
      const themeInput = screen.getByPlaceholderText(/type to search themes/i)
      await user.type(themeInput, 'worship')
      await user.keyboard('{Enter}')
      
      await user.click(screen.getByRole('button', { name: /create song/i }))
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })
  
  describe('Update Song Flow', () => {
    it('successfully updates an existing song', async () => {
      const user = userEvent.setup()
      const existingSong = songFactory.build()
      const mockOnSuccess = vi.fn()
      
      render(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          song={existingSong}
          onSubmit={async (data) => {
            const response = await fetch(`/api/v1/songs/${existingSong.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
            const result = await response.json()
            if (result.success) {
              mockOnSuccess(result.data)
            }
          }}
        />
      )
      
      // Modify title
      const titleInput = screen.getByDisplayValue(existingSong.title)
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')
      
      // Submit
      await user.click(screen.getByRole('button', { name: /update song/i }))
      
      // Verify update
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            id: existingSong.id,
            title: 'Updated Title'
          })
        )
      })
    })
  })
})
```

### Phase 4: Performance Tests

```typescript
// src/features/songs/__tests__/performance/SongFormPerformance.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '../../test-utils/render'
import { SongForm } from '../../components/forms/SongForm'
import { songFactory } from '../../test-utils/factories'

describe('Song Form Performance', () => {
  it('renders within performance budget', () => {
    const startTime = performance.now()
    
    render(
      <SongForm 
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    
    const renderTime = performance.now() - startTime
    
    // Should render within 100ms
    expect(renderTime).toBeLessThan(100)
  })
  
  it('handles large dataset efficiently', () => {
    const largeSongList = songFactory.buildList(1000)
    
    const startTime = performance.now()
    
    // Simulate duplicate detection with large dataset
    const normalizedTitles = largeSongList.map(s => 
      s.title.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    )
    
    const searchTime = performance.now() - startTime
    
    // Should process 1000 songs within 500ms
    expect(searchTime).toBeLessThan(500)
  })
  
  it('validates form efficiently', () => {
    const formData = songFactory.buildFormData()
    
    const startTime = performance.now()
    
    // Run validation 100 times
    for (let i = 0; i < 100; i++) {
      songFormSchema.safeParse(formData)
    }
    
    const validationTime = performance.now() - startTime
    
    // 100 validations should complete within 50ms
    expect(validationTime).toBeLessThan(50)
  })
})
```

### Phase 5: Accessibility Tests

```typescript
// src/features/songs/__tests__/accessibility/SongFormA11y.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test-utils/render'
import { axe, toHaveNoViolations } from 'jest-axe'
import { SongForm } from '../../components/forms/SongForm'

expect.extend(toHaveNoViolations)

describe('Song Form Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <SongForm 
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  it('has proper ARIA labels', () => {
    render(
      <SongForm 
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    
    // All form fields should have labels
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/artist/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ccli number/i)).toBeInTheDocument()
  })
  
  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    
    render(
      <SongForm 
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    
    // Tab through form fields
    await user.tab()
    expect(screen.getByLabelText(/title/i)).toHaveFocus()
    
    await user.tab()
    expect(screen.getByLabelText(/artist/i)).toHaveFocus()
    
    // Should be able to navigate backwards
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(screen.getByLabelText(/title/i)).toHaveFocus()
  })
  
  it('announces errors to screen readers', async () => {
    const user = userEvent.setup()
    
    render(
      <SongForm 
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    
    // Submit without required fields
    await user.click(screen.getByRole('button', { name: /create song/i }))
    
    // Error messages should have proper ARIA attributes
    await waitFor(() => {
      const errorMessage = screen.getByText(/title is required/i)
      expect(errorMessage).toHaveAttribute('role', 'alert')
      expect(errorMessage).toHaveAttribute('aria-live', 'polite')
    })
  })
})
```

### Phase 6: E2E Test Scenarios

```typescript
// src/features/songs/__tests__/e2e/SongManagement.e2e.ts
import { test, expect } from '@playwright/test'

test.describe('Song Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })
  
  test('Complete song creation flow', async ({ page }) => {
    // Click add song button
    await page.click('button:has-text("Add Song")')
    
    // Wait for modal
    await expect(page.locator('dialog')).toBeVisible()
    
    // Fill form
    await page.fill('input[aria-label="Title"]', 'E2E Test Song')
    await page.fill('input[aria-label="Artist"]', 'E2E Artist')
    await page.fill('input[aria-label="Year"]', '2024')
    
    // Add theme
    await page.fill('input[placeholder*="search themes"]', 'worship')
    await page.keyboard.press('Enter')
    
    // Add notes
    await page.fill('textarea[aria-label="Notes"]', 'This is an E2E test song')
    
    // Submit
    await page.click('button:has-text("Create Song")')
    
    // Wait for success notification
    await expect(page.locator('text=Song created successfully')).toBeVisible()
    
    // Verify song appears in list
    await page.goto('/songs')
    await expect(page.locator('text=E2E Test Song')).toBeVisible()
  })
  
  test('Edit existing song', async ({ page }) => {
    // Navigate to songs
    await page.goto('/songs')
    
    // Click edit on first song
    await page.click('button[aria-label*="Edit"]:first-of-type')
    
    // Wait for modal
    await expect(page.locator('dialog')).toBeVisible()
    
    // Modify title
    const titleInput = page.locator('input[aria-label="Title"]')
    await titleInput.clear()
    await titleInput.fill('Updated E2E Song')
    
    // Submit
    await page.click('button:has-text("Update Song")')
    
    // Verify update
    await expect(page.locator('text=Song updated successfully')).toBeVisible()
    await expect(page.locator('text=Updated E2E Song')).toBeVisible()
  })
  
  test('Delete song with confirmation', async ({ page }) => {
    await page.goto('/songs')
    
    // Count initial songs
    const initialCount = await page.locator('[data-testid="song-card"]').count()
    
    // Click delete on first song
    await page.click('button[aria-label*="Delete"]:first-of-type')
    
    // Confirm deletion
    await expect(page.locator('text=Are you sure')).toBeVisible()
    await page.click('button:has-text("Delete"):last-of-type')
    
    // Verify deletion
    await expect(page.locator('text=Song deleted')).toBeVisible()
    
    // Verify count decreased
    const finalCount = await page.locator('[data-testid="song-card"]').count()
    expect(finalCount).toBe(initialCount - 1)
  })
  
  test('Duplicate detection works', async ({ page }) => {
    // Create first song
    await page.click('button:has-text("Add Song")')
    await page.fill('input[aria-label="Title"]', 'Amazing Grace')
    await page.fill('input[placeholder*="search themes"]', 'worship')
    await page.keyboard.press('Enter')
    await page.click('button:has-text("Create Song")')
    
    // Try to create duplicate
    await page.click('button:has-text("Add Song")')
    await page.fill('input[aria-label="Title"]', 'Amazing Grace')
    
    // Should show duplicate warning
    await expect(page.locator('text=Similar songs found')).toBeVisible()
    await expect(page.locator('text=Amazing Grace')).toBeVisible()
    
    // Can continue anyway
    await page.click('button:has-text("Continue Anyway")')
    await expect(page.locator('text=Similar songs found')).not.toBeVisible()
  })
})
```

## Validation Gates

### Level 1: Unit Tests
```bash
npm run test -- src/features/songs/components/
npm run test -- src/features/songs/hooks/
npm run test -- src/features/songs/validation/
```

### Level 2: Integration Tests
```bash
npm run test -- src/features/songs/__tests__/integration/
```

### Level 3: Coverage Check
```bash
npm run test:coverage
# Ensure > 90% coverage for critical paths
```

### Level 4: Performance Tests
```bash
npm run test -- src/features/songs/__tests__/performance/
```

### Level 5: Accessibility Tests
```bash
npm run test -- src/features/songs/__tests__/accessibility/
```

### Level 6: E2E Tests
```bash
npx playwright test src/features/songs/__tests__/e2e/
```

## File Creation Order

1. `src/features/songs/test-utils/factories.ts`
2. `src/features/songs/test-utils/render.tsx`
3. `src/features/songs/components/forms/__tests__/SongForm.test.tsx`
4. `src/features/songs/components/forms/__tests__/ThemeCombobox.test.tsx`
5. `src/features/songs/hooks/__tests__/useSongMutations.test.tsx`
6. `src/features/songs/validation/__tests__/duplicateDetection.test.tsx`
7. `src/features/songs/__tests__/integration/SongFormIntegration.test.tsx`
8. `src/features/songs/__tests__/performance/SongFormPerformance.test.tsx`
9. `src/features/songs/__tests__/accessibility/SongFormA11y.test.tsx`
10. `src/features/songs/__tests__/e2e/SongManagement.e2e.ts`

## Success Metrics

- ✅ 90%+ code coverage
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ Zero accessibility violations
- ✅ Performance budgets met
- ✅ E2E scenarios complete
- ✅ No flaky tests
- ✅ < 5 minute test suite runtime

## Common Pitfalls to Avoid

1. **Flaky tests** - Use proper waitFor and async handling
2. **Test isolation** - Clear mocks and state between tests
3. **Over-mocking** - Test real behavior when possible
4. **Missing edge cases** - Test error states and boundaries
5. **Slow tests** - Mock external dependencies appropriately
6. **False positives** - Ensure tests actually verify behavior
7. **Maintenance burden** - Keep tests simple and focused

## External Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/)
- [Jest-Axe for A11y](https://github.com/nickcolley/jest-axe)
- [Playwright Documentation](https://playwright.dev/)

## Conclusion

This comprehensive testing strategy ensures the song forms feature is production-ready with high confidence through multiple layers of testing, from unit to E2E, covering functionality, performance, and accessibility.

**Confidence Score: 9.5/10** - Thorough testing approach with established patterns ensures reliability and maintainability.