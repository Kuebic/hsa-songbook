import { z } from 'zod'

// Setlist validation schemas
export const setlistNameSchema = z
  .string()
  .trim()
  .min(1, 'Setlist name is required')
  .max(100, 'Setlist name must be less than 100 characters')
  .regex(
    /^[a-zA-Z0-9\s\-_.,!?']+$/,
    'Setlist name contains invalid characters'
  )

export const setlistDescriptionSchema = z
  .string()
  .trim()
  .max(500, 'Description must be less than 500 characters')
  .optional()
  .or(z.literal(''))

export const createSetlistSchema = z.object({
  name: setlistNameSchema,
  description: setlistDescriptionSchema
})

// Search validation schemas
export const searchQuerySchema = z
  .string()
  .trim()
  .min(1, 'Please enter a search term')
  .max(100, 'Search query is too long')
  .regex(
    /^[a-zA-Z0-9\s\-_.,!?'"]+$/,
    'Search query contains invalid characters'
  )

// Song validation schemas
export const songTitleSchema = z
  .string()
  .trim()
  .min(1, 'Song title is required')
  .max(200, 'Song title must be less than 200 characters')

export const songArtistSchema = z
  .string()
  .trim()
  .min(1, 'Artist name is required')
  .max(100, 'Artist name must be less than 100 characters')

export const songLyricsSchema = z
  .string()
  .trim()
  .min(1, 'Lyrics are required')
  .max(10000, 'Lyrics are too long')

export const songNotesSchema = z
  .string()
  .trim()
  .max(500, 'Notes must be less than 500 characters')
  .optional()
  .or(z.literal(''))

// Type exports for TypeScript
export type CreateSetlistInput = z.infer<typeof createSetlistSchema>
export type SearchQueryInput = z.infer<typeof searchQuerySchema>