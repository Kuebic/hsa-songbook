import { z } from 'zod'
import { SONG_SOURCES } from '../constants/sources'
import { arrangementSchema } from './arrangementSchema'
import { normalizeThemes } from '../utils/themeNormalization'

// CCLI validation regex (numeric, 5-7 digits)
const ccliRegex = /^\d{5,7}$/

// Get current year for validation
const currentYear = new Date().getFullYear()

/**
 * Song form validation schema
 */
export const songFormSchema = z.object({
  // Basic Information
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .refine(
      (val) => val.length > 0,
      { message: 'Title cannot be only whitespace' }
    ),
  
  artist: z.string()
    .max(100, 'Artist name must be less than 100 characters')
    .trim()
    .optional()
    .transform(val => val && val.length > 0 ? val : undefined), // Convert empty string to undefined
  
  compositionYear: z.number()
    .min(1000, 'Year must be after 1000')
    .max(currentYear, `Year cannot be in the future`)
    .int('Year must be a whole number')
    .optional()
    .nullable()
    .transform(val => val || undefined),
  
  ccli: z.string()
    .regex(ccliRegex, 'CCLI must be 5-7 digits')
    .optional()
    .or(z.literal(''))
    .transform(val => val && val.length > 0 ? val : undefined),
  
  // Categorization
  source: z.enum(SONG_SOURCES as readonly [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a valid source' })
  }).optional(),
  
  themes: z.array(
    z.string()
      .min(1, 'Theme cannot be empty')
      .max(50, 'Theme must be less than 50 characters')
  )
    .min(1, 'At least one theme is required')
    .max(10, 'Maximum 10 themes allowed')
    .transform(themes => {
      // Normalize themes during validation
      return normalizeThemes(themes)
    }),
  
  // Additional Information
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .transform(val => val && val.length > 0 ? val : undefined),
  
  // Metadata
  isPublic: z.boolean().default(false),
  
  // Optional arrangement (for creating song with initial arrangement)
  arrangement: arrangementSchema.optional(),
  
  // Slug (auto-generated if not provided)
  slug: z.string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
    .optional()
})

export type SongFormData = z.infer<typeof songFormSchema>

/**
 * Update form schema (for editing existing songs)
 * Uses a base schema without defaults to prevent unintended field population
 */
const updateBaseSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .refine(
      (val) => val.length > 0,
      { message: 'Title cannot be only whitespace' }
    ),
  artist: z.string()
    .max(100, 'Artist name must be less than 100 characters')
    .trim()
    .optional()
    .transform(val => val && val.length > 0 ? val : undefined),
  compositionYear: z.number()
    .min(1000, 'Year must be after 1000')
    .max(currentYear, `Year cannot be in the future`)
    .int('Year must be a whole number')
    .optional()
    .nullable()
    .transform(val => val || undefined),
  ccli: z.string()
    .regex(ccliRegex, 'CCLI must be 5-7 digits')
    .optional()
    .or(z.literal(''))
    .transform(val => val && val.length > 0 ? val : undefined),
  source: z.enum(SONG_SOURCES as readonly [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a valid source' })
  }).optional(),
  themes: z.array(
    z.string()
      .min(1, 'Theme cannot be empty')
      .max(50, 'Theme must be less than 50 characters')
  )
    .min(1, 'At least one theme is required')
    .max(10, 'Maximum 10 themes allowed')
    .transform(themes => {
      return normalizeThemes(themes)
    }),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .transform(val => val && val.length > 0 ? val : undefined),
  isPublic: z.boolean(), // No default value for update schema
  arrangement: arrangementSchema.optional(),
  slug: z.string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
    .optional()
})

export const updateSongFormSchema = updateBaseSchema.partial().extend({
  id: z.string().min(1, 'Song ID is required'),
}).refine(
  (data) => {
    const updateableFields = Object.keys(data).filter(key => key !== 'id')
    return updateableFields.length > 0
  },
  { message: 'At least one field must be updated' }
)

export type UpdateSongFormData = z.infer<typeof updateSongFormSchema>

/**
 * Field-level schemas for inline editing
 */
export const songFieldSchemas = {
  title: songFormSchema.shape.title,
  artist: songFormSchema.shape.artist,
  compositionYear: songFormSchema.shape.compositionYear,
  ccli: songFormSchema.shape.ccli,
  source: songFormSchema.shape.source,
  themes: songFormSchema.shape.themes,
  notes: songFormSchema.shape.notes,
  isPublic: songFormSchema.shape.isPublic,
  slug: songFormSchema.shape.slug
} as const

export type SongFieldName = keyof typeof songFieldSchemas

/**
 * Search/filter validation schema
 */
export const songSearchSchema = z.object({
  query: z.string().optional(),
  themes: z.array(z.string()).optional(),
  source: z.enum(SONG_SOURCES as readonly [string, ...string[]]).optional(),
  year: z.object({
    min: z.number().min(1000).optional(),
    max: z.number().max(currentYear).optional()
  }).optional(),
  hasArrangements: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  sortBy: z.enum(['title', 'artist', 'year', 'created', 'updated', 'popularity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20)
})

export type SongSearchParams = z.infer<typeof songSearchSchema>

/**
 * Batch operations schema
 */
export const batchSongOperationSchema = z.object({
  songIds: z.array(z.string()).min(1, 'At least one song must be selected'),
  operation: z.enum(['delete', 'publish', 'unpublish', 'addTheme', 'removeTheme', 'updateSource']),
  data: z.any().optional() // Operation-specific data
})

export type BatchSongOperation = z.infer<typeof batchSongOperationSchema>

/**
 * Import/Export schemas
 */
export const songExportSchema = z.object({
  format: z.enum(['json', 'csv', 'chordpro', 'pdf']),
  songIds: z.array(z.string()).optional(), // If not provided, export all
  includeArrangements: z.boolean().default(true),
  includeMetadata: z.boolean().default(false)
})

export type SongExportOptions = z.infer<typeof songExportSchema>

export const songImportSchema = z.object({
  format: z.enum(['json', 'csv', 'chordpro']),
  data: z.string().or(z.array(z.any())), // String for CSV/ChordPro, array for JSON
  overwriteExisting: z.boolean().default(false),
  validateBeforeImport: z.boolean().default(true)
})

export type SongImportOptions = z.infer<typeof songImportSchema>

/**
 * Validation helpers
 */
export const songValidationHelpers = {
  /**
   * Check if CCLI number is valid
   */
  isValidCCLI: (ccli: string): boolean => {
    return ccliRegex.test(ccli)
  },
  
  /**
   * Check if year is valid
   */
  isValidYear: (year: number): boolean => {
    return year >= 1000 && year <= currentYear
  },
  
  /**
   * Check if source is valid
   */
  isValidSource: (source: string): boolean => {
    return SONG_SOURCES.includes(source as (typeof SONG_SOURCES)[number])
  },
  
  /**
   * Sanitize form data before validation
   */
  sanitizeFormData: (data: Partial<SongFormData>): Partial<SongFormData> => {
    const sanitized = { ...data }
    
    // Trim string fields
    if (typeof sanitized.title === 'string') {
      sanitized.title = sanitized.title.trim()
    }
    if (typeof sanitized.artist === 'string') {
      sanitized.artist = sanitized.artist.trim()
    }
    if (typeof sanitized.notes === 'string') {
      sanitized.notes = sanitized.notes.trim()
    }
    
    // Convert empty strings to undefined
    if (sanitized.artist === '') sanitized.artist = undefined
    if (sanitized.ccli === '') sanitized.ccli = undefined
    if (sanitized.notes === '') sanitized.notes = undefined
    
    // Ensure themes is an array
    if (!Array.isArray(sanitized.themes)) {
      sanitized.themes = []
    }
    
    return sanitized
  }
}

/**
 * Create custom song validation with specific requirements
 */
export function createSongSchema(options?: {
  requireArtist?: boolean
  requireYear?: boolean
  requireCCLI?: boolean
  requireSource?: boolean
  minThemes?: number
  maxThemes?: number
}) {
  let schema = songFormSchema
  
  if (options?.requireArtist) {
    schema = schema.extend({
      artist: z.string()
        .min(1, 'Artist is required')
        .max(100, 'Artist name must be less than 100 characters')
    })
  }
  
  if (options?.requireYear) {
    schema = schema.extend({
      compositionYear: z.number()
        .min(1000, 'Composition year is required')
        .max(currentYear, `Year cannot be in the future`)
    })
  }
  
  if (options?.requireCCLI) {
    schema = schema.extend({
      ccli: z.string()
        .regex(ccliRegex, 'Valid CCLI number is required')
    })
  }
  
  if (options?.requireSource) {
    schema = schema.extend({
      source: z.enum(SONG_SOURCES as readonly [string, ...string[]], {
        errorMap: () => ({ message: 'Source is required' })
      })
    })
  }
  
  if (options?.minThemes || options?.maxThemes) {
    const minThemes = options.minThemes || 1
    const maxThemes = options.maxThemes || 10
    
    schema = schema.extend({
      themes: z.array(z.string())
        .min(minThemes, `At least ${minThemes} theme${minThemes > 1 ? 's' : ''} required`)
        .max(maxThemes, `Maximum ${maxThemes} themes allowed`)
    })
  }
  
  return schema
}