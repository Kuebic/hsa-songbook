import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/features/auth'
import { PermissionResolver, PermissionCache } from '../utils'
import { permissionService } from '../services/permissionService'
import type {
  UserPermissionSet,
  PermissionAction,
  ResourceType
} from '../types/permission.types'

// const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes - unused for now
const BACKGROUND_REFRESH_INTERVAL = 30 * 60 * 1000 // 30 minutes

export interface UsePermissionsReturn {
  // State
  permissions: UserPermissionSet | null
  isLoading: boolean
  error: string | null
  
  // Permission checking methods
  hasPermission: (resource: ResourceType, action: PermissionAction, resourceId?: string) => boolean
  canEdit: (resource: ResourceType, resourceId?: string) => boolean
  canDelete: (resource: ResourceType, resourceId?: string) => boolean
  canModerate: (resource: ResourceType, resourceId?: string) => boolean
  canAdmin: () => boolean
  
  // Cache management
  refreshPermissions: () => Promise<void>
  clearCache: () => void
}

export function usePermissions(): UsePermissionsReturn {
  const { userId, userRole, isSignedIn, isLoaded } = useAuth()
  
  const [permissions, setPermissions] = useState<UserPermissionSet | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const permissionResolver = useRef<PermissionResolver | null>(null)
  const permissionCache = useRef<PermissionCache | null>(null)
  const backgroundRefreshTimer = useRef<NodeJS.Timeout | null>(null)

  // Initialize resolver and cache
  useEffect(() => {
    if (!permissionResolver.current) {
      permissionResolver.current = new PermissionResolver()
    }
    if (!permissionCache.current) {
      permissionCache.current = new PermissionCache()
    }
  }, [])

  // Load permissions
  const loadPermissions = useCallback(async (useCache = true) => {
    if (!userId || !isSignedIn) {
      setPermissions(null)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Try to get from cache first if requested
      if (useCache && permissionCache.current) {
        const cachedPermissions = permissionCache.current.getUserPermissions(userId)
        if (cachedPermissions) {
          setPermissions(cachedPermissions)
          setIsLoading(false)
          return
        }
      }

      // Fetch from service
      const userPermissions = await permissionService.getUserPermissions(userId)
      
      // Get all available permissions for resolution
      const allPermissions = await permissionService.getAllPermissions()
      
      // Resolve effective permissions
      if (permissionResolver.current) {
        const resolvedPermissions = await permissionResolver.current.resolvePermissions(
          userPermissions,
          allPermissions
        )
        
        userPermissions.effectivePermissions = resolvedPermissions
      }
      
      // Cache the result
      if (permissionCache.current) {
        permissionCache.current.setUserPermissions(userId, userPermissions)
      }
      
      setPermissions(userPermissions)
    } catch (err) {
      console.error('Error loading permissions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load permissions')
      
      // Fall back to basic role-based permissions
      if (userRole && userId) {
        const fallbackPermissions: UserPermissionSet = {
          userId,
          roles: [userRole],
          customRoles: [],
          groups: [],
          directPermissions: [],
          effectivePermissions: [],
          evaluatedAt: new Date().toISOString()
        }
        setPermissions(fallbackPermissions)
      }
    } finally {
      setIsLoading(false)
    }
  }, [userId, userRole, isSignedIn])

  // Initial load
  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      loadPermissions()
    } else if (isLoaded && !isSignedIn) {
      setPermissions(null)
      setError(null)
    }
  }, [loadPermissions, isLoaded, isSignedIn, userId])

  // Set up background refresh
  useEffect(() => {
    if (permissions && userId) {
      // Clear existing timer
      if (backgroundRefreshTimer.current) {
        clearTimeout(backgroundRefreshTimer.current)
      }
      
      // Set up new timer for background refresh
      backgroundRefreshTimer.current = setTimeout(() => {
        loadPermissions(false) // Force refresh from server
      }, BACKGROUND_REFRESH_INTERVAL)
    }

    return () => {
      if (backgroundRefreshTimer.current) {
        clearTimeout(backgroundRefreshTimer.current)
      }
    }
  }, [permissions, userId, loadPermissions])

  // Manual refresh
  const refreshPermissions = useCallback(async () => {
    await loadPermissions(false)
  }, [loadPermissions])

  // Clear cache
  const clearCache = useCallback(() => {
    if (permissionCache.current && userId) {
      permissionCache.current.clearUserCache(userId)
    }
  }, [userId])

  // Permission checking methods
  const hasPermission = useCallback((
    resource: ResourceType, 
    action: PermissionAction, 
    resourceId?: string
  ): boolean => {
    if (!permissions || !permissionResolver.current) {
      // Fall back to basic role-based checks
      return hasBasicPermission(userRole, resource, action)
    }

    try {
      const result = permissionResolver.current.checkPermission(
        permissions.effectivePermissions,
        resource,
        action,
        resourceId
      )
      return result.allowed
    } catch (err) {
      console.warn('Permission check failed, falling back to role-based:', err)
      return hasBasicPermission(userRole, resource, action)
    }
  }, [permissions, userRole])

  const canEdit = useCallback((resource: ResourceType, resourceId?: string): boolean => {
    return hasPermission(resource, 'update', resourceId)
  }, [hasPermission])

  const canDelete = useCallback((resource: ResourceType, resourceId?: string): boolean => {
    return hasPermission(resource, 'delete', resourceId)
  }, [hasPermission])

  const canModerate = useCallback((resource: ResourceType, resourceId?: string): boolean => {
    return hasPermission(resource, 'approve', resourceId) || 
           hasPermission(resource, 'reject', resourceId) ||
           hasPermission(resource, 'flag', resourceId)
  }, [hasPermission])

  const canAdmin = useCallback((): boolean => {
    return hasPermission('system', 'assign_role') ||
           hasPermission('user', 'assign_role') ||
           userRole === 'admin'
  }, [hasPermission, userRole])

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    canEdit,
    canDelete,
    canModerate,
    canAdmin,
    refreshPermissions,
    clearCache
  }
}

// Fallback role-based permission checking
function hasBasicPermission(
  userRole: string | undefined, 
  resource: ResourceType, 
  action: PermissionAction
): boolean {
  if (!userRole) return false

  switch (userRole) {
    case 'admin':
      return true // Admin has all permissions
    
    case 'moderator':
      return (
        // Moderators can read everything
        action === 'read' ||
        // Can moderate content
        (resource === 'song' || resource === 'arrangement') && 
        ['approve', 'reject', 'flag', 'update'].includes(action) ||
        // Can manage users (limited)
        resource === 'user' && ['read', 'update'].includes(action)
      )
    
    case 'contributor':
      return (
        // Contributors can read everything
        action === 'read' ||
        // Can create and edit their own content
        (resource === 'song' || resource === 'arrangement' || resource === 'setlist') &&
        ['create', 'update', 'delete'].includes(action)
      )
    
    case 'user':
    default:
      return (
        // Regular users can read public content
        action === 'read' ||
        // Can manage their own setlists
        resource === 'setlist' && ['create', 'update', 'delete'].includes(action)
      )
  }
}

// Export the hook as default
export default usePermissions