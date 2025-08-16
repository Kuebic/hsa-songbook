import type { Arrangement } from '@features/songs/types/song.types'

export interface Setlist {
  // Existing fields
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  createdBy?: string
  
  // New fields
  shareId?: string              // Public sharing ID (nanoid)
  createdByName?: string        // Cached username
  likes: number                 // Like count
  likedBy: string[]            // User IDs
  lastPlayedAt?: Date
  defaultTransitionTime?: number
  allowDuplication: boolean
  
  // Enhanced arrangements
  arrangements: SetlistArrangement[]  // Renamed from 'songs'
}

export interface SetlistArrangement {
  arrangementId: string
  arrangement?: Arrangement    // Populated on fetch
  order: number
  
  // Customization
  keyOverride?: string
  capoOverride?: number
  tempoOverride?: number
  notes?: string
  duration?: number
  
  // Metadata
  addedAt: Date
  addedBy: string
}

export interface PlayableSetlist extends Setlist {
  arrangements: PopulatedSetlistArrangement[]
}

export interface PopulatedSetlistArrangement extends SetlistArrangement {
  arrangement: Arrangement
}

// Additional utility types
export interface SetlistFilters {
  userId?: string
  isPublic?: boolean
  searchQuery?: string
  page?: number
  size?: number
}

export interface CreateSetlistRequest {
  name: string
  description?: string
  arrangements?: SetlistArrangement[]
  isPublic?: boolean
  allowDuplication?: boolean
  defaultTransitionTime?: number
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
}