import { useState, useEffect, useCallback } from 'react'
import { arrangementService } from '../services/arrangementService'
import type { Arrangement } from '../types/song.types'

export interface UseArrangementsFilter {
  songId?: string
  key?: string
  difficulty?: string
  page?: number
  limit?: number
}

export interface UseArrangementsOptions {
  /** Automatically select first arrangement if none is selected */
  autoSelect?: boolean
  /** Enable automatic refetching when dependencies change */
  enabled?: boolean
  /** Filter options for arrangements */
  filter?: UseArrangementsFilter
}

export function useArrangements(options: UseArrangementsOptions = {}) {
  const { autoSelect = true, enabled = true, filter } = options
  const [arrangements, setArrangements] = useState<Arrangement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedArrangement, setSelectedArrangement] = useState<Arrangement | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const fetchArrangements = useCallback(async () => {
    if (!enabled) return
    
    setLoading(true)
    setError(null)

    try {
      let arrangementsData: Arrangement[] = []
      let totalCount = 0
      let currentPage = 1
      let totalPages = 1
      
      if (filter?.songId) {
        // Fetch arrangements for specific song
        arrangementsData = await arrangementService.getArrangementsBySongId(filter.songId)
        totalCount = arrangementsData.length
        currentPage = 1
        totalPages = 1
      } else {
        // Fetch all arrangements (no pagination support in current service)
        arrangementsData = await arrangementService.getAllArrangements()
        totalCount = arrangementsData.length
        currentPage = 1
        totalPages = 1
      }

      setArrangements(arrangementsData)
      setTotal(totalCount)
      setPage(currentPage)
      setPages(totalPages)
      
      // Auto-select first arrangement if none selected and auto-select is enabled
      if (autoSelect && arrangementsData.length > 0) {
        setSelectedArrangement(prev => prev || arrangementsData[0])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load arrangements'
      setError(errorMessage)
      console.error('Error fetching arrangements:', err)
    } finally {
      setLoading(false)
    }
  }, [filter?.songId, autoSelect, enabled])

  const selectArrangement = useCallback((arrangement: Arrangement) => {
    setSelectedArrangement(arrangement)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedArrangement(null)
  }, [])

  const refreshArrangements = useCallback(() => {
    fetchArrangements()
  }, [fetchArrangements])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load arrangements on mount and when songId changes
  useEffect(() => {
    // Only fetch if we have a songId or if we want all arrangements (no filter)
    if (filter?.songId || !filter) {
      fetchArrangements()
    }
  }, [filter?.songId, fetchArrangements])

  return {
    arrangements,
    selectedArrangement,
    loading,
    error,
    total,
    page,
    pages,
    selectArrangement,
    clearSelection,
    refreshArrangements,
    clearError,
    hasArrangements: arrangements.length > 0,
    isEmpty: !loading && arrangements.length === 0
  }
}