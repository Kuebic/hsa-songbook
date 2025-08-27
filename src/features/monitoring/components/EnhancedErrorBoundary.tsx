import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { type ReactNode, type ErrorInfo } from 'react'
import { ErrorFallback } from './ErrorFallback'
import { errorReportingService } from '../services/errorReportingService'

interface EnhancedErrorBoundaryProps {
  children: ReactNode
  level?: 'app' | 'page' | 'section' | 'component'
  fallback?: React.ComponentType<FallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKeys?: Array<unknown>
  resetOnPropsChange?: boolean
  isolate?: boolean
  onReset?: () => void
}

/**
 * Enhanced error boundary component using react-error-boundary library
 * Maintains backwards compatibility with existing ErrorBoundary API
 * while providing additional features like useErrorBoundary hook support
 */
export function EnhancedErrorBoundary({
  children,
  level = 'component',
  fallback = ErrorFallback,
  onError,
  resetKeys = [],
  resetOnPropsChange = false,
  isolate = false,
  onReset,
}: EnhancedErrorBoundaryProps) {
  // Create a unique key for isolation if needed
  const isolationKey = isolate ? `error-boundary-${level}` : undefined

  const wrapperClassName = isolate ? 'error-boundary-isolation' : undefined
  
  return (
    <div className={wrapperClassName} key={isolationKey}>
      <ReactErrorBoundary
        FallbackComponent={fallback}
        onError={(error, errorInfo) => {
          // Report to error service with context
          errorReportingService.reportError(error, {
            level,
            componentStack: errorInfo.componentStack || undefined,
            errorBoundaryProps: { resetKeys, isolate },
            timestamp: Date.now(),
          })

          // Call custom onError handler if provided
          onError?.(error, errorInfo)

          // Log in development
          if (process.env.NODE_ENV === 'development') {
            console.error(`[ErrorBoundary:${level}] Error caught:`, error)
            console.error('Component stack:', errorInfo.componentStack)
          }
        }}
        resetKeys={resetKeys}
        onReset={(details) => {
          // Clear any cached error state
          onReset?.()

          // Log reset in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ErrorBoundary:${level}] Reset triggered:`, details)
          }
        }}
      >
        {resetOnPropsChange ? (
          // Wrapper to handle resetOnPropsChange behavior
          <PropsChangeWrapper resetKeys={resetKeys}>
            {children}
          </PropsChangeWrapper>
        ) : (
          children
        )}
      </ReactErrorBoundary>
    </div>
  )
}

/**
 * Helper component to handle resetOnPropsChange functionality
 * This mimics the behavior of the original custom ErrorBoundary
 */
function PropsChangeWrapper({ 
  children, 
  resetKeys: _resetKeys 
}: { 
  children: ReactNode
  resetKeys?: Array<unknown> 
}) {
  // The react-error-boundary library handles this through resetKeys
  // This wrapper is kept for API compatibility but the functionality
  // is handled by the parent ErrorBoundary's resetKeys prop
  return <>{children}</>
}

// Add CSS isolation styles if not already present
if (typeof window !== 'undefined' && !document.querySelector('#error-boundary-isolation-styles')) {
  const style = document.createElement('style')
  style.id = 'error-boundary-isolation-styles'
  style.textContent = `
    .error-boundary-isolation {
      isolation: isolate;
      contain: layout style;
    }
  `
  document.head.appendChild(style)
}

// Export type for backwards compatibility
export type { FallbackProps as ErrorFallbackProps } from 'react-error-boundary'