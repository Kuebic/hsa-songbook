import { Document, Types } from 'mongoose'

export interface IReview extends Document {
  songId: Types.ObjectId
  arrangementId?: Types.ObjectId
  userId: string // Clerk ID
  userName?: string
  rating: number
  comment?: string
  helpful: number
  notHelpful: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateReviewDto {
  songId: string
  arrangementId?: string
  userId: string
  userName?: string
  rating: number
  comment?: string
}

export interface UpdateReviewDto {
  rating?: number
  comment?: string
}

export interface ReviewFilter {
  songId?: string
  arrangementId?: string
  userId?: string
  rating?: number
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'rating' | 'helpful'
  sortOrder?: 'asc' | 'desc'
}

export interface ReviewResponse {
  id: string
  songId: string
  arrangementId?: string
  userId: string
  userName?: string
  rating: number
  comment?: string
  helpful: number
  notHelpful: number
  createdAt: Date
  updatedAt: Date
}

export interface HelpfulVoteDto {
  helpful: boolean // true for helpful, false for not helpful
}