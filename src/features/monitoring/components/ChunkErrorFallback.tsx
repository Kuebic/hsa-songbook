import React, { useState, useEffect } from 'react'
import { AlertCircle, RefreshCw, Download } from 'lucide-react'
import type { ErrorFallbackProps } from '../types/errorTypes'

export const ChunkErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError,
  level 
}) => {
  const [isReloading, setIsReloading] = useState(false)
  const [hasNewVersion, setHasNewVersion] = useState(false)

  useEffect(() => {
    // Check if error indicates a version mismatch
    const errorMessage = error.message.toLowerCase()
    if (errorMessage.includes('failed to fetch dynamically imported module') ||
        errorMessage.includes('failed to import')) {
      // Likely a deployment version mismatch
      setHasNewVersion(true)
    }
  }, [error])

  const handleReload = () => {
    setIsReloading(true)
    // Force a hard reload to get new chunks
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleRetry = () => {
    // Try to reset without reload first
    resetError()
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          {isReloading ? (
            <RefreshCw size={48} className="text-blue-500 animate-spin" />
          ) : hasNewVersion ? (
            <Download size={48} className="text-orange-500" />
          ) : (
            <AlertCircle size={48} className="text-yellow-500" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-3">
          {hasNewVersion ? 'Update Available' : 'Loading Error'}
        </h2>
        
        <p className="text-gray-600 mb-4">
          {hasNewVersion 
            ? 'A new version of the app is available. Please refresh to get the latest updates.'
            : 'We encountered an issue loading this part of the application.'}
        </p>

        {isReloading && (
          <div className="mb-4 text-sm text-gray-500">
            Refreshing application...
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
            <div className="mt-2 text-xs text-gray-500">
              <p>This usually happens when:</p>
              <ul className="list-disc list-inside mt-1">
                <li>The app was updated while you were using it</li>
                <li>Your browser cache is outdated</li>
                <li>Network interruption during loading</li>
              </ul>
            </div>
          </details>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={handleReload}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={isReloading}
          >
            {hasNewVersion ? 'Update Now' : 'Refresh Page'}
          </button>
          
          {!hasNewVersion && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              disabled={isReloading}
            >
              Try Again
            </button>
          )}
          
          {level !== 'app' && !isReloading && (
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Go Home
            </button>
          )}
        </div>

        {hasNewVersion && (
          <div className="mt-6 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-semibold mb-1">What happens when I update?</p>
            <p>Your work is saved locally and will be restored after the update.</p>
          </div>
        )}

        {!hasNewVersion && (
          <div className="mt-6 text-sm text-gray-500">
            <p>If this keeps happening, try clearing your browser cache.</p>
          </div>
        )}
      </div>
    </div>
  )
}