import { useQuery } from '@tanstack/react-query'
import { adminService } from '../services/adminService'
import type { UserFilter } from '../types/admin.types'

export function useUsers(filter?: UserFilter) {
  return useQuery({
    queryKey: ['admin', 'users', filter],
    queryFn: () => adminService.getUsers(filter),
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 2
  })
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminService.getAdminStats(),
    staleTime: 60000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  })
}