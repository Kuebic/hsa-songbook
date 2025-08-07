import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useOnlineStatus } from '../useOnlineStatus'

describe('useOnlineStatus', () => {
  const originalNavigatorOnLine = navigator.onLine
  const originalConsoleLog = console.log

  beforeEach(() => {
    // Mock console.log to prevent test output noise
    console.log = vi.fn()
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true
    })
  })

  afterEach(() => {
    // Restore original values
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: originalNavigatorOnLine
    })
    console.log = originalConsoleLog
    vi.clearAllMocks()
  })

  it('should return initial online status from navigator', () => {
    Object.defineProperty(navigator, 'onLine', { value: true })
    const { result } = renderHook(() => useOnlineStatus())
    
    expect(result.current.isOnline).toBe(true)
    expect(result.current.wasOffline).toBe(false)
  })

  it('should return initial offline status from navigator', () => {
    Object.defineProperty(navigator, 'onLine', { value: false })
    const { result } = renderHook(() => useOnlineStatus())
    
    expect(result.current.isOnline).toBe(false)
    expect(result.current.wasOffline).toBe(false)
  })

  it('should update status when online event is fired', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false })
    const { result } = renderHook(() => useOnlineStatus())
    
    expect(result.current.isOnline).toBe(false)
    
    // Simulate going online
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true })
      window.dispatchEvent(new Event('online'))
    })
    
    await waitFor(() => {
      expect(result.current.isOnline).toBe(true)
    })
  })

  it('should update status when offline event is fired', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true })
    const { result } = renderHook(() => useOnlineStatus())
    
    expect(result.current.isOnline).toBe(true)
    expect(result.current.wasOffline).toBe(false)
    
    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false })
      window.dispatchEvent(new Event('offline'))
    })
    
    await waitFor(() => {
      expect(result.current.isOnline).toBe(false)
      expect(result.current.wasOffline).toBe(true)
    })
    
    expect(console.log).toHaveBeenCalledWith('Connection lost')
  })

  it('should track wasOffline status correctly', async () => {
    const { result } = renderHook(() => useOnlineStatus())
    
    expect(result.current.wasOffline).toBe(false)
    
    // Go offline
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    
    await waitFor(() => {
      expect(result.current.wasOffline).toBe(true)
    })
    
    // Go back online
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    
    await waitFor(() => {
      expect(result.current.isOnline).toBe(true)
      expect(console.log).toHaveBeenCalledWith('Connection restored')
    })
  })

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useOnlineStatus())
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    
    removeEventListenerSpy.mockRestore()
  })

  it('should add event listeners on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    renderHook(() => useOnlineStatus())
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    
    addEventListenerSpy.mockRestore()
  })

  it('should handle rapid online/offline transitions', async () => {
    const { result } = renderHook(() => useOnlineStatus())
    
    // Rapid transitions
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    
    await waitFor(() => {
      expect(result.current.isOnline).toBe(true)
      expect(result.current.wasOffline).toBe(true)
    })
  })
})