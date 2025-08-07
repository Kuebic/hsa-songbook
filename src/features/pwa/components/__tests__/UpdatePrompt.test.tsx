import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UpdatePrompt } from '../UpdatePrompt'
import { useServiceWorker } from '../../hooks/useServiceWorker'

// Mock the useServiceWorker hook
vi.mock('../../hooks/useServiceWorker', () => ({
  useServiceWorker: vi.fn()
}))

describe('UpdatePrompt', () => {
  const mockUpdateServiceWorker = vi.fn()
  const mockClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useServiceWorker as ReturnType<typeof vi.fn>).mockReturnValue({
      needRefresh: false,
      offlineReady: false,
      updateServiceWorker: mockUpdateServiceWorker,
      close: mockClose
    })
  })

  describe('visibility', () => {
    it('should not render when no update is available', () => {
      ;(useServiceWorker as ReturnType<typeof vi.fn>).mockReturnValue({
        needRefresh: false,
        offlineReady: false,
        updateServiceWorker: mockUpdateServiceWorker,
        close: mockClose
      })
      
      const { container } = render(<UpdatePrompt />)
      expect(container.firstChild).toBeNull()
    })

    it('should render when offline ready', () => {
      ;(useServiceWorker as ReturnType<typeof vi.fn>).mockReturnValue({
        needRefresh: false,
        offlineReady: true,
        updateServiceWorker: mockUpdateServiceWorker,
        close: mockClose
      })
      
      render(<UpdatePrompt />)
      expect(screen.getByText('Ready for offline use')).toBeInTheDocument()
    })

    it('should render when update is available', () => {
      ;(useServiceWorker as ReturnType<typeof vi.fn>).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        updateServiceWorker: mockUpdateServiceWorker,
        close: mockClose
      })
      
      render(<UpdatePrompt />)
      expect(screen.getByText('New version available!')).toBeInTheDocument()
    })
  })

  describe('offline ready state', () => {
    beforeEach(() => {
      ;(useServiceWorker as ReturnType<typeof vi.fn>).mockReturnValue({
        needRefresh: false,
        offlineReady: true,
        updateServiceWorker: mockUpdateServiceWorker,
        close: mockClose
      })
    })

    it('should display offline ready message', () => {
      render(<UpdatePrompt />)
      
      expect(screen.getByText('Ready for offline use')).toBeInTheDocument()
      expect(screen.getByText('Content has been cached for offline access')).toBeInTheDocument()
    })

    it('should show dismiss button', () => {
      render(<UpdatePrompt />)
      
      const dismissButton = screen.getByText('Dismiss')
      expect(dismissButton).toBeInTheDocument()
    })

    it('should call close when dismiss is clicked', () => {
      render(<UpdatePrompt />)
      
      const dismissButton = screen.getByText('Dismiss')
      fireEvent.click(dismissButton)
      
      expect(mockClose).toHaveBeenCalledTimes(1)
    })

    it('should render success icon', () => {
      render(<UpdatePrompt />)
      
      // Find SVG by its container
      const container = screen.getByText('Ready for offline use').closest('div')?.parentElement
      const svg = container?.querySelector('svg')
      
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '20')
      expect(svg).toHaveAttribute('height', '20')
    })

    it('should change dismiss button style on hover', () => {
      render(<UpdatePrompt />)
      
      const dismissButton = screen.getByText('Dismiss')
      
      // Initial style
      expect(dismissButton).toHaveStyle({
        backgroundColor: '#f3f4f6'
      })
      
      // Hover
      fireEvent.mouseEnter(dismissButton)
      expect(dismissButton).toHaveStyle({
        backgroundColor: '#e5e7eb'
      })
      
      // Leave
      fireEvent.mouseLeave(dismissButton)
      expect(dismissButton).toHaveStyle({
        backgroundColor: '#f3f4f6'
      })
    })
  })

  describe('update available state', () => {
    beforeEach(() => {
      ;(useServiceWorker as ReturnType<typeof vi.fn>).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        updateServiceWorker: mockUpdateServiceWorker,
        close: mockClose
      })
    })

    it('should display update available message', () => {
      render(<UpdatePrompt />)
      
      expect(screen.getByText('New version available!')).toBeInTheDocument()
      expect(screen.getByText('Click update to get the latest features')).toBeInTheDocument()
    })

    it('should show update and later buttons', () => {
      render(<UpdatePrompt />)
      
      expect(screen.getByText('Update')).toBeInTheDocument()
      expect(screen.getByText('Later')).toBeInTheDocument()
    })

    it('should call updateServiceWorker when update is clicked', () => {
      render(<UpdatePrompt />)
      
      const updateButton = screen.getByText('Update')
      fireEvent.click(updateButton)
      
      expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
    })

    it('should call close when later is clicked', () => {
      render(<UpdatePrompt />)
      
      const laterButton = screen.getByText('Later')
      fireEvent.click(laterButton)
      
      expect(mockClose).toHaveBeenCalledTimes(1)
    })

    it('should render update icon', () => {
      render(<UpdatePrompt />)
      
      // Find SVG by its container
      const container = screen.getByText('New version available!').closest('div')?.parentElement
      const svg = container?.querySelector('svg')
      
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '20')
      expect(svg).toHaveAttribute('height', '20')
    })

    it('should change update button style on hover', () => {
      render(<UpdatePrompt />)
      
      const updateButton = screen.getByText('Update')
      
      // Initial style
      expect(updateButton).toHaveStyle({
        backgroundColor: '#3b82f6'
      })
      
      // Hover
      fireEvent.mouseEnter(updateButton)
      expect(updateButton).toHaveStyle({
        backgroundColor: '#2563eb'
      })
      
      // Leave
      fireEvent.mouseLeave(updateButton)
      expect(updateButton).toHaveStyle({
        backgroundColor: '#3b82f6'
      })
    })

    it('should change later button style on hover', () => {
      render(<UpdatePrompt />)
      
      const laterButton = screen.getByText('Later')
      
      // Initial style
      expect(laterButton).toHaveStyle({
        backgroundColor: '#f3f4f6'
      })
      
      // Hover
      fireEvent.mouseEnter(laterButton)
      expect(laterButton).toHaveStyle({
        backgroundColor: '#e5e7eb'
      })
      
      // Leave
      fireEvent.mouseLeave(laterButton)
      expect(laterButton).toHaveStyle({
        backgroundColor: '#f3f4f6'
      })
    })
  })

  describe('both states active', () => {
    it('should prioritize update message when both needRefresh and offlineReady are true', () => {
      ;(useServiceWorker as ReturnType<typeof vi.fn>).mockReturnValue({
        needRefresh: true,
        offlineReady: true,
        updateServiceWorker: mockUpdateServiceWorker,
        close: mockClose
      })
      
      render(<UpdatePrompt />)
      
      // Should show update message, not offline ready message
      expect(screen.getByText('New version available!')).toBeInTheDocument()
      expect(screen.queryByText('Ready for offline use')).not.toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should have correct container styles', () => {
      ;(useServiceWorker as ReturnType<typeof vi.fn>).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        updateServiceWorker: mockUpdateServiceWorker,
        close: mockClose
      })
      
      render(<UpdatePrompt />)
      
      const container = screen.getByText('New version available!').closest('.update-prompt')
      expect(container).toHaveStyle({
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '16px',
        maxWidth: '320px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      })
    })

    it('should have correct button layout styles', () => {
      ;(useServiceWorker as ReturnType<typeof vi.fn>).mockReturnValue({
        needRefresh: true,
        offlineReady: false,
        updateServiceWorker: mockUpdateServiceWorker,
        close: mockClose
      })
      
      render(<UpdatePrompt />)
      
      const updateButton = screen.getByText('Update')
      const laterButton = screen.getByText('Later')
      
      // Test only the most essential styles that should be applied
      expect(updateButton).toHaveStyle({
        flex: 1,
        padding: '8px 16px',
        cursor: 'pointer'
      })
      
      expect(laterButton).toHaveStyle({
        flex: 1,
        padding: '8px 16px',
        cursor: 'pointer'
      })
    })
  })
})