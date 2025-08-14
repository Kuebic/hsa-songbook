# ChordSheetJS Theme Integration and Layout Enhancement

**Feature**: Enhanced ChordSheetJS rendering with proper theme integration (light/dark/stage), consistent lyric alignment, and correct chord positioning

**Priority**: High
**Estimated Complexity**: Medium
**Feature Slice**: `src/features/arrangements/`

## Problem Definition

### Current Issues

1. **Incomplete Theme Integration**: ChordSheetJS rendering does not fully integrate with the site's theme system (light/dark/stage), resulting in inconsistent visual appearance and poor readability in different modes.

2. **Lyric Alignment Problems**: Lyrics don't consistently align on the same baseline, creating an uneven reading experience that affects musical performance and practice.

3. **Chord Positioning Inconsistencies**: Chords are not always positioned correctly above their corresponding lyrics, violating ChordPro format standards and reducing musical clarity.

4. **Style Conflicts**: Multiple CSS approaches (inline styles, CSS variables, legacy styles) create conflicts and maintenance challenges.

### Business Impact

- **Performance Usage**: Stage mode essential for live musical performances requires high contrast and visibility
- **User Experience**: Poor readability affects musicians' ability to perform songs effectively
- **Accessibility**: Theme integration critical for users with visual impairments
- **Maintenance**: Style conflicts increase development time and complexity

## Context and Requirements

### Comprehensive Research Documentation

This PRP is backed by extensive research documented in:
- `PRPs/ai_docs/chordsheetjs-comprehensive-research.md` - ChordSheetJS API and best practices
- Current codebase analysis of arrangements feature slice
- Theme system architecture documentation
- Accessibility and performance testing patterns

### Current Architecture Analysis

#### Existing ChordSheetJS Implementation
```typescript
// Current unified renderer approach
// File: src/features/arrangements/hooks/useUnifiedChordRenderer.ts
const renderChordSheet = useCallback((content: string, options?: RenderOptions): string => {
  const parser = new ChordSheetJS.ChordProParser();
  const song = parser.parse(content);
  
  if (options?.transpose !== undefined && options.transpose !== 0) {
    song.transpose(options.transpose);
  }
  
  const formatter = new ChordSheetJS.HtmlDivFormatter();
  let html = formatter.format(song);
  
  // Current approach uses inline styles - THIS IS THE PROBLEM
  html = applyPreferenceStyles(html, options);
  return html;
}, [applyPreferenceStyles]);
```

#### Current Theme System
```typescript
// File: src/features/arrangements/types/preferences.types.ts
interface ChordDisplayPreferences {
  theme: 'light' | 'dark' | 'auto' | 'stage';
  fontSize: number;
  fontFamily: string;
  chordColor: string;
  lyricColor: string;
  // ... other preferences
}
```

#### Current CSS Structure (PROBLEMATIC)
```css
/* File: src/features/arrangements/styles/unified-chord-display.css */
.chord-sheet-rendered .row {
  display: flex;
  align-items: baseline; /* Recently fixed but still has edge cases */
}

/* Inline styles override CSS themes - NEEDS FIXING */
.chord-sheet-rendered .chord {
  color: ${preferences.chordColor} !important; /* Anti-pattern */
}
```

### External API Reference

**ChordSheetJS Documentation**: https://martijnversluis.github.io/ChordSheetJS/
- **HtmlDivFormatter**: Primary formatter for responsive chord sheet layout
- **Song.transpose()**: Chord transposition functionality
- **ChordProParser**: Standard ChordPro format parsing

**ChordPro Format Specification**: https://www.chordpro.org/chordpro/
- Chord positioning standards: chords appear above corresponding lyrics
- Baseline alignment requirements for readability

### Technical Requirements

#### Functional Requirements

1. **Dynamic Theme Integration**
   - ChordSheetJS output respects light/dark/stage theme selection
   - Smooth transitions between themes without re-parsing
   - Theme changes apply to both preview and viewer modes

2. **Proper ChordPro Layout**
   - Chords positioned above corresponding lyrics per ChordPro standards
   - All lyrics align on consistent baseline regardless of chord presence
   - Responsive layout maintains readability across device sizes

3. **Performance Optimization**
   - Theme changes don't trigger expensive re-parsing
   - Smooth rendering for large chord sheets (500+ lines)
   - Minimal layout thrashing during theme transitions

#### Non-Functional Requirements

1. **Accessibility**
   - WCAG 2.1 AA compliance across all themes
   - High contrast ratios in stage mode (4.5:1 minimum)
   - Screen reader compatibility with semantic markup

2. **Browser Compatibility**
   - Consistent rendering across modern browsers
   - Fallback support for older CSS features
   - Mobile-first responsive design

3. **Maintainability**
   - Single source of truth for theme colors
   - Modular CSS architecture
   - Clear separation of concerns

## Implementation Blueprint

### Vertical Slice Enhancement Strategy

This feature enhances the existing `arrangements` vertical slice without creating new cross-slice dependencies:

```
src/features/arrangements/
├── hooks/
│   ├── useUnifiedChordRenderer.ts      # MODIFY - Remove inline styles
│   └── useThemeAwareRenderer.ts        # NEW - Theme integration logic
├── styles/
│   ├── unified-chord-display.css       # MAJOR REFACTOR - CSS-only theming
│   └── chord-layout.css                # NEW - Layout-specific styles
├── utils/
│   └── themeStyleGenerator.ts          # NEW - Dynamic theme style generation
└── components/
    ├── ChordSheetViewer.tsx            # MODIFY - Apply theme classes
    └── ChordProEditor/
        └── PreviewPane.tsx             # MODIFY - Apply theme classes
```

### Implementation Tasks (Priority Order)

#### Phase 1: CSS Theme Foundation
```typescript
// Task 1: Refactor unified-chord-display.css to be purely CSS-based
// Remove all inline style generation
// Implement comprehensive CSS custom properties for all themes

/* New approach - CSS-only theming */
[data-theme="light"] {
  --chord-color: #2563eb;
  --lyric-color: #111827;
  --background-color: #ffffff;
  --section-color: #7c3aed;
}

[data-theme="dark"] {
  --chord-color: #60a5fa;
  --lyric-color: #f3f4f6;
  --background-color: #1f2937;
  --section-color: #a78bfa;
}

[data-theme="stage"] {
  --chord-color: #fbbf24;
  --lyric-color: #ffffff;
  --background-color: #000000;
  --section-color: #f59e0b;
}

.chord-sheet-rendered .chord {
  color: var(--chord-color);
  /* No more !important overrides */
}
```

#### Phase 2: Layout Enhancement
```css
/* Task 2: Fix chord-above-lyric positioning and lyric baseline alignment */
.chord-sheet-rendered .row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end; /* Align lyric baselines */
  margin-bottom: 0.5em;
}

.chord-sheet-rendered .column {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  margin-right: 0.5em;
  position: relative;
}

.chord-sheet-rendered .chord {
  position: absolute;
  top: -1.2em;
  left: 0;
  white-space: nowrap;
  line-height: 1;
  z-index: 1;
}

.chord-sheet-rendered .lyrics {
  padding-top: 1.2em; /* Space for chords above */
  line-height: 1.5;
  margin: 0;
  position: relative;
  z-index: 0;
}
```

#### Phase 3: Hook Refactoring
```typescript
// Task 3: Modify useUnifiedChordRenderer to remove inline styles
export function useUnifiedChordRenderer(): UseUnifiedChordRendererReturn {
  const [preferences, setPreferences] = useState<ChordDisplayPreferences>(
    chordPreferencesService.getPreferences()
  );

  const renderChordSheet = useCallback((content: string, options?: RenderOptions): string => {
    if (!content || !content.trim()) {
      return '<div class="empty-state">No content to display</div>';
    }

    try {
      const parser = new ChordSheetJS.ChordProParser();
      const song = parser.parse(content);

      if (options?.transpose !== undefined && options.transpose !== 0) {
        song.transpose(options.transpose);
      }

      const formatter = new ChordSheetJS.HtmlDivFormatter();
      let html = formatter.format(song);

      // NEW APPROACH: CSS class-based theming only
      html = `<div class="chord-sheet-rendered" data-theme="${preferences.theme}">${html}</div>`;

      return html;
    } catch (error) {
      console.error('Error rendering chord sheet:', error);
      return `<div class="error-state">Error rendering chord sheet</div>`;
    }
  }, [preferences.theme]); // Only depend on theme, not all preferences

  return {
    renderChordSheet,
    preferences,
    updatePreferences,
    resetPreferences,
    isValidChordPro
  };
}
```

#### Phase 4: Component Integration
```typescript
// Task 4: Update components to use theme classes
// File: src/features/arrangements/components/ChordSheetViewer.tsx

export function ChordSheetViewer({ 
  chordProText, 
  onCenterTap,
  className 
}: ChordSheetViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { transposition } = useTransposition()
  const { renderChordSheet, preferences } = useUnifiedChordRenderer()
  
  const formattedHtml = useMemo(() => {
    if (!chordProText) {
      return '<div class="empty">No chord sheet available</div>'
    }
    
    try {
      return renderChordSheet(chordProText, { 
        transpose: transposition,
        // Remove fontSize and fontFamily - now handled by CSS
      })
    } catch (error) {
      console.error('ChordSheet parse error:', error)
      return '<div class="error">Unable to parse chord sheet</div>'
    }
  }, [chordProText, transposition, renderChordSheet])
  
  return (
    <div 
      ref={containerRef}
      className={clsx("chord-sheet-container", className)}
      onClick={handleCenterTap}
      data-theme={preferences.theme} // Apply theme to container
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <div 
        className="chord-sheet-content"
        dangerouslySetInnerHTML={{ __html: formattedHtml }}
        style={{ height: '100%', overflow: 'auto' }}
      />
    </div>
  )
}
```

### Critical Implementation Details

#### CSS Custom Properties Strategy
```css
/* Comprehensive theme variable system */
:root {
  /* Base typography */
  --chord-font-size: 0.95em;
  --chord-font-weight: 600;
  --lyric-line-height: 1.5;
  --chord-line-height: 1;
  
  /* Spacing */
  --chord-margin-bottom: 2px;
  --column-margin-right: 0.5em;
  --row-margin-bottom: 0.5em;
  
  /* Positioning */
  --chord-offset-top: -1.2em;
  --lyric-padding-top: 1.2em;
}

/* Theme-specific color overrides */
[data-theme="light"] {
  --chord-color: #2563eb;
  --lyric-color: #111827;
  --comment-color: #6b7280;
  --section-color: #7c3aed;
  --background-color: #ffffff;
}

[data-theme="dark"] {
  --chord-color: #60a5fa;
  --lyric-color: #f3f4f6;
  --comment-color: #9ca3af;
  --section-color: #a78bfa;
  --background-color: #1f2937;
}

[data-theme="stage"] {
  --chord-color: #fbbf24;
  --lyric-color: #ffffff;
  --comment-color: #d1d5db;
  --section-color: #f59e0b;
  --background-color: #000000;
  
  /* Stage mode enhancements */
  --chord-font-weight: 700;
  --chord-font-size: 1.1em;
}
```

#### Performance Optimization Strategy
```typescript
// Memoization strategy for expensive operations
const renderChordSheet = useCallback((content: string, options?: RenderOptions): string => {
  // Only re-render if content or transpose changes, not theme
  // Theme changes handled purely by CSS
}, []);

// Separate theme application from parsing
const applyThemeClasses = useCallback((html: string, theme: string): string => {
  return `<div class="chord-sheet-rendered" data-theme="${theme}">${html}</div>`;
}, []);
```

### File Modifications Summary

#### Modified Files
1. **`src/features/arrangements/hooks/useUnifiedChordRenderer.ts`**
   - Remove `applyPreferenceStyles` function
   - Simplify rendering to CSS-only approach
   - Optimize re-rendering logic

2. **`src/features/arrangements/styles/unified-chord-display.css`**
   - Complete refactor to CSS custom properties
   - Remove all hardcoded color values
   - Implement proper chord positioning and lyric alignment

3. **`src/features/arrangements/components/ChordSheetViewer.tsx`**
   - Add `data-theme` attribute to container
   - Remove inline style passing to renderer

4. **`src/features/arrangements/components/ChordProEditor/PreviewPane.tsx`**
   - Add `data-theme` attribute to container
   - Remove inline style passing to renderer

#### New Files
1. **`src/features/arrangements/styles/chord-layout.css`** (optional)
   - Layout-specific styles if separation needed
   - Advanced positioning utilities

### Error Handling Strategy

```typescript
// Graceful theme fallbacks
const getThemeWithFallback = (theme: string): string => {
  const validThemes = ['light', 'dark', 'stage'];
  return validThemes.includes(theme) ? theme : 'light';
};

// CSS fallback support
.chord-sheet-rendered .chord {
  color: var(--chord-color, #2563eb); /* Fallback for unsupported browsers */
}
```

## Testing Strategy

### Test Coverage Requirements

Based on existing testing patterns in the codebase (70% frontend coverage threshold):

#### Unit Tests
```typescript
// File: src/features/arrangements/hooks/__tests__/useUnifiedChordRenderer.test.ts
describe('useUnifiedChordRenderer', () => {
  it('renders chord sheet with correct theme classes', () => {
    const { result } = renderHook(() => useUnifiedChordRenderer());
    const html = result.current.renderChordSheet('[G]Hello [C]World');
    
    expect(html).toContain('data-theme="light"');
    expect(html).toContain('class="chord-sheet-rendered"');
    expect(html).not.toContain('style='); // No inline styles
  });

  it('changes theme without re-parsing content', () => {
    const { result } = renderHook(() => useUnifiedChordRenderer());
    
    // Test performance: theme change should not trigger re-parse
    const consoleSpy = vi.spyOn(console, 'log');
    
    act(() => {
      result.current.updatePreferences({ theme: 'dark' });
    });
    
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Parsing'));
  });
});
```

#### Integration Tests
```typescript
// File: src/features/arrangements/components/__tests__/ChordSheetViewer.integration.test.tsx
describe('ChordSheetViewer Theme Integration', () => {
  it('applies correct theme classes across all modes', async () => {
    const themes = ['light', 'dark', 'stage'] as const;
    
    for (const theme of themes) {
      const { container } = render(
        <ChordSheetViewer 
          chordProText="[G]Amazing [D]Grace" 
          theme={theme}
        />
      );
      
      expect(container.querySelector('[data-theme]')).toHaveAttribute('data-theme', theme);
      expect(container.querySelector('.chord')).toBeInTheDocument();
      expect(container.querySelector('.lyrics')).toBeInTheDocument();
    }
  });
});
```

#### Visual Regression Tests
```typescript
// File: src/features/arrangements/components/__tests__/ChordSheetViewer.visual.test.tsx
describe('ChordSheetViewer Visual Tests', () => {
  it('maintains chord positioning across themes', () => {
    const testContent = '[G]Amazing [D]grace how [Em]sweet the [C]sound';
    
    themes.forEach(theme => {
      const { container } = render(
        <ChordSheetViewer chordProText={testContent} theme={theme} />
      );
      
      const chordElements = container.querySelectorAll('.chord');
      const lyricElements = container.querySelectorAll('.lyrics');
      
      // Verify chord positioning
      chordElements.forEach((chord, index) => {
        const rect = chord.getBoundingClientRect();
        expect(rect.top).toBeLessThan(lyricElements[index].getBoundingClientRect().top);
      });
    });
  });
});
```

#### Accessibility Tests
```typescript
// File: src/features/arrangements/components/__tests__/ChordSheetViewer.a11y.test.tsx
describe('ChordSheetViewer Accessibility', () => {
  it('meets WCAG contrast requirements in all themes', async () => {
    const themes = ['light', 'dark', 'stage'] as const;
    
    for (const theme of themes) {
      const { container } = render(
        <ChordSheetViewer chordProText="[G]Test [C]content" theme={theme} />
      );
      
      // Use jest-axe for automated accessibility testing
      const results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // Additional contrast testing
      const chordElement = container.querySelector('.chord');
      const contrastRatio = getContrastRatio(chordElement);
      
      if (theme === 'stage') {
        expect(contrastRatio).toBeGreaterThan(7); // AAA level for stage mode
      } else {
        expect(contrastRatio).toBeGreaterThan(4.5); // AA level
      }
    }
  });
});
```

#### Performance Tests
```typescript
// File: src/features/arrangements/components/__tests__/ChordSheetViewer.performance.test.tsx
describe('ChordSheetViewer Performance', () => {
  it('theme changes complete within performance budget', () => {
    const { rerender } = render(
      <ChordSheetViewer chordProText="[G]Test" theme="light" />
    );
    
    const startTime = performance.now();
    rerender(<ChordSheetViewer chordProText="[G]Test" theme="dark" />);
    const themeChangeTime = performance.now() - startTime;
    
    expect(themeChangeTime).toBeLessThan(16); // One frame at 60fps
  });

  it('handles large chord sheets efficiently', () => {
    const largeContent = Array.from({ length: 500 }, (_, i) => 
      `[G]Line ${i} [C]with [D]multiple [Em]chords`
    ).join('\n');
    
    const startTime = performance.now();
    render(<ChordSheetViewer chordProText={largeContent} />);
    const renderTime = performance.now() - startTime;
    
    expect(renderTime).toBeLessThan(100); // 100ms budget for large content
  });
});
```

## Validation Gates (Executable by AI)

### Phase 1: Development Validation
```bash
# Type checking with strict TypeScript
npm run type-check

# ESLint validation with React and accessibility rules
npm run lint

# Prettier code formatting
npm run format:check
```

### Phase 2: Functional Testing
```bash
# Unit tests with coverage
npm run test:coverage -- --reporter=verbose src/features/arrangements/

# Integration tests
npm run test -- --reporter=verbose src/features/arrangements/__tests__/integration/

# Component accessibility tests
npm run test -- --reporter=verbose src/features/arrangements/__tests__/accessibility/
```

### Phase 3: Performance Validation
```bash
# Performance benchmarks
npm run test:performance -- src/features/arrangements/

# Bundle size analysis
npm run analyze

# Build performance check
npm run build && npm run preview
```

### Phase 4: Visual Validation
```bash
# Start development server for manual testing
npm run dev

# Visual regression testing (if configured)
npm run test:visual

# Cross-browser testing checklist
# - Chrome: Theme switching, chord positioning
# - Firefox: CSS custom property support
# - Safari: Webkit-specific rendering
# - Mobile browsers: Touch interaction, responsive layout
```

### Phase 5: Accessibility Validation
```bash
# Automated accessibility testing
npm run test:a11y

# Manual accessibility checklist:
# - Keyboard navigation (Tab, Shift+Tab, Arrow keys)
# - Screen reader compatibility (NVDA, JAWS, VoiceOver)
# - High contrast mode support
# - Focus indicators visible in all themes
# - Color contrast ratios meet WCAG standards
```

### Manual Testing Scenarios

#### Theme Integration Testing
1. **Theme Switching**
   - Switch between light/dark/stage themes in ChordPro editor
   - Verify immediate visual update without content reload
   - Test in both preview pane and full viewer

2. **Content Consistency**
   - Compare preview vs viewer rendering with same content
   - Verify identical chord positioning and lyric alignment
   - Test with various ChordPro constructs (sections, comments, directives)

#### Layout Validation
1. **Chord Positioning**
   - Test with single chords: `[G]word`
   - Test with multiple chords: `[G]wo[C]rd`
   - Test chord-only lines: `[G] [C] [D] [Em]`
   - Test empty chord brackets: `[]word`

2. **Lyric Alignment**
   - Test lines with different chord densities
   - Verify baseline alignment across mixed content
   - Test long chord names: `[Gmaj7/B]`

## Dependencies and Risks

### External Dependencies
- **ChordSheetJS v12.3.1**: Stable, actively maintained
- **React v19.1.0**: Concurrent features supported
- **CSS Custom Properties**: Supported in all target browsers (>95% support)

### Technical Risks

#### High Risk
1. **CSS Custom Property Performance**: Older browsers may have performance issues with many custom properties
   - **Mitigation**: Provide fallback values and test on lower-end devices

2. **Theme Flash on Load**: Brief unstyled content flash during theme detection
   - **Mitigation**: Implement theme detection in SSR or localStorage sync

#### Medium Risk
1. **ChordSheetJS HTML Structure Changes**: Future library updates could break CSS selectors
   - **Mitigation**: Pin library version, comprehensive tests, semantic class targeting

2. **Mobile Performance**: Large chord sheets may cause scrolling performance issues
   - **Mitigation**: Virtual scrolling, content optimization, performance budgets

#### Low Risk
1. **Browser Compatibility**: Modern CSS features not supported in very old browsers
   - **Mitigation**: Progressive enhancement, feature detection

### Implementation Risks

#### Complexity Risk: Medium
- Multiple CSS files and theme interactions require careful coordination
- Testing matrix across themes and content types is extensive

#### Performance Risk: Low
- CSS-only theme switching is inherently fast
- Removal of inline styles reduces DOM manipulation

#### Maintenance Risk: Low
- CSS custom properties provide single source of truth
- Clear separation of concerns reduces coupling

## Success Metrics

### Functional Metrics
- [ ] All three themes (light/dark/stage) apply correctly to ChordSheetJS content
- [ ] Chords positioned above corresponding lyrics in all cases
- [ ] Lyrics maintain consistent baseline alignment
- [ ] No visual regressions in existing functionality

### Performance Metrics
- [ ] Theme switching completes in <16ms (one frame)
- [ ] Large chord sheet rendering <100ms initial load
- [ ] No layout thrashing during theme transitions
- [ ] Memory usage stable across theme changes

### Accessibility Metrics
- [ ] WCAG 2.1 AA compliance in light/dark themes
- [ ] WCAG 2.1 AAA contrast in stage theme
- [ ] Screen reader compatible with semantic markup
- [ ] Keyboard navigation functional across all themes

### Maintainability Metrics
- [ ] Single CSS file for all theme logic
- [ ] No duplicate color definitions
- [ ] Clear separation of layout and theme concerns
- [ ] Comprehensive test coverage (>70%)

## Conclusion

This implementation provides a robust, maintainable solution for ChordSheetJS theme integration that enhances the user experience while maintaining performance and accessibility standards. The CSS-first approach ensures smooth theme transitions and simplified maintenance, while the comprehensive testing strategy validates functionality across all use cases.

**Confidence Score: 9/10**

This PRP provides comprehensive context, clear implementation paths, executable validation gates, and addresses all known risks. The solution builds upon existing patterns in the codebase and leverages well-documented APIs and standards.