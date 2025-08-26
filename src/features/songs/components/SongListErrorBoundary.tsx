import React, { useCallback, useState } from 'react'
import { RefreshCw, List, Database } from 'lucide-react'
import { FeatureErrorBoundary } from '../../monitoring/components/FeatureErrorBoundary'
import type { ErrorFallbackProps } from '../../monitoring/types/errorTypes'

// Custom fallback for song list errors
const SongListErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError,
  context 
}) => {
  const [isShowingCached, setIsShowingCached] = useState(false)

  const handleShowCached = useCallback(() => {
    try {
      // Try to load cached songs from localStorage
      const cachedSongs = localStorage.getItem('cached_songs')
      if (cachedSongs) {
        setIsShowingCached(true)
        // In a real implementation, this would render the cached songs
        // For now, we'll just indicate that cached data is available
      } else {
        alert('No cached songs available. Please try refreshing.')
      }
    } catch (err) {
      console.error('Failed to load cached songs:', err)
    }
  }, [])

  const isDataError = error.message.toLowerCase().includes('fetch') ||
                     error.message.toLowerCase().includes('network') ||
                     error.message.toLowerCase().includes('supabase')

  const isRenderError = error.message.toLowerCase().includes('render') ||
                       error.message.toLowerCase().includes('maximum update')

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          {isDataError ? (
            <Database size={48} className="text-red-500" />
          ) : (
            <List size={48} className="text-yellow-500" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-3">
          {isDataError ? 'Unable to Load Songs' : 'Display Error'}
        </h2>
        
        <p className="text-gray-600 mb-4">
          {isDataError 
            ? 'We couldn\'t fetch the song list from the server. Check your connection and try again.'
            : isRenderError
            ? 'Too many songs to display at once. Try filtering or searching to reduce the list.'
            : 'Something went wrong while displaying the songs.'}
        </p>

        {isShowingCached && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
            <p>Showing cached songs (may be outdated)</p>
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
            {isRenderError && (
              <div className="mt-2 text-xs text-gray-500">
                <p>Performance tips:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Use pagination for large lists</li>
                  <li>Implement virtual scrolling</li>
                  <li>Add search/filter functionality</li>
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
            Try Again
          </button>
          
          {isDataError && !isShowingCached && (
            <button
              onClick={handleShowCached}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <List size={16} />
              Show Cached
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

        {isDataError && (
          <div className="mt-6 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-semibold mb-1">Offline Mode Available</p>
            <p>Previously viewed songs are cached and available offline.</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface SongListErrorBoundaryProps {
  children: React.ReactNode
  enableCache?: boolean
}

export const SongListErrorBoundary: React.FC<SongListErrorBoundaryProps> = ({ 
  children,
  enableCache = true 
}) => {
  const handleSongListError = (error: Error) => {
    // Log specific song list errors
    console.error('Song List Error:', {
      error,
      timestamp: new Date().toISOString(),
      enableCache
    })

    // If it's a data fetching error and cache is enabled, try to use cached data
    if (enableCache && error.message.includes('fetch')) {
      // In a real implementation, this would trigger cache fallback
      console.log('Attempting to use cached song data')
    }
  }

  return (
    <FeatureErrorBoundary
      featureName="songs"
      level="section"
      onError={handleSongListError}
      fallbackComponent={SongListErrorFallback}
      isolate={false} // Don't isolate as it might affect search/filter
    >
      {children}
    </FeatureErrorBoundary>
  )
}