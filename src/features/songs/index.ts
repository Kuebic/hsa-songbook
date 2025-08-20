// === PAGES ===
export { SongListPage } from './pages/SongListPage'
export { SongDetailPage } from './pages/SongDetailPage'
export { SongManagementExample } from './pages/SongManagementExample'

// === COMPONENTS ===
// Re-export all components from index for clean imports
export {
  // Core song components
  SongCard,
  SongList,
  SongViewer,
  GlobalSongModal,
  InlineEditField,
  
  // Song management components
  SongManagementForm,
  SongManagementModal,
  
  // Arrangement management components
  ArrangementManagementForm,
  ArrangementManagementModal,
  
  // UI components
  AddSongButton,
  SongActions,
  
  // Arrangement components
  ArrangementList,
  ArrangementSwitcher
} from './components'

// === HOOKS ===
// Re-export all hooks from index for clean imports
export {
  // Song data hooks
  useSongs,
  useSong,
  useSongMutations,
  
  // Song management hooks
  useSongManagementModal,
  useInlineEdit,
  
  // Arrangement management hooks
  useArrangementManagementModal,
  
  // Arrangement hooks
  useArrangements,
  useArrangementMutations,
  
  // Mutation hooks
  useCreateSong,
  useUpdateSong,
  useDeleteSong,
  useRateSong
} from './hooks'

// === CONTEXTS ===
export { SongModalContext } from './contexts/SongModalContext'

// === SERVICES ===
export { songService } from './services/songService'
export { arrangementService } from './services/arrangementService'

// === TYPES ===
export type { 
  Song, 
  Arrangement, 
  SongFilter, 
  SongMetadata
} from './types/song.types'

// Validation types
export type { SongFormData } from './validation/schemas/songFormSchema'
export type { ArrangementFormData } from './validation/schemas/arrangementSchema'

// === VALIDATION ===
// Export schemas for external validation
export { songFormSchema } from './validation/schemas/songFormSchema'
export { arrangementSchema } from './validation/schemas/arrangementSchema'

// Export validation constants
export { 
  SONG_SOURCES,
  SOURCE_METADATA,
  MUSICAL_KEYS
} from './validation/constants'

// Export validation utilities
export {
  generateUniqueSlug,
  findSimilarSongs,
  normalizeTheme
} from './validation/utils'