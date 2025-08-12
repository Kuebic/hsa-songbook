/**
 * @file textArea.types.ts
 * @description Type definitions for enhanced ChordPro textarea functionality
 */

// Undo/Redo functionality
export interface UndoRedoState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  timestamp: number;
}

// Auto-completion context
export interface AutoCompleteContext {
  triggerChar: '{' | '[';
  triggerPosition: number;
  filterText: string;
  isVisible: boolean;
  selectedIndex: number;
}

// Directive completion tracking
interface DirectiveCompletion {
  position: number;
  timestamp: number;
  directiveType: 'chord' | 'directive' | 'comment';
}

// Keyboard shortcut definition
interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: string;
  description: string;
}

// Text area theme configuration
interface TextAreaTheme {
  background: string;
  foreground: string;
  caret: string;
  selection: string;
  border: string;
  placeholder: string;
}

// Text area configuration
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

// Text area metrics
interface TextAreaMetrics {
  lineCount: number;
  charCount: number;
  cursorLine: number;
  cursorColumn: number;
  selectionLength: number;
}

// Validation result
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  line?: number;
  column?: number;
}

// Text area events
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

// Text area event data
interface TextAreaEventData {
  type: TextAreaEvent;
  timestamp: number;
  value: string;
  selectionStart: number;
  selectionEnd: number;
  payload?: any;
}

// Enhanced props for ChordProTextArea
interface EnhancedChordProTextAreaProps {
  // Core props
  value: string;
  onChange: (value: string) => void;
  
  // Event handlers
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
  
  // Refs and external state
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  justCompletedDirective?: DirectiveCompletion | null;
  
  // Appearance and behavior
  fontSize?: number;
  theme?: 'light' | 'dark' | 'stage' | TextAreaTheme;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  
  // Enhanced features
  config?: Partial<TextAreaConfig>;
  enableLiveValidation?: boolean;
  enableMetrics?: boolean;
  enableEventTracking?: boolean;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

// Export all types - using export keyword directly on interfaces
export type { UndoRedoState };
export type { AutoCompleteContext };
export type { DirectiveCompletion };
export type { KeyboardShortcut };
export type { TextAreaTheme };
export type { TextAreaConfig };
export type { TextAreaMetrics };
export type { ValidationResult };
export type { TextAreaEvent };
export type { TextAreaEventData };
export type { EnhancedChordProTextAreaProps };
