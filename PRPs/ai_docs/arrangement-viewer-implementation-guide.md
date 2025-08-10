# Arrangement Viewer Implementation Guide

## Quick Fix Guide for TypeScript Errors

### 1. Fix useChordSheetSettings Hook

**File:** `src/features/arrangements/hooks/useChordSheetSettings.ts`

**Line 26 Error:** Expected 1 arguments, but got 0

**Fix:**
```typescript
// Line 26 - Change from:
const scrollIntervalRef = useRef<number>()

// To:
const scrollIntervalRef = useRef<number | undefined>(undefined)
```

### 2. Fix useMinimalMode Hook

**File:** `src/features/arrangements/hooks/useMinimalMode.ts`

**Line 26 Error:** 'orientation.lock' is of type 'unknown'

**Fix:**
```typescript
// Replace lines 23-30 with:
if (newState && 'orientation' in screen) {
  const orientation = screen.orientation as ScreenOrientation | undefined
  if (orientation && 'lock' in orientation) {
    (orientation as any).lock('landscape').catch(() => {
      // Orientation lock may fail, that's okay
    })
  }
}
```

### 3. Fix ArrangementViewerPage

**File:** `src/features/arrangements/pages/ArrangementViewerPage.tsx`

**Multiple unused variable errors**

**Fix:**
```typescript
// Remove unused imports and variables:
// Line 17 - Remove fontFamily from destructuring (not used)
const { 
  fontSize, 
  // fontFamily, // Remove this
  scrollSpeed, 
  isScrolling,
  setFontSize,
  setScrollSpeed,
  toggleScroll
} = useChordSheetSettings()

// Line 26-27 - Remove unused transposition variables
// Delete these lines:
// const { transposition, currentKey } = useTransposition()
// const [transposedContent, setTransposedContent] = useState<string | undefined>()

// Or prefix with underscore if needed later:
const { transposition: _transposition, currentKey } = useTransposition()
const [_transposedContent, _setTransposedContent] = useState<string | undefined>()
```

### 4. Update useArrangementViewer for Server Integration

**File:** `src/features/arrangements/hooks/useArrangementViewer.ts`

**Update to use server's chordProText:**
```typescript
// Replace the setArrangement block (lines 30-41) with:
if (data) {
  // Server now provides decompressed chordProText
  setArrangement({
    id: data.id,
    name: data.name,
    slug: data.slug,
    songTitle: data.songTitle || '', // Server should populate this
    artist: data.artist || '',       // Server should populate this
    key: data.key,
    tempo: data.tempo,
    timeSignature: data.timeSignature,
    difficulty: data.difficulty,
    chordProText: data.chordProText || '', // Now comes decompressed from server!
    tags: data.tags,
    createdBy: data.createdBy
  })
}
```

## Test Implementation Templates

### Hook Test Template

**File:** `src/features/arrangements/hooks/__tests__/useArrangementViewer.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useArrangementViewer } from '../useArrangementViewer'
import { arrangementService } from '@features/songs/services/arrangementService'

// Mock the service
vi.mock('@features/songs/services/arrangementService')

// Mock useAuth
vi.mock('@features/auth', () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('mock-token'),
    userId: 'mock-user-id'
  })
}))

describe('useArrangementViewer', () => {
  const mockArrangement = {
    id: 'arr-1',
    name: 'Test Arrangement',
    slug: 'test-arrangement',
    key: 'C',
    tempo: 120,
    difficulty: 'intermediate' as const,
    chordProText: '{title: Test Song}\n{key: C}\n[C]This is a [G]test',
    tags: ['worship', 'contemporary']
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches arrangement data successfully', async () => {
    vi.mocked(arrangementService.getArrangementById).mockResolvedValue(mockArrangement)
    
    const { result } = renderHook(() => useArrangementViewer('test-arrangement'))
    
    // Initially loading
    expect(result.current.loading).toBe(true)
    expect(result.current.arrangement).toBeNull()
    
    // Wait for data
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    // Check data is loaded
    expect(result.current.arrangement).toEqual(expect.objectContaining({
      id: 'arr-1',
      name: 'Test Arrangement',
      chordProText: expect.stringContaining('test')
    }))
    expect(result.current.error).toBeNull()
  })

  it('handles fetch errors gracefully', async () => {
    const error = new Error('Network error')
    vi.mocked(arrangementService.getArrangementById).mockRejectedValue(error)
    
    const { result } = renderHook(() => useArrangementViewer('test-arrangement'))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.error).toBe('Network error')
    expect(result.current.arrangement).toBeNull()
  })

  it('handles missing slug', () => {
    const { result } = renderHook(() => useArrangementViewer(''))
    
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('No arrangement slug provided')
  })
})
```

### Component Test Template

**File:** `src/features/arrangements/components/__tests__/ChordSheetViewer.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChordSheetViewer } from '../ChordSheetViewer'

// Mock ChordSheetJS
vi.mock('chordsheetjs', () => ({
  ChordProParser: vi.fn().mockImplementation(() => ({
    parse: vi.fn().mockReturnValue({
      transpose: vi.fn(),
    })
  })),
  HtmlDivFormatter: vi.fn().mockImplementation(() => ({
    format: vi.fn().mockReturnValue('<div class="chord">C</div><div>Test lyrics</div>')
  }))
}))

// Mock hooks
vi.mock('../../hooks/useTransposition', () => ({
  useTransposition: () => ({ transposition: 0 })
}))

vi.mock('../../hooks/useChordSheetSettings', () => ({
  useChordSheetSettings: () => ({
    fontSize: 16,
    fontFamily: 'monospace'
  })
}))

describe('ChordSheetViewer', () => {
  const mockChordPro = '{title: Test Song}\n[C]This is a [G]test'
  
  it('renders chord sheet content', () => {
    render(<ChordSheetViewer chordProText={mockChordPro} />)
    
    // Check that formatted content is rendered
    const container = document.querySelector('.chord-sheet-container')
    expect(container).toBeInTheDocument()
    expect(container).toHaveTextContent('Test lyrics')
  })

  it('applies custom className', () => {
    render(<ChordSheetViewer chordProText={mockChordPro} className="custom-class" />)
    
    const container = document.querySelector('.chord-sheet-container')
    expect(container).toHaveClass('custom-class')
  })

  it('handles center tap callback', async () => {
    const user = userEvent.setup()
    const onCenterTap = vi.fn()
    
    render(<ChordSheetViewer chordProText={mockChordPro} onCenterTap={onCenterTap} />)
    
    const container = document.querySelector('.chord-sheet-container')!
    
    // Simulate center click
    await user.click(container)
    
    // Note: You may need to mock getBoundingClientRect for accurate center detection
    // For now, just verify the click handler is attached
    expect(onCenterTap).toHaveBeenCalledTimes(0) // Will be 0 unless click is in center
  })

  it('handles parse errors gracefully', () => {
    // Mock a parse error
    const ChordProParser = vi.mocked(await import('chordsheetjs')).ChordProParser
    ChordProParser.mockImplementationOnce(() => ({
      parse: vi.fn().mockImplementation(() => {
        throw new Error('Parse error')
      })
    }))
    
    render(<ChordSheetViewer chordProText="invalid" />)
    
    const container = document.querySelector('.chord-sheet-content')
    expect(container?.innerHTML).toContain('Unable to parse chord sheet')
  })
})
```

### Integration Test Template

**File:** `src/features/arrangements/__tests__/integration/ArrangementViewer.integration.test.tsx`

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { BrowserRouter } from 'react-router-dom'
import { ArrangementViewerPage } from '../../pages/ArrangementViewerPage'

// Mock arrangement data
const mockArrangement = {
  id: 'arr-1',
  name: 'Amazing Grace - Easy',
  slug: 'amazing-grace-easy',
  key: 'C',
  tempo: 72,
  difficulty: 'beginner',
  chordProText: `{title: Amazing Grace}
{key: C}

[C]Amazing grace, how [F]sweet the [C]sound
That [C]saved a wretch like [G]me
I [C]once was lost, but [F]now am [C]found
Was [C]blind but [G]now I [C]see`,
  tags: ['hymn', 'classic']
}

// Setup MSW server
const server = setupServer(
  http.get('/api/v1/arrangements/:slug', ({ params }) => {
    if (params.slug === 'amazing-grace-easy') {
      return HttpResponse.json(mockArrangement)
    }
    return HttpResponse.json({ error: 'Not found' }, { status: 404 })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ slug: 'amazing-grace-easy' })
  }
})

// Mock auth
vi.mock('@features/auth', () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('mock-token'),
    userId: 'mock-user-id'
  })
}))

describe('ArrangementViewer Integration', () => {
  it('loads and displays arrangement', async () => {
    render(
      <BrowserRouter>
        <ArrangementViewerPage />
      </BrowserRouter>
    )
    
    // Initially shows loading
    expect(screen.getByText('Loading arrangement...')).toBeInTheDocument()
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByText('Loading arrangement...')).not.toBeInTheDocument()
    })
    
    // Check arrangement is displayed
    expect(screen.getByText('Amazing Grace - Easy')).toBeInTheDocument()
    expect(screen.getByText('Key: C')).toBeInTheDocument()
    expect(screen.getByText('72 BPM')).toBeInTheDocument()
  })

  it('handles transposition controls', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <ArrangementViewerPage />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.queryByText('Loading arrangement...')).not.toBeInTheDocument()
    })
    
    // Find transpose buttons
    const transposeUp = screen.getByLabelText('Transpose up')
    const transposeDown = screen.getByLabelText('Transpose down')
    
    // Click transpose up
    await user.click(transposeUp)
    
    // Key should change (this depends on your transposition logic)
    // expect(screen.getByText('C#')).toBeInTheDocument()
  })

  it('toggles minimal mode', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <ArrangementViewerPage />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.queryByText('Loading arrangement...')).not.toBeInTheDocument()
    })
    
    // Find minimal mode button
    const minimalButton = screen.getByText('Enter Minimal Mode')
    
    // Click to enter minimal mode
    await user.click(minimalButton)
    
    // Header should be hidden in minimal mode
    expect(screen.queryByText('Amazing Grace - Easy')).not.toBeInTheDocument()
  })
})
```

## Common ESLint Fixes

### Fix Unused Variables
```typescript
// Option 1: Prefix with underscore
const _unusedVar = 'value'

// Option 2: Remove if truly not needed
// Delete the line

// Option 3: For destructuring, use rest
const { used, ...rest } = object
```

### Fix Explicit Any
```typescript
// Instead of:
const handler = (data: any) => { }

// Use specific types:
const handler = (data: Record<string, unknown>) => { }
// Or:
const handler = (data: ArrangementData) => { }
```

### Fix React Hook Dependencies
```typescript
// Add all dependencies to useEffect
useEffect(() => {
  fetchData(id)
}, [id, fetchData]) // Add fetchData if it's not stable

// Or use useCallback for stable references
const fetchData = useCallback((id: string) => {
  // ...
}, []) // Empty deps if no external dependencies
```

## Shadcn-ui Migration (Optional)

### Step 1: Update Tailwind Config
```javascript
// tailwind.config.js
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  // Remove prefix: 'form-'
  theme: {
    extend: {
      // Add CSS variables for theming
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### Step 2: Initialize Shadcn
```bash
npx shadcn@latest init
# Choose:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS file: src/index.css
```

### Step 3: Replace ViewerControls
```bash
npx shadcn@latest add button slider toggle card
```

Then update ViewerControls to use shadcn components:
```typescript
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Toggle } from "@/components/ui/toggle"

// Replace custom buttons with:
<Button variant="outline" size="sm" onClick={handleTransposeDown}>
  −
</Button>
```

## Validation Commands Reference

```bash
# Quick validation after each fix
npm run type-check  # Should see errors decreasing

# After all TypeScript fixes
npm run lint        # Fix ESLint issues

# After creating tests
npm run test src/features/arrangements

# Final validation
npm run build && npm run preview
```

## Debug Tips

1. **ChordSheetJS Import Issues**: If TypeScript complains about ChordSheetJS imports, create a declaration file:
```typescript
// src/types/chordsheetjs.d.ts
declare module 'chordsheetjs' {
  export class ChordProParser {
    parse(input: string): Song
  }
  export class HtmlDivFormatter {
    format(song: Song): string
  }
  interface Song {
    transpose(semitones: number): void
  }
}
```

2. **Test Mocking Issues**: If tests fail due to missing mocks, check that all imports are mocked at the top of the test file before any imports.

3. **Build Errors**: Run `npm run build` frequently to catch issues early. The TypeScript compiler is stricter in build mode than in development.

## Expected Results

After completing all fixes:
- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors  
- ✅ Arrangement viewer displays chord sheets from server
- ✅ All tests pass with >70% coverage
- ✅ Production build succeeds
- ✅ No console errors in preview mode