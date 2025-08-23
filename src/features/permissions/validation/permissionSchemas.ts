import { z } from 'zod'
import type { 
  PermissionAction, 
  ResourceType, 
  PermissionEffect, 
  PermissionScope 
} from '../types/permission.types'

// Enums for validation
const permissionActionSchema = z.enum([
  'create', 'read', 'update', 'delete',
  'approve', 'reject', 'flag',
  'assign_role', 'revoke_role',
  'export', 'import', 'bulk_edit'
])

const resourceTypeSchema = z.enum([
  'song', 'arrangement', 'setlist', 'user', 'role', 'system'
])

const permissionEffectSchema = z.enum(['allow', 'deny'])

const permissionScopeSchema = z.enum(['global', 'type', 'resource', 'own'])

// Condition schema
const permissionConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['eq', 'neq', 'in', 'contains', 'gt', 'lt']),
  value: z.any()
})

// Permission assignment schema
const permissionAssignmentSchema = z.object({
  permissionId: z.string().uuid(),
  effect: permissionEffectSchema,
  conditions: z.array(permissionConditionSchema).optional(),
  resourceId: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional()
})

// Create custom role schema
export const createCustomRoleSchema = z.object({
  name: z.string()
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Role name can only contain letters, numbers, underscores, and hyphens'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  permissions: z.array(z.object({
    permissionId: z.string().uuid('Invalid permission ID'),
    effect: permissionEffectSchema,
    conditions: z.array(permissionConditionSchema).optional(),
    resourceId: z.string().uuid().optional(),
    expiresAt: z.string().datetime().optional()
  })).min(1, 'At least one permission is required'),
  inheritsFrom: z.array(z.string().uuid()).optional()
})

// Update custom role schema
export const updateCustomRoleSchema = z.object({
  name: z.string()
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Role name can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  permissions: z.array(permissionAssignmentSchema).optional(),
  inheritsFrom: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional()
})

// Assign role to user schema
export const assignRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  roleId: z.string().uuid('Invalid role ID'),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional()
})

// Assign permission to user schema
export const assignPermissionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  permissionId: z.string().uuid('Invalid permission ID'),
  effect: permissionEffectSchema,
  conditions: z.array(permissionConditionSchema).optional(),
  resourceId: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional(),
  reason: z.string().max(500).optional()
})

// Create permission group schema
export const createPermissionGroupSchema = z.object({
  name: z.string()
    .min(2, 'Group name must be at least 2 characters')
    .max(50, 'Group name must be less than 50 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  members: z.array(z.string().uuid()).optional(),
  roles: z.array(z.string().uuid()).optional()
})

// Update permission group schema
export const updatePermissionGroupSchema = z.object({
  name: z.string()
    .min(2, 'Group name must be at least 2 characters')
    .max(50, 'Group name must be less than 50 characters')
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  members: z.array(z.string().uuid()).optional(),
  roles: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional()
})

// Add/remove group member schema
export const modifyGroupMemberSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  userId: z.string().uuid('Invalid user ID'),
  action: z.enum(['add', 'remove'])
})

// Add/remove group role schema
export const modifyGroupRoleSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  roleId: z.string().uuid('Invalid role ID'),
  action: z.enum(['add', 'remove'])
})

// Permission filter schema (for searching/filtering)
export const permissionFilterSchema = z.object({
  resource: resourceTypeSchema.optional(),
  action: permissionActionSchema.optional(),
  scope: permissionScopeSchema.optional(),
  effect: permissionEffectSchema.optional()
})

// Batch permission update schema
export const batchPermissionUpdateSchema = z.object({
  roleId: z.string().uuid('Invalid role ID'),
  updates: z.array(z.object({
    permissionId: z.string().uuid('Invalid permission ID'),
    effect: permissionEffectSchema.nullable(),  // null means remove
    conditions: z.array(permissionConditionSchema).optional(),
    resourceId: z.string().uuid().optional()
  })).min(1, 'At least one update is required')
})

// Permission check request schema
export const permissionCheckSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  resource: resourceTypeSchema,
  action: permissionActionSchema,
  resourceId: z.string().uuid().optional(),
  context: z.record(z.any()).optional()
})

// Role inheritance validation
export const roleInheritanceSchema = z.object({
  childRoleId: z.string().uuid('Invalid child role ID'),
  parentRoleId: z.string().uuid('Invalid parent role ID')
}).refine(
  (data) => data.childRoleId !== data.parentRoleId,
  { message: 'A role cannot inherit from itself' }
)

// Validate circular inheritance
export function validateNoCircularInheritance(
  roleId: string,
  parentRoleIds: string[],
  allRoles: Map<string, string[]>
): boolean {
  const visited = new Set<string>()
  const stack = [...parentRoleIds]
  
  while (stack.length > 0) {
    const currentId = stack.pop()!
    
    if (currentId === roleId) {
      return false  // Circular dependency detected
    }
    
    if (visited.has(currentId)) {
      continue
    }
    
    visited.add(currentId)
    
    const parents = allRoles.get(currentId) || []
    stack.push(...parents)
  }
  
  return true
}

// Export type inferences
export type CreateCustomRoleInput = z.infer<typeof createCustomRoleSchema>
export type UpdateCustomRoleInput = z.infer<typeof updateCustomRoleSchema>
export type AssignRoleInput = z.infer<typeof assignRoleSchema>
export type AssignPermissionInput = z.infer<typeof assignPermissionSchema>
export type CreatePermissionGroupInput = z.infer<typeof createPermissionGroupSchema>
export type UpdatePermissionGroupInput = z.infer<typeof updatePermissionGroupSchema>
export type ModifyGroupMemberInput = z.infer<typeof modifyGroupMemberSchema>
export type ModifyGroupRoleInput = z.infer<typeof modifyGroupRoleSchema>
export type PermissionFilterInput = z.infer<typeof permissionFilterSchema>
export type BatchPermissionUpdateInput = z.infer<typeof batchPermissionUpdateSchema>
export type PermissionCheckInput = z.infer<typeof permissionCheckSchema>
export type RoleInheritanceInput = z.infer<typeof roleInheritanceSchema>