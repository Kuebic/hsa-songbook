import { useState, useEffect, useCallback } from 'react'
import { arrangementService } from '../services/arrangementService'
import type { Arrangement } from '../types/song.types'

export function useArrangements(songId?: string) {
  const [arrangements, setArrangements] = useState<Arrangement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedArrangement, setSelectedArrangement] = useState<Arrangement | null>(null)

  const fetchArrangements = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let arrangementsData: Arrangement[] = []
      
      if (songId) {
        // Fetch arrangements for specific song
        arrangementsData = await arrangementService.getArrangementsBySong(songId)
      } else {
        // Fetch all arrangements
        const response = await arrangementService.getAllArrangements()
        arrangementsData = response.arrangements
      }

      setArrangements(arrangementsData)
      
      // Auto-select first arrangement if none selected
      if (arrangementsData.length > 0 && !selectedArrangement) {
        setSelectedArrangement(arrangementsData[0])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load arrangements'
      setError(errorMessage)
      console.error('Error fetching arrangements:', err)
    } finally {
      setLoading(false)
    }
  }, [songId, selectedArrangement])

  const selectArrangement = useCallback((arrangement: Arrangement) => {
    setSelectedArrangement(arrangement)
  }, [])

  const refreshArrangements = useCallback(() => {
    fetchArrangements()
  }, [fetchArrangements])

  // Load arrangements on mount and when songId changes
  useEffect(() => {
    fetchArrangements()
  }, [fetchArrangements])

  return {
    arrangements,
    selectedArrangement,
    loading,
    error,
    selectArrangement,
    refreshArrangements,
    hasArrangements: arrangements.length > 0
  }
}