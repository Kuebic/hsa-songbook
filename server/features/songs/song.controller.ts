import { Request, Response, NextFunction } from 'express'
import { songService } from './song.service'
import { catchAsync } from '../../shared/utils/catchAsync'
import { AuthRequest } from '../../shared/middleware/auth'
import { GetSongsQuery } from './song.validation'

/**
 * Get all songs with filtering and pagination
 */
export const getSongs = catchAsync(async (
  req: Request<{}, {}, {}, GetSongsQuery>,
  res: Response
) => {
  const filter = {
    ...req.query,
    page: req.query.page || 1,
    limit: req.query.limit || 20
  }

  const result = await songService.findAll(filter)

  res.json({
    success: true,
    ...result
  })
})

/**
 * Get a single song by ID
 */
export const getSongById = catchAsync(async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const song = await songService.findById(req.params.id)

  res.json({
    success: true,
    data: song
  })
})

/**
 * Get a single song by slug
 */
export const getSongBySlug = catchAsync(async (
  req: Request<{ slug: string }>,
  res: Response
) => {
  const song = await songService.findBySlug(req.params.slug)

  res.json({
    success: true,
    data: song
  })
})

/**
 * Create a new song
 */
export const createSong = catchAsync(async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.auth!.userId
  const song = await songService.create(req.body, userId)

  res.status(201).json({
    success: true,
    data: song,
    message: 'Song created successfully'
  })
})

/**
 * Update a song
 */
export const updateSong = catchAsync(async (
  req: AuthRequest<{ id: string }>,
  res: Response
) => {
  const userId = req.auth!.userId
  const song = await songService.update(req.params.id, req.body, userId)

  res.json({
    success: true,
    data: song,
    message: 'Song updated successfully'
  })
})

/**
 * Delete a song
 */
export const deleteSong = catchAsync(async (
  req: Request<{ id: string }>,
  res: Response
) => {
  await songService.delete(req.params.id)

  res.status(204).send()
})

/**
 * Rate a song
 */
export const rateSong = catchAsync(async (
  req: AuthRequest<{ id: string }, {}, { rating: number }>,
  res: Response
) => {
  const { rating } = req.body

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    })
  }

  const song = await songService.updateRating(req.params.id, rating)

  res.json({
    success: true,
    data: song,
    message: 'Rating submitted successfully'
  })
})