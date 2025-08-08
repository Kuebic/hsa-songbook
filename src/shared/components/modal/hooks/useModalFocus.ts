import { useRef, useEffect } from 'react'
import type { UseModalFocusOptions } from '../types/modal.types'

export function useModalFocus({
  isOpen,
  dialogRef,
  initialFocusRef,
  finalFocusRef
}: UseModalFocusOptions) {
  const previousActiveElement = useRef<HTMLElement | null>(null)
  
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return
    
    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement
    
    // Focus initial element or first focusable
    const focusTarget = initialFocusRef?.current || 
      dialogRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    
    // Use requestAnimationFrame to ensure dialog is rendered
    requestAnimationFrame(() => {
      focusTarget?.focus()
    })
    
    // Capture ref values for cleanup
    const savedFinalFocusRef = finalFocusRef?.current
    const savedPreviousActiveElement = previousActiveElement.current
    
    return () => {
      // Return focus to trigger or specified element
      const returnTarget = savedFinalFocusRef || savedPreviousActiveElement
      returnTarget?.focus()
    }
  }, [isOpen, dialogRef, initialFocusRef, finalFocusRef])
}