import { z } from 'zod'

// Base review schema
export const reviewSchema = z.object({
  rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z.string()
    .max(1000, 'Comment cannot exceed 1000 characters')
    .trim()
    .optional()
})

// Create review validation
export const createReviewSchema = z.object({
  body: reviewSchema.extend({
    arrangementId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid arrangement ID format')
      .optional()
  }),
  params: z.object({
    songId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid song ID format')
  })
})

// Update review validation
export const updateReviewSchema = z.object({
  body: reviewSchema.partial(),
  params: z.object({
    reviewId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID format')
  })
})

// Get reviews validation
export const getReviewsSchema = z.object({
  params: z.object({
    songId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid song ID format')
  }),
  query: z.object({
    arrangementId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid arrangement ID format')
      .optional(),
    page: z.string()
      .regex(/^\d+$/, 'Page must be a positive number')
      .transform(Number)
      .refine(val => val >= 1, 'Page must be at least 1')
      .optional(),
    limit: z.string()
      .regex(/^\d+$/, 'Limit must be a positive number')
      .transform(Number)
      .refine(val => val >= 1 && val <= 50, 'Limit must be between 1 and 50')
      .optional(),
    sortBy: z.enum(['createdAt', 'rating', 'helpful'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc'])
      .optional(),
    rating: z.string()
      .regex(/^[1-5]$/, 'Rating filter must be between 1 and 5')
      .transform(Number)
      .optional()
  })
})

// Get review by ID validation
export const getReviewByIdSchema = z.object({
  params: z.object({
    reviewId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID format')
  })
})

// Get user review validation
export const getUserReviewSchema = z.object({
  params: z.object({
    songId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid song ID format')
  }),
  query: z.object({
    arrangementId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid arrangement ID format')
      .optional()
  })
})

// Delete review validation
export const deleteReviewSchema = z.object({
  params: z.object({
    reviewId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID format')
  })
})

// Mark helpful validation
export const markHelpfulSchema = z.object({
  params: z.object({
    reviewId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID format')
  }),
  body: z.object({
    helpful: z.boolean()
  })
})

// Get review stats validation
export const getReviewStatsSchema = z.object({
  params: z.object({
    songId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid song ID format')
  })
})

// Get user reviews validation
export const getUserReviewsSchema = z.object({
  params: z.object({
    userId: z.string()
      .min(1, 'User ID is required')
  }),
  query: z.object({
    page: z.string()
      .regex(/^\d+$/, 'Page must be a positive number')
      .transform(Number)
      .refine(val => val >= 1, 'Page must be at least 1')
      .optional(),
    limit: z.string()
      .regex(/^\d+$/, 'Limit must be a positive number')
      .transform(Number)
      .refine(val => val >= 1 && val <= 50, 'Limit must be between 1 and 50')
      .optional(),
    sortBy: z.enum(['createdAt', 'rating', 'helpful'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc'])
      .optional()
  })
})