/**
 * Focus trap utility for accessible modal and drawer components
 * Ensures keyboard navigation stays within the component
 */

import type { FocusTrapOptions, FocusTrapReturn } from '../types'

// Focusable element selectors
const FOCUSABLE_SELECTORS = [
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])', 
  'textarea:not([disabled]):not([tabindex="-1"])',
  'a[href]:not([tabindex="-1"])',
  'area[href]:not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
  'iframe:not([tabindex="-1"])',
  'object:not([tabindex="-1"])',
  'embed:not([tabindex="-1"])',
  '[contenteditable]:not([tabindex="-1"])',
  'audio[controls]:not([tabindex="-1"])',
  'video[controls]:not([tabindex="-1"])',
  'summary:not([tabindex="-1"])'
].join(', ')

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
  )
  
  return elements.filter(element => {
    // Additional checks for visibility and disabled state
    const style = window.getComputedStyle(element)
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      !element.hasAttribute('disabled') &&
      element.tabIndex !== -1 &&
      element.offsetParent !== null // Element is visible
    )
  })
}

/**
 * Focus trap implementation
 */
export function createFocusTrap(
  container: HTMLElement,
  options: FocusTrapOptions = {}
): FocusTrapReturn {
  const {
    autoFocus = true,
    restoreFocus = true,
    allowOutsideClick = false,
    escapeDeactivates = true
  } = options

  let isActive = false
  let previousActiveElement: HTMLElement | null = null
  let focusableElements: HTMLElement[] = []
  let firstFocusableElement: HTMLElement | null = null
  let lastFocusableElement: HTMLElement | null = null

  function updateFocusableElements() {
    focusableElements = getFocusableElements(container)
    firstFocusableElement = focusableElements[0] || null
    lastFocusableElement = focusableElements[focusableElements.length - 1] || null
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!isActive) return

    // Handle Escape key
    if (escapeDeactivates && event.key === 'Escape') {
      event.preventDefault()
      deactivate()
      return
    }

    // Handle Tab key
    if (event.key === 'Tab') {
      updateFocusableElements()

      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      if (event.shiftKey) {
        // Shift + Tab (backwards)
        if (document.activeElement === firstFocusableElement) {
          event.preventDefault()
          lastFocusableElement?.focus()
        }
      } else {
        // Tab (forwards)
        if (document.activeElement === lastFocusableElement) {
          event.preventDefault()
          firstFocusableElement?.focus()
        }
      }
    }
  }

  function handleFocusIn(event: FocusEvent) {
    if (!isActive) return

    const target = event.target as HTMLElement
    
    // If focus moved outside the container, bring it back
    if (!container.contains(target)) {
      event.preventDefault()
      event.stopPropagation()
      
      // Focus the first focusable element or the container itself
      if (firstFocusableElement) {
        firstFocusableElement.focus()
      } else {
        container.focus()
      }
    }
  }

  function handleClick(event: MouseEvent) {
    if (!isActive || allowOutsideClick) return

    const target = event.target as HTMLElement
    
    // If click is outside the container, prevent it
    if (!container.contains(target)) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  function activate(): void {
    if (isActive) return

    // Store the currently focused element
    previousActiveElement = document.activeElement as HTMLElement

    isActive = true
    updateFocusableElements()

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('focusin', handleFocusIn, true)
    document.addEventListener('click', handleClick, true)

    // Focus the first focusable element or the container
    if (autoFocus) {
      if (firstFocusableElement) {
        firstFocusableElement.focus()
      } else {
        // Make container focusable and focus it
        const originalTabIndex = container.tabIndex
        container.tabIndex = -1
        container.focus()
        container.tabIndex = originalTabIndex
      }
    }
  }

  function deactivate(): void {
    if (!isActive) return

    isActive = false

    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('focusin', handleFocusIn, true) 
    document.removeEventListener('click', handleClick, true)

    // Restore focus to the previously focused element
    if (restoreFocus && previousActiveElement) {
      previousActiveElement.focus()
    }

    previousActiveElement = null
  }

  return {
    activate,
    deactivate,
    get isActive() {
      return isActive
    }
  }
}

/**
 * React hook for using focus trap
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean,
  options?: FocusTrapOptions
): void {
  React.useEffect(() => {
    if (!containerRef.current || !isActive) return

    const focusTrap = createFocusTrap(containerRef.current, options)
    focusTrap.activate()

    return () => {
      focusTrap.deactivate()
    }
  }, [containerRef, isActive, options])
}

/**
 * Alternative implementation using the popular focus-trap library pattern
 * This is a simplified version - in production you might want to use focus-trap npm package
 */
export class FocusTrap {
  private container: HTMLElement
  private options: Required<FocusTrapOptions>
  private isActive = false

  constructor(container: HTMLElement, options: FocusTrapOptions = {}) {
    this.container = container
    this.options = {
      autoFocus: true,
      restoreFocus: true,
      allowOutsideClick: false,
      escapeDeactivates: true,
      ...options
    }
  }

  activate(): void {
    const trap = createFocusTrap(this.container, this.options)
    trap.activate()
    this.isActive = true
  }

  deactivate(): void {
    if (this.isActive) {
      const trap = createFocusTrap(this.container, this.options)
      trap.deactivate()
      this.isActive = false
    }
  }

  get active(): boolean {
    return this.isActive
  }
}

// Re-export React import for the hook
import React from 'react'