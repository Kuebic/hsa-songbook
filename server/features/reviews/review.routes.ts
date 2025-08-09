import { Router } from 'express'
import { requireAuth, requireRole } from '../../shared/middleware/auth'
import { validate, validateBody, validateParams } from '../../shared/middleware/validation'
import {
  createReviewSchema,
  updateReviewSchema,
  getReviewsSchema,
  getReviewByIdSchema,
  getUserReviewSchema,
  deleteReviewSchema,
  markHelpfulSchema,
  getReviewStatsSchema,
  getUserReviewsSchema
} from './review.validation'
import { reviewController } from './review.controller'

const router = Router()

// Public routes - anyone can read reviews
router.get(
  '/songs/:songId',
  validate(getReviewsSchema),
  reviewController.getReviews
)

router.get(
  '/songs/:songId/stats',
  validateParams(getReviewStatsSchema.shape.params),
  reviewController.getReviewStats
)

router.get(
  '/:reviewId',
  validateParams(getReviewByIdSchema.shape.params),
  reviewController.getReviewById
)

// Protected routes - require authentication
router.post(
  '/songs/:songId',
  requireAuth,
  validate(createReviewSchema),
  reviewController.createReview
)

router.get(
  '/songs/:songId/user',
  requireAuth,
  validate(getUserReviewSchema),
  reviewController.getUserReview
)

router.patch(
  '/:reviewId',
  requireAuth,
  validate(updateReviewSchema),
  reviewController.updateReview
)

router.delete(
  '/:reviewId',
  requireAuth,
  validateParams(deleteReviewSchema.shape.params),
  reviewController.deleteReview
)

router.post(
  '/:reviewId/helpful',
  validateParams(markHelpfulSchema.shape.params),
  validateBody(markHelpfulSchema.shape.body),
  reviewController.markHelpful
)

// User profile routes
router.get(
  '/users/:userId',
  requireAuth,
  validate(getUserReviewsSchema),
  reviewController.getUserReviews
)

// Admin routes
router.get(
  '/admin/flagged',
  requireAuth,
  requireRole('ADMIN'),
  reviewController.getFlaggedReviews
)

router.delete(
  '/admin/:reviewId',
  requireAuth,
  requireRole('ADMIN'),
  validateParams(deleteReviewSchema.shape.params),
  reviewController.deleteReviewAsAdmin
)

export default router