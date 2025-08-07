import { Document, Types } from 'mongoose'

export interface ISong extends Document {
  title: string
  artist?: string
  slug: string
  compositionYear?: number
  ccli?: string
  themes: string[]
  source?: string
  notes?: string
  defaultArrangementId?: Types.ObjectId
  metadata: {
    createdBy: string
    lastModifiedBy?: string
    isPublic: boolean
    ratings: {
      average: number
      count: number
    }
    views: number
  }
  documentSize: number
  createdAt: Date
  updatedAt: Date
  
  // Methods
  updateRating(rating: number): Promise<void>
}

export interface CreateSongDto {
  title: string
  artist?: string
  slug?: string
  compositionYear?: number
  ccli?: string
  themes?: string[]
  source?: string
  notes?: string
  isPublic?: boolean
}

export interface UpdateSongDto {
  title?: string
  artist?: string
  slug?: string
  compositionYear?: number
  ccli?: string
  themes?: string[]
  source?: string
  notes?: string
  isPublic?: boolean
}

export interface SongFilter {
  searchQuery?: string
  themes?: string[]
  isPublic?: boolean
  createdBy?: string
  page?: number
  limit?: number
  sortBy?: 'title' | 'createdAt' | 'views' | 'rating'
  sortOrder?: 'asc' | 'desc'
}

export interface SongResponse {
  id: string
  title: string
  artist?: string
  slug: string
  compositionYear?: number
  ccli?: string
  themes: string[]
  source?: string
  notes?: string
  defaultArrangementId?: string
  metadata: {
    isPublic: boolean
    ratings: {
      average: number
      count: number
    }
    views: number
  }
  createdAt: Date
  updatedAt: Date
}