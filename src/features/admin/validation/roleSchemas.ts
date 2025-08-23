import { z } from 'zod'

export const userRoleEnum = z.enum(['admin', 'moderator', 'user'])

export const roleAssignmentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: userRoleEnum,
  expiresAt: z.string().datetime().optional().nullable(),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional()
})

export const userFilterSchema = z.object({
  search: z.string().optional(),
  role: z.union([userRoleEnum, z.literal('all')]).optional(),
  sortBy: z.enum(['email', 'created_at', 'last_sign_in', 'role']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional()
})

export const auditLogFilterSchema = z.object({
  userId: z.string().optional(),
  action: z.enum(['grant', 'revoke', 'expire']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional()
})

export type RoleAssignmentFormData = z.infer<typeof roleAssignmentSchema>
export type UserFilterFormData = z.infer<typeof userFilterSchema>
export type AuditLogFilterFormData = z.infer<typeof auditLogFilterSchema>