/**
 * Hamburger button component for mobile navigation
 * Animated button that toggles between hamburger and X states
 */

import { memo } from 'react'
import { Menu, X } from 'lucide-react'
import { usePrefersReducedMotion } from '../../hooks/useViewport'
import type { HamburgerButtonProps } from '../../types'

export const HamburgerButton = memo(function HamburgerButton({
  isOpen,
  onClick,
  className = '',
  size = 24
}: HamburgerButtonProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <button
      onClick={onClick}
      className={`hamburger-button ${className}`}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation-drawer"
      type="button"
      style={{
        // Inline styles for core functionality, CSS classes for theming
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '44px',
        height: '44px',
        padding: '10px',
        background: 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        color: 'var(--nav-text)',
        transition: prefersReducedMotion ? 'none' : 'all 0.2s ease',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: prefersReducedMotion ? 'none' : 'transform 0.2s ease',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
        }}
      >
        {isOpen ? (
          <X 
            size={size} 
            aria-hidden="true"
            style={{
              transition: prefersReducedMotion ? 'none' : 'opacity 0.15s ease'
            }}
          />
        ) : (
          <Menu 
            size={size} 
            aria-hidden="true"
            style={{
              transition: prefersReducedMotion ? 'none' : 'opacity 0.15s ease'
            }}
          />
        )}
      </span>
    </button>
  )
})

export default HamburgerButton