import { useQuery } from '@tanstack/react-query'
import { moderationService } from '../services/moderationService'
import type { ModerationFilter } from '../types/moderation.types'

/**
 * Hook for fetching and managing the moderation queue
 */
export function useModerationQueue(filter?: ModerationFilter) {
  const queryKey = ['moderation-queue', filter]

  const query = useQuery({
    queryKey,
    queryFn: () => moderationService.getQueue(filter),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    // Enable real-time updates by refetching on focus
    refetchOnWindowFocus: true,
    // Refetch every 2 minutes to keep data fresh
    refetchInterval: 2 * 60 * 1000
  })

  return {
    /** Moderation queue items */
    items: query.data || [],
    /** Whether the queue is loading */
    isLoading: query.isLoading,
    /** Whether the queue is fetching in background */
    isFetching: query.isFetching,
    /** Error from fetching queue */
    error: query.error,
    /** Refetch the queue */
    refetch: query.refetch
  }
}