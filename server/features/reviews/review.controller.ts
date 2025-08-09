import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../shared/middleware/auth'
import { reviewService } from './review.service'
import { CreateReviewDto, UpdateReviewDto, HelpfulVoteDto } from './review.types'
import { AppError } from '../../shared/utils/errors'
import { catchAsync } from '../../shared/utils/catchAsync'

export const reviewController = {
  // Create a new review
  createReview: catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { songId } = req.params
    const { rating, comment, arrangementId } = req.body
    
    if (!req.auth?.userId) {
      throw new AppError('Authentication required', 401)
    }

    const userName = req.headers['x-user-name'] as string || undefined
    
    const createData: CreateReviewDto = {
      songId,
      arrangementId,
      userId: req.auth.userId,
      userName,
      rating: Number(rating),
      comment
    }
    
    const review = await reviewService.createReview(createData)
    
    res.status(201).json({
      success: true,
      data: review
    })
  }),
  
  // Get reviews for a song
  getReviews: catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { songId } = req.params
    const { 
      arrangementId,
      page = '1', 
      limit = '10', 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      rating
    } = req.query
    
    const result = await reviewService.getReviews({
      songId,
      arrangementId: arrangementId as string,
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as 'createdAt' | 'rating' | 'helpful',
      sortOrder: sortOrder as 'asc' | 'desc',
      rating: rating ? Number(rating) : undefined
    })
    
    res.json({
      success: true,
      data: result.reviews,
      meta: {
        total: result.total,
        page: result.page,
        pages: result.pages,
        limit: Number(limit)
      }
    })
  }),

  // Get a specific review
  getReviewById: catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { reviewId } = req.params
    
    const review = await reviewService.getReviewById(reviewId)
    
    res.json({
      success: true,
      data: review
    })
  }),

  // Get current user's review for a song
  getUserReview: catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { songId } = req.params
    const { arrangementId } = req.query
    
    if (!req.auth?.userId) {
      throw new AppError('Authentication required', 401)
    }
    
    const review = await reviewService.getUserReview(
      songId, 
      req.auth.userId,
      arrangementId as string
    )
    
    res.json({
      success: true,
      data: review
    })
  }),
  
  // Update a review
  updateReview: catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { reviewId } = req.params
    const { rating, comment } = req.body
    
    if (!req.auth?.userId) {
      throw new AppError('Authentication required', 401)
    }
    
    const updateData: UpdateReviewDto = {
      rating: rating !== undefined ? Number(rating) : undefined,
      comment
    }
    
    const review = await reviewService.updateReview(reviewId, req.auth.userId, updateData)
    
    res.json({
      success: true,
      data: review
    })
  }),
  
  // Delete a review
  deleteReview: catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { reviewId } = req.params
    
    if (!req.auth?.userId) {
      throw new AppError('Authentication required', 401)
    }
    
    await reviewService.deleteReview(reviewId, req.auth.userId)
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    })
  }),
  
  // Mark a review as helpful or not helpful
  markHelpful: catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { reviewId } = req.params
    const { helpful }: HelpfulVoteDto = req.body
    
    const review = await reviewService.markHelpful(reviewId, helpful)
    
    res.json({
      success: true,
      data: review
    })
  }),

  // Get review statistics for a song
  getReviewStats: catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { songId } = req.params
    
    const stats = await reviewService.getReviewStats(songId)
    
    res.json({
      success: true,
      data: stats
    })
  }),

  // Get user's reviews (all reviews by a user)
  getUserReviews: catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { userId } = req.params
    const { 
      page = '1', 
      limit = '10', 
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query
    
    // Users can only view their own reviews unless they're admin
    const userRole = req.headers['x-user-role'] as string
    if (req.auth?.userId !== userId && userRole !== 'ADMIN') {
      throw new AppError('You can only view your own reviews', 403)
    }
    
    const result = await reviewService.getReviews({
      userId,
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as 'createdAt' | 'rating' | 'helpful',
      sortOrder: sortOrder as 'asc' | 'desc'
    })
    
    res.json({
      success: true,
      data: result.reviews,
      meta: {
        total: result.total,
        page: result.page,
        pages: result.pages,
        limit: Number(limit)
      }
    })
  }),

  // Admin: Get flagged reviews
  getFlaggedReviews: catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userRole = req.headers['x-user-role'] as string
    if (userRole !== 'ADMIN') {
      throw new AppError('Admin access required', 403)
    }
    
    const flaggedReviews = await reviewService.getFlaggedReviews()
    
    res.json({
      success: true,
      data: flaggedReviews
    })
  }),

  // Admin: Delete any review
  deleteReviewAsAdmin: catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { reviewId } = req.params
    
    const userRole = req.headers['x-user-role'] as string
    if (userRole !== 'ADMIN') {
      throw new AppError('Admin access required', 403)
    }
    
    await reviewService.deleteReviewAsAdmin(reviewId)
    
    res.json({
      success: true,
      message: 'Review deleted by admin'
    })
  })
}