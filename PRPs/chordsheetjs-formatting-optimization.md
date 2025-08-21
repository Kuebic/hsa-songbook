# PRP: ChordSheetJS Formatting Optimization Implementation

## Overview
Implement comprehensive ChordSheetJS formatting optimization for the HSA Songbook application. This PRP provides complete context for one-pass implementation success with self-validation.

## Prerequisites

### Required Documentation
- **ChordSheetJS v12 API Reference**: `PRPs/ai_docs/chordsheetjs-v12-reference.md`
- **Product Requirements Document**: `PRPs/chordsheetjs-formatting-optimization-prd.md`
- **React 19 Performance Guide**: https://react.dev/blog/2025/04/21/react-compiler-rc

### Codebase Context
- **Target Directory**: `/src/features/arrangements/` (vertical slice)
- **Primary Hook**: `hooks/useUnifiedChordRenderer.ts` (needs refactoring)
- **Service Layer**: `services/chordProService.ts` (existing parsing logic)
- **Current Version**: ChordSheetJS ^12.3.1 (package.json line 48)

## Implementation Blueprint

### Phase 1: Core Renderer Optimization

#### Task 1.1: Create Optimized Formatter Factory
**Location**: `/src/features/arrangements/formatters/ChordSheetFormatterFactory.ts`

```typescript
// PSEUDOCODE - Formatter Factory Implementation
class ChordSheetFormatterFactory {
  private static formatters = new Map<string, ChordSheetJS.Formatter>()
  
  static getFormatter(type: 'responsive' | 'print' | 'text', options?: FormatterOptions) {
    // Check cache first
    const cacheKey = `${type}-${JSON.stringify(options)}`
    if (this.formatters.has(cacheKey)) {
      return this.formatters.get(cacheKey)
    }
    
    // Create new formatter based on type
    let formatter: ChordSheetJS.Formatter
    switch(type) {
      case 'responsive':
        // Use HtmlDivFormatter for mobile/web
        formatter = new ChordSheetJS.HtmlDivFormatter(options)
        break
      case 'print':
        // Use HtmlTableFormatter for print/PDF
        formatter = new ChordSheetJS.HtmlTableFormatter(options)
        break
      case 'text':
        formatter = new ChordSheetJS.TextFormatter(options)
        break
    }
    
    // Cache and return
    this.formatters.set(cacheKey, formatter)
    return formatter
  }
  
  static clearCache() {
    this.formatters.clear()
  }
}
```

**Implementation Notes**:
- Follow existing factory pattern from `src/features/songs/utils/chordProGenerator.ts`
- Use Map for O(1) formatter lookup
- Implement LRU cache with 10 formatter limit (like `ChordProCache`)

#### Task 1.2: Refactor useUnifiedChordRenderer Hook
**Location**: `/src/features/arrangements/hooks/useUnifiedChordRenderer.ts`

Replace current regex-based HTML processing with native ChordSheetJS formatting:

```typescript
// BEFORE (Current Implementation - Lines 58-111)
// Complex regex replacements for HTML processing
const processChordSheetHTML = useCallback((html: string): string => {
  let processed = html;
  // Multiple regex passes...
  processed = processed.replace(/<h1 class="title">[^<]*<\/h1>/g, '');
  // More regex...
}, []);

// AFTER (Optimized Implementation)
const renderChordSheet = useCallback((content: string, options?: RenderOptions): string => {
  // Use cache service
  const cacheKey = generateCacheKey(content, options)
  const cached = chordRenderCache.get(cacheKey)
  if (cached) return cached
  
  try {
    // Parse once
    const parser = new ChordSheetJS.ChordProParser()
    const song = parser.parse(content)
    
    // Apply transposition if needed
    if (options?.transpose) {
      applyTransposition(song, options.transpose)
    }
    
    // Get appropriate formatter
    const context = options?.context || 'viewer'
    const formatterType = context === 'print' ? 'print' : 'responsive'
    const formatter = ChordSheetFormatterFactory.getFormatter(formatterType)
    
    // Format with native ChordSheetJS
    let html = formatter.format(song)
    
    // Apply minimal theme wrapper (no regex processing)
    html = wrapWithTheme(html, preferences)
    
    // Cache result
    chordRenderCache.set(cacheKey, html)
    
    return html
  } catch (error) {
    // Error handling...
  }
}, [preferences])
```

**Key Changes**:
1. Remove `processChordSheetHTML` function entirely
2. Use native formatter output directly
3. Implement proper caching at HTML level
4. Single parsing pass per render

#### Task 1.3: Implement Multi-Level Cache Service
**Location**: `/src/features/arrangements/services/ChordRenderCacheService.ts`

```typescript
// Three-tier caching strategy
class ChordRenderCacheService {
  // Level 1: Parsed song objects (most expensive)
  private songCache: LRUCache<string, ChordSheetJS.Song>
  
  // Level 2: Formatted HTML (medium cost)
  private htmlCache: LRUCache<string, string>
  
  // Level 3: Styled output (cheapest)
  private styledCache: LRUCache<string, string>
  
  constructor() {
    // Initialize with size limits
    this.songCache = new LRUCache({ max: 20 })
    this.htmlCache = new LRUCache({ max: 50 })
    this.styledCache = new LRUCache({ max: 100 })
  }
  
  // Cache key generation
  generateKey(content: string, options?: RenderOptions): string {
    const hash = this.hashContent(content)
    const optionsKey = JSON.stringify(options || {})
    return `${hash}-${optionsKey}`
  }
  
  // Performance monitoring
  private metrics = {
    songHits: 0,
    songMisses: 0,
    htmlHits: 0,
    htmlMisses: 0,
    averageRenderTime: 0
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      songHitRate: this.metrics.songHits / (this.metrics.songHits + this.metrics.songMisses),
      htmlHitRate: this.metrics.htmlHits / (this.metrics.htmlHits + this.metrics.htmlMisses)
    }
  }
}
```

**Implementation Pattern**: Follow existing cache pattern from `src/features/arrangements/components/ChordProEditor/utils/chordProCache.ts`

### Phase 2: Mobile & Responsive Enhancements

#### Task 2.1: Create Responsive Chord Component
**Location**: `/src/features/arrangements/components/ResponsiveChordSheet.tsx`

```typescript
interface ResponsiveChordSheetProps {
  content: string
  context: 'preview' | 'viewer' | 'stage' | 'print'
  onInteraction?: (event: ChordInteractionEvent) => void
}

const ResponsiveChordSheet: React.FC<ResponsiveChordSheetProps> = ({
  content,
  context,
  onInteraction
}) => {
  // Use viewport detection hook (existing)
  const { isMobile, isTablet, viewportWidth } = useResponsiveLayout()
  
  // Dynamic font sizing based on viewport
  const fontSize = useMemo(() => {
    if (isMobile) return Math.max(14, Math.min(18, viewportWidth / 30))
    if (isTablet) return 16
    return preferences.fontSize
  }, [isMobile, isTablet, viewportWidth, preferences.fontSize])
  
  // Touch gesture handling
  const handlePinch = useCallback((scale: number) => {
    updatePreferences({
      fontSize: Math.max(12, Math.min(24, fontSize * scale))
    })
  }, [fontSize])
  
  // Render with optimized formatter
  const html = useUnifiedChordRenderer().renderChordSheet(content, {
    context,
    fontSize,
    transpose: transposition
  })
  
  return (
    <div 
      className={clsx(
        'responsive-chord-sheet',
        `context-${context}`,
        isMobile && 'mobile-view',
        isTablet && 'tablet-view'
      )}
      style={{
        fontSize: `${fontSize}px`,
        touchAction: 'pan-y pinch-zoom'
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
```

**Mobile Optimizations**:
1. Use existing `useResponsiveLayout` hook from `src/features/arrangements/components/ChordProEditor/hooks/useResponsiveLayout.ts`
2. Implement pinch-to-zoom for font sizing
3. Use CSS Grid/Flexbox for responsive layout
4. Add touch-action CSS for optimal scrolling

#### Task 2.2: Implement Virtual Scrolling for Long Songs
**Location**: `/src/features/arrangements/components/VirtualChordScroller.tsx`

```typescript
// Use @tanstack/react-virtual for complex scrolling
import { useVirtualizer } from '@tanstack/react-virtual'

const VirtualChordScroller: React.FC<{ sections: Section[] }> = ({ sections }) => {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: sections.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // Estimated section height
    overscan: 3 // Render 3 sections outside viewport
  })
  
  return (
    <div ref={parentRef} className="virtual-scroller">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <ChordSection section={sections[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Performance Target**: Maintain 60fps scrolling on songs with 100+ sections

### Phase 3: Performance Optimization

#### Task 3.1: Implement Performance Monitoring
**Location**: `/src/features/arrangements/hooks/useChordPerformance.ts`

```typescript
const useChordPerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>()
  
  // Use React Profiler API
  const onRenderCallback = useCallback((
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number
  ) => {
    // Track render times
    if (actualDuration > 16.67) { // Over 60fps budget
      console.warn(`Slow render: ${id} took ${actualDuration}ms`)
    }
    
    // Update metrics
    setMetrics(prev => ({
      ...prev,
      lastRenderTime: actualDuration,
      averageRenderTime: prev 
        ? (prev.averageRenderTime + actualDuration) / 2 
        : actualDuration
    }))
  }, [])
  
  // Monitor cache performance
  useEffect(() => {
    const interval = setInterval(() => {
      const cacheMetrics = chordRenderCache.getMetrics()
      setMetrics(prev => ({
        ...prev,
        ...cacheMetrics
      }))
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  return { metrics, onRenderCallback }
}
```

**Integration with existing monitoring**: Use `PerformanceMonitor` from `src/features/monitoring/utils/performance.ts`

#### Task 3.2: Optimize Bundle Size
**Location**: `/src/features/arrangements/utils/chordSheetLazyLoader.ts`

```typescript
// Lazy load ChordSheetJS for code splitting
const ChordSheetJSModule = lazy(() => 
  import('chordsheetjs').then(module => ({
    default: module
  }))
)

// Wrapper for async ChordSheetJS usage
export const parseChordProAsync = async (content: string) => {
  const ChordSheetJS = await import('chordsheetjs')
  const parser = new ChordSheetJS.ChordProParser()
  return parser.parse(content)
}
```

### Phase 4: Enhanced Styling System

#### Task 4.1: Create CSS-in-JS Theme System
**Location**: `/src/features/arrangements/styles/ChordSheetTheme.ts`

```typescript
// Theme configuration following existing pattern
export const chordSheetThemes = {
  light: {
    chord: 'var(--color-primary, #2563eb)',
    lyric: 'var(--text-primary, #111827)',
    section: 'var(--color-secondary, #7c3aed)',
    background: 'var(--color-background, #ffffff)'
  },
  dark: {
    chord: 'var(--color-primary-dark, #60a5fa)',
    lyric: 'var(--text-primary-dark, #f9fafb)',
    section: 'var(--color-secondary-dark, #a78bfa)',
    background: 'var(--color-background-dark, #1f2937)'
  },
  stage: {
    chord: '#fbbf24', // High contrast yellow
    lyric: '#ffffff', // Pure white
    section: '#f59e0b', // Orange
    background: '#000000' // Pure black
  }
}

// Generate CSS variables dynamically
export const generateThemeCSS = (theme: keyof typeof chordSheetThemes) => {
  const colors = chordSheetThemes[theme]
  return `
    .chord-sheet-themed {
      --chord-color: ${colors.chord};
      --lyric-color: ${colors.lyric};
      --section-color: ${colors.section};
      --sheet-background: ${colors.background};
    }
    
    /* Apply to ChordSheetJS classes */
    .chord-sheet-themed .chord { color: var(--chord-color); }
    .chord-sheet-themed .lyrics { color: var(--lyric-color); }
    .chord-sheet-themed .verse-label,
    .chord-sheet-themed .chorus-label { color: var(--section-color); }
  `
}
```

#### Task 4.2: Update CSS Files
**Location**: `/src/features/arrangements/styles/unified-chord-display.css`

```css
/* Remove regex-dependent styles, use native ChordSheetJS classes */
.chord-sheet-content {
  /* Base styles */
  font-family: var(--font-family-mono, monospace);
  line-height: var(--line-height, 1.6);
}

/* Mobile-first responsive design */
.chord-sheet-content .row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.chord-sheet-content .column {
  display: flex;
  flex-direction: column;
  min-width: 0; /* Prevent overflow */
}

/* Touch-friendly sizing */
@media (pointer: coarse) {
  .chord-sheet-content .chord {
    min-height: 44px; /* iOS touch target */
    padding: 0.5rem;
  }
}

/* Print optimization */
@media print {
  .chord-sheet-content {
    font-size: 10pt !important;
    line-height: 1.2 !important;
  }
  
  .chord-sheet-content .row {
    page-break-inside: avoid;
  }
}
```

## Testing Strategy

### Unit Tests

#### Test File: `__tests__/ChordSheetFormatterFactory.test.ts`
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChordSheetFormatterFactory } from '../ChordSheetFormatterFactory'

// Mock ChordSheetJS
vi.mock('chordsheetjs', () => ({
  HtmlDivFormatter: vi.fn(() => ({ format: vi.fn(() => '<div>HTML</div>') })),
  HtmlTableFormatter: vi.fn(() => ({ format: vi.fn(() => '<table>HTML</table>') })),
  TextFormatter: vi.fn(() => ({ format: vi.fn(() => 'Text output') }))
}))

describe('ChordSheetFormatterFactory', () => {
  beforeEach(() => {
    ChordSheetFormatterFactory.clearCache()
  })
  
  it('should return cached formatter for same type', () => {
    const formatter1 = ChordSheetFormatterFactory.getFormatter('responsive')
    const formatter2 = ChordSheetFormatterFactory.getFormatter('responsive')
    expect(formatter1).toBe(formatter2) // Same instance
  })
  
  it('should return different formatters for different types', () => {
    const responsive = ChordSheetFormatterFactory.getFormatter('responsive')
    const print = ChordSheetFormatterFactory.getFormatter('print')
    expect(responsive).not.toBe(print)
  })
})
```

#### Test File: `__tests__/useUnifiedChordRenderer.test.tsx`
```typescript
import { renderHook, act } from '@testing-library/react'
import { useUnifiedChordRenderer } from '../useUnifiedChordRenderer'

describe('useUnifiedChordRenderer', () => {
  it('should render chord sheet within performance budget', () => {
    const { result } = renderHook(() => useUnifiedChordRenderer())
    
    const startTime = performance.now()
    act(() => {
      result.current.renderChordSheet(mockChordProContent)
    })
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(100) // 100ms budget
  })
  
  it('should use cache for repeated renders', () => {
    const { result } = renderHook(() => useUnifiedChordRenderer())
    
    // First render
    const html1 = result.current.renderChordSheet(mockChordProContent)
    
    // Second render (should hit cache)
    const html2 = result.current.renderChordSheet(mockChordProContent)
    
    expect(html1).toBe(html2) // Exact same reference
  })
  
  it('should handle transposition correctly', () => {
    const { result } = renderHook(() => useUnifiedChordRenderer())
    
    const html = result.current.renderChordSheet(mockChordProContent, {
      transpose: 2
    })
    
    expect(html).toContain('D') // C transposed up 2 = D
    expect(html).not.toContain('class="chord">C<') // Original chord gone
  })
})
```

### Integration Tests

#### Test File: `__tests__/ResponsiveChordSheet.test.tsx`
```typescript
describe('ResponsiveChordSheet', () => {
  it('should adapt font size for mobile', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375 })
    
    const { container } = render(
      <ResponsiveChordSheet content={mockContent} context="viewer" />
    )
    
    const sheet = container.querySelector('.responsive-chord-sheet')
    expect(sheet).toHaveClass('mobile-view')
    expect(sheet).toHaveStyle({ fontSize: '14px' }) // Mobile font size
  })
  
  it('should handle pinch-to-zoom', () => {
    const { container } = render(
      <ResponsiveChordSheet content={mockContent} context="viewer" />
    )
    
    // Simulate pinch gesture
    fireEvent.gestureStart(container)
    fireEvent.gestureChange(container, { scale: 1.5 })
    fireEvent.gestureEnd(container)
    
    // Font size should increase
    const sheet = container.querySelector('.responsive-chord-sheet')
    expect(parseInt(sheet.style.fontSize)).toBeGreaterThan(16)
  })
})
```

### Performance Tests

#### Test File: `__tests__/ChordPerformance.test.ts`
```typescript
describe('ChordSheet Performance', () => {
  it('should render large document within budget', () => {
    const largeContent = generateLargeChordPro(1000) // 1000 lines
    
    const monitor = new PerformanceMonitor()
    monitor.mark('render-start')
    
    render(<ResponsiveChordSheet content={largeContent} context="viewer" />)
    
    monitor.mark('render-end')
    monitor.measure('render-time', 'render-start', 'render-end')
    
    const stats = monitor.getStats('render-time')
    expect(stats.avg).toBeLessThan(100) // 100ms budget
  })
  
  it('should maintain 60fps during scroll', async () => {
    const { container } = render(
      <VirtualChordScroller sections={mockSections} />
    )
    
    const scroller = container.querySelector('.virtual-scroller')
    
    // Measure frame rate during scroll
    const frameRates: number[] = []
    let lastTime = performance.now()
    
    const measureFrame = () => {
      const now = performance.now()
      const fps = 1000 / (now - lastTime)
      frameRates.push(fps)
      lastTime = now
    }
    
    // Simulate scroll
    for (let i = 0; i < 100; i += 10) {
      fireEvent.scroll(scroller, { target: { scrollTop: i * 100 } })
      measureFrame()
      await waitFor(() => {}, { timeout: 16 }) // Wait one frame
    }
    
    const avgFps = frameRates.reduce((a, b) => a + b) / frameRates.length
    expect(avgFps).toBeGreaterThan(55) // Allow some variance
  })
})
```

## Validation Gates

### Level 1: Syntax & Type Checking ✅
```bash
# Type checking with TypeScript strict mode
npm run build

# Linting with ESLint
npm run lint

# Expected output: No errors
```

### Level 2: Unit Test Suite ✅
```bash
# Run all tests with coverage
npm run test:coverage

# Specific feature tests
npm run test -- arrangements/

# Expected: 90%+ coverage, all tests passing
```

### Level 3: Performance Validation ✅
```bash
# Build and analyze bundle size
npm run build
npm run analyze

# Check ChordSheetJS impact
# Expected: < 15KB gzipped increase

# Run performance tests
npm run test -- --grep "Performance"
# Expected: All performance budgets met
```

### Level 4: Visual Regression ✅
```bash
# Start dev server
npm run dev

# Manual visual checks:
# 1. Preview pane renders correctly
# 2. Viewer displays formatted chords
# 3. Mobile view is responsive
# 4. Print preview looks correct
# 5. Theme switching works
```

### Level 5: E2E Validation ✅
```bash
# Full user flow test
# 1. Create new arrangement
# 2. Enter ChordPro content
# 3. Preview updates in real-time
# 4. Switch to viewer mode
# 5. Transpose chords
# 6. Change themes
# 7. Test on mobile viewport

# Expected: All flows work smoothly
```

## Implementation Checklist

### Phase 1: Core Renderer (Priority 1)
- [ ] Create `ChordSheetFormatterFactory.ts`
- [ ] Refactor `useUnifiedChordRenderer.ts` to remove regex
- [ ] Implement `ChordRenderCacheService.ts`
- [ ] Write unit tests for factory and cache
- [ ] Update `ChordSheetViewer.tsx` to use new renderer
- [ ] Remove `processChordSheetHTML` function

### Phase 2: Mobile Optimization (Priority 2)
- [ ] Create `ResponsiveChordSheet.tsx` component
- [ ] Implement `VirtualChordScroller.tsx` for long songs
- [ ] Add pinch-to-zoom gesture handling
- [ ] Update CSS for mobile-first design
- [ ] Test on real mobile devices

### Phase 3: Performance (Priority 3)
- [ ] Create `useChordPerformance.ts` hook
- [ ] Implement performance monitoring
- [ ] Add lazy loading for ChordSheetJS
- [ ] Optimize bundle with code splitting
- [ ] Add performance tests

### Phase 4: Styling Enhancement (Priority 4)
- [ ] Create theme system in `ChordSheetTheme.ts`
- [ ] Update `unified-chord-display.css`
- [ ] Remove legacy `chordsheet.css` styles
- [ ] Add print-specific styles
- [ ] Test all theme variations

### Phase 5: Testing & Documentation (Priority 5)
- [ ] Write comprehensive test suite
- [ ] Add performance benchmarks
- [ ] Update component documentation
- [ ] Create migration guide
- [ ] Add Storybook stories (if applicable)

## Known Gotchas & Solutions

### ChordSheetJS v12.3.1 Issues

1. **song.transpose() doesn't work**
   - Solution: Manual transposition implemented in Task 1.2
   - Reference: Lines 243-270 in current `useUnifiedChordRenderer.ts`

2. **Section labels parsed as chords**
   - Solution: Filter list in transposition logic
   - Skip: ['Verse', 'Chorus', 'Bridge', 'Intro', 'Outro']

3. **Memory leaks with formatter instances**
   - Solution: Cache and reuse formatters in factory
   - Limit: Maximum 10 cached formatters with LRU eviction

### React 19 Considerations

1. **Automatic memoization by compiler**
   - Don't add manual `useMemo`/`useCallback` unless measuring shows need
   - Let React Compiler optimize first

2. **Strict Mode double rendering**
   - Cache keys must be deterministic
   - Use content hash, not random IDs

### Mobile Safari Quirks

1. **100vh includes URL bar**
   - Use `window.visualViewport.height` instead
   - Already handled in `useResponsiveLayout` hook

2. **Touch events need preventDefault**
   - Add `touch-action: manipulation` CSS
   - Prevents double-tap zoom delays

## Success Metrics

### Performance Targets
- ✅ Render time: < 100ms (95th percentile)
- ✅ Cache hit rate: > 80% for repeated renders
- ✅ Bundle size increase: < 15KB gzipped
- ✅ Mobile FPS: Consistent 60fps scrolling
- ✅ Memory usage: < 50MB for typical session

### Code Quality
- ✅ Zero regex HTML processing
- ✅ Single parse per render
- ✅ Type-safe throughout
- ✅ 90%+ test coverage
- ✅ No console errors/warnings

## Resources & References

### Internal Documentation
- Vertical Slice Architecture: Research completed, see Phase 1 notes
- Current Implementation: `/src/features/arrangements/hooks/useUnifiedChordRenderer.ts`
- Cache Pattern: `/src/features/arrangements/components/ChordProEditor/utils/chordProCache.ts`
- Test Patterns: `/src/shared/test-utils/` 

### External Resources
- ChordSheetJS GitHub: https://github.com/martijnversluis/ChordSheetJS
- React 19 Compiler: https://react.dev/blog/2025/04/21/react-compiler-rc
- Virtual Scrolling Guide: https://tanstack.com/virtual/latest
- Mobile Touch Guidelines: https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action

### Related PRPs
- ChordSheetJS v12 Reference: `PRPs/ai_docs/chordsheetjs-v12-reference.md`
- Product Requirements: `PRPs/chordsheetjs-formatting-optimization-prd.md`

## Confidence Score: 9/10

**Rationale**: This PRP provides comprehensive context with:
- ✅ Complete vertical slice architecture understanding
- ✅ Detailed implementation patterns from existing codebase
- ✅ Full ChordSheetJS v12 API documentation
- ✅ React 19 performance optimization patterns
- ✅ Extensive test patterns and validation gates
- ✅ Clear pseudocode and implementation blueprint
- ✅ Known issues and solutions documented
- ✅ Performance targets and success metrics defined

**Risk Factor**: The main risk is the ChordSheetJS v12.3.1 transposition bug, but the workaround is well-documented and tested in the current codebase.

---

**Ready for one-pass implementation with self-validation and iterative refinement.**