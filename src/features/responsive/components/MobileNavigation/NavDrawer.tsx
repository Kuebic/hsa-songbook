/**
 * Navigation drawer component
 * Slide-out navigation panel with focus trap and accessibility features
 */

import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '../../utils/focusTrap'
import { usePrefersReducedMotion } from '../../hooks/useViewport'
import type { NavDrawerProps } from '../../types'

export function NavDrawer({
  isOpen,
  onClose,
  items,
  className = ''
}: NavDrawerProps) {
  const drawerRef = useRef<HTMLElement>(null!)
  const prefersReducedMotion = usePrefersReducedMotion()
  
  // Focus trap for accessibility
  useFocusTrap(drawerRef, isOpen, {
    autoFocus: true,
    restoreFocus: true,
    allowOutsideClick: false,
    escapeDeactivates: true
  })

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      const originalPaddingRight = document.body.style.paddingRight
      
      // Get scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
      
      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const drawer = (
    <nav
      ref={drawerRef}
      id="mobile-navigation-drawer"
      className={`nav-drawer ${className}`}
      aria-label="Mobile navigation"
      role="navigation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100dvh',
        width: '280px',
        maxWidth: '85vw',
        backgroundColor: 'var(--color-background)',
        borderRight: '1px solid var(--color-border)',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: prefersReducedMotion ? 'none' : 'transform 0.3s ease-out',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          minHeight: '64px'
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}
        >
          🎵 HSA Songbook
        </h2>
        
        <button
          onClick={onClose}
          aria-label="Close navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            padding: '8px',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            transition: prefersReducedMotion ? 'none' : 'all 0.2s ease',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Navigation Items */}
      <div
        style={{
          flex: 1,
          padding: '8px 0'
        }}
      >
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}
        >
          {items.map((item, _index) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => 
                  `nav-drawer-link ${isActive ? 'active' : ''}`
                }
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  margin: '0 8px',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: isActive ? '600' : '400',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
                  transition: prefersReducedMotion ? 'none' : 'all 0.2s ease',
                  minHeight: '44px',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  outline: 'none'
                })}
                onFocus={(e) => {
                  if (!prefersReducedMotion) {
                    e.target.style.backgroundColor = 'var(--color-muted)'
                  }
                }}
                onBlur={(e) => {
                  const isActive = e.target.getAttribute('aria-current') === 'page'
                  e.target.style.backgroundColor = isActive ? 'var(--color-accent)' : 'transparent'
                }}
              >
                {item.icon && <item.icon size={20} />}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Footer */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--color-border)',
          fontSize: '14px',
          color: 'var(--text-tertiary)',
          textAlign: 'center'
        }}
      >
        © 2025 HSA Songbook
      </div>
    </nav>
  )

  // Render to body to ensure proper z-index stacking
  return createPortal(drawer, document.body)
}

export default NavDrawer