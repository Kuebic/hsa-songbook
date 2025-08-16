# Setlist Playback Mode - Implementation PRP

## Executive Summary

This PRP provides comprehensive implementation instructions for the setlist playback mode feature, enabling sequential playback of arrangements with dynamic key transposition and intuitive navigation. The implementation follows the established vertical slice architecture, reuses existing components, and integrates with React Query for state management.

**Confidence Score: 9/10** - High confidence due to extensive component reuse and clear architectural patterns.

## Prerequisites

- **PRD Reference**: Read `PRPs/setlist-playback-mode-prd.md` for requirements
- **ChordPro Reference**: See `PRPs/ai_docs/chordpro-transposition-reference.md` for transposition details
- **Dependencies**: Existing ChordSheetJS v12.3.1, React Query v5, React Router v6

## Vertical Slice Architecture

### Feature Boundary Definition

The playback feature will be implemented as an extension to the existing setlists feature slice:

```
src/features/setlists/
├── components/
│   ├── playback/                    # NEW: Playback-specific components
│   │   ├── PlaybackMode.tsx         # Main playback container
│   │   ├── PlaybackHeader.tsx       # Progress & navigation
│   │   ├── PlaybackControls.tsx     # Next/prev/exit controls
│   │   ├── PlaybackKeySelector.tsx  # Key override control
│   │   └── PlaybackSongList.tsx     # Jump-to navigation
│   ├── builder/                      # UPDATED: Add playback integration
│   │   └── DraggableArrangementItem.tsx  # Update key display
├── hooks/
│   ├── mutations/
│   │   └── useUpdateArrangementKey.ts    # NEW: Key persistence
│   └── usePlaybackMode.ts               # NEW: Playback logic
├── pages/
│   └── SetlistPlaybackPage.tsx          # NEW: Playback route
├── services/
│   └── playbackService.ts               # NEW: Playback API
├── types/
│   └── playback.types.ts                # NEW: Playback types
└── index.ts                              # Export public API
```

### Cross-Feature Dependencies

- **arrangements**: Reuse `ChordSheetViewer`, `TransposeControls`, `ViewerLayout`
- **auth**: Check authentication for private setlists
- **shared**: Use notification system for errors

## Implementation Blueprint

### Phase 1: Core Playback Infrastructure

#### 1.1 Type Definitions

```typescript
// src/features/setlists/types/playback.types.ts
import type { Setlist, SetlistArrangement } from './setlist.types'
import type { Arrangement } from '@features/songs'

export interface PlaybackState {
  setlist: Setlist | null
  currentIndex: number
  isPlaying: boolean
  arrangements: PopulatedArrangement[]
  keyOverrides: Map<string, string>
  history: number[]
}

export interface PopulatedArrangement extends SetlistArrangement {
  arrangement: Arrangement  // Non-optional for playback
  playbackKey?: string      // Runtime key override
}

export interface PlaybackPreferences {
  autoAdvance: boolean
  autoAdvanceDelay: number  // seconds
  fontSize: number
  scrollSpeed: number
  showChords: boolean
}

export interface PlaybackNavigationEvent {
  from: number
  to: number
  method: 'next' | 'previous' | 'jump' | 'auto'
}
```

#### 1.2 Playback Service

```typescript
// src/features/setlists/services/playbackService.ts
import { fetchAPI } from '@shared/lib/api'
import type { Setlist } from '../types/setlist.types'
import type { PopulatedArrangement } from '../types/playback.types'

class PlaybackService {
  /**
   * Fetch setlist with fully populated arrangements for playback
   */
  async getPlayableSetlist(
    setlistId: string, 
    token?: string
  ): Promise<Setlist & { arrangements: PopulatedArrangement[] }> {
    const setlist = await fetchAPI<Setlist>(`/api/setlists/${setlistId}/playback`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
    
    // Ensure all arrangements are populated
    const populated = await Promise.all(
      setlist.arrangements.map(async (item) => {
        if (!item.arrangement) {
          const arr = await fetchAPI(`/api/arrangements/${item.arrangementId}`)
          return { ...item, arrangement: arr }
        }
        return item as PopulatedArrangement
      })
    )
    
    return { ...setlist, arrangements: populated }
  }
  
  /**
   * Save key override preference
   */
  async updateArrangementKey(
    setlistId: string,
    arrangementId: string,
    key: string,
    token?: string
  ): Promise<void> {
    await fetchAPI(`/api/setlists/${setlistId}/arrangements/${arrangementId}/key`, {
      method: 'POST',
      body: JSON.stringify({ key }),
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
  }
  
  /**
   * Preload next arrangement for smooth transitions
   */
  preloadArrangement(arrangementId: string): void {
    // Trigger fetch to warm cache
    fetchAPI(`/api/arrangements/${arrangementId}`, { 
      cache: 'force-cache' 
    }).catch(() => {}) // Silent fail for preload
  }
}

export const playbackService = new PlaybackService()
```

#### 1.3 Core Playback Hook

```typescript
// src/features/setlists/hooks/usePlaybackMode.ts
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@features/auth'
import { playbackService } from '../services/playbackService'
import type { PlaybackState, PlaybackNavigationEvent } from '../types/playback.types'

export function usePlaybackMode(setlistId?: string) {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [keyOverrides, setKeyOverrides] = useState(new Map<string, string>())
  const [history, setHistory] = useState<number[]>([0])
  
  // Fetch setlist with populated arrangements
  const { data: setlist, isLoading, error } = useQuery({
    queryKey: ['setlists', 'playback', setlistId],
    queryFn: async () => {
      const token = await getToken()
      return playbackService.getPlayableSetlist(setlistId!, token || undefined)
    },
    enabled: !!setlistId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Current arrangement with key override
  const currentArrangement = useMemo(() => {
    if (!setlist?.arrangements[currentIndex]) return null
    const arr = setlist.arrangements[currentIndex]
    
    return {
      ...arr,
      playbackKey: keyOverrides.get(arr.arrangementId) || 
                   arr.keyOverride || 
                   arr.arrangement.key
    }
  }, [setlist, currentIndex, keyOverrides])
  
  // Navigation methods
  const navigateNext = useCallback(() => {
    if (!setlist) return
    
    const nextIndex = Math.min(currentIndex + 1, setlist.arrangements.length - 1)
    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex)
      setHistory(prev => [...prev, nextIndex])
      
      // Preload next+1 if exists
      if (setlist.arrangements[nextIndex + 1]) {
        playbackService.preloadArrangement(
          setlist.arrangements[nextIndex + 1].arrangementId
        )
      }
    }
  }, [currentIndex, setlist])
  
  const navigatePrevious = useCallback(() => {
    const prevIndex = Math.max(currentIndex - 1, 0)
    if (prevIndex !== currentIndex) {
      setCurrentIndex(prevIndex)
      setHistory(prev => [...prev, prevIndex])
    }
  }, [currentIndex])
  
  const jumpTo = useCallback((index: number) => {
    if (!setlist) return
    
    const targetIndex = Math.max(0, Math.min(index, setlist.arrangements.length - 1))
    setCurrentIndex(targetIndex)
    setHistory(prev => [...prev, targetIndex])
    
    // Preload adjacent
    if (setlist.arrangements[targetIndex + 1]) {
      playbackService.preloadArrangement(
        setlist.arrangements[targetIndex + 1].arrangementId
      )
    }
  }, [setlist])
  
  const updateKey = useCallback((arrangementId: string, key: string) => {
    setKeyOverrides(prev => new Map(prev).set(arrangementId, key))
  }, [])
  
  const exitPlayback = useCallback(() => {
    navigate(`/setlists/${setlistId}`)
  }, [navigate, setlistId])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Skip if in input field
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          navigateNext()
          break
        case 'ArrowLeft':
          e.preventDefault()
          navigatePrevious()
          break
        case 'Escape':
          e.preventDefault()
          exitPlayback()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [navigateNext, navigatePrevious, exitPlayback])
  
  return {
    // State
    setlist,
    currentArrangement,
    currentIndex,
    totalCount: setlist?.arrangements.length || 0,
    isLoading,
    error,
    
    // Navigation
    canGoNext: currentIndex < (setlist?.arrangements.length || 0) - 1,
    canGoPrevious: currentIndex > 0,
    navigateNext,
    navigatePrevious,
    jumpTo,
    exitPlayback,
    
    // Key management
    updateKey,
    keyOverrides,
  }
}
```

### Phase 2: UI Components

#### 2.1 Main Playback Container

```typescript
// src/features/setlists/components/playback/PlaybackMode.tsx
import { ViewerLayout } from '@features/arrangements/components/ViewerLayout'
import { ChordSheetViewer } from '@features/arrangements/components/ChordSheetViewer'
import { useTransposition } from '@features/arrangements/hooks/useTransposition'
import { PlaybackHeader } from './PlaybackHeader'
import { PlaybackControls } from './PlaybackControls'
import { PlaybackKeySelector } from './PlaybackKeySelector'
import { usePlaybackMode } from '../../hooks/usePlaybackMode'

interface PlaybackModeProps {
  setlistId: string
  initialIndex?: number
}

export function PlaybackMode({ setlistId, initialIndex = 0 }: PlaybackModeProps) {
  const {
    setlist,
    currentArrangement,
    currentIndex,
    totalCount,
    isLoading,
    error,
    canGoNext,
    canGoPrevious,
    navigateNext,
    navigatePrevious,
    jumpTo,
    exitPlayback,
    updateKey,
  } = usePlaybackMode(setlistId)
  
  // Transposition for current arrangement
  const transpositionState = useTransposition(
    currentArrangement?.arrangement.key,
    {
      persist: true,
      storageKey: `playback-${currentArrangement?.arrangementId}`,
      initialSemitones: getSemitonesFromKeys(
        currentArrangement?.arrangement.key,
        currentArrangement?.playbackKey
      )
    }
  )
  
  // Handle key changes
  const handleKeyChange = (newKey: string) => {
    if (currentArrangement) {
      updateKey(currentArrangement.arrangementId, newKey)
      transpositionState.transposeToKey(newKey)
    }
  }
  
  // Jump to initial index on mount
  useEffect(() => {
    if (initialIndex > 0 && setlist) {
      jumpTo(initialIndex)
    }
  }, [initialIndex, setlist, jumpTo])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading playback mode...</div>
      </div>
    )
  }
  
  if (error || !currentArrangement) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">
          {error?.message || 'Failed to load arrangement'}
        </div>
        <button onClick={exitPlayback} className="ml-4 btn-secondary">
          Back to Setlist
        </button>
      </div>
    )
  }
  
  return (
    <ViewerLayout
      header={
        <PlaybackHeader
          setlistName={setlist?.name || ''}
          currentIndex={currentIndex}
          totalCount={totalCount}
          onExit={exitPlayback}
        />
      }
      toolbar={
        <div className="flex items-center gap-4">
          <PlaybackKeySelector
            currentKey={currentArrangement.playbackKey}
            originalKey={currentArrangement.arrangement.key}
            onKeyChange={handleKeyChange}
          />
          <div className="text-sm text-muted">
            {currentArrangement.arrangement.name}
          </div>
        </div>
      }
      content={
        <ChordSheetViewer
          content={currentArrangement.arrangement.content}
          transposition={transpositionState}
          fontSize={16} // TODO: Add preference control
        />
      }
      footer={
        <PlaybackControls
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          onNext={navigateNext}
          onPrevious={navigatePrevious}
          onJumpTo={jumpTo}
          arrangements={setlist?.arrangements || []}
          currentIndex={currentIndex}
        />
      }
    />
  )
}

// Helper function
function getSemitonesFromKeys(originalKey?: string, targetKey?: string): number {
  if (!originalKey || !targetKey || originalKey === targetKey) return 0
  
  const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const fromIndex = KEYS.indexOf(originalKey.replace('m', ''))
  const toIndex = KEYS.indexOf(targetKey.replace('m', ''))
  
  let diff = toIndex - fromIndex
  if (diff > 6) diff -= 12
  if (diff < -6) diff += 12
  
  return diff
}
```

#### 2.2 Playback Header

```typescript
// src/features/setlists/components/playback/PlaybackHeader.tsx
interface PlaybackHeaderProps {
  setlistName: string
  currentIndex: number
  totalCount: number
  onExit: () => void
}

export function PlaybackHeader({ 
  setlistName, 
  currentIndex, 
  totalCount, 
  onExit 
}: PlaybackHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b">
      <button 
        onClick={onExit}
        className="flex items-center gap-2 text-sm hover:text-primary"
      >
        <span>←</span>
        <span>Back</span>
      </button>
      
      <div className="flex items-center gap-4">
        <h2 className="font-semibold">{setlistName}</h2>
        <div className="text-sm text-muted">
          {currentIndex + 1} of {totalCount}
        </div>
      </div>
      
      <div className="flex gap-2">
        {/* Progress dots */}
        {Array.from({ length: totalCount }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIndex 
                ? 'bg-primary' 
                : i < currentIndex 
                  ? 'bg-muted' 
                  : 'bg-border'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
```

#### 2.3 Playback Controls

```typescript
// src/features/setlists/components/playback/PlaybackControls.tsx
import { useState } from 'react'
import { PlaybackSongList } from './PlaybackSongList'

interface PlaybackControlsProps {
  canGoNext: boolean
  canGoPrevious: boolean
  onNext: () => void
  onPrevious: () => void
  onJumpTo: (index: number) => void
  arrangements: any[]
  currentIndex: number
}

export function PlaybackControls({
  canGoNext,
  canGoPrevious,
  onNext,
  onPrevious,
  onJumpTo,
  arrangements,
  currentIndex
}: PlaybackControlsProps) {
  const [showSongList, setShowSongList] = useState(false)
  
  return (
    <div className="flex items-center justify-center gap-4 p-4 border-t">
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="btn-secondary"
        aria-label="Previous song"
      >
        Previous
      </button>
      
      <div className="relative">
        <button
          onClick={() => setShowSongList(!showSongList)}
          className="btn-secondary"
        >
          Song List ▼
        </button>
        
        {showSongList && (
          <PlaybackSongList
            arrangements={arrangements}
            currentIndex={currentIndex}
            onSelect={(index) => {
              onJumpTo(index)
              setShowSongList(false)
            }}
            onClose={() => setShowSongList(false)}
          />
        )}
      </div>
      
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="btn-primary"
        aria-label="Next song"
      >
        Next
      </button>
    </div>
  )
}
```

#### 2.4 Key Selector

```typescript
// src/features/setlists/components/playback/PlaybackKeySelector.tsx
import { useState } from 'react'

interface PlaybackKeySelectorProps {
  currentKey: string
  originalKey: string
  onKeyChange: (key: string) => void
}

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function PlaybackKeySelector({ 
  currentKey, 
  originalKey, 
  onKeyChange 
}: PlaybackKeySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1 border rounded"
      >
        <span className="font-semibold">Key: {currentKey}</span>
        <span className="text-xs text-muted">(Original: {originalKey})</span>
        <span>▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-1 bg-popover border rounded shadow-lg z-10">
          <div className="grid grid-cols-3 gap-1 p-2">
            {KEYS.map(key => (
              <button
                key={key}
                onClick={() => {
                  onKeyChange(key)
                  setIsOpen(false)
                }}
                className={`px-3 py-1 rounded hover:bg-accent ${
                  key === currentKey ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

### Phase 3: Arrangement Card Updates

#### 3.1 Update DraggableArrangementItem

```typescript
// src/features/setlists/components/builder/DraggableArrangementItem.tsx
// UPDATE existing component to show key prominently

export function DraggableArrangementItem({ 
  item, 
  onRemove,
  onKeyChange,
  disabled 
}: DraggableArrangementItemProps) {
  // ... existing drag logic ...
  
  const displayKey = item.keyOverride || item.arrangement?.key || 'C'
  const originalKey = item.arrangement?.key || 'C'
  
  return (
    <div ref={setNodeRef} style={style}>
      <div style={{/* existing styles */}}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Drag handle ... */}
          
          <div style={{ flex: 1 }}>
            <h4 style={{ /* styles */ }}>
              {item.order + 1}. {item.arrangement?.name || 'Loading...'}
              <span style={{ 
                marginLeft: '0.5rem', 
                fontWeight: 'bold',
                color: 'var(--color-primary)' 
              }}>
                - Key: {displayKey}
              </span>
            </h4>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem'
            }}>
              Original: {originalKey}
              {item.keyOverride && item.keyOverride !== originalKey && (
                <span style={{ 
                  color: 'var(--status-success)',
                  marginLeft: '0.5rem'
                }}>
                  (Transposed for setlist)
                </span>
              )}
            </div>
            {/* Notes if present */}
          </div>
        </div>
        
        {/* Remove button ... */}
      </div>
    </div>
  )
}
```

### Phase 4: Routing

#### 4.1 Add Routes

```typescript
// src/app/App.tsx
// ADD to existing routes

const SetlistPlaybackPage = lazy(() => 
  import('@features/setlists').then(module => ({ 
    default: module.SetlistPlaybackPage 
  }))
)

// In Routes
<Route path="/setlists/:id/play" element={<SetlistPlaybackPage />} />
<Route path="/setlists/:id/play/:index" element={<SetlistPlaybackPage />} />
```

#### 4.2 Create Playback Page

```typescript
// src/features/setlists/pages/SetlistPlaybackPage.tsx
import { useParams } from 'react-router-dom'
import { PlaybackMode } from '../components/playback/PlaybackMode'

export function SetlistPlaybackPage() {
  const { id, index } = useParams<{ id: string; index?: string }>()
  
  if (!id) {
    return <div>Invalid setlist ID</div>
  }
  
  return (
    <PlaybackMode 
      setlistId={id} 
      initialIndex={index ? parseInt(index, 10) : 0}
    />
  )
}
```

### Phase 5: Integration Points

#### 5.1 Add Play All Button

```typescript
// src/features/setlists/components/SetlistBuilder.tsx
// ADD to existing component

import { useNavigate } from 'react-router-dom'

export function SetlistBuilder({ setlist, /* ... */ }) {
  const navigate = useNavigate()
  
  const handlePlayAll = () => {
    navigate(`/setlists/${setlist.id}/play`)
  }
  
  return (
    <div style={{ padding: '1rem' }}>
      <SetlistHeader setlist={setlist} onUpdateName={onUpdateName} />
      
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={handlePlayAll}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--status-success)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
          disabled={setlist.arrangements.length === 0}
        >
          ▶ Play All
        </button>
        
        {/* Existing Add Arrangement button */}
      </div>
      
      {/* Rest of component */}
    </div>
  )
}
```

#### 5.2 Make Titles Clickable

```typescript
// src/features/setlists/components/builder/DraggableArrangementItem.tsx
// UPDATE title to be clickable

import { useNavigate } from 'react-router-dom'

export function DraggableArrangementItem({ item, /* ... */ }) {
  const navigate = useNavigate()
  
  const handleTitleClick = () => {
    // Navigate to playback mode at this song's index
    const setlistId = /* get from context or props */
    navigate(`/setlists/${setlistId}/play/${item.order}`)
  }
  
  return (
    // ... existing structure ...
    <h4 
      onClick={handleTitleClick}
      style={{ 
        /* ... existing styles */
        cursor: 'pointer',
        textDecoration: 'underline',
        '&:hover': { color: 'var(--color-primary)' }
      }}
    >
      {/* Title content */}
    </h4>
    // ...
  )
}
```

## Validation Gates

### Level 1: Type Checking & Linting
```bash
# TypeScript compilation
npm run tsc --noEmit

# ESLint
npm run lint

# Expected: No errors
```

### Level 2: Unit Tests
```bash
# Test playback hook
npm run test usePlaybackMode

# Test navigation logic
npm run test PlaybackControls

# Test key transposition
npm run test PlaybackKeySelector

# Expected: All tests pass
```

### Level 3: Integration Tests
```bash
# Test full playback flow
npm run test:e2e playback-flow

# Test keyboard navigation
npm run test:e2e playback-keyboard

# Expected: E2E tests pass
```

### Level 4: Build Verification
```bash
# Production build
npm run build

# Bundle analysis
npm run analyze

# Expected: Build succeeds, bundle size reasonable
```

### Level 5: Preview Testing
```bash
# Start preview server
npm run preview

# Manual testing checklist:
# - [ ] Play All button works
# - [ ] Navigation between songs smooth
# - [ ] Key changes persist
# - [ ] Title clicks jump correctly
# - [ ] Keyboard shortcuts work
# - [ ] Mobile responsive
```

## Implementation Checklist

### Phase 1: Core Infrastructure ✓
- [ ] Create playback types
- [ ] Implement playback service
- [ ] Create usePlaybackMode hook
- [ ] Add React Query integration
- [ ] Set up keyboard shortcuts

### Phase 2: UI Components ✓
- [ ] Create PlaybackMode container
- [ ] Build PlaybackHeader
- [ ] Implement PlaybackControls
- [ ] Add PlaybackKeySelector
- [ ] Create PlaybackSongList

### Phase 3: Card Updates ✓
- [ ] Update DraggableArrangementItem display
- [ ] Show key prominently
- [ ] Add original key reference
- [ ] Make titles clickable

### Phase 4: Routing ✓
- [ ] Add playback routes
- [ ] Create SetlistPlaybackPage
- [ ] Handle initial index param

### Phase 5: Integration ✓
- [ ] Add Play All button
- [ ] Wire up title clicks
- [ ] Test full flow
- [ ] Fix any issues

## Error Handling Strategy

### Network Errors
```typescript
// Graceful degradation with cached data
if (error?.status === 404) {
  return <NotFound />
}
if (error?.status === 403) {
  return <Unauthorized />
}
// Retry mechanism built into React Query
```

### Missing Arrangements
```typescript
// Fetch on demand if not populated
if (!item.arrangement) {
  const arr = await fetchArrangement(item.arrangementId)
  // Update cache
}
```

### Key Transposition Errors
```typescript
try {
  transposedContent = transposeChordPro(content, semitones)
} catch (err) {
  console.error('Transposition failed:', err)
  // Fallback to original
  return content
}
```

## Performance Optimizations

### Preloading Strategy
- Preload next arrangement when navigating
- Cache transposed versions in memory
- Use React Query cache for arrangement data

### Memoization
- Memoize transposed content
- Memoize current arrangement calculation
- Memoize navigation state

### Code Splitting
- Lazy load playback components
- Separate ChordSheetViewer bundle
- Dynamic import for transposition logic

## Testing Strategy

### Unit Tests
```typescript
// usePlaybackMode.test.ts
describe('usePlaybackMode', () => {
  it('navigates to next arrangement', () => {
    const { result } = renderHook(() => usePlaybackMode('setlist-1'))
    act(() => result.current.navigateNext())
    expect(result.current.currentIndex).toBe(1)
  })
  
  it('updates key override', () => {
    const { result } = renderHook(() => usePlaybackMode('setlist-1'))
    act(() => result.current.updateKey('arr-1', 'G'))
    expect(result.current.keyOverrides.get('arr-1')).toBe('G')
  })
})
```

### Integration Tests
```typescript
// playback-flow.test.tsx
it('plays through entire setlist', async () => {
  render(<SetlistPlaybackPage />)
  
  // Click through all songs
  const nextButton = screen.getByLabelText('Next song')
  
  for (let i = 0; i < 5; i++) {
    fireEvent.click(nextButton)
    await waitFor(() => {
      expect(screen.getByText(`${i + 2} of 6`)).toBeInTheDocument()
    })
  }
  
  // Should be disabled at end
  expect(nextButton).toBeDisabled()
})
```

## Accessibility Requirements

- **Keyboard Navigation**: Arrow keys, Escape, Space
- **ARIA Labels**: All buttons properly labeled
- **Focus Management**: Maintain focus on navigation
- **Screen Reader**: Announce position changes
- **High Contrast**: Respect theme preferences

## Documentation Updates

### User Documentation
- Add playback mode to user guide
- Document keyboard shortcuts
- Explain key override behavior

### Developer Documentation
- Update feature architecture docs
- Add playback API documentation
- Document testing procedures

## Success Metrics Tracking

### Analytics Events
```typescript
// Track playback usage
trackEvent('playback_started', { setlistId, songCount })
trackEvent('playback_navigation', { method: 'next' | 'previous' | 'jump' })
trackEvent('key_changed', { from, to })
trackEvent('playback_completed', { duration, songCount })
```

### Performance Monitoring
```typescript
// Web Vitals
measureNavigationTime('playback_next')
measureRenderTime('arrangement_display')
measureInteractionLatency('key_change')
```

## Deployment Checklist

- [ ] All tests passing
- [ ] Build succeeds
- [ ] Bundle size acceptable
- [ ] Performance metrics good
- [ ] Accessibility audit passed
- [ ] Documentation updated
- [ ] Feature flags configured
- [ ] Analytics instrumented

## References

- **PRD**: `PRPs/setlist-playback-mode-prd.md`
- **ChordPro Reference**: `PRPs/ai_docs/chordpro-transposition-reference.md`
- **Architecture Docs**: See research findings above
- **ChordSheetJS**: https://github.com/martijnversluis/ChordSheetJS
- **React Query**: https://tanstack.com/query/latest
- **React Router**: https://reactrouter.com/en/main

---

**Implementation Confidence: 9/10**

This PRP provides comprehensive implementation instructions with extensive code examples, clear architectural patterns, and thorough validation gates. The high confidence score reflects the mature codebase patterns, extensive component reuse, and clear implementation path.