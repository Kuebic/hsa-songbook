import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ViewerHeader } from '../ViewerHeader'
import { useViewport, useNativeBackNavigation } from '@features/responsive'
import { useAuth } from '@features/auth'
import type { ArrangementViewerData } from '../../types/viewer.types'

// Mock responsive feature
vi.mock('@features/responsive', () => ({
  useViewport: vi.fn(),
  useNativeBackNavigation: vi.fn(() => ({
    isEnabled: true,
    navigationState: {},
    handleBack: vi.fn()
  }))
}))

// Mock auth hook
vi.mock('@features/auth', () => ({
  useAuth: vi.fn()
}))

describe('ViewerHeader Mobile Navigation', () => {
  const mockArrangement: ArrangementViewerData = {
    id: 'arr-1',
    name: 'Test Arrangement',
    slug: 'test-arrangement',
    songSlug: 'test-song',
    songTitle: 'Test Song',
    artist: 'Test Artist',
    chordProText: '[C]Test',
    createdBy: 'user-123',
    songIds: ['song-1'],
    key: 'C',
    tempo: 120,
    difficulty: 'intermediate',
    tags: []
  }
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock DOM methods
    Object.defineProperty(document.documentElement, 'style', {
      value: {
        setProperty: vi.fn(),
        removeProperty: vi.fn(),
        getPropertyValue: vi.fn(),
      },
      writable: true
    })
    
    // Default auth mock
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      isAdmin: false,
      userId: null,
      getToken: vi.fn(),
      signOut: vi.fn()
    } as unknown as ReturnType<typeof useAuth>)
  })
  
  it('should hide back button on mobile', () => {
    vi.mocked(useViewport).mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false
    } as ReturnType<typeof useViewport>)
    
    vi.mocked(useNativeBackNavigation).mockReturnValue({
      isEnabled: true, // Mobile navigation enabled
      navigationState: {},
      handleBack: vi.fn()
    })
    
    render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )
    
    // Back button should not be visible
    expect(screen.queryByText('Back to Song')).not.toBeInTheDocument()
    expect(screen.queryByText('←')).not.toBeInTheDocument()
  })
  
  it('should show back button on desktop', () => {
    vi.mocked(useViewport).mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true
    } as ReturnType<typeof useViewport>)
    
    vi.mocked(useNativeBackNavigation).mockReturnValue({
      isEnabled: false, // Desktop navigation disabled
      navigationState: {},
      handleBack: vi.fn()
    })
    
    render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )
    
    // Back button should be visible
    expect(screen.getByText('Back to Song')).toBeInTheDocument()
    expect(screen.getByText('←')).toBeInTheDocument()
  })
  
  it('should apply mobile class when on mobile', () => {
    vi.mocked(useViewport).mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false
    } as ReturnType<typeof useViewport>)
    
    vi.mocked(useNativeBackNavigation).mockReturnValue({
      isEnabled: true, // Mobile navigation enabled
      navigationState: {},
      handleBack: vi.fn()
    })
    
    const { container } = render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )
    
    const header = container.querySelector('.viewer-header')
    expect(header).toHaveClass('viewer-header--mobile')
  })
  
  it('should not apply mobile class when on desktop', () => {
    vi.mocked(useViewport).mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true
    } as ReturnType<typeof useViewport>)
    
    vi.mocked(useNativeBackNavigation).mockReturnValue({
      isEnabled: false, // Desktop navigation disabled
      navigationState: {},
      handleBack: vi.fn()
    })
    
    const { container } = render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )
    
    const header = container.querySelector('.viewer-header')
    expect(header).not.toHaveClass('viewer-header--mobile')
  })
  
  it('should always show edit button when user has permission (mobile)', () => {
    vi.mocked(useViewport).mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false
    } as ReturnType<typeof useViewport>)
    
    vi.mocked(useNativeBackNavigation).mockReturnValue({
      isEnabled: true, // Mobile navigation enabled
      navigationState: {},
      handleBack: vi.fn()
    })
    
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      userId: 'user-123', // Same as arrangement.createdBy
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    } as unknown as ReturnType<typeof useAuth>)
    
    render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )
    
    // Edit button should be visible even on mobile
    expect(screen.getByText('Edit Chords')).toBeInTheDocument()
  })
  
  it('should always show edit button when user has permission (desktop)', () => {
    vi.mocked(useViewport).mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true
    } as ReturnType<typeof useViewport>)
    
    vi.mocked(useNativeBackNavigation).mockReturnValue({
      isEnabled: false, // Desktop navigation disabled
      navigationState: {},
      handleBack: vi.fn()
    })
    
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      userId: 'user-123', // Same as arrangement.createdBy
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    } as unknown as ReturnType<typeof useAuth>)
    
    render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )
    
    // Both back and edit buttons should be visible on desktop
    expect(screen.getByText('Back to Song')).toBeInTheDocument()
    expect(screen.getByText('Edit Chords')).toBeInTheDocument()
  })
  
  it('should display arrangement name and song info', () => {
    vi.mocked(useViewport).mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false
    } as ReturnType<typeof useViewport>)
    
    vi.mocked(useNativeBackNavigation).mockReturnValue({
      isEnabled: true, // Mobile navigation enabled
      navigationState: {},
      handleBack: vi.fn()
    })
    
    render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )
    
    expect(screen.getByText('Test Arrangement')).toBeInTheDocument()
    expect(screen.getByText('Test Song - Test Artist')).toBeInTheDocument()
  })
  
  it('should handle arrangement without artist', () => {
    const arrangementWithoutArtist = {
      ...mockArrangement,
      artist: undefined
    }
    
    vi.mocked(useViewport).mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false
    } as ReturnType<typeof useViewport>)
    
    vi.mocked(useNativeBackNavigation).mockReturnValue({
      isEnabled: true, // Mobile navigation enabled
      navigationState: {},
      handleBack: vi.fn()
    })
    
    render(
      <MemoryRouter>
        <ViewerHeader arrangement={arrangementWithoutArtist} />
      </MemoryRouter>
    )
    
    expect(screen.getByText('Test Arrangement')).toBeInTheDocument()
    expect(screen.getByText('Test Song')).toBeInTheDocument()
    expect(screen.queryByText(' - ')).not.toBeInTheDocument()
  })
  
  it('should show fallback text when no songSlug available', () => {
    const arrangementWithoutSongSlug = {
      ...mockArrangement,
      songSlug: undefined
    }
    
    vi.mocked(useViewport).mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true
    } as ReturnType<typeof useViewport>)
    
    vi.mocked(useNativeBackNavigation).mockReturnValue({
      isEnabled: false, // Desktop navigation disabled
      navigationState: {},
      handleBack: vi.fn()
    })
    
    render(
      <MemoryRouter>
        <ViewerHeader arrangement={arrangementWithoutSongSlug} />
      </MemoryRouter>
    )
    
    expect(screen.getByText('Back to Songs')).toBeInTheDocument()
  })
})