import { z } from 'zod'

const mongoIdRegex = /^[0-9a-fA-F]{24}$/

export const createArrangementSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(200, 'Name cannot exceed 200 characters')
      .trim(),
    songIds: z.array(
      z.string().regex(mongoIdRegex, 'Invalid song ID')
    ).min(1, 'At least one song ID is required'),
    slug: z.string()
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    chordProText: z.string()
      .optional()
      .default(''),
    key: z.enum(['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
                 'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm'])
      .optional(),
    tempo: z.number()
      .min(40, 'Tempo must be at least 40 BPM')
      .max(240, 'Tempo cannot exceed 240 BPM')
      .optional(),
    timeSignature: z.enum(['4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '12/8', '9/8'])
      .default('4/4'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    description: z.string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional(),
    tags: z.array(z.string().trim().toLowerCase())
      .default([]),
    isPublic: z.boolean()
      .default(false),
    mashupSections: z.array(z.object({
      songId: z.string().regex(mongoIdRegex, 'Invalid song ID'),
      title: z.string()
    })).optional()
  })
})

export const updateArrangementSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Name cannot be empty')
      .max(200, 'Name cannot exceed 200 characters')
      .trim()
      .optional(),
    songIds: z.array(
      z.string().regex(mongoIdRegex, 'Invalid song ID')
    ).min(1, 'At least one song ID is required')
      .optional(),
    slug: z.string()
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    chordProText: z.string()
      .optional(),
    key: z.enum(['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
                 'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm'])
      .optional(),
    tempo: z.number()
      .min(40, 'Tempo must be at least 40 BPM')
      .max(240, 'Tempo cannot exceed 240 BPM')
      .optional(),
    timeSignature: z.enum(['4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '12/8', '9/8'])
      .optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced'])
      .optional(),
    description: z.string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional(),
    tags: z.array(z.string().trim().toLowerCase())
      .optional(),
    isPublic: z.boolean()
      .optional(),
    mashupSections: z.array(z.object({
      songId: z.string().regex(mongoIdRegex, 'Invalid song ID'),
      title: z.string()
    })).optional()
  }),
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid arrangement ID')
  })
})

export const getArrangementByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid arrangement ID')
  })
})

export const getArrangementBySlugSchema = z.object({
  params: z.object({
    slug: z.string()
  })
})

export const deleteArrangementSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid arrangement ID')
  })
})

export const getArrangementsBySongSchema = z.object({
  params: z.object({
    songId: z.string().regex(mongoIdRegex, 'Invalid song ID')
  })
})

export const getArrangementsQuerySchema = z.object({
  query: z.object({
    songId: z.string().regex(mongoIdRegex, 'Invalid song ID').optional(),
    createdBy: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    key: z.enum(['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
                 'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm']).optional(),
    tags: z.union([
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
    isMashup: z.union([
      z.literal('true'),
      z.literal('false'),
      z.boolean()
    ]).transform(val => val === 'true' ? true : val === 'false' ? false : val)
      .optional(),
    page: z.string()
      .transform(val => parseInt(val, 10))
      .pipe(z.number().positive())
      .default('1'),
    limit: z.string()
      .transform(val => parseInt(val, 10))
      .pipe(z.number().positive().max(100))
      .default('20'),
    sortBy: z.enum(['name', 'createdAt', 'views', 'rating'])
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc'])
      .default('desc')
  })
})

export type CreateArrangementInput = z.infer<typeof createArrangementSchema>['body']
export type UpdateArrangementInput = z.infer<typeof updateArrangementSchema>['body']
export type GetArrangementsQuery = z.infer<typeof getArrangementsQuerySchema>['query']