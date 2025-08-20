import { useCallback } from 'react'
import { useArrangementMutations, type UseArrangementMutationsProps } from './useArrangementMutations'
import type { ArrangementFormData } from '../../validation/schemas/arrangementSchema'
import type { Arrangement } from '../../types/song.types'

export interface UseUpdateArrangementOptions extends UseArrangementMutationsProps {
  onSuccess?: (arrangement: Arrangement) => void
  onError?: (error: Error) => void
}

export function useUpdateArrangement(options: UseUpdateArrangementOptions = {}) {
  const { onSuccess, onError, ...mutationProps } = options
  const { 
    updateArrangement, 
    updateArrangementName, 
    updateArrangementField, 
    isUpdating, 
    error, 
    clearError, 
    optimisticArrangements 
  } = useArrangementMutations(mutationProps)
  
  const handleUpdate = useCallback(async (id: string, data: Partial<ArrangementFormData>) => {
    clearError()
    
    try {
      const updatedArrangement = await updateArrangement(id, data)
      onSuccess?.(updatedArrangement)
      return updatedArrangement
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update arrangement')
      onError?.(error)
      throw error
    }
  }, [updateArrangement, clearError, onSuccess, onError])
  
  const handleUpdateName = useCallback(async (id: string, name: string) => {
    clearError()
    
    try {
      const updatedArrangement = await updateArrangementName(id, name)
      onSuccess?.(updatedArrangement)
      return updatedArrangement
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update arrangement name')
      onError?.(error)
      throw error
    }
  }, [updateArrangementName, clearError, onSuccess, onError])
  
  const handleUpdateField = useCallback(async (
    id: string, 
    field: keyof Arrangement, 
    value: unknown
  ) => {
    clearError()
    
    try {
      const updatedArrangement = await updateArrangementField(id, field, value)
      onSuccess?.(updatedArrangement)
      return updatedArrangement
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Failed to update arrangement ${field}`)
      onError?.(error)
      throw error
    }
  }, [updateArrangementField, clearError, onSuccess, onError])
  
  return {
    updateArrangement: handleUpdate,
    updateArrangementName: handleUpdateName,
    updateArrangementField: handleUpdateField,
    isUpdating,
    error,
    clearError,
    optimisticArrangements
  }
}