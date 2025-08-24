# PRP: Enhanced ChordPro Editor Implementation

## Executive Summary

Complete implementation of a professional-grade ChordPro editor for the HSA Songbook application, upgrading the current basic textarea implementation to match the comprehensive feature set demonstrated in the example implementation. This includes real-time validation, syntax highlighting, toolbar functionality, and advanced editing capabilities while maintaining the existing vertical slice architecture.

**Confidence Score: 9/10** - High confidence due to comprehensive research, existing patterns, and clear implementation path.

## Context & Background

### Current State
- **Existing Implementation**: Basic ChordPro editor in `/src/features/arrangements/components/ChordProEditor/`
- **Issues**: Rendering layer problems, missing validation, no toolbar, limited editing features
- **Example Reference**: Complete implementation available in `/claude_md_file/example/chord-pro-editor/`

### ChordPro Format (v6 Specification)
- **Official Spec**: https://www.chordpro.org/chordpro/chordpro-directives/
- **Syntax**: Chords in brackets `[G]`, directives in braces `{title: Song Name}`
- **Sections**: Environments like `{start_of_chorus}...{end_of_chorus}`
- **Annotations**: Text remarks above lyrics `[*annotation]`

### Required Libraries
```json
{
  "dependencies": {
    "chordsheetjs": "^12.3.0"  // ChordPro parsing and validation
  },
  "devDependencies": {
    "ace-builds": "^1.32.0"     // Optional: Advanced editor (Phase 3)
  }
}
```

## Architecture & Design

### Vertical Slice Integration

The ChordPro editor enhancement follows the established vertical slice pattern within the arrangements feature:

```
src/features/arrangements/
├── components/
│   ├── ChordProEditor/           # Enhanced editor components
│   │   ├── index.tsx             # Main editor component
│   │   ├── ChordProTextArea.tsx  # Core textarea (existing, needs fixes)
│   │   ├── SyntaxHighlighter.tsx # Syntax highlighting (existing, needs fixes)
│   │   ├── PreviewPane.tsx       # Preview (existing, working)
│   │   ├── AutoCompleteDropdown.tsx # Auto-completion (existing)
│   │   ├── ChordEditorToolbar.tsx   # NEW: Toolbar with actions
│   │   ├── ChordEditorValidation.tsx # NEW: Validation display
│   │   ├── ChordEditorSettings.tsx   # NEW: Editor settings
│   │   └── hooks/
│   │       ├── useEditorState.ts     # Existing
│   │       ├── useSyntaxHighlight.ts # Existing
│   │       ├── useAutoComplete.ts    # Existing
│   │       ├── useChordValidation.ts # NEW: ChordSheetJS validation
│   │       ├── useKeyboardShortcuts.ts # NEW: Keyboard shortcuts
│   │       └── useChordTransposition.ts # NEW: Advanced transposition
│   └── ...other arrangement components
├── hooks/
│   ├── useChordProEditor.ts     # NEW: Comprehensive editor hook
│   └── ...existing hooks
├── services/
│   └── chordProService.ts       # NEW: ChordPro processing service
├── types/
│   ├── editor.types.ts          # NEW: Editor-specific types
│   └── ...existing types
├── utils/
│   ├── chordProParser.ts        # NEW: Parsing utilities
│   └── ...existing utils
└── test-utils/
    ├── chordProFactory.ts       # NEW: Test data factories
    └── ...existing test utils
```

### Feature Boundaries

**Internal to Arrangements Feature:**
- All ChordPro editing functionality
- Validation and error handling
- Syntax highlighting and formatting
- Editor state management

**Dependencies on Other Features:**
- `@features/songs`: Song and Arrangement types (type-only imports)
- `@features/auth`: User permissions for editing
- `@features/monitoring`: Error reporting service
- `@shared/components`: Form system for settings, Modal for dialogs

## Implementation Blueprint

### Phase 1: Core Functionality & Validation (Priority 1)

#### Task 1.1: Fix Current Rendering Issues
```typescript
// Fix in ChordProEditor/index.tsx
// Issue: Layers not stacking properly
// Solution: Ensure proper positioning context

<div className="relative overflow-hidden" style={{ position: 'relative' }}>
  <div className="absolute inset-0 bg-white" /> {/* Background */}
  <SyntaxHighlighter 
    className="absolute inset-0 pointer-events-none"
    style={{ position: 'absolute', inset: 0 }}
  />
  <ChordProTextArea 
    className="absolute inset-0 z-10 bg-transparent text-transparent"
  />
  <StatusBar className="absolute bottom-0 z-20" />
</div>
```

#### Task 1.2: Implement ChordPro Validation Hook
```typescript
// hooks/useChordValidation.ts
import { ChordProParser } from 'chordsheetjs';
import { useMemo, useCallback } from 'react';
import { debounce } from '@shared/utils';

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: ChordProMetadata;
  parseTime: number;
}

export function useChordValidation(content: string, options?: ValidationOptions) {
  const parser = useMemo(() => new ChordProParser(), []);
  
  const validate = useCallback(
    debounce((text: string): ValidationResult => {
      const startTime = performance.now();
      
      try {
        const song = parser.parse(text);
        const metadata = extractMetadata(song);
        const warnings = detectWarnings(song);
        
        return {
          isValid: true,
          errors: [],
          warnings,
          metadata,
          parseTime: performance.now() - startTime
        };
      } catch (error) {
        return {
          isValid: false,
          errors: parseErrors(error),
          warnings: [],
          metadata: {},
          parseTime: performance.now() - startTime
        };
      }
    }, options?.debounceMs ?? 300),
    [parser, options]
  );
  
  return useMemo(() => validate(content), [content, validate]);
}
```

#### Task 1.3: Create Validation Display Component
```typescript
// components/ChordProEditor/ChordEditorValidation.tsx
export const ChordEditorValidation: React.FC<ValidationProps> = ({ 
  errors, 
  warnings,
  parseTime 
}) => {
  if (!errors.length && !warnings.length) {
    return (
      <div className="text-green-600 text-sm">
        ✓ Valid ChordPro ({parseTime.toFixed(1)}ms)
      </div>
    );
  }
  
  return (
    <div className="space-y-2" role="alert" aria-live="polite">
      {errors.map(error => (
        <div key={error.id} className="text-red-600 text-sm">
          Line {error.line}: {error.message}
        </div>
      ))}
      {warnings.map(warning => (
        <div key={warning.id} className="text-yellow-600 text-sm">
          ⚠ {warning.message}
        </div>
      ))}
    </div>
  );
};
```

### Phase 2: Toolbar & Formatting (Priority 2)

#### Task 2.1: Implement Toolbar Component
```typescript
// components/ChordProEditor/ChordEditorToolbar.tsx
interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: (editor: EditorState) => void;
}

export const ChordEditorToolbar: React.FC<ToolbarProps> = ({ 
  onAction,
  canUndo,
  canRedo,
  isDirty 
}) => {
  const actions: ToolbarAction[] = [
    {
      id: 'undo',
      label: 'Undo',
      icon: <UndoIcon />,
      shortcut: 'Ctrl+Z',
      action: (editor) => editor.undo()
    },
    {
      id: 'redo', 
      label: 'Redo',
      icon: <RedoIcon />,
      shortcut: 'Ctrl+Y',
      action: (editor) => editor.redo()
    },
    {
      id: 'transpose-up',
      label: 'Transpose Up',
      icon: <ArrowUpIcon />,
      action: (editor) => editor.transpose(1)
    },
    {
      id: 'insert-chord',
      label: 'Insert Chord',
      icon: <MusicNoteIcon />,
      shortcut: 'Ctrl+K',
      action: (editor) => editor.insertChord()
    }
  ];
  
  return (
    <div className="flex items-center gap-2 p-2 border-b">
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => onAction(action)}
          disabled={!isActionEnabled(action.id)}
          title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
          className="p-2 hover:bg-gray-100 rounded"
        >
          {action.icon}
        </button>
      ))}
      {isDirty && <span className="ml-auto text-sm text-gray-500">Unsaved changes</span>}
    </div>
  );
};
```

#### Task 2.2: Add Keyboard Shortcuts Hook
```typescript
// hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts(
  editorRef: RefObject<HTMLTextAreaElement>,
  actions: ShortcutActions
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        actions.undo();
      } else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        actions.redo();
      } else if (ctrl && e.key === 's') {
        e.preventDefault();
        actions.save();
      } else if (ctrl && e.key === 'k') {
        e.preventDefault();
        actions.insertChord();
      } else if (ctrl && e.key === 'f') {
        e.preventDefault();
        actions.search();
      }
    };
    
    const editor = editorRef.current;
    editor?.addEventListener('keydown', handleKeyDown);
    
    return () => {
      editor?.removeEventListener('keydown', handleKeyDown);
    };
  }, [editorRef, actions]);
}
```

### Phase 3: Advanced Features (Priority 3)

#### Task 3.1: Editor Settings Component
```typescript
// components/ChordProEditor/ChordEditorSettings.tsx
export const ChordEditorSettings: React.FC<SettingsProps> = ({ 
  settings,
  onChange 
}) => {
  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Theme</label>
        <select 
          value={settings.theme}
          onChange={(e) => onChange({ ...settings, theme: e.target.value })}
          className="w-full p-2 border rounded"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="stage">Stage</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Font Size</label>
        <input
          type="range"
          min="12"
          max="24"
          value={settings.fontSize}
          onChange={(e) => onChange({ ...settings, fontSize: Number(e.target.value) })}
          className="w-full"
        />
        <span className="text-sm text-gray-600">{settings.fontSize}px</span>
      </div>
      
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.showLineNumbers}
            onChange={(e) => onChange({ ...settings, showLineNumbers: e.target.checked })}
            className="mr-2"
          />
          Show line numbers
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={(e) => onChange({ ...settings, autoSave: e.target.checked })}
            className="mr-2"
          />
          Auto-save (every 30s)
        </label>
      </div>
    </div>
  );
};
```

#### Task 3.2: Comprehensive Editor Hook
```typescript
// hooks/useChordProEditor.ts
export function useChordProEditor(config: ChordProEditorConfig) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const validation = useChordValidation(state.content);
  const shortcuts = useKeyboardShortcuts(config.editorRef, actions);
  const autoSave = useAutoSave(state.content, config.onSave);
  
  const actions = useMemo(() => ({
    updateContent: (content: string) => {
      dispatch({ type: 'UPDATE_CONTENT', payload: content });
    },
    undo: () => dispatch({ type: 'UNDO' }),
    redo: () => dispatch({ type: 'REDO' }),
    transpose: (semitones: number) => {
      const transposed = transposeChordPro(state.content, semitones);
      dispatch({ type: 'UPDATE_CONTENT', payload: transposed });
    },
    insertChord: () => {
      const position = config.editorRef.current?.selectionStart ?? 0;
      const newContent = insertAtPosition(state.content, position, '[]');
      dispatch({ type: 'UPDATE_CONTENT', payload: newContent });
    },
    save: () => {
      config.onSave?.(state.content);
      dispatch({ type: 'MARK_SAVED' });
    }
  }), [state.content, config]);
  
  return {
    ...state,
    validation,
    actions,
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0
  };
}
```

## Testing Strategy

### Test Coverage Requirements
- **Components**: 90% line coverage
- **Hooks**: 95% function coverage
- **Utils**: 100% statement coverage
- **Integration**: Full user workflow coverage

### Critical Test Scenarios

```typescript
// ChordProEditor.test.tsx
describe('ChordProEditor Enhanced', () => {
  // Use existing test utilities
  const { arrangementFactory } = await import('@features/songs/test-utils/factories');
  
  describe('Validation', () => {
    it('validates ChordPro syntax in real-time', async () => {
      const { user } = renderAsUser(
        <ChordProEditor value="" onChange={vi.fn()} />
      );
      
      await user.type(screen.getByRole('textbox'), '{title Missing Colon}');
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/malformed directive/i);
      });
    });
    
    it('shows parse time for performance monitoring', () => {
      render(<ChordProEditor value="{title: Test}" onChange={vi.fn()} />);
      
      expect(screen.getByText(/Valid ChordPro.*ms/)).toBeInTheDocument();
    });
  });
  
  describe('Toolbar Actions', () => {
    it('supports undo/redo operations', async () => {
      const { user } = renderAsUser(
        <ChordProEditor value="Initial" onChange={vi.fn()} />
      );
      
      await user.type(screen.getByRole('textbox'), ' Edit');
      await user.click(screen.getByRole('button', { name: /undo/i }));
      
      expect(screen.getByRole('textbox')).toHaveValue('Initial');
    });
    
    it('transposes chords correctly', async () => {
      const { user } = renderAsUser(
        <ChordProEditor value="[G]Test [C]Song" onChange={vi.fn()} />
      );
      
      await user.click(screen.getByRole('button', { name: /transpose up/i }));
      
      expect(screen.getByRole('textbox')).toHaveValue('[G#]Test [C#]Song');
    });
  });
  
  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      const { container } = render(
        <ChordProEditor value="" onChange={vi.fn()} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    
    it('supports keyboard navigation', async () => {
      const { user } = renderAsUser(
        <ChordProEditor value="" onChange={vi.fn()} />
      );
      
      await user.keyboard('{Tab}{Tab}{Enter}'); // Navigate toolbar
      expect(screen.getByRole('button', { name: /undo/i })).toHaveFocus();
    });
  });
  
  describe('Performance', () => {
    it('handles large documents efficiently', () => {
      const largeContent = generateLargeChordPro(10000); // 10k lines
      
      const startTime = performance.now();
      render(<ChordProEditor value={largeContent} onChange={vi.fn()} />);
      const renderTime = performance.now() - startTime;
      
      expect(renderTime).toBeLessThan(1000); // Under 1 second
    });
  });
});
```

## Type Definitions

```typescript
// types/editor.types.ts
export interface ChordProEditorState {
  content: string;
  cursorPosition: number;
  selectionRange: [number, number];
  isDirty: boolean;
  history: {
    past: string[];
    future: string[];
  };
}

export interface ValidationError {
  id: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ChordProMetadata {
  title?: string;
  artist?: string;
  key?: string;
  tempo?: number;
  capo?: number;
  [key: string]: any;
}

export interface EditorSettings {
  theme: 'light' | 'dark' | 'stage';
  fontSize: number;
  showLineNumbers: boolean;
  enableAutocomplete: boolean;
  validateSyntax: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
}

export interface ChordProEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => void;
  onMetadataChange?: (metadata: ChordProMetadata) => void;
  settings?: Partial<EditorSettings>;
  className?: string;
  height?: string | number;
}
```

## Error Handling

```typescript
// services/chordProService.ts
export class ChordProService {
  private parser: ChordProParser;
  
  constructor() {
    this.parser = new ChordProParser();
  }
  
  parse(content: string): Result<ParsedSong, ChordProError> {
    try {
      const song = this.parser.parse(content);
      return { success: true, data: song };
    } catch (error) {
      errorReportingService.reportError(error, {
        context: 'ChordPro parsing',
        content: content.substring(0, 100) // First 100 chars for context
      });
      
      return {
        success: false,
        error: new ChordProError(
          'Failed to parse ChordPro content',
          error instanceof Error ? error : new Error(String(error))
        )
      };
    }
  }
  
  transpose(content: string, semitones: number): Result<string, TransposeError> {
    try {
      const song = this.parser.parse(content);
      const transposed = song.transpose(semitones);
      return { success: true, data: formatChordPro(transposed) };
    } catch (error) {
      return {
        success: false,
        error: new TransposeError(`Failed to transpose by ${semitones} semitones`)
      };
    }
  }
}
```

## Performance Optimizations

```typescript
// Memoization for expensive operations
const memoizedValidation = useMemo(
  () => validateChordPro(content),
  [content]
);

// Debounced validation
const debouncedValidate = useMemo(
  () => debounce(validate, 300),
  [validate]
);

// Virtual scrolling for large documents
const VirtualizedEditor = lazy(() => import('./VirtualizedEditor'));

// Web Worker for parsing (optional)
const parseWorker = new Worker('/workers/chordpro-parser.js');
```

## Migration Path

### Step 1: Install Dependencies
```bash
npm install chordsheetjs
```

### Step 2: Fix Current Implementation
1. Apply positioning fixes to resolve rendering issues
2. Ensure proper z-index stacking
3. Test with existing arrangements

### Step 3: Add Validation
1. Implement useChordValidation hook
2. Create validation display component
3. Integrate with existing editor

### Step 4: Add Toolbar
1. Create toolbar component
2. Implement actions (undo, redo, transpose)
3. Add keyboard shortcuts

### Step 5: Enhance Features
1. Add settings panel
2. Implement auto-save
3. Consider Ace editor upgrade

## Validation Gates

```bash
# 1. Type checking (must pass)
npm run type-check

# 2. Linting (must pass)
npm run lint

# 3. Unit tests with coverage (must pass with >80% coverage)
npm run test -- src/features/arrangements/components/ChordProEditor

# 4. Integration tests (must pass)
npm run test:integration -- ChordProEditor

# 5. Accessibility tests (no violations)
npm run test:a11y -- ChordProEditor

# 6. Performance tests (must meet thresholds)
npm run test:performance -- ChordProEditor

# 7. Build validation (must succeed)
npm run build

# 8. Bundle size check (should not increase by >50KB)
npm run analyze

# 9. Manual testing checklist
- [ ] Editor renders correctly in all themes
- [ ] Validation works for invalid ChordPro
- [ ] Toolbar actions function properly
- [ ] Keyboard shortcuts work
- [ ] Large documents load quickly
- [ ] Auto-save functions (if enabled)
- [ ] Mobile responsive design works
```

## Documentation References

### External Resources
- **ChordPro Specification**: https://www.chordpro.org/chordpro/chordpro-directives/
- **ChordSheetJS**: https://github.com/martijnversluis/ChordSheetJS
- **Ace Editor**: https://ace.c9.io/
- **React Ace**: https://github.com/securingsincity/react-ace

### Internal References
- **Example Implementation**: `/claude_md_file/example/chord-pro-editor/`
- **Current Implementation**: `/src/features/arrangements/components/ChordProEditor/`
- **Arrangement Types**: `/src/features/songs/types/song.types.ts`
- **Test Utilities**: `/src/features/songs/test-utils/`

## Success Metrics

- ✅ All validation gates pass
- ✅ 90%+ test coverage
- ✅ Zero accessibility violations
- ✅ <1s render time for 10k line documents
- ✅ <300ms validation response time
- ✅ Bundle size increase <50KB
- ✅ Works on mobile devices
- ✅ Supports all major browsers

## Risk Mitigation

- **Risk**: ChordSheetJS parsing incompatibilities
  - **Mitigation**: Extensive testing with real ChordPro files, fallback to basic parsing

- **Risk**: Performance issues with large files
  - **Mitigation**: Virtual scrolling, web workers, debouncing

- **Risk**: Breaking existing functionality
  - **Mitigation**: Incremental implementation, comprehensive tests

## Implementation Timeline

- **Phase 1** (2 days): Core functionality and validation
- **Phase 2** (2 days): Toolbar and formatting features
- **Phase 3** (2 days): Advanced features and optimization
- **Testing & Documentation** (1 day): Comprehensive testing and docs

Total estimated time: 7 days

---

**Confidence Score: 9/10**

This PRP provides comprehensive context and detailed implementation guidance for one-pass successful implementation of the enhanced ChordPro editor. The high confidence score is based on:
- Thorough research of existing patterns
- Clear implementation path with phases
- Comprehensive test coverage plan
- Detailed type definitions and error handling
- Proven libraries and patterns
- Existing example implementation as reference