import React from 'react'
import type { ErrorInfo } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { ErrorFallback } from './ErrorFallback'
import { NetworkErrorFallback } from './NetworkErrorFallback'
import { ChunkErrorFallback } from './ChunkErrorFallback'
import { PermissionErrorFallback } from './PermissionErrorFallback'
import { errorReportingService } from '../services/errorReportingService'
import type { 
  FeatureErrorBoundaryProps, 
  ErrorFallbackProps,
  ErrorCategory 
} from '../types/errorTypes'

// Helper to select appropriate fallback based on error category
const getCategoryFallback = (category: ErrorCategory): React.ComponentType<ErrorFallbackProps> => {
  switch (category) {
    case 'network':
      return NetworkErrorFallback
    case 'chunk':
      return ChunkErrorFallback
    case 'permission':
      return PermissionErrorFallback
    default:
      return ErrorFallback
  }
}

export const FeatureErrorBoundary: React.FC<FeatureErrorBoundaryProps> = ({
  children,
  featureName,
  fallbackComponent,
  onError,
  level = 'section',
  resetKeys = [],
  isolate = false
}) => {
  // Create a wrapper fallback that adds feature context
  const EnhancedFallback = React.useMemo(() => {
    return (props: ErrorFallbackProps) => {
      // Use categorization to select appropriate fallback
      // Note: We can't use hooks here, so we'll categorize in the component
      let category: ErrorCategory = 'unknown'
      const errorMessage = props.error.message?.toLowerCase() || ''
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        category = 'network'
      } else if (errorMessage.includes('loading chunk')) {
        category = 'chunk'
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
        category = 'permission'
      }
      
      // Use custom fallback if provided, otherwise select based on category
      const FallbackComponent = fallbackComponent || getCategoryFallback(category)
      
      return (
        <FallbackComponent 
          {...props} 
          featureName={featureName}
        />
      )
    }
  }, [fallbackComponent, featureName])

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Track feature-specific errors
    errorReportingService.reportError(error, {
      componentStack: errorInfo.componentStack || undefined,
      feature: featureName,
      level,
      timestamp: Date.now()
    })

    // Call custom error handler if provided
    onError?.(error, errorInfo)
  }

  return (
    <ErrorBoundary
      level={level}
      fallback={EnhancedFallback}
      onError={handleError}
      resetKeys={[featureName, ...resetKeys]} // Reset when feature changes
      isolate={isolate}
      enableAutoRecovery
    >
      {children}
    </ErrorBoundary>
  )
}