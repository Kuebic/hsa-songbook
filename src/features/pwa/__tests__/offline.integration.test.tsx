import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { lazy } from 'react'
import React from 'react'

// Mock virtual:pwa-register/react before importing components
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn()
  }))
}))

import { LazyRouteWrapper } from '../components/LazyRouteWrapper'
import { OfflineIndicator } from '../components/OfflineIndicator'
import { UpdatePrompt } from '../components/UpdatePrompt'

// Mock navigator.onLine
const mockNavigatorOnLine = (isOnline: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    configurable: true,
    value: isOnline
  })
}

// Mock component that simulates a lazy-loaded route
const MockLazyComponent = () => <div>Lazy Component Loaded</div>

describe('PWA Offline Integration', () => {
  const originalNavigatorOnLine = navigator.onLine

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigatorOnLine(true)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: originalNavigatorOnLine
    })
  })

  describe('Offline navigation flow', () => {
    it('should show offline fallback when chunk loading fails while offline', async () => {
      mockNavigatorOnLine(false)
      
      const LazyComponent = lazy(() => 
        Promise.reject(new Error('Failed to fetch dynamically imported module'))
      )
      
      render(
        <MemoryRouter>
          <LazyRouteWrapper pageName="Test Page">
            <LazyComponent />
          </LazyRouteWrapper>
        </MemoryRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByText(/Test Page is Not Available Offline/)).toBeInTheDocument()
      })
    })

    it('should navigate to cached pages when offline', async () => {
      const LazyComponent = lazy(() => Promise.resolve({
        default: MockLazyComponent
      }))
      
      render(
        <MemoryRouter>
          <LazyRouteWrapper>
            <LazyComponent />
          </LazyRouteWrapper>
        </MemoryRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Lazy Component Loaded')).toBeInTheDocument()
      })
      
      // Simulate going offline
      mockNavigatorOnLine(false)
      window.dispatchEvent(new Event('offline'))
      
      // Component should still be visible since it's already loaded
      expect(screen.getByText('Lazy Component Loaded')).toBeInTheDocument()
    })

    it('should show reload prompt when coming back online after error', async () => {
      mockNavigatorOnLine(false)
      
      const LazyComponent = lazy(() => 
        Promise.reject(new Error('Network error'))
      )
      
      const { rerender } = render(
        <MemoryRouter>
          <LazyRouteWrapper pageName="Songs">
            <LazyComponent />
          </LazyRouteWrapper>
        </MemoryRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByText(/Songs is Not Available Offline/)).toBeInTheDocument()
      })
      
      // Simulate coming back online
      mockNavigatorOnLine(true)
      window.dispatchEvent(new Event('online'))
      
      // Force re-render to simulate state update
      rerender(
        <MemoryRouter>
          <LazyRouteWrapper pageName="Songs">
            <LazyComponent />
          </LazyRouteWrapper>
        </MemoryRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Connection Restored!')).toBeInTheDocument()
        expect(screen.getByText('Reload Page')).toBeInTheDocument()
      })
    })
  })

  describe('Offline indicator behavior', () => {
    it('should show offline indicator when going offline', () => {
      const TestApp = () => {
        const [isOnline, setIsOnline] = React.useState(true)
        const [wasOffline, setWasOffline] = React.useState(false)
        
        React.useEffect(() => {
          const handleOnline = () => setIsOnline(true)
          const handleOffline = () => {
            setIsOnline(false)
            setWasOffline(true)
          }
          
          window.addEventListener('online', handleOnline)
          window.addEventListener('offline', handleOffline)
          
          return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
          }
        }, [])
        
        // Mock the hook behavior directly in the component
        vi.mock('../../hooks/useOnlineStatus', () => ({
          useOnlineStatus: () => ({ isOnline, wasOffline })
        }))
        
        return <OfflineIndicator />
      }
      
      render(<TestApp />)
      
      // Initially online - should not show any indicator
      expect(screen.queryByText("You're offline")).not.toBeInTheDocument()
      
      // Go offline
      act(() => {
        mockNavigatorOnLine(false)
        window.dispatchEvent(new Event('offline'))
      })
      
      // Should show offline indicator
      waitFor(() => {
        expect(screen.getByText("You're offline")).toBeInTheDocument()
      })
    })

    it('should show back online message temporarily when connection is restored', async () => {
      // This test simulates the full offline to online transition
      const TestApp = () => {
        const [isOnline, setIsOnline] = React.useState(false)
        const [wasOffline, setWasOffline] = React.useState(true)
        
        React.useEffect(() => {
          const handleOnline = () => {
            setIsOnline(true)
          }
          
          window.addEventListener('online', handleOnline)
          
          return () => {
            window.removeEventListener('online', handleOnline)
          }
        }, [])
        
        // Directly use the state in the component for testing
        const { OfflineIndicator: Indicator } = require('../components/OfflineIndicator')
        
        // Override the hook for this test
        vi.mock('../../hooks/useOnlineStatus', () => ({
          useOnlineStatus: () => ({ isOnline, wasOffline })
        }))
        
        return <Indicator />
      }
      
      render(<TestApp />)
      
      // Start offline
      expect(screen.getByText("You're offline")).toBeInTheDocument()
      
      // Go online
      act(() => {
        mockNavigatorOnLine(true)
        window.dispatchEvent(new Event('online'))
      })
      
      // Should show back online message
      await waitFor(() => {
        expect(screen.queryByText("You're offline")).not.toBeInTheDocument()
        expect(screen.getByText('Back online!')).toBeInTheDocument()
      })
      
      // Wait for message to disappear
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      
      await waitFor(() => {
        expect(screen.queryByText('Back online!')).not.toBeInTheDocument()
      })
    })
  })

  describe('Service worker update flow', () => {
    it('should coordinate update prompt with offline state', () => {
      // Mock the service worker hook to show update available
      vi.mock('../../hooks/useServiceWorker', () => ({
        useServiceWorker: () => ({
          needRefresh: true,
          offlineReady: false,
          updateServiceWorker: vi.fn(),
          close: vi.fn()
        })
      }))
      
      const TestApp = () => (
        <>
          <UpdatePrompt />
          <OfflineIndicator />
        </>
      )
      
      render(<TestApp />)
      
      // Should show update prompt
      expect(screen.getByText('New version available!')).toBeInTheDocument()
      
      // Go offline
      mockNavigatorOnLine(false)
      window.dispatchEvent(new Event('offline'))
      
      // Both prompts should be visible
      waitFor(() => {
        expect(screen.getByText('New version available!')).toBeInTheDocument()
        expect(screen.getByText("You're offline")).toBeInTheDocument()
      })
    })
  })

  describe('Error recovery scenarios', () => {
    it('should handle chunk loading errors gracefully', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const LazyComponent = lazy(() => 
        Promise.reject(new Error('ChunkLoadError: Loading chunk 5 failed'))
      )
      
      render(
        <MemoryRouter>
          <LazyRouteWrapper pageName="Dashboard">
            <LazyComponent />
          </LazyRouteWrapper>
        </MemoryRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByText(/Dashboard is Not Available Offline/)).toBeInTheDocument()
      })
      
      expect(errorSpy).toHaveBeenCalledWith(
        'Lazy route loading failed:',
        expect.any(Error),
        expect.any(Object)
      )
      
      errorSpy.mockRestore()
    })

    it('should provide navigation options when offline', async () => {
      mockNavigatorOnLine(false)
      
      const LazyComponent = lazy(() => 
        Promise.reject(new Error('Network error'))
      )
      
      const mockNavigate = vi.fn()
      vi.mock('react-router-dom', () => ({
        ...vi.importActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }))
      
      render(
        <MemoryRouter>
          <LazyRouteWrapper>
            <LazyComponent />
          </LazyRouteWrapper>
        </MemoryRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Go Home')).toBeInTheDocument()
        expect(screen.getByText('Go Back')).toBeInTheDocument()
      })
      
      // Test navigation buttons
      fireEvent.click(screen.getByText('Go Home'))
      expect(mockNavigate).toHaveBeenCalledWith('/')
      
      fireEvent.click(screen.getByText('Go Back'))
      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })
  })

  describe('Caching behavior', () => {
    it('should indicate when app is ready for offline use', () => {
      vi.mock('../../hooks/useServiceWorker', () => ({
        useServiceWorker: () => ({
          needRefresh: false,
          offlineReady: true,
          updateServiceWorker: vi.fn(),
          close: vi.fn()
        })
      }))
      
      render(<UpdatePrompt />)
      
      expect(screen.getByText('Ready for offline use')).toBeInTheDocument()
      expect(screen.getByText('Content has been cached for offline access')).toBeInTheDocument()
    })

    it('should dismiss offline ready notification', () => {
      const mockClose = vi.fn()
      
      vi.mock('../../hooks/useServiceWorker', () => ({
        useServiceWorker: () => ({
          needRefresh: false,
          offlineReady: true,
          updateServiceWorker: vi.fn(),
          close: mockClose
        })
      }))
      
      render(<UpdatePrompt />)
      
      const dismissButton = screen.getByText('Dismiss')
      fireEvent.click(dismissButton)
      
      expect(mockClose).toHaveBeenCalled()
    })
  })

  describe('Complex offline scenarios', () => {
    it('should handle multiple lazy routes with mixed availability', async () => {
      const AvailableComponent = lazy(() => Promise.resolve({
        default: () => <div>Available Component</div>
      }))
      
      const UnavailableComponent = lazy(() => 
        Promise.reject(new Error('Failed to fetch'))
      )
      
      mockNavigatorOnLine(false)
      
      render(
        <MemoryRouter>
          <div>
            <LazyRouteWrapper pageName="Available">
              <AvailableComponent />
            </LazyRouteWrapper>
            <LazyRouteWrapper pageName="Unavailable">
              <UnavailableComponent />
            </LazyRouteWrapper>
          </div>
        </MemoryRouter>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Available Component')).toBeInTheDocument()
        expect(screen.getByText(/Unavailable is Not Available Offline/)).toBeInTheDocument()
      })
    })

    it('should preserve app state during offline transitions', async () => {
      const StatefulComponent = () => {
        const [count, setCount] = React.useState(0)
        const [isOnline, setIsOnline] = React.useState(navigator.onLine)
        
        React.useEffect(() => {
          const handleOnline = () => setIsOnline(true)
          const handleOffline = () => setIsOnline(false)
          
          window.addEventListener('online', handleOnline)
          window.addEventListener('offline', handleOffline)
          
          return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
          }
        }, [])
        
        return (
          <div>
            <div>Count: {count}</div>
            <div>Status: {isOnline ? 'Online' : 'Offline'}</div>
            <button onClick={() => setCount(c => c + 1)}>Increment</button>
          </div>
        )
      }
      
      render(<StatefulComponent />)
      
      // Initial state
      expect(screen.getByText('Count: 0')).toBeInTheDocument()
      expect(screen.getByText('Status: Online')).toBeInTheDocument()
      
      // Increment counter
      fireEvent.click(screen.getByText('Increment'))
      expect(screen.getByText('Count: 1')).toBeInTheDocument()
      
      // Go offline
      act(() => {
        mockNavigatorOnLine(false)
        window.dispatchEvent(new Event('offline'))
      })
      
      await waitFor(() => {
        expect(screen.getByText('Status: Offline')).toBeInTheDocument()
      })
      
      // State should be preserved
      expect(screen.getByText('Count: 1')).toBeInTheDocument()
      
      // Should still be interactive
      fireEvent.click(screen.getByText('Increment'))
      expect(screen.getByText('Count: 2')).toBeInTheDocument()
      
      // Go back online
      act(() => {
        mockNavigatorOnLine(true)
        window.dispatchEvent(new Event('online'))
      })
      
      await waitFor(() => {
        expect(screen.getByText('Status: Online')).toBeInTheDocument()
      })
      
      // State still preserved
      expect(screen.getByText('Count: 2')).toBeInTheDocument()
    })
  })
})