import { useState, useEffect, useCallback } from 'react'
import { arrangementService } from '../services/arrangementService'
import type { Arrangement } from '../types/song.types'

export interface UseArrangementOptions {
  /** Enable automatic refetching when id changes */
  enabled?: boolean
  /** Include chord data in the response */
  includeChordData?: boolean
}

export function useArrangement(id: string, options: UseArrangementOptions = {}) {
  const { enabled = true, includeChordData = true } = options
  const [arrangement, setArrangement] = useState<Arrangement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArrangement = useCallback(async () => {
    if (!enabled || !id) return
    
    setLoading(true)
    setError(null)

    try {
      const arrangementData = await arrangementService.getArrangementById(id)
      setArrangement(arrangementData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load arrangement'
      setError(errorMessage)
      console.error('Error fetching arrangement:', err)
      setArrangement(null)
    } finally {
      setLoading(false)
    }
  }, [id, includeChordData, enabled])

  const refreshArrangement = useCallback(() => {
    fetchArrangement()
  }, [fetchArrangement])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load arrangement on mount and when id changes
  useEffect(() => {
    fetchArrangement()
  }, [fetchArrangement])

  return {
    arrangement,
    loading,
    error,
    refreshArrangement,
    clearError,
    isFound: !!arrangement,
    isNotFound: !loading && !arrangement && !error
  }
}

export function useArrangementBySlug(slug: string, options: UseArrangementOptions = {}) {
  const { enabled = true, includeChordData = true } = options
  const [arrangement, setArrangement] = useState<Arrangement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArrangement = useCallback(async () => {
    if (!enabled || !slug) return
    
    setLoading(true)
    setError(null)

    try {
      const arrangementData = await arrangementService.getArrangementBySlug(slug)
      setArrangement(arrangementData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load arrangement'
      setError(errorMessage)
      console.error('Error fetching arrangement by slug:', err)
      setArrangement(null)
    } finally {
      setLoading(false)
    }
  }, [slug, includeChordData, enabled])

  const refreshArrangement = useCallback(() => {
    fetchArrangement()
  }, [fetchArrangement])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load arrangement on mount and when slug changes
  useEffect(() => {
    fetchArrangement()
  }, [fetchArrangement])

  return {
    arrangement,
    loading,
    error,
    refreshArrangement,
    clearError,
    isFound: !!arrangement,
    isNotFound: !loading && !arrangement && !error
  }
}