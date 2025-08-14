# PRP: Enhanced Chord Transposition for Arrangement View and ChordPro Editor

## Executive Summary
Enhance the existing chord transposition functionality in the arrangement viewer and integrate comprehensive transposition capabilities into the ChordPro editor, providing users with seamless key changes across all viewing and editing modes.

## Context

### Current State Analysis
The HSA Songbook application currently has:
- **Basic transposition controls** in ViewerToolbar and ViewerControls components
- **ChordSheetJS v12.3.1** installed with full transposition capabilities
- **useTransposition hook** for managing transposition state
- **Stage mode** with minimal floating transpose controls
- **No transposition in ChordPro editor** - missing in the editing experience

### Problem Statement
While the arrangement viewer has basic transposition, users need:
1. Enhanced transposition controls with better UX
2. Transposition capability in the ChordPro editor
3. Keyboard shortcuts for quick transposition
4. Visual feedback showing transposition amount
5. Reset to original key functionality
6. Persistent transposition preferences

### Technical Requirements
- React 19.1 + TypeScript 5.8 + Vite 7.0
- ChordSheetJS v12.3.1 for transposition logic
- Vertical slice architecture compliance
- Mobile-first responsive design
- Accessibility compliance (ARIA, keyboard navigation)

## Research & References

### Critical Documentation
- **Local Research**: `PRPs/ai_docs/chord-transposition-enhancement-research.md`
- **ChordSheetJS Docs**: https://github.com/martijnversluis/ChordSheetJS
- **ChordSheetJS Playground**: https://martijnversluis.github.io/ChordFiddle/
- **TonalJS (for advanced features)**: https://github.com/tonaljs/tonal
- **React Context Pattern**: https://andytran.ca/blog/2021/06/30/render-chords/

### Existing Implementation Files
```typescript
// Core transposition files to reference
src/features/arrangements/hooks/useTransposition.ts
src/features/arrangements/components/ViewerToolbar.tsx
src/features/arrangements/components/ViewerControls.tsx
src/features/arrangements/services/chordProService.ts
src/features/arrangements/hooks/useUnifiedChordRenderer.ts
```

### Key Patterns to Follow
- **Vertical Slice**: Keep all transposition logic within arrangements feature
- **Hook Pattern**: Use custom hooks for state management
- **Service Layer**: Utilize chordProService for ChordSheetJS operations
- **Design Tokens**: Use existing tokens from `src/shared/styles/tokens.ts`

## Implementation Blueprint

### Phase 1: Enhanced Viewer Transposition

#### 1.1 Improve Existing Controls
```typescript
// src/features/arrangements/components/TransposeControls.tsx
interface TransposeControlsProps {
  currentKey: string;
  originalKey: string;
  semitones: number;
  onTranspose: (steps: number) => void;
  onReset: () => void;
  variant?: 'toolbar' | 'controls' | 'stage' | 'editor';
}

// Visual enhancements
- Show transposition amount: "+2" or "-3" 
- Highlight when transposed (different color)
- Add reset button when semitones !== 0
- Improve key display format
```

#### 1.2 Add Keyboard Shortcuts
```typescript
// src/features/arrangements/hooks/useTransposeKeyboard.ts
export function useTransposeKeyboard(
  onTranspose: (steps: number) => void,
  onReset: () => void
) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch(e.key) {
          case '+':
          case '=':
            e.preventDefault();
            onTranspose(1);
            break;
          case '-':
            e.preventDefault();
            onTranspose(-1);
            break;
          case '0':
            e.preventDefault();
            onReset();
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onTranspose, onReset]);
}
```

#### 1.3 Enhance useTransposition Hook
```typescript
// src/features/arrangements/hooks/useTransposition.ts (enhanced)
interface TranspositionState {
  semitones: number;
  originalKey: string;
  currentKey: string;
  canTransposeUp: boolean;
  canTransposeDown: boolean;
  isTransposed: boolean;
}

export function useTransposition(
  originalKey: string,
  options?: {
    persist?: boolean;
    persistKey?: string;
    min?: number;  // default -12
    max?: number;  // default 12
  }
): TranspositionState & {
  transpose: (steps: number) => void;
  setTransposition: (semitones: number) => void;
  reset: () => void;
  transposeToKey: (targetKey: string) => void;
}
```

### Phase 2: ChordPro Editor Integration

#### 2.1 Editor Transposition State
```typescript
// src/features/arrangements/components/ChordProEditor/hooks/useEditorTransposition.ts
interface EditorTranspositionState {
  previewSemitones: number;      // For live preview only
  appliedSemitones: number;      // Actually applied to content
  isPreviewMode: boolean;        // Preview vs applied mode
  originalContent: string;       // Preserve original
  transposedContent: string;     // After applying
}

export function useEditorTransposition(
  content: string,
  onChange: (content: string) => void
) {
  const [state, setState] = useState<EditorTranspositionState>({
    previewSemitones: 0,
    appliedSemitones: 0,
    isPreviewMode: false,
    originalContent: content,
    transposedContent: content
  });
  
  const previewTranspose = (steps: number) => {
    // Update preview only
  };
  
  const applyTransposition = () => {
    // Apply to actual content
    const transposed = chordProService.transpose(
      state.originalContent, 
      state.previewSemitones
    );
    onChange(transposed);
  };
  
  const resetTransposition = () => {
    // Reset to original
    onChange(state.originalContent);
  };
  
  return {
    ...state,
    previewTranspose,
    applyTransposition,
    resetTransposition
  };
}
```

#### 2.2 Editor Transpose Controls
```typescript
// src/features/arrangements/components/ChordProEditor/TransposeBar.tsx
export function TransposeBar({ 
  editor,
  preview 
}: TransposeBarProps) {
  const {
    previewSemitones,
    isPreviewMode,
    previewTranspose,
    applyTransposition,
    resetTransposition
  } = useEditorTransposition(editor.content, editor.onChange);
  
  return (
    <div className="transpose-bar">
      <div className="transpose-controls">
        <button onClick={() => previewTranspose(-1)}>−</button>
        <span className="transpose-display">
          {previewSemitones > 0 ? `+${previewSemitones}` : previewSemitones}
        </span>
        <button onClick={() => previewTranspose(1)}>+</button>
      </div>
      
      <div className="transpose-actions">
        {isPreviewMode && (
          <>
            <button onClick={applyTransposition}>
              Apply to Content
            </button>
            <button onClick={resetTransposition}>
              Cancel Preview
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

#### 2.3 Live Preview Integration
```typescript
// src/features/arrangements/components/ChordProEditor/PreviewPane.tsx (enhanced)
export function PreviewPane({ 
  content,
  transposeSemitones = 0  // New prop
}: PreviewPaneProps) {
  const transposedContent = useMemo(() => {
    if (transposeSemitones === 0) return content;
    
    try {
      return chordProService.transpose(content, transposeSemitones);
    } catch (error) {
      console.error('Transpose error:', error);
      return content;
    }
  }, [content, transposeSemitones]);
  
  // Rest of preview rendering with transposedContent
}
```

### Phase 3: Advanced Features

#### 3.1 Key Selector Component
```typescript
// src/features/arrangements/components/KeySelector.tsx
const COMMON_KEYS = [
  { value: 'C', label: 'C Major' },
  { value: 'G', label: 'G Major' },
  { value: 'D', label: 'D Major' },
  { value: 'A', label: 'A Major' },
  { value: 'E', label: 'E Major' },
  { value: 'F', label: 'F Major' },
  { value: 'Bb', label: 'B♭ Major' },
  { value: 'Am', label: 'A Minor' },
  { value: 'Em', label: 'E Minor' },
  { value: 'Dm', label: 'D Minor' },
];

export function KeySelector({ 
  currentKey,
  onKeySelect 
}: KeySelectorProps) {
  return (
    <select 
      value={currentKey}
      onChange={(e) => onKeySelect(e.target.value)}
      className="key-selector"
    >
      <optgroup label="Common Keys">
        {COMMON_KEYS.map(key => (
          <option key={key.value} value={key.value}>
            {key.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="All Keys">
        {/* Generate all keys */}
      </optgroup>
    </select>
  );
}
```

#### 3.2 Capo Calculator
```typescript
// src/features/arrangements/utils/capoCalculator.ts
export function calculateCapoPosition(
  originalKey: string,
  targetKey: string
): { capo: number; playIn: string } | null {
  // Calculate optimal capo position
  // Return capo fret and key to play in
}

// Component usage
<CapoSuggestion 
  originalKey={originalKey}
  currentKey={currentKey}
  onApplyCapo={handleCapoApply}
/>
```

### Phase 4: Persistence Layer

#### 4.1 Transposition Preferences
```typescript
// src/features/arrangements/services/transpositionPreferences.ts
interface TranspositionPreferences {
  [arrangementId: string]: {
    semitones: number;
    lastModified: string;
  };
}

export const transpositionPreferences = {
  get(arrangementId: string): number {
    const prefs = localStorage.getItem('transpose-prefs');
    if (!prefs) return 0;
    const parsed = JSON.parse(prefs);
    return parsed[arrangementId]?.semitones || 0;
  },
  
  set(arrangementId: string, semitones: number): void {
    const prefs = JSON.parse(
      localStorage.getItem('transpose-prefs') || '{}'
    );
    prefs[arrangementId] = {
      semitones,
      lastModified: new Date().toISOString()
    };
    localStorage.setItem('transpose-prefs', JSON.stringify(prefs));
  },
  
  clear(arrangementId: string): void {
    // Remove preference
  }
};
```

## Testing Strategy

### Unit Tests
```typescript
// src/features/arrangements/hooks/__tests__/useTransposition.test.ts
describe('useTransposition', () => {
  it('should transpose up correctly', () => {
    const { result } = renderHook(() => useTransposition('C'));
    
    act(() => {
      result.current.transpose(2);
    });
    
    expect(result.current.semitones).toBe(2);
    expect(result.current.currentKey).toBe('D');
  });
  
  it('should respect range limits', () => {
    const { result } = renderHook(() => 
      useTransposition('C', { min: -6, max: 6 })
    );
    
    act(() => {
      result.current.transpose(7);
    });
    
    expect(result.current.semitones).toBe(6);
  });
  
  it('should calculate correct key changes', () => {
    const { result } = renderHook(() => useTransposition('G'));
    
    act(() => {
      result.current.transposeToKey('A');
    });
    
    expect(result.current.semitones).toBe(2);
  });
});
```

### Integration Tests
```typescript
// src/features/arrangements/__tests__/TransposeControls.test.tsx
describe('TransposeControls', () => {
  it('should handle keyboard shortcuts', async () => {
    const onTranspose = vi.fn();
    render(<TransposeControls {...props} />);
    
    await userEvent.keyboard('{Alt>}+{/Alt}');
    expect(onTranspose).toHaveBeenCalledWith(1);
    
    await userEvent.keyboard('{Alt>}-{/Alt}');
    expect(onTranspose).toHaveBeenCalledWith(-1);
  });
  
  it('should show reset button when transposed', () => {
    const { rerender } = render(
      <TransposeControls semitones={0} {...props} />
    );
    
    expect(screen.queryByText('Reset')).not.toBeInTheDocument();
    
    rerender(<TransposeControls semitones={2} {...props} />);
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });
});
```

### E2E Tests
```typescript
// e2e/transpose.spec.ts
test('should transpose in editor and apply', async ({ page }) => {
  await page.goto('/arrangements/edit/123');
  
  // Preview transpose
  await page.click('[data-testid="transpose-up"]');
  await page.click('[data-testid="transpose-up"]');
  
  // Verify preview shows transposed
  await expect(page.locator('.preview-pane')).toContainText('D');
  
  // Apply transposition
  await page.click('[data-testid="apply-transpose"]');
  
  // Verify editor content updated
  await expect(page.locator('.editor-content')).toContainText('[D]');
});
```

## Validation Gates

```bash
# Level 1: Type checking and linting
npm run lint && npm run build

# Level 2: Unit tests
npm run test -- src/features/arrangements/hooks/__tests__/useTransposition.test.ts
npm run test -- src/features/arrangements/components/__tests__/TransposeControls.test.tsx

# Level 3: Integration tests
npm run test -- src/features/arrangements/__tests__/

# Level 4: Build validation
npm run build && npm run preview
# Navigate to arrangement viewer and test transposition
# Navigate to ChordPro editor and test transposition

# Level 5: Coverage check
npm run test:coverage -- src/features/arrangements/

# Level 6: Accessibility audit
# Test with keyboard navigation (Alt+Plus, Alt+Minus, Alt+0)
# Test with screen reader
# Verify ARIA labels and live regions

# Level 7: Mobile testing
# Test on mobile device or responsive mode
# Verify touch targets are at least 44px
# Test stage mode transpose controls

# Level 8: Performance validation
# Transpose a large song (100+ chords)
# Verify no UI lag or freezing
# Check memory usage doesn't spike
```

## Success Metrics

### Functional Requirements
- [ ] Transposition works in arrangement viewer (enhanced)
- [ ] Transposition works in ChordPro editor (new)
- [ ] Keyboard shortcuts functional (Alt+Plus/Minus/0)
- [ ] Visual feedback shows transposition amount
- [ ] Reset to original key works
- [ ] Preferences persist across sessions
- [ ] Stage mode transposition works

### Non-Functional Requirements
- [ ] Transpose operation < 100ms for typical song
- [ ] No memory leaks during repeated transposition
- [ ] Mobile touch targets ≥ 44px
- [ ] All controls keyboard accessible
- [ ] ARIA labels and live regions implemented
- [ ] Works offline (no external dependencies)

### Code Quality
- [ ] 80% test coverage for new code
- [ ] TypeScript strict mode compliance
- [ ] No ESLint errors or warnings
- [ ] Follows vertical slice architecture
- [ ] Uses existing design tokens
- [ ] Documentation comments for public APIs

## Implementation Order

### Sprint 1: Core Enhancements
1. Enhance useTransposition hook with new features
2. Create TransposeControls component with visual improvements
3. Add keyboard shortcuts via useTransposeKeyboard
4. Update ViewerToolbar and ViewerControls integration
5. Write unit tests for hooks and components

### Sprint 2: Editor Integration
1. Create useEditorTransposition hook
2. Build TransposeBar component for editor
3. Integrate with PreviewPane for live preview
4. Add apply/cancel functionality
5. Write integration tests

### Sprint 3: Advanced Features
1. Build KeySelector component
2. Implement capo calculator utility
3. Add transposition preferences service
4. Create CapoSuggestion component
5. Write E2E tests

### Sprint 4: Polish & Documentation
1. Performance optimization (memoization, debouncing)
2. Accessibility audit and fixes
3. Mobile UX improvements
4. User documentation
5. Code cleanup and refactoring

## Risk Mitigation

### Technical Risks
- **ChordSheetJS bugs**: Thoroughly test edge cases, have fallback
- **Performance issues**: Implement debouncing, use memoization
- **State synchronization**: Use single source of truth pattern

### UX Risks
- **Confusing preview vs apply**: Clear visual distinction, user education
- **Accidental transposition**: Confirmation for large changes
- **Lost original key**: Always show original key reference

## Rollback Plan

If issues arise:
1. Feature flag to disable new transposition features
2. Revert to basic ViewerControls implementation
3. Keep ChordSheetJS as-is (proven stable)
4. Document known issues for future iteration

## Post-Implementation

### Monitoring
- Track transpose button usage analytics
- Monitor performance metrics
- Collect user feedback on new features

### Future Enhancements
- Batch transposition for setlists
- Smart key suggestions based on vocal range
- Integration with chord complexity analysis
- Transposition history with undo/redo

## Confidence Score: 9/10

**Strengths:**
- Existing transposition partially implemented
- ChordSheetJS provides robust foundation
- Clear vertical slice boundaries
- Comprehensive research completed
- Well-defined testing strategy

**Considerations:**
- Editor integration requires careful state management
- Mobile UX needs thorough testing
- Performance optimization for large songs

This PRP provides comprehensive context for successful one-pass implementation of enhanced chord transposition across both arrangement viewer and ChordPro editor.