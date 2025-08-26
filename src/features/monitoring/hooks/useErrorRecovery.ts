import { useCallback, useRef, useEffect, useState } from 'react'
import type { CategorizedError, RecoveryStrategy } from '../types/errorTypes'
import { useErrorCategory } from './useErrorCategory'

interface RecoveryOptions {
  onSuccess?: () => void
  onFailure?: (error: Error) => void
  onRetry?: (attempt: number) => void
}

interface RecoveryState {
  isRecovering: boolean
  retryCount: number
  nextRetryIn: number | null
}

export function useErrorRecovery() {
  const { categorizeError } = useErrorCategory()
  const retryTimeouts = useRef<Set<number>>(new Set())
  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    isRecovering: false,
    retryCount: 0,
    nextRetryIn: null
  })

  useEffect(() => {
    // Cleanup timeouts on unmount
    const timeouts = retryTimeouts.current
    return () => {
      timeouts.forEach(id => clearTimeout(id))
      timeouts.clear()
    }
  }, [])

  const calculateBackoff = useCallback((
    baseDelay: number,
    attempt: number
  ): number => {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt)
    const jitter = Math.random() * 0.3 * exponentialDelay // 30% jitter
    return Math.min(exponentialDelay + jitter, 30000) // Max 30 seconds
  }, [])

  const attemptRecovery = useCallback(async (
    error: Error | CategorizedError,
    resetError: () => void,
    options?: RecoveryOptions
  ): Promise<boolean> => {
    const categorized = 'category' in error 
      ? error 
      : categorizeError(error)

    if (!categorized.context.retryable) {
      options?.onFailure?.(error)
      return false
    }

    const { recovery } = categorized
    const { maxRetries, retryDelay, fallbackAction } = recovery

    setRecoveryState(prev => ({
      ...prev,
      isRecovering: true
    }))

    const attempt = async (retryCount: number): Promise<boolean> => {
      if (retryCount >= maxRetries) {
        // Max retries reached, execute fallback if available
        if (fallbackAction) {
          fallbackAction()
          return true
        }
        
        setRecoveryState({
          isRecovering: false,
          retryCount: 0,
          nextRetryIn: null
        })
        options?.onFailure?.(error)
        return false
      }

      const delay = calculateBackoff(retryDelay, retryCount)
      
      // Update countdown state
      let countdown = Math.ceil(delay / 1000)
      const countdownInterval = setInterval(() => {
        countdown--
        setRecoveryState(prev => ({
          ...prev,
          nextRetryIn: countdown > 0 ? countdown : null
        }))
        if (countdown <= 0) {
          clearInterval(countdownInterval)
        }
      }, 1000)

      return new Promise((resolve) => {
        const timeoutId = window.setTimeout(() => {
          clearInterval(countdownInterval)
          retryTimeouts.current.delete(timeoutId)
          
          setRecoveryState(prev => ({
            ...prev,
            retryCount: retryCount + 1,
            nextRetryIn: null
          }))
          
          options?.onRetry?.(retryCount + 1)
          
          try {
            resetError()
            setRecoveryState({
              isRecovering: false,
              retryCount: 0,
              nextRetryIn: null
            })
            options?.onSuccess?.()
            resolve(true)
          } catch (_retryError) {
            // Retry failed, attempt again
            attempt(retryCount + 1).then(resolve)
          }
        }, delay)

        retryTimeouts.current.add(timeoutId)
      })
    }

    return attempt(categorized.context.retryCount || 0)
  }, [categorizeError, calculateBackoff])

  const scheduleRetry = useCallback((
    callback: () => void,
    delay: number,
    attempt: number = 0
  ): number => {
    const actualDelay = calculateBackoff(delay, attempt)
    const timeoutId = window.setTimeout(callback, actualDelay)
    retryTimeouts.current.add(timeoutId)
    return timeoutId
  }, [calculateBackoff])

  const cancelRetry = useCallback((timeoutId: number) => {
    clearTimeout(timeoutId)
    retryTimeouts.current.delete(timeoutId)
  }, [])

  const cancelAllRetries = useCallback(() => {
    retryTimeouts.current.forEach(id => clearTimeout(id))
    retryTimeouts.current.clear()
    setRecoveryState({
      isRecovering: false,
      retryCount: 0,
      nextRetryIn: null
    })
  }, [])

  const executeRecoveryStrategy = useCallback(async (
    strategy: RecoveryStrategy,
    resetError: () => void,
    options?: RecoveryOptions
  ): Promise<boolean> => {
    if (strategy.type === 'none') {
      return false
    }

    if (strategy.type === 'manual') {
      // Manual recovery requires user action
      return false
    }

    // Auto recovery
    let attempts = 0
    const maxAttempts = strategy.maxRetries

    const tryRecover = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if (attempts >= maxAttempts) {
          if (strategy.fallbackAction) {
            strategy.fallbackAction()
            resolve(true)
          } else {
            options?.onFailure?.(new Error('Max recovery attempts reached'))
            resolve(false)
          }
          return
        }

        const delay = calculateBackoff(strategy.retryDelay, attempts)
        scheduleRetry(() => {
          attempts++
          options?.onRetry?.(attempts)
          
          try {
            resetError()
            options?.onSuccess?.()
            resolve(true)
          } catch {
            tryRecover().then(resolve)
          }
        }, delay, attempts)
      })
    }

    return tryRecover()
  }, [calculateBackoff, scheduleRetry])

  return {
    attemptRecovery,
    scheduleRetry,
    cancelRetry,
    cancelAllRetries,
    executeRecoveryStrategy,
    recoveryState
  }
}