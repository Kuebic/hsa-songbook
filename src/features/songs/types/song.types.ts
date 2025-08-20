export interface Song {
  id: string
  title: string
  artist: string
  slug: string
  compositionYear?: number
  ccli?: string
  themes: string[]
  source?: string
  notes?: string
  defaultArrangementId?: string
  metadata: SongMetadata
  createdAt?: Date | string  // Added for compatibility
  updatedAt?: Date | string  // Added for compatibility
}

export interface SongMetadata {
  createdBy?: string
  lastModifiedBy?: string
  isPublic: boolean
  ratings?: {
    average: number
    count: number
  }
  views: number
}

export interface Arrangement {
  id: string
  name: string
  slug: string
  songIds: string[]
  key: string
  tempo?: number
  timeSignature?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  chordData?: string // Server returns this field name for ChordPro text
  chordProText?: string // Alias for when sending data to server
  description?: string
  notes?: string
  capo?: number
  duration?: number
  createdBy: string
  metadata?: {
    isMashup?: boolean
    mashupSections?: Array<{
      songId: string
      title: string
    }>
    isPublic: boolean
    ratings?: {
      average: number
      count: number
    }
    views: number
  }
  createdAt?: string
  updatedAt?: string
}

export interface SongFilter {
  searchQuery?: string
  key?: string
  tempo?: number
  difficulty?: Arrangement['difficulty']
  tags?: string[]
  themes?: string[]
}

// Re-export review types for convenience
export type { 
  Review,
  ReviewFormData,
  ReviewStats,
  ReviewFilter,
  ReviewResponse
} from './review.types'

// Re-export arrangement types for convenience
export type {
  ArrangementWithTitle,
  CreateArrangementPayload,
  UpdateArrangementPayload,
  ArrangementFormState,
  ArrangementValidationErrors,
  ArrangementManagementFormProps,
  ArrangementManagementModalProps,
  ArrangementSelectorProps,
  ArrangementCardProps,
  ArrangementListProps,
  ArrangementService,
  UseArrangementMutationsProps,
  UseCreateArrangementOptions,
  UseUpdateArrangementOptions,
  UseDeleteArrangementOptions,
  ArrangementRow,
  ArrangementInsert,
  ArrangementUpdate,
  ArrangementMappingUtils,
  ArrangementSearchParams,
  ArrangementSearchResponse,
  ArrangementFilter,
  ArrangementModalState,
  UseArrangementManagementModal,
  ArrangementValidationResult,
  ChordProValidationResult,
  MashupValidationResult,
  ArrangementFieldName,
  ArrangementDifficulty,
  ArrangementSortBy,
  ArrangementLayout,
  ArrangementModalMode
} from './arrangement.types'