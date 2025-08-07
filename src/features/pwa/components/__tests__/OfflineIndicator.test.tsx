import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { OfflineIndicator } from '../OfflineIndicator'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

// Mock the useOnlineStatus hook
vi.mock('../../hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn()
}))

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Default mock - online
    ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
      isOnline: true,
      wasOffline: false
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('online state', () => {
    it('should render nothing when online and was not offline', () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: true,
        wasOffline: false
      })
      
      const { container } = render(<OfflineIndicator />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('offline state', () => {
    it('should show offline indicator when offline', () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: false,
        wasOffline: false
      })
      
      render(<OfflineIndicator />)
      
      expect(screen.getByText("You're offline")).toBeInTheDocument()
    })

    it('should have correct styling for offline indicator', () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: false,
        wasOffline: false
      })
      
      render(<OfflineIndicator />)
      
      const indicator = screen.getByText("You're offline").parentElement
      expect(indicator).toHaveStyle({
        position: 'fixed',
        top: '20px',
        padding: '12px 24px'
      })
    })

    it('should render offline icon', () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: false,
        wasOffline: false
      })
      
      render(<OfflineIndicator />)
      
      // Find SVG by its container
      const container = screen.getByText("You're offline").parentElement
      const svg = container?.querySelector('svg')
      
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '20')
      expect(svg).toHaveAttribute('height', '20')
    })
  })

  describe('back online state', () => {
    it('should show back online message when returning online', async () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: true,
        wasOffline: true
      })
      
      render(<OfflineIndicator />)
      
      expect(screen.getByText('Back online!')).toBeInTheDocument()
    })

    it('should hide back online message after 3 seconds', async () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: true,
        wasOffline: true
      })
      
      render(<OfflineIndicator />)
      
      expect(screen.getByText('Back online!')).toBeInTheDocument()
      
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      
      await waitFor(() => {
        expect(screen.queryByText('Back online!')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should have correct styling for back online indicator', () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: true,
        wasOffline: true
      })
      
      render(<OfflineIndicator />)
      
      const indicator = screen.getByText('Back online!').parentElement
      expect(indicator).toHaveStyle({
        position: 'fixed',
        top: '20px',
        padding: '12px 24px',
        animation: 'slideDown 0.3s ease-out'
      })
    })

    it('should render success icon when back online', () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: true,
        wasOffline: true
      })
      
      render(<OfflineIndicator />)
      
      // Find SVG by its container
      const container = screen.getByText('Back online!').parentElement
      const svg = container?.querySelector('svg')
      
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '20')
      expect(svg).toHaveAttribute('height', '20')
    })

    it('should clear timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: true,
        wasOffline: true
      })
      
      const { unmount } = render(<OfflineIndicator />)
      
      unmount()
      
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should handle transition from offline to online', () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: false,
        wasOffline: false
      })
      
      const { rerender } = render(<OfflineIndicator />)
      
      expect(screen.getByText("You're offline")).toBeInTheDocument()
      
      // Transition to online
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: true,
        wasOffline: true
      })
      
      rerender(<OfflineIndicator />)
      
      expect(screen.queryByText("You're offline")).not.toBeInTheDocument()
      expect(screen.getByText('Back online!')).toBeInTheDocument()
    })
  })

  describe('CSS injection', () => {
    it('should inject CSS styles on load', () => {
      // Mock document for testing
      const mockStyle = document.createElement('style')
      mockStyle.id = 'offline-indicator-styles'
      
      // The component should have already injected styles
      const existingStyle = document.querySelector('#offline-indicator-styles')
      expect(existingStyle).toBeTruthy()
      
      if (existingStyle) {
        expect(existingStyle.textContent).toContain('@keyframes slideDown')
        expect(existingStyle.textContent).toContain('translateX(-50%)')
        expect(existingStyle.textContent).toContain('opacity')
      }
    })

    it('should not inject styles twice', () => {
      const existingStyleCount = document.querySelectorAll('#offline-indicator-styles').length
      
      // Force re-evaluation of the module
      render(<OfflineIndicator />)
      
      const newStyleCount = document.querySelectorAll('#offline-indicator-styles').length
      expect(newStyleCount).toBe(existingStyleCount)
    })
  })

  describe('state transitions', () => {
    it('should not show back online if was never offline', () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: true,
        wasOffline: false
      })
      
      render(<OfflineIndicator />)
      
      expect(screen.queryByText('Back online!')).not.toBeInTheDocument()
    })

    it('should handle rapid online/offline transitions', () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: false,
        wasOffline: false
      })
      
      const { rerender } = render(<OfflineIndicator />)
      
      // Go online
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: true,
        wasOffline: true
      })
      rerender(<OfflineIndicator />)
      
      // Go offline again before timeout
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: false,
        wasOffline: true
      })
      rerender(<OfflineIndicator />)
      
      expect(screen.getByText("You're offline")).toBeInTheDocument()
      expect(screen.queryByText('Back online!')).not.toBeInTheDocument()
    })

    it('should reset timer on new back online transition', async () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: true,
        wasOffline: true
      })
      
      const { rerender } = render(<OfflineIndicator />)
      
      expect(screen.getByText('Back online!')).toBeInTheDocument()
      
      // Advance timer partially
      act(() => {
        vi.advanceTimersByTime(1500)
      })
      
      // Should still be visible
      expect(screen.getByText('Back online!')).toBeInTheDocument()
      
      // Trigger another back online (rerender with same state)
      rerender(<OfflineIndicator />)
      
      // Advance timer another 1500ms (total 3000ms from first render)
      act(() => {
        vi.advanceTimersByTime(1500)
      })
      
      // Should still be visible since we assume timer doesn't reset on rerender with same props
      expect(screen.getByText('Back online!')).toBeInTheDocument()
      
      // Advance to complete the timer from initial mount
      act(() => {
        vi.advanceTimersByTime(1500)
      })
      
      await waitFor(() => {
        expect(screen.queryByText('Back online!')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })
})