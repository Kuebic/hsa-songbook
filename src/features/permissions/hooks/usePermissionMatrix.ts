import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permissionService } from '../services/permissionService'
import { useNotification } from '../../../shared/components/notifications'
import type {
  Permission,
  CustomRole,
  PermissionMatrix,
  PermissionEffect
} from '../types/permission.types'

interface PermissionChange {
  roleId: string
  permissionId: string
  effect: PermissionEffect | null
  originalEffect?: PermissionEffect | null
}

interface UsePermissionMatrixReturn {
  // Matrix data
  matrix: PermissionMatrix | null
  isLoading: boolean
  error: Error | null
  
  // Pending changes
  pendingChanges: PermissionChange[]
  hasUnsavedChanges: boolean
  
  // Actions
  updatePermission: (roleId: string, permissionId: string, effect: PermissionEffect | null) => void
  saveChanges: () => Promise<void>
  discardChanges: () => void
  resetMatrix: () => void
  
  // Mutation state
  isSaving: boolean
  saveError: Error | null
  
  // Helper methods
  getPermissionEffect: (roleId: string, permissionId: string) => PermissionEffect | null
  isPermissionPending: (roleId: string, permissionId: string) => boolean
  getOriginalEffect: (roleId: string, permissionId: string) => PermissionEffect | null
}

const QUERY_KEYS = {
  matrix: ['permissions', 'matrix'],
  customRoles: ['permissions', 'customRoles'],
  permissions: ['permissions', 'allPermissions']
}

export function usePermissionMatrix(): UsePermissionMatrixReturn {
  const queryClient = useQueryClient()
  const { addNotification } = useNotification()
  
  // State for pending changes
  const [pendingChanges, setPendingChanges] = useState<PermissionChange[]>([])
  
  // Load both roles and permissions
  const { 
    data: roles = [], 
    error: rolesError,
    isLoading: rolesLoading
  } = useQuery({
    queryKey: QUERY_KEYS.customRoles,
    queryFn: () => permissionService.getCustomRoles(),
    staleTime: 5 * 60 * 1000
  })

  const { 
    data: permissions = [], 
    error: permissionsError,
    isLoading: permissionsLoading
  } = useQuery({
    queryKey: QUERY_KEYS.permissions,
    queryFn: () => permissionService.getAllPermissions(),
    staleTime: 10 * 60 * 1000 // Permissions change less frequently
  })

  // Build the matrix
  const matrix = buildMatrix(roles, permissions)
  const isLoading = rolesLoading || permissionsLoading
  const error = rolesError || permissionsError

  // Update permission locally (adds to pending changes)
  const updatePermission = useCallback((
    roleId: string, 
    permissionId: string, 
    effect: PermissionEffect | null
  ) => {
    setPendingChanges(prev => {
      // Remove any existing change for this role-permission combination
      const filtered = prev.filter(
        change => !(change.roleId === roleId && change.permissionId === permissionId)
      )
      
      // Get the original effect from the matrix
      const originalEffect = getOriginalEffectFromMatrix(matrix, roleId, permissionId)
      
      // Only add if different from original
      if (effect !== originalEffect) {
        return [...filtered, {
          roleId,
          permissionId,
          effect,
          originalEffect
        }]
      }
      
      return filtered
    })
  }, [matrix])

  // Get current effect for a role-permission combination (including pending changes)
  const getPermissionEffect = useCallback((roleId: string, permissionId: string): PermissionEffect | null => {
    // Check if there's a pending change
    const pendingChange = pendingChanges.find(
      change => change.roleId === roleId && change.permissionId === permissionId
    )
    
    if (pendingChange) {
      return pendingChange.effect
    }
    
    // Fall back to matrix
    return getOriginalEffectFromMatrix(matrix, roleId, permissionId)
  }, [pendingChanges, matrix])

  // Check if a permission has pending changes
  const isPermissionPending = useCallback((roleId: string, permissionId: string): boolean => {
    return pendingChanges.some(
      change => change.roleId === roleId && change.permissionId === permissionId
    )
  }, [pendingChanges])

  // Get the original effect from the matrix (before any pending changes)
  const getOriginalEffect = useCallback((roleId: string, permissionId: string): PermissionEffect | null => {
    return getOriginalEffectFromMatrix(matrix, roleId, permissionId)
  }, [matrix])

  // Mutation for saving changes
  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      // Apply all pending changes
      const promises = pendingChanges.map(change => 
        permissionService.updateRolePermission(change.roleId, change.permissionId, change.effect)
      )
      
      await Promise.all(promises)
      return pendingChanges.length
    },
    onSuccess: (changeCount) => {
      // Clear pending changes
      setPendingChanges([])
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customRoles })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      
      addNotification({
        type: 'success',
        title: 'Changes Saved',
        message: `${changeCount} permission ${changeCount === 1 ? 'change' : 'changes'} saved successfully.`
      })
    },
    onError: (error: Error) => {
      console.error('Failed to save permission changes:', error)
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: error.message || 'Failed to save permission changes. Please try again.'
      })
    }
  })

  // Save all pending changes
  const saveChanges = useCallback(async (): Promise<void> => {
    if (pendingChanges.length === 0) {
      addNotification({
        type: 'info',
        title: 'No Changes',
        message: 'There are no pending changes to save.'
      })
      return
    }
    
    await saveChangesMutation.mutateAsync()
    return
  }, [pendingChanges, saveChangesMutation])

  // Discard all pending changes
  const discardChanges = useCallback(() => {
    if (pendingChanges.length === 0) return
    
    setPendingChanges([])
    addNotification({
      type: 'info',
      title: 'Changes Discarded',
      message: 'All pending changes have been discarded.'
    })
  }, [pendingChanges, addNotification])

  // Reset matrix (clear pending changes and refetch data)
  const resetMatrix = useCallback(() => {
    setPendingChanges([])
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customRoles })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.permissions })
  }, [queryClient])

  // Warn about unsaved changes when leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChanges.length > 0) {
        e.preventDefault()
        e.returnValue = 'You have unsaved permission changes. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pendingChanges.length])

  return {
    // Matrix data
    matrix,
    isLoading,
    error,
    
    // Pending changes
    pendingChanges,
    hasUnsavedChanges: pendingChanges.length > 0,
    
    // Actions
    updatePermission,
    saveChanges,
    discardChanges,
    resetMatrix,
    
    // Mutation state
    isSaving: saveChangesMutation.isPending,
    saveError: saveChangesMutation.error,
    
    // Helper methods
    getPermissionEffect,
    isPermissionPending,
    getOriginalEffect
  }
}

// Helper functions

function buildMatrix(roles: CustomRole[], permissions: Permission[]): PermissionMatrix {
  const assignments = new Map<string, Map<string, PermissionEffect>>()
  
  // Build the assignment map
  roles.forEach(role => {
    const rolePermissions = new Map<string, PermissionEffect>()
    
    role.permissions.forEach(assignment => {
      rolePermissions.set(assignment.permissionId, assignment.effect)
    })
    
    assignments.set(role.id, rolePermissions)
  })
  
  return {
    roles,
    permissions,
    assignments
  }
}

function getOriginalEffectFromMatrix(
  matrix: PermissionMatrix | null, 
  roleId: string, 
  permissionId: string
): PermissionEffect | null {
  if (!matrix) return null
  
  const rolePermissions = matrix.assignments.get(roleId)
  if (!rolePermissions) return null
  
  return rolePermissions.get(permissionId) || null
}

export type { UsePermissionMatrixReturn }
export default usePermissionMatrix