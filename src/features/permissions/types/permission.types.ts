// Permission system types

export type PermissionAction = 
  | 'create' | 'read' | 'update' | 'delete'  // CRUD
  | 'approve' | 'reject' | 'flag'  // Moderation
  | 'assign_role' | 'revoke_role'  // Admin
  | 'export' | 'import' | 'bulk_edit'  // Advanced

export type ResourceType = 
  | 'song' | 'arrangement' | 'setlist' | 'user' | 'role' | 'system'

export type PermissionEffect = 'allow' | 'deny'

export type PermissionScope = 'global' | 'type' | 'resource' | 'own'

export interface Permission {
  id: string
  name: string
  resource: ResourceType
  action: PermissionAction
  scope: PermissionScope
  description?: string
}

export interface CustomRole {
  id: string
  name: string
  description?: string
  permissions: PermissionAssignment[]
  inheritsFrom?: string[]  // Parent role IDs
  createdBy: string
  createdAt: string
  updatedAt?: string
  isSystem: boolean  // Cannot be modified
  isActive: boolean
}

export interface PermissionAssignment {
  permissionId: string
  effect: PermissionEffect
  conditions?: PermissionCondition[]
  resourceId?: string  // For resource-specific permissions
  expiresAt?: string
}

export interface PermissionCondition {
  field: string  // e.g., 'created_by', 'status', 'category'
  operator: 'eq' | 'neq' | 'in' | 'contains' | 'gt' | 'lt'
  value: any
}

export interface UserPermissionSet {
  userId: string
  roles: string[]  // Role IDs
  customRoles: string[]  // Custom role IDs
  groups: string[]  // Group IDs
  directPermissions: PermissionAssignment[]  // User-specific overrides
  effectivePermissions: ResolvedPermission[]  // Computed result
  evaluatedAt: string
}

export interface ResolvedPermission {
  resource: ResourceType
  action: PermissionAction
  effect: PermissionEffect
  scope: PermissionScope
  resourceId?: string
  source: 'role' | 'direct' | 'inherited' | 'group'
  priority: number  // For conflict resolution
}

export interface PermissionGroup {
  id: string
  name: string
  description?: string
  members: string[]  // User IDs
  roles: string[]  // Role IDs assigned to group
  parentGroups?: string[]  // For group nesting
  createdBy: string
  createdAt: string
  isActive: boolean
}

export interface PermissionMatrix {
  roles: CustomRole[]
  permissions: Permission[]
  assignments: Map<string, Map<string, PermissionEffect>>  // roleId -> permissionId -> effect
}

export interface RoleAssignment {
  userId: string
  roleId: string
  grantedBy: string
  grantedAt: string
  expiresAt?: string
  isActive: boolean
  notes?: string
}

export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  matchedPermission?: ResolvedPermission
  deniedBy?: ResolvedPermission
}

export interface PermissionFilter {
  resource?: ResourceType
  action?: PermissionAction
  scope?: PermissionScope
  effect?: PermissionEffect
}

export interface CreateCustomRoleInput {
  name: string
  description?: string
  permissions: Array<{
    permissionId: string
    effect: PermissionEffect
    conditions?: PermissionCondition[]
    resourceId?: string
    expiresAt?: string
  }>
  inheritsFrom?: string[]
}

export interface UpdateCustomRoleInput {
  name?: string
  description?: string
  permissions?: PermissionAssignment[]
  inheritsFrom?: string[]
  isActive?: boolean
}

export interface AssignRoleInput {
  userId: string
  roleId: string
  expiresAt?: string
  notes?: string
}

export interface AssignPermissionInput {
  userId: string
  permissionId: string
  effect: PermissionEffect
  conditions?: PermissionCondition[]
  resourceId?: string
  expiresAt?: string
  reason?: string
}

export interface CreatePermissionGroupInput {
  name: string
  description?: string
  members?: string[]
  roles?: string[]
}

export interface UpdatePermissionGroupInput {
  name?: string
  description?: string
  members?: string[]
  roles?: string[]
  isActive?: boolean
}

// Database table types (for Supabase integration)
export interface DBPermission {
  id: string
  name: string
  resource: string
  action: string
  scope: string
  description: string | null
  created_at: string
}

export interface DBCustomRole {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  is_system: boolean
  is_active: boolean
}

export interface DBRolePermission {
  id: string
  role_id: string
  permission_id: string
  effect: string
  conditions: any | null
  resource_id: string | null
  expires_at: string | null
  created_at: string
}

export interface DBUserPermission {
  id: string
  user_id: string
  permission_id: string
  effect: string
  conditions: any | null
  resource_id: string | null
  granted_by: string | null
  granted_at: string
  expires_at: string | null
  reason: string | null
}

export interface DBPermissionGroup {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string
  is_active: boolean
}

export interface DBGroupMember {
  group_id: string
  user_id: string
  added_by: string | null
  added_at: string
}

export interface DBGroupRole {
  group_id: string
  role_id: string
  assigned_by: string | null
  assigned_at: string
}

export interface DBUserRole {
  id: string
  user_id: string
  role: string
  granted_by: string | null
  granted_at: string
  expires_at: string | null
  is_active: boolean
  notes: string | null
}

export interface DBUserCustomRole {
  user_id: string
  role_id: string
  granted_by: string | null
  granted_at: string
  expires_at: string | null
  is_active: boolean
}

export interface DBRoleInheritance {
  child_role_id: string
  parent_role_id: string
  created_at: string
}