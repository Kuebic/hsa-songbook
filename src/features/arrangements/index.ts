// Pages
export { ArrangementViewerPage } from './pages/ArrangementViewerPage'

// Components
export { ChordSheetViewer } from './components/ChordSheetViewer'
export { ViewerHeader } from './components/ViewerHeader'
export { ViewerControls } from './components/ViewerControls'
export { ChordProEditor } from './components/ChordProEditor'
// ChordSyntaxHighlight removed - ace editor dependency
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

// ChordPro Integration Utilities
export {
  generateChordProTemplate,
  generateFullChordProTemplate,
  generateMinimalChordProTemplate,
  mapArrangementToChordProMetadata,
  updateChordProWithArrangementMetadata,
  extractMetadataFromChordPro
} from './utils/chordProTemplateGenerator'

export {
  storeChordProTemplate,
  getChordProTemplate,
  hasChordProTemplate,
  clearChordProTemplate,
  storeTemplateForArrangementCreation,
  storeTemplateForArrangementEdit,
  storeTemplateForSongCreation,
  useChordProSessionData,
  shouldPrefillEditor,
  chordProEditorSessionService
} from './utils/chordProEditorIntegration'

export {
  navigateToChordProEditor,
  navigateToEditArrangement,
  navigateToCreateArrangement,
  navigateToArrangementView,
  navigateToSongView,
  createArrangementWorkflowNavigator,
  safeNavigate,
  isInChordProEditor,
  getArrangementIdFromUrl,
  hasPrefillFlag,
  navigateWithConfirmation
} from './utils/chordProNavigationUtils'

// Services
export { chordProService } from './services/chordProService'
export { 
  chordProWorkflowService,
  useChordProWorkflow,
  ChordProWorkflowImplementations
} from './services/chordProWorkflowService'

// Types
export type {
  ArrangementViewerData,
  ViewerHeaderProps,
  ViewerControlsProps,
  ChordSheetViewerProps,
  ChordSheetSettings,
  TranspositionResult
} from './types/viewer.types'

export type { ChordProEditorProps } from './components/ChordProEditor'
export type { ValidationResult } from './hooks/useChordProValidation'

// ChordPro Integration Types
export type {
  ChordProTemplate,
  TemplateGenerationOptions
} from './utils/chordProTemplateGenerator'

export type {
  EditorSessionData,
  ChordProEditorSessionService
} from './utils/chordProEditorIntegration'

export type {
  NavigationOptions,
  NavigationResult,
  ArrangementWorkflowNavigator
} from './utils/chordProNavigationUtils'

export type {
  ChordProWorkflowService
} from './services/chordProWorkflowService'