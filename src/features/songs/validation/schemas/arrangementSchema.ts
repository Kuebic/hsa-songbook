import { z } from 'zod'
import { MUSICAL_KEYS, TIME_SIGNATURES, DIFFICULTY_LEVELS } from '../constants/musicalKeys'

/**
 * Arrangement validation schema
 */
export const arrangementSchema = z.object({
  // Basic information
  name: z.string()
    .min(1, 'Arrangement name is required')
    .max(100, 'Arrangement name must be less than 100 characters')
    .trim(),
  
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  
  // Musical properties
  key: z.enum(MUSICAL_KEYS as readonly [string, ...string[]])
    .describe('Please select a valid musical key'),
  
  tempo: z.number()
    .min(40, 'Tempo must be at least 40 BPM')
    .max(240, 'Tempo must be less than 240 BPM')
    .int('Tempo must be a whole number')
    .optional(),
  
  timeSignature: z.enum(TIME_SIGNATURES as readonly [string, ...string[]])
    .optional()
    .describe('Please select a valid time signature'),
  
  difficulty: z.enum(DIFFICULTY_LEVELS as readonly [string, ...string[]])
    .describe('Please select a valid difficulty level'),
  
  // Tags for categorization
  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(50, 'Tag must be less than 50 characters')
      .trim()
  )
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),
  
  // ChordPro data - optional during creation, can be added later in chord editor
  chordProText: z.string()
    .max(50000, 'Chord data is too large (max 50KB)')
    .optional()
    .default(''),
  
  chordData: z.string()
    .max(50000, 'Chord data is too large (max 50KB)')
    .optional(),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  // Mashup support (multiple songs in one arrangement)
  songIds: z.array(z.string())
    .min(1, 'At least one song ID is required')
    .optional(),
  
  // Additional metadata
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .transform(val => val || undefined),
  
  // Capo position
  capo: z.number()
    .min(0, 'Capo position cannot be negative')
    .max(12, 'Capo position must be 12 or less')
    .int('Capo position must be a whole number')
    .optional(),
  
  // Duration in seconds
  duration: z.number()
    .min(1, 'Duration must be at least 1 second')
    .max(3600, 'Duration must be less than 1 hour')
    .optional()
})

export type ArrangementFormData = z.infer<typeof arrangementSchema>

/**
 * Partial arrangement schema for updates
 */
export const updateArrangementSchema = arrangementSchema.partial().extend({
  id: z.string().min(1, 'Arrangement ID is required')
})

export type UpdateArrangementFormData = z.infer<typeof updateArrangementSchema>

/**
 * Field-level schemas for inline editing
 */
export const arrangementFieldSchemas = {
  name: arrangementSchema.shape.name,
  slug: arrangementSchema.shape.slug,
  key: arrangementSchema.shape.key,
  tempo: arrangementSchema.shape.tempo,
  timeSignature: arrangementSchema.shape.timeSignature,
  difficulty: arrangementSchema.shape.difficulty,
  tags: arrangementSchema.shape.tags,
  chordData: arrangementSchema.shape.chordData,
  chordProText: arrangementSchema.shape.chordProText,
  description: arrangementSchema.shape.description,
  notes: arrangementSchema.shape.notes,
  capo: arrangementSchema.shape.capo,
  duration: arrangementSchema.shape.duration
} as const

export type ArrangementFieldName = keyof typeof arrangementFieldSchemas

/**
 * ChordPro validation utilities
 */
export const chordProValidation = {
  /**
   * Check if text contains valid ChordPro directives
   */
  hasDirectives: (text: string): boolean => {
    const directivePattern = /\{[a-z_]+:.*\}/i
    return directivePattern.test(text)
  },
  
  /**
   * Check if text contains chord notations
   */
  hasChords: (text: string): boolean => {
    const chordPattern = /\[[A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]*\]/
    return chordPattern.test(text)
  },
  
  /**
   * Extract title from ChordPro
   */
  extractTitle: (text: string): string | null => {
    const match = text.match(/\{(?:title|t):([^}]+)\}/i)
    return match ? match[1].trim() : null
  },
  
  /**
   * Extract key from ChordPro
   */
  extractKey: (text: string): string | null => {
    const match = text.match(/\{key:([^}]+)\}/i)
    return match ? match[1].trim() : null
  },
  
  /**
   * Validate ChordPro structure
   */
  isValid: (text: string): boolean => {
    // Must have some content
    if (!text || text.trim().length === 0) return false
    
    // Should have either directives or chords
    return chordProValidation.hasDirectives(text) || 
           chordProValidation.hasChords(text)
  }
}

/**
 * Create custom arrangement validation with specific requirements
 */
export function createArrangementSchema(options?: {
  requireKey?: boolean
  requireTempo?: boolean
  requireDifficulty?: boolean
  maxChordDataSize?: number
}) {
  let schema = arrangementSchema
  
  if (options?.requireKey) {
    schema = schema.extend({
      key: z.enum(MUSICAL_KEYS as readonly [string, ...string[]])
        .describe('Please select a valid musical key')
    }) as typeof schema
  }
  
  if (options?.requireTempo) {
    schema = schema.extend({
      tempo: z.number()
        .min(40, 'Tempo is required (40-300 BPM)')
        .max(300, 'Tempo must be less than 300 BPM')
    }) as typeof schema
  }
  
  if (options?.requireDifficulty) {
    schema = schema.extend({
      difficulty: z.enum(DIFFICULTY_LEVELS as readonly [string, ...string[]])
        .describe('Please select a valid difficulty level')
    }) as typeof schema
  }
  
  if (options?.maxChordDataSize) {
    schema = schema.extend({
      chordData: z.string()
        .min(1, 'Chord data is required')
        .max(options.maxChordDataSize, `Chord data must be less than ${options.maxChordDataSize} characters`)
    }) as typeof schema
  }
  
  return schema
}