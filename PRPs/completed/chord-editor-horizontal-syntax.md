# PRP: Horizontal Chord Editor with Syntax Highlighting

## Feature: Enhanced ChordPro Editor with Horizontal Layout and Toggle Preview

**Status**: Active  
**Confidence Level**: 9/10 - High confidence due to comprehensive research and existing patterns  
**Created**: 2025-01-09  
**Type**: Feature Enhancement  

---

## Executive Summary

Transform the current chord editor implementation into a professional horizontal split-view editor with proper syntax highlighting in a native textarea, inspired by the patterns from https://github.com/Kuebic/hsa-songbook-react. This PRP provides comprehensive context for one-pass implementation success.

## Context and Research

### Current Implementation Analysis

The codebase has fragmented editor implementations across two locations:
- `/src/features/arrangements/` - Advanced viewer with custom syntax highlighting (performance issues)
- `/src/features/songs/components/arrangements/` - Legacy editor with better UX features

**Critical Issues to Address:**
1. Custom regex-based syntax highlighting causes performance degradation
2. No horizontal split layout option
3. Missing toggle functionality for preview
4. Fragmented implementations across features

### Inspiration Repository Findings

The hsa-songbook-react repository demonstrates:
- **Ace Editor integration** for professional syntax highlighting
- **Horizontal flexbox layout** with conditional preview rendering
- **Custom hooks** for state management (useChordEditor pattern)
- **ChordSheetJS integration** for parsing and rendering
- **Responsive design** with mobile-first approach

### Technology Stack Decision

After comprehensive research, the implementation will use:
- **@uiw/react-textarea-code-editor** (already in package.json v3.1.1) - Enhanced for ChordPro
- **ChordSheetJS** (v12.3.0) - Continue using for parsing/rendering
- **CSS Flexbox** - For horizontal split layout
- **React hooks** - For state management and settings persistence

## Vertical Slice Architecture

This feature will enhance the existing `/src/features/arrangements/` slice:

```
src/features/arrangements/
├── components/
│   ├── ChordEditorEnhanced.tsx      # NEW: Main editor with horizontal layout
│   ├── ChordSyntaxHighlight.tsx     # NEW: Optimized syntax highlighting
│   ├── ChordPreviewPane.tsx         # ENHANCE: Preview with toggle
│   └── EditorToolbar.tsx            # NEW: Toolbar with toggle controls
├── hooks/
│   ├── useChordEditor.ts            # NEW: Editor state management
│   ├── useEditorLayout.ts           # NEW: Layout and toggle logic
│   └── useSyntaxHighlighting.ts     # NEW: Syntax highlighting logic
├── utils/
│   ├── chordProHighlighter.ts       # NEW: ChordPro syntax rules
│   └── editorHelpers.ts             # NEW: Editor utilities
└── styles/
    └── chord-editor-enhanced.css     # NEW: Enhanced editor styles
```

## Implementation Blueprint

### Phase 1: Core Editor Component

```typescript
// ChordEditorEnhanced.tsx - Main horizontal editor component
interface ChordEditorEnhancedProps {
  initialContent: string
  onChange: (content: string) => void
  onSave?: (content: string) => void
  height?: number | string
  showToolbar?: boolean
  defaultPreviewVisible?: boolean
}

const ChordEditorEnhanced: React.FC<ChordEditorEnhancedProps> = ({
  initialContent,
  onChange,
  onSave,
  height = '600px',
  showToolbar = true,
  defaultPreviewVisible = true
}) => {
  const {
    content,
    setContent,
    isDirty,
    validation,
    undo,
    redo,
    canUndo,
    canRedo
  } = useChordEditor(initialContent)
  
  const { showPreview, togglePreview, splitRatio } = useEditorLayout(defaultPreviewVisible)
  
  return (
    <div className="chord-editor-container" style={{ height }}>
      {showToolbar && (
        <EditorToolbar
          onTogglePreview={togglePreview}
          showPreview={showPreview}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onSave={() => onSave?.(content)}
          isDirty={isDirty}
        />
      )}
      
      <div className="chord-editor-content">
        <div className="chord-editor-pane" style={{ flex: showPreview ? splitRatio : 1 }}>
          <ChordSyntaxHighlight
            value={content}
            onChange={(val) => {
              setContent(val)
              onChange(val)
            }}
            placeholder="Enter ChordPro notation..."
            validation={validation}
          />
        </div>
        
        {showPreview && (
          <>
            <div className="chord-editor-divider" />
            <div className="chord-preview-pane" style={{ flex: 1 - splitRatio }}>
              <ChordPreviewPane
                content={content}
                validation={validation}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

### Phase 2: Syntax Highlighting Implementation

```typescript
// ChordSyntaxHighlight.tsx - Enhanced textarea with syntax highlighting
import CodeEditor from '@uiw/react-textarea-code-editor'

const ChordSyntaxHighlight: React.FC<SyntaxHighlightProps> = ({ 
  value, 
  onChange, 
  placeholder,
  validation 
}) => {
  const highlightedCode = useSyntaxHighlighting(value)
  
  return (
    <div className="chord-syntax-container">
      <CodeEditor
        value={value}
        language="chordpro"
        placeholder={placeholder}
        onChange={(evn) => onChange(evn.target.value)}
        padding={15}
        style={{
          fontSize: 14,
          fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace',
        }}
        data-color-mode="auto"
        extensions={[chordProExtension()]} // Custom ChordPro highlighting
      />
      {validation?.errors && (
        <div className="validation-errors">
          {validation.errors.map((err, i) => (
            <div key={i} className="error-message">{err}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// chordProHighlighter.ts - Syntax highlighting rules
export const chordProExtension = () => {
  return {
    // ChordPro specific highlighting patterns
    patterns: [
      { regex: /\[[A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?\]/g, className: 'chord' },
      { regex: /\{(?:title|t|subtitle|st|artist|a|key|tempo|time|capo):[^}]*\}/gi, className: 'directive' },
      { regex: /\{(?:start_of_chorus|end_of_chorus|soc|eoc|start_of_verse|end_of_verse|sov|eov)\}/gi, className: 'section' },
      { regex: /\{comment:[^}]*\}/gi, className: 'comment' },
      { regex: /^#.*/gm, className: 'comment-line' }
    ]
  }
}
```

### Phase 3: State Management Hooks

```typescript
// useChordEditor.ts - Comprehensive editor state management
export function useChordEditor(initialContent: string) {
  const [content, setContent] = useState(initialContent)
  const [history, setHistory] = useState<string[]>([initialContent])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isDirty, setIsDirty] = useState(false)
  
  const debouncedContent = useDebounce(content, 300)
  const validation = useChordProValidation(debouncedContent)
  
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent)
    setIsDirty(newContent !== initialContent)
    
    // Update history for undo/redo
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newContent])
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex, initialContent])
  
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setContent(history[historyIndex - 1])
    }
  }, [history, historyIndex])
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setContent(history[historyIndex + 1])
    }
  }, [history, historyIndex])
  
  return {
    content,
    setContent: updateContent,
    isDirty,
    validation,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1
  }
}

// useEditorLayout.ts - Layout and preview toggle management
export function useEditorLayout(defaultShowPreview = true) {
  const [showPreview, setShowPreview] = useLocalStorage('chord-editor-preview', defaultShowPreview)
  const [splitRatio, setSplitRatio] = useLocalStorage('chord-editor-split', 0.5)
  const { isMobile } = useResponsiveLayout()
  
  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev)
  }, [setShowPreview])
  
  // Mobile adjustments
  const effectiveSplitRatio = isMobile ? 1 : splitRatio
  const effectiveShowPreview = isMobile ? false : showPreview // Mobile uses tabs instead
  
  return {
    showPreview: effectiveShowPreview,
    togglePreview,
    splitRatio: effectiveSplitRatio,
    setSplitRatio,
    isMobile
  }
}
```

### Phase 4: Styling Implementation

```css
/* chord-editor-enhanced.css */
.chord-editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--editor-bg, #ffffff);
  border: 1px solid var(--editor-border, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
}

.chord-editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.chord-editor-pane,
.chord-preview-pane {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}

.chord-editor-divider {
  width: 1px;
  background: var(--editor-border, #e5e7eb);
  cursor: col-resize;
  position: relative;
}

.chord-editor-divider:hover {
  background: var(--editor-divider-hover, #3b82f6);
  width: 3px;
  margin: 0 -1px;
}

/* Syntax highlighting colors */
.chord-syntax-container .chord {
  color: #2563eb;
  font-weight: bold;
}

.chord-syntax-container .directive {
  color: #7c3aed;
  font-weight: 600;
}

.chord-syntax-container .section {
  color: #059669;
  text-transform: uppercase;
}

.chord-syntax-container .comment,
.chord-syntax-container .comment-line {
  color: #6b7280;
  font-style: italic;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .chord-editor-container {
    --editor-bg: #1f2937;
    --editor-border: #374151;
    --editor-divider-hover: #60a5fa;
  }
  
  .chord-syntax-container .chord {
    color: #60a5fa;
  }
  
  .chord-syntax-container .directive {
    color: #a78bfa;
  }
  
  .chord-syntax-container .section {
    color: #34d399;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .chord-editor-content {
    flex-direction: column;
  }
  
  .chord-editor-divider {
    display: none;
  }
  
  .chord-editor-pane,
  .chord-preview-pane {
    flex: none;
    height: 50%;
  }
}
```

### Phase 5: Integration with Existing Components

```typescript
// Update existing ChordEditingPage.tsx
import { ChordEditorEnhanced } from '../components/ChordEditorEnhanced'

export function ChordEditingPage() {
  const { arrangementId } = useParams()
  const { arrangement, updateArrangement } = useArrangement(arrangementId)
  
  const handleSave = async (content: string) => {
    await updateArrangement({
      ...arrangement,
      chordProText: content
    })
  }
  
  return (
    <div className="chord-editing-page">
      <ChordEditorEnhanced
        initialContent={arrangement?.chordProText || ''}
        onChange={(content) => {
          // Auto-save or mark as dirty
        }}
        onSave={handleSave}
        height="calc(100vh - 120px)"
        defaultPreviewVisible={true}
      />
    </div>
  )
}
```

## Implementation Tasks

1. **Core Editor Setup** (Priority: High)
   - [ ] Create ChordEditorEnhanced component with horizontal layout
   - [ ] Implement flexbox-based split view
   - [ ] Add preview toggle functionality
   - [ ] Ensure responsive design for mobile

2. **Syntax Highlighting** (Priority: High)
   - [ ] Enhance @uiw/react-textarea-code-editor with ChordPro rules
   - [ ] Create chordProHighlighter utility with regex patterns
   - [ ] Implement real-time highlighting without performance issues
   - [ ] Add validation error display

3. **State Management** (Priority: Medium)
   - [ ] Create useChordEditor hook with undo/redo
   - [ ] Implement useEditorLayout for preview toggle
   - [ ] Add localStorage persistence for settings
   - [ ] Implement dirty state tracking

4. **Toolbar Implementation** (Priority: Medium)
   - [ ] Create EditorToolbar component
   - [ ] Add chord insertion helpers
   - [ ] Implement save/cancel workflow
   - [ ] Add undo/redo buttons

5. **Integration** (Priority: Low)
   - [ ] Replace existing ChordSyntaxEditor
   - [ ] Update ChordEditingPage to use new editor
   - [ ] Migrate existing editor instances
   - [ ] Clean up legacy code

6. **Testing** (Priority: High)
   - [ ] Unit tests for hooks
   - [ ] Component tests for editor
   - [ ] Integration tests for save workflow
   - [ ] Performance tests for large documents

## Validation Gates

```bash
# 1. Type checking - Must pass
npm run type-check

# 2. Linting - Must pass
npm run lint

# 3. Unit tests - Must pass
npm run test -- src/features/arrangements/

# 4. Build validation - Must pass
npm run build

# 5. Performance check - Editor should handle 10KB ChordPro files smoothly
# Test with large file: npm run test:performance

# 6. Browser testing - Manual validation
npm run dev
# Verify:
# - Syntax highlighting works in Chrome, Firefox, Safari
# - Preview toggle functions correctly
# - Mobile layout switches to tabs
# - Dark mode colors are readable
# - No console errors

# 7. Bundle size check - Should not increase by more than 50KB
npm run analyze
```

## External Resources

### Documentation
- **@uiw/react-textarea-code-editor**: https://uiwjs.github.io/react-textarea-code-editor/
- **ChordSheetJS**: https://www.chordsheetjs.org/
- **ChordPro Format**: https://www.chordpro.org/chordpro/chordpro-introduction/
- **Flexbox Guide**: https://css-tricks.com/snippets/css/a-guide-to-flexbox/

### Implementation References
- **Inspiration repo**: https://github.com/Kuebic/hsa-songbook-react
- **Ace Editor patterns**: https://github.com/securingsincity/react-ace
- **CodeMirror 6 ChordPro**: https://github.com/martijnversluis/ChordSheetJS/tree/master/packages/chord-sheet-editor

### Existing Codebase References
- Current editor: `/src/features/arrangements/components/ChordSyntaxEditor.tsx`
- Preview component: `/src/features/arrangements/components/ChordPreview.tsx`
- ChordSheetJS usage: `/src/features/arrangements/components/ChordSheetViewer.tsx`
- Existing styles: `/src/features/arrangements/styles/chordsheet.css`

## Risk Mitigation

### Performance Risks
- **Risk**: Syntax highlighting slows down for large files
- **Mitigation**: Use debouncing, virtualization for files > 5KB

### Browser Compatibility
- **Risk**: @uiw/react-textarea-code-editor may have issues in older browsers
- **Mitigation**: Test in target browsers, provide fallback to plain textarea

### Mobile Experience
- **Risk**: Horizontal split doesn't work well on mobile
- **Mitigation**: Switch to tabs on mobile screens < 768px

## Success Criteria

1. ✅ Editor renders with horizontal split layout
2. ✅ Syntax highlighting works in real-time without lag
3. ✅ Preview toggle shows/hides preview pane
4. ✅ Settings persist across sessions
5. ✅ Mobile layout switches to appropriate view
6. ✅ All existing ChordPro features continue working
7. ✅ Performance is equal or better than current implementation
8. ✅ No increase in bundle size > 50KB

## Notes

- Preserve existing ChordSheetJS integration patterns
- Maintain backward compatibility with existing chord data
- Keep the existing compression architecture intact
- Follow the established vertical slice architecture pattern
- Use existing UI components from shared/components where possible

---

**Confidence Score**: 9/10

This PRP provides comprehensive context with:
- ✅ Detailed implementation blueprint with code examples
- ✅ Clear vertical slice boundaries
- ✅ Extensive research findings integrated
- ✅ Executable validation gates
- ✅ External documentation references
- ✅ Risk mitigation strategies
- ✅ Clear success criteria

The implementation should be achievable in a single pass with this context.