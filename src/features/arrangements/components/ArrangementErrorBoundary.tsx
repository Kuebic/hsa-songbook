import React, { useCallback } from 'react'
import { AlertCircle, RefreshCw, Save } from 'lucide-react'
import { FeatureErrorBoundary } from '../../monitoring/components/FeatureErrorBoundary'
import type { ErrorFallbackProps } from '../../monitoring/types/errorTypes'
import { EditorStorageService } from '../services/EditorStorageService'

// Custom fallback for arrangement-specific errors
const ArrangementErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError 
}) => {
  const handleRestoreFromDraft = useCallback(async () => {
    try {
      // Try to restore from session storage
      const storageService = new EditorStorageService()
      const arrangementId = window.location.pathname.split('/').pop() || ''
      const draft = await storageService.loadDraftFromSession(arrangementId)
      
      if (draft) {
        // Store draft in session for recovery after reset
        sessionStorage.setItem('recovered_draft', JSON.stringify(draft))
        resetError()
      } else {
        alert('No auto-saved draft found. Please try refreshing the page.')
      }
    } catch (err) {
      console.error('Failed to restore from draft:', err)
      alert('Failed to restore from auto-save. Please try refreshing the page.')
    }
  }, [resetError])

  const isParsingError = error.message.toLowerCase().includes('parse') || 
                        error.message.toLowerCase().includes('chordsheet') ||
                        error.message.toLowerCase().includes('syntax')


  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <AlertCircle size={48} className="text-yellow-500" />
        </div>
        
        <h2 className="text-2xl font-bold mb-3">
          {isParsingError ? 'Invalid Chord Format' : 'Editor Error'}
        </h2>
        
        <p className="text-gray-600 mb-4">
          {isParsingError 
            ? 'The chord sheet contains invalid formatting. Your work has been auto-saved.'
            : 'The chord editor encountered an issue. Your work has been auto-saved.'}
        </p>

        {import.meta.env.DEV && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {error.stack || error.message}
            </pre>
            {isParsingError && (
              <div className="mt-2 text-xs text-gray-500">
                <p>Common issues:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Missing closing brackets in chords</li>
                  <li>Invalid chord notation</li>
                  <li>Unclosed directives</li>
                </ul>
              </div>
            )}
          </details>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Restart Editor
          </button>
          
          <button
            onClick={handleRestoreFromDraft}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Restore Auto-save
          </button>
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <p className="font-semibold mb-1">Don't worry!</p>
          <p>Your work is automatically saved every few seconds. You can safely restart the editor.</p>
        </div>
      </div>
    </div>
  )
}

interface ArrangementErrorBoundaryProps {
  children: React.ReactNode
  arrangementId?: string
}

export const ArrangementErrorBoundary: React.FC<ArrangementErrorBoundaryProps> = ({ 
  children,
  arrangementId 
}) => {
  const handleArrangementError = (error: Error) => {
    // Log specific arrangement errors for debugging
    console.error('Arrangement Error:', {
      error,
      arrangementId,
      timestamp: new Date().toISOString()
    })
  }

  return (
    <FeatureErrorBoundary
      featureName="arrangements"
      level="component"
      onError={handleArrangementError}
      fallbackComponent={ArrangementErrorFallback}
      resetKeys={arrangementId ? [arrangementId] : undefined} // Reset when arrangement changes
      isolate // Prevent editor errors from affecting rest of page
    >
      {children}
    </FeatureErrorBoundary>
  )
}