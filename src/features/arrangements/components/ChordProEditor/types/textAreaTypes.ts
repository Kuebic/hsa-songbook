/**
 * @file textAreaTypes.ts
 * @description Type definitions for enhanced ChordPro textarea functionality
 */

// Use declare to ensure these are seen as type exports
declare namespace TextAreaTypes {
  interface UndoRedoState {
    value: string;
    selectionStart: number;
    selectionEnd: number;
    timestamp: number;
  }

  interface AutoCompleteContext {
    triggerChar: '{' | '[';
    triggerPosition: number;
    filterText: string;
    isVisible: boolean;
    selectedIndex: number;
  }

  interface DirectiveCompletion {
    position: number;
    timestamp: number;
    directiveType: 'chord' | 'directive' | 'comment';
  }

  interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    action: string;
    description: string;
  }

  interface TextAreaTheme {
    background: string;
    foreground: string;
    caret: string;
    selection: string;
    border: string;
    placeholder: string;
  }

  interface TextAreaConfig {
    tabSize: number;
    enableUndoRedo: boolean;
    maxUndoHistory: number;
    debounceMs: number;
    enableBracketPairs: boolean;
    enableAutoIndent: boolean;
    enableCommentToggle: boolean;
    keyboardShortcuts: KeyboardShortcut[];
  }

  interface TextAreaMetrics {
    lineCount: number;
    charCount: number;
    cursorLine: number;
    cursorColumn: number;
    selectionLength: number;
  }

  interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    line?: number;
    column?: number;
  }

  type TextAreaEvent = 
    | 'change'
    | 'selection-change'
    | 'cursor-change'
    | 'scroll'
    | 'autocomplete-show'
    | 'autocomplete-hide'
    | 'directive-completed'
    | 'undo'
    | 'redo'
    | 'bracket-paired'
    | 'comment-toggled';

  interface TextAreaEventData {
    type: TextAreaEvent;
    timestamp: number;
    value: string;
    selectionStart: number;
    selectionEnd: number;
    payload?: any;
  }

  interface EnhancedChordProTextAreaProps {
    value: string;
    onChange: (value: string) => void;
    onCursorChange?: (position: number) => void;
    onSelectionChange?: (range: [number, number]) => void;
    onScroll?: (scrollTop: number, scrollLeft: number) => void;
    onAutoCompleteShow?: (triggerChar: '{' | '[', position: number, filterText: string) => void;
    onAutoCompleteHide?: () => void;
    onAutoCompleteMove?: (direction: 'up' | 'down') => void;
    onAutoCompleteSelect?: () => void;
    onDirectiveCompleted?: () => void;
    onValidationChange?: (result: ValidationResult) => void;
    onMetricsChange?: (metrics: TextAreaMetrics) => void;
    onEvent?: (eventData: TextAreaEventData) => void;
    textareaRef?: React.RefObject<HTMLTextAreaElement>;
    justCompletedDirective?: DirectiveCompletion | null;
    fontSize?: number;
    theme?: 'light' | 'dark' | 'stage' | TextAreaTheme;
    placeholder?: string;
    className?: string;
    readOnly?: boolean;
    autoFocus?: boolean;
    config?: Partial<TextAreaConfig>;
    enableLiveValidation?: boolean;
    enableMetrics?: boolean;
    enableEventTracking?: boolean;
    'aria-label'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;
  }
}

// Export everything from the namespace
export type UndoRedoState = TextAreaTypes.UndoRedoState;
export type AutoCompleteContext = TextAreaTypes.AutoCompleteContext;
export type DirectiveCompletion = TextAreaTypes.DirectiveCompletion;
export type KeyboardShortcut = TextAreaTypes.KeyboardShortcut;
export type TextAreaTheme = TextAreaTypes.TextAreaTheme;
export type TextAreaConfig = TextAreaTypes.TextAreaConfig;
export type TextAreaMetrics = TextAreaTypes.TextAreaMetrics;
export type ValidationResult = TextAreaTypes.ValidationResult;
export type TextAreaEvent = TextAreaTypes.TextAreaEvent;
export type TextAreaEventData = TextAreaTypes.TextAreaEventData;
export type EnhancedChordProTextAreaProps = TextAreaTypes.EnhancedChordProTextAreaProps;
