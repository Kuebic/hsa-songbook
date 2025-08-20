import { useState, useCallback } from 'react'
import { useAuth } from '@features/auth'
import { arrangementService } from '../services/arrangementService'
import type { Arrangement } from '../types/song.types'
import type { ArrangementFormData } from '../validation/schemas/arrangementSchema'

export function useArrangementMutations() {
  const { isSignedIn, userId, getToken } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createArrangement = useCallback(async (
    arrangementData: ArrangementFormData
  ): Promise<Arrangement> => {
    if (!isSignedIn || !userId) {
      throw new Error('Please sign in to create arrangements')
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }

      console.log('🔐 Auth info:', { userId, tokenPrefix: token?.substring(0, 50) })

      const arrangement = await arrangementService.createArrangement(
        arrangementData
      )

      return arrangement
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create arrangement'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSignedIn, userId, getToken])

  const updateArrangement = useCallback(async (
    id: string,
    arrangementData: Partial<ArrangementFormData>
  ): Promise<Arrangement> => {
    if (!isSignedIn || !userId) {
      throw new Error('Please sign in to update arrangements')
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }

      const arrangement = await arrangementService.updateArrangement(
        id,
        arrangementData
      )

      return arrangement
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update arrangement'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSignedIn, userId, getToken])

  const deleteArrangement = useCallback(async (id: string): Promise<void> => {
    if (!isSignedIn || !userId) {
      throw new Error('Please sign in to delete arrangements')
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }

      await arrangementService.deleteArrangement(id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete arrangement'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSignedIn, userId, getToken])

  const rateArrangement = useCallback(async (
    _id: string,
    _rating: number
  ): Promise<Arrangement> => {
    // Note: Rating functionality not implemented in arrangement service
    throw new Error('Arrangement rating is not yet implemented')
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    createArrangement,
    updateArrangement,
    deleteArrangement,
    rateArrangement,
    isSubmitting,
    error,
    clearError,
    isAuthenticated: isSignedIn,
    canCreateArrangements: isSignedIn && !!userId
  }
}