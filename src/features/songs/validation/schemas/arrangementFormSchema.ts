import { z } from 'zod'
import { 
  MUSICAL_KEYS, 
  TIME_SIGNATURES, 
  DIFFICULTY_LEVELS,
  TEMPO_LIMITS,
  CAPO_LIMITS,
  DURATION_LIMITS
} from '../constants/musicalKeys'
import { chordProService } from '../../../arrangements/services/chordProService'


/**
 * Arrangement form validation schema
 */
export const arrangementFormSchema = z.object({
  // Basic Information
  name: z.string()
    .min(1, 'Arrangement name is required')
    .max(100, 'Arrangement name must be less than 100 characters')
    .trim()
    .refine(
      (val) => val.length > 0,
      { message: 'Arrangement name cannot be only whitespace' }
    ),
  
  // Musical Properties (Key is REQUIRED for transposition functionality)
  key: z.enum(MUSICAL_KEYS as readonly [string, ...string[]])
    .refine(val => val !== undefined && val !== null, {
      message: 'Musical key is required for transposition functionality'
    })
    .describe('Please select a valid musical key'),
  
  tempo: z.number()
    .min(TEMPO_LIMITS.MIN, `Tempo must be at least ${TEMPO_LIMITS.MIN} BPM`)
    .max(TEMPO_LIMITS.MAX, `Tempo must be less than ${TEMPO_LIMITS.MAX} BPM`)
    .int('Tempo must be a whole number')
    .optional()
    .nullable()
    .transform(val => val || undefined),
  
  timeSignature: z.enum(TIME_SIGNATURES as readonly [string, ...string[]])
    .optional()
    .describe('Please select a valid time signature'),
  
  difficulty: z.enum(DIFFICULTY_LEVELS as readonly [string, ...string[]])
    .optional()
    .describe('Please select a valid difficulty level'),
  
  // Capo position
  capo: z.number()
    .min(CAPO_LIMITS.MIN, 'Capo position cannot be negative')
    .max(CAPO_LIMITS.MAX, `Capo position must be ${CAPO_LIMITS.MAX} or less`)
    .int('Capo position must be a whole number')
    .optional()
    .nullable()
    .transform(val => val || undefined),
  
  // Duration in seconds  
  duration: z.number()
    .min(DURATION_LIMITS.MIN, `Duration must be at least ${DURATION_LIMITS.MIN} second`)
    .max(DURATION_LIMITS.MAX, `Duration must be less than 1 hour (${DURATION_LIMITS.MAX} seconds)`)
    .int('Duration must be a whole number')
    .optional()
    .nullable()
    .transform(val => val || undefined),
  
  // Tags for categorization (following theme patterns from songFormSchema)
  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(50, 'Tag must be less than 50 characters')
      .trim()
  )
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([])
    .transform(tags => {
      // Remove duplicates and empty tags, similar to theme normalization
      const uniqueTags = Array.from(new Set(tags.filter(tag => tag.trim().length > 0)))
      return uniqueTags.map(tag => tag.trim())
    }),
  
  // ChordPro content with musical validation
  chordProText: z.string()
    .max(50000, 'ChordPro content is too large (max 50KB)')
    .optional()
    .default('')
    .refine(
      (val) => {
        if (!val || val.trim().length === 0) return true
        
        // Validate ChordPro structure using service
        try {
          const result = chordProService.parse(val)
          return result.errors.length === 0
        } catch {
          return false
        }
      },
      { message: 'Invalid ChordPro format. Please check syntax for chords, directives, and sections.' }
    )
    .refine(
      (val) => {
        if (!val || val.trim().length === 0) return true
        
        // Check for balanced brackets and braces
        const openBrackets = (val.match(/\[/g) || []).length
        const closeBrackets = (val.match(/\]/g) || []).length
        const openBraces = (val.match(/\{/g) || []).length
        const closeBraces = (val.match(/\}/g) || []).length
        
        return openBrackets === closeBrackets && openBraces === closeBraces
      },
      { message: 'Unbalanced brackets or braces in ChordPro content' }
    ),
  
  // Additional metadata
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform(val => val && val.length > 0 ? val : undefined),
  
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .transform(val => val && val.length > 0 ? val : undefined),
  
  // Auto-generated slug (following songFormSchema pattern)
  slug: z.string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.')
    .max(100, 'Slug must be less than 100 characters')
    .optional(),
  
  // Mashup support - array of song IDs for multi-song arrangements
  songIds: z.array(z.string().min(1, 'Song ID cannot be empty'))
    .min(1, 'At least one song ID is required')
    .optional()
    .default([])
})

export type ArrangementFormData = z.infer<typeof arrangementFormSchema>

/**
 * Update form schema (for editing existing arrangements)
 * Uses a base schema without defaults to prevent unintended field population
 */
const updateBaseSchema = z.object({
  name: z.string()
    .min(1, 'Arrangement name is required')
    .max(100, 'Arrangement name must be less than 100 characters')
    .trim()
    .refine(
      (val) => val.length > 0,
      { message: 'Arrangement name cannot be only whitespace' }
    ),
  key: z.enum(MUSICAL_KEYS as readonly [string, ...string[]])
    .refine(val => val !== undefined && val !== null, {
      message: 'Musical key is required for transposition functionality'
    }),
  tempo: z.number()
    .min(TEMPO_LIMITS.MIN, `Tempo must be at least ${TEMPO_LIMITS.MIN} BPM`)
    .max(TEMPO_LIMITS.MAX, `Tempo must be less than ${TEMPO_LIMITS.MAX} BPM`)
    .int('Tempo must be a whole number')
    .optional()
    .nullable()
    .transform(val => val || undefined),
  timeSignature: z.enum(TIME_SIGNATURES as readonly [string, ...string[]])
    .optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS as readonly [string, ...string[]])
    .optional(),
  capo: z.number()
    .min(CAPO_LIMITS.MIN, 'Capo position cannot be negative')
    .max(CAPO_LIMITS.MAX, `Capo position must be ${CAPO_LIMITS.MAX} or less`)
    .int('Capo position must be a whole number')
    .optional()
    .nullable()
    .transform(val => val || undefined),
  duration: z.number()
    .min(1, 'Duration must be at least 1 second')
    .max(3600, 'Duration must be less than 1 hour')
    .int('Duration must be a whole number')
    .optional()
    .nullable()
    .transform(val => val || undefined),
  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(50, 'Tag must be less than 50 characters')
      .trim()
  )
    .max(10, 'Maximum 10 tags allowed')
    .transform(tags => {
      const uniqueTags = Array.from(new Set(tags.filter(tag => tag.trim().length > 0)))
      return uniqueTags.map(tag => tag.trim())
    }),
  chordProText: z.string()
    .max(50000, 'ChordPro content is too large (max 50KB)')
    .refine(
      (val) => {
        if (!val || val.trim().length === 0) return true
        try {
          const result = chordProService.parse(val)
          return result.errors.length === 0
        } catch {
          return false
        }
      },
      { message: 'Invalid ChordPro format' }
    ),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform(val => val && val.length > 0 ? val : undefined),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .transform(val => val && val.length > 0 ? val : undefined),
  slug: z.string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
    .max(100, 'Slug must be less than 100 characters')
    .optional(),
  songIds: z.array(z.string().min(1, 'Song ID cannot be empty'))
    .min(1, 'At least one song ID is required')
    .optional()
})

export const updateArrangementFormSchema = updateBaseSchema.partial().extend({
  id: z.string().min(1, 'Arrangement ID is required'),
}).refine(
  (data) => {
    const updateableFields = Object.keys(data).filter(key => key !== 'id')
    return updateableFields.length > 0
  },
  { message: 'At least one field must be updated' }
)

export type UpdateArrangementFormData = z.infer<typeof updateArrangementFormSchema>

/**
 * Field-level schemas for inline editing
 */
export const arrangementFieldSchemas = {
  name: arrangementFormSchema.shape.name,
  key: arrangementFormSchema.shape.key,
  tempo: arrangementFormSchema.shape.tempo,
  timeSignature: arrangementFormSchema.shape.timeSignature,
  difficulty: arrangementFormSchema.shape.difficulty,
  capo: arrangementFormSchema.shape.capo,
  duration: arrangementFormSchema.shape.duration,
  tags: arrangementFormSchema.shape.tags,
  chordProText: arrangementFormSchema.shape.chordProText,
  description: arrangementFormSchema.shape.description,
  notes: arrangementFormSchema.shape.notes,
  slug: arrangementFormSchema.shape.slug,
  songIds: arrangementFormSchema.shape.songIds
} as const

export type ArrangementFieldName = keyof typeof arrangementFieldSchemas

/**
 * Search/filter validation schema for arrangements
 */
export const arrangementSearchSchema = z.object({
  query: z.string().optional(),
  key: z.enum(MUSICAL_KEYS as readonly [string, ...string[]]).optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS as readonly [string, ...string[]]).optional(),
  timeSignature: z.enum(TIME_SIGNATURES as readonly [string, ...string[]]).optional(),
  tempo: z.object({
    min: z.number().min(TEMPO_LIMITS.MIN).optional(),
    max: z.number().max(TEMPO_LIMITS.MAX).optional()
  }).optional(),
  tags: z.array(z.string()).optional(),
  hasChordsOnly: z.boolean().optional(), // Arrangements with only chords, no lyrics
  hasLyricsOnly: z.boolean().optional(), // Arrangements with only lyrics, no chords
  hasFullArrangement: z.boolean().optional(), // Arrangements with both chords and lyrics
  capo: z.object({
    min: z.number().min(CAPO_LIMITS.MIN).optional(),
    max: z.number().max(CAPO_LIMITS.MAX).optional()
  }).optional(),
  duration: z.object({
    min: z.number().min(DURATION_LIMITS.MIN).optional(),
    max: z.number().max(DURATION_LIMITS.MAX).optional()
  }).optional(),
  sortBy: z.enum(['name', 'key', 'difficulty', 'tempo', 'duration', 'created', 'updated']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20)
})

export type ArrangementSearchParams = z.infer<typeof arrangementSearchSchema>

/**
 * Batch operations schema for arrangements
 */
export const batchArrangementOperationSchema = z.object({
  arrangementIds: z.array(z.string()).min(1, 'At least one arrangement must be selected'),
  operation: z.enum(['delete', 'transpose', 'updateDifficulty', 'addTag', 'removeTag', 'updateKey']),
  data: z.any().optional() // Operation-specific data
})

export type BatchArrangementOperation = z.infer<typeof batchArrangementOperationSchema>

/**
 * Import/Export schemas for arrangements
 */
export const arrangementExportSchema = z.object({
  format: z.enum(['json', 'chordpro', 'pdf', 'txt']),
  arrangementIds: z.array(z.string()).optional(), // If not provided, export all
  includeMetadata: z.boolean().default(true),
  transposeToKey: z.enum(MUSICAL_KEYS as readonly [string, ...string[]]).optional(),
  fontSize: z.number().min(8).max(72).optional().default(12)
})

export type ArrangementExportOptions = z.infer<typeof arrangementExportSchema>

export const arrangementImportSchema = z.object({
  format: z.enum(['json', 'chordpro']),
  data: z.string().or(z.array(z.any())), // String for ChordPro, array for JSON
  defaultKey: z.enum(MUSICAL_KEYS as readonly [string, ...string[]]).optional(),
  overwriteExisting: z.boolean().default(false),
  validateBeforeImport: z.boolean().default(true)
})

export type ArrangementImportOptions = z.infer<typeof arrangementImportSchema>

/**
 * Validation helpers for arrangements
 */
export const arrangementValidationHelpers = {
  /**
   * Check if tempo is within valid range
   */
  isValidTempo: (tempo: number): boolean => {
    return tempo >= TEMPO_LIMITS.MIN && tempo <= TEMPO_LIMITS.MAX && Number.isInteger(tempo)
  },
  
  /**
   * Check if key is valid
   */
  isValidKey: (key: string): boolean => {
    return MUSICAL_KEYS.includes(key as typeof MUSICAL_KEYS[number])
  },
  
  /**
   * Check if time signature is valid
   */
  isValidTimeSignature: (timeSignature: string): boolean => {
    return TIME_SIGNATURES.includes(timeSignature as typeof TIME_SIGNATURES[number])
  },
  
  /**
   * Check if difficulty level is valid
   */
  isValidDifficulty: (difficulty: string): boolean => {
    return DIFFICULTY_LEVELS.includes(difficulty as typeof DIFFICULTY_LEVELS[number])
  },
  
  /**
   * Validate ChordPro content structure
   */
  validateChordPro: (content: string): { isValid: boolean; errors: string[]; warnings: string[] } => {
    if (!content || content.trim().length === 0) {
      return { isValid: true, errors: [], warnings: ['No content provided'] }
    }
    
    try {
      const result = chordProService.parse(content)
      return {
        isValid: result.errors.length === 0,
        errors: result.errors.map(e => e.message),
        warnings: result.warnings.map(w => w.message)
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Failed to parse ChordPro content'],
        warnings: []
      }
    }
  },
  
  /**
   * Extract musical metadata from ChordPro content
   */
  extractMusicalMetadata: (content: string): {
    key?: string
    tempo?: number
    timeSignature?: string
    capo?: number
    title?: string
  } => {
    try {
      const result = chordProService.parse(content)
      return {
        key: result.metadata.key,
        tempo: typeof result.metadata.tempo === 'number' ? result.metadata.tempo : undefined,
        timeSignature: result.metadata.time,
        capo: typeof result.metadata.capo === 'number' ? result.metadata.capo : undefined,
        title: result.metadata.title
      }
    } catch {
      return {}
    }
  },
  
  /**
   * Sanitize form data before validation
   */
  sanitizeFormData: (data: Partial<ArrangementFormData>): Partial<ArrangementFormData> => {
    const sanitized = { ...data }
    
    // Trim string fields
    if (typeof sanitized.name === 'string') {
      sanitized.name = sanitized.name.trim()
    }
    if (typeof sanitized.description === 'string') {
      sanitized.description = sanitized.description.trim()
    }
    if (typeof sanitized.notes === 'string') {
      sanitized.notes = sanitized.notes.trim()
    }
    if (typeof sanitized.chordProText === 'string') {
      sanitized.chordProText = sanitized.chordProText.trim()
    }
    
    // Convert empty strings to undefined
    if (sanitized.description === '') sanitized.description = undefined
    if (sanitized.notes === '') sanitized.notes = undefined
    if (sanitized.chordProText === '') sanitized.chordProText = ''
    
    // Ensure tags is an array and remove duplicates
    if (!Array.isArray(sanitized.tags)) {
      sanitized.tags = []
    } else {
      sanitized.tags = Array.from(new Set(
        sanitized.tags.filter(tag => tag && tag.trim().length > 0)
      )).map(tag => tag.trim())
    }
    
    // Ensure songIds is an array
    if (!Array.isArray(sanitized.songIds)) {
      sanitized.songIds = []
    }
    
    return sanitized
  },
  
  /**
   * Generate auto-title from name if not provided in ChordPro
   */
  generateAutoTitle: (arrangementName: string): string => {
    return arrangementName
      .trim()
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
  }
}

/**
 * Create custom arrangement validation with specific requirements
 */
export function createArrangementSchema(options?: {
  requireTempo?: boolean
  requireTimeSignature?: boolean
  requireDifficulty?: boolean
  requireDescription?: boolean
  requireChordPro?: boolean
  minTags?: number
  maxTags?: number
  maxChordProSize?: number
}) {
  // Create base schema modifications
  const schemaOverrides: Record<string, z.ZodTypeAny> = {}
  
  if (options?.requireTempo) {
    schemaOverrides.tempo = z.number()
      .min(TEMPO_LIMITS.MIN, `Tempo is required (${TEMPO_LIMITS.MIN}-${TEMPO_LIMITS.MAX} BPM)`)
      .max(TEMPO_LIMITS.MAX, `Tempo must be less than ${TEMPO_LIMITS.MAX} BPM`)
      .int('Tempo must be a whole number')
  }
  
  if (options?.requireTimeSignature) {
    schemaOverrides.timeSignature = z.enum(TIME_SIGNATURES as readonly [string, ...string[]])
      .describe('Time signature is required')
  }
  
  if (options?.requireDifficulty) {
    schemaOverrides.difficulty = z.enum(DIFFICULTY_LEVELS as readonly [string, ...string[]])
      .describe('Difficulty level is required')
  }
  
  if (options?.requireDescription) {
    schemaOverrides.description = z.string()
      .min(1, 'Description is required')
      .max(1000, 'Description must be less than 1000 characters')
  }
  
  if (options?.requireChordPro) {
    schemaOverrides.chordProText = z.string()
      .min(1, 'ChordPro content is required')
      .max(options.maxChordProSize || 50000, `ChordPro content is too large (max ${options.maxChordProSize || 50000} characters)`)
      .refine(
        (val) => {
          try {
            const result = chordProService.parse(val)
            return result.errors.length === 0
          } catch {
            return false
          }
        },
        { message: 'Valid ChordPro content is required' }
      )
  }
  
  if (options?.minTags || options?.maxTags) {
    const minTags = options.minTags || 0
    const maxTags = options.maxTags || 10
    
    schemaOverrides.tags = z.array(
      z.string()
        .min(1, 'Tag cannot be empty')
        .max(50, 'Tag must be less than 50 characters')
        .trim()
    )
      .min(minTags, `At least ${minTags} tag${minTags > 1 ? 's' : ''} required`)
      .max(maxTags, `Maximum ${maxTags} tags allowed`)
      .transform(tags => {
        const uniqueTags = Array.from(new Set(tags.filter(tag => tag.trim().length > 0)))
        return uniqueTags.map(tag => tag.trim())
      })
  }
  
  // Return extended schema with overrides
  return arrangementFormSchema.extend(schemaOverrides)
}