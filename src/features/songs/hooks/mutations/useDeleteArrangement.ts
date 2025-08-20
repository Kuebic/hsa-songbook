import { useCallback } from 'react'
import { useArrangementMutations, type UseArrangementMutationsProps } from './useArrangementMutations'

export interface UseDeleteArrangementOptions extends UseArrangementMutationsProps {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useDeleteArrangement(options: UseDeleteArrangementOptions = {}) {
  const { onSuccess, onError, ...mutationProps } = options
  const { deleteArrangement, isDeleting, error, clearError, optimisticArrangements } = useArrangementMutations(mutationProps)
  
  const handleDelete = useCallback(async (id: string) => {
    clearError()
    
    try {
      await deleteArrangement(id)
      onSuccess?.()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete arrangement')
      onError?.(error)
      throw error
    }
  }, [deleteArrangement, clearError, onSuccess, onError])
  
  return {
    deleteArrangement: handleDelete,
    isDeleting,
    error,
    clearError,
    optimisticArrangements
  }
}