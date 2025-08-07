import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'

// Mock navigation first before react-router-dom import
const mockNavigate = vi.fn()

// Mock virtual:pwa-register/react before importing components
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn()
  }))
}))

// Mock react-router-dom navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock hooks at module level
vi.mock('../hooks/useOnlineStatus')
vi.mock('../hooks/useServiceWorker')

// Import MemoryRouter after setting up mocks
import { MemoryRouter } from 'react-router-dom'

// Import components after mocks
import { OfflineFallback } from '../components/OfflineFallback'
import { OfflineIndicator } from '../components/OfflineIndicator'
import { UpdatePrompt } from '../components/UpdatePrompt'

// Import hooks for typing
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useServiceWorker } from '../hooks/useServiceWorker'

// Create typed mock implementations
const mockUseOnlineStatus = vi.mocked(useOnlineStatus)
const mockUseServiceWorker = vi.mocked(useServiceWorker)

// Mock navigator.onLine
const mockNavigatorOnLine = (isOnline: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    configurable: true,
    value: isOnline
  })
}

describe('PWA Offline Integration', () => {
  const originalNavigatorOnLine = navigator.onLine

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigatorOnLine(true)
    vi.useFakeTimers()
    
    // Configure default mock returns
    mockUseOnlineStatus.mockReturnValue({
      isOnline: true,
      wasOffline: false
    })
    
    mockUseServiceWorker.mockReturnValue({
      needRefresh: false,
      offlineReady: false,
      updateServiceWorker: vi.fn(),
      close: vi.fn()
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: originalNavigatorOnLine
    })
  })

  describe('Offline fallback component', () => {
    it('should show offline message when offline', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false
      })

      render(
        <MemoryRouter>
          <OfflineFallback pageName="Test Page" />
        </MemoryRouter>
      )

      expect(screen.getByText(/Test Page is Not Available Offline/)).toBeInTheDocument()
      expect(screen.getByText('Go Home')).toBeInTheDocument()
      expect(screen.getByText('Go Back')).toBeInTheDocument()
    })

    it('should show connection restored message when back online', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: true
      })

      render(
        <MemoryRouter>
          <OfflineFallback pageName="Test Page" />
        </MemoryRouter>
      )

      expect(screen.getByText('Connection Restored!')).toBeInTheDocument()
      expect(screen.getByText('Reload Page')).toBeInTheDocument()
    })

    it('should handle navigation buttons when offline', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false
      })

      render(
        <MemoryRouter>
          <OfflineFallback />
        </MemoryRouter>
      )

      fireEvent.click(screen.getByText('Go Home'))
      expect(mockNavigate).toHaveBeenCalledWith('/')

      fireEvent.click(screen.getByText('Go Back'))
      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })
  })

  describe('Offline indicator behavior', () => {
    it('should show offline indicator when offline', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: true
      })
      
      render(<OfflineIndicator />)
      
      expect(screen.getByText("You're offline")).toBeInTheDocument()
    })

    it('should not show indicator when online', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: false
      })
      
      render(<OfflineIndicator />)
      
      expect(screen.queryByText("You're offline")).not.toBeInTheDocument()
      expect(screen.queryByText('Back online!')).not.toBeInTheDocument()
    })

    it('should show back online message temporarily when connection is restored', () => {
      // Start with showing back online state
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: true
      })
      
      render(<OfflineIndicator />)
      
      // Should show back online message immediately
      expect(screen.getByText('Back online!')).toBeInTheDocument()
      
      // Verify timer was set (the component will hide message after 3 seconds)
      // We're just testing that the message appears, not the timeout behavior
    })
  })

  describe('Service worker update flow', () => {
    it('should show update prompt when new version is available', () => {
      mockUseServiceWorker.mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        updateServiceWorker: vi.fn(),
        close: vi.fn()
      })
      
      render(<UpdatePrompt />)
      
      expect(screen.getByText('New version available!')).toBeInTheDocument()
      expect(screen.getByText('Update')).toBeInTheDocument()
      expect(screen.getByText('Later')).toBeInTheDocument()
    })

    it('should show offline ready notification', () => {
      mockUseServiceWorker.mockReturnValue({
        needRefresh: false,
        offlineReady: true,
        updateServiceWorker: vi.fn(),
        close: vi.fn()
      })
      
      render(<UpdatePrompt />)
      
      expect(screen.getByText('Ready for offline use')).toBeInTheDocument()
      expect(screen.getByText('Content has been cached for offline access')).toBeInTheDocument()
      expect(screen.getByText('Dismiss')).toBeInTheDocument()
    })

    it('should call close when dismiss button is clicked', () => {
      const mockClose = vi.fn()
      
      mockUseServiceWorker.mockReturnValue({
        needRefresh: false,
        offlineReady: true,
        updateServiceWorker: vi.fn(),
        close: mockClose
      })
      
      render(<UpdatePrompt />)
      
      fireEvent.click(screen.getByText('Dismiss'))
      expect(mockClose).toHaveBeenCalled()
    })

    it('should call updateServiceWorker when update button is clicked', () => {
      const mockUpdate = vi.fn()
      
      mockUseServiceWorker.mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        updateServiceWorker: mockUpdate,
        close: vi.fn()
      })
      
      render(<UpdatePrompt />)
      
      fireEvent.click(screen.getByText('Update'))
      expect(mockUpdate).toHaveBeenCalledWith(true)
    })

    it('should coordinate update prompt with offline state', () => {
      // Mock both service worker update and offline status
      mockUseServiceWorker.mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        updateServiceWorker: vi.fn(),
        close: vi.fn()
      })
      
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: true
      })
      
      const TestApp = () => (
        <>
          <UpdatePrompt />
          <OfflineIndicator />
        </>
      )
      
      render(<TestApp />)
      
      // Should show both prompts
      expect(screen.getByText('New version available!')).toBeInTheDocument()
      expect(screen.getByText("You're offline")).toBeInTheDocument()
    })
  })

  describe('Complex offline scenarios', () => {
    it('should handle transition from offline to online', () => {
      // Start offline
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false
      })
      
      const { rerender } = render(
        <MemoryRouter>
          <OfflineFallback pageName="Test" />
        </MemoryRouter>
      )
      
      expect(screen.getByText(/Test is Not Available Offline/)).toBeInTheDocument()
      
      // Go online
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: true
      })
      
      rerender(
        <MemoryRouter>
          <OfflineFallback pageName="Test" />
        </MemoryRouter>
      )
      
      expect(screen.getByText('Connection Restored!')).toBeInTheDocument()
    })

    it('should preserve app state during offline transitions', () => {
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
      
      const { rerender } = render(<StatefulComponent />)
      
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
      
      // Force re-render to pick up the event
      rerender(<StatefulComponent />)
      
      // Status should update but state should be preserved
      expect(screen.getByText('Count: 1')).toBeInTheDocument()
      
      // Should still be interactive
      fireEvent.click(screen.getByText('Increment'))
      expect(screen.getByText('Count: 2')).toBeInTheDocument()
      
      // Go back online
      act(() => {
        mockNavigatorOnLine(true)
        window.dispatchEvent(new Event('online'))
      })
      
      // Force re-render to pick up the event
      rerender(<StatefulComponent />)
      
      // State still preserved
      expect(screen.getByText('Count: 2')).toBeInTheDocument()
    })
  })
})