# PRP: Arrangement Viewer with Minimal UI

## Overview
Create a dedicated arrangement viewer page that displays chord sheets using ChordSheetJS with a minimal, mobile-friendly interface. Users can tap the center to toggle UI visibility, showing only the rendered chords in fullscreen mode.

## Context

### Requirements
- Navigate to arrangement viewer when an arrangement is selected
- Render ChordPro data using ChordSheetJS library
- Minimal UI using shadcn-ui components
- Mobile-first design with tap-to-toggle UI
- Fullscreen mode for immersive viewing
- Support for transposition and controls

### Documentation References
- ChordSheetJS Integration Guide: `PRPs/ai_docs/chordsheetjs-integration-guide.md`
- ChordSheetJS Official: https://www.chordsheetjs.org/
- shadcn-ui Documentation: https://ui.shadcn.com/docs
- React Router v6: https://reactrouter.com/en/main

## Architecture

### Vertical Slice Structure
```
src/features/arrangements/
├── pages/
│   └── ArrangementViewerPage.tsx      # Main page component
├── components/
│   ├── ChordSheetViewer.tsx          # ChordSheetJS wrapper
│   ├── ViewerControls.tsx            # Transposition, scroll, font controls
│   ├── ViewerHeader.tsx              # Song info header
│   └── MinimalModeToggle.tsx         # UI visibility toggle
├── hooks/
│   ├── useArrangementViewer.ts       # Main viewer logic
│   ├── useChordSheet.ts              # ChordSheetJS integration
│   ├── useTransposition.ts           # Transposition logic
│   └── useMinimalMode.ts             # Fullscreen/minimal mode
├── services/
│   └── chordSheetService.ts          # ChordSheetJS utilities
├── styles/
│   └── chordsheet.css                # ChordSheetJS styling
└── types/
    └── viewer.types.ts                # TypeScript definitions
```

### Data Flow
1. User clicks arrangement → Navigate to `/arrangements/:id/view`
2. Load arrangement data (already cached from previous page)
3. Decompress ChordPro data from backend
4. Parse with ChordSheetJS
5. Render with HtmlDivFormatter for responsive display
6. Handle user interactions (transposition, minimal mode, etc.)

## Implementation Blueprint

### Phase 1: Setup and Dependencies

#### 1.1 Install Dependencies
```bash
npm install chordsheetjs
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card slider sheet badge separator
```

#### 1.2 Configure shadcn-ui
```typescript
// Update tailwind.config.js with shadcn-ui requirements
// Update globals.css with CSS variables
```

### Phase 2: Core Components

#### 2.1 Route Configuration
```typescript
// src/app/App.tsx
const ArrangementViewerPage = lazy(() => 
  import('@features/arrangements').then(m => ({ default: m.ArrangementViewerPage }))
)

// Add route
<Route 
  path="/arrangements/:id/view" 
  element={
    <ErrorBoundary level="page">
      <LazyRouteWrapper pageName="Arrangement Viewer">
        <ArrangementViewerPage />
      </LazyRouteWrapper>
    </ErrorBoundary>
  } 
/>
```

#### 2.2 Main Page Component
```typescript
// src/features/arrangements/pages/ArrangementViewerPage.tsx
export function ArrangementViewerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { arrangement, loading, error } = useArrangementViewer(id!)
  const { isMinimal, toggleMinimal } = useMinimalMode()
  
  if (loading) return <LoadingSpinner />
  if (error || !arrangement) return <ErrorFallback />
  
  return (
    <div className={cn(
      "arrangement-viewer",
      isMinimal && "arrangement-viewer--minimal"
    )}>
      {!isMinimal && <ViewerHeader arrangement={arrangement} />}
      
      <ChordSheetViewer 
        chordProText={arrangement.chordProText}
        onCenterTap={toggleMinimal}
        className={cn(
          "flex-1",
          isMinimal && "fullscreen"
        )}
      />
      
      {!isMinimal && <ViewerControls />}
    </div>
  )
}
```

#### 2.3 ChordSheet Integration
```typescript
// src/features/arrangements/components/ChordSheetViewer.tsx
import { ChordProParser, HtmlDivFormatter } from 'chordsheetjs'
import { useMemo, useRef } from 'react'
import { useTransposition } from '../hooks/useTransposition'
import { useChordSheetSettings } from '../hooks/useChordSheetSettings'

export function ChordSheetViewer({ 
  chordProText, 
  onCenterTap,
  className 
}: ChordSheetViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { transposition } = useTransposition()
  const { fontSize, fontFamily, scrollSpeed } = useChordSheetSettings()
  
  const formattedHtml = useMemo(() => {
    try {
      const parser = new ChordProParser()
      const song = parser.parse(chordProText)
      
      if (transposition !== 0) {
        song.transpose(transposition)
      }
      
      const formatter = new HtmlDivFormatter()
      return formatter.format(song)
    } catch (error) {
      console.error('ChordSheet parse error:', error)
      return '<div class="error">Unable to parse chord sheet</div>'
    }
  }, [chordProText, transposition])
  
  const handleCenterTap = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    
    // Check if click is within center area (40% of container)
    const threshold = 0.4
    if (
      Math.abs(clickX - centerX) < rect.width * threshold / 2 &&
      Math.abs(clickY - centerY) < rect.height * threshold / 2
    ) {
      onCenterTap?.()
    }
  }
  
  return (
    <div 
      ref={containerRef}
      className={cn("chord-sheet-container", className)}
      onClick={handleCenterTap}
      style={{
        fontSize: `${fontSize}px`,
        fontFamily
      }}
    >
      <div 
        className="chord-sheet-content"
        dangerouslySetInnerHTML={{ __html: formattedHtml }}
      />
    </div>
  )
}
```

#### 2.4 Minimal Mode Hook
```typescript
// src/features/arrangements/hooks/useMinimalMode.ts
export function useMinimalMode() {
  const [isMinimal, setIsMinimal] = useState(false)
  
  const toggleMinimal = useCallback(() => {
    const newState = !isMinimal
    setIsMinimal(newState)
    
    // Handle fullscreen API
    if (newState && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err)
      })
    } else if (!newState && document.fullscreenElement) {
      document.exitFullscreen()
    }
    
    // Lock orientation on mobile
    if (newState && 'orientation' in screen && 'lock' in screen.orientation) {
      screen.orientation.lock('landscape').catch(() => {
        // Orientation lock may fail, that's okay
      })
    }
  }, [isMinimal])
  
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMinimal) {
        toggleMinimal()
      }
    }
    
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isMinimal, toggleMinimal])
  
  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isMinimal) {
        setIsMinimal(false)
      }
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [isMinimal])
  
  return { isMinimal, toggleMinimal }
}
```

#### 2.5 Viewer Controls (shadcn-ui)
```typescript
// src/features/arrangements/components/ViewerControls.tsx
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card } from '@/components/ui/card'
import { 
  ChevronUp, 
  ChevronDown, 
  ZoomIn, 
  ZoomOut,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

export function ViewerControls() {
  const { transpose, reset } = useTransposition()
  const { 
    fontSize, 
    setFontSize, 
    isScrolling, 
    toggleScroll,
    scrollSpeed,
    setScrollSpeed 
  } = useChordSheetSettings()
  
  return (
    <Card className="viewer-controls fixed bottom-4 left-1/2 -translate-x-1/2 p-2">
      <div className="flex items-center gap-2">
        {/* Transposition */}
        <div className="flex items-center gap-1">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => transpose(-1)}
            aria-label="Transpose down"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button 
            size="sm"
            variant="ghost"
            onClick={reset}
            aria-label="Reset transposition"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button 
            size="sm"
            variant="ghost"
            onClick={() => transpose(1)}
            aria-label="Transpose up"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Font Size */}
        <div className="flex items-center gap-1">
          <Button 
            size="sm"
            variant="ghost"
            onClick={() => setFontSize(Math.max(12, fontSize - 2))}
            aria-label="Decrease font size"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-8 text-center">{fontSize}</span>
          <Button 
            size="sm"
            variant="ghost"
            onClick={() => setFontSize(Math.min(32, fontSize + 2))}
            aria-label="Increase font size"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Auto-scroll */}
        <div className="flex items-center gap-2">
          <Button 
            size="sm"
            variant={isScrolling ? "default" : "ghost"}
            onClick={toggleScroll}
            aria-label={isScrolling ? "Stop scrolling" : "Start scrolling"}
          >
            {isScrolling ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Slider 
            value={[scrollSpeed]}
            onValueChange={([value]) => setScrollSpeed(value)}
            min={10}
            max={100}
            step={10}
            className="w-20"
            disabled={!isScrolling}
          />
        </div>
      </div>
    </Card>
  )
}
```

### Phase 3: Styling

#### 3.1 ChordSheet CSS
```css
/* src/features/arrangements/styles/chordsheet.css */
.chord-sheet-container {
  @apply relative w-full h-full overflow-auto;
  @apply bg-background text-foreground;
  @apply transition-all duration-300;
}

.chord-sheet-container.fullscreen {
  @apply fixed inset-0 z-50;
  @apply bg-black text-white;
}

.chord-sheet-content {
  @apply p-4 md:p-8;
  @apply max-w-4xl mx-auto;
  white-space: pre-wrap;
  line-height: 1.8;
}

/* ChordSheetJS specific styles */
.chord-sheet-content .chord {
  @apply font-bold text-primary;
  @apply relative -top-1;
  @apply inline-block min-w-[3ch];
}

.chord-sheet-content .directive {
  @apply italic text-muted-foreground;
}

.chord-sheet-content .chorus,
.chord-sheet-content .verse,
.chord-sheet-content .bridge {
  @apply font-bold mt-4 mb-2;
  @apply text-lg;
}

/* Minimal mode styles */
.arrangement-viewer--minimal .chord-sheet-content {
  @apply p-8 md:p-12;
}

.arrangement-viewer--minimal .chord {
  @apply text-yellow-400;
}

/* Mobile optimization */
@media (max-width: 640px) {
  .chord-sheet-content {
    @apply p-2 text-sm;
  }
  
  .viewer-controls {
    @apply bottom-2 scale-90;
  }
}

/* Print styles */
@media print {
  .viewer-controls,
  .viewer-header {
    display: none !important;
  }
  
  .chord-sheet-content {
    @apply text-black bg-white;
  }
}

/* Center tap area indicator */
.chord-sheet-container::before {
  content: '';
  @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
  @apply w-2/5 h-2/5;
  @apply opacity-0 hover:opacity-5;
  @apply bg-primary rounded-lg;
  @apply pointer-events-none;
  @apply transition-opacity;
}
```

### Phase 4: Navigation Integration

#### 4.1 Update Song/Arrangement Components
```typescript
// Add navigation to ArrangementList.tsx
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()

const handleViewArrangement = (arrangementId: string) => {
  navigate(`/arrangements/${arrangementId}/view`)
}

// Add view button to each arrangement card
<Button 
  size="sm"
  onClick={() => handleViewArrangement(arrangement.id)}
>
  View
</Button>
```

#### 4.2 Update ArrangementSwitcher
```typescript
// Add direct view option in ArrangementSwitcher
const handleArrangementSelect = (arrangementId: string) => {
  if (viewMode === 'inline') {
    selectArrangement(arrangementId)
  } else {
    navigate(`/arrangements/${arrangementId}/view`)
  }
}
```

### Phase 5: Mobile Enhancements

#### 5.1 Touch Gestures
```typescript
// src/features/arrangements/hooks/useSwipeGestures.ts
export function useSwipeGestures(
  onSwipeUp?: () => void,
  onSwipeDown?: () => void
) {
  const touchStart = useRef<{ x: number; y: number }>()
  
  const handleTouchStart = (e: TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }
  
  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return
    
    const deltaX = e.changedTouches[0].clientX - touchStart.current.x
    const deltaY = e.changedTouches[0].clientY - touchStart.current.y
    
    // Vertical swipe detection
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      if (deltaY < 0) {
        onSwipeUp?.()
      } else {
        onSwipeDown?.()
      }
    }
  }
  
  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipeUp, onSwipeDown])
}
```

#### 5.2 PWA Manifest Update
```typescript
// Update vite.config.ts manifest
manifest: {
  // ... existing config
  display_override: ['fullscreen', 'standalone'],
  orientation: 'any', // Allow both portrait and landscape
}
```

## Testing Strategy

### Unit Tests
```typescript
// src/features/arrangements/components/__tests__/ChordSheetViewer.test.tsx
describe('ChordSheetViewer', () => {
  it('renders ChordPro content correctly', () => {
    const chordPro = '{title: Test Song}\n[C]This is a [G]test'
    render(<ChordSheetViewer chordProText={chordPro} />)
    expect(screen.getByText(/This is a/)).toBeInTheDocument()
  })
  
  it('handles transposition', () => {
    // Test transposition logic
  })
  
  it('toggles minimal mode on center tap', () => {
    // Test center tap detection
  })
})
```

### Integration Tests
```typescript
// src/features/arrangements/pages/__tests__/ArrangementViewerPage.test.tsx
describe('ArrangementViewerPage', () => {
  it('loads arrangement from URL parameter', async () => {
    // Test data loading
  })
  
  it('handles fullscreen mode', () => {
    // Test fullscreen API
  })
  
  it('persists user settings', () => {
    // Test localStorage persistence
  })
})
```

### Accessibility Tests
```typescript
describe('Accessibility', () => {
  it('has no violations in normal mode', async () => {
    const { container } = render(<ArrangementViewerPage />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  it('supports keyboard navigation', () => {
    // Test keyboard controls
  })
})
```

## Validation Gates

```bash
# 1. Type checking
npm run type-check
# Expected: No TypeScript errors

# 2. Linting
npm run lint
# Expected: No ESLint errors

# 3. Unit tests
npm run test -- src/features/arrangements
# Expected: All tests pass

# 4. Integration tests
npm run test:integration -- arrangement-viewer
# Expected: Page loads, navigation works

# 5. Build validation
npm run build
# Expected: Build succeeds, bundle size reasonable

# 6. Preview build
npm run preview
# Test: Navigate to arrangement viewer, verify functionality

# 7. Mobile testing
# Open preview on mobile device
# Test: Tap center toggles UI, fullscreen works

# 8. Accessibility
npm run test:a11y
# Expected: No accessibility violations

# 9. Performance
npm run lighthouse
# Expected: Performance score > 90

# 10. PWA validation
npm run test:pwa
# Expected: Installable, works offline
```

## Implementation Order

1. **Setup Phase** (30 min)
   - Install ChordSheetJS
   - Install and configure shadcn-ui
   - Create feature folder structure

2. **Core Implementation** (2 hours)
   - Create ArrangementViewerPage component
   - Implement ChordSheetViewer with ChordSheetJS
   - Add useMinimalMode hook for fullscreen
   - Configure routing

3. **UI Components** (1 hour)
   - Add ViewerHeader with song info
   - Create ViewerControls with shadcn-ui
   - Implement MinimalModeToggle
   - Add styling

4. **Enhancements** (1 hour)
   - Add transposition functionality
   - Implement auto-scroll
   - Add font size controls
   - Mobile touch gestures

5. **Testing** (1 hour)
   - Write unit tests
   - Add integration tests
   - Test mobile functionality
   - Verify accessibility

6. **Polish** (30 min)
   - Optimize performance
   - Add loading states
   - Error handling
   - Documentation

## Error Handling

```typescript
// Comprehensive error boundaries
try {
  // Parse ChordPro
} catch (error) {
  // Show raw text fallback
  return <pre>{chordProText}</pre>
}

// API errors
if (error.status === 404) {
  return <NotFound message="Arrangement not found" />
}

// Fullscreen API fallback
if (!document.fullscreenEnabled) {
  // Use CSS fullscreen fallback
}
```

## Performance Considerations

1. **Memoization**: Use useMemo for expensive parsing
2. **Lazy Loading**: Load ChordSheetJS only when needed
3. **Virtual Scrolling**: Consider for very long songs
4. **Font Loading**: Preload monospace fonts
5. **Service Worker**: Cache arrangements for offline

## Security Considerations

1. **XSS Prevention**: Sanitize ChordPro content
2. **CSP Headers**: Allow inline styles from ChordSheetJS
3. **Input Validation**: Validate arrangement IDs
4. **Rate Limiting**: Limit API calls for arrangement data

## Gotchas and Edge Cases

1. **ChordSheetJS Parsing**: Some ChordPro directives may not be supported
2. **Fullscreen API**: Not available in all browsers/contexts
3. **Mobile Safari**: Fullscreen API limitations
4. **Orientation Lock**: May not work on all devices
5. **Print Styles**: ChordSheetJS may need print-specific formatting

## Success Criteria

- [ ] Arrangement viewer loads and displays chords correctly
- [ ] Center tap toggles minimal mode
- [ ] Fullscreen mode works on mobile
- [ ] Transposition functions correctly
- [ ] Controls are accessible and intuitive
- [ ] Performance is smooth (60fps scrolling)
- [ ] Works offline via PWA
- [ ] Accessible (WCAG 2.1 AA compliant)
- [ ] No console errors
- [ ] All validation gates pass

## References

- ChordSheetJS Docs: https://www.chordsheetjs.org/
- shadcn-ui Components: https://ui.shadcn.com/docs/components
- Fullscreen API: https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
- React Router: https://reactrouter.com/en/main/route/route
- PWA Best Practices: https://web.dev/pwa-checklist/

## Confidence Score: 9/10

High confidence due to:
- Comprehensive research of existing patterns
- Clear vertical slice architecture
- Existing infrastructure (routing, modals, PWA)
- Well-documented ChordSheetJS library
- Detailed implementation blueprint
- Multiple validation gates

Minor uncertainty (-1):
- shadcn-ui integration (not currently in project)
- Mobile fullscreen API variations across browsers