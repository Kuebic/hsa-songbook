import { Router } from 'express'
import { requireAuth, requireRole } from '../../shared/middleware/auth'
import { validate, validateBody, validateParams, validateQuery } from '../../shared/middleware/validation'
import {
  createArrangementSchema,
  updateArrangementSchema,
  getArrangementByIdSchema,
  getArrangementBySlugSchema,
  deleteArrangementSchema,
  getArrangementsBySongSchema,
  getArrangementsQuerySchema
} from './arrangement.validation'
import * as arrangementController from './arrangement.controller'
import { z } from 'zod'

const router = Router()

// Public routes
router.get(
  '/',
  validateQuery(getArrangementsQuerySchema.shape.query),
  arrangementController.getArrangements
)

router.get(
  '/song/:songId',
  validateParams(getArrangementsBySongSchema.shape.params),
  arrangementController.getArrangementsBySong
)

router.get(
  '/slug/:slug',
  validateParams(getArrangementBySlugSchema.shape.params),
  arrangementController.getArrangementBySlug
)

router.get(
  '/:id',
  validateParams(getArrangementByIdSchema.shape.params),
  arrangementController.getArrangementById
)

// Protected routes - require authentication
router.post(
  '/',
  requireAuth,
  validateBody(createArrangementSchema.shape.body),
  arrangementController.createArrangement
)

router.patch(
  '/:id',
  requireAuth,
  validate(updateArrangementSchema),
  arrangementController.updateArrangement
)

router.post(
  '/:id/rate',
  requireAuth,
  validateParams(getArrangementByIdSchema.shape.params),
  validateBody(z.object({ rating: z.number().min(1).max(5) })),
  arrangementController.rateArrangement
)

// Admin routes
router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validateParams(deleteArrangementSchema.shape.params),
  arrangementController.deleteArrangement
)

export default router