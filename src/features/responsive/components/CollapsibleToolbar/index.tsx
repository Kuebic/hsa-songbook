/**
 * Collapsible toolbar component
 * Auto-hides toolbar based on scroll direction and shows floating actions
 */

import React from 'react'
import { useToolbarVisibility, useFABVisibility } from '../../hooks/useToolbarVisibility'
import { useToolbarAnimation } from '../../hooks/useToolbarVisibility'
import { FloatingActions } from './FloatingActions'
import type { CollapsibleToolbarProps } from '../../types'

export function CollapsibleToolbar({
  children,
  autoHide = true,
  showFloatingActions = true,
  floatingActions = ['transpose', 'stage'],
  className = ''
}: CollapsibleToolbarProps) {
  const toolbar = useToolbarVisibility()
  const { transform, shouldRender } = useToolbarAnimation(toolbar.isVisible)
  const showFAB = useFABVisibility(toolbar.isVisible)

  // Apply auto-hide setting
  React.useEffect(() => {
    toolbar.setAutoHide(autoHide)
  }, [autoHide, toolbar])

  return (
    <>
      {/* Toolbar Container */}
      {shouldRender && (
        <div
          className={`collapsible-toolbar ${className}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            transform,
            transition: 'transform 0.3s ease-in-out',
            backgroundColor: 'var(--nav-background)',
            borderBottom: '1px solid var(--color-border)',
            paddingTop: 'env(safe-area-inset-top)',
            boxShadow: toolbar.isVisible 
              ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
              : 'none'
          }}
        >
          {children}
        </div>
      )}

      {/* Floating Actions */}
      {showFloatingActions && showFAB && (
        <FloatingActions
          actions={[...floatingActions, 'show']}
          onShow={toolbar.show}
          onActionClick={(action) => {
            // Handle specific action clicks
            console.log('FAB action clicked:', action)
            // In a real implementation, these would trigger app-specific actions
          }}
        />
      )}
    </>
  )
}

export default CollapsibleToolbar

// Export sub-components
export { FloatingActions } from './FloatingActions'

