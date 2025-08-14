import { useEffect } from 'react'

export function useTransposeKeyboard(
  onTranspose: (steps: number) => void,
  onReset: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if Alt key is pressed
      if (!e.altKey) return
      
      // Prevent default browser behavior
      switch(e.key) {
        case '+':
        case '=': // Handle both + and = (which is unshifted + on most keyboards)
          e.preventDefault()
          onTranspose(1)
          break
        case '-':
          e.preventDefault()
          onTranspose(-1)
          break
        case '0':
          e.preventDefault()
          onReset()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [onTranspose, onReset, enabled])
}