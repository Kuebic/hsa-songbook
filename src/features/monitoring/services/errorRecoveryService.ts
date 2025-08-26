import type { 
  CategorizedError, 
  ErrorCategory, 
  RecoveryStrategy,
  ErrorRecoveryMetrics 
} from '../types/errorTypes'

type RecoveryHandler = (error: CategorizedError) => Promise<boolean>
type RecoveryCallback = (success: boolean, error?: Error) => void

class ErrorRecoveryService {
  private recoveryHandlers: Map<ErrorCategory, RecoveryHandler[]> = new Map()
  private recoveryMetrics: ErrorRecoveryMetrics = {
    totalErrors: 0,
    recoveryAttempts: 0,
    successfulRecoveries: 0,
    failedRecoveries: 0,
    errorsByCategory: {} as Record<ErrorCategory, number>,
    recoveryRateByCategory: {} as Record<ErrorCategory, number>
  }
  private activeRecoveries: Set<string> = new Set()

  constructor() {
    this.registerDefaultHandlers()
  }

  /**
   * Register default recovery handlers for common error categories
   */
  private registerDefaultHandlers() {
    // Network error recovery
    this.registerRecovery('network', async (_error) => {
      // Wait for online status
      if (!navigator.onLine) {
        return new Promise((resolve) => {
          const handleOnline = () => {
            window.removeEventListener('online', handleOnline)
            resolve(true)
          }
          window.addEventListener('online', handleOnline)
          
          // Timeout after 30 seconds
          setTimeout(() => {
            window.removeEventListener('online', handleOnline)
            resolve(false)
          }, 30000)
        })
      }
      return true
    })

    // Chunk loading error recovery
    this.registerRecovery('chunk', async (error) => {
      // Check if it's a version mismatch
      if (error.message.includes('Failed to fetch dynamically imported module')) {
        // Clear module cache and reload
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          await Promise.all(
            cacheNames.map(name => caches.delete(name))
          )
        }
        // Force reload in 2 seconds
        setTimeout(() => window.location.reload(), 2000)
        return true
      }
      return false
    })

    // Permission error recovery
    this.registerRecovery('permission', async (_error) => {
      // Check if token expired
      const token = localStorage.getItem('auth_token')
      if (!token || this.isTokenExpired(token)) {
        // Redirect to login
        window.location.href = '/auth/signin?expired=true'
        return true
      }
      return false
    })
  }

  /**
   * Register a recovery handler for a specific error category
   */
  registerRecovery(category: ErrorCategory, handler: RecoveryHandler) {
    if (!this.recoveryHandlers.has(category)) {
      this.recoveryHandlers.set(category, [])
    }
    this.recoveryHandlers.get(category)!.push(handler)
  }

  /**
   * Execute recovery strategy for a categorized error
   */
  async executeRecovery(
    error: CategorizedError,
    strategy?: RecoveryStrategy,
    callback?: RecoveryCallback
  ): Promise<boolean> {
    // Prevent duplicate recovery attempts
    const recoveryId = `${error.category}-${error.message}`
    if (this.activeRecoveries.has(recoveryId)) {
      return false
    }

    this.activeRecoveries.add(recoveryId)
    this.recoveryMetrics.totalErrors++
    this.recoveryMetrics.errorsByCategory[error.category] = 
      (this.recoveryMetrics.errorsByCategory[error.category] || 0) + 1

    try {
      // Use provided strategy or error's default
      const recoveryStrategy = strategy || error.recovery

      if (recoveryStrategy.type === 'none') {
        callback?.(false, new Error('Recovery not available'))
        return false
      }

      if (recoveryStrategy.type === 'manual') {
        callback?.(false, new Error('Manual recovery required'))
        return false
      }

      // Auto recovery
      this.recoveryMetrics.recoveryAttempts++
      
      // Get registered handlers for this category
      const handlers = this.recoveryHandlers.get(error.category) || []
      
      // Try each handler until one succeeds
      for (const handler of handlers) {
        try {
          const success = await handler(error)
          if (success) {
            this.recordSuccess(error.category)
            callback?.(true)
            return true
          }
        } catch (handlerError) {
          console.error('Recovery handler failed:', handlerError)
        }
      }

      // If no handlers succeeded, try fallback action
      if (recoveryStrategy.fallbackAction) {
        recoveryStrategy.fallbackAction()
        this.recordSuccess(error.category)
        callback?.(true)
        return true
      }

      this.recordFailure(error.category)
      callback?.(false, new Error('All recovery attempts failed'))
      return false

    } finally {
      this.activeRecoveries.delete(recoveryId)
    }
  }

  /**
   * Get recovery metrics
   */
  getMetrics(): ErrorRecoveryMetrics {
    return { ...this.recoveryMetrics }
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.recoveryMetrics = {
      totalErrors: 0,
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      recoveryRateByCategory: {} as Record<ErrorCategory, number>
    }
  }

  /**
   * Check if recovery is in progress for an error
   */
  isRecovering(error: Error): boolean {
    const recoveryId = `${(error as Error & { category?: string }).category || 'unknown'}-${error.message}`
    return this.activeRecoveries.has(recoveryId)
  }

  private recordSuccess(category: ErrorCategory) {
    this.recoveryMetrics.successfulRecoveries++
    const categoryAttempts = this.recoveryMetrics.errorsByCategory[category] || 0
    const categorySuccesses = 
      ((this.recoveryMetrics.recoveryRateByCategory[category] || 0) * categoryAttempts) + 1
    this.recoveryMetrics.recoveryRateByCategory[category] = 
      categorySuccesses / categoryAttempts
  }

  private recordFailure(category: ErrorCategory) {
    this.recoveryMetrics.failedRecoveries++
    const categoryAttempts = this.recoveryMetrics.errorsByCategory[category] || 0
    const categorySuccesses = 
      (this.recoveryMetrics.recoveryRateByCategory[category] || 0) * categoryAttempts
    this.recoveryMetrics.recoveryRateByCategory[category] = 
      categorySuccesses / categoryAttempts
  }

  private isTokenExpired(token: string): boolean {
    try {
      // Simple JWT expiration check (would need proper implementation)
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }
}

// Export singleton instance
export const errorRecoveryService = new ErrorRecoveryService()

// Export class for testing
export { ErrorRecoveryService }