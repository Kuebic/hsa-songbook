import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@features/auth'
import { useNotification } from '@shared/components/notifications'
import { setlistService } from '../../services/setlistService'
import { setlistKeys } from '../queries/useSetlistsQuery'
import type { Setlist, SetlistArrangement, Page } from '../../types/setlist.types'

interface ReorderArrangementsParams {
  setlistId: string
  arrangements: SetlistArrangement[]
}

export function useReorderArrangements() {
  const queryClient = useQueryClient()
  const { getToken } = useAuth()
  const { addNotification } = useNotification()
  
  return useMutation({
    mutationFn: async ({ setlistId, arrangements }: ReorderArrangementsParams) => {
      const token = await getToken()
      if (!token) throw new Error('Authentication required')
      return setlistService.reorderArrangements(setlistId, arrangements, token)
    },
    
    onMutate: async ({ setlistId, arrangements }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: setlistKeys.detail(setlistId) })
      
      // Get previous value
      const previousSetlist = queryClient.getQueryData<Setlist>(setlistKeys.detail(setlistId))
      
      // Optimistically update the arrangement order
      if (previousSetlist) {
        const optimisticSetlist = {
          ...previousSetlist,
          arrangements: arrangements.map((arr, index) => ({
            ...arr,
            order: index
          })),
          updatedAt: new Date()
        }
        
        queryClient.setQueryData(setlistKeys.detail(setlistId), optimisticSetlist)
      }
      
      return { previousSetlist }
    },
    
    onError: (err, { setlistId }, context) => {
      // Rollback on error
      if (context?.previousSetlist) {
        queryClient.setQueryData(setlistKeys.detail(setlistId), context.previousSetlist)
      }
      
      addNotification({
        type: 'error',
        title: 'Failed to reorder arrangements',
        message: err.message
      })
    },
    
    onSuccess: (data, { setlistId }) => {
      // Update cache with server response
      queryClient.setQueryData(setlistKeys.detail(setlistId), data)
      
      // Update in lists cache as well
      queryClient.setQueriesData(
        { queryKey: setlistKeys.lists() },
        (old: Page<Setlist> | undefined) => {
          if (!old?.content) return old
          
          return {
            ...old,
            content: old.content.map((setlist: Setlist) =>
              setlist.id === setlistId ? data : setlist
            )
          }
        }
      )
      
      addNotification({
        type: 'success',
        title: 'Arrangements reordered',
        message: 'Song order has been updated successfully',
        duration: 2000 // Shorter duration for this common action
      })
    }
  })
}