import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OfflineFallback } from '../OfflineFallback'
import { useNavigate } from 'react-router-dom'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}))

// Mock useOnlineStatus hook
vi.mock('../../hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn()
}))

describe('OfflineFallback', () => {
  const mockNavigate = vi.fn()
  const mockReload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate)
    ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
      isOnline: false,
      wasOffline: false
    })
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    })
  })

  describe('when offline', () => {
    beforeEach(() => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: false,
        wasOffline: true
      })
    })

    it('should render offline message with default page name', () => {
      render(<OfflineFallback />)
      
      expect(screen.getByText('This page is Not Available Offline')).toBeInTheDocument()
      expect(screen.getByText(/You need to visit this page at least once/)).toBeInTheDocument()
    })

    it('should render offline message with custom page name', () => {
      render(<OfflineFallback pageName="Setlist Manager" />)
      
      expect(screen.getByText('Setlist Manager is Not Available Offline')).toBeInTheDocument()
    })

    it('should show Go Home button that navigates to home', () => {
      render(<OfflineFallback />)
      
      const homeButton = screen.getByText('Go Home')
      expect(homeButton).toBeInTheDocument()
      
      fireEvent.click(homeButton)
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('should show Go Back button that navigates back', () => {
      render(<OfflineFallback />)
      
      const backButton = screen.getByText('Go Back')
      expect(backButton).toBeInTheDocument()
      
      fireEvent.click(backButton)
      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    it('should render offline icon', () => {
      render(<OfflineFallback />)
      
      // Find SVG by its unique attributes since SVGs don't have role="img" by default
      const svgContainer = screen.getByText('This page is Not Available Offline')
        .closest('div')?.parentElement
      const svg = svgContainer?.querySelector('svg')
      
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '32')
      expect(svg).toHaveAttribute('height', '32')
    })

    it('should not show error details in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const error = new Error('Network chunk loading failed')
      render(<OfflineFallback error={error} />)
      
      expect(screen.queryByText('Technical Details')).not.toBeInTheDocument()
      expect(screen.queryByText(error.message)).not.toBeInTheDocument()
      
      process.env.NODE_ENV = originalEnv
    })

    it('should show error details in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const error = new Error('Network chunk loading failed')
      render(<OfflineFallback error={error} />)
      
      expect(screen.getByText('Technical Details')).toBeInTheDocument()
      expect(screen.getByText(error.message)).toBeInTheDocument()
      
      process.env.NODE_ENV = originalEnv
    })

    it('should handle null error prop', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      render(<OfflineFallback error={null} />)
      
      expect(screen.queryByText('Technical Details')).not.toBeInTheDocument()
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('when online', () => {
    beforeEach(() => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: true,
        wasOffline: false
      })
    })

    it('should render connection restored message', () => {
      render(<OfflineFallback />)
      
      expect(screen.getByText('Connection Restored!')).toBeInTheDocument()
      expect(screen.getByText(/You're back online/)).toBeInTheDocument()
    })

    it('should show reload button that reloads the page', () => {
      render(<OfflineFallback />)
      
      const reloadButton = screen.getByText('Reload Page')
      expect(reloadButton).toBeInTheDocument()
      
      fireEvent.click(reloadButton)
      expect(mockReload).toHaveBeenCalled()
    })

    it('should not show offline content when online', () => {
      render(<OfflineFallback />)
      
      expect(screen.queryByText(/is Not Available Offline/)).not.toBeInTheDocument()
      expect(screen.queryByText('Go Home')).not.toBeInTheDocument()
      expect(screen.queryByText('Go Back')).not.toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should apply correct styles to offline container', () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: false,
        wasOffline: true
      })
      
      render(<OfflineFallback />)
      
      const container = screen.getByText('This page is Not Available Offline').closest('div')
      expect(container).toHaveStyle({
        backgroundColor: '#fff7ed',
        borderRadius: '12px',
        padding: '32px'
      })
    })

    it('should apply correct styles to online container', () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: true,
        wasOffline: false
      })
      
      render(<OfflineFallback />)
      
      const container = screen.getByText('Connection Restored!').closest('div')
      expect(container).toHaveStyle({
        backgroundColor: '#f0f9ff',
        borderRadius: '12px',
        padding: '32px'
      })
    })

    it('should apply correct button styles', () => {
      ;(useOnlineStatus as ReturnType<typeof vi.fn>).mockReturnValue({
        isOnline: false,
        wasOffline: true
      })
      
      render(<OfflineFallback />)
      
      const homeButton = screen.getByText('Go Home')
      expect(homeButton).toHaveStyle({
        backgroundColor: '#3b82f6',
        padding: '12px 24px'
      })
      
      const backButton = screen.getByText('Go Back')
      expect(backButton).toHaveStyle({
        backgroundColor: '#f3f4f6',
        color: '#374151',
        padding: '12px 24px'
      })
    })
  })
})