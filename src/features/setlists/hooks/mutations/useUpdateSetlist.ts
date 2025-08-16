import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@features/auth'
import { useNotification } from '@shared/components/notifications'
import { setlistService } from '../../services/setlistService'
import { setlistKeys } from '../queries/useSetlistsQuery'
import type { Setlist, Page } from '../../types/setlist.types'

interface UpdateSetlistParams {
  id: string
  data: Partial<Setlist>
}

export function useUpdateSetlist() {
  const queryClient = useQueryClient()
  const { getToken } = useAuth()
  const { addNotification } = useNotification()
  
  return useMutation({
    mutationFn: async ({ id, data }: UpdateSetlistParams) => {
      const token = await getToken()
      if (!token) throw new Error('Authentication required')
      return setlistService.updateSetlist(id, data, token)
    },
    
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: setlistKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: setlistKeys.lists() })
      
      // Get previous value
      const previousSetlist = queryClient.getQueryData<Setlist>(setlistKeys.detail(id))
      
      // Optimistically update the setlist
      if (previousSetlist) {
        const optimisticSetlist = {
          ...previousSetlist,
          ...data,
          updatedAt: new Date()
        }
        
        queryClient.setQueryData(setlistKeys.detail(id), optimisticSetlist)
        
        // Update in lists cache as well
        queryClient.setQueriesData(
          { queryKey: setlistKeys.lists() },
          (old: Page<Setlist> | undefined) => {
            if (!old?.content) return old
            
            return {
              ...old,
              content: old.content.map((setlist: Setlist) =>
                setlist.id === id ? optimisticSetlist : setlist
              )
            }
          }
        )
      }
      
      return { previousSetlist }
    },
    
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousSetlist) {
        queryClient.setQueryData(setlistKeys.detail(id), context.previousSetlist)
        
        // Rollback in lists cache as well
        queryClient.setQueriesData(
          { queryKey: setlistKeys.lists() },
          (old: Page<Setlist> | undefined) => {
            if (!old?.content || !context.previousSetlist) return old
            
            return {
              ...old,
              content: old.content.map((setlist: Setlist) =>
                setlist.id === id ? context.previousSetlist : setlist
              )
            }
          }
        )
      }
      
      addNotification({
        type: 'error',
        title: 'Failed to update setlist',
        message: err.message
      })
    },
    
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(setlistKeys.detail(data.id), data)
      
      // Update in lists cache
      queryClient.setQueriesData(
        { queryKey: setlistKeys.lists() },
        (old: Page<Setlist> | undefined) => {
          if (!old?.content) return old
          
          return {
            ...old,
            content: old.content.map((setlist: Setlist) =>
              setlist.id === data.id ? data : setlist
            )
          }
        }
      )
      
      addNotification({
        type: 'success',
        title: 'Setlist updated',
        message: `"${data.name}" has been updated successfully`
      })
    }
  })
}