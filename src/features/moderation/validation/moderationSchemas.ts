import { z } from 'zod'

// Report submission schema
export const reportSchema = z.object({
  contentId: z.string().uuid('Invalid content ID'),
  contentType: z.enum(['song', 'arrangement']),
  reason: z.enum(['inappropriate', 'copyright', 'spam', 'incorrect', 'other'], {
    message: 'Please select a valid reason'
  }),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal(''))
})

// Moderation action schema
export const moderationActionSchema = z.object({
  contentIds: z.array(z.string().uuid()).min(1, 'At least one content item must be selected'),
  action: z.enum(['approve', 'reject', 'flag', 'unflag']),
  note: z.string()
    .max(500, 'Note must be less than 500 characters')
    .optional()
    .or(z.literal(''))
})

// Bulk moderation action schema
export const bulkModerationActionSchema = z.object({
  contentIds: z.array(z.string().uuid()).min(1, 'At least one content item must be selected'),
  action: z.enum(['approve', 'reject', 'flag', 'unflag']),
  note: z.string()
    .max(500, 'Note must be less than 500 characters')
    .optional()
    .or(z.literal(''))
}).refine(
  (data) => {
    // Require note for reject actions
    if (data.action === 'reject' && (!data.note || data.note.trim() === '')) {
      return false
    }
    return true
  },
  {
    message: 'A reason is required when rejecting content',
    path: ['note']
  }
)

// Moderation filter schema
export const moderationFilterSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'flagged', 'all']).optional(),
  contentType: z.enum(['song', 'arrangement', 'all']).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional(),
  reportedOnly: z.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional()
})

// Type exports for use in components
export type ReportFormData = z.infer<typeof reportSchema>
export type ModerationActionFormData = z.infer<typeof moderationActionSchema>
export type BulkModerationActionFormData = z.infer<typeof bulkModerationActionSchema>
export type ModerationFilterFormData = z.infer<typeof moderationFilterSchema>