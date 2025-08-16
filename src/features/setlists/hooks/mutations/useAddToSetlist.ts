import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@features/auth'
import { useNotification } from '@shared/components/notifications'
import { setlistService } from '../../services/setlistService'
import { setlistKeys } from '../queries/useSetlistsQuery'
import type { SetlistArrangement, Setlist, Page } from '../../types/setlist.types'

interface AddToSetlistRequest {
  setlistId: string
  arrangementId: string
  order?: number
  keyOverride?: string
  capoOverride?: number
  tempoOverride?: number
  notes?: string
  duration?: number
  addedAt?: Date
  addedBy?: string
}

export function useAddToSetlist() {
  const queryClient = useQueryClient()
  const { getToken, userId } = useAuth()
  const { addNotification } = useNotification()
  
  return useMutation({
    mutationFn: async (data: AddToSetlistRequest) => {
      const token = await getToken()
      if (!token) throw new Error('Authentication required')
      
      const arrangementData: Partial<SetlistArrangement> = {
        order: data.order,
        keyOverride: data.keyOverride,
        capoOverride: data.capoOverride,
        tempoOverride: data.tempoOverride,
        notes: data.notes,
        duration: data.duration,
        addedAt: data.addedAt || new Date(),
        addedBy: data.addedBy || userId || ''
      }
      
      return setlistService.addArrangement(
        data.setlistId, 
        data.arrangementId, 
        arrangementData, 
        token
      )
    },
    
    onMutate: async (data) => {
      // Cancel outgoing queries for the specific setlist
      await queryClient.cancelQueries({ queryKey: setlistKeys.detail(data.setlistId) })
      await queryClient.cancelQueries({ queryKey: setlistKeys.lists() })
      
      // Get the current setlist data
      const currentSetlist = queryClient.getQueryData<Setlist>(setlistKeys.detail(data.setlistId))
      
      if (currentSetlist) {
        // Create optimistic arrangement
        const optimisticArrangement: SetlistArrangement = {
          arrangementId: data.arrangementId,
          order: data.order ?? currentSetlist.arrangements.length,
          keyOverride: data.keyOverride,
          capoOverride: data.capoOverride,
          tempoOverride: data.tempoOverride,
          notes: data.notes,
          duration: data.duration,
          addedAt: data.addedAt || new Date(),
          addedBy: data.addedBy || userId || ''
        }
        
        // Update the specific setlist
        const updatedSetlist: Setlist = {
          ...currentSetlist,
          arrangements: [...currentSetlist.arrangements, optimisticArrangement],
          updatedAt: new Date()
        }
        
        queryClient.setQueryData(setlistKeys.detail(data.setlistId), updatedSetlist)
        
        // Update the setlists list cache
        queryClient.setQueriesData(
          { queryKey: setlistKeys.lists() },
          (old: Page<Setlist> | undefined) => {
            if (!old?.content) return old
            
            return {
              ...old,
              content: old.content.map(setlist => 
                setlist.id === data.setlistId 
                  ? updatedSetlist
                  : setlist
              )
            }
          }
        )
        
        return { 
          previousSetlist: currentSetlist,
          optimisticArrangement,
          setlistId: data.setlistId
        }
      }
      
      return { setlistId: data.setlistId }
    },
    
    onError: (err, _data, context) => {
      // Rollback on error
      if (context?.previousSetlist) {
        queryClient.setQueryData(
          setlistKeys.detail(context.setlistId), 
          context.previousSetlist
        )
        
        // Rollback the lists cache
        queryClient.setQueriesData(
          { queryKey: setlistKeys.lists() },
          (old: Page<Setlist> | undefined) => {
            if (!old?.content) return old
            
            return {
              ...old,
              content: old.content.map(setlist => 
                setlist.id === context.setlistId 
                  ? context.previousSetlist
                  : setlist
              )
            }
          }
        )
      }
      
      addNotification({
        type: 'error',
        title: 'Failed to add to setlist',
        message: err.message
      })
    },
    
    onSuccess: (_data, variables) => {
      // Invalidate and refetch the specific setlist and lists
      queryClient.invalidateQueries({ queryKey: setlistKeys.detail(variables.setlistId) })
      queryClient.invalidateQueries({ queryKey: setlistKeys.lists() })
      
      // The success notification is handled by the calling component
      // to provide more context-specific messages
    }
  })
}