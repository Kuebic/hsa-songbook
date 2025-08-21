/**
 * Toggle button component for manual toolbar control
 * Includes pin/unpin functionality for persistent state
 */

import { memo } from 'react'
import { ChevronDown, Menu, Pin, PinOff } from 'lucide-react'
import { usePrefersReducedMotion } from '../../hooks/useViewport'

export interface ToggleButtonProps {
  isVisible: boolean
  isPinned: boolean
  onToggle: () => void
  onPin: () => void
  onUnpin: () => void
  position?: 'left' | 'right'
  className?: string
}

export const ToggleButton = memo(function ToggleButton({
  isVisible,
  isPinned,
  onToggle,
  onPin,
  onUnpin,
  position = 'right',
  className = ''
}: ToggleButtonProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPinned) {
      onUnpin()
    } else {
      onPin()
    }
  }

  return (
    <div
      className={`toolbar-toggle-container ${className}`}
      style={{
        position: 'fixed',
        top: isVisible ? '12px' : '4px',
        [position]: '12px',
        zIndex: 101,
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        transition: prefersReducedMotion ? 'none' : 'all 0.3s ease',
        paddingTop: 'env(safe-area-inset-top)'
      }}
      aria-label="Toolbar controls"
    >
      {/* Pin/Unpin Button - Only show when toolbar is visible */}
      {isVisible && (
        <button
          onClick={handlePinToggle}
          aria-label={isPinned ? 'Unpin toolbar' : 'Pin toolbar'}
          aria-pressed={isPinned}
          title={isPinned ? 'Unpin toolbar' : 'Pin toolbar'}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: isPinned 
              ? 'var(--color-primary)' 
              : 'var(--nav-background)',
            color: isPinned 
              ? 'var(--color-primary-foreground)' 
              : 'var(--color-foreground)',
            border: isPinned 
              ? 'none'
              : '1px solid var(--color-border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isPinned 
              ? '0 2px 8px rgba(0, 0, 0, 0.2)' 
              : '0 1px 4px rgba(0, 0, 0, 0.1)',
            transition: prefersReducedMotion ? 'none' : 'all 0.2s ease',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            opacity: prefersReducedMotion ? 1 : 0,
            animation: prefersReducedMotion ? 'none' : 'fadeIn 0.3s ease forwards 0.3s'
          }}
          onMouseDown={(e) => {
            if (!prefersReducedMotion) {
              e.currentTarget.style.transform = 'scale(0.9)'
            }
          }}
          onMouseUp={(e) => {
            if (!prefersReducedMotion) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
          onMouseLeave={(e) => {
            if (!prefersReducedMotion) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          {isPinned ? <PinOff size={18} /> : <Pin size={18} />}
        </button>
      )}

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        aria-label={isVisible ? 'Hide toolbar' : 'Show toolbar'}
        aria-expanded={isVisible}
        title={isVisible ? 'Hide toolbar (T)' : 'Show toolbar (T)'}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'var(--nav-background)',
          color: 'var(--color-foreground)',
          border: '1px solid var(--color-border)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          transition: prefersReducedMotion ? 'none' : 'all 0.2s ease',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
        onMouseDown={(e) => {
          if (!prefersReducedMotion) {
            e.currentTarget.style.transform = 'scale(0.95)'
          }
        }}
        onMouseUp={(e) => {
          if (!prefersReducedMotion) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
        onMouseLeave={(e) => {
          if (!prefersReducedMotion) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        {isVisible ? <ChevronDown size={20} /> : <Menu size={20} />}
      </button>

      {/* CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateX(${position === 'right' ? '10px' : '-10px'});
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @media (prefers-reduced-motion: reduce) {
            .toolbar-toggle-container * {
              animation: none !important;
              transition: none !important;
            }
          }
          
          /* Hover effects for larger screens */
          @media (min-width: 768px) and (hover: hover) {
            .toolbar-toggle-container button:hover {
              transform: scale(1.05);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            .toolbar-toggle-container button:hover[aria-pressed="true"] {
              background-color: var(--color-primary-hover);
            }
          }
          
          /* Focus styles for accessibility */
          .toolbar-toggle-container button:focus-visible {
            outline: 2px solid var(--color-focus);
            outline-offset: 2px;
          }
          
          /* High contrast mode support */
          @media (prefers-contrast: high) {
            .toolbar-toggle-container button {
              border-width: 2px;
            }
          }
        `
      }} />
    </div>
  )
})

export default ToggleButton