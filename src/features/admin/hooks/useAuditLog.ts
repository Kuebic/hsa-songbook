import { useQuery } from '@tanstack/react-query'
import { adminService } from '../services/adminService'

export function useAuditLog(userId?: string) {
  return useQuery({
    queryKey: ['admin', 'audit', userId || 'all'],
    queryFn: () => adminService.getAuditLog(userId),
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  })
}