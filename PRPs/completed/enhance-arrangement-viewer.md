# PRP: Enhanced Arrangement Viewer with Toolbar and Optimized Layout

## Feature Requirements
Enhance the arrangement viewer to:
1. Better utilize screen space by removing unnecessary padding/margins
2. Enable proper scrolling within the content area
3. Add a comprehensive toolbar with print, stage mode, and future setlist features
4. Implement stage mode that hides everything except chords for performance

## Critical Context

### Current Implementation Analysis

#### File Structure
- **Main Viewer**: `/src/features/arrangements/pages/ArrangementViewerPage.tsx`
- **Content Renderer**: `/src/features/arrangements/components/ChordSheetViewer.tsx`
- **Controls**: `/src/features/arrangements/components/ViewerControls.tsx`
- **Header**: `/src/features/arrangements/components/ViewerHeader.tsx`
- **Styles**: `/src/features/arrangements/styles/chordsheet.css`
- **Existing Toolbar Pattern**: `/src/features/arrangements/components/EditorToolbar.tsx`

#### Current Layout Issues

```typescript
// Current ArrangementViewerPage structure (problematic)
<div style={{ minHeight: '100vh' }}>
  <ViewerHeader />           // Variable height, not accounted for
  <main style={{ 
    padding: '2rem',         // Wastes 32px vertical space
    maxWidth: '1200px'       // Doesn't utilize full width
  }}>
    <ChordSheetViewer />     // height: '100%' causes scrolling issues
  </main>
  <ViewerControls />         // Sticky bottom, ~80-100px
</div>
```

**Problems Identified:**
1. Content area doesn't calculate available height (100vh - header - controls)
2. Fixed padding reduces usable space unnecessarily
3. Nested containers with `height: '100%'` create scrolling conflicts
4. Auto-scroll scrolls entire window instead of content area

### Existing Patterns to Follow

#### Toolbar Pattern (from EditorToolbar.tsx)
```typescript
interface ToolbarProps {
  // Action handlers
  onTogglePreview: () => void
  onSave?: () => void
  onCancel?: () => void
  
  // State indicators
  showPreview: boolean
  isDirty?: boolean
  isMobile?: boolean
}
```

#### Stage Mode Implementation (useMinimalMode.ts)
```typescript
// Already has fullscreen API integration
const toggleFullscreen = async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen()
  } else {
    await document.exitFullscreen()
  }
}
```

### Vertical Slice Architecture
This enhancement stays within the `arrangements` feature slice:
- Components remain in `/src/features/arrangements/components/`
- Hooks in `/src/features/arrangements/hooks/`
- Styles in `/src/features/arrangements/styles/`
- Minimal cross-feature dependencies (only shared UI components)

## Implementation Blueprint

### Phase 1: Layout Optimization

#### 1.1 Create ViewerLayout Component
```typescript
// src/features/arrangements/components/ViewerLayout.tsx
interface ViewerLayoutProps {
  header?: ReactNode
  toolbar?: ReactNode
  content: ReactNode
  controls?: ReactNode
}

export function ViewerLayout({ header, toolbar, content, controls }: ViewerLayoutProps) {
  const [headerHeight, setHeaderHeight] = useState(0)
  const [toolbarHeight, setToolbarHeight] = useState(0)
  const [controlsHeight, setControlsHeight] = useState(0)
  
  const contentHeight = `calc(100vh - ${headerHeight + toolbarHeight + controlsHeight}px)`
  
  return (
    <div className="viewer-layout">
      {header && <div ref={headerRef} className="viewer-header">{header}</div>}
      {toolbar && <div ref={toolbarRef} className="viewer-toolbar">{toolbar}</div>}
      <div className="viewer-content" style={{ height: contentHeight, overflow: 'auto' }}>
        {content}
      </div>
      {controls && <div ref={controlsRef} className="viewer-controls">{controls}</div>}
    </div>
  )
}
```

#### 1.2 Update ChordSheetViewer for Proper Scrolling
```typescript
// Fix container heights and scrolling
export function ChordSheetViewer({ chordProText }: ChordSheetViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll should target this container, not window
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const scrollInterval = setInterval(() => {
        container.scrollTop += scrollSpeed
      }, 1000 / 60)
      return () => clearInterval(scrollInterval)
    }
  }, [autoScroll, scrollSpeed])
  
  return (
    <div 
      ref={scrollContainerRef}
      className="chord-sheet-scroll-container"
      style={{ 
        height: '100%',     // Fill parent
        overflow: 'auto',   // Enable scrolling
        position: 'relative'
      }}
    >
      <div className="chord-sheet-content">
        {/* Rendered content */}
      </div>
    </div>
  )
}
```

### Phase 2: Enhanced Toolbar Implementation

#### 2.1 Create ViewerToolbar Component
```typescript
// src/features/arrangements/components/ViewerToolbar.tsx
import { Printer, Eye, EyeOff, ListPlus, Settings, Maximize } from 'lucide-react'

interface ViewerToolbarProps {
  onPrint: () => void
  onToggleStageMode: () => void
  onAddToSetlist?: () => void
  isStageMode: boolean
  arrangementId: string
}

export function ViewerToolbar({ 
  onPrint, 
  onToggleStageMode, 
  onAddToSetlist,
  isStageMode,
  arrangementId 
}: ViewerToolbarProps) {
  return (
    <div className="viewer-toolbar">
      <div className="toolbar-group">
        {/* Print Button */}
        <button
          onClick={onPrint}
          className="toolbar-button"
          title="Print chord sheet (Ctrl+P)"
          aria-label="Print"
        >
          <Printer className="icon" />
          <span className="label">Print</span>
        </button>
        
        {/* Stage Mode Toggle */}
        <button
          onClick={onToggleStageMode}
          className={cn('toolbar-button', isStageMode && 'active')}
          title="Toggle stage mode (F)"
          aria-label="Stage mode"
        >
          {isStageMode ? <EyeOff className="icon" /> : <Eye className="icon" />}
          <span className="label">Stage</span>
        </button>
        
        {/* Add to Setlist (Future Feature) */}
        {onAddToSetlist && (
          <button
            onClick={onAddToSetlist}
            className="toolbar-button"
            title="Add to setlist"
            aria-label="Add to setlist"
          >
            <ListPlus className="icon" />
            <span className="label">Setlist</span>
          </button>
        )}
      </div>
      
      {/* Existing controls integration */}
      <div className="toolbar-group">
        <TransposeControls />
        <AutoScrollControls />
        <FontSizeControl />
      </div>
    </div>
  )
}
```

### Phase 3: Print Functionality

#### 3.1 Install Dependencies
```bash
npm install react-to-print@3.1.1
```

#### 3.2 Implement Print Handler
```typescript
// src/features/arrangements/hooks/usePrint.ts
import { useReactToPrint } from 'react-to-print'

export function usePrint(contentRef: RefObject<HTMLElement>) {
  const handlePrint = useReactToPrint({
    content: () => contentRef.current,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm 15mm;
      }
      @media print {
        .viewer-header,
        .viewer-toolbar,
        .viewer-controls {
          display: none !important;
        }
        .chord-sheet-content {
          font-size: 12pt;
          line-height: 1.6;
          color: black;
          background: white;
        }
        .chord-cell {
          font-weight: bold;
          page-break-inside: avoid;
        }
      }
    `,
    documentTitle: 'Chord Sheet',
    removeAfterPrint: true
  })
  
  return { handlePrint }
}
```

### Phase 4: Enhanced Stage Mode

#### 4.1 Update Stage Mode Hook
```typescript
// src/features/arrangements/hooks/useStageMode.ts
export function useStageMode() {
  const [isStageMode, setIsStageMode] = useState(false)
  
  const toggleStageMode = useCallback(async () => {
    if (!isStageMode) {
      // Enter stage mode
      await document.documentElement.requestFullscreen()
      document.body.classList.add('stage-mode')
      // Hide all UI except chords
      document.querySelectorAll('.verse-label, .section-label').forEach(el => {
        el.classList.add('stage-hidden')
      })
    } else {
      // Exit stage mode
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      document.body.classList.remove('stage-mode')
      document.querySelectorAll('.stage-hidden').forEach(el => {
        el.classList.remove('stage-hidden')
      })
    }
    setIsStageMode(!isStageMode)
  }, [isStageMode])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        toggleStageMode()
      }
      if (e.key === 'Escape' && isStageMode) {
        toggleStageMode()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleStageMode, isStageMode])
  
  return { isStageMode, toggleStageMode }
}
```

#### 4.2 Stage Mode Styles
```css
/* src/features/arrangements/styles/stage-mode.css */
.stage-mode {
  --bg-color: #000000;
  --text-color: #ffffff;
  --chord-color: #00ff00;
}

.stage-mode .chord-sheet-content {
  background: var(--bg-color);
  color: var(--text-color);
  font-size: clamp(20px, 5vw, 48px);
  padding: 5vh 5vw;
  min-height: 100vh;
}

.stage-mode .chord-cell {
  color: var(--chord-color) !important;
  text-shadow: 0 0 3px rgba(0, 255, 0, 0.5);
  font-weight: bold;
}

.stage-mode .stage-hidden {
  display: none !important;
}

/* Hide everything except essential content in stage mode */
.stage-mode .viewer-header,
.stage-mode .viewer-toolbar,
.stage-mode .viewer-controls:not(.minimal) {
  display: none !important;
}
```

### Phase 5: Updated ArrangementViewerPage

```typescript
// src/features/arrangements/pages/ArrangementViewerPage.tsx
export function ArrangementViewerPage() {
  const { arrangement } = useArrangement()
  const { handlePrint, printRef } = usePrint()
  const { isStageMode, toggleStageMode } = useStageMode()
  
  return (
    <ViewerLayout
      header={!isStageMode && <ViewerHeader arrangement={arrangement} />}
      toolbar={
        !isStageMode && (
          <ViewerToolbar
            onPrint={handlePrint}
            onToggleStageMode={toggleStageMode}
            onAddToSetlist={() => console.log('Future feature')}
            isStageMode={isStageMode}
            arrangementId={arrangement.id}
          />
        )
      }
      content={
        <div ref={printRef}>
          <ChordSheetViewer 
            chordProText={arrangement.chordProText}
            isStageMode={isStageMode}
          />
        </div>
      }
      controls={
        <ViewerControls 
          minimal={isStageMode}
          onExitMinimal={isStageMode ? toggleStageMode : undefined}
        />
      }
    />
  )
}
```

## CSS Updates

```css
/* src/features/arrangements/styles/viewer-layout.css */
.viewer-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.viewer-header {
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border);
}

.viewer-toolbar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.viewer-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.viewer-controls {
  flex-shrink: 0;
  border-top: 1px solid var(--color-border);
}

.toolbar-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  color: var(--text-primary);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-button:hover {
  background: var(--color-hover);
}

.toolbar-button.active {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}

.toolbar-button .icon {
  width: 1.25rem;
  height: 1.25rem;
}

.toolbar-button .label {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .toolbar-button .label {
    display: none;
  }
  
  .viewer-toolbar {
    padding: 0.375rem 0.5rem;
  }
}
```

## Validation Gates

```bash
# Type checking
npm run build

# Linting
npm run lint

# Component testing
npm run test -- --testPathPattern=arrangements

# Manual testing checklist
# 1. Verify no empty space at top of chord-sheet-content
# 2. Test scrolling works within content area only
# 3. Verify print functionality generates proper output
# 4. Test stage mode hides all UI except chords
# 5. Verify keyboard shortcuts (F for stage mode, Ctrl+P for print)
# 6. Test responsive behavior on mobile devices
# 7. Verify auto-scroll targets content area, not window
# 8. Test toolbar buttons are accessible via keyboard
```

## Implementation Tasks

1. **Layout Optimization** (Priority 1)
   - Create ViewerLayout component
   - Update ChordSheetViewer scrolling logic
   - Remove unnecessary padding/margins
   - Calculate proper content height

2. **Toolbar Implementation** (Priority 2)
   - Create ViewerToolbar component
   - Integrate print functionality
   - Add stage mode toggle
   - Placeholder for setlist feature

3. **Print Functionality** (Priority 3)
   - Install react-to-print
   - Implement usePrint hook
   - Add print-specific CSS
   - Test print output

4. **Stage Mode Enhancement** (Priority 4)
   - Update useStageMode hook
   - Add keyboard shortcuts
   - Implement stage-specific styles
   - Test fullscreen behavior

5. **Integration & Testing** (Priority 5)
   - Update ArrangementViewerPage
   - Add comprehensive tests
   - Fix any responsive issues
   - Document keyboard shortcuts

## Success Criteria

- [ ] Content area uses full available height (100vh - header - toolbar - controls)
- [ ] Scrolling works only within content area, not entire page
- [ ] Print button generates clean, readable output
- [ ] Stage mode hides all UI except chord content
- [ ] Keyboard shortcuts work (F for stage, Ctrl+P for print)
- [ ] Auto-scroll targets content container, not window
- [ ] Toolbar is responsive and accessible
- [ ] No regression in existing functionality

## Risk Mitigation

- **Browser Compatibility**: Test fullscreen API across browsers
- **Print Styles**: Verify output in different browsers/OS
- **Performance**: Profile scrolling performance with large documents
- **Accessibility**: Ensure all controls are keyboard navigable

## External Documentation

- React Print: https://github.com/MatthewHerbst/react-to-print
- Fullscreen API: https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
- CSS Print Styles: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/print
- Keyboard Events: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent

## Confidence Score: 9/10

High confidence due to:
- Comprehensive research of existing patterns
- Clear separation of concerns
- Incremental implementation approach
- Existing infrastructure for stage mode and controls
- Well-defined validation gates