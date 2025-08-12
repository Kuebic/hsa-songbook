/**
 * @file editor.types.ts
 * @description Type definitions for the enhanced ChordPro editor
 */

import type { ReactNode, RefObject } from 'react';

// Editor State Types
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

// Validation Types
export interface ValidationError {
  id: string;
  line: number;
  column: number;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  id: string;
  line: number;
  column: number;
  message: string;
  severity: 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: ChordProMetadata;
  parseTime: number;
}

export interface ValidationOptions {
  debounceMs?: number;
  validateOnMount?: boolean;
  validateOnChange?: boolean;
}

// ChordPro Metadata
export interface ChordProMetadata {
  title?: string;
  subtitle?: string;
  artist?: string;
  composer?: string;
  lyricist?: string;
  copyright?: string;
  album?: string;
  year?: string;
  key?: string;
  time?: string;
  tempo?: number;
  duration?: string;
  capo?: number;
  [key: string]: string | number | undefined;
}

// Editor Settings
export interface EditorSettings {
  theme: 'light' | 'dark' | 'stage';
  fontSize: number;
  showLineNumbers: boolean;
  enableAutocomplete: boolean;
  validateSyntax: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  wordWrap: boolean;
  tabSize: number;
}

// Component Props
export interface ChordProEditorProps {
  value?: string;
  initialContent?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  onCancel?: () => void;
  onMetadataChange?: (metadata: ChordProMetadata) => void;
  settings?: Partial<EditorSettings>;
  className?: string;
  height?: string | number;
  showPreview?: boolean;
  showToolbar?: boolean;
  enableChordCompletion?: boolean;
  debounceMs?: number;
  fontSize?: number;
  theme?: 'light' | 'dark' | 'stage';
  transpose?: number;
  showChords?: boolean;
  autoFocus?: boolean;
  defaultPreviewVisible?: boolean;
  readOnly?: boolean;
}

export interface ValidationProps {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  parseTime?: number;
  className?: string;
}

export interface ToolbarProps {
  onAction: (action: ToolbarAction) => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  onSave?: () => void;
  className?: string;
}

export interface SettingsProps {
  settings: EditorSettings;
  onChange: (settings: EditorSettings) => void;
  className?: string;
}

// Toolbar Action Types
export interface ToolbarAction {
  id: string;
  label: string;
  icon: ReactNode;
  shortcut?: string;
  action: (editor: EditorActions) => void;
  isEnabled?: (state: ChordProEditorState) => boolean;
}

// Editor Actions
export interface EditorActions {
  updateContent: (content: string) => void;
  undo: () => void;
  redo: () => void;
  transpose: (semitones: number) => void;
  insertChord: () => void;
  insertDirective: (directive: string) => void;
  save: () => void;
  format: () => void;
  search: () => void;
  replace: (search: string, replace: string) => void;
}

// Editor Operations (extended actions)
export interface EditorOperations extends EditorActions {
  insertAtCursor: (text: string) => void;
  updateContent: (content: string, resetHistory?: boolean) => void;
}

// Hook Options
export interface UseChordProEditorOptions {
  onChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  validateOnChange?: boolean;
  autoSaveEnabled?: boolean;
  autoSaveInterval?: number;
  maxHistorySize?: number;
  initialSettings?: EditorSettings;
}

// Hook Return Types
export interface UseChordProEditorResult {
  state: ChordProEditorState;
  settings: EditorSettings;
  validation: UseChordValidationResult;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  operations: EditorOperations;
  handleEditorChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSelectionChange: () => void;
  handleSettingsChange: (settings: EditorSettings) => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface UseChordValidationResult extends ValidationResult {
  validate: (content: string) => ValidationResult;
}

export interface UseKeyboardShortcutsOptions {
  editorRef: RefObject<HTMLTextAreaElement | null>;
  actions: ShortcutActions;
  enabled?: boolean;
}

export interface ShortcutActions {
  undo: () => void;
  redo: () => void;
  save: () => void;
  insertChord: () => void;
  insertDirective: () => void;
  search: () => void;
  format: () => void;
  transpose: (direction: 1 | -1) => void;
}

// Editor Configuration
export interface ChordProEditorConfig {
  editorRef: RefObject<HTMLTextAreaElement | null>;
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  onMetadataChange?: (metadata: ChordProMetadata) => void;
  settings?: Partial<EditorSettings>;
  validationOptions?: ValidationOptions;
}

// Service Result Types
export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: ChordProError;
}

// Error types are defined as interfaces instead of classes to avoid erasableSyntaxOnly issues
export interface ChordProError {
  name: 'ChordProError';
  message: string;
  cause?: Error;
  line?: number;
  column?: number;
}

export interface TransposeError {
  name: 'TransposeError';
  message: string;
  cause?: Error;
}

// Transposition Types
export interface TranspositionOptions {
  preferSharps?: boolean;
  preferFlats?: boolean;
  detectKey?: boolean;
}

// Auto-save Types
export interface AutoSaveOptions {
  enabled: boolean;
  interval: number;
  onSave: (content: string) => void | Promise<void>;
}

// Editor Reducer Types
export type EditorActionType =
  | { type: 'UPDATE_CONTENT'; payload: string }
  | { type: 'SET_CURSOR'; payload: number }
  | { type: 'SET_SELECTION'; payload: [number, number] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'MARK_SAVED' }
  | { type: 'RESET'; payload?: string };

// ChordSheetJS Types (subset we use)
export interface ParsedSong {
  title: string;
  subtitle?: string;
  artist?: string;
  key?: string;
  tempo?: number;
  lines: ParsedLine[];
  metadata: Record<string, string | number>;
}

export interface ParsedLine {
  type: 'line' | 'chorus' | 'verse' | 'bridge';
  items: ParsedItem[];
}

export interface ParsedItem {
  type: 'chord' | 'lyric' | 'directive' | 'comment';
  value: string;
  position?: number;
}