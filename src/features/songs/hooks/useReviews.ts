import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@features/auth'
import { reviewService } from '../services/reviewService'
import type { 
  Review, 
  ReviewStats, 
  ReviewFilter 
} from '../types/review.types'

export function useReviews(songId: string, initialFilter?: ReviewFilter) {
  const { isSignedIn, userId, getToken } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [currentUserReview, setCurrentUserReview] = useState<Review | null>(null)
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ReviewFilter>(initialFilter || {})
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0
  })
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchReviews = useCallback(async (appendMode = false) => {
    try {
      if (!appendMode) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      // Fetch reviews
      const reviewResponse = await reviewService.getReviews(songId, filter)
      
      if (appendMode) {
        setReviews(prev => [...prev, ...reviewResponse.reviews])
      } else {
        setReviews(reviewResponse.reviews)
      }
      
      setPagination({
        total: reviewResponse.total,
        page: reviewResponse.page,
        pages: reviewResponse.pages
      })

      // Fetch review stats
      const reviewStats = await reviewService.getReviewStats(songId)
      setStats(reviewStats)

      // Fetch current user's review if signed in
      if (isSignedIn && userId) {
        const token = await getToken()
        if (token) {
          try {
            const userReview = await reviewService.getUserReview(
              songId, 
              token, 
              userId,
              filter.arrangementId
            )
            setCurrentUserReview(userReview)
          } catch (_err) {
            // User hasn't reviewed yet, which is fine
            setCurrentUserReview(null)
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reviews'
      setError(errorMessage)
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [songId, filter, isSignedIn, userId, getToken])

  const loadMore = useCallback(async () => {
    if (loadingMore || pagination.page >= pagination.pages) return
    
    const nextFilter = { ...filter, page: pagination.page + 1 }
    setFilter(nextFilter)
    
    try {
      setLoadingMore(true)
      const response = await reviewService.getReviews(songId, nextFilter)
      setReviews(prev => [...prev, ...response.reviews])
      setPagination({
        total: response.total,
        page: response.page,
        pages: response.pages
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more reviews'
      setError(errorMessage)
    } finally {
      setLoadingMore(false)
    }
  }, [songId, filter, pagination, loadingMore])

  const refreshReviews = useCallback(() => {
    setFilter(prev => ({ ...prev, page: 1 }))
    fetchReviews(false)
  }, [fetchReviews])

  const updateFilter = useCallback((newFilter: Partial<ReviewFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter, page: 1 }))
    setReviews([]) // Clear existing reviews when filter changes
  }, [])

  // Load reviews on mount and when filter changes
  useEffect(() => {
    fetchReviews(false)
  }, [fetchReviews])

  const hasMore = pagination.page < pagination.pages

  return {
    reviews,
    currentUserReview,
    stats,
    loading,
    loadingMore,
    error,
    filter,
    pagination,
    hasMore,
    loadMore,
    refreshReviews,
    updateFilter,
    // Helper methods
    getTotalReviews: () => stats?.totalReviews || 0,
    getAverageRating: () => stats?.averageRating || 0,
    hasUserReviewed: () => currentUserReview !== null
  }
}