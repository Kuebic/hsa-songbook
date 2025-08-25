import { supabase } from '../../../lib/supabase'
import type {
  Permission,
  CustomRole,
  UserPermissionSet,
  PermissionGroup,
  CreateCustomRoleInput,
  UpdateCustomRoleInput,
  AssignRoleInput,
  AssignPermissionInput,
  CreatePermissionGroupInput,
  UpdatePermissionGroupInput,
  PermissionEffect,
  ResourceType,
  PermissionAction
} from '../types/permission.types'
import { 
  derivePermissionsFromRole, 
  createMinimalPermissionSet 
} from '../constants/rolePermissions'

export class PermissionService {
  // Cache for storing permission data with TTL
  private cache = new Map<string, { data: UserPermissionSet; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds
  /**
   * Get all effective permissions for a user
   * Queries the user_roles table and derives permissions from the role
   */
  async getUserPermissions(userId: string): Promise<UserPermissionSet> {
    // Check cache first
    const cached = this.cache.get(userId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      // Query actual user_roles table
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      // Handle PGRST116 error (no rows found) gracefully
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user roles:', error)
        throw new Error('Failed to fetch user permissions')
      }

      // Determine user role (default to 'user' if no role found)
      const userRole = roleData?.role || 'user'
      const permissions = derivePermissionsFromRole(userRole)

      // Build the permission set - cast ExtendedResolvedPermission to ResolvedPermission
      const userPermissionSet: UserPermissionSet = {
        userId,
        roles: roleData ? [userRole] : ['user'],
        customRoles: [], // Not implemented - no table exists
        groups: [], // Not implemented - no table exists
        directPermissions: [], // Not implemented - no table exists
        effectivePermissions: permissions as UserPermissionSet['effectivePermissions'], // Safe cast: ExtendedResolvedPermission extends ResolvedPermission
        evaluatedAt: new Date().toISOString()
      }

      // Cache the result
      this.cache.set(userId, { 
        data: userPermissionSet, 
        timestamp: Date.now() 
      })

      return userPermissionSet
    } catch (error) {
      console.error('Permission service error:', error)
      // Return minimal permissions on error (fail-safe)
      return createMinimalPermissionSet(userId)
    }
  }

  /**
   * Check if a user has a specific permission
   * @param userId User ID to check
   * @param action Permission action to check
   * @param resource Optional resource context
   * @returns true if user has permission, false otherwise
   */
  async checkPermission(
    userId: string,
    action: PermissionAction | string,
    resource?: { type: ResourceType | string; id?: string }
  ): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId)
      
      // Check if user has the required permission
      return permissions.effectivePermissions.some(p => {
        // Admin bypass - * means all permissions
        if ((p.action as string) === '*' && (p.resource as string) === '*') return true
        
        // Check specific permission
        if (p.action === action && p.effect === 'allow') {
          // Check resource type if specified
          if (resource) {
            return p.resource === resource.type || (p.resource as string) === '*'
          }
          return true
        }
        
        return false
      })
    } catch (error) {
      console.error('Permission check error:', error)
      return false // Fail closed - deny on error
    }
  }

  /**
   * Clear cached permissions for a user
   * Useful when roles change
   */
  clearUserCache(userId: string): void {
    this.cache.delete(userId)
  }

  /**
   * Clear all cached permissions
   */
  clearAllCache(): void {
    this.cache.clear()
  }

  /**
   * Get all available permissions
   * NOTE: Permissions table doesn't exist, returning empty array
   */
  async getAllPermissions(): Promise<Permission[]> {
    console.warn('getAllPermissions: Permission tables not implemented yet - returning empty array')
    return []
  }

  /**
   * Get all custom roles
   * NOTE: Custom roles table doesn't exist, returning empty array
   */
  async getCustomRoles(): Promise<CustomRole[]> {
    console.warn('getCustomRoles: Custom roles table not implemented yet - returning empty array')
    return []
  }

  /**
   * Create a new custom role
   * NOTE: Custom roles functionality not implemented - database tables don't exist
   */
  async createCustomRole(_input: CreateCustomRoleInput): Promise<CustomRole> {
    console.warn('createCustomRole: Custom roles feature coming soon - database tables do not exist yet')
    throw new Error('Custom roles feature coming soon')
  }

  /**
   * Update an existing custom role
   * NOTE: Custom roles functionality not implemented - database tables don't exist
   */
  async updateCustomRole(_roleId: string, _input: UpdateCustomRoleInput): Promise<CustomRole> {
    console.warn('updateCustomRole: Custom roles feature coming soon - database tables do not exist yet')
    throw new Error('Custom roles feature coming soon')
  }

  /**
   * Delete a custom role
   * NOTE: Custom roles functionality not implemented - database tables don't exist
   */
  async deleteCustomRole(_roleId: string): Promise<void> {
    console.warn('deleteCustomRole: Custom roles feature coming soon - database tables do not exist yet')
    throw new Error('Custom roles feature coming soon')
  }

  /**
   * Assign a role to a user
   * NOTE: Role assignment functionality not implemented - database tables don't exist
   */
  async assignRoleToUser(_input: AssignRoleInput): Promise<void> {
    console.warn('assignRoleToUser: Role assignment feature coming soon - database tables do not exist yet')
    throw new Error('Role assignment feature coming soon')
  }

  /**
   * Remove a role from a user
   * NOTE: Role assignment functionality not implemented - database tables don't exist
   */
  async removeRoleFromUser(_userId: string, _roleId: string): Promise<void> {
    console.warn('removeRoleFromUser: Role assignment feature coming soon - database tables do not exist yet')
    throw new Error('Role assignment feature coming soon')
  }

  /**
   * Assign a permission directly to a user
   * NOTE: Permission assignment functionality not implemented - database tables don't exist
   */
  async assignPermissionToUser(_input: AssignPermissionInput): Promise<void> {
    console.warn('assignPermissionToUser: Permission assignment feature coming soon - database tables do not exist yet')
    throw new Error('Permission assignment feature coming soon')
  }

  /**
   * Update a role's permission assignment
   * NOTE: Role permissions functionality not implemented - database tables don't exist
   */
  async updateRolePermission(
    _roleId: string, 
    _permissionId: string, 
    _effect: PermissionEffect | null
  ): Promise<void> {
    console.warn('updateRolePermission: Role permissions feature coming soon - database tables do not exist yet')
    throw new Error('Role permissions feature coming soon')
  }

  /**
   * Get all permission groups
   * NOTE: Permission groups functionality not implemented - database tables don't exist
   */
  async getPermissionGroups(): Promise<PermissionGroup[]> {
    console.warn('getPermissionGroups: Permission groups not implemented yet - returning empty array')
    return []
  }

  /**
   * Create a permission group
   * NOTE: Permission groups functionality not implemented - database tables don't exist
   */
  async createPermissionGroup(_input: CreatePermissionGroupInput): Promise<PermissionGroup> {
    console.warn('createPermissionGroup: Permission groups feature coming soon - database tables do not exist yet')
    throw new Error('Permission groups feature coming soon')
  }

  /**
   * Update a permission group
   * NOTE: Permission groups functionality not implemented - database tables don't exist
   */
  async updatePermissionGroup(
    _groupId: string, 
    _input: UpdatePermissionGroupInput
  ): Promise<PermissionGroup> {
    console.warn('updatePermissionGroup: Permission groups feature coming soon - database tables do not exist yet')
    throw new Error('Permission groups feature coming soon')
  }

  /**
   * Add a user to a permission group
   * NOTE: Permission groups functionality not implemented - database tables don't exist
   */
  async addUserToGroup(_groupId: string, _userId: string): Promise<void> {
    console.warn('addUserToGroup: Permission groups feature coming soon - database tables do not exist yet')
    throw new Error('Permission groups feature coming soon')
  }

  /**
   * Remove a user from a permission group
   * NOTE: Permission groups functionality not implemented - database tables don't exist
   */
  async removeUserFromGroup(_groupId: string, _userId: string): Promise<void> {
    console.warn('removeUserFromGroup: Permission groups feature coming soon - database tables do not exist yet')
    throw new Error('Permission groups feature coming soon')
  }
}

// Export singleton instance
export const permissionService = new PermissionService()