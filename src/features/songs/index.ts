// Public exports for the songs feature
export { SongListPage } from './pages/SongListPage'
export { SongDetailPage } from './pages/SongDetailPage'
export { SongCard } from './components/SongCard'
export { SongList } from './components/SongList'
export { SongViewer } from './components/SongViewer'

// Rating and review components
export { RatingWidget, ReviewForm, ReviewList } from './components/ratings'

// Arrangement components
export { 
  ArrangementForm, 
  ArrangementList, 
  ChordEditor,
  ArrangementSheet,
  AddArrangementButton,
  ArrangementSwitcher
} from './components/arrangements'

// Admin components
export { AdminDashboard, DuplicateManager, BulkOperations, ThemeManager } from './components/admin'

// Hooks
export { useSongs, useSong } from './hooks/useSongs'
export { useReviews } from './hooks/useReviews'
export { useReviewMutations } from './hooks/useReviewMutations'
export { useArrangements } from './hooks/useArrangements'
export { useArrangementMutations } from './hooks/useArrangementMutations'

// Services
export { songService } from './services/songService'
export { reviewService } from './services/reviewService'
export { arrangementService } from './services/arrangementService'

// Types
export type { 
  Song, 
  Arrangement, 
  SongFilter, 
  SongMetadata,
  Review,
  ReviewFormData,
  ReviewStats,
  ReviewFilter,
  ReviewResponse
} from './types/song.types'

// Arrangement types
export type { ArrangementFormData } from './validation/schemas/arrangementSchema'