import { useParams, useNavigate } from 'react-router-dom'
import { usePublicSetlist } from '../hooks/queries/useSetlistsQuery'
import { isValidShareId } from '../utils/shareIdGenerator'

export function PublicSetlistPage() {
  const { shareId } = useParams<{ shareId: string }>()
  const navigate = useNavigate()
  
  const { data: setlist, isLoading, error } = usePublicSetlist(shareId || '')
  
  // Validate shareId format
  if (!shareId || !isValidShareId(shareId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Invalid Share Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This share link is not valid or has expired.
          </p>
          <button
            onClick={() => navigate('/setlists')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            Browse Setlists
          </button>
        </div>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading setlist...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    const isNotFound = (error as { statusCode?: number })?.statusCode === 404
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">{isNotFound ? '📋' : '⚠️'}</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {isNotFound ? 'Setlist Not Found' : 'Error Loading Setlist'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {isNotFound 
              ? 'This setlist is no longer available or has been made private.'
              : 'There was an error loading this setlist. Please try again later.'
            }
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/setlists')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Browse Setlists
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  if (!setlist) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/setlists')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                aria-label="Back to setlists"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {setlist.name}
                </h1>
                {setlist.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {setlist.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Public indicator */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span>Public Setlist</span>
            </div>
          </div>
          
          {/* Metadata */}
          <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{setlist.arrangements.length} songs</span>
            </div>
            
            {setlist.createdByName && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>Created by {setlist.createdByName}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Updated {new Date(setlist.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {setlist.arrangements.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Songs Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This setlist doesn't have any songs added yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Songs ({setlist.arrangements.length})
            </h2>
            
            {setlist.arrangements
              .sort((a, b) => a.order - b.order)
              .map((arrangement, index) => (
                <div key={arrangement.arrangementId} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                    {index + 1}
                  </div>
                  <div className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {arrangement.arrangement?.name || 'Loading...'}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {arrangement.keyOverride && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          Key: {arrangement.keyOverride}
                        </span>
                      )}
                      {arrangement.arrangement?.key && !arrangement.keyOverride && (
                        <span>Key: {arrangement.arrangement.key}</span>
                      )}
                      {arrangement.notes && (
                        <span className="italic">"{arrangement.notes}"</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>HSA Songbook - Worship setlist sharing platform</p>
            </div>
            <button
              onClick={() => navigate('/setlists')}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Create your own setlist →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}