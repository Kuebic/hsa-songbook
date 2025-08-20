import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useOnlineStatus } from '../useOnlineStatus'

describe('useOnlineStatus', () => {
  const originalConsoleLog = console.log
  const originalNavigatorOnLine = navigator.onLine

  // Helper function to mock navigator.onLine
  const mockNavigatorOnLine = (isOnline: boolean) => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: isOnline
    })
  }

  beforeEach(() => {
    // Mock console.log to prevent test output noise
    console.log = vi.fn()
    // Set navigator.onLine to true by default
    mockNavigatorOnLine(true)
  })

  afterEach(() => {
    console.log = originalConsoleLog
    // Restore original navigator.onLine value
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: originalNavigatorOnLine
    })
    vi.clearAllMocks()
  })

  it('should return initial state', () => {
    const { result } = renderHook(() => useOnlineStatus())
    
    // Should start with some initial state (likely online in test environment)
    expect(typeof result.current.isOnline).toBe('boolean')
    expect(result.current.wasOffline).toBe(false)
  })

  it('should handle offline events', async () => {
    const { result } = renderHook(() => useOnlineStatus())
    
    // Go offline - need to update navigator.onLine and dispatch event
    act(() => {
      mockNavigatorOnLine(false)
      window.dispatchEvent(new Event('offline'))
    })
    
    await waitFor(() => {
      expect(result.current.isOnline).toBe(false)
      expect(result.current.wasOffline).toBe(true)
    })
    
    expect(console.log).toHaveBeenCalledWith('Connection lost')
  })

  it('should handle online events after being offline', async () => {
    const { result } = renderHook(() => useOnlineStatus())
    
    // First go offline to set wasOffline
    act(() => {
      mockNavigatorOnLine(false)
      window.dispatchEvent(new Event('offline'))
    })
    
    await waitFor(() => {
      expect(result.current.wasOffline).toBe(true)
    })
    
    // Then go online
    act(() => {
      mockNavigatorOnLine(true)
      window.dispatchEvent(new Event('online'))
    })
    
    await waitFor(() => {
      expect(result.current.isOnline).toBe(true)
      expect(console.log).toHaveBeenCalledWith('Connection restored')
    })
  })

  it('should handle rapid transitions', async () => {
    const { result } = renderHook(() => useOnlineStatus())
    
    // Rapid transitions - offline then online
    act(() => {
      mockNavigatorOnLine(false)
      window.dispatchEvent(new Event('offline'))
    })
    
    act(() => {
      mockNavigatorOnLine(true)
      window.dispatchEvent(new Event('online'))
    })
    
    await waitFor(() => {
      expect(result.current.isOnline).toBe(true)
      expect(result.current.wasOffline).toBe(true)
    })
  })

  it('should clean up event listeners', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useOnlineStatus())
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    
    removeEventListenerSpy.mockRestore()
  })
})