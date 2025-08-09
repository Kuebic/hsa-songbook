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
  songIds: string[]
  key: string
  tempo?: number
  timeSignature?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  chordData: string
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