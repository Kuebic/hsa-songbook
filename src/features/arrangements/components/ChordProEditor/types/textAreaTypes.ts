export interface AutoCompleteContext {
  triggerChar: '{' | '[';
  triggerPosition: number;
  filterText: string;
  isVisible: boolean;
  selectedIndex: number;
}

export interface UndoRedoState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  timestamp: number;
}

export interface DirectiveCompletion {
  position: number;
  timestamp: number;
  directiveType: 'chord' | 'directive' | 'comment';
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
