import { useState, useCallback } from 'react'
import { useAuth } from '@features/auth'
import { reviewService } from '../services/reviewService'
import type { ReviewFormData, Review } from '../types/review.types'

export function useReviewMutations() {
  const { isSignedIn, userId, getToken, getUserName } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createReview = useCallback(async (
    songId: string, 
    reviewData: ReviewFormData,
    arrangementId?: string
  ): Promise<Review> => {
    if (!isSignedIn || !userId) {
      throw new Error('Please sign in to write a review')
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }

      const userName = getUserName()
      const review = await reviewService.createReview(
        songId,
        reviewData,
        token,
        userId,
        userName,
        arrangementId
      )

      return review
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create review'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSignedIn, userId, getToken, getUserName])

  const updateReview = useCallback(async (
    reviewId: string,
    reviewData: ReviewFormData
  ): Promise<Review> => {
    if (!isSignedIn || !userId) {
      throw new Error('Please sign in to update your review')
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }

      const review = await reviewService.updateReview(
        reviewId,
        reviewData,
        token,
        userId
      )

      return review
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update review'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSignedIn, userId, getToken])

  const deleteReview = useCallback(async (reviewId: string): Promise<void> => {
    if (!isSignedIn || !userId) {
      throw new Error('Please sign in to delete your review')
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }

      await reviewService.deleteReview(reviewId, token, userId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete review'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSignedIn, userId, getToken])

  const markHelpful = useCallback(async (
    reviewId: string, 
    helpful: boolean
  ): Promise<Review> => {
    setError(null)

    try {
      const review = await reviewService.markHelpful(reviewId, helpful)
      return review
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark review as helpful'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const rateOnly = useCallback(async (
    songId: string,
    rating: number,
    arrangementId?: string
  ): Promise<Review> => {
    return createReview(songId, { rating }, arrangementId)
  }, [createReview])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    createReview,
    updateReview,
    deleteReview,
    markHelpful,
    rateOnly,
    isSubmitting,
    error,
    clearError,
    isAuthenticated: isSignedIn,
    canReview: isSignedIn && !!userId
  }
}