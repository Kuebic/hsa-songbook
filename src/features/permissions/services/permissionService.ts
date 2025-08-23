import { supabase } from '@/lib/supabase'
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
  DBPermission,
  DBCustomRole,
  DBRolePermission,
  DBUserPermission,
  DBPermissionGroup,
  DBGroupMember,
  DBGroupRole,
  DBUserRole,
  DBUserCustomRole,
  DBRoleInheritance
} from '../types/permission.types'

export class PermissionService {
  /**
   * Get all effective permissions for a user
   */
  async getUserPermissions(userId: string): Promise<UserPermissionSet> {
    try {
      // Get user's roles (both standard and custom)
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (userRolesError) throw userRolesError

      const { data: userCustomRoles, error: userCustomRolesError } = await supabase
        .from('user_custom_roles')
        .select('role_id')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (userCustomRolesError) throw userCustomRolesError

      // Get user's groups
      const { data: userGroups, error: userGroupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)

      if (userGroupsError) throw userGroupsError

      // Get direct user permissions
      const { data: directPermissions, error: directPermissionsError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .or('expires_at.is.null,expires_at.gt.now()')

      if (directPermissionsError) throw directPermissionsError

      // Build the permission set
      const userPermissionSet: UserPermissionSet = {
        userId,
        roles: userRoles?.map(ur => ur.role) || [],
        customRoles: userCustomRoles?.map(ucr => ucr.role_id) || [],
        groups: userGroups?.map(ug => ug.group_id) || [],
        directPermissions: directPermissions?.map(this.mapDBUserPermission) || [],
        effectivePermissions: [], // Will be computed by PermissionResolver
        evaluatedAt: new Date().toISOString()
      }

      return userPermissionSet
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      throw new Error('Failed to fetch user permissions')
    }
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true })
        .order('action', { ascending: true })

      if (error) throw error

      return data?.map(this.mapDBPermission) || []
    } catch (error) {
      console.error('Error fetching permissions:', error)
      throw new Error('Failed to fetch permissions')
    }
  }

  /**
   * Get all custom roles
   */
  async getCustomRoles(): Promise<CustomRole[]> {
    try {
      const { data: roles, error: rolesError } = await supabase
        .from('custom_roles')
        .select(`
          *,
          role_permissions (
            *,
            permission:permissions (*)
          ),
          role_inheritance_child:role_inheritance!child_role_id (
            parent_role_id
          )
        `)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (rolesError) throw rolesError

      return roles?.map(this.mapDBCustomRole) || []
    } catch (error) {
      console.error('Error fetching custom roles:', error)
      throw new Error('Failed to fetch custom roles')
    }
  }

  /**
   * Create a new custom role
   */
  async createCustomRole(input: CreateCustomRoleInput): Promise<CustomRole> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create the role
      const { data: role, error: roleError } = await supabase
        .from('custom_roles')
        .insert({
          name: input.name,
          description: input.description || null,
          created_by: user.id,
          is_system: false,
          is_active: true
        })
        .select()
        .single()

      if (roleError) throw roleError

      // Add permissions to the role
      if (input.permissions.length > 0) {
        const { error: permissionsError } = await supabase
          .from('role_permissions')
          .insert(
            input.permissions.map(p => ({
              role_id: role.id,
              permission_id: p.permissionId,
              effect: p.effect,
              conditions: p.conditions || null,
              resource_id: p.resourceId || null,
              expires_at: p.expiresAt || null
            }))
          )

        if (permissionsError) throw permissionsError
      }

      // Add role inheritance
      if (input.inheritsFrom && input.inheritsFrom.length > 0) {
        const { error: inheritanceError } = await supabase
          .from('role_inheritance')
          .insert(
            input.inheritsFrom.map(parentRoleId => ({
              child_role_id: role.id,
              parent_role_id: parentRoleId
            }))
          )

        if (inheritanceError) throw inheritanceError
      }

      // Fetch the complete role data
      return await this.getCustomRoleById(role.id)
    } catch (error) {
      console.error('Error creating custom role:', error)
      throw new Error('Failed to create custom role')
    }
  }

  /**
   * Update an existing custom role
   */
  async updateCustomRole(roleId: string, input: UpdateCustomRoleInput): Promise<CustomRole> {
    try {
      // Update basic role info
      if (input.name !== undefined || input.description !== undefined || input.isActive !== undefined) {
        const updates: Partial<DBCustomRole> = {}
        if (input.name !== undefined) updates.name = input.name
        if (input.description !== undefined) updates.description = input.description
        if (input.isActive !== undefined) updates.is_active = input.isActive

        const { error: updateError } = await supabase
          .from('custom_roles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', roleId)

        if (updateError) throw updateError
      }

      // Update permissions if provided
      if (input.permissions !== undefined) {
        // Delete existing permissions
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId)

        if (deleteError) throw deleteError

        // Insert new permissions
        if (input.permissions.length > 0) {
          const { error: insertError } = await supabase
            .from('role_permissions')
            .insert(
              input.permissions.map(p => ({
                role_id: roleId,
                permission_id: p.permissionId,
                effect: p.effect,
                conditions: p.conditions || null,
                resource_id: p.resourceId || null,
                expires_at: p.expiresAt || null
              }))
            )

          if (insertError) throw insertError
        }
      }

      // Update inheritance if provided
      if (input.inheritsFrom !== undefined) {
        // Delete existing inheritance
        const { error: deleteInheritanceError } = await supabase
          .from('role_inheritance')
          .delete()
          .eq('child_role_id', roleId)

        if (deleteInheritanceError) throw deleteInheritanceError

        // Insert new inheritance
        if (input.inheritsFrom.length > 0) {
          const { error: insertInheritanceError } = await supabase
            .from('role_inheritance')
            .insert(
              input.inheritsFrom.map(parentRoleId => ({
                child_role_id: roleId,
                parent_role_id: parentRoleId
              }))
            )

          if (insertInheritanceError) throw insertInheritanceError
        }
      }

      // Fetch the updated role
      return await this.getCustomRoleById(roleId)
    } catch (error) {
      console.error('Error updating custom role:', error)
      throw new Error('Failed to update custom role')
    }
  }

  /**
   * Delete a custom role
   */
  async deleteCustomRole(roleId: string): Promise<void> {
    try {
      // Check if role is system role
      const { data: role, error: roleError } = await supabase
        .from('custom_roles')
        .select('is_system')
        .eq('id', roleId)
        .single()

      if (roleError) throw roleError
      if (role.is_system) throw new Error('Cannot delete system role')

      // Soft delete the role
      const { error } = await supabase
        .from('custom_roles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting custom role:', error)
      throw new Error('Failed to delete custom role')
    }
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(input: AssignRoleInput): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('user_custom_roles')
        .insert({
          user_id: input.userId,
          role_id: input.roleId,
          granted_by: user.id,
          granted_at: new Date().toISOString(),
          expires_at: input.expiresAt || null,
          is_active: true
        })

      if (error) throw error
    } catch (error) {
      console.error('Error assigning role to user:', error)
      throw new Error('Failed to assign role to user')
    }
  }

  /**
   * Remove a role from a user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_custom_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_id', roleId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing role from user:', error)
      throw new Error('Failed to remove role from user')
    }
  }

  /**
   * Assign a permission directly to a user
   */
  async assignPermissionToUser(input: AssignPermissionInput): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('user_permissions')
        .insert({
          user_id: input.userId,
          permission_id: input.permissionId,
          effect: input.effect,
          conditions: input.conditions || null,
          resource_id: input.resourceId || null,
          granted_by: user.id,
          granted_at: new Date().toISOString(),
          expires_at: input.expiresAt || null,
          reason: input.reason || null
        })

      if (error) throw error
    } catch (error) {
      console.error('Error assigning permission to user:', error)
      throw new Error('Failed to assign permission to user')
    }
  }

  /**
   * Update a role's permission assignment
   */
  async updateRolePermission(
    roleId: string, 
    permissionId: string, 
    effect: PermissionEffect | null
  ): Promise<void> {
    try {
      if (effect === null) {
        // Remove the permission
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId)
          .eq('permission_id', permissionId)

        if (error) throw error
      } else {
        // Upsert the permission
        const { error } = await supabase
          .from('role_permissions')
          .upsert({
            role_id: roleId,
            permission_id: permissionId,
            effect,
            conditions: null,
            resource_id: null,
            expires_at: null
          }, {
            onConflict: 'role_id,permission_id'
          })

        if (error) throw error
      }
    } catch (error) {
      console.error('Error updating role permission:', error)
      throw new Error('Failed to update role permission')
    }
  }

  /**
   * Get all permission groups
   */
  async getPermissionGroups(): Promise<PermissionGroup[]> {
    try {
      const { data: groups, error } = await supabase
        .from('permission_groups')
        .select(`
          *,
          group_members (user_id),
          group_roles (role_id)
        `)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error

      return groups?.map(this.mapDBPermissionGroup) || []
    } catch (error) {
      console.error('Error fetching permission groups:', error)
      throw new Error('Failed to fetch permission groups')
    }
  }

  /**
   * Create a permission group
   */
  async createPermissionGroup(input: CreatePermissionGroupInput): Promise<PermissionGroup> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('permission_groups')
        .insert({
          name: input.name,
          description: input.description || null,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Add members if provided
      if (input.members && input.members.length > 0) {
        const { error: membersError } = await supabase
          .from('group_members')
          .insert(
            input.members.map(userId => ({
              group_id: group.id,
              user_id: userId,
              added_by: user.id,
              added_at: new Date().toISOString()
            }))
          )

        if (membersError) throw membersError
      }

      // Add roles if provided
      if (input.roles && input.roles.length > 0) {
        const { error: rolesError } = await supabase
          .from('group_roles')
          .insert(
            input.roles.map(roleId => ({
              group_id: group.id,
              role_id: roleId,
              assigned_by: user.id,
              assigned_at: new Date().toISOString()
            }))
          )

        if (rolesError) throw rolesError
      }

      // Fetch the complete group data
      return await this.getPermissionGroupById(group.id)
    } catch (error) {
      console.error('Error creating permission group:', error)
      throw new Error('Failed to create permission group')
    }
  }

  /**
   * Update a permission group
   */
  async updatePermissionGroup(
    groupId: string, 
    input: UpdatePermissionGroupInput
  ): Promise<PermissionGroup> {
    try {
      // Update basic group info
      if (input.name !== undefined || input.description !== undefined || input.isActive !== undefined) {
        const updates: Partial<DBPermissionGroup> = {}
        if (input.name !== undefined) updates.name = input.name
        if (input.description !== undefined) updates.description = input.description
        if (input.isActive !== undefined) updates.is_active = input.isActive

        const { error: updateError } = await supabase
          .from('permission_groups')
          .update(updates)
          .eq('id', groupId)

        if (updateError) throw updateError
      }

      // Update members if provided
      if (input.members !== undefined) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Delete existing members
        const { error: deleteMembersError } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)

        if (deleteMembersError) throw deleteMembersError

        // Insert new members
        if (input.members.length > 0) {
          const { error: insertMembersError } = await supabase
            .from('group_members')
            .insert(
              input.members.map(userId => ({
                group_id: groupId,
                user_id: userId,
                added_by: user.id,
                added_at: new Date().toISOString()
              }))
            )

          if (insertMembersError) throw insertMembersError
        }
      }

      // Update roles if provided
      if (input.roles !== undefined) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Delete existing roles
        const { error: deleteRolesError } = await supabase
          .from('group_roles')
          .delete()
          .eq('group_id', groupId)

        if (deleteRolesError) throw deleteRolesError

        // Insert new roles
        if (input.roles.length > 0) {
          const { error: insertRolesError } = await supabase
            .from('group_roles')
            .insert(
              input.roles.map(roleId => ({
                group_id: groupId,
                role_id: roleId,
                assigned_by: user.id,
                assigned_at: new Date().toISOString()
              }))
            )

          if (insertRolesError) throw insertRolesError
        }
      }

      // Fetch the updated group
      return await this.getPermissionGroupById(groupId)
    } catch (error) {
      console.error('Error updating permission group:', error)
      throw new Error('Failed to update permission group')
    }
  }

  /**
   * Add a user to a permission group
   */
  async addUserToGroup(groupId: string, userId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          added_by: user.id,
          added_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Error adding user to group:', error)
      throw new Error('Failed to add user to group')
    }
  }

  /**
   * Remove a user from a permission group
   */
  async removeUserFromGroup(groupId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing user from group:', error)
      throw new Error('Failed to remove user from group')
    }
  }

  // Helper methods

  private async getCustomRoleById(roleId: string): Promise<CustomRole> {
    const { data, error } = await supabase
      .from('custom_roles')
      .select(`
        *,
        role_permissions (
          *,
          permission:permissions (*)
        ),
        role_inheritance_child:role_inheritance!child_role_id (
          parent_role_id
        )
      `)
      .eq('id', roleId)
      .single()

    if (error) throw error
    return this.mapDBCustomRole(data)
  }

  private async getPermissionGroupById(groupId: string): Promise<PermissionGroup> {
    const { data, error } = await supabase
      .from('permission_groups')
      .select(`
        *,
        group_members (user_id),
        group_roles (role_id)
      `)
      .eq('id', groupId)
      .single()

    if (error) throw error
    return this.mapDBPermissionGroup(data)
  }

  private mapDBPermission(dbPermission: DBPermission): Permission {
    return {
      id: dbPermission.id,
      name: dbPermission.name,
      resource: dbPermission.resource as any,
      action: dbPermission.action as any,
      scope: dbPermission.scope as any,
      description: dbPermission.description || undefined
    }
  }

  private mapDBCustomRole(dbRole: any): CustomRole {
    return {
      id: dbRole.id,
      name: dbRole.name,
      description: dbRole.description || undefined,
      permissions: dbRole.role_permissions?.map((rp: any) => ({
        permissionId: rp.permission_id,
        effect: rp.effect,
        conditions: rp.conditions || undefined,
        resourceId: rp.resource_id || undefined,
        expiresAt: rp.expires_at || undefined
      })) || [],
      inheritsFrom: dbRole.role_inheritance_child?.map((ri: any) => ri.parent_role_id) || undefined,
      createdBy: dbRole.created_by,
      createdAt: dbRole.created_at,
      updatedAt: dbRole.updated_at || undefined,
      isSystem: dbRole.is_system,
      isActive: dbRole.is_active
    }
  }

  private mapDBUserPermission(dbPermission: DBUserPermission) {
    return {
      permissionId: dbPermission.permission_id,
      effect: dbPermission.effect as PermissionEffect,
      conditions: dbPermission.conditions || undefined,
      resourceId: dbPermission.resource_id || undefined,
      expiresAt: dbPermission.expires_at || undefined
    }
  }

  private mapDBPermissionGroup(dbGroup: any): PermissionGroup {
    return {
      id: dbGroup.id,
      name: dbGroup.name,
      description: dbGroup.description || undefined,
      members: dbGroup.group_members?.map((gm: any) => gm.user_id) || [],
      roles: dbGroup.group_roles?.map((gr: any) => gr.role_id) || [],
      createdBy: dbGroup.created_by,
      createdAt: dbGroup.created_at,
      isActive: dbGroup.is_active
    }
  }
}

// Export singleton instance
export const permissionService = new PermissionService()