/**
 * @file textArea.types.ts
 * @description Type definitions for enhanced ChordPro textarea functionality
 */

export interface UndoRedoState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  timestamp: number;
}

export interface AutoCompleteContext {
  triggerChar: '{' | '[';
  triggerPosition: number;
  filterText: string;
  isVisible: boolean;
  selectedIndex: number;
}

export interface DirectiveCompletion {
  position: number;
  timestamp: number;
  directiveType: 'chord' | 'directive' | 'comment';
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: string;
  description: string;
}

export interface TextAreaTheme {
  background: string;
  foreground: string;
  caret: string;
  selection: string;
  border: string;
  placeholder: string;
}

export interface TextAreaConfig {
  tabSize: number;
  enableUndoRedo: boolean;
  maxUndoHistory: number;
  debounceMs: number;
  enableBracketPairs: boolean;
  enableAutoIndent: boolean;
  enableCommentToggle: boolean;
  keyboardShortcuts: KeyboardShortcut[];
}

export interface TextAreaMetrics {
  lineCount: number;
  charCount: number;
  cursorLine: number;
  cursorColumn: number;
  selectionLength: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  line?: number;
  column?: number;
}

export type TextAreaEvent = 
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

export interface TextAreaEventData {
  type: TextAreaEvent;
  timestamp: number;
  value: string;
  selectionStart: number;
  selectionEnd: number;
  payload?: any;
}

export interface EnhancedChordProTextAreaProps {
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
