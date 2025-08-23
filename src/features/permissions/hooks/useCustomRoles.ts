import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permissionService } from '../services/permissionService'
import { useNotification } from '@/shared/components/notifications'
import type {
  CustomRole,
  CreateCustomRoleInput,
  UpdateCustomRoleInput,
  PermissionEffect
} from '../types/permission.types'

const QUERY_KEYS = {
  customRoles: ['permissions', 'customRoles'],
  customRole: (roleId: string) => ['permissions', 'customRoles', roleId],
  permissions: ['permissions', 'allPermissions']
}

export interface UseCustomRolesReturn {
  // Query state
  roles: CustomRole[]
  isLoading: boolean
  error: Error | null
  
  // Mutations
  createRole: (input: CreateCustomRoleInput) => Promise<CustomRole>
  updateRole: (roleId: string, input: UpdateCustomRoleInput) => Promise<CustomRole>
  deleteRole: (roleId: string) => Promise<void>
  updateRolePermission: (roleId: string, permissionId: string, effect: PermissionEffect | null) => Promise<void>
  
  // Mutation state
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isUpdatingPermission: boolean
  
  // Errors
  createError: Error | null
  updateError: Error | null
  deleteError: Error | null
  permissionError: Error | null
  
  // Actions
  refetch: () => Promise<any>
  invalidateRoles: () => void
}

export function useCustomRoles(): UseCustomRolesReturn {
  const queryClient = useQueryClient()
  const { showNotification } = useNotification()

  // Query for all custom roles
  const {
    data: roles = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.customRoles,
    queryFn: () => permissionService.getCustomRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('authentication') || error?.message?.includes('unauthorized')) {
        return false
      }
      return failureCount < 2
    }
  })

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (input: CreateCustomRoleInput) => permissionService.createCustomRole(input),
    onSuccess: (newRole) => {
      // Update the cache with optimistic update
      queryClient.setQueryData<CustomRole[]>(QUERY_KEYS.customRoles, (old = []) => {
        return [...old, newRole]
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      
      showNotification({
        type: 'success',
        title: 'Role Created',
        message: `Custom role "${newRole.name}" has been created successfully.`
      })
    },
    onError: (error: Error) => {
      console.error('Failed to create custom role:', error)
      showNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error.message || 'Failed to create custom role. Please try again.'
      })
    }
  })

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, input }: { roleId: string; input: UpdateCustomRoleInput }) =>
      permissionService.updateCustomRole(roleId, input),
    onMutate: async ({ roleId, input }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.customRoles })
      
      // Snapshot the previous value
      const previousRoles = queryClient.getQueryData<CustomRole[]>(QUERY_KEYS.customRoles)
      
      // Optimistically update the cache
      if (previousRoles) {
        queryClient.setQueryData<CustomRole[]>(QUERY_KEYS.customRoles, (old = []) => {
          return old.map(role => 
            role.id === roleId 
              ? { 
                  ...role, 
                  ...input,
                  updatedAt: new Date().toISOString()
                }
              : role
          )
        })
      }
      
      // Return a context with the previous and new data
      return { previousRoles }
    },
    onSuccess: (updatedRole) => {
      // Update the cache with the actual response
      queryClient.setQueryData<CustomRole[]>(QUERY_KEYS.customRoles, (old = []) => {
        return old.map(role => role.id === updatedRole.id ? updatedRole : role)
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      
      showNotification({
        type: 'success',
        title: 'Role Updated',
        message: `Custom role "${updatedRole.name}" has been updated successfully.`
      })
    },
    onError: (error: Error, _variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousRoles) {
        queryClient.setQueryData(QUERY_KEYS.customRoles, context.previousRoles)
      }
      
      console.error('Failed to update custom role:', error)
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update custom role. Please try again.'
      })
    }
  })

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => permissionService.deleteCustomRole(roleId),
    onMutate: async (roleId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.customRoles })
      
      // Snapshot the previous value
      const previousRoles = queryClient.getQueryData<CustomRole[]>(QUERY_KEYS.customRoles)
      
      // Optimistically remove the role from the cache
      queryClient.setQueryData<CustomRole[]>(QUERY_KEYS.customRoles, (old = []) => {
        return old.filter(role => role.id !== roleId)
      })
      
      // Return a context with the previous data
      return { previousRoles, roleId }
    },
    onSuccess: (_, roleId) => {
      // Ensure the role is removed from cache
      queryClient.setQueryData<CustomRole[]>(QUERY_KEYS.customRoles, (old = []) => {
        return old.filter(role => role.id !== roleId)
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      
      showNotification({
        type: 'success',
        title: 'Role Deleted',
        message: 'Custom role has been deleted successfully.'
      })
    },
    onError: (error: Error, _roleId, context) => {
      // Rollback optimistic update on error
      if (context?.previousRoles) {
        queryClient.setQueryData(QUERY_KEYS.customRoles, context.previousRoles)
      }
      
      console.error('Failed to delete custom role:', error)
      showNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error.message || 'Failed to delete custom role. Please try again.'
      })
    }
  })

  // Update role permission mutation
  const updateRolePermissionMutation = useMutation({
    mutationFn: ({ 
      roleId, 
      permissionId, 
      effect 
    }: { 
      roleId: string; 
      permissionId: string; 
      effect: PermissionEffect | null 
    }) => permissionService.updateRolePermission(roleId, permissionId, effect),
    onMutate: async ({ roleId, permissionId, effect }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.customRoles })
      
      // Snapshot the previous value
      const previousRoles = queryClient.getQueryData<CustomRole[]>(QUERY_KEYS.customRoles)
      
      // Optimistically update the cache
      if (previousRoles) {
        queryClient.setQueryData<CustomRole[]>(QUERY_KEYS.customRoles, (old = []) => {
          return old.map(role => {
            if (role.id === roleId) {
              const updatedPermissions = role.permissions.filter(p => p.permissionId !== permissionId)
              if (effect !== null) {
                updatedPermissions.push({
                  permissionId,
                  effect
                })
              }
              return {
                ...role,
                permissions: updatedPermissions,
                updatedAt: new Date().toISOString()
              }
            }
            return role
          })
        })
      }
      
      // Return a context with the previous data
      return { previousRoles }
    },
    onSuccess: () => {
      // Invalidate to fetch fresh data from server
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customRoles })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      
      showNotification({
        type: 'success',
        title: 'Permission Updated',
        message: 'Role permission has been updated successfully.'
      })
    },
    onError: (error: Error, _variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousRoles) {
        queryClient.setQueryData(QUERY_KEYS.customRoles, context.previousRoles)
      }
      
      console.error('Failed to update role permission:', error)
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update role permission. Please try again.'
      })
    }
  })

  // Utility function to invalidate role queries
  const invalidateRoles = () => {
    queryClient.invalidateQueries({ queryKey: ['permissions'] })
  }

  return {
    // Query state
    roles,
    isLoading,
    error,
    
    // Mutations
    createRole: createRoleMutation.mutateAsync,
    updateRole: ({ roleId, input }: { roleId: string; input: UpdateCustomRoleInput }) => 
      updateRoleMutation.mutateAsync({ roleId, input }),
    deleteRole: deleteRoleMutation.mutateAsync,
    updateRolePermission: (roleId: string, permissionId: string, effect: PermissionEffect | null) =>
      updateRolePermissionMutation.mutateAsync({ roleId, permissionId, effect }),
    
    // Mutation state
    isCreating: createRoleMutation.isPending,
    isUpdating: updateRoleMutation.isPending,
    isDeleting: deleteRoleMutation.isPending,
    isUpdatingPermission: updateRolePermissionMutation.isPending,
    
    // Errors
    createError: createRoleMutation.error,
    updateError: updateRoleMutation.error,
    deleteError: deleteRoleMutation.error,
    permissionError: updateRolePermissionMutation.error,
    
    // Actions
    refetch,
    invalidateRoles
  }
}

export default useCustomRoles