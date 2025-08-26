import React, { useEffect, useState, useCallback } from 'react'
import { RefreshCw, WifiOff } from 'lucide-react'
import type { ErrorFallbackProps } from '../types/errorTypes'

export const NetworkErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError,
  context 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null)

  const startRetryCountdown = useCallback((initialSeconds: number = 5) => {
    let countdown = initialSeconds
    setRetryCountdown(countdown)

    const timer = setInterval(() => {
      countdown--
      if (countdown <= 0) {
        clearInterval(timer)
        setRetryCountdown(null)
        resetError()
      } else {
        setRetryCountdown(countdown)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [resetError])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-retry when connection restored
      if (context?.retryable) {
        startRetryCountdown()
      }
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.retryable])

  useEffect(() => {
    // Check if we're recovering automatically
    type ContextWithRecovery = typeof context & {
      recoveryDelay?: number
      isRecovering?: boolean
    }
    const contextWithRecovery = context as ContextWithRecovery
    const recoveryDelay = contextWithRecovery?.recoveryDelay
    if (recoveryDelay && contextWithRecovery?.isRecovering) {
      const seconds = Math.ceil(recoveryDelay / 1000)
      startRetryCountdown(seconds)
    }
  }, [context, startRetryCountdown])

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          {isOnline ? (
            <RefreshCw 
              size={48} 
              className={`text-blue-500 ${retryCountdown !== null ? 'animate-spin' : ''}`} 
            />
          ) : (
            <WifiOff size={48} className="text-gray-400" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-3">
          {isOnline ? 'Connection Error' : 'You\'re Offline'}
        </h2>
        
        <p className="text-gray-600 mb-4">
          {isOnline 
            ? 'Having trouble connecting to our servers. Please check your connection and try again.'
            : 'Please check your internet connection to continue.'}
        </p>

        {retryCountdown !== null && (
          <div className="mb-4 text-sm text-gray-500">
            Retrying in {retryCountdown} second{retryCountdown !== 1 ? 's' : ''}...
          </div>
        )}

        {import.meta.env.DEV && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {error.stack || error.message}
            </pre>
          </details>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={retryCountdown !== null}
          >
            Try Again
          </button>
          
          {context?.level !== 'app' && (
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Go Home
            </button>
          )}
        </div>

        {isOnline && (
          <div className="mt-6 text-sm text-gray-500">
            <p>If this problem persists, our service might be temporarily unavailable.</p>
          </div>
        )}
      </div>
    </div>
  )
}