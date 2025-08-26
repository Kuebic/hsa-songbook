import React from 'react'
import { Lock, LogIn, ShieldAlert } from 'lucide-react'
import type { ErrorFallbackProps } from '../types/errorTypes'

export const PermissionErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError,
  context,
  level,
  featureName 
}) => {
  const isUnauthorized = error.message.toLowerCase().includes('unauthorized') || 
                        error.message.includes('401')
  const isForbidden = error.message.toLowerCase().includes('forbidden') || 
                      error.message.includes('403')

  const handleSignIn = () => {
    // Navigate to sign in page
    window.location.href = '/auth/signin?redirect=' + encodeURIComponent(window.location.pathname)
  }

  const getIcon = () => {
    if (isUnauthorized) return <LogIn size={48} className="text-blue-500" />
    if (isForbidden) return <ShieldAlert size={48} className="text-red-500" />
    return <Lock size={48} className="text-yellow-500" />
  }

  const getTitle = () => {
    if (isUnauthorized) return 'Sign In Required'
    if (isForbidden) return 'Access Denied'
    return 'Permission Required'
  }

  const getMessage = () => {
    if (isUnauthorized) {
      return 'Please sign in to access this content.'
    }
    if (isForbidden) {
      return `You don't have permission to access ${featureName || 'this feature'}. Contact an administrator if you believe this is an error.`
    }
    return 'You need additional permissions to view this content.'
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          {getIcon()}
        </div>
        
        <h2 className="text-2xl font-bold mb-3">
          {getTitle()}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {getMessage()}
        </p>

        {import.meta.env.DEV && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {error.stack || error.message}
            </pre>
            <div className="mt-2 text-xs text-gray-500">
              <p>Error code: {isUnauthorized ? '401' : isForbidden ? '403' : 'Permission Error'}</p>
              {featureName && <p>Feature: {featureName}</p>}
              {context?.action && <p>Action: {context.action}</p>}
            </div>
          </details>
        )}

        <div className="flex gap-4 justify-center">
          {isUnauthorized ? (
            <>
              <button
                onClick={handleSignIn}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Go Home
              </button>
            </>
          ) : (
            <>
              <button
                onClick={resetError}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
              {level !== 'app' && (
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Go Home
                </button>
              )}
            </>
          )}
        </div>

        {isForbidden && (
          <div className="mt-6 p-3 bg-red-50 rounded-lg text-sm text-red-700">
            <p className="font-semibold mb-1">Need Access?</p>
            <p>Contact your administrator to request access to this feature.</p>
          </div>
        )}

        {isUnauthorized && (
          <div className="mt-6 text-sm text-gray-500">
            <p>Your session may have expired. Sign in again to continue.</p>
          </div>
        )}
      </div>
    </div>
  )
}