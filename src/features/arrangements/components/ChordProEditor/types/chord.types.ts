/**
 * @file chord.types.ts
 * @description TypeScript type definitions for chord display functionality
 */

export interface ChordDisplayProps {
  /** ChordPro format content */
  content: string;
  /** Transposition in semitones (-11 to +11) */
  transpose?: number;
  /** Font size in pixels (16-32px) */
  fontSize?: number;
  /** Visual theme for display */
  theme?: ChordDisplayTheme;
  /** Toggle chord visibility */
  showChords?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when transpose level changes */
  onTransposeChange?: (level: number) => void;
}

export type ChordDisplayTheme = 'light' | 'dark' | 'stage';

export interface ChordDisplayStyles {
  container: string;
  title: string;
  subtitle: string;
  verse: string;
  chorus: string;
  bridge: string;
  chord: string;
  lyrics: string;
  line: string;
}

export interface TransposeHookResult {
  /** Current transpose level in semitones */
  transposeLevel: number;
  /** Transpose up by specified semitones */
  transposeUp: (semitones?: number) => void;
  /** Transpose down by specified semitones */
  transposeDown: (semitones?: number) => void;
  /** Set specific transpose level */
  transpose: (level: number) => void;
  /** Reset to original key (0) */
  reset: () => void;
  /** Whether at maximum transpose level */
  isMaxTranspose: boolean;
  /** Whether at minimum transpose level */
  isMinTranspose: boolean;
}

export interface ChordHelperOptions {
  /** Normalize chord notation */
  normalize?: boolean;
  /** Prefer sharp over flat notation */
  preferSharps?: boolean;
}

export interface ParsedChordProContent {
  /** Song title */
  title?: string;
  /** Song subtitle */
  subtitle?: string;
  /** Original key */
  key?: string;
  /** Tempo marking */
  tempo?: string;
  /** Time signature */
  time?: string;
  /** Capo position */
  capo?: number;
  /** Song sections with lyrics and chords */
  sections: ChordProSection[];
}

export interface ChordProSection {
  /** Section type (verse, chorus, bridge, etc.) */
  type: string;
  /** Section label */
  label?: string;
  /** Lines containing chords and lyrics */
  lines: ChordProLine[];
}

export interface ChordProLine {
  /** Chord-lyric pairs in the line */
  items: ChordProItem[];
}

export interface ChordProItem {
  /** Chord symbol (may be empty) */
  chord?: string;
  /** Lyrics text */
  lyrics: string;
}

/** Transpose level constraints */
export const TRANSPOSE_LIMITS = {
  MIN: -11,
  MAX: 11,
  DEFAULT: 0
} as const;

/** Font size constraints in pixels */
export const FONT_SIZE_LIMITS = {
  MIN: 16,
  MAX: 32,
  DEFAULT: 18
} as const;

/** Theme-specific CSS class mappings */
export const THEME_STYLES: Record<ChordDisplayTheme, ChordDisplayStyles> = {
  light: {
    container: 'bg-white text-gray-900 border border-gray-200',
    title: 'text-2xl font-bold text-gray-900 mb-2',
    subtitle: 'text-lg text-gray-700 mb-4',
    verse: 'mb-4',
    chorus: 'mb-4 ml-4 border-l-2 border-blue-400 pl-4',
    bridge: 'mb-4 ml-4 border-l-2 border-green-400 pl-4',
    chord: 'text-blue-600 font-semibold text-sm leading-none hover:bg-blue-100 px-1 rounded transition-colors cursor-pointer',
    lyrics: 'text-gray-900 text-base leading-relaxed',
    line: 'mb-2 whitespace-pre-wrap'
  },
  dark: {
    container: 'bg-gray-900 text-gray-100 border border-gray-700',
    title: 'text-2xl font-bold text-gray-100 mb-2',
    subtitle: 'text-lg text-gray-300 mb-4',
    verse: 'mb-4',
    chorus: 'mb-4 ml-4 border-l-2 border-blue-500 pl-4',
    bridge: 'mb-4 ml-4 border-l-2 border-green-500 pl-4',
    chord: 'text-blue-400 font-semibold text-sm leading-none hover:bg-gray-800 px-1 rounded transition-colors cursor-pointer',
    lyrics: 'text-gray-100 text-base leading-relaxed',
    line: 'mb-2 whitespace-pre-wrap'
  },
  stage: {
    container: 'bg-black text-white border-2 border-yellow-400',
    title: 'text-3xl font-bold text-yellow-400 mb-3',
    subtitle: 'text-xl text-yellow-300 mb-6',
    verse: 'mb-6',
    chorus: 'mb-6 ml-6 border-l-4 border-yellow-400 pl-6',
    bridge: 'mb-6 ml-6 border-l-4 border-green-400 pl-6',
    chord: 'text-yellow-400 font-bold text-lg leading-none hover:bg-yellow-400 hover:text-black px-2 py-1 rounded transition-colors cursor-pointer',
    lyrics: 'text-white text-xl leading-relaxed font-medium',
    line: 'mb-3 whitespace-pre-wrap'
  }
} as const;

// Editor-specific types and interfaces

export interface ChordEditorProps {
  /** ChordPro format content */
  content: string;
  /** Callback when content changes */
  onChange: (content: string) => void;
  /** Callback when validation results change */
  onValidate?: (validation: ValidationResult) => void;
  /** Visual theme for editor */
  theme?: ChordDisplayTheme;
  /** Editor font size in pixels (12-24px) */
  fontSize?: number;
  /** Show preview pane alongside editor */
  showPreview?: boolean;
  /** Enable chord auto-completion */
  autoComplete?: boolean;
  /** Show toolbar with formatting options */
  showToolbar?: boolean;
  /** Editor height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Read-only mode */
  readOnly?: boolean;
  /** Auto-save callback */
  onAutoSave?: (content: string) => void;
  /** Auto-save delay in milliseconds */
  autoSaveDelay?: number;
}

export interface ValidationResult {
  /** Whether the content is valid ChordPro */
  valid: boolean;
  /** Array of validation errors */
  errors: ValidationError[];
  /** Array of validation warnings */
  warnings?: ValidationWarning[];
  /** Parsing performance metrics */
  parseTime?: number;
}

export interface ValidationError {
  /** Line number (1-based) */
  line: number;
  /** Column number (1-based) */
  column?: number;
  /** Error message */
  message: string;
  /** Error type */
  type: 'syntax' | 'directive' | 'chord' | 'structure';
  /** Suggested fix */
  suggestion?: string;
}

export interface ValidationWarning {
  /** Line number (1-based) */
  line: number;
  /** Column number (1-based) */
  column?: number;
  /** Warning message */
  message: string;
  /** Warning type */
  type: 'deprecated' | 'style' | 'performance' | 'accessibility';
  /** Suggested improvement */
  suggestion?: string;
}

export interface EditorToolbarAction {
  /** Unique action identifier */
  id: string;
  /** Display label (optional for separators) */
  label?: string;
  /** Icon component or class */
  icon?: string;
  /** Action type */
  type: 'button' | 'separator' | 'dropdown';
  /** Action to perform (optional for callback-based approach) */
  action?: (editor?: unknown) => void;
  /** Keyboard shortcut display */
  shortcut?: string;
  /** Tooltip text */
  tooltip?: string;
  /** Action payload for custom handling */
  payload?: unknown;
  /** Whether action is currently active */
  active?: boolean;
  /** Whether action is disabled */
  disabled?: boolean;
  /** Action group for visual separation */
  group?: string;
}

export interface EditorCursorPosition {
  /** Line number (0-based) */
  line: number;
  /** Column number (0-based) */
  column: number;
}

export interface EditorSelection {
  /** Start position */
  start: EditorCursorPosition;
  /** End position */
  end: EditorCursorPosition;
  /** Selected text */
  text: string;
}

export interface ChordEditorState {
  /** Current content */
  content: string;
  /** Cursor position */
  cursor: EditorCursorPosition;
  /** Current selection */
  selection?: EditorSelection;
  /** Whether content has unsaved changes */
  isDirty: boolean;
  /** Validation results */
  validation?: ValidationResult;
  /** Editor configuration */
  config: ChordEditorConfig;
}

export interface ChordEditorConfig {
  /** Theme */
  theme: ChordDisplayTheme;
  /** Font size */
  fontSize: number;
  /** Show line numbers */
  showLineNumbers: boolean;
  /** Enable word wrap */
  wordWrap: boolean;
  /** Tab size */
  tabSize: number;
  /** Auto-completion enabled */
  autoComplete: boolean;
  /** Validation enabled */
  validation: boolean;
  /** Auto-save enabled */
  autoSave: boolean;
  /** Auto-save delay */
  autoSaveDelay: number;
}

export interface ChordEditorPreviewProps {
  /** ChordPro content to preview */
  content: string;
  /** Display theme */
  theme?: ChordDisplayTheme;
  /** Validation results for error highlighting */
  validation?: ValidationResult;
  /** Whether to show validation errors inline */
  showValidationErrors?: boolean;
  /** Preview height */
  height?: number;
  /** Whether the preview is loading */
  isLoading?: boolean;
  /** Update delay in milliseconds for performance */
  updateDelay?: number;
  /** Additional CSS classes */
  className?: string;
}

export interface ChordEditorToolbarProps {
  /** Current validation state */
  validation?: ValidationResult;
  /** Whether content has unsaved changes */
  isDirty?: boolean;
  /** Whether undo is available */
  canUndo?: boolean;
  /** Whether redo is available */
  canRedo?: boolean;
  /** Current theme */
  theme?: ChordDisplayTheme;
  /** Whether to show validation status */
  showValidation?: boolean;
  /** Whether save button is enabled (requires onSave handler) */
  showSave?: boolean;
  /** Custom toolbar actions */
  customActions?: EditorToolbarAction[];
  /** Callback for action clicks */
  onAction: (action: string) => void;
  /** Callback for save */
  onSave?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export interface UseChordEditorResult {
  /** Current editor state */
  state: ChordEditorState;
  /** Update content */
  setContent: (content: string) => void;
  /** Update cursor position */
  setCursor: (position: EditorCursorPosition) => void;
  /** Update selection */
  setSelection: (selection: EditorSelection) => void;
  /** Insert text at cursor */
  insertText: (text: string) => void;
  /** Replace selected text */
  replaceSelection: (text: string) => void;
  /** Undo last action */
  undo: () => void;
  /** Redo last action */
  redo: () => void;
  /** Check if can undo */
  canUndo: boolean;
  /** Check if can redo */
  canRedo: boolean;
  /** Format selected text or entire content */
  format: () => void;
  /** Save content */
  save: () => void;
}

export interface UseChordValidationResult {
  /** Current validation result */
  validation: ValidationResult | null;
  /** Validate content */
  validate: (content: string) => ValidationResult;
  /** Whether validation is in progress */
  isValidating: boolean;
  /** Validation error count */
  errorCount: number;
  /** Validation warning count */
  warningCount: number;
}

/** Editor font size constraints in pixels */
export const EDITOR_FONT_SIZE_LIMITS = {
  MIN: 12,
  MAX: 24,
  DEFAULT: 14
} as const;

/** Editor height constraints in pixels */
export const EDITOR_HEIGHT_LIMITS = {
  MIN: 200,
  MAX: 800,
  DEFAULT: 400
} as const;

/** Auto-save delay constraints in milliseconds */
export const AUTO_SAVE_DELAY_LIMITS = {
  MIN: 1000,
  MAX: 30000,
  DEFAULT: 5000
} as const;

/** Validation debounce delay in milliseconds */
export const VALIDATION_DEBOUNCE_DELAY = 300;

/** Common ChordPro directives for auto-completion */
export const CHORDPRO_DIRECTIVES = [
  'title', 'subtitle', 'artist', 'composer', 'lyricist', 'copyright',
  'album', 'year', 'key', 'time', 'tempo', 'duration', 'capo',
  'meta', 'start_of_chorus', 'end_of_chorus', 'soc', 'eoc',
  'start_of_verse', 'end_of_verse', 'sov', 'eov',
  'start_of_bridge', 'end_of_bridge', 'sob', 'eob',
  'comment', 'c', 'highlight', 'new_page', 'new_physical_page',
  'column_break', 'grid', 'no_grid', 'titles', 'columns'
] as const;

/** Common chord symbols for auto-completion */
export const COMMON_CHORDS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
  'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
  'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7',
  'Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7',
  'Csus2', 'Csus4', 'Dsus2', 'Dsus4', 'Esus2', 'Esus4', 'Fsus2', 'Fsus4',
  'Gsus2', 'Gsus4', 'Asus2', 'Asus4', 'Bsus2', 'Bsus4'
] as const;

// Key Detection Types

export interface KeyDetectionResult {
  /** Detected key (e.g., 'C', 'Am', 'F#') */
  key: string;
  /** Confidence level (0-1) */
  confidence: number;
  /** Major or minor mode */
  mode: 'major' | 'minor';
  /** Alternative keys with decent scores */
  alternativeKeys?: Array<{ key: string; confidence: number }>;
  /** Analysis of the chord progression */
  analysis?: {
    diatonicChords: string[];
    nonDiatonicChords: string[];
    keySignature?: { sharps: string[]; flats: string[] };
  };
}