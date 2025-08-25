/**
 * Enhanced Collapsible toolbar component
 * Auto-hides based on activity and scroll, with manual control and persistence
 */

import { useEffect, useRef, useCallback } from 'react'
import { useToolbarVisibility, useFABVisibility } from '../../hooks/useToolbarVisibility'
import { useToolbarAnimation } from '../../hooks/useToolbarVisibility'
import { useActivityDetection } from '../../hooks/useActivityDetection'
import { useViewport } from '../../hooks/useViewport'
import { FloatingActions } from './FloatingActions'
import { ToggleButton } from './ToggleButton'
import type { CollapsibleToolbarProps } from '../../types'

export function CollapsibleToolbar({
  children,
  // Core Behavior
  autoHide = true,
  autoHideDelay = 3000,
  defaultVisible = true,
  
  // Device-Specific Settings
  autoHideOnMobile = true,
  autoHideOnTablet = true,
  autoHideOnDesktop = false,
  
  // Scroll Behavior
  showOnScrollUp: _showOnScrollUp = true,
  hideOnScrollDown: _hideOnScrollDown = true,
  scrollThreshold = 10,
  
  // Activity Detection
  detectMouse = true,
  detectTouch = true,
  detectKeyboard = true,
  
  // Floating Actions
  showFloatingActions = true,
  floatingActions = ['transpose', 'stage'],
  
  // Callbacks
  onVisibilityChange,
  
  // Persistence
  persistKey = 'toolbar-state',
  enablePersistence = true,
  
  // Styling
  className = '',
  height: propHeight,
  zIndex = 100,
  
  // Manual Control
  showToggleButton = true,
  toggleButtonPosition = 'right'
}: CollapsibleToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const viewport = useViewport()
  const toolbar = useToolbarVisibility(100, scrollThreshold)
  const { transform, shouldRender } = useToolbarAnimation(toolbar.isVisible)
  const showFAB = useFABVisibility(toolbar.isVisible)
  
  // Device-specific auto-hide settings
  const shouldAutoHide = autoHide && (
    (viewport.isMobile && autoHideOnMobile) ||
    (viewport.isTablet && autoHideOnTablet) ||
    (viewport.isDesktop && autoHideOnDesktop)
  )
  
  // Activity detection for auto-hide timer
  const activity = useActivityDetection({
    enabled: shouldAutoHide,
    delay: autoHideDelay,
    detectMouse,
    detectTouch,
    detectScroll: false, // We handle scroll separately
    detectKeyboard
  })

  // Initialize with default visibility
  useEffect(() => {
    if (!defaultVisible) {
      toolbar.hide()
    } else if (defaultVisible && !shouldAutoHide) {
      // Force show on desktop when autoHide is disabled
      toolbar.show()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply auto-hide based on activity
  useEffect(() => {
    if (!shouldAutoHide || toolbar.isPinned) return

    if (!activity.isActive && activity.inactivityDuration >= autoHideDelay) {
      toolbar.hide()
    } else if (activity.isActive && toolbar.isUserHidden) {
      // Don't automatically show if user manually hid it
      return
    } else if (activity.isActive && !toolbar.isVisible) {
      toolbar.show()
    }
  }, [
    activity.isActive,
    activity.inactivityDuration,
    autoHideDelay,
    shouldAutoHide,
    toolbar.isPinned,
    toolbar.isUserHidden,
    toolbar
  ])

  // Apply scroll behavior settings
  useEffect(() => {
    toolbar.setAutoHide(shouldAutoHide && !toolbar.isPinned)
  }, [shouldAutoHide, toolbar.isPinned]) // eslint-disable-line react-hooks/exhaustive-deps

  // Measure toolbar height
  useEffect(() => {
    if (toolbarRef.current) {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry) {
          const height = entry.contentRect.height
          toolbar.setHeight(height)
          
          if (onVisibilityChange) {
            onVisibilityChange(toolbar.isVisible, height)
          }
        }
      })

      observer.observe(toolbarRef.current)
      
      return () => observer.disconnect()
    }
  }, [toolbar.isVisible]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // T key to toggle toolbar
      if (e.key === 't' || e.key === 'T') {
        // Don't trigger if user is typing in an input
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.isContentEditable) {
          return
        }
        
        e.preventDefault()
        toolbar.toggle()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persistence
  useEffect(() => {
    if (!enablePersistence) return

    try {
      const stored = localStorage.getItem(persistKey)
      if (stored) {
        const state = JSON.parse(stored)
        if (typeof state.isPinned === 'boolean') {
          if (state.isPinned) {
            toolbar.pin()
          }
        }
        if (typeof state.isVisible === 'boolean' && !state.isVisible) {
          toolbar.hide()
        }
      }
    } catch (error) {
      console.warn('Failed to load toolbar state:', error)
    }
  }, [persistKey, enablePersistence]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save state
  useEffect(() => {
    if (!enablePersistence) return

    try {
      const state = {
        isPinned: toolbar.isPinned,
        isVisible: toolbar.isVisible,
        timestamp: Date.now()
      }
      localStorage.setItem(persistKey, JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save toolbar state:', error)
    }
  }, [toolbar.isPinned, toolbar.isVisible, persistKey, enablePersistence])

  // Cross-tab synchronization
  useEffect(() => {
    if (!enablePersistence) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === persistKey && e.newValue) {
        try {
          const state = JSON.parse(e.newValue)
          if (state.isPinned && !toolbar.isPinned) {
            toolbar.pin()
          } else if (!state.isPinned && toolbar.isPinned) {
            toolbar.unpin()
          }
          
          if (state.isVisible && !toolbar.isVisible) {
            toolbar.show()
          } else if (!state.isVisible && toolbar.isVisible) {
            toolbar.hide()
          }
        } catch (error) {
          console.warn('Failed to sync toolbar state:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [persistKey, enablePersistence]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle floating action clicks
  const handleActionClick = useCallback((action: string) => {
    // Dispatch custom events that parent components can listen to
    const event = new CustomEvent('toolbar-action', { 
      detail: { action },
      bubbles: true 
    })
    window.dispatchEvent(event)
  }, [])

  return (
    <>
      {/* Toggle Button */}
      {showToggleButton && (
        <ToggleButton
          isVisible={toolbar.isVisible}
          isPinned={toolbar.isPinned}
          onToggle={toolbar.toggle}
          onPin={toolbar.pin}
          onUnpin={toolbar.unpin}
          position={toggleButtonPosition}
        />
      )}

      {/* Toolbar Container */}
      {shouldRender && (
        <div
          ref={toolbarRef}
          className={`collapsible-toolbar ${className}`}
          role="toolbar"
          aria-label="Page toolbar"
          aria-hidden={!toolbar.isVisible}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex,
            transform,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: 'var(--nav-background)',
            borderBottom: '1px solid var(--color-border)',
            paddingTop: 'env(safe-area-inset-top)',
            boxShadow: toolbar.isVisible 
              ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
              : 'none',
            height: propHeight === 'auto' ? 'auto' : propHeight,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            MozBackfaceVisibility: 'hidden'
          }}
        >
          {/* Status indicator for pinned state */}
          {toolbar.isPinned && (
            <div
              aria-live="polite"
              aria-atomic="true"
              style={{
                position: 'absolute',
                top: '4px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 500,
                pointerEvents: 'none',
                zIndex: 1
              }}
            >
              Pinned
            </div>
          )}
          
          {children}
        </div>
      )}

      {/* Floating Actions */}
      {showFloatingActions && showFAB && !toolbar.isPinned && (
        <FloatingActions
          actions={[...floatingActions, 'show']}
          onShow={toolbar.show}
          onActionClick={handleActionClick}
        />
      )}

      {/* Performance optimized styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* GPU acceleration for smooth animations */
          .collapsible-toolbar {
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
          }
          
          /* Reduced motion support */
          @media (prefers-reduced-motion: reduce) {
            .collapsible-toolbar {
              transition: none !important;
            }
          }
          
          /* High performance scrolling */
          @supports (overscroll-behavior: contain) {
            .collapsible-toolbar {
              overscroll-behavior: contain;
            }
          }
          
          /* Focus visible for accessibility */
          .collapsible-toolbar:focus-within {
            outline: 2px solid var(--color-focus);
            outline-offset: -2px;
          }
        `
      }} />
    </>
  )
}

export default CollapsibleToolbar

// Export sub-components
export { FloatingActions } from './FloatingActions'
export { ToggleButton } from './ToggleButton'