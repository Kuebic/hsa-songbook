import { useCallback } from 'react'
import { useArrangements, type UseArrangementsOptions } from './useArrangements'
import { useArrangementMutations, type UseArrangementMutationsProps } from './mutations/useArrangementMutations'

export interface UseArrangementManagerOptions extends UseArrangementsOptions, UseArrangementMutationsProps {
  /** Auto-refresh arrangements after mutations */
  autoRefresh?: boolean
}

/**
 * Combined hook for both querying and mutating arrangements.
 * Provides a complete interface for arrangement management with automatic cache synchronization.
 */
export function useArrangementManager(options: UseArrangementManagerOptions = {}) {
  const { autoRefresh = true, ...restOptions } = options
  
  // Split options for query and mutation hooks
  const queryOptions = {
    autoSelect: restOptions.autoSelect,
    enabled: restOptions.enabled,
    filter: restOptions.filter
  }
  
  const mutationOptions = {
    initialArrangements: restOptions.initialArrangements,
    onArrangementsUpdate: restOptions.onArrangementsUpdate
  }
  
  const queryResult = useArrangements(queryOptions)
  const mutationResult = useArrangementMutations({
    ...mutationOptions,
    initialArrangements: queryResult.arrangements, // Use current arrangements as initial state
    onArrangementsUpdate: (arrangements) => {
      // Sync optimistic updates with query state if needed
      mutationOptions.onArrangementsUpdate?.(arrangements)
    }
  })
  
  // Enhanced mutation functions that auto-refresh
  const createArrangementWithRefresh = useCallback(async (data: Parameters<typeof mutationResult.createArrangement>[0]) => {
    try {
      const result = await mutationResult.createArrangement(data)
      if (autoRefresh) {
        queryResult.refreshArrangements()
      }
      return result
    } catch (error) {
      if (autoRefresh) {
        queryResult.refreshArrangements()
      }
      throw error
    }
  }, [mutationResult, queryResult, autoRefresh])
  
  const updateArrangementWithRefresh = useCallback(async (
    id: string, 
    data: Parameters<typeof mutationResult.updateArrangement>[1]
  ) => {
    try {
      const result = await mutationResult.updateArrangement(id, data)
      if (autoRefresh) {
        queryResult.refreshArrangements()
      }
      return result
    } catch (error) {
      if (autoRefresh) {
        queryResult.refreshArrangements()
      }
      throw error
    }
  }, [mutationResult, queryResult, autoRefresh])
  
  const deleteArrangementWithRefresh = useCallback(async (id: string) => {
    try {
      await mutationResult.deleteArrangement(id)
      if (autoRefresh) {
        queryResult.refreshArrangements()
      }
    } catch (error) {
      if (autoRefresh) {
        queryResult.refreshArrangements()
      }
      throw error
    }
  }, [mutationResult, queryResult, autoRefresh])
  
  const rateArrangementWithRefresh = useCallback(async (id: string, rating: number) => {
    try {
      await mutationResult.rateArrangement(id, rating)
      if (autoRefresh) {
        queryResult.refreshArrangements()
      }
    } catch (error) {
      if (autoRefresh) {
        queryResult.refreshArrangements()
      }
      throw error
    }
  }, [mutationResult, queryResult, autoRefresh])
  
  const clearAllErrors = useCallback(() => {
    queryResult.clearError()
    mutationResult.clearError()
  }, [queryResult, mutationResult])
  
  return {
    // Query state and methods
    arrangements: mutationResult.optimisticArrangements.length > 0 ? mutationResult.optimisticArrangements : queryResult.arrangements,
    selectedArrangement: queryResult.selectedArrangement,
    loading: queryResult.loading,
    total: queryResult.total,
    page: queryResult.page,
    pages: queryResult.pages,
    hasArrangements: queryResult.hasArrangements,
    isEmpty: queryResult.isEmpty,
    
    // Query methods
    selectArrangement: queryResult.selectArrangement,
    clearSelection: queryResult.clearSelection,
    refreshArrangements: queryResult.refreshArrangements,
    
    // Mutation methods (with auto-refresh)
    createArrangement: createArrangementWithRefresh,
    updateArrangement: updateArrangementWithRefresh,
    updateArrangementName: mutationResult.updateArrangementName,
    updateArrangementField: mutationResult.updateArrangementField,
    deleteArrangement: deleteArrangementWithRefresh,
    rateArrangement: rateArrangementWithRefresh,
    
    // Mutation state
    isCreating: mutationResult.isCreating,
    isUpdating: mutationResult.isUpdating,
    isDeleting: mutationResult.isDeleting,
    isRating: mutationResult.isRating,
    
    // Combined state
    isMutating: mutationResult.isCreating || mutationResult.isUpdating || mutationResult.isDeleting || mutationResult.isRating,
    isLoading: queryResult.loading || mutationResult.isCreating || mutationResult.isUpdating || mutationResult.isDeleting || mutationResult.isRating,
    
    // Error handling
    queryError: queryResult.error,
    mutationError: mutationResult.error,
    hasError: !!queryResult.error || !!mutationResult.error,
    clearAllErrors,
    
    // Authentication state
    isAuthenticated: mutationResult.isAuthenticated
  }
}