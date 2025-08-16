import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@features/auth'
import { useNotification } from '@shared/components/notifications'
import { setlistService } from '../../services/setlistService'
import { setlistKeys } from '../queries/useSetlistsQuery'
import type { CreateSetlistRequest, Setlist, Page } from '../../types/setlist.types'

export function useCreateSetlist() {
  const queryClient = useQueryClient()
  const { getToken, userId } = useAuth()
  const { addNotification } = useNotification()
  
  return useMutation({
    mutationFn: async (data: CreateSetlistRequest) => {
      const token = await getToken()
      if (!token) throw new Error('Authentication required')
      return setlistService.createSetlist(data, token)
    },
    
    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: setlistKeys.lists() })
      
      // Optimistic update
      const optimisticSetlist: Setlist = {
        id: `temp-${Date.now()}`,
        shareId: undefined,
        name: data.name,
        description: data.description,
        arrangements: data.arrangements || [],
        createdBy: userId || '',
        createdByName: 'You',
        isPublic: data.isPublic ?? true,
        likes: 0,
        likedBy: [],
        allowDuplication: data.allowDuplication ?? true,
        defaultTransitionTime: data.defaultTransitionTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      // Add to cache optimistically
      queryClient.setQueryData(
        setlistKeys.list('{}'),
        (old: Page<Setlist> | undefined) => ({
          content: [optimisticSetlist, ...(old?.content || [])],
          totalElements: (old?.totalElements || 0) + 1,
          totalPages: old?.totalPages || 1,
          number: old?.number || 0,
          size: old?.size || 20,
          numberOfElements: (old?.numberOfElements || 0) + 1,
          first: old?.first ?? true,
          last: old?.last ?? true,
        })
      )
      
      return { optimisticSetlist }
    },
    
    onError: (err, _data, context) => {
      // Rollback on error
      if (context?.optimisticSetlist) {
        queryClient.setQueryData(
          setlistKeys.list('{}'),
          (old: Page<Setlist> | undefined) => ({
            content: old?.content?.filter((s: Setlist) => 
              s.id !== context.optimisticSetlist.id
            ) || [],
            totalElements: Math.max((old?.totalElements || 0) - 1, 0),
            totalPages: old?.totalPages || 1,
            number: old?.number || 0,
            size: old?.size || 20,
            numberOfElements: Math.max((old?.numberOfElements || 0) - 1, 0),
            first: old?.first ?? true,
            last: old?.last ?? true,
          })
        )
      }
      
      addNotification({
        type: 'error',
        title: 'Failed to create setlist',
        message: err.message
      })
    },
    
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: setlistKeys.lists() })
      
      addNotification({
        type: 'success',
        title: 'Setlist created',
        message: `"${data.name}" has been created successfully`
      })
    }
  })
}