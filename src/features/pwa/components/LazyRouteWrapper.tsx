import React, { Component, Suspense } from 'react'
import type { ReactNode } from 'react'
import { OfflineFallback } from './OfflineFallback'

interface Props {
  children: ReactNode
  pageName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

class LazyRouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy route loading failed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Check if it's a chunk loading error
      const isChunkError = this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
                          this.state.error?.message?.includes('Loading chunk') ||
                          this.state.error?.message?.includes('Failed to import') ||
                          this.state.error?.name === 'ChunkLoadError'

      if (isChunkError || !navigator.onLine) {
        return <OfflineFallback pageName={this.props.pageName} error={this.state.error} />
      }

      // For other errors, show a generic error message
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: '#fef2f2',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              We couldn't load this page. Please try refreshing.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Loading component for Suspense
const RouteLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '200px',
    fontSize: '1.2rem',
    color: '#64748b'
  }}>
    Loading...
  </div>
)

interface LazyRouteWrapperProps {
  children: ReactNode
  pageName?: string
}

export function LazyRouteWrapper({ children, pageName }: LazyRouteWrapperProps) {
  return (
    <LazyRouteErrorBoundary pageName={pageName}>
      <Suspense fallback={<RouteLoader />}>
        {children}
      </Suspense>
    </LazyRouteErrorBoundary>
  )
}