# ChordProEditor Integration and Refactoring - Comprehensive Implementation PRP

## Executive Summary
This PRP guides the complete refactoring and optimization of the existing ChordProEditor component in the HSA Songbook application. The editor already exists at `/src/features/arrangements/components/ChordProEditor/` but requires alignment fixes, performance optimization, and proper integration with the app's vertical slice architecture.

**Confidence Score: 9/10** - High confidence due to existing implementation, comprehensive research documentation, and clear patterns to follow.

## Context Requirements

### 🎯 Project Context
- **Application**: HSA Songbook - Vite + React 19.1 + TypeScript 5.8
- **Current State**: ChordProEditor exists but has alignment issues between textarea and syntax highlighter
- **Goal**: Fix alignment issues, optimize performance, ensure proper vertical slice integration

### 📚 Essential Documentation References

#### Internal Documentation (Already in PRPs/ai_docs/)
- `chordpro-editor-alignment-research.md` - Critical alignment solutions and mobile autocomplete
- `chordsheetjs-integration-guide.md` - ChordSheetJS best practices
- `arrangement-viewer-implementation-guide.md` - Integration patterns

#### External Documentation
- **ChordSheetJS**: https://github.com/martijnversluis/ChordSheetJS
- **ChordPro Format**: https://www.chordpro.org/chordpro/chordpro-cheat_sheet/
- **CodeMirror 6**: https://codemirror.net/docs/guide/
- **React 19 Patterns**: https://react.dev/reference/react
- **Floating UI**: https://floating-ui.com/docs/react

### 🏗️ Vertical Slice Architecture Analysis

The application follows strict vertical slice architecture with features isolated under `src/features/`:

```
src/features/arrangements/  # ChordPro editing vertical slice
├── components/
│   └── ChordProEditor/     # Main editor component (EXISTS - needs fixing)
│       ├── index.tsx        # Main component with split layout
│       ├── ChordProTextArea.tsx  # Textarea overlay (alignment issues)
│       ├── SyntaxHighlighter.tsx # Syntax highlighting layer
│       ├── PreviewPane.tsx      # Live preview with ChordSheetJS
│       ├── components/          # Sub-components
│       ├── hooks/              # Custom hooks for state/behavior
│       ├── data/              # ChordPro directives & suggestions
│       ├── utils/             # Utilities for metrics, performance
│       └── styles/            # CSS modules for alignment/themes
├── hooks/                    # Feature-level hooks
├── services/                # API integration
├── types/                   # TypeScript definitions
└── pages/                   # Route components
```

**Feature Boundaries**:
- Self-contained within `/arrangements/` slice
- Dependencies: ChordSheetJS (parsing), CodeMirror (optional), Floating UI (dropdowns)
- Exports: ChordProEditor component for use in pages
- No cross-slice dependencies except shared UI components

## Implementation Blueprint

### Phase 1: Fix Critical Alignment Issues

```typescript
// Pseudocode for alignment fix strategy
class AlignmentManager {
  // 1. Ensure identical CSS properties
  applyIdenticalStyles(textarea: HTMLElement, highlighter: HTMLElement) {
    const criticalStyles = {
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      fontSize: '14px',
      lineHeight: '1.5',
      letterSpacing: 'normal',
      wordSpacing: 'normal',
      tabSize: 4,
      textRendering: 'optimizeLegibility',
      padding: '16px',
      margin: 0,
      border: '1px solid transparent',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    };
    
    // Apply to both elements
    Object.assign(textarea.style, criticalStyles);
    Object.assign(highlighter.style, criticalStyles);
  }
  
  // 2. Synchronize scroll positions
  syncScroll(textarea: HTMLElement, highlighter: HTMLElement) {
    // Use transform for performance
    textarea.addEventListener('scroll', () => {
      requestAnimationFrame(() => {
        highlighter.style.transform = 
          `translate(-${textarea.scrollLeft}px, -${textarea.scrollTop}px)`;
      });
    });
  }
  
  // 3. Handle browser-specific quirks
  handleBrowserQuirks() {
    const isWebKit = 'webkitRequestAnimationFrame' in window;
    const isFirefox = navigator.userAgent.includes('Firefox');
    
    if (isWebKit) {
      // WebKit sub-pixel rendering fixes
      return { textRendering: 'geometricPrecision' };
    } else if (isFirefox) {
      // Firefox ligature issues
      return { fontVariantLigatures: 'none' };
    }
  }
}
```

### Phase 2: Mobile Autocomplete Optimization

```typescript
// Enhanced mobile autocomplete with virtual keyboard detection
interface MobileAutocompleteConfig {
  triggerCharacters: string[];
  debounceMs: number;
  maxSuggestions: number;
}

class MobileAutocompleteManager {
  private virtualKeyboardHeight = 0;
  private dropdownRef: HTMLElement;
  
  // Detect virtual keyboard
  detectKeyboard() {
    if ('visualViewport' in window) {
      window.visualViewport.addEventListener('resize', () => {
        const hasKeyboard = window.visualViewport.height < window.innerHeight * 0.75;
        this.virtualKeyboardHeight = hasKeyboard 
          ? window.innerHeight - window.visualViewport.height 
          : 0;
        this.adjustDropdownPosition();
      });
    }
  }
  
  // Position dropdown above keyboard
  adjustDropdownPosition() {
    const { top, left } = this.getCursorCoordinates();
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    
    // Position above cursor if keyboard is open
    if (this.virtualKeyboardHeight > 0) {
      this.dropdownRef.style.bottom = `${this.virtualKeyboardHeight + 20}px`;
      this.dropdownRef.style.top = 'auto';
    }
  }
}
```

### Phase 3: Performance Optimization

```typescript
// Performance optimization strategies
class PerformanceOptimizer {
  // 1. Debounced syntax highlighting
  private highlightDebounced = debounce((content: string) => {
    this.performHighlighting(content);
  }, 100);
  
  // 2. Memoized parsing
  private parseCache = new Map<string, ParsedSong>();
  
  parseSong(content: string): ParsedSong {
    if (this.parseCache.has(content)) {
      return this.parseCache.get(content)!;
    }
    
    const parser = new ChordSheetJS.ChordProParser();
    const song = parser.parse(content);
    this.parseCache.set(content, song);
    
    // Limit cache size
    if (this.parseCache.size > 10) {
      const firstKey = this.parseCache.keys().next().value;
      this.parseCache.delete(firstKey);
    }
    
    return song;
  }
  
  // 3. Virtual scrolling for large songs
  implementVirtualScrolling(container: HTMLElement, itemHeight: number) {
    // Use react-window for large song lists
  }
}
```

### Phase 4: Complete Integration

```typescript
// Final integrated ChordProEditor component structure
const ChordProEditor: React.FC<ChordProEditorProps> = ({
  initialContent = '',
  onChange,
  onSave,
  height = '600px',
  showPreview = true,
  autoFocus = false
}) => {
  // Core state management
  const { content, setContent, cursorPosition, undoStack, redoStack } = useEditorState(initialContent);
  
  // Layout and responsiveness  
  const { isMobile, isTablet, splitRatio } = useResponsiveLayout();
  
  // Theme management
  const { theme, setTheme } = useEditorTheme();
  
  // Mobile-specific features
  const { keyboardHeight, isKeyboardOpen } = useVirtualKeyboard();
  
  // Autocomplete
  const { suggestions, selectedIndex, handleTrigger } = useMobileAutocomplete({
    content,
    cursorPosition,
    triggerChars: ['{', '[', '@']
  });
  
  // Text alignment
  const { alignmentStyles, syncScroll } = useTextAlignment();
  
  return (
    <div className="chord-editor-container" style={{ height }}>
      {/* Mobile toggle for editor/preview */}
      {isMobile && <MobileToggle />}
      
      {/* Main split layout */}
      <div className="editor-split-layout">
        {/* Editor pane */}
        <div className="editor-pane">
          <SyntaxHighlighter content={content} theme={theme} />
          <ChordProTextArea
            value={content}
            onChange={setContent}
            onCursorChange={setCursorPosition}
            style={alignmentStyles}
          />
          {suggestions.length > 0 && (
            <AutoCompleteDropdown
              suggestions={suggestions}
              selectedIndex={selectedIndex}
              keyboardHeight={keyboardHeight}
            />
          )}
        </div>
        
        {/* Preview pane */}
        {showPreview && !isMobile && (
          <PreviewPane content={content} theme={theme} />
        )}
      </div>
    </div>
  );
};
```

## Task Implementation Order

### Critical Path Tasks

1. **Fix Alignment Issues** (Priority: CRITICAL)
   - Apply identical CSS properties to textarea and syntax highlighter
   - Implement scroll synchronization with transform
   - Add browser-specific quirk handling
   - Test across Chrome, Firefox, Safari, Edge

2. **Optimize Mobile Experience** (Priority: HIGH)
   - Implement virtual keyboard detection
   - Fix autocomplete dropdown positioning
   - Add mobile-specific touch handlers
   - Optimize for iOS and Android browsers

3. **Performance Optimization** (Priority: HIGH)
   - Add debouncing to syntax highlighting
   - Implement parse result caching
   - Optimize re-render cycles with React.memo
   - Add performance monitoring

4. **Integration Testing** (Priority: HIGH)
   - Ensure vertical slice boundaries maintained
   - Test with existing arrangement viewer
   - Validate ChordSheetJS integration
   - Check theme consistency

5. **Documentation & Polish** (Priority: MEDIUM)
   - Update component documentation
   - Add keyboard shortcut guide
   - Create usage examples
   - Performance benchmarks

## File References

### Files to Modify

```typescript
// Primary files requiring changes
const filesToModify = [
  'src/features/arrangements/components/ChordProEditor/index.tsx',
  'src/features/arrangements/components/ChordProEditor/ChordProTextArea.tsx',
  'src/features/arrangements/components/ChordProEditor/SyntaxHighlighter.tsx',
  'src/features/arrangements/components/ChordProEditor/styles/alignment.css',
  'src/features/arrangements/components/ChordProEditor/hooks/useTextAlignment.ts',
  'src/features/arrangements/components/ChordProEditor/hooks/useMobileAutocomplete.ts'
];

// Reference these existing patterns
const patternsToFollow = [
  'src/features/songs/hooks/useSongs.ts', // Data fetching pattern
  'src/shared/components/Modal/ModalContext.tsx', // Context pattern
  'src/features/auth/hooks/useAuth.ts', // Hook composition pattern
  'src/features/pwa/hooks/useOfflineStatus.ts' // Performance pattern
];
```

## Validation Gates

### Level 1: Type Safety & Linting
```bash
# Must pass without errors
npm run lint
npm run type-check

# Expected: No errors, all files properly typed
```

### Level 2: Component Tests
```bash
# Run component tests
npm run test src/features/arrangements/components/ChordProEditor

# Test alignment specifically
npm run test:alignment

# Expected: All tests green, 100% alignment accuracy
```

### Level 3: Build Validation
```bash
# Development build
npm run dev
# Check console for no errors, test alignment manually

# Production build
npm run build && npm run preview
# Verify no build errors, test in production mode
```

### Level 4: Cross-Browser Testing
```bash
# Manual testing checklist
# Chrome: Text alignment perfect ✓
# Firefox: No ligature issues ✓  
# Safari: Sub-pixel rendering OK ✓
# Edge: Scroll sync smooth ✓
# iOS Safari: Virtual keyboard detection ✓
# Chrome Android: Autocomplete positioning ✓
```

### Level 5: Performance Metrics
```bash
# Run performance tests
npm run test:performance

# Expected metrics:
# - Initial render: < 100ms
# - Typing latency: < 16ms
# - Syntax highlight: < 50ms
# - Parse large song: < 200ms
```

## Known Gotchas & Solutions

### CSS Alignment Issues
- **Problem**: Sub-pixel rendering causing misalignment
- **Solution**: Use `text-rendering: geometricPrecision` on WebKit, `auto` on Firefox
- **Reference**: PRPs/ai_docs/chordpro-editor-alignment-research.md

### Mobile Keyboard Detection
- **Problem**: `visualViewport` not available in all browsers
- **Solution**: Fallback to resize event with height comparison
- **Reference**: Implemented in `useVirtualKeyboard.ts`

### ChordSheetJS Performance
- **Problem**: Parsing large songs causes UI lag
- **Solution**: Debounce parsing, implement caching layer
- **Reference**: PRPs/ai_docs/chordsheetjs-integration-guide.md

### React 19 Strict Mode
- **Problem**: Double rendering in development causing flicker
- **Solution**: Use `useId()` for stable keys, proper cleanup in effects
- **Reference**: https://react.dev/reference/react/StrictMode

## Dependencies to Verify

```json
{
  "required": {
    "chordsheetjs": "^12.3.1",
    "@floating-ui/react": "^0.27.15",
    "clsx": "^2.1.1",
    "class-variance-authority": "^0.7.1"
  },
  "optional": {
    "@codemirror/lang-javascript": "^6.2.2",
    "@uiw/react-codemirror": "^4.23.7"
  }
}
```

## Success Criteria

### Functional Requirements
- [ ] Text in textarea and syntax highlighter align pixel-perfectly
- [ ] Scroll positions stay synchronized without lag
- [ ] Mobile autocomplete appears above virtual keyboard
- [ ] Preview updates in real-time (< 100ms delay)
- [ ] Undo/redo functionality works correctly
- [ ] Theme switching applies consistently

### Performance Requirements  
- [ ] No visible lag when typing
- [ ] Smooth scrolling at 60 FPS
- [ ] Memory usage stable over time
- [ ] Bundle size increase < 50KB gzipped

### Quality Requirements
- [ ] TypeScript strict mode compliance
- [ ] 80%+ test coverage
- [ ] Accessibility: WCAG 2.1 AA compliant
- [ ] Works on all major browsers
- [ ] Mobile-responsive design

## Architecture Decision Records

### ADR-001: Use CSS Transform for Scroll Sync
**Decision**: Use `transform: translate()` instead of `scrollTop/scrollLeft`
**Rationale**: Transform is GPU-accelerated, provides smoother performance
**Consequences**: Must handle overflow containers carefully

### ADR-002: Implement Custom Alignment System
**Decision**: Build custom CSS alignment instead of using library
**Rationale**: Full control over sub-pixel rendering issues
**Consequences**: More maintenance but better cross-browser support

### ADR-003: Cache Parsed ChordPro Results
**Decision**: Implement LRU cache for ChordSheetJS parse results
**Rationale**: Parsing is expensive for large songs
**Consequences**: Small memory overhead, significant performance gain

## Implementation Checklist

### Pre-Implementation
- [x] Research alignment solutions
- [x] Analyze existing codebase
- [x] Review vertical slice architecture
- [x] Document gotchas and solutions

### Implementation Phase 1: Core Fixes
- [ ] Fix CSS alignment properties
- [ ] Implement scroll synchronization  
- [ ] Add browser quirk detection
- [ ] Test across browsers

### Implementation Phase 2: Mobile
- [ ] Add virtual keyboard detection
- [ ] Fix autocomplete positioning
- [ ] Optimize touch interactions
- [ ] Test on real devices

### Implementation Phase 3: Performance
- [ ] Add debouncing layer
- [ ] Implement parse caching
- [ ] Optimize React renders
- [ ] Add performance monitoring

### Implementation Phase 4: Polish
- [ ] Update documentation
- [ ] Add unit tests
- [ ] Run performance benchmarks
- [ ] Create usage examples

### Post-Implementation
- [ ] Run all validation gates
- [ ] Cross-browser testing
- [ ] Performance profiling
- [ ] Documentation review

## Confidence Assessment

**Overall Confidence: 9/10**

### Strengths
- Comprehensive research already completed
- Existing implementation to build upon
- Clear patterns in codebase to follow
- Detailed alignment solutions documented

### Risk Factors
- Browser-specific rendering quirks (mitigated by research)
- Mobile keyboard behavior varies (solution documented)
- Performance with very large songs (caching strategy defined)

## Final Notes

This PRP provides comprehensive context for fixing and optimizing the ChordProEditor. The critical alignment issues are well-researched with proven solutions. The vertical slice architecture is maintained, ensuring clean integration. All validation gates are executable, providing clear success metrics.

The implementation should proceed in phases, with alignment fixes as the highest priority, followed by mobile optimization and performance improvements. Each phase has clear success criteria and validation steps.

Remember to reference the ai_docs for detailed technical solutions, especially `chordpro-editor-alignment-research.md` for the critical alignment fixes.