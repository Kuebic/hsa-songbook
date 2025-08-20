import { useState, useCallback, useOptimistic, useTransition } from 'react'
import { useAuth } from '@features/auth'
import { arrangementService } from '../../services/arrangementService'
// Note: Offline queue functionality removed
import {
  createOptimisticArrangement,
  updateOptimisticArrangement,
  replaceOptimisticArrangement,
  removeOptimisticArrangement
} from '../utils/optimisticArrangementUpdates'
import type { Arrangement } from '../../types/song.types'
import type { ArrangementFormData } from '../../validation/schemas/arrangementSchema'

type OptimisticUpdatePayload = 
  | { type: 'create'; payload: Arrangement }
  | { type: 'update'; payload: { id: string; data: Partial<ArrangementFormData> } }
  | { type: 'replace'; payload: { tempId: string; realArrangement: Arrangement } }
  | { type: 'delete'; payload: string }
  | { type: 'remove'; payload: string }
  | { type: 'rate'; payload: { id: string; rating: number } }

export interface UseArrangementMutationsReturn {
  createArrangement: (data: ArrangementFormData) => Promise<Arrangement>
  updateArrangement: (id: string, data: Partial<ArrangementFormData>) => Promise<Arrangement>
  updateArrangementName: (id: string, name: string) => Promise<Arrangement>
  updateArrangementField: (id: string, field: keyof Arrangement, value: unknown) => Promise<Arrangement>
  deleteArrangement: (id: string) => Promise<void>
  rateArrangement: (id: string, rating: number) => Promise<void>
  
  // State
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isRating: boolean
  error: Error | null
  
  // Optimistic arrangements for display
  optimisticArrangements: Arrangement[]
  
  // Utility methods
  clearError: () => void
  isAuthenticated: boolean
}

export interface UseArrangementMutationsProps {
  /** Initial arrangements array for optimistic updates */
  initialArrangements?: Arrangement[]
  /** Callback when arrangements are updated for external state synchronization */
  onArrangementsUpdate?: (arrangements: Arrangement[]) => void
}

export function useArrangementMutations(props: UseArrangementMutationsProps = {}): UseArrangementMutationsReturn {
  const { getToken, userId, isSignedIn, user } = useAuth()
  const { initialArrangements = [], onArrangementsUpdate } = props
  const [_isPending, startTransition] = useTransition()
  
  const [optimisticArrangements, addOptimisticUpdate] = useOptimistic(
    initialArrangements,
    (state: Arrangement[], update: OptimisticUpdatePayload) => {
      let newState: Arrangement[]
      
      switch (update.type) {
        case 'create':
          newState = [...state, update.payload]
          break
          
        case 'update':
          newState = state.map(arrangement =>
            arrangement.id === update.payload.id
              ? updateOptimisticArrangement(arrangement, update.payload.data)
              : arrangement
          )
          break
          
        case 'replace':
          newState = replaceOptimisticArrangement(state, update.payload.tempId, update.payload.realArrangement)
          break
          
        case 'delete':
          newState = state.filter(arrangement => arrangement.id !== update.payload)
          break
          
        case 'remove':
          newState = removeOptimisticArrangement(state, update.payload)
          break
          
        case 'rate':
          newState = state.map(arrangement =>
            arrangement.id === update.payload.id
              ? {
                  ...arrangement,
                  metadata: {
                    ...arrangement.metadata,
                    ratings: {
                      ...arrangement.metadata?.ratings || { average: 0, count: 0 },
                      average: update.payload.rating
                    }
                  }
                }
              : arrangement
          )
          break
      }
      
      // Notify parent of state change
      onArrangementsUpdate?.(newState)
      return newState
    }
  )
  
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRating, setIsRating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  const createArrangement = useCallback(async (formData: ArrangementFormData): Promise<Arrangement> => {
    if (!isSignedIn || !userId || !user) {
      throw new Error('Authentication required')
    }
    
    setIsCreating(true)
    setError(null)
    
    // Create optimistic arrangement
    const optimisticArrangement = createOptimisticArrangement(formData, userId)
    
    // Add optimistic update immediately
    startTransition(() => {
      addOptimisticUpdate({ type: 'create', payload: optimisticArrangement })
    })
    
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }
      
      // Note: Offline functionality removed for now
      
      // Convert form data to arrangement data for service
      const arrangementData: Partial<Arrangement> = {
        name: formData.name,
        slug: formData.slug,
        songIds: formData.songIds || [],
        key: formData.key || '',
        tempo: formData.tempo,
        timeSignature: formData.timeSignature || '4/4',
        difficulty: (formData.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
        tags: formData.tags || [],
        chordData: formData.chordData || formData.chordProText || '',
        description: formData.description,
        notes: formData.notes,
        capo: formData.capo,
        duration: formData.duration
      }
      
      // Make API call
      const newArrangement = await arrangementService.createArrangement(arrangementData)
      
      // Replace optimistic arrangement with real one
      startTransition(() => {
        addOptimisticUpdate({ 
          type: 'replace', 
          payload: { tempId: optimisticArrangement.id, realArrangement: newArrangement } 
        })
      })
      
      return newArrangement
    } catch (err) {
      // Remove optimistic arrangement on error
      startTransition(() => {
        addOptimisticUpdate({ type: 'remove', payload: optimisticArrangement.id })
      })
      
      const error = err instanceof Error ? err : new Error('Failed to create arrangement')
      setError(error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [user, userId, isSignedIn, getToken, addOptimisticUpdate])
  
  const updateArrangement = useCallback(async (
    id: string,
    updates: Partial<ArrangementFormData>
  ): Promise<Arrangement> => {
    if (!isSignedIn || !userId) {
      throw new Error('Authentication required')
    }
    
    setIsUpdating(true)
    setError(null)
    
    // Apply optimistic update
    startTransition(() => {
      addOptimisticUpdate({ type: 'update', payload: { id, data: updates } })
    })
    
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }
      
      // Note: Offline functionality removed for now
      
      // Convert form updates to arrangement data for service
      const arrangementUpdates: Partial<Arrangement> = {}
      if (updates.name !== undefined) arrangementUpdates.name = updates.name
      if (updates.slug !== undefined) arrangementUpdates.slug = updates.slug
      if (updates.key !== undefined) arrangementUpdates.key = updates.key
      if (updates.tempo !== undefined) arrangementUpdates.tempo = updates.tempo
      if (updates.timeSignature !== undefined) arrangementUpdates.timeSignature = updates.timeSignature
      if (updates.difficulty !== undefined) arrangementUpdates.difficulty = updates.difficulty as 'beginner' | 'intermediate' | 'advanced'
      if (updates.tags !== undefined) arrangementUpdates.tags = updates.tags
      if (updates.chordData !== undefined) arrangementUpdates.chordData = updates.chordData
      if (updates.chordProText !== undefined) arrangementUpdates.chordData = updates.chordProText
      if (updates.description !== undefined) arrangementUpdates.description = updates.description
      if (updates.notes !== undefined) arrangementUpdates.notes = updates.notes
      if (updates.capo !== undefined) arrangementUpdates.capo = updates.capo
      if (updates.duration !== undefined) arrangementUpdates.duration = updates.duration
      
      // Make API call
      const updatedArrangement = await arrangementService.updateArrangement(id, arrangementUpdates)
      
      // Update with real data
      startTransition(() => {
        addOptimisticUpdate({ 
          type: 'replace', 
          payload: { tempId: id, realArrangement: updatedArrangement } 
        })
      })
      
      return updatedArrangement
    } catch (err) {
      // Revert optimistic update on error
      startTransition(() => {
        addOptimisticUpdate({ 
          type: 'replace', 
          payload: { tempId: id, realArrangement: existingArrangement } 
        })
      })
      
      const error = err instanceof Error ? err : new Error('Failed to update arrangement')
      setError(error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [userId, isSignedIn, optimisticArrangements, getToken, addOptimisticUpdate])
  
  const updateArrangementName = useCallback(async (id: string, name: string): Promise<Arrangement> => {
    return updateArrangement(id, { name })
  }, [updateArrangement])
  
  const updateArrangementField = useCallback(async (
    id: string,
    field: keyof Arrangement,
    value: unknown
  ): Promise<Arrangement> => {
    return updateArrangement(id, { [field]: value } as Partial<ArrangementFormData>)
  }, [updateArrangement])
  
  const deleteArrangement = useCallback(async (id: string): Promise<void> => {
    if (!isSignedIn || !userId) {
      throw new Error('Authentication required')
    }
    
    setIsDeleting(true)
    setError(null)
    
    // Find arrangement to delete
    const arrangementToDelete = optimisticArrangements.find(a => a.id === id)
    if (!arrangementToDelete) {
      throw new Error('Arrangement not found')
    }
    
    // Apply optimistic delete
    startTransition(() => {
      addOptimisticUpdate({ type: 'delete', payload: id })
    })
    
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }
      
      // Note: Offline functionality removed for now
      
      // Make API call
      await arrangementService.deleteArrangement(id)
      
      // Delete is already applied optimistically, no need to revert
    } catch (err) {
      // Revert optimistic delete on error
      startTransition(() => {
        addOptimisticUpdate({ type: 'create', payload: arrangementToDelete })
      })
      
      const error = err instanceof Error ? err : new Error('Failed to delete arrangement')
      setError(error)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [userId, isSignedIn, optimisticArrangements, getToken, addOptimisticUpdate])
  
  const rateArrangement = useCallback(async (id: string, rating: number): Promise<void> => {
    if (!isSignedIn || !userId) {
      throw new Error('Authentication required')
    }
    
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }
    
    setIsRating(true)
    setError(null)
    
    // Find arrangement to rate
    const arrangement = optimisticArrangements.find(a => a.id === id)
    if (!arrangement) {
      throw new Error('Arrangement not found')
    }
    
    const previousRating = arrangement.metadata?.ratings?.average || 0
    
    // Apply optimistic rating update
    startTransition(() => {
      addOptimisticUpdate({ type: 'rate', payload: { id, rating } })
    })
    
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }
      
      // Note: Offline functionality removed for now
      
      // Note: Arrangement rating functionality not implemented in service
      // This would need to be implemented if rating feature is needed
      
      // Rating update is already applied optimistically
    } catch (err) {
      // Revert optimistic rating on error
      startTransition(() => {
        addOptimisticUpdate({ type: 'rate', payload: { id, rating: previousRating } })
      })
      
      const error = err instanceof Error ? err : new Error('Failed to rate arrangement')
      setError(error)
      throw error
    } finally {
      setIsRating(false)
    }
  }, [userId, isSignedIn, optimisticArrangements, getToken, addOptimisticUpdate])
  
  return {
    createArrangement,
    updateArrangement,
    updateArrangementName,
    updateArrangementField,
    deleteArrangement,
    rateArrangement,
    
    isCreating,
    isUpdating,
    isDeleting,
    isRating,
    error,
    
    optimisticArrangements,
    
    clearError,
    isAuthenticated: isSignedIn ?? false
  }
}