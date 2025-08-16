import { useCallback, useMemo } from 'react'
import { useNotification } from '@shared/components/notifications'
import { useSetlists } from '../useSetlists'
import { formatDistanceToNow } from 'date-fns'
import type { Arrangement } from '../../../songs/types/song.types'
import type { 
  UseAddToSetlistDropdownReturn, 
  CreateSetlistFormData,
  SetlistWithStatus
} from '../../types/dropdown.types'
import type { Setlist } from '../../types/setlist.types'

/**
 * Custom hook for the AddToSetlistDropdown component
 * Handles data fetching, mutations, and state management
 */
export function useAddToSetlistDropdown(arrangement: Arrangement): UseAddToSetlistDropdownReturn {
  const { addNotification } = useNotification()
  
  // Use localStorage-based setlists hook
  const {
    setlists: rawSetlists,
    loading: isLoadingSetlists,
    createSetlist,
    addArrangementToSetlist
  } = useSetlists()
  
  // Transform setlists with arrangement status
  const setlistsWithStatus = useMemo<SetlistWithStatus[] | undefined>(() => {
    if (!rawSetlists) return undefined
    
    return rawSetlists.map(setlist => {
      const containsArrangement = setlist.arrangements.some(
        arr => arr.arrangementId === arrangement.id
      )
      
      return {
        ...setlist,
        containsArrangement,
        lastModifiedRelative: formatDistanceToNow(new Date(setlist.updatedAt), { 
          addSuffix: true 
        }),
        arrangementCount: setlist.arrangements.length
      }
    }).sort((a, b) => {
      // Sort by: recently modified first
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [rawSetlists, arrangement.id])
  
  // Add arrangement to setlist
  const addToSetlist = useCallback(async (
    setlistId: string
  ) => {
    // Find the setlist
    const setlist = setlistsWithStatus?.find(s => s.id === setlistId)
    if (!setlist) {
      addNotification({
        type: 'error',
        title: 'Setlist not found',
        message: 'The selected setlist could not be found'
      })
      return
    }
    
    // Check if already added
    if (setlist.containsArrangement) {
      addNotification({
        type: 'info',
        title: 'Already in setlist',
        message: `"${arrangement.name}" is already in "${setlist.name}"`
      })
      return
    }
    
    try {
      // Add arrangement using localStorage implementation
      addArrangementToSetlist(setlistId, arrangement as any)
      
      addNotification({
        type: 'success',
        title: 'Added to setlist',
        message: `"${arrangement.name}" was added to "${setlist.name}"`
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to add to setlist',
        message: error instanceof Error ? error.message : 'An error occurred'
      })
      console.error('Failed to add to setlist:', error)
    }
  }, [setlistsWithStatus, arrangement, addArrangementToSetlist, addNotification])
  
  // Create setlist with arrangement
  const createWithArrangement = useCallback(async (data: CreateSetlistFormData): Promise<Setlist> => {
    try {
      // Create the setlist using localStorage implementation
      const newSetlist = createSetlist(data.name.trim(), data.description?.trim())
      
      // If requested, add the arrangement to the new setlist
      if (data.addArrangement) {
        addArrangementToSetlist(newSetlist.id, arrangement as any)
        
        addNotification({
          type: 'success',
          title: 'Setlist created',
          message: `Created "${newSetlist.name}" and added "${arrangement.name}"`
        })
      } else {
        addNotification({
          type: 'success',
          title: 'Setlist created',
          message: `Created "${newSetlist.name}"`
        })
      }
      
      return newSetlist
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create setlist'
      addNotification({
        type: 'error',
        title: 'Creation failed',
        message
      })
      throw error
    }
  }, [
    arrangement,
    createSetlist,
    addArrangementToSetlist,
    addNotification
  ])
  
  return {
    setlists: setlistsWithStatus,
    isLoadingSetlists,
    setlistsError: null,
    addToSetlist,
    createWithArrangement,
    isAdding: false,
    isCreating: false,
    refetchSetlists: () => {}
  }
}