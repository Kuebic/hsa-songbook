/**
 * Performance utility functions for responsive features
 */

import type { DebounceFunction, ThrottleFunction } from '../types'

/**
 * Debounce function - delays execution until after delay has passed since last call
 * Useful for resize events, search input, etc.
 */
export const debounce: DebounceFunction = <T extends unknown[]>(
  func: (...args: T) => void,
  delay: number
) => {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Throttle function - limits execution to once per delay period
 * Useful for scroll events, mousemove, etc.
 */
export const throttle: ThrottleFunction = <T extends unknown[]>(
  func: (...args: T) => void,
  delay: number
) => {
  let lastCall = 0
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: T) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    if (timeSinceLastCall >= delay) {
      lastCall = now
      func(...args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        func(...args)
        timeoutId = null
      }, delay - timeSinceLastCall)
    }
  }
}

/**
 * RequestAnimationFrame-based throttle for smooth animations
 * Only executes once per frame
 */
export function rafThrottle<T extends unknown[]>(
  func: (...args: T) => void
): (...args: T) => void {
  let rafId: number | null = null
  let lastArgs: T | null = null

  return (...args: T) => {
    lastArgs = args

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          func(...lastArgs)
        }
        rafId = null
        lastArgs = null
      })
    }
  }
}

/**
 * Leading and trailing debounce options
 */
interface AdvancedDebounceOptions {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

export function advancedDebounce<T extends unknown[]>(
  func: (...args: T) => void,
  delay: number,
  options: AdvancedDebounceOptions = {}
): (...args: T) => void {
  const { leading = false, trailing = true, maxWait } = options
  
  let timeoutId: NodeJS.Timeout | null = null
  let maxTimeoutId: NodeJS.Timeout | null = null
  let lastCallTime = 0
  let lastInvokeTime = 0
  let lastArgs: T | null = null

  function invokeFunc() {
    if (lastArgs) {
      lastInvokeTime = Date.now()
      func(...lastArgs)
      lastArgs = null
    }
  }

  function leadingEdge() {
    lastInvokeTime = Date.now()
    if (leading) {
      invokeFunc()
    }
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = delay - timeSinceLastCall

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime

    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    )
  }

  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    
    const timeRemaining = remainingWait(time)
    timeoutId = setTimeout(timerExpired, timeRemaining)
  }

  function trailingEdge(_time: number) {
    timeoutId = null
    if (trailing && lastArgs) {
      invokeFunc()
    }
    lastArgs = null
    return
  }

  function cancel() {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId)
      maxTimeoutId = null
    }
    lastCallTime = 0
    lastInvokeTime = 0
    lastArgs = null
  }

  function flush() {
    if (timeoutId || maxTimeoutId) {
      const time = Date.now()
      trailingEdge(time)
    }
  }

  const debounced = (...args: T) => {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastCallTime = time

    if (isInvoking) {
      if (!timeoutId) {
        leadingEdge()
      }
      if (maxWait !== undefined && !maxTimeoutId) {
        maxTimeoutId = setTimeout(() => {
          invokeFunc()
          maxTimeoutId = null
        }, maxWait)
      }
      return
    }
    if (!timeoutId) {
      timeoutId = setTimeout(timerExpired, delay)
    }
  }

  debounced.cancel = cancel
  debounced.flush = flush

  return debounced
}

/**
 * Utility to ensure a function is called at most once
 */
export function once<T extends unknown[]>(
  func: (...args: T) => void
): (...args: T) => void {
  let called = false
  
  return (...args: T) => {
    if (!called) {
      called = true
      func(...args)
    }
  }
}