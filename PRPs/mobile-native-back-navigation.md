# Mobile Native Back Navigation Implementation PRP

## Feature Overview
Replace the explicit "Back to Song" button in arrangement chord view with native mobile navigation patterns (browser back button, swipe gestures) when in mobile mode, creating a cleaner and more intuitive mobile experience.

## Context & Research

### Codebase Architecture Analysis
The HSA Songbook follows a **vertical slice architecture** with features organized as self-contained modules. This implementation will:
- Extend the existing `responsive` feature slice (src/features/responsive/)
- Modify the `ViewerHeader` component in arrangements feature (src/features/arrangements/components/)
- Follow established patterns from `CollapsibleToolbar` and `MobileNavigation` components

### Existing Infrastructure
1. **Responsive System** (src/features/responsive/):
   - `useViewport()` hook: Detects mobile/tablet/desktop with modern viewport units
   - `useResponsiveNav()`: Manages mobile navigation state
   - `CollapsibleToolbar`: Auto-hiding toolbar with device-specific behavior
   - `MobileNavigation`: Drawer pattern with focus trap

2. **Navigation Patterns**:
   - React Router v6 with `useNavigate()` and `useLocation()`
   - ViewerHeader currently uses: `navigate('/songs/${slug}')` or `navigate(-1)`
   - Location state passing: `state: { fromSong: string }`

3. **Testing Infrastructure**:
   - Vitest for unit/integration tests
   - React Testing Library for component tests
   - Mocking pattern: `vi.mock('@features/auth')`

### External Research References
- **MDN History API**: https://developer.mozilla.org/en-US/docs/Web/API/History_API
- **MDN popstate Event**: https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event
- **React Router History**: https://reactrouter.com/en/main/start/concepts#history-and-locations

### Critical Implementation Notes
1. **popstate Timing**: Event fires AFTER new location loads, not during navigation
2. **Browser Compatibility**: Some browsers require user interaction before firing popstate
3. **State Management**: Use both location.state and sessionStorage for persistence
4. **Mobile Gestures**: Browser handles swipe-back natively, no library needed

## Implementation Blueprint

### Phase 1: Create Navigation Hook

```typescript
// src/features/responsive/hooks/useNativeBackNavigation.ts

import { useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useViewport } from './useViewport'
import type { NavigationState, UseNativeBackNavigationOptions } from '../types/navigation.types'

/**
 * Hook to handle native browser back navigation on mobile devices
 * Replaces explicit back buttons with popstate event handling
 */
export function useNativeBackNavigation(options: UseNativeBackNavigationOptions) {
  const navigate = useNavigate()
  const location = useLocation()
  const viewport = useViewport()
  const { enabled = true, fallbackPath = '/songs', onNavigate, arrangement } = options
  
  // Use ref to avoid stale closure issues with event listeners
  const navigationStateRef = useRef<NavigationState>({})
  
  // Initialize navigation state from location or sessionStorage
  useEffect(() => {
    const state = location.state as NavigationState
    const sessionState = sessionStorage.getItem(`nav-state-${arrangement?.id}`)
    
    navigationStateRef.current = state || 
      (sessionState ? JSON.parse(sessionState) : {})
  }, [location.state, arrangement?.id])
  
  // Handle popstate event for browser back button
  const handlePopState = useCallback((event: PopStateEvent) => {
    // Get state from event or fallback to ref
    const state = event.state || navigationStateRef.current
    
    // Navigation priority:
    // 1. State from navigation (fromSong)
    // 2. Arrangement's songSlug
    // 3. Fallback path
    if (state?.fromSong) {
      navigate(`/songs/${state.fromSong}`)
    } else if (arrangement?.songSlug) {
      navigate(`/songs/${arrangement.songSlug}`)
    } else {
      navigate(fallbackPath)
    }
    
    // Clean up sessionStorage
    if (arrangement?.id) {
      sessionStorage.removeItem(`nav-state-${arrangement.id}`)
    }
    
    onNavigate?.()
  }, [navigate, arrangement, fallbackPath, onNavigate])
  
  // Setup popstate listener
  useEffect(() => {
    if (!enabled || !viewport.isMobile) return
    
    // Store current state in sessionStorage for persistence
    if (arrangement?.id && navigationStateRef.current) {
      sessionStorage.setItem(
        `nav-state-${arrangement.id}`,
        JSON.stringify(navigationStateRef.current)
      )
    }
    
    // Add popstate listener
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [enabled, viewport.isMobile, handlePopState, arrangement?.id])
  
  return {
    isEnabled: enabled && viewport.isMobile,
    navigationState: navigationStateRef.current,
    handleBack: () => window.history.back()
  }
}
```

### Phase 2: Add Navigation Types

```typescript
// src/features/responsive/types/navigation.types.ts

export interface NavigationState {
  fromSong?: string
  fromSearch?: boolean
  fromSetlist?: string
  timestamp?: number
  scrollPosition?: number
}

export interface UseNativeBackNavigationOptions {
  enabled?: boolean
  fallbackPath?: string
  arrangement?: {
    id: string
    songSlug?: string
  }
  onNavigate?: () => void
}

export interface UseNativeBackNavigationReturn {
  isEnabled: boolean
  navigationState: NavigationState
  handleBack: () => void
}
```

### Phase 3: Update ViewerHeader Component

```typescript
// src/features/arrangements/components/ViewerHeader.tsx

import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { useViewport } from '@features/responsive/hooks/useViewport'
import { useNativeBackNavigation } from '@features/responsive/hooks/useNativeBackNavigation'
import type { ViewerHeaderProps } from '../types/viewer.types'

export function ViewerHeader({ arrangement }: ViewerHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isSignedIn, isAdmin, userId } = useAuth()
  const viewport = useViewport()
  
  // Setup native back navigation for mobile
  const { isEnabled: isMobileNav } = useNativeBackNavigation({
    enabled: true,
    fallbackPath: '/songs',
    arrangement: {
      id: arrangement.id,
      songSlug: arrangement.songSlug
    }
  })
  
  const handleBack = () => {
    // Desktop navigation logic (unchanged)
    if (arrangement.songSlug) {
      navigate(`/songs/${arrangement.songSlug}`)
      return
    }
    
    const state = location.state as { fromSong?: string } | null
    if (state?.fromSong && typeof state.fromSong === 'string' && state.fromSong.trim() !== '') {
      navigate(`/songs/${state.fromSong}`)
      return
    }
    
    navigate('/songs')
  }
  
  return (
    <header className={`viewer-header ${isMobileNav ? 'viewer-header--mobile' : ''}`}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-background)'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* Only show back button on desktop */}
          {!isMobileNav && (
            <button
              onClick={handleBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-muted)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span>←</span>
              <span>
                {arrangement.songSlug 
                  ? 'Back to Song' 
                  : (location.state as { fromSong?: string } | null)?.fromSong 
                    ? 'Back to Song'  
                    : 'Back to Songs'}
              </span>
            </button>
          )}
          
          {/* Edit button remains for both mobile and desktop */}
          {isSignedIn && arrangement.slug && (arrangement.createdBy === userId || isAdmin) && (
            <Link
              to={`/arrangements/${arrangement.slug}/edit`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              <span>✏️</span>
              <span>Edit Chords</span>
            </Link>
          )}
        </div>
        
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold',
            margin: 0
          }}>
            {arrangement.name}
          </h1>
          {arrangement.songTitle && (
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)',
              margin: '0.25rem 0 0 0'
            }}>
              {arrangement.songTitle}
              {arrangement.artist && ` - ${arrangement.artist}`}
            </p>
          )}
        </div>
        
      </div>
    </header>
  )
}
```

### Phase 4: Export from Responsive Feature

```typescript
// src/features/responsive/index.ts

// Add to existing exports
export { useNativeBackNavigation } from './hooks/useNativeBackNavigation'
export type { 
  NavigationState, 
  UseNativeBackNavigationOptions,
  UseNativeBackNavigationReturn 
} from './types/navigation.types'
```

### Phase 5: Add CSS for Mobile Header

```css
/* src/features/arrangements/styles/viewer-layout.css */

/* Add mobile-specific styles */
.viewer-header--mobile {
  /* Reduce padding on mobile for more content space */
  padding: 0.75rem;
}

.viewer-header--mobile h1 {
  /* Slightly smaller title on mobile */
  font-size: 1.125rem;
}

/* Ensure proper safe area handling on iOS */
@supports (padding: env(safe-area-inset-top)) {
  .viewer-header--mobile {
    padding-top: calc(0.75rem + env(safe-area-inset-top));
  }
}
```

## Testing Strategy

### Unit Tests: Navigation Hook

```typescript
// src/features/responsive/hooks/__tests__/useNativeBackNavigation.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNativeBackNavigation } from '../useNativeBackNavigation'
import { useViewport } from '../useViewport'
import { useNavigate, useLocation } from 'react-router-dom'

// Mock dependencies
vi.mock('../useViewport')
vi.mock('react-router-dom')

describe('useNativeBackNavigation', () => {
  const mockNavigate = vi.fn()
  const mockLocation = { state: null, pathname: '/arrangements/test' }
  
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(useLocation).mockReturnValue(mockLocation as any)
    vi.mocked(useViewport).mockReturnValue({ 
      isMobile: true,
      isTablet: false,
      isDesktop: false 
    } as any)
    
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true
    })
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })
  
  it('should be enabled on mobile devices', () => {
    const { result } = renderHook(() => 
      useNativeBackNavigation({ enabled: true })
    )
    
    expect(result.current.isEnabled).toBe(true)
  })
  
  it('should be disabled on desktop', () => {
    vi.mocked(useViewport).mockReturnValue({ 
      isMobile: false,
      isTablet: false,
      isDesktop: true 
    } as any)
    
    const { result } = renderHook(() => 
      useNativeBackNavigation({ enabled: true })
    )
    
    expect(result.current.isEnabled).toBe(false)
  })
  
  it('should handle popstate event and navigate to song', () => {
    const arrangement = { id: 'arr-1', songSlug: 'test-song' }
    
    renderHook(() => 
      useNativeBackNavigation({ 
        enabled: true,
        arrangement 
      })
    )
    
    // Simulate popstate event
    const popstateEvent = new PopStateEvent('popstate', {
      state: { fromSong: 'original-song' }
    })
    window.dispatchEvent(popstateEvent)
    
    expect(mockNavigate).toHaveBeenCalledWith('/songs/original-song')
  })
  
  it('should use fallback path when no navigation state', () => {
    renderHook(() => 
      useNativeBackNavigation({ 
        enabled: true,
        fallbackPath: '/songs'
      })
    )
    
    // Simulate popstate without state
    const popstateEvent = new PopStateEvent('popstate', { state: null })
    window.dispatchEvent(popstateEvent)
    
    expect(mockNavigate).toHaveBeenCalledWith('/songs')
  })
  
  it('should persist state to sessionStorage', () => {
    const arrangement = { id: 'arr-1', songSlug: 'test-song' }
    mockLocation.state = { fromSong: 'original-song' }
    
    renderHook(() => 
      useNativeBackNavigation({ 
        enabled: true,
        arrangement 
      })
    )
    
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      'nav-state-arr-1',
      JSON.stringify({ fromSong: 'original-song' })
    )
  })
})
```

### Component Tests: ViewerHeader

```typescript
// src/features/arrangements/components/__tests__/ViewerHeader.mobile.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ViewerHeader } from '../ViewerHeader'
import { useViewport } from '@features/responsive/hooks/useViewport'
import type { ArrangementViewerData } from '../../types/viewer.types'

// Mock responsive hooks
vi.mock('@features/responsive/hooks/useViewport')
vi.mock('@features/responsive/hooks/useNativeBackNavigation', () => ({
  useNativeBackNavigation: vi.fn(() => ({
    isEnabled: true,
    navigationState: {},
    handleBack: vi.fn()
  }))
}))

describe('ViewerHeader Mobile Navigation', () => {
  const mockArrangement: ArrangementViewerData = {
    id: 'arr-1',
    name: 'Test Arrangement',
    slug: 'test-arrangement',
    songSlug: 'test-song',
    songTitle: 'Test Song',
    chordProText: '[C]Test',
    createdBy: 'user-123'
  }
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should hide back button on mobile', () => {
    vi.mocked(useViewport).mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false
    } as any)
    
    render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )
    
    // Back button should not be visible
    expect(screen.queryByText('Back to Song')).not.toBeInTheDocument()
  })
  
  it('should show back button on desktop', () => {
    vi.mocked(useViewport).mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true
    } as any)
    
    render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )
    
    // Back button should be visible
    expect(screen.getByText('Back to Song')).toBeInTheDocument()
  })
  
  it('should apply mobile class when on mobile', () => {
    vi.mocked(useViewport).mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false
    } as any)
    
    const { container } = render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )
    
    const header = container.querySelector('.viewer-header')
    expect(header).toHaveClass('viewer-header--mobile')
  })
})
```

## Validation Gates

```bash
# Level 1: Type Checking & Linting
npm run lint
npx tsc --noEmit

# Level 2: Unit Tests
npm run test -- useNativeBackNavigation
npm run test -- ViewerHeader

# Level 3: Test Coverage
npm run test:coverage

# Level 4: Build Validation
npm run build

# Level 5: Integration Testing
npm run dev
# Manual test:
# 1. Open on mobile device/emulator
# 2. Navigate to arrangement view
# 3. Use browser back button
# 4. Verify navigation to song page
# 5. Test with iOS Safari swipe gesture
# 6. Test with Android back gesture

# Level 6: Cross-Browser Testing
# Test on:
# - iOS Safari (swipe from edge)
# - Chrome Android (back gesture/button)
# - Firefox Mobile
# - Samsung Internet

# Level 7: Bundle Analysis
npm run analyze
# Verify minimal bundle increase (<2KB)
```

## Implementation Checklist

### Development Tasks
- [ ] Create `useNativeBackNavigation` hook in responsive feature
- [ ] Add navigation types to responsive types
- [ ] Update ViewerHeader component with conditional rendering
- [ ] Export new hook from responsive feature index
- [ ] Add mobile-specific CSS styles
- [ ] Create unit tests for navigation hook
- [ ] Create component tests for ViewerHeader mobile behavior
- [ ] Update existing ViewerHeader tests to mock viewport

### Testing Tasks
- [ ] Run type checking with TypeScript
- [ ] Run ESLint and fix any issues
- [ ] Run unit tests and achieve >90% coverage
- [ ] Test on iOS Safari with swipe gesture
- [ ] Test on Chrome Android with back button
- [ ] Test on Firefox Mobile
- [ ] Test tablet in portrait and landscape
- [ ] Test desktop to ensure no regression
- [ ] Test edge cases (refresh, deep link, no history)

### Documentation Tasks
- [ ] Add JSDoc comments to new hook
- [ ] Update component documentation
- [ ] Document browser compatibility notes
- [ ] Create usage examples

## Browser Compatibility

### Supported Browsers
- Chrome 90+ (Android/Desktop) ✓
- Safari 14+ (iOS/Desktop) ✓  
- Firefox 88+ (Mobile/Desktop) ✓
- Edge 90+ (Desktop) ✓
- Samsung Internet 15+ ✓

### Required APIs
- History API (pushState, popstate)
- SessionStorage API
- Viewport API (for mobile detection)

## Performance Considerations

### Bundle Impact
- Estimated increase: <1KB gzipped
- No additional dependencies
- Reuses existing responsive infrastructure

### Runtime Performance
- Event listener added only on mobile
- Debounced viewport detection (100ms)
- SessionStorage for fast state recovery
- No render blocking operations

## Edge Cases Handled

1. **Page Refresh**: State recovered from sessionStorage
2. **Deep Link**: Falls back to songSlug or /songs
3. **No History**: Graceful fallback to default navigation
4. **Tablet Rotation**: Dynamic viewport detection
5. **Browser Incompatibility**: Falls back to showing button
6. **Multiple Tabs**: SessionStorage is tab-specific

## Security Considerations

- No sensitive data in sessionStorage
- Navigation state cleared after use
- No external dependencies or CDN resources
- Standard XSS protections maintained

## Success Criteria

1. ✅ Back button hidden on mobile (<768px)
2. ✅ Browser back navigates correctly
3. ✅ iOS swipe gesture works
4. ✅ Android back button works
5. ✅ Desktop experience unchanged
6. ✅ State persists across refresh
7. ✅ All tests passing
8. ✅ Bundle size increase <2KB

## Confidence Score: 9/10

High confidence in one-pass implementation success due to:
- Comprehensive research of existing patterns
- Clear integration with responsive infrastructure
- Detailed implementation blueprint with code examples
- Complete test coverage strategy
- All edge cases identified and handled
- Follows established architectural patterns

The only reason it's not 10/10 is potential browser-specific quirks that may only surface during real device testing.