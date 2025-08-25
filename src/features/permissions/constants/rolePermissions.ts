import type { 
  UserPermissionSet, 
  ResolvedPermission,
  ResourceType,
  PermissionAction
} from '../types/permission.types'

// Type for user roles from database
type DatabaseUserRole = 'admin' | 'moderator' | 'user'

// Extended types for internal use that support wildcards
type ExtendedResourceType = ResourceType | '*'
type ExtendedPermissionAction = PermissionAction | '*'

interface ExtendedResolvedPermission extends Omit<ResolvedPermission, 'resource' | 'action'> {
  resource: ExtendedResourceType
  action: ExtendedPermissionAction
}

/**
 * Static permission mappings for each role
 * These define what each role can do in the system
 */
export const ROLE_PERMISSIONS: Record<DatabaseUserRole, ExtendedResolvedPermission[]> = {
  user: [
    { resource: 'song', action: 'read', effect: 'allow', scope: 'global', source: 'role', priority: 1 },
    { resource: 'arrangement', action: 'read', effect: 'allow', scope: 'global', source: 'role', priority: 1 },
    { resource: 'arrangement', action: 'create', effect: 'allow', scope: 'own', source: 'role', priority: 1 },
    { resource: 'arrangement', action: 'update', effect: 'allow', scope: 'own', source: 'role', priority: 1 },
    { resource: 'arrangement', action: 'delete', effect: 'allow', scope: 'own', source: 'role', priority: 1 },
    { resource: 'setlist', action: 'create', effect: 'allow', scope: 'own', source: 'role', priority: 1 },
    { resource: 'setlist', action: 'update', effect: 'allow', scope: 'own', source: 'role', priority: 1 },
    { resource: 'setlist', action: 'delete', effect: 'allow', scope: 'own', source: 'role', priority: 1 },
    { resource: 'setlist', action: 'read', effect: 'allow', scope: 'global', source: 'role', priority: 1 },
  ],
  moderator: [
    // Include all user permissions
    { resource: 'song', action: 'read', effect: 'allow', scope: 'global', source: 'role', priority: 1 },
    { resource: 'arrangement', action: 'read', effect: 'allow', scope: 'global', source: 'role', priority: 1 },
    { resource: 'arrangement', action: 'create', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'arrangement', action: 'update', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'arrangement', action: 'delete', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'setlist', action: 'create', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'setlist', action: 'update', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'setlist', action: 'delete', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'setlist', action: 'read', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    // Moderation-specific permissions
    { resource: 'song', action: 'create', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'song', action: 'update', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'song', action: 'delete', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'song', action: 'approve', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'song', action: 'reject', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'arrangement', action: 'approve', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'arrangement', action: 'reject', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'arrangement', action: 'flag', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'user', action: 'read', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
    { resource: 'user', action: 'update', effect: 'allow', scope: 'global', source: 'role', priority: 2 },
  ],
  admin: [
    // Admin has all permissions - using wildcard
    { resource: '*', action: '*', effect: 'allow', scope: 'global', source: 'role', priority: 3 },
  ],
}

/**
 * Helper function to create a minimal permission set for errors
 * This is used as a fallback when permission fetching fails
 */
export function createMinimalPermissionSet(userId: string): UserPermissionSet {
  return {
    userId,
    roles: [],
    customRoles: [],
    groups: [],
    directPermissions: [],
    effectivePermissions: [],
    evaluatedAt: new Date().toISOString(),
  }
}

/**
 * Helper function to derive permissions from a user role
 * @param role The user's role from the database
 * @returns Array of resolved permissions for that role
 */
export function derivePermissionsFromRole(role: DatabaseUserRole | string): ExtendedResolvedPermission[] {
  // Type guard to ensure we have a valid role
  if (role === 'admin' || role === 'moderator' || role === 'user') {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user
  }
  // Default to basic user permissions for unknown roles
  return ROLE_PERMISSIONS.user
}

/**
 * Check if a specific permission is allowed for a role
 * @param role User's role
 * @param resource Resource type to check
 * @param action Action to perform
 * @param scope Optional scope constraint
 * @returns true if permission is allowed
 */
export function checkRolePermission(
  role: DatabaseUserRole | string,
  resource: ExtendedResourceType,
  action: ExtendedPermissionAction,
  scope?: string
): boolean {
  const permissions = derivePermissionsFromRole(role)
  
  return permissions.some(p => {
    // Admin bypass - * means all permissions
    if (p.action === '*' && p.resource === '*') return true
    
    // Check specific permission
    if (p.effect !== 'allow') return false
    
    // Check resource match
    const resourceMatch = p.resource === resource || p.resource === '*'
    if (!resourceMatch) return false
    
    // Check action match
    const actionMatch = p.action === action || p.action === '*'
    if (!actionMatch) return false
    
    // Check scope if specified
    if (scope && p.scope !== 'global' && p.scope !== scope) return false
    
    return true
  })
}