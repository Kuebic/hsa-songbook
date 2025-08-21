import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNativeBackNavigation } from '../useNativeBackNavigation'
import { useViewport } from '../useViewport'
import { useNavigate, useLocation } from 'react-router-dom'

// Mock dependencies
vi.mock('../useViewport')
vi.mock('react-router-dom')

describe('useNativeBackNavigation', () => {
  const mockNavigate = vi.fn()
  const mockLocation = { state: null, pathname: '/arrangements/test' }
  
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(useLocation).mockReturnValue(mockLocation as ReturnType<typeof useLocation>)
    vi.mocked(useViewport).mockReturnValue({ 
      isMobile: true,
      isTablet: false,
      isDesktop: false 
    } as ReturnType<typeof useViewport>)
    
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    })

    // Mock window.history
    Object.defineProperty(window, 'history', {
      value: {
        back: vi.fn(),
      },
      writable: true
    })
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })
  
  it('should be enabled on mobile devices', () => {
    const { result } = renderHook(() => 
      useNativeBackNavigation({ enabled: true })
    )
    
    expect(result.current.isEnabled).toBe(true)
  })
  
  it('should be disabled on desktop', () => {
    vi.mocked(useViewport).mockReturnValue({ 
      isMobile: false,
      isTablet: false,
      isDesktop: true 
    } as ReturnType<typeof useViewport>)
    
    const { result } = renderHook(() => 
      useNativeBackNavigation({ enabled: true })
    )
    
    expect(result.current.isEnabled).toBe(false)
  })
  
  it('should handle popstate event and navigate to song', () => {
    const arrangement = { id: 'arr-1', songSlug: 'test-song' }
    
    renderHook(() => 
      useNativeBackNavigation({ 
        enabled: true,
        arrangement 
      })
    )
    
    // Simulate popstate event
    const popstateEvent = new PopStateEvent('popstate', {
      state: { fromSong: 'original-song' }
    })
    window.dispatchEvent(popstateEvent)
    
    expect(mockNavigate).toHaveBeenCalledWith('/songs/original-song')
  })
  
  it('should use fallback path when no navigation state', () => {
    renderHook(() => 
      useNativeBackNavigation({ 
        enabled: true,
        fallbackPath: '/songs'
      })
    )
    
    // Simulate popstate without state
    const popstateEvent = new PopStateEvent('popstate', { state: null })
    window.dispatchEvent(popstateEvent)
    
    expect(mockNavigate).toHaveBeenCalledWith('/songs')
  })
  
  it('should persist state to sessionStorage', () => {
    const arrangement = { id: 'arr-1', songSlug: 'test-song' }
    const mockLocationWithState = { ...mockLocation, state: { fromSong: 'original-song' } }
    vi.mocked(useLocation).mockReturnValue(mockLocationWithState as ReturnType<typeof useLocation>)
    
    renderHook(() => 
      useNativeBackNavigation({ 
        enabled: true,
        arrangement 
      })
    )
    
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      'nav-state-arr-1',
      JSON.stringify({ fromSong: 'original-song' })
    )
  })
  
  it('should use arrangement songSlug as fallback', () => {
    const arrangement = { id: 'arr-1', songSlug: 'test-song' }
    
    renderHook(() => 
      useNativeBackNavigation({ 
        enabled: true,
        arrangement 
      })
    )
    
    // Simulate popstate without fromSong state
    const popstateEvent = new PopStateEvent('popstate', { state: {} })
    window.dispatchEvent(popstateEvent)
    
    expect(mockNavigate).toHaveBeenCalledWith('/songs/test-song')
  })
  
  it('should clean up sessionStorage after navigation', () => {
    const arrangement = { id: 'arr-1', songSlug: 'test-song' }
    
    renderHook(() => 
      useNativeBackNavigation({ 
        enabled: true,
        arrangement 
      })
    )
    
    // Simulate popstate event
    const popstateEvent = new PopStateEvent('popstate', {
      state: { fromSong: 'original-song' }
    })
    window.dispatchEvent(popstateEvent)
    
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('nav-state-arr-1')
  })
  
  it('should call onNavigate callback when provided', () => {
    const onNavigate = vi.fn()
    const arrangement = { id: 'arr-1', songSlug: 'test-song' }
    
    renderHook(() => 
      useNativeBackNavigation({ 
        enabled: true,
        arrangement,
        onNavigate 
      })
    )
    
    // Simulate popstate event
    const popstateEvent = new PopStateEvent('popstate', {
      state: { fromSong: 'original-song' }
    })
    window.dispatchEvent(popstateEvent)
    
    expect(onNavigate).toHaveBeenCalled()
  })
  
  it('should not add event listener when disabled', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    
    renderHook(() => 
      useNativeBackNavigation({ 
        enabled: false
      })
    )
    
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('popstate', expect.any(Function))
  })
  
  it('should provide handleBack function', () => {
    const { result } = renderHook(() => 
      useNativeBackNavigation({ enabled: true })
    )
    
    result.current.handleBack()
    
    expect(window.history.back).toHaveBeenCalled()
  })
})