// Pages
export { ArrangementViewerPage } from './pages/ArrangementViewerPage'

// Components
export { ChordSheetViewer } from './components/ChordSheetViewer'
export { ViewerHeader } from './components/ViewerHeader'
export { ViewerControls } from './components/ViewerControls'
export { ChordEditorEnhanced } from './components/ChordEditorEnhanced'
export { ChordSyntaxHighlight } from './components/ChordSyntaxHighlight'
export { ChordPreviewPane } from './components/ChordPreviewPane'
export { EditorToolbar } from './components/EditorToolbar'

// Hooks
export { useArrangementViewer } from './hooks/useArrangementViewer'
export { useMinimalMode } from './hooks/useMinimalMode'
export { useTransposition } from './hooks/useTransposition'
export { useChordSheetSettings } from './hooks/useChordSheetSettings'
export { useChordEditor } from './hooks/useChordEditor'
export { useEditorLayout } from './hooks/useEditorLayout'
export { useChordProValidation } from './hooks/useChordProValidation'
export { useLocalStorage } from './hooks/useLocalStorage'

// Utils
export {
  chordProLanguage,
  CHORDPRO_PATTERNS,
  COMMON_CHORDS,
  COMMON_DIRECTIVES,
  insertChordAtCursor,
  insertDirectiveAtCursor
} from './utils/chordProHighlighter'

export {
  defineChordProMode,
  configureAceForChordPro,
  chordProTheme
} from './utils/aceChordProMode'

// Types
export type {
  ArrangementViewerData,
  ViewerHeaderProps,
  ViewerControlsProps,
  ChordSheetViewerProps,
  ChordSheetSettings,
  TranspositionResult
} from './types/viewer.types'

export type { ChordEditorEnhancedProps } from './components/ChordEditorEnhanced'
export type { ChordSyntaxHighlightProps, ChordSyntaxHighlightRef } from './components/ChordSyntaxHighlight'
export type { ValidationResult } from './hooks/useChordProValidation'