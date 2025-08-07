import { z } from 'zod'

export const songFieldSchemas = {
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .refine(val => val.trim().length > 0, 'Title cannot be empty'),
  
  artist: z.string()
    .max(100, 'Artist name must be less than 100 characters')
    .optional(),
  
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
    
  source: z.string()
    .max(200, 'Source must be less than 200 characters')
    .optional(),
    
  ccli: z.string()
    .max(50, 'CCLI number must be less than 50 characters')
    .optional(),
    
  compositionYear: z.number()
    .min(1, 'Year must be a positive number')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future')
    .optional(),
    
  themes: z.array(z.string())
    .max(20, 'Maximum 20 themes allowed')
    .optional()
}

export type SongFieldKey = keyof typeof songFieldSchemas

export function validateSongField<K extends SongFieldKey>(
  field: K,
  value: unknown
): z.infer<typeof songFieldSchemas[K]> {
  const schema = songFieldSchemas[field]
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message || 'Validation failed')
  }
  return result.data as z.infer<typeof songFieldSchemas[K]>
}