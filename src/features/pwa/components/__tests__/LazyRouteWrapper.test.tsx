import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { LazyRouteWrapper } from '../LazyRouteWrapper'
import { lazy } from 'react'

// Mock OfflineFallback component
vi.mock('../OfflineFallback', () => ({
  OfflineFallback: ({ pageName, error }: { pageName?: string; error?: Error | null }) => (
    <div data-testid="offline-fallback">
      Offline Fallback - {pageName || 'Default'} - Error: {error?.message || 'none'}
    </div>
  )
}))

// Mock navigator.onLine
const mockNavigatorOnLine = (isOnline: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    configurable: true,
    value: isOnline
  })
}

describe('LazyRouteWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigatorOnLine(true)
    // Suppress console errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('normal loading', () => {
    it('should show loading state while component is loading', () => {
      const LazyComponent = lazy(() => new Promise(() => {})) // Never resolves
      
      render(
        <LazyRouteWrapper>
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should render children when loaded successfully', async () => {
      const TestComponent = () => <div>Test Component Loaded</div>
      const LazyComponent = lazy(() => Promise.resolve({
        default: TestComponent
      }))
      
      render(
        <LazyRouteWrapper>
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Test Component Loaded')).toBeInTheDocument()
      })
      
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    it('should render component normally when no error occurs', async () => {
      const TestComponent = () => <div>Normal Component</div>
      const LazyComponent = lazy(() => Promise.resolve({
        default: TestComponent
      }))
      
      render(
        <LazyRouteWrapper pageName="Test Page">
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Normal Component')).toBeInTheDocument()
      })
    })
  })

  describe('error handling', () => {
    it('should catch chunk loading errors and show offline fallback', async () => {
      const LazyComponent = lazy(() => 
        Promise.reject(new Error('Failed to fetch dynamically imported module'))
      )
      
      render(
        <LazyRouteWrapper pageName="Songs">
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      await waitFor(() => {
        const fallback = screen.getByTestId('offline-fallback')
        expect(fallback).toBeInTheDocument()
        expect(fallback).toHaveTextContent('Songs')
        expect(fallback).toHaveTextContent('Failed to fetch dynamically imported module')
      })
    })

    it('should handle Loading chunk errors', async () => {
      const LazyComponent = lazy(() => 
        Promise.reject(new Error('Loading chunk 5 failed'))
      )
      
      render(
        <LazyRouteWrapper>
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('offline-fallback')).toBeInTheDocument()
      })
    })

    it('should handle ChunkLoadError', async () => {
      const error = new Error('Network error')
      error.name = 'ChunkLoadError'
      
      const LazyComponent = lazy(() => Promise.reject(error))
      
      render(
        <LazyRouteWrapper>
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('offline-fallback')).toBeInTheDocument()
      })
    })

    it('should show offline fallback when navigator is offline', async () => {
      mockNavigatorOnLine(false)
      
      const LazyComponent = lazy(() => 
        Promise.reject(new Error('Generic error'))
      )
      
      render(
        <LazyRouteWrapper>
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('offline-fallback')).toBeInTheDocument()
      })
    })

    it('should show generic error for non-chunk errors when online', async () => {
      mockNavigatorOnLine(true)
      
      const LazyComponent = lazy(() => 
        Promise.reject(new Error('Generic runtime error'))
      )
      
      render(
        <LazyRouteWrapper>
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.getByText(/We couldn't load this page/)).toBeInTheDocument()
        expect(screen.getByText('Refresh Page')).toBeInTheDocument()
      })
    })

    it('should reload page when refresh button is clicked', async () => {
      const mockReload = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })
      
      const LazyComponent = lazy(() => 
        Promise.reject(new Error('Generic runtime error'))
      )
      
      render(
        <LazyRouteWrapper>
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      await waitFor(() => {
        const refreshButton = screen.getByText('Refresh Page')
        expect(refreshButton).toBeInTheDocument()
        refreshButton.click()
      })
      
      expect(mockReload).toHaveBeenCalled()
    })

    it('should log errors to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const error = new Error('Test error')
      
      const LazyComponent = lazy(() => Promise.reject(error))
      
      render(
        <LazyRouteWrapper>
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Lazy route loading failed:',
          expect.any(Error),
          expect.any(Object)
        )
      })
    })
  })

  describe('error recovery', () => {
    it('should handle runtime errors in loaded components', async () => {
      const TestComponent = () => {
        throw new Error('Runtime error in component')
      }
      
      const LazyComponent = lazy(() => Promise.resolve({
        default: TestComponent
      }))
      
      render(
        <LazyRouteWrapper>
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      })
    })

    it('should preserve error state between renders', async () => {
      const TestComponent = () => {
        throw new Error('Persistent error')
      }
      
      const LazyComponent = lazy(() => Promise.resolve({
        default: TestComponent
      }))
      
      const { rerender } = render(
        <LazyRouteWrapper pageName="Page1">
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      })
      
      // Rerender with different props
      rerender(
        <LazyRouteWrapper pageName="Page2">
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      // Error state should persist
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  describe('loading indicator', () => {
    it('should have proper styling for loading state', () => {
      const LazyComponent = lazy(() => new Promise(() => {}))
      
      render(
        <LazyRouteWrapper>
          <LazyComponent />
        </LazyRouteWrapper>
      )
      
      const loader = screen.getByText('Loading...')
      expect(loader).toHaveStyle({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        fontSize: '1.2rem',
        color: '#64748b'
      })
    })
  })

  describe('multiple children', () => {
    it('should handle multiple lazy components', async () => {
      const TestComponent1 = () => <div>Component 1</div>
      const TestComponent2 = () => <div>Component 2</div>
      
      const LazyComponent1 = lazy(() => Promise.resolve({
        default: TestComponent1
      }))
      const LazyComponent2 = lazy(() => Promise.resolve({
        default: TestComponent2
      }))
      
      render(
        <LazyRouteWrapper>
          <LazyComponent1 />
          <LazyComponent2 />
        </LazyRouteWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Component 1')).toBeInTheDocument()
        expect(screen.getByText('Component 2')).toBeInTheDocument()
      })
    })
  })
})