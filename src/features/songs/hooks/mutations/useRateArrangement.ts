import { useCallback } from 'react'
import { useArrangementMutations, type UseArrangementMutationsProps } from './useArrangementMutations'

export interface UseRateArrangementOptions extends UseArrangementMutationsProps {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useRateArrangement(options: UseRateArrangementOptions = {}) {
  const { onSuccess, onError, ...mutationProps } = options
  const { rateArrangement, isRating, error, clearError, optimisticArrangements } = useArrangementMutations(mutationProps)
  
  const handleRate = useCallback(async (id: string, rating: number) => {
    clearError()
    
    try {
      await rateArrangement(id, rating)
      onSuccess?.()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to rate arrangement')
      onError?.(error)
      throw error
    }
  }, [rateArrangement, clearError, onSuccess, onError])
  
  return {
    rateArrangement: handleRate,
    isRating,
    error,
    clearError,
    optimisticArrangements
  }
}