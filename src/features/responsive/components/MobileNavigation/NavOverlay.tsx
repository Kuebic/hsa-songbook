/**
 * Navigation overlay component
 * Provides backdrop for mobile navigation drawer
 */

import { memo } from 'react'
import { createPortal } from 'react-dom'
import { usePrefersReducedMotion } from '../../hooks/useViewport'
import type { NavOverlayProps } from '../../types'

export const NavOverlay = memo(function NavOverlay({
  isOpen,
  onClick,
  className = ''
}: NavOverlayProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  if (!isOpen) return null

  const overlay = (
    <div
      className={`nav-overlay ${className}`}
      onClick={onClick}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9998,
        cursor: 'pointer',
        opacity: isOpen ? 1 : 0,
        transition: prefersReducedMotion ? 'none' : 'opacity 0.3s ease-out',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)'
      }}
    />
  )

  // Render to body to ensure proper z-index stacking
  return createPortal(overlay, document.body)
})

export default NavOverlay