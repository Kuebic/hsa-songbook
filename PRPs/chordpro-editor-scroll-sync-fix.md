# PRP: ChordPro Editor Scroll Synchronization Fix

## Executive Summary

Fix the scroll synchronization issue between the textarea and syntax highlighter layers in the ChordPro editor. The current implementation has scroll sync logic but it's not working correctly due to structural issues with the container hierarchy and missing requestAnimationFrame optimization. This PRP provides a comprehensive solution based on extensive research and analysis.

**Confidence Score: 9.5/10** - Very high confidence due to clear problem identification, proven solutions from research, and minimal changes required.

## Problem Statement

The ChordPro editor uses a layered approach with a transparent textarea over a syntax highlighter div for visual editing. While scroll synchronization code exists, it's not functioning properly:

1. **Container Structure Issue**: The syntax highlighter is inside a container div with its own scroll, conflicting with the sync mechanism
2. **Missing RAF Optimization**: Scroll sync doesn't use requestAnimationFrame, causing jank
3. **CSS Alignment**: Minor differences in padding/margin between layers
4. **No Resize Observer**: Dynamic dimension changes aren't synchronized

## Root Cause Analysis

Based on code analysis in `/src/features/arrangements/components/ChordProEditor/index.tsx`:

```typescript
// Current problematic structure (lines 203-219):
<div ref={syntaxRef} className="syntax-container" style={{ overflow: 'auto' }}>
  <SyntaxHighlighter content={content} />
</div>
```

The `syntaxRef` points to the container, not the actual syntax content. When scrolling is synced, it's updating the wrong element's scroll position.

## Success Criteria

- [ ] Perfect scroll synchronization between textarea and syntax highlighter
- [ ] Zero visual lag or jank during scrolling
- [ ] Maintains alignment across all zoom levels (50%-200%)
- [ ] Works on all browsers (Chrome, Firefox, Safari, Edge)
- [ ] No regression in existing functionality
- [ ] Performance: < 16ms frame time (60fps scrolling)

## Context and Research

### Technical References

1. **CSS-Tricks Article**: "Creating an Editable Textarea That Supports Syntax-Highlighted Code"
   - URL: https://css-tricks.com/creating-an-editable-textarea-that-supports-syntax-highlighted-code/
   - Key insight: Use identical CSS properties and direct scroll sync

2. **Font Metrics Research**: "Deep dive CSS: font metrics, line-height and vertical-align"
   - URL: https://iamvdo.me/en/blog/css-font-metrics-line-height-and-vertical-align
   - Key insight: Precise font metric matching is critical

3. **Prior Research**: See `PRPs/ai_docs/chordpro-editor-alignment-research.md`

### Current Implementation Analysis

The codebase correctly implements:
- Identical font properties in `alignment.css`
- Scroll event handler in `ChordProTextArea`
- Layered structure with proper z-index

The issues are:
- Incorrect ref targeting (container vs content)
- Missing requestAnimationFrame
- Redundant scroll containers

## Vertical Slice Architecture

This fix stays within the existing `arrangements` feature slice:

```
src/features/arrangements/components/ChordProEditor/
├── index.tsx                    # Main fix location
├── ChordProTextArea.tsx         # Already correct
├── SyntaxHighlighter.tsx        # No changes needed
├── hooks/
│   └── useScrollSync.ts         # NEW: Dedicated scroll sync hook
└── styles/
    └── alignment.css            # Minor adjustments
```

## Implementation Blueprint

### Phase 1: Fix Container Structure

#### 1.1 Update Main Editor Component

```typescript
// src/features/arrangements/components/ChordProEditor/index.tsx

export const ChordProEditor: React.FC<ChordProEditorProps> = ({...}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const syntaxRef = useRef<HTMLDivElement | null>(null); // Now points to actual content
  
  // ... existing code ...
  
  return (
    <div className="chord-pro-editor-wrapper">
      {/* ... toolbar ... */}
      
      <div className="chord-pro-editor-container">
        <div className="chord-editor-pane">
          <div className="editor-layers">
            {/* Simplified structure - no nested container */}
            <div 
              ref={syntaxRef}
              className="syntax-highlighter-layer"
              aria-hidden="true"
            >
              <SyntaxHighlighter 
                content={content} 
                theme={currentTheme}
              />
            </div>
            
            <ChordProTextArea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onScroll={(scrollTop, scrollLeft) => {
                // Use RAF for smooth sync
                requestAnimationFrame(() => {
                  if (syntaxRef.current) {
                    syntaxRef.current.scrollTop = scrollTop;
                    syntaxRef.current.scrollLeft = scrollLeft;
                  }
                });
              }}
              // ... other props
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Phase 2: Create Dedicated Scroll Sync Hook

#### 2.1 Implement useScrollSync Hook

```typescript
// src/features/arrangements/components/ChordProEditor/hooks/useScrollSync.ts

import { useEffect, useRef, useCallback, RefObject } from 'react';

interface UseScrollSyncOptions {
  enabled?: boolean;
  throttleMs?: number;
}

export const useScrollSync = (
  sourceRef: RefObject<HTMLElement>,
  targetRef: RefObject<HTMLElement>,
  options: UseScrollSyncOptions = {}
) => {
  const { enabled = true, throttleMs = 0 } = options;
  const rafId = useRef<number>();
  const lastSync = useRef<number>(0);
  
  const syncScroll = useCallback(() => {
    if (!sourceRef.current || !targetRef.current || !enabled) return;
    
    const now = Date.now();
    if (throttleMs > 0 && now - lastSync.current < throttleMs) return;
    
    // Cancel any pending animation frame
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    // Schedule sync on next animation frame
    rafId.current = requestAnimationFrame(() => {
      if (targetRef.current && sourceRef.current) {
        targetRef.current.scrollTop = sourceRef.current.scrollTop;
        targetRef.current.scrollLeft = sourceRef.current.scrollLeft;
        lastSync.current = now;
      }
    });
  }, [sourceRef, targetRef, enabled, throttleMs]);
  
  // Set up scroll listener
  useEffect(() => {
    const source = sourceRef.current;
    if (!source || !enabled) return;
    
    source.addEventListener('scroll', syncScroll, { passive: true });
    
    return () => {
      source.removeEventListener('scroll', syncScroll);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [sourceRef, syncScroll, enabled]);
  
  // Sync dimensions on resize
  useEffect(() => {
    if (!sourceRef.current || !targetRef.current || !enabled) return;
    
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (sourceRef.current && targetRef.current) {
          const rect = sourceRef.current.getBoundingClientRect();
          targetRef.current.style.width = `${rect.width}px`;
          targetRef.current.style.height = `${rect.height}px`;
        }
      });
    });
    
    resizeObserver.observe(sourceRef.current);
    
    return () => resizeObserver.disconnect();
  }, [sourceRef, targetRef, enabled]);
  
  return { syncScroll };
};
```

### Phase 3: Fix CSS Alignment

#### 3.1 Update alignment.css

```css
/* src/features/arrangements/components/ChordProEditor/styles/alignment.css */

/* Syntax highlighter layer - positioned absolutely */
.syntax-highlighter-layer {
  position: absolute;
  inset: 0;
  overflow: auto;
  z-index: 1;
  pointer-events: none;
  
  /* Hide scrollbars - textarea handles scrolling */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.syntax-highlighter-layer::-webkit-scrollbar {
  display: none;
}

/* Ensure syntax highlighter content has same box model */
.syntax-highlighter {
  /* Remove any default margins that might exist */
  margin: 0 !important;
  display: block;
  min-height: 100%;
}

/* Both layers must have identical padding */
.chord-editor-textarea,
.syntax-highlighter-layer {
  padding: 16px !important;
  box-sizing: border-box !important;
}
```

### Phase 4: Integrate Hook in Main Component

#### 4.1 Use the New Hook

```typescript
// src/features/arrangements/components/ChordProEditor/index.tsx

import { useScrollSync } from './hooks/useScrollSync';

export const ChordProEditor: React.FC<ChordProEditorProps> = ({...}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const syntaxRef = useRef<HTMLDivElement | null>(null);
  
  // Use the scroll sync hook
  useScrollSync(textareaRef, syntaxRef, {
    enabled: true,
    throttleMs: 0 // No throttling for immediate response
  });
  
  // Remove the manual onScroll handler from ChordProTextArea
  // The hook handles everything
  
  return (
    <div className="chord-pro-editor-wrapper">
      {/* ... */}
      <ChordProTextArea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        // onScroll prop removed - handled by hook
        // ... other props
      />
    </div>
  );
};
```

### Phase 5: Browser-Specific Fixes

#### 5.1 Add Browser Detection and Workarounds

```typescript
// src/features/arrangements/components/ChordProEditor/utils/browserDetection.ts

export const getBrowserSpecificStyles = () => {
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  const isWebKit = 'webkitRequestAnimationFrame' in window;
  
  if (isFirefox) {
    // Firefox handles text-rendering differently
    return {
      textRendering: 'auto',
      MozOsxFontSmoothing: 'auto'
    };
  }
  
  if (isWebKit) {
    // WebKit browsers (Safari, Chrome)
    return {
      textRendering: 'geometricPrecision',
      WebkitFontSmoothing: 'subpixel-antialiased'
    };
  }
  
  return {
    textRendering: 'auto'
  };
};
```

## Testing Strategy

### Unit Tests

```typescript
// __tests__/useScrollSync.test.ts
describe('useScrollSync', () => {
  it('syncs scroll positions with RAF', async () => {
    const { result } = renderHook(() => 
      useScrollSync(sourceRef, targetRef)
    );
    
    // Trigger scroll on source
    act(() => {
      sourceRef.current.scrollTop = 100;
      sourceRef.current.dispatchEvent(new Event('scroll'));
    });
    
    // Wait for RAF
    await waitFor(() => {
      expect(targetRef.current.scrollTop).toBe(100);
    });
  });
  
  it('syncs dimensions on resize', async () => {
    // Test ResizeObserver functionality
  });
});
```

### Integration Tests

```typescript
// __tests__/ChordProEditor.integration.test.tsx
describe('ChordProEditor Scroll Sync', () => {
  it('maintains perfect alignment during scroll', async () => {
    const { container } = render(
      <ChordProEditor initialContent={longContent} />
    );
    
    const textarea = container.querySelector('.chord-editor-textarea');
    const syntaxLayer = container.querySelector('.syntax-highlighter-layer');
    
    // Simulate scroll
    fireEvent.scroll(textarea, { target: { scrollTop: 200 } });
    
    await waitFor(() => {
      expect(syntaxLayer.scrollTop).toBe(200);
    });
  });
});
```

## Validation Gates

```bash
# Level 1: Type checking
npm run type-check

# Level 2: Linting
npm run lint

# Level 3: Unit tests
npm run test -- useScrollSync

# Level 4: Integration tests
npm run test -- ChordProEditor

# Level 5: Manual browser testing
# Test on: Chrome, Firefox, Safari, Edge
# - Scroll with mouse wheel
# - Scroll with scrollbar drag
# - Scroll with keyboard (Page Up/Down)
# - Test at different zoom levels

# Level 6: Performance testing
# Use Chrome DevTools Performance tab
# - Record scrolling interaction
# - Verify 60fps (16ms frame budget)
# - Check for layout thrashing

# Level 7: Build and preview
npm run build
npm run preview
```

## Implementation Checklist

- [ ] Remove nested container structure in index.tsx
- [ ] Create useScrollSync hook with RAF optimization
- [ ] Update syntaxRef to point to content div, not container
- [ ] Remove overflow: auto from syntax container
- [ ] Add ResizeObserver for dimension sync
- [ ] Test scroll sync on all browsers
- [ ] Verify no visual lag or jank
- [ ] Ensure alignment at all zoom levels
- [ ] Add unit tests for new hook
- [ ] Add integration tests for scroll behavior
- [ ] Update documentation

## Performance Metrics

- **Scroll Performance**: 60fps (< 16ms per frame)
- **Memory Usage**: No increase from current implementation
- **Bundle Size Impact**: < 2KB for new hook
- **CPU Usage**: < 5% during active scrolling

## Risk Mitigation

1. **Browser Incompatibility**: Use feature detection for RAF and ResizeObserver
2. **Performance Regression**: Profile before and after changes
3. **Edge Cases**: Test with very long documents (10,000+ lines)
4. **Mobile Issues**: Test on actual devices, not just responsive mode

## Alternative Solutions Considered

1. **Using transform instead of scroll sync**: Would require complete restructure
2. **ContentEditable div instead of textarea**: Too many edge cases with input handling
3. **Single element with mixed content**: Loss of native textarea behavior
4. **Virtual scrolling**: Overcomplicated for this use case

## Decision Rationale

The chosen solution:
- Minimal code changes (high confidence)
- Leverages native browser APIs (RAF, ResizeObserver)
- Maintains existing architecture
- Proven pattern from CSS-Tricks and other implementations
- Easy to test and debug

## Future Enhancements

1. Add horizontal scroll sync for long lines
2. Implement smooth scrolling with easing
3. Add scroll position indicators
4. Consider virtual scrolling for very large documents

## References

- [CSS-Tricks: Creating an Editable Textarea That Supports Syntax-Highlighted Code](https://css-tricks.com/creating-an-editable-textarea-that-supports-syntax-highlighted-code/)
- [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [MDN: ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [React 19 Performance Patterns](https://react.dev/learn/render-and-commit#optimizing-performance)

---

## Confidence Score: 9.5/10

This PRP has very high confidence because:
- The root cause is clearly identified (incorrect ref targeting)
- The solution is straightforward and proven
- Minimal changes to existing code
- Strong test coverage planned
- Based on well-documented patterns

The 0.5 point deduction is for potential browser-specific edge cases that may only appear during implementation.