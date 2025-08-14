# ChordPro Editor Alignment and Mobile Autocomplete Research Documentation

## Executive Summary

This document consolidates comprehensive research on implementing perfect text alignment between textarea and syntax highlighter layers, along with mobile-friendly autocomplete functionality for the ChordPro editor. The research covers technical solutions, best practices, and implementation strategies based on industry standards and the reference implementation at https://github.com/Kuebic/hsa-songbook-react.

## 1. Text Alignment Solutions

### Critical CSS Properties for Perfect Alignment

```css
/* Both textarea and syntax highlighter MUST have identical properties */
.textarea-layer, .highlight-layer {
  /* Typography - exact matching required */
  font-family: 'Courier New', Courier, monospace;
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: normal;
  word-spacing: normal;
  tab-size: 4;
  
  /* Text rendering optimization */
  text-rendering: geometricPrecision;
  font-feature-settings: "liga" 0, "clig" 0;
  font-variant-ligatures: none;
  -webkit-font-smoothing: subpixel-antialiased;
  
  /* Box model - must be identical */
  padding: 16px;
  margin: 0;
  border: 1px solid transparent;
  box-sizing: border-box;
  
  /* Text behavior */
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
}
```

### Browser-Specific Workarounds

```javascript
// Detect and handle sub-pixel rendering issues
const handleSubPixelAlignment = () => {
  const isWebKit = 'webkitRequestAnimationFrame' in window;
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  
  if (isWebKit) {
    // WebKit handles geometricPrecision well
    return { textRendering: 'geometricPrecision' };
  } else if (isFirefox) {
    // Firefox treats geometricPrecision as optimizeLegibility
    return { textRendering: 'auto' };
  }
  return { textRendering: 'auto' };
};
```

### Scroll Synchronization Strategies

```javascript
// Method 1: Transform-based (recommended for performance)
function syncScrollTransform(textarea, highlightLayer) {
  textarea.addEventListener('scroll', () => {
    requestAnimationFrame(() => {
      highlightLayer.style.transform = 
        `translate(-${textarea.scrollLeft}px, -${textarea.scrollTop}px)`;
    });
  });
}

// Method 2: Direct scroll sync with debouncing
function syncScrollDirect(textarea, highlightLayer) {
  let ticking = false;
  
  textarea.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        highlightLayer.scrollTop = textarea.scrollTop;
        highlightLayer.scrollLeft = textarea.scrollLeft;
        ticking = false;
      });
      ticking = true;
    }
  });
}
```

## 2. Mobile-First Autocomplete Implementation

### Virtual Keyboard Detection

```typescript
const useVirtualKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  useEffect(() => {
    if (!('visualViewport' in window)) return;
    
    const handleViewportChange = () => {
      const viewport = window.visualViewport!;
      const keyboardHeight = window.innerHeight - viewport.height;
      setKeyboardHeight(Math.max(0, keyboardHeight));
    };
    
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    
    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportChange);
      window.visualViewport.removeEventListener('scroll', handleViewportChange);
    };
  }, []);
  
  return keyboardHeight;
};
```

### Touch-Friendly Autocomplete UI

```css
/* Mobile-optimized autocomplete styles */
.autocomplete-mobile {
  /* iOS/Android touch target guidelines */
  --touch-target: 44px;
  
  position: fixed;
  z-index: 9999;
  max-height: calc(50vh - var(--keyboard-height, 0px));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.autocomplete-item {
  min-height: var(--touch-target);
  padding: 12px 16px;
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Prevent iOS zoom on input focus */
@supports (-webkit-touch-callout: none) {
  .chord-editor-textarea {
    font-size: 16px !important;
  }
}
```

### ChordPro-Specific Suggestion Data

```typescript
// Comprehensive ChordPro directives
export const CHORDPRO_DIRECTIVES = [
  // Meta directives
  { value: 'title:', label: 'title', description: 'Song title', category: 'meta' },
  { value: 'subtitle:', label: 'subtitle', description: 'Song subtitle', category: 'meta' },
  { value: 'artist:', label: 'artist', description: 'Artist name', category: 'meta' },
  { value: 'composer:', label: 'composer', description: 'Composer name', category: 'meta' },
  { value: 'lyricist:', label: 'lyricist', description: 'Lyricist name', category: 'meta' },
  { value: 'copyright:', label: 'copyright', description: 'Copyright info', category: 'meta' },
  { value: 'album:', label: 'album', description: 'Album name', category: 'meta' },
  { value: 'year:', label: 'year', description: 'Release year', category: 'meta' },
  { value: 'key:', label: 'key', description: 'Song key', category: 'meta' },
  { value: 'time:', label: 'time', description: 'Time signature', category: 'meta' },
  { value: 'tempo:', label: 'tempo', description: 'Song tempo', category: 'meta' },
  { value: 'duration:', label: 'duration', description: 'Song duration', category: 'meta' },
  { value: 'capo:', label: 'capo', description: 'Capo position', category: 'meta' },
  
  // Structure directives
  { value: 'start_of_chorus', label: 'start_of_chorus', description: 'Begin chorus', category: 'structure' },
  { value: 'end_of_chorus', label: 'end_of_chorus', description: 'End chorus', category: 'structure' },
  { value: 'start_of_verse', label: 'start_of_verse', description: 'Begin verse', category: 'structure' },
  { value: 'end_of_verse', label: 'end_of_verse', description: 'End verse', category: 'structure' },
  { value: 'start_of_bridge', label: 'start_of_bridge', description: 'Begin bridge', category: 'structure' },
  { value: 'end_of_bridge', label: 'end_of_bridge', description: 'End bridge', category: 'structure' },
  { value: 'start_of_tab', label: 'start_of_tab', description: 'Begin tablature', category: 'structure' },
  { value: 'end_of_tab', label: 'end_of_tab', description: 'End tablature', category: 'structure' },
  
  // Formatting directives
  { value: 'comment:', label: 'comment', description: 'Add comment', category: 'format' },
  { value: 'comment_italic:', label: 'comment_italic', description: 'Italic comment', category: 'format' },
  { value: 'comment_box:', label: 'comment_box', description: 'Boxed comment', category: 'format' },
  { value: 'chorus', label: 'chorus', description: 'Repeat chorus', category: 'format' },
  { value: 'highlight:', label: 'highlight', description: 'Highlight text', category: 'format' },
  
  // Shortcuts
  { value: 'soc', label: 'soc', description: 'Start of chorus (short)', category: 'shortcut' },
  { value: 'eoc', label: 'eoc', description: 'End of chorus (short)', category: 'shortcut' },
  { value: 'sov', label: 'sov', description: 'Start of verse (short)', category: 'shortcut' },
  { value: 'eov', label: 'eov', description: 'End of verse (short)', category: 'shortcut' },
];

// Common chord patterns organized by key
export const CHORD_SUGGESTIONS = {
  common: ['C', 'G', 'Am', 'F', 'D', 'Em', 'A', 'E', 'Dm', 'Bm'],
  
  byKey: {
    'C': ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
    'G': ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
    'D': ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
    'A': ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
    'E': ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
    'F': ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
  },
  
  variations: {
    major: ['', 'maj7', 'maj9', '6', '6/9', 'add9', 'sus2', 'sus4'],
    minor: ['m', 'm7', 'm9', 'm6', 'm11', 'madd9'],
    dominant: ['7', '9', '11', '13', '7sus4'],
    diminished: ['dim', 'dim7', 'm7b5'],
    augmented: ['aug', '+', '+7']
  }
};
```

## 3. Mobile-First Design Patterns

### Progressive Enhancement Strategy

```typescript
// Base mobile styles first
const mobileFirst = {
  // Core mobile experience
  fontSize: '16px',  // Prevents iOS zoom
  padding: '12px',
  lineHeight: 1.6,
  
  // Enhanced tablet experience
  '@media (min-width: 768px)': {
    fontSize: '18px',
    padding: '16px',
  },
  
  // Full desktop experience
  '@media (min-width: 1024px)': {
    fontSize: '20px',
    padding: '20px',
    // Enable advanced features
    enableAutoComplete: true,
    enableShortcuts: true,
  }
};
```

### Touch Gesture Support

```typescript
// Swipe gesture for mobile preview toggle
const useSwipeGesture = (onSwipeLeft: () => void, onSwipeRight: () => void) => {
  const touchStart = useRef({ x: 0, y: 0 });
  
  const handleTouchStart = (e: TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.current.y;
    
    // Horizontal swipe detection (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }
  };
  
  return { handleTouchStart, handleTouchEnd };
};
```

## 4. Performance Optimization Techniques

### Debounced Syntax Highlighting

```typescript
const useDebouncedHighlight = (content: string, delay = 150) => {
  const [highlightedContent, setHighlightedContent] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const highlighted = highlightChordPro(content);
      setHighlightedContent(highlighted);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [content, delay]);
  
  return highlightedContent;
};
```

### Virtual Scrolling for Large Documents

```typescript
const useVirtualScroll = (content: string, viewportHeight: number) => {
  const lines = useMemo(() => content.split('\n'), [content]);
  const lineHeight = 24; // Fixed line height for calculation
  
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  const handleScroll = useCallback((scrollTop: number) => {
    const start = Math.floor(scrollTop / lineHeight);
    const end = Math.ceil((scrollTop + viewportHeight) / lineHeight);
    
    setVisibleRange({ 
      start: Math.max(0, start - 10), // Buffer for smooth scrolling
      end: Math.min(lines.length, end + 10)
    });
  }, [lines.length, viewportHeight]);
  
  const visibleContent = useMemo(() => 
    lines.slice(visibleRange.start, visibleRange.end).join('\n'),
    [lines, visibleRange]
  );
  
  return { visibleContent, handleScroll, totalHeight: lines.length * lineHeight };
};
```

## 5. Accessibility Considerations

### ARIA Implementation

```typescript
const AccessibleAutocomplete = ({ suggestions, selectedIndex, onSelect }) => {
  const listRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Announce selection changes to screen readers
    const selected = suggestions[selectedIndex];
    if (selected) {
      const announcement = `${selected.label}, ${selected.description}`;
      // Use aria-live region for announcement
      announceToScreenReader(announcement);
    }
  }, [selectedIndex, suggestions]);
  
  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="ChordPro suggestions"
      aria-activedescendant={`suggestion-${selectedIndex}`}
      className="autocomplete-list"
    >
      {suggestions.map((item, index) => (
        <div
          key={item.value}
          id={`suggestion-${index}`}
          role="option"
          aria-selected={index === selectedIndex}
          aria-label={`${item.label}, ${item.description}`}
          onClick={() => onSelect(item)}
          className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
        >
          <span className="suggestion-label">{item.label}</span>
          <span className="suggestion-description">{item.description}</span>
        </div>
      ))}
    </div>
  );
};
```

## 6. Browser Compatibility Matrix

| Feature | Chrome | Firefox | Safari | Edge | iOS Safari | Samsung Internet |
|---------|--------|---------|--------|------|------------|------------------|
| text-rendering: geometricPrecision | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ |
| Visual Viewport API | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Touch events | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ResizeObserver | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CSS contain | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 7. Implementation Checklist

- [ ] Implement identical CSS properties for textarea and highlighter
- [ ] Add text-rendering optimization properties
- [ ] Implement scroll synchronization with requestAnimationFrame
- [ ] Add ResizeObserver for dynamic dimension sync
- [ ] Create mobile-friendly autocomplete component
- [ ] Implement virtual keyboard detection
- [ ] Add touch gesture support
- [ ] Implement debounced syntax highlighting
- [ ] Add virtual scrolling for large documents
- [ ] Implement comprehensive ARIA attributes
- [ ] Test across all target browsers and devices
- [ ] Add performance monitoring
- [ ] Document all browser-specific workarounds

## 8. Reference Implementation Links

- **Monaco Editor**: https://github.com/microsoft/monaco-editor - Industry-standard code editor
- **CodeMirror 6**: https://codemirror.net/docs/ - Modern code editor framework
- **Floating UI**: https://floating-ui.com/ - Positioning library for autocomplete
- **React Window**: https://github.com/bvaughn/react-window - Virtual scrolling
- **ChordSheetJS**: https://github.com/martijnversluis/ChordSheetJS - ChordPro parsing

## 9. Testing Strategy

### Unit Tests
- Font property synchronization
- Scroll position calculations
- Autocomplete filtering logic
- Virtual keyboard detection

### Integration Tests
- Textarea/highlighter alignment across zoom levels
- Autocomplete positioning with virtual keyboard
- Touch gesture recognition
- Performance under large documents

### E2E Tests
- Mobile device text input flow
- Autocomplete selection on touch devices
- Theme switching without alignment issues
- Copy/paste functionality

## 10. Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.0s
- **Syntax Highlight Update**: < 150ms
- **Autocomplete Response**: < 100ms
- **Scroll Sync Lag**: < 16ms (60fps)
- **Memory Usage**: < 50MB for 10,000 line document