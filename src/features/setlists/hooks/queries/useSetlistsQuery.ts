import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { useAuth } from '@features/auth'
import { setlistService } from '../../services/setlistService'
import type { SetlistFilters } from '../../types/setlist.types'

// Query key factory
export const setlistKeys = {
  all: ['setlists'] as const,
  lists: () => [...setlistKeys.all, 'list'] as const,
  list: (filters: string) => [...setlistKeys.lists(), { filters }] as const,
  details: () => [...setlistKeys.all, 'detail'] as const,
  detail: (id: string) => [...setlistKeys.details(), id] as const,
  public: (shareId: string) => [...setlistKeys.all, 'public', shareId] as const,
}

// Get user's setlists
export function useSetlists(filters?: SetlistFilters) {
  return useQuery({
    queryKey: setlistKeys.list(JSON.stringify(filters || {})),
    queryFn: async () => {
      return setlistService.getSetlists(filters)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get single setlist
export function useSetlist(id: string) {
  const { getToken } = useAuth()
  
  return useQuery({
    queryKey: setlistKeys.detail(id),
    queryFn: async () => {
      const token = await getToken()
      return setlistService.getSetlist(id, token || undefined)
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get public setlist by shareId
export function usePublicSetlist(shareId: string) {
  return useQuery({
    queryKey: setlistKeys.public(shareId),
    queryFn: () => setlistService.getPublicSetlist(shareId),
    enabled: !!shareId,
    staleTime: 10 * 60 * 1000, // 10 minutes for public data
    retry: (failureCount, error: unknown) => {
      const errorCode = (error as { statusCode?: number })?.statusCode
      if (errorCode === 404) return false
      return failureCount < 3
    },
  })
}

// Infinite scrolling for large collections
export function useInfiniteSetlists(filters?: SetlistFilters) {
  return useInfiniteQuery({
    queryKey: ['setlists', 'infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      return setlistService.getSetlists({ ...filters, page: pageParam })
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => 
      lastPage.number < lastPage.totalPages - 1 ? lastPage.number + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  })
}