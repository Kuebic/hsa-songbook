import { Request, Response } from 'express'
import { arrangementService } from './arrangement.service'
import { catchAsync } from '../../shared/utils/catchAsync'
import { AuthRequest } from '../../shared/middleware/auth'
import { GetArrangementsQuery } from './arrangement.validation'

/**
 * Get all arrangements with filtering and pagination
 */
export const getArrangements = catchAsync(async (
  req: Request<Record<string, never>, Record<string, never>, Record<string, never>, GetArrangementsQuery>,
  res: Response
) => {
  const filter = {
    ...req.query,
    page: req.query.page || 1,
    limit: req.query.limit || 20
  }

  const result = await arrangementService.findAll(filter)

  res.json({
    success: true,
    ...result
  })
})

/**
 * Get a single arrangement by ID
 */
export const getArrangementById = catchAsync(async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const includeChordData = req.query.includeChordData !== 'false'
  const arrangement = await arrangementService.findById(req.params.id, includeChordData)

  res.json({
    success: true,
    data: arrangement
  })
})

/**
 * Get a single arrangement by slug
 */
export const getArrangementBySlug = catchAsync(async (
  req: Request<{ slug: string }>,
  res: Response
) => {
  const includeChordData = req.query.includeChordData !== 'false'
  const arrangement = await arrangementService.findBySlug(req.params.slug, includeChordData)

  res.json({
    success: true,
    data: arrangement
  })
})

/**
 * Get arrangements by song ID
 */
export const getArrangementsBySong = catchAsync(async (
  req: Request<{ songId: string }>,
  res: Response
) => {
  const arrangements = await arrangementService.findBySongId(req.params.songId)

  res.json({
    success: true,
    data: arrangements
  })
})

/**
 * Create a new arrangement
 */
export const createArrangement = catchAsync(async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.auth!.userId
  const arrangement = await arrangementService.create(req.body, userId)

  res.status(201).json({
    success: true,
    data: arrangement,
    message: 'Arrangement created successfully',
    compressionMetrics: arrangement.compressionMetrics
  })
})

/**
 * Update an arrangement
 */
export const updateArrangement = catchAsync(async (
  req: AuthRequest<{ id: string }>,
  res: Response
) => {
  const userId = req.auth!.userId
  const arrangement = await arrangementService.update(req.params.id, req.body, userId)

  res.json({
    success: true,
    data: arrangement,
    message: 'Arrangement updated successfully',
    compressionMetrics: arrangement.compressionMetrics
  })
})

/**
 * Delete an arrangement
 */
export const deleteArrangement = catchAsync(async (
  req: Request<{ id: string }>,
  res: Response
) => {
  await arrangementService.delete(req.params.id)

  res.status(204).send()
})

/**
 * Rate an arrangement
 */
export const rateArrangement = catchAsync(async (
  req: AuthRequest<{ id: string }, Record<string, never>, { rating: number }>,
  res: Response
) => {
  const { rating } = req.body

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    })
  }

  const arrangement = await arrangementService.updateRating(req.params.id, rating)

  return res.json({
    success: true,
    data: arrangement,
    message: 'Rating submitted successfully'
  })
})