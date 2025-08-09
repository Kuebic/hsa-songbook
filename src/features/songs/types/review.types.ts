export interface Review {
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

export interface ReviewFormData {
  rating: number
  comment?: string
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingBreakdown: Record<string, number>
}

export interface CreateReviewRequest {
  songId: string
  arrangementId?: string
  rating: number
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
  reviews: Review[]
  total: number
  page: number
  pages: number
}