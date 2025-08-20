import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useResponsiveLayout, useIsTouchDevice, usePrefersReducedMotion } from '../useResponsiveLayout'

describe('useResponsiveLayout', () => {
  const originalInnerWidth = window.innerWidth
  const originalInnerHeight = window.innerHeight

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    // Reset window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: originalInnerHeight,
    })
  })

  describe('Device detection', () => {
    it('should detect mobile device (width < 768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 667,
      })

      const { result } = renderHook(() => useResponsiveLayout())

      expect(result.current.isMobile).toBe(true)
      expect(result.current.isTablet).toBe(false)
      expect(result.current.isDesktop).toBe(false)
      expect(result.current.deviceType).toBe('mobile')
    })

    it('should detect tablet device (768px <= width < 1024px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 768,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 1024,
      })

      const { result } = renderHook(() => useResponsiveLayout())

      expect(result.current.isMobile).toBe(false)
      expect(result.current.isTablet).toBe(true)
      expect(result.current.isDesktop).toBe(false)
      expect(result.current.deviceType).toBe('tablet')
    })

    it('should detect desktop device (width >= 1024px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1920,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 1080,
      })

      const { result } = renderHook(() => useResponsiveLayout())

      expect(result.current.isMobile).toBe(false)
      expect(result.current.isTablet).toBe(false)
      expect(result.current.isDesktop).toBe(true)
      expect(result.current.deviceType).toBe('desktop')
    })
  })

  describe('Orientation detection', () => {
    it('should detect landscape orientation when width > height', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 667,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 375,
      })

      const { result } = renderHook(() => useResponsiveLayout())

      expect(result.current.isLandscape).toBe(true)
    })

    it('should detect portrait orientation when height >= width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 667,
      })

      const { result } = renderHook(() => useResponsiveLayout())

      expect(result.current.isLandscape).toBe(false)
    })
  })

  describe('Viewport dimensions', () => {
    it('should return current viewport dimensions', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1440,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 900,
      })

      const { result } = renderHook(() => useResponsiveLayout())

      expect(result.current.viewportWidth).toBe(1440)
      expect(result.current.viewportHeight).toBe(900)
    })
  })

  describe('Responsive updates', () => {
    it('should update on window resize', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1920,
      })

      const { result } = renderHook(() => useResponsiveLayout())

      expect(result.current.isDesktop).toBe(true)

      // Simulate resize to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          value: 375,
        })
        window.dispatchEvent(new Event('resize'))
      })

      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(150)
      })

      expect(result.current.isMobile).toBe(true)
      expect(result.current.isDesktop).toBe(false)
    })

    it('should debounce resize events', () => {
      const { result } = renderHook(() => useResponsiveLayout())

      const resizeHandler = vi.fn()
      window.addEventListener('resize', resizeHandler)

      // Trigger multiple resize events rapidly
      act(() => {
        for (let i = 0; i < 10; i++) {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            value: 1920 - i * 10,
          })
          window.dispatchEvent(new Event('resize'))
        }
      })

      // Should not update immediately
      expect(result.current.viewportWidth).not.toBe(1830)

      // Advance timers to trigger debounced update
      act(() => {
        vi.advanceTimersByTime(150)
      })

      // Now should be updated
      expect(result.current.viewportWidth).toBe(1830)

      window.removeEventListener('resize', resizeHandler)
    })

    it('should handle orientation change events', () => {
      const { result } = renderHook(() => useResponsiveLayout())

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          value: 667,
        })
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          value: 375,
        })
        window.dispatchEvent(new Event('orientationchange'))
      })

      act(() => {
        vi.advanceTimersByTime(150)
      })

      expect(result.current.isLandscape).toBe(true)
    })
  })

  describe('Visual viewport support', () => {
    it('should listen to visual viewport resize on mobile', () => {
      const addEventListener = vi.fn()
      const removeEventListener = vi.fn()

      Object.defineProperty(window, 'visualViewport', {
        writable: true,
        value: {
          addEventListener,
          removeEventListener,
        },
      })

      const { unmount } = renderHook(() => useResponsiveLayout())

      expect(addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))

      unmount()

      expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListener = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useResponsiveLayout())

      unmount()

      expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(removeEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function))
    })

    it('should clear timeout on unmount', () => {
      const clearTimeout = vi.spyOn(global, 'clearTimeout')

      const { unmount } = renderHook(() => useResponsiveLayout())

      // Trigger a resize to create a timeout
      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      unmount()

      expect(clearTimeout).toHaveBeenCalled()
    })
  })
})

describe('useIsTouchDevice', () => {
  it('should detect touch device when ontouchstart is present', () => {
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      value: () => {},
    })

    const { result } = renderHook(() => useIsTouchDevice())

    expect(result.current).toBe(true)

    // Clean up
    delete (window as any).ontouchstart
  })

  it('should detect touch device when maxTouchPoints > 0', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      value: 5,
    })

    const { result } = renderHook(() => useIsTouchDevice())

    expect(result.current).toBe(true)

    // Reset
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      value: 0,
    })
  })

  it('should detect non-touch device', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      value: 0,
    })
    delete (window as any).ontouchstart

    const { result } = renderHook(() => useIsTouchDevice())

    expect(result.current).toBe(false)
  })
})

describe('usePrefersReducedMotion', () => {
  it('should detect reduced motion preference', () => {
    const matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMedia,
    })

    const { result } = renderHook(() => usePrefersReducedMotion())

    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    expect(result.current).toBe(true)
  })

  it('should detect no reduced motion preference', () => {
    const matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMedia,
    })

    const { result } = renderHook(() => usePrefersReducedMotion())

    expect(result.current).toBe(false)
  })

  it('should update when preference changes', async () => {
    let changeHandler: ((event: any) => void) | null = null
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') changeHandler = handler
      }),
      removeEventListener: vi.fn(),
    }

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue(mockMediaQuery),
    })

    const { result } = renderHook(() => usePrefersReducedMotion())

    expect(result.current).toBe(false)

    // Simulate preference change
    act(() => {
      mockMediaQuery.matches = true
      if (changeHandler) changeHandler({})
    })

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('should handle legacy browsers with addListener', () => {
    const addListener = vi.fn()
    const removeListener = vi.fn()
    
    const matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addListener,
      removeListener,
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMedia,
    })

    const { unmount } = renderHook(() => usePrefersReducedMotion())

    expect(addListener).toHaveBeenCalled()

    unmount()

    expect(removeListener).toHaveBeenCalled()
  })
})