import { Document, Types } from 'mongoose'

export interface IArrangement extends Document {
  name: string
  songIds: Types.ObjectId[]
  slug: string
  createdBy: Types.ObjectId
  chordData: Buffer  // Compressed ChordPro data
  key?: string
  tempo?: number
  timeSignature?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description?: string
  tags: string[]
  metadata: {
    isMashup: boolean
    mashupSections?: Array<{
      songId: Types.ObjectId
      title: string
    }>
    isPublic: boolean
    ratings?: {
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

export interface CreateArrangementDto {
  name: string
  songIds: string[]
  slug?: string
  chordProText: string  // Uncompressed ChordPro text (will be compressed)
  key?: string
  tempo?: number
  timeSignature?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description?: string
  tags?: string[]
  isPublic?: boolean
  mashupSections?: Array<{
    songId: string
    title: string
  }>
}

export interface UpdateArrangementDto {
  name?: string
  songIds?: string[]
  slug?: string
  chordProText?: string  // Will be compressed if provided
  key?: string
  tempo?: number
  timeSignature?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  description?: string
  tags?: string[]
  isPublic?: boolean
  mashupSections?: Array<{
    songId: string
    title: string
  }>
}

export interface ArrangementFilter {
  songId?: string
  createdBy?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  key?: string
  tags?: string[]
  isPublic?: boolean
  isMashup?: boolean
  page?: number
  limit?: number
  sortBy?: 'name' | 'createdAt' | 'views' | 'rating'
  sortOrder?: 'asc' | 'desc'
}

export interface ArrangementResponse {
  id: string
  name: string
  songIds: string[]
  slug: string
  createdBy: string
  chordData?: string  // Decompressed ChordPro text (only included when fetching single arrangement)
  key?: string
  tempo?: number
  timeSignature?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description?: string
  tags: string[]
  metadata: {
    isMashup: boolean
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
  compressionMetrics?: {
    originalSize: number
    compressedSize: number
    ratio: number
    savings: number
  }
  createdAt: Date
  updatedAt: Date
}