import type {
  UserPermissionSet,
  ResolvedPermission,
  PermissionAssignment,
  PermissionCondition,
  PermissionCheckResult,
  ResourceType,
  PermissionAction,
  PermissionScope,
  PermissionEffect,
  CustomRole,
  PermissionGroup
} from '../types/permission.types'

interface PermissionContext {
  userId: string
  resource?: any
  timestamp?: string
}

interface PermissionSource {
  type: 'direct' | 'role' | 'inherited' | 'group'
  sourceId?: string
  priority: number
}

/**
 * PermissionResolver handles the complex logic of merging permissions from different sources
 * and resolving conflicts according to priority rules.
 */
export class PermissionResolver {
  private static readonly PRIORITY_MAP = {
    direct: 1000,    // Direct user permissions have highest priority
    role: 800,       // Role-based permissions
    group: 600,      // Group permissions
    inherited: 400   // Inherited permissions have lowest priority
  } as const

  /**
   * Resolves all permissions for a user from multiple sources
   */
  public static resolvePermissions(
    userId: string,
    directPermissions: PermissionAssignment[],
    roles: CustomRole[],
    groups: PermissionGroup[],
    context: PermissionContext = { userId }
  ): ResolvedPermission[] {
    const permissions: ResolvedPermission[] = []

    // 1. Add direct permissions (highest priority)
    permissions.push(
      ...this.processDirectPermissions(directPermissions, context)
    )

    // 2. Add role permissions
    permissions.push(
      ...this.processRolePermissions(roles, context)
    )

    // 3. Add group permissions
    permissions.push(
      ...this.processGroupPermissions(groups, context)
    )

    // 4. Add inherited permissions (from parent roles)
    permissions.push(
      ...this.processInheritedPermissions(roles, context)
    )

    // 5. Process and sort by priority
    return this.processPermissions(permissions)
  }

  /**
   * Process permissions with priority handling and conflict resolution
   */
  private static processPermissions(permissions: ResolvedPermission[]): ResolvedPermission[] {
    // Group permissions by resource + action + scope + resourceId
    const permissionMap = new Map<string, ResolvedPermission[]>()

    for (const permission of permissions) {
      const key = `${permission.resource}:${permission.action}:${permission.scope}:${permission.resourceId || 'global'}`
      
      if (!permissionMap.has(key)) {
        permissionMap.set(key, [])
      }
      permissionMap.get(key)!.push(permission)
    }

    // Resolve conflicts for each permission group
    const resolvedPermissions: ResolvedPermission[] = []

    for (const [, permissionGroup] of permissionMap) {
      const resolved = this.resolveConflicts(permissionGroup)
      if (resolved) {
        resolvedPermissions.push(resolved)
      }
    }

    return resolvedPermissions.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Resolve conflicts between permissions of the same type
   * Priority order: direct > role > group > inherited
   * Within same priority: deny > allow, specific > general
   */
  private static resolveConflicts(permissions: ResolvedPermission[]): ResolvedPermission | null {
    if (permissions.length === 0) return null
    if (permissions.length === 1) return permissions[0]

    // Sort by priority (highest first)
    const sorted = [...permissions].sort((a, b) => {
      // First by source priority
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }

      // Within same priority: deny > allow
      if (a.effect !== b.effect) {
        return a.effect === 'deny' ? -1 : 1
      }

      // Within same effect: specific > general
      const aSpecificity = this.getSpecificity(a)
      const bSpecificity = this.getSpecificity(b)
      return bSpecificity - aSpecificity
    })

    return sorted[0]
  }

  /**
   * Calculate specificity score for a permission
   */
  private static getSpecificity(permission: ResolvedPermission): number {
    let score = 0
    
    // Resource-specific permissions are more specific
    if (permission.resourceId) score += 100
    
    // Scope specificity: resource > own > type > global
    switch (permission.scope) {
      case 'resource': score += 30; break
      case 'own': score += 20; break
      case 'type': score += 10; break
      case 'global': score += 0; break
    }

    return score
  }

  /**
   * Check if a user has a specific permission
   */
  public static checkPermission(
    resolvedPermissions: ResolvedPermission[],
    resource: ResourceType,
    action: PermissionAction,
    context: PermissionContext,
    resourceId?: string,
    scope?: PermissionScope
  ): PermissionCheckResult {
    // Find matching permissions in order of specificity
    const candidates = resolvedPermissions.filter(p => 
      p.resource === resource && 
      p.action === action &&
      (!scope || p.scope === scope) &&
      this.matchesScope(p, context, resourceId)
    )

    if (candidates.length === 0) {
      return {
        allowed: false,
        reason: `No permission found for ${action} on ${resource}`
      }
    }

    // Sort by specificity and priority
    const sorted = candidates.sort((a, b) => {
      const aSpecificity = this.getSpecificity(a)
      const bSpecificity = this.getSpecificity(b)
      if (aSpecificity !== bSpecificity) {
        return bSpecificity - aSpecificity
      }
      return b.priority - a.priority
    })

    const matchedPermission = sorted[0]
    const deniedBy = sorted.find(p => p.effect === 'deny')

    if (matchedPermission.effect === 'allow') {
      return {
        allowed: true,
        matchedPermission,
        deniedBy
      }
    } else {
      return {
        allowed: false,
        reason: `Permission explicitly denied by ${matchedPermission.source}`,
        deniedBy: matchedPermission
      }
    }
  }

  /**
   * Check if a permission matches the given scope and context
   */
  private static matchesScope(
    permission: ResolvedPermission,
    context: PermissionContext,
    resourceId?: string
  ): boolean {
    switch (permission.scope) {
      case 'global':
        return true
      
      case 'type':
        return true
      
      case 'resource':
        return permission.resourceId === resourceId
      
      case 'own':
        // For 'own' scope, we need to check if the user owns the resource
        // This would typically require additional context about the resource
        return context.resource?.createdBy === context.userId ||
               context.resource?.ownerId === context.userId ||
               context.resource?.userId === context.userId
      
      default:
        return false
    }
  }

  /**
   * Evaluate conditional permissions
   */
  public static evaluateConditions(
    conditions: PermissionCondition[],
    context: PermissionContext
  ): boolean {
    if (!conditions || conditions.length === 0) return true

    return conditions.every(condition => {
      const contextValue = this.getContextValue(condition.field, context)
      return this.evaluateCondition(condition, contextValue)
    })
  }

  /**
   * Evaluate a single condition
   */
  private static evaluateCondition(condition: PermissionCondition, contextValue: any): boolean {
    const { operator, value } = condition

    switch (operator) {
      case 'eq':
        return contextValue === value
      
      case 'neq':
        return contextValue !== value
      
      case 'in':
        return Array.isArray(value) && value.includes(contextValue)
      
      case 'contains':
        if (typeof contextValue === 'string' && typeof value === 'string') {
          return contextValue.includes(value)
        }
        if (Array.isArray(contextValue)) {
          return contextValue.includes(value)
        }
        return false
      
      case 'gt':
        return Number(contextValue) > Number(value)
      
      case 'lt':
        return Number(contextValue) < Number(value)
      
      default:
        return false
    }
  }

  /**
   * Get context value for condition evaluation
   */
  private static getContextValue(field: string, context: PermissionContext): any {
    // Handle nested field access (e.g., 'resource.status')
    const parts = field.split('.')
    let value: any = context

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part]
      } else {
        return undefined
      }
    }

    return value
  }

  /**
   * Process direct user permissions
   */
  private static processDirectPermissions(
    permissions: PermissionAssignment[],
    context: PermissionContext
  ): ResolvedPermission[] {
    return permissions
      .filter(p => this.isPermissionActive(p))
      .filter(p => this.evaluateConditions(p.conditions || [], context))
      .map(p => this.assignmentToResolved(p, 'direct', this.PRIORITY_MAP.direct))
  }

  /**
   * Process role-based permissions
   */
  private static processRolePermissions(
    roles: CustomRole[],
    context: PermissionContext
  ): ResolvedPermission[] {
    const permissions: ResolvedPermission[] = []

    for (const role of roles.filter(r => r.isActive)) {
      for (const assignment of role.permissions) {
        if (this.isPermissionActive(assignment) &&
            this.evaluateConditions(assignment.conditions || [], context)) {
          permissions.push(
            this.assignmentToResolved(assignment, 'role', this.PRIORITY_MAP.role, role.id)
          )
        }
      }
    }

    return permissions
  }

  /**
   * Process group permissions
   */
  private static processGroupPermissions(
    groups: PermissionGroup[],
    context: PermissionContext
  ): ResolvedPermission[] {
    const permissions: ResolvedPermission[] = []

    for (const group of groups.filter(g => g.isActive)) {
      // Group permissions come from roles assigned to the group
      // This would need to be expanded based on your group permission model
      // For now, we'll return empty array as the implementation depends on
      // how group permissions are structured in your system
    }

    return permissions
  }

  /**
   * Process inherited permissions from parent roles
   */
  private static processInheritedPermissions(
    roles: CustomRole[],
    context: PermissionContext
  ): ResolvedPermission[] {
    const permissions: ResolvedPermission[] = []

    // This would need a way to resolve parent roles
    // For now, we'll return empty array as this requires additional role hierarchy data

    return permissions
  }

  /**
   * Check if a permission assignment is currently active
   */
  private static isPermissionActive(assignment: PermissionAssignment): boolean {
    if (!assignment.expiresAt) return true
    
    const now = new Date()
    const expiresAt = new Date(assignment.expiresAt)
    return now < expiresAt
  }

  /**
   * Convert a PermissionAssignment to ResolvedPermission
   */
  private static assignmentToResolved(
    assignment: PermissionAssignment,
    source: ResolvedPermission['source'],
    priority: number,
    sourceId?: string
  ): ResolvedPermission {
    // This is a simplified version - in a real implementation,
    // you'd need to resolve the permission details from the permissionId
    return {
      resource: 'song' as ResourceType, // This should be resolved from permissionId
      action: 'read' as PermissionAction, // This should be resolved from permissionId
      effect: assignment.effect,
      scope: 'global' as PermissionScope, // This should be resolved from permissionId
      resourceId: assignment.resourceId,
      source,
      priority
    }
  }
}