// Public exports for the songs feature
export { SongListPage } from './pages/SongListPage'
export { SongDetailPage } from './pages/SongDetailPage'
export { SongCard } from './components/SongCard'
export { SongList } from './components/SongList'
export { SongViewer } from './components/SongViewer'

// Arrangement components
export { 
  ArrangementList,
  ArrangementSwitcher
} from './components/arrangements'

// Hooks
export { useSongs, useSong } from './hooks/useSongs'
export { useArrangements } from './hooks/useArrangements'
export { useArrangementMutations } from './hooks/useArrangementMutations'

// Services
export { songService } from './services/songService'
export { arrangementService } from './services/arrangementService'

// Types
export type { 
  Song, 
  Arrangement, 
  SongFilter, 
  SongMetadata
} from './types/song.types'

// Arrangement types
export type { ArrangementFormData } from './validation/schemas/arrangementSchema'