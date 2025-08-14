# PRP: ChordPro Editor Perfect Alignment with Mobile-First Autocomplete

## Feature Overview

Implement an ideal ChordPro textarea editor with perfect text alignment between the textarea and syntax highlighter layers, mobile-first responsive design, and intelligent autocomplete for ChordPro directives `{}` and chord suggestions `[]`. The implementation will follow the vertical slice architecture within the `arrangements` feature and maintain modular, well-documented TypeScript and CSS for future expansion.

## Problem Statement

The current ChordPro editor has several critical issues:
1. **Text misalignment** between textarea and syntax highlighter layers causing visual glitches
2. **Missing autocomplete functionality** (component was deleted) impacting mobile usability
3. **Inconsistent font definitions** across different files leading to rendering differences
4. **Mobile responsiveness issues** with font scaling and virtual keyboard handling
5. **Performance degradation** on large documents without optimization

## Success Criteria

- [ ] Perfect pixel-level text alignment between textarea and syntax highlighter across all browsers
- [ ] Functional autocomplete for ChordPro directives `{}` and chord suggestions `[]`
- [ ] Mobile-first design with touch-friendly UI (44px minimum touch targets)
- [ ] Virtual keyboard detection and UI adaptation
- [ ] Performance: <150ms syntax highlight updates, <100ms autocomplete response
- [ ] Full TypeScript type safety with strict mode compliance
- [ ] Comprehensive test coverage (>80%)
- [ ] Accessibility: WCAG 2.1 AA compliance

## Context and Research

### Detailed Research Documentation
Comprehensive research findings are documented in: `PRPs/ai_docs/chordpro-editor-alignment-research.md`

### Reference Implementation
The reference implementation at https://github.com/Kuebic/hsa-songbook-react demonstrates successful patterns for ChordPro editing with proper alignment and mobile support.

### Key Technical Resources

1. **Text Alignment Best Practices**
   - CSS-Tricks: "Creating an Editable Textarea That Supports Syntax-Highlighted Code"
   - MDN: text-rendering property documentation
   - Vincent De Oliveira: "Deep dive CSS: font metrics, line-height and vertical-align"

2. **Mobile Autocomplete Patterns**
   - Floating UI documentation: https://floating-ui.com/docs/getting-started
   - Visual Viewport API: https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API
   - Touch target guidelines: https://developer.apple.com/design/human-interface-guidelines/accessibility

3. **Performance Optimization**
   - React Window for virtual scrolling: https://github.com/bvaughn/react-window
   - Web.dev performance patterns: https://web.dev/patterns/web-vitals-patterns/

### Current Codebase Analysis

#### Existing Infrastructure
- **Location**: `/src/features/arrangements/components/ChordProEditor/`
- **Dependencies**: 
  - `@codemirror/autocomplete` (v6.18.6) - Available for autocomplete
  - `chordsheetjs` (v10.1.1) - ChordPro parsing
  - `@radix-ui` components - UI primitives
  - Tailwind CSS - Responsive styling

#### Current Issues Identified

1. **Font Inconsistencies** (editor.css lines 161, 405; index.tsx line 50)
   - Multiple different font stack definitions
   - Different quote styles causing parsing differences

2. **Missing Autocomplete** (git status shows deleted AutoCompleteDropdown.tsx)
   - Event handlers exist in ChordProTextArea.tsx (lines 15-18)
   - No UI component to display suggestions

3. **Alignment Problems** (editor.css lines 183, 200)
   - Padding applied differently between layers
   - Box model calculations may differ
   - No text-rendering optimization

4. **Mobile Issues** (responsive.css lines 44-47)
   - Font size changes only apply to container
   - Transform animations affect text alignment
   - No virtual keyboard handling

## Vertical Slice Architecture

### Feature Boundaries

The enhancement stays within the `arrangements` feature slice:

```
src/features/arrangements/components/ChordProEditor/
├── components/
│   ├── AutoCompleteDropdown/      # NEW: Autocomplete UI component
│   │   ├── index.tsx
│   │   ├── AutoCompleteDropdown.tsx
│   │   └── AutoCompleteDropdown.test.tsx
│   ├── AlignmentDebugger/         # NEW: Debug overlay for alignment
│   │   └── index.tsx
│   └── [existing components]
├── hooks/
│   ├── useTextAlignment.ts        # NEW: Alignment synchronization
│   ├── useMobileAutocomplete.ts   # NEW: Mobile-specific autocomplete
│   ├── useVirtualKeyboard.ts      # NEW: Virtual keyboard detection
│   └── [existing hooks]
├── data/
│   ├── chordProDirectives.ts      # NEW: Autocomplete data
│   └── chordSuggestions.ts        # NEW: Chord patterns
├── styles/
│   ├── alignment.css               # NEW: Alignment-specific styles
│   ├── autocomplete.css            # NEW: Autocomplete styles
│   └── [existing styles]
└── utils/
    ├── textMetrics.ts              # NEW: Font measurement utilities
    └── [existing utils]
```

### Integration Points

- **Shared Components**: Use existing Radix UI components from `@shared/components`
- **Services**: Extend `chordProService` for validation and parsing
- **Types**: Extend existing editor types in `types/editor.types.ts`
- **Hooks**: Compose with existing `useEditorState` and `useResponsiveLayout`

## Implementation Blueprint

### Phase 1: Fix Text Alignment (Priority: Critical)

#### 1.1 Standardize Font Definitions

```typescript
// utils/textMetrics.ts
export const EDITOR_FONT_STACK = "'Courier New', Courier, monospace" as const;
export const EDITOR_FONT_SIZE = 16;
export const EDITOR_LINE_HEIGHT = 1.5;

export const getEditorFontStyle = () => ({
  fontFamily: EDITOR_FONT_STACK,
  fontSize: `${EDITOR_FONT_SIZE}px`,
  lineHeight: EDITOR_LINE_HEIGHT,
  letterSpacing: 'normal',
  wordSpacing: 'normal',
  tabSize: 4,
  // Text rendering optimization
  textRendering: 'geometricPrecision',
  fontFeatureSettings: '"liga" 0, "clig" 0',
  fontVariantLigatures: 'none',
  WebkitFontSmoothing: 'subpixel-antialiased',
} as const);
```

#### 1.2 Create Alignment Hook

```typescript
// hooks/useTextAlignment.ts
export const useTextAlignment = (
  textareaRef: RefObject<HTMLTextAreaElement>,
  highlightRef: RefObject<HTMLDivElement>
) => {
  // Synchronize scroll positions
  const syncScroll = useCallback(() => {
    if (!textareaRef.current || !highlightRef.current) return;
    
    const { scrollTop, scrollLeft } = textareaRef.current;
    
    requestAnimationFrame(() => {
      if (highlightRef.current) {
        highlightRef.current.scrollTop = scrollTop;
        highlightRef.current.scrollLeft = scrollLeft;
      }
    });
  }, [textareaRef, highlightRef]);

  // Synchronize dimensions on resize
  useEffect(() => {
    if (!textareaRef.current || !highlightRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (textareaRef.current && highlightRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        Object.assign(highlightRef.current.style, {
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        });
      }
    });
    
    resizeObserver.observe(textareaRef.current);
    return () => resizeObserver.disconnect();
  }, [textareaRef, highlightRef]);

  return { syncScroll };
};
```

#### 1.3 Update CSS for Perfect Alignment

```css
/* styles/alignment.css */

/* Critical: Both layers must have IDENTICAL properties */
.chord-editor-textarea,
.syntax-highlighter {
  /* Typography - must match exactly */
  font-family: 'Courier New', Courier, monospace !important;
  font-size: 16px !important;
  line-height: 1.5 !important;
  letter-spacing: normal !important;
  word-spacing: normal !important;
  tab-size: 4 !important;
  
  /* Text rendering optimization */
  text-rendering: geometricPrecision;
  font-feature-settings: "liga" 0, "clig" 0;
  font-variant-ligatures: none;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: auto;
  
  /* Box model - must be identical */
  padding: 16px !important;
  margin: 0 !important;
  border: 1px solid transparent !important;
  box-sizing: border-box !important;
  
  /* Text behavior */
  white-space: pre-wrap !important;
  word-break: break-word !important;
  text-align: left !important;
  
  /* Prevent sub-pixel issues */
  transform: translateZ(0);
  will-change: transform;
  contain: layout style;
}

/* Debug mode overlay */
.alignment-debugger {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 23px,
    rgba(255, 0, 0, 0.1) 23px,
    rgba(255, 0, 0, 0.1) 24px
  );
}
```

### Phase 2: Implement Mobile-First Autocomplete

#### 2.1 Virtual Keyboard Detection Hook

```typescript
// hooks/useVirtualKeyboard.ts
export const useVirtualKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  useEffect(() => {
    if (!('visualViewport' in window)) return;
    
    const handleViewportChange = () => {
      const viewport = window.visualViewport!;
      const keyboardHeight = Math.max(0, window.innerHeight - viewport.height);
      
      setKeyboardHeight(keyboardHeight);
      setIsKeyboardVisible(keyboardHeight > 0);
    };
    
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    
    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportChange);
      window.visualViewport.removeEventListener('scroll', handleViewportChange);
    };
  }, []);
  
  return { keyboardHeight, isKeyboardVisible };
};
```

#### 2.2 Autocomplete Data Structure

```typescript
// data/chordProDirectives.ts
export interface AutocompleteItem {
  value: string;
  label: string;
  description?: string;
  category?: string;
  icon?: string;
}

export const CHORDPRO_DIRECTIVES: AutocompleteItem[] = [
  // Meta directives
  { value: 'title:', label: 'title', description: 'Song title', category: 'meta', icon: '📝' },
  { value: 'artist:', label: 'artist', description: 'Artist name', category: 'meta', icon: '👤' },
  { value: 'key:', label: 'key', description: 'Song key', category: 'meta', icon: '🎵' },
  { value: 'capo:', label: 'capo', description: 'Capo position', category: 'meta', icon: '🎸' },
  { value: 'tempo:', label: 'tempo', description: 'BPM', category: 'meta', icon: '⏱️' },
  
  // Structure directives
  { value: 'start_of_chorus', label: 'start_of_chorus', description: 'Begin chorus', category: 'structure', icon: '🎤' },
  { value: 'end_of_chorus', label: 'end_of_chorus', description: 'End chorus', category: 'structure', icon: '🎤' },
  { value: 'soc', label: 'soc', description: 'Start of chorus (short)', category: 'structure', icon: '🎤' },
  { value: 'eoc', label: 'eoc', description: 'End of chorus (short)', category: 'structure', icon: '🎤' },
  // ... more directives
];

// data/chordSuggestions.ts
export const getChordSuggestions = (key?: string): string[] => {
  const commonChords = ['C', 'G', 'Am', 'F', 'D', 'Em', 'A', 'E', 'Dm', 'Bm'];
  
  const keyChords: Record<string, string[]> = {
    'C': ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
    'G': ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
    'D': ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
    // ... more keys
  };
  
  return key && keyChords[key] ? keyChords[key] : commonChords;
};
```

#### 2.3 Autocomplete Component

```typescript
// components/AutoCompleteDropdown/AutoCompleteDropdown.tsx
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';

interface AutoCompleteDropdownProps {
  items: AutocompleteItem[];
  selectedIndex: number;
  onSelect: (item: AutocompleteItem) => void;
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  isMobile: boolean;
}

export const AutoCompleteDropdown: React.FC<AutoCompleteDropdownProps> = ({
  items,
  selectedIndex,
  onSelect,
  anchorEl,
  isOpen,
  isMobile,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  
  // Use Floating UI for positioning
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement: isMobile ? 'top-start' : 'bottom-start',
    middleware: [
      offset(4),
      flip({ fallbackPlacements: ['top-start', 'bottom-start'] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });
  
  useEffect(() => {
    if (anchorEl) {
      refs.setReference(anchorEl);
    }
  }, [anchorEl, refs]);
  
  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);
  
  if (!isOpen || items.length === 0) return null;
  
  const dropdownContent = (
    <div
      ref={(el) => {
        listRef.current = el;
        refs.setFloating(el);
      }}
      style={floatingStyles}
      className={`autocomplete-dropdown ${isMobile ? 'autocomplete-mobile' : ''}`}
      role="listbox"
      aria-label="ChordPro suggestions"
      aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
    >
      {items.map((item, index) => (
        <button
          key={`${item.value}-${index}`}
          id={`suggestion-${index}`}
          data-index={index}
          role="option"
          aria-selected={index === selectedIndex}
          className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelect(item)}
          type="button"
        >
          {item.icon && <span className="item-icon">{item.icon}</span>}
          <span className="item-label">{item.label}</span>
          {item.description && (
            <span className="item-description">{item.description}</span>
          )}
        </button>
      ))}
    </div>
  );
  
  // Portal to body for proper stacking context
  return createPortal(dropdownContent, document.body);
};
```

#### 2.4 Mobile Autocomplete Hook

```typescript
// hooks/useMobileAutocomplete.ts
export const useMobileAutocomplete = (
  textareaRef: RefObject<HTMLTextAreaElement>,
  onInsert: (text: string) => void
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerChar, setTriggerChar] = useState<'{' | '[' | null>(null);
  const [filterText, setFilterText] = useState('');
  const [anchorPosition, setAnchorPosition] = useState<{ x: number; y: number } | null>(null);
  
  const layout = useResponsiveLayout();
  const { keyboardHeight } = useVirtualKeyboard();
  
  // Debounced filtering
  const filterSuggestions = useMemo(
    () => debounce((trigger: '{' | '[', text: string) => {
      let items: AutocompleteItem[] = [];
      
      if (trigger === '{') {
        items = CHORDPRO_DIRECTIVES.filter(d => 
          d.label.toLowerCase().startsWith(text.toLowerCase())
        );
      } else if (trigger === '[') {
        const chords = getChordSuggestions();
        items = chords
          .filter(c => c.toLowerCase().startsWith(text.toLowerCase()))
          .map(c => ({ value: c, label: c, icon: '🎵' }));
      }
      
      setSuggestions(items.slice(0, layout.isMobile ? 10 : 20));
    }, 150),
    [layout.isMobile]
  );
  
  // Handle trigger detection
  const handleTrigger = useCallback((char: '{' | '[', position: number) => {
    setTriggerChar(char);
    setFilterText('');
    setSelectedIndex(0);
    setIsOpen(true);
    
    // Calculate anchor position for dropdown
    if (textareaRef.current) {
      // Use a temporary span to measure text position
      const measureSpan = document.createElement('span');
      Object.assign(measureSpan.style, getEditorFontStyle());
      measureSpan.style.position = 'absolute';
      measureSpan.style.visibility = 'hidden';
      measureSpan.textContent = textareaRef.current.value.substring(0, position);
      document.body.appendChild(measureSpan);
      
      const rect = measureSpan.getBoundingClientRect();
      setAnchorPosition({ x: rect.right, y: rect.bottom });
      
      document.body.removeChild(measureSpan);
    }
    
    filterSuggestions(char, '');
  }, [textareaRef, filterSuggestions]);
  
  // Handle selection
  const handleSelect = useCallback((item: AutocompleteItem) => {
    const insertText = triggerChar === '{' 
      ? `{${item.value}}`
      : `[${item.value}]`;
    
    onInsert(insertText);
    setIsOpen(false);
    setTriggerChar(null);
  }, [triggerChar, onInsert]);
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(0, i - 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(suggestions.length - 1, i + 1));
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [isOpen, selectedIndex, suggestions, handleSelect]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return {
    isOpen,
    suggestions,
    selectedIndex,
    handleTrigger,
    handleSelect,
    updateFilter: setFilterText,
    close: () => setIsOpen(false),
  };
};
```

### Phase 3: Mobile Optimization

#### 3.1 Responsive Font Scaling

```css
/* styles/responsive.css updates */

/* Mobile-first approach with consistent scaling */
.chord-editor-textarea,
.syntax-highlighter,
.editor-layers {
  /* Base mobile size - prevents iOS zoom */
  font-size: 16px !important;
  line-height: 1.5 !important;
}

/* Tablet enhancement */
@media (min-width: 768px) {
  .chord-editor-textarea,
  .syntax-highlighter,
  .editor-layers {
    font-size: 18px !important;
    line-height: 1.5 !important;
  }
}

/* Desktop enhancement */
@media (min-width: 1024px) {
  .chord-editor-textarea,
  .syntax-highlighter,
  .editor-layers {
    font-size: 20px !important;
    line-height: 1.6 !important;
  }
}

/* Virtual keyboard adaptation */
.autocomplete-mobile {
  position: fixed;
  bottom: calc(var(--keyboard-height, 0px) + 8px);
  left: 8px;
  right: 8px;
  max-height: calc(50vh - var(--keyboard-height, 0px));
  z-index: 9999;
  
  /* Touch-friendly sizing */
  .autocomplete-item {
    min-height: 44px;
    padding: 12px 16px;
    touch-action: manipulation;
  }
}
```

#### 3.2 Performance Optimizations

```typescript
// utils/performance.ts
import { debounce, throttle } from 'lodash-es';

// Debounced syntax highlighting
export const createDebouncedHighlighter = (
  highlightFn: (content: string) => string,
  delay = 150
) => {
  return debounce(highlightFn, delay, { 
    leading: false, 
    trailing: true,
    maxWait: 500 
  });
};

// Throttled scroll sync
export const createThrottledScrollSync = (
  syncFn: () => void,
  delay = 16 // 60fps
) => {
  return throttle(syncFn, delay, { 
    leading: true, 
    trailing: true 
  });
};

// Virtual scrolling for large documents
export const useVirtualContent = (
  content: string,
  viewportHeight: number,
  lineHeight = 24
) => {
  const lines = useMemo(() => content.split('\n'), [content]);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  const handleScroll = useCallback((scrollTop: number) => {
    requestIdleCallback(() => {
      const start = Math.floor(scrollTop / lineHeight);
      const end = Math.ceil((scrollTop + viewportHeight) / lineHeight);
      
      setVisibleRange({
        start: Math.max(0, start - 10),
        end: Math.min(lines.length, end + 10)
      });
    });
  }, [lines.length, viewportHeight, lineHeight]);
  
  return {
    visibleContent: lines.slice(visibleRange.start, visibleRange.end).join('\n'),
    handleScroll,
    totalHeight: lines.length * lineHeight
  };
};
```

### Phase 4: Integration and Testing

#### 4.1 Update Main Editor Component

```typescript
// components/ChordProEditor/index.tsx updates
import { useTextAlignment } from './hooks/useTextAlignment';
import { useMobileAutocomplete } from './hooks/useMobileAutocomplete';
import { useVirtualKeyboard } from './hooks/useVirtualKeyboard';
import { AutoCompleteDropdown } from './components/AutoCompleteDropdown';
import { AlignmentDebugger } from './components/AlignmentDebugger';

export const ChordProEditor: React.FC<ChordProEditorProps> = (props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  
  // New hooks for alignment and autocomplete
  const { syncScroll } = useTextAlignment(textareaRef, highlightRef);
  const autocomplete = useMobileAutocomplete(textareaRef, handleInsertText);
  const { keyboardHeight } = useVirtualKeyboard();
  
  // ... existing code ...
  
  return (
    <div 
      className="chord-pro-editor-wrapper"
      style={{ '--keyboard-height': `${keyboardHeight}px` } as React.CSSProperties}
    >
      {/* Debug overlay in development */}
      {process.env.NODE_ENV === 'development' && props.debug && (
        <AlignmentDebugger />
      )}
      
      {/* Editor layers with fixed alignment */}
      <div className="editor-layers">
        <div ref={highlightRef} className="syntax-highlighter">
          <SyntaxHighlighter content={content} theme={theme} />
        </div>
        
        <ChordProTextArea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onScroll={syncScroll}
          onAutoCompleteShow={autocomplete.handleTrigger}
          onAutoCompleteHide={autocomplete.close}
          className="chord-editor-textarea"
        />
      </div>
      
      {/* Autocomplete dropdown */}
      <AutoCompleteDropdown
        items={autocomplete.suggestions}
        selectedIndex={autocomplete.selectedIndex}
        onSelect={autocomplete.handleSelect}
        anchorEl={textareaRef.current}
        isOpen={autocomplete.isOpen}
        isMobile={layout.isMobile}
      />
    </div>
  );
};
```

#### 4.2 Testing Implementation

```typescript
// components/ChordProEditor/__tests__/alignment.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChordProEditor } from '../index';

describe('ChordProEditor Alignment', () => {
  it('should maintain perfect text alignment', async () => {
    const { container } = render(<ChordProEditor initialContent="[C]Hello [G]World" />);
    
    const textarea = container.querySelector('.chord-editor-textarea') as HTMLTextAreaElement;
    const highlighter = container.querySelector('.syntax-highlighter') as HTMLDivElement;
    
    // Check identical font properties
    const textareaStyle = window.getComputedStyle(textarea);
    const highlighterStyle = window.getComputedStyle(highlighter);
    
    expect(textareaStyle.fontFamily).toBe(highlighterStyle.fontFamily);
    expect(textareaStyle.fontSize).toBe(highlighterStyle.fontSize);
    expect(textareaStyle.lineHeight).toBe(highlighterStyle.lineHeight);
    expect(textareaStyle.padding).toBe(highlighterStyle.padding);
  });
  
  it('should sync scroll positions', async () => {
    const { container } = render(
      <ChordProEditor initialContent={Array(100).fill('[C]Line').join('\n')} />
    );
    
    const textarea = container.querySelector('.chord-editor-textarea') as HTMLTextAreaElement;
    const highlighter = container.querySelector('.syntax-highlighter') as HTMLDivElement;
    
    // Simulate scroll
    textarea.scrollTop = 100;
    textarea.dispatchEvent(new Event('scroll'));
    
    // Wait for requestAnimationFrame
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    expect(highlighter.scrollTop).toBe(100);
  });
});

// components/ChordProEditor/__tests__/autocomplete.test.tsx
describe('ChordProEditor Autocomplete', () => {
  it('should show directive suggestions on { trigger', async () => {
    const user = userEvent.setup();
    render(<ChordProEditor />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '{');
    
    // Check autocomplete appears
    const listbox = await screen.findByRole('listbox');
    expect(listbox).toBeInTheDocument();
    
    // Check suggestions include common directives
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('artist')).toBeInTheDocument();
    expect(screen.getByText('key')).toBeInTheDocument();
  });
  
  it('should show chord suggestions on [ trigger', async () => {
    const user = userEvent.setup();
    render(<ChordProEditor />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '[');
    
    const listbox = await screen.findByRole('listbox');
    expect(listbox).toBeInTheDocument();
    
    // Check common chords appear
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('G')).toBeInTheDocument();
    expect(screen.getByText('Am')).toBeInTheDocument();
  });
  
  it('should handle mobile touch interactions', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    
    const user = userEvent.setup();
    render(<ChordProEditor />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '{');
    
    const item = await screen.findByText('title');
    await user.click(item);
    
    expect(textarea).toHaveValue('{title:}');
  });
});
```

## Validation Gates

```bash
# Level 1: Type checking and linting
npm run type-check
npm run lint

# Level 2: Unit tests
npm run test -- src/features/arrangements/components/ChordProEditor

# Level 3: Integration tests
npm run test:integration -- --grep "ChordProEditor"

# Level 4: Accessibility tests
npm run test:a11y -- src/features/arrangements/components/ChordProEditor

# Level 5: Performance tests
npm run test:performance -- --grep "alignment|autocomplete"

# Level 6: Build validation
npm run build
npm run preview

# Level 7: Bundle size check
npm run analyze
# Ensure ChordPro editor bundle < 100KB gzipped

# Level 8: Cross-browser testing
npm run test:e2e -- --browser chrome,firefox,safari

# Level 9: Mobile device testing
npm run test:mobile -- --device "iPhone 14,Samsung Galaxy S23"

# Level 10: Lighthouse CI
npm run lighthouse -- --performance-budget=90 --a11y-budget=90
```

## Implementation Checklist

### Phase 1: Text Alignment ✓
- [ ] Create `utils/textMetrics.ts` with standardized font definitions
- [ ] Create `hooks/useTextAlignment.ts` for scroll/resize sync
- [ ] Create `styles/alignment.css` with identical layer styles
- [ ] Update existing CSS files to use standardized fonts
- [ ] Create `components/AlignmentDebugger` for development
- [ ] Add ResizeObserver for dynamic dimension sync
- [ ] Test alignment across zoom levels (50%-200%)
- [ ] Verify alignment on Chrome, Firefox, Safari

### Phase 2: Mobile Autocomplete ✓
- [ ] Create `hooks/useVirtualKeyboard.ts` for keyboard detection
- [ ] Create `data/chordProDirectives.ts` with all directives
- [ ] Create `data/chordSuggestions.ts` with chord patterns
- [ ] Create `components/AutoCompleteDropdown` with Floating UI
- [ ] Create `hooks/useMobileAutocomplete.ts` for logic
- [ ] Add touch gesture support
- [ ] Implement keyboard navigation (Arrow keys, Enter, Tab, Escape)
- [ ] Test on iOS Safari and Android Chrome

### Phase 3: Performance ✓
- [ ] Add debounced syntax highlighting (150ms delay)
- [ ] Implement virtual scrolling for documents > 1000 lines
- [ ] Add requestAnimationFrame for scroll sync
- [ ] Optimize re-renders with React.memo
- [ ] Add performance monitoring
- [ ] Ensure 60fps scrolling on mobile

### Phase 4: Testing ✓
- [ ] Write unit tests for alignment utilities
- [ ] Write integration tests for autocomplete
- [ ] Add accessibility tests (ARIA, keyboard nav)
- [ ] Add performance benchmarks
- [ ] Test virtual keyboard scenarios
- [ ] Cross-browser compatibility tests

### Phase 5: Documentation ✓
- [ ] Document CSS architecture decisions
- [ ] Add JSDoc to all new functions
- [ ] Create usage examples
- [ ] Document browser workarounds
- [ ] Add performance tuning guide

## Browser Support Matrix

| Feature | Chrome 120+ | Firefox 120+ | Safari 17+ | Edge 120+ | iOS Safari 17+ | Samsung Internet 23+ |
|---------|------------|--------------|------------|-----------|----------------|---------------------|
| Text Alignment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Autocomplete | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Virtual Keyboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Touch Gestures | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Performance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Performance Targets

- **Text Alignment**: Zero visual lag between layers
- **Syntax Highlighting**: < 150ms update latency
- **Autocomplete Response**: < 100ms to show suggestions
- **Scroll Performance**: 60fps on all devices
- **Memory Usage**: < 50MB for 10,000 line document
- **Bundle Size Impact**: < 30KB gzipped for new features

## Risk Mitigation

1. **Browser Incompatibility**: Use feature detection and polyfills
2. **Performance Degradation**: Implement progressive enhancement
3. **Mobile Keyboard Issues**: Fallback to native behavior if Visual Viewport API unavailable
4. **Large Document Handling**: Implement virtual scrolling beyond 1000 lines
5. **Font Loading Issues**: Use system fonts as fallback

## Dependencies

```json
{
  "dependencies": {
    "@floating-ui/react": "^0.26.28",
    "lodash-es": "^4.17.21",
    "react-window": "^1.8.10"
  },
  "devDependencies": {
    "@testing-library/user-event": "^14.5.2",
    "@types/lodash-es": "^4.17.12"
  }
}
```

## Success Metrics

- **User Satisfaction**: > 90% positive feedback on mobile editing experience
- **Performance**: All targets met across 95% of devices
- **Accessibility**: WCAG 2.1 AA compliance verified
- **Code Quality**: > 80% test coverage, 0 critical issues
- **Bundle Size**: < 30KB additional JavaScript

## Future Enhancements

1. **Smart Suggestions**: Context-aware chord suggestions based on key signature
2. **Gesture Support**: Swipe gestures for undo/redo
3. **Offline Support**: PWA caching for autocomplete data
4. **Collaborative Editing**: Real-time multi-user support
5. **AI Assistance**: Chord progression suggestions using ML

---

## Confidence Score: 9/10

This PRP provides comprehensive context and implementation details for achieving perfect text alignment and mobile-friendly autocomplete in the ChordPro editor. The research is thorough, the architecture respects existing patterns, and the validation gates ensure quality. The 1-point deduction is for potential edge cases in older mobile browsers that may require additional testing and workarounds during implementation.