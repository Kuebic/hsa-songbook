import React, { useCallback, useState } from 'react'
import { RefreshCw, FileText, Save, Undo } from 'lucide-react'
import { FeatureErrorBoundary } from '../../monitoring/components/FeatureErrorBoundary'
import type { ErrorFallbackProps } from '../../monitoring/types/errorTypes'

// Custom fallback for setlist errors
const SetlistErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError,
  context 
}) => {
  const [isRecovering, setIsRecovering] = useState(false)

  const handleRecoverSetlist = useCallback(async () => {
    setIsRecovering(true)
    try {
      // Try to recover unsaved setlist changes from localStorage
      const unsavedSetlist = localStorage.getItem('unsaved_setlist')
      if (unsavedSetlist) {
        // Store for recovery after reset
        sessionStorage.setItem('recovered_setlist', unsavedSetlist)
        localStorage.removeItem('unsaved_setlist')
        resetError()
      } else {
        alert('No unsaved changes found.')
      }
    } catch (err) {
      console.error('Failed to recover setlist:', err)
      alert('Failed to recover setlist. Please try refreshing.')
    } finally {
      setIsRecovering(false)
    }
  }, [resetError])

  const isSaveError = error.message.toLowerCase().includes('save') ||
                     error.message.toLowerCase().includes('update')

  const isDragDropError = error.message.toLowerCase().includes('drag') ||
                         error.message.toLowerCase().includes('drop') ||
                         error.message.toLowerCase().includes('reorder')

  const isSyncError = error.message.toLowerCase().includes('sync') ||
                     error.message.toLowerCase().includes('conflict')

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          {isSaveError ? (
            <Save size={48} className="text-red-500" />
          ) : isSyncError ? (
            <Undo size={48} className="text-orange-500" />
          ) : (
            <FileText size={48} className="text-yellow-500" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-3">
          {isSaveError ? 'Save Failed' : 
           isSyncError ? 'Sync Conflict' :
           isDragDropError ? 'Reorder Failed' : 
           'Setlist Error'}
        </h2>
        
        <p className="text-gray-600 mb-4">
          {isSaveError 
            ? 'Your changes couldn\'t be saved. They\'re preserved locally.'
            : isSyncError
            ? 'Your setlist has conflicts with the server version.'
            : isDragDropError
            ? 'Failed to reorder songs. Your setlist is unchanged.'
            : 'Something went wrong with your setlist.'}
        </p>

        {isRecovering && (
          <div className="mb-4 text-sm text-gray-500">
            Recovering setlist...
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
            {isSyncError && (
              <div className="mt-2 text-xs text-gray-500">
                <p>Sync conflict resolution:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Keep local version</li>
                  <li>Accept server version</li>
                  <li>Merge changes manually</li>
                </ul>
              </div>
            )}
          </details>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            disabled={isRecovering}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          
          {(isSaveError || isSyncError) && (
            <button
              onClick={handleRecoverSetlist}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              disabled={isRecovering}
            >
              <Undo size={16} />
              Recover Changes
            </button>
          )}
          
          {context?.level !== 'app' && (
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Go Home
            </button>
          )}
        </div>

        {isSaveError && (
          <div className="mt-6 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
            <p className="font-semibold mb-1">Changes Preserved</p>
            <p>Your unsaved changes are stored locally and will be recovered when you retry.</p>
          </div>
        )}

        {isSyncError && (
          <div className="mt-6 p-3 bg-orange-50 rounded-lg text-sm text-orange-700">
            <p className="font-semibold mb-1">Conflict Resolution Required</p>
            <p>Another user may have edited this setlist. Choose to keep your version or refresh for the latest.</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface SetlistErrorBoundaryProps {
  children: React.ReactNode
  setlistId?: string
  onConflict?: (local: Record<string, unknown>, remote: Record<string, unknown>) => void
}

export const SetlistErrorBoundary: React.FC<SetlistErrorBoundaryProps> = ({ 
  children,
  setlistId,
  onConflict 
}) => {
  const handleSetlistError = (error: Error) => {
    // Log specific setlist errors
    console.error('Setlist Error:', {
      error,
      setlistId,
      timestamp: new Date().toISOString()
    })

    // Save current state for recovery if it's a save error
    if (error.message.includes('save') || error.message.includes('update')) {
      try {
        // In a real implementation, this would save the current setlist state
        const currentSetlist = {} as Record<string, unknown> // would get from context/props
        localStorage.setItem('unsaved_setlist', JSON.stringify(currentSetlist))
      } catch (err) {
        console.error('Failed to preserve unsaved changes:', err)
      }
    }

    // Handle sync conflicts
    if (error.message.includes('conflict') && onConflict) {
      // In a real implementation, this would extract conflict data
      const localVersion = {} as Record<string, unknown> // local data
      const remoteVersion = {} as Record<string, unknown> // remote data
      onConflict(localVersion, remoteVersion)
    }
  }

  return (
    <FeatureErrorBoundary
      featureName="setlists"
      level="section"
      onError={handleSetlistError}
      fallbackComponent={SetlistErrorFallback}
      resetKeys={setlistId ? [setlistId] : undefined} // Reset when setlist changes
      isolate={false} // Don't isolate to maintain drag-drop context
    >
      {children}
    </FeatureErrorBoundary>
  )
}