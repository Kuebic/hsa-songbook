import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../services/adminService'
import type { RoleAssignment } from '../types/admin.types'

export function useRoleManagement() {
  const queryClient = useQueryClient()

  const assignRoleMutation = useMutation({
    mutationFn: (assignment: RoleAssignment) => adminService.assignRole(assignment),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] })
    },
    onError: (error) => {
      console.error('Failed to assign role:', error)
    }
  })

  const revokeRoleMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) => 
      adminService.revokeRole(userId, reason),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] })
    },
    onError: (error) => {
      console.error('Failed to revoke role:', error)
    }
  })

  return {
    assignRole: assignRoleMutation.mutateAsync,
    revokeRole: revokeRoleMutation.mutateAsync,
    isAssigning: assignRoleMutation.isPending,
    isRevoking: revokeRoleMutation.isPending,
    assignError: assignRoleMutation.error,
    revokeError: revokeRoleMutation.error
  }
}