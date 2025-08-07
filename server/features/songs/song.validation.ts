import { z } from 'zod'

const currentYear = new Date().getFullYear()

export const createSongSchema = z.object({
  body: z.object({
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title cannot exceed 200 characters')
      .trim(),
    artist: z.string()
      .max(100, 'Artist name cannot exceed 100 characters')
      .trim()
      .optional(),
    slug: z.string()
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    compositionYear: z.number()
      .min(1000, 'Year must be after 1000')
      .max(currentYear, 'Year cannot be in the future')
      .optional(),
    ccli: z.string()
      .trim()
      .optional(),
    themes: z.array(z.string().trim().toLowerCase())
      .default([]),
    source: z.string()
      .max(200, 'Source cannot exceed 200 characters')
      .trim()
      .optional(),
    notes: z.string()
      .max(2000, 'Notes cannot exceed 2000 characters')
      .optional(),
    isPublic: z.boolean()
      .default(false)
  })
})

export const updateSongSchema = z.object({
  body: z.object({
    title: z.string()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters')
      .trim()
      .optional(),
    artist: z.string()
      .max(100, 'Artist name cannot exceed 100 characters')
      .trim()
      .optional(),
    slug: z.string()
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    compositionYear: z.number()
      .min(1000, 'Year must be after 1000')
      .max(currentYear, 'Year cannot be in the future')
      .optional(),
    ccli: z.string()
      .trim()
      .optional(),
    themes: z.array(z.string().trim().toLowerCase())
      .optional(),
    source: z.string()
      .max(200, 'Source cannot exceed 200 characters')
      .trim()
      .optional(),
    notes: z.string()
      .max(2000, 'Notes cannot exceed 2000 characters')
      .optional(),
    isPublic: z.boolean()
      .optional()
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid song ID')
  })
})

export const getSongByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid song ID')
  })
})

export const getSongBySlugSchema = z.object({
  params: z.object({
    slug: z.string()
  })
})

export const deleteSongSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid song ID')
  })
})

export const getSongsQuerySchema = z.object({
  query: z.object({
    searchQuery: z.string().optional(),
    themes: z.union([
      z.string(),
      z.array(z.string())
    ]).transform(val => Array.isArray(val) ? val : val ? [val] : undefined)
      .optional(),
    isPublic: z.union([
      z.literal('true'),
      z.literal('false'),
      z.boolean()
    ]).transform(val => val === 'true' ? true : val === 'false' ? false : val)
      .optional(),
    createdBy: z.string().optional(),
    page: z.string()
      .optional()
      .transform(val => val ? parseInt(val, 10) : 1)
      .pipe(z.number().positive()),
    limit: z.string()
      .optional()
      .transform(val => val ? parseInt(val, 10) : 20)
      .pipe(z.number().positive().max(100)),
    sortBy: z.enum(['title', 'createdAt', 'views', 'rating'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc'])
      .optional()
      .default('desc')
  })
})

export type CreateSongInput = z.infer<typeof createSongSchema>['body']
export type UpdateSongInput = z.infer<typeof updateSongSchema>['body']
export type GetSongsQuery = z.infer<typeof getSongsQuerySchema>['query']