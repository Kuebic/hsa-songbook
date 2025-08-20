import { useCallback } from 'react'
import { useArrangementMutations, type UseArrangementMutationsProps } from './useArrangementMutations'
import type { ArrangementFormData } from '../../validation/schemas/arrangementSchema'
import type { Arrangement } from '../../types/song.types'

export interface UseCreateArrangementOptions extends UseArrangementMutationsProps {
  onSuccess?: (arrangement: Arrangement) => void
  onError?: (error: Error) => void
}

export function useCreateArrangement(options: UseCreateArrangementOptions = {}) {
  const { onSuccess, onError, ...mutationProps } = options
  const { createArrangement, isCreating, error, clearError, optimisticArrangements } = useArrangementMutations(mutationProps)
  
  const handleCreate = useCallback(async (formData: ArrangementFormData) => {
    clearError()
    
    try {
      const newArrangement = await createArrangement(formData)
      onSuccess?.(newArrangement)
      return newArrangement
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create arrangement')
      onError?.(error)
      throw error
    }
  }, [createArrangement, clearError, onSuccess, onError])
  
  return {
    createArrangement: handleCreate,
    isCreating,
    error,
    clearError,
    optimisticArrangements
  }
}