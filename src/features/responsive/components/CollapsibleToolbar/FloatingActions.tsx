/**
 * Floating action buttons component
 * Shows when toolbar is hidden to provide quick access to key actions
 */

import { memo } from 'react'
import { ChevronUp, Zap, Settings, Edit } from 'lucide-react'
import { usePrefersReducedMotion } from '../../hooks/useViewport'
import type { FloatingActionsProps } from '../../types'

const actionIcons = {
  transpose: Zap,
  stage: Settings,
  edit: Edit,
  show: ChevronUp
}

const actionLabels = {
  transpose: 'Transpose',
  stage: 'Stage Mode',
  edit: 'Edit',
  show: 'Show Toolbar'
}

export const FloatingActions = memo(function FloatingActions({
  actions,
  onShow,
  onActionClick,
  className = ''
}: FloatingActionsProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const handleActionClick = (action: string) => {
    if (action === 'show') {
      onShow()
    } else if (onActionClick) {
      onActionClick(action)
    }
  }

  return (
    <div
      className={`floating-actions ${className}`}
      style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom))',
        right: 'calc(24px + env(safe-area-inset-right))',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
    >
      {/* Show toolbar button (always present) */}
      <button
        onClick={() => handleActionClick('show')}
        aria-label="Show toolbar"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-primary-foreground)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
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
        <ChevronUp size={24} />
      </button>

      {/* Additional action buttons */}
      {actions.filter(action => action !== 'show').map((action, index) => {
        const Icon = actionIcons[action as keyof typeof actionIcons]
        const label = actionLabels[action as keyof typeof actionLabels]
        
        if (!Icon) return null

        return (
          <button
            key={action}
            onClick={() => handleActionClick(action)}
            aria-label={label}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-secondary)',
              color: 'var(--color-secondary-foreground)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              transition: prefersReducedMotion ? 'none' : 'all 0.2s ease',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              animationDelay: prefersReducedMotion ? '0ms' : `${index * 50}ms`,
              animation: prefersReducedMotion ? 'none' : 'fabSlideIn 0.3s ease-out forwards'
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
            <Icon size={20} />
          </button>
        )
      })}

      {/* CSS animations as style tag to avoid external CSS dependency */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fabSlideIn {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.8);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @media (prefers-reduced-motion: reduce) {
            .floating-actions * {
              animation: none !important;
              transition: none !important;
            }
          }
          
          /* Hover effects for larger screens */
          @media (min-width: 768px) {
            .floating-actions button:hover {
              transform: scale(1.05);
              box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
            }
          }
        `
      }} />
    </div>
  )
})

export default FloatingActions