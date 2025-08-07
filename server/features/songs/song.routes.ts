import { Router } from 'express'
import { requireAuth, requireRole } from '../../shared/middleware/auth'
import { validate, validateBody, validateParams, validateQuery } from '../../shared/middleware/validation'
import {
  createSongSchema,
  updateSongSchema,
  getSongByIdSchema,
  getSongBySlugSchema,
  deleteSongSchema,
  getSongsQuerySchema
} from './song.validation'
import * as songController from './song.controller'

const router = Router()

// Public routes
router.get(
  '/',
  validateQuery(getSongsQuerySchema.shape.query),
  songController.getSongs
)

router.get(
  '/slug/:slug',
  validateParams(getSongBySlugSchema.shape.params),
  songController.getSongBySlug
)

router.get(
  '/:id',
  validateParams(getSongByIdSchema.shape.params),
  songController.getSongById
)

// Protected routes - require authentication
router.post(
  '/',
  requireAuth,
  validateBody(createSongSchema.shape.body),
  songController.createSong
)

router.patch(
  '/:id',
  requireAuth,
  validate(updateSongSchema),
  songController.updateSong
)

router.post(
  '/:id/rate',
  requireAuth,
  validateParams(getSongByIdSchema.shape.params),
  validateBody(require('zod').z.object({ rating: require('zod').z.number().min(1).max(5) })),
  songController.rateSong
)

// Admin routes
router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validateParams(deleteSongSchema.shape.params),
  songController.deleteSong
)

export default router