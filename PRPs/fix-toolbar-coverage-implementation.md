# Fix Toolbar Coverage in Arrangement Viewer - Implementation PRP

## Executive Summary

This PRP provides comprehensive implementation guidance for fixing the toolbar coverage issue in the arrangement viewer. The solution extends the existing CollapsibleToolbar to work across all device sizes, implements smart auto-hide behavior, and fixes layout height calculations to maximize content visibility. This implementation follows the established vertical slice architecture and integrates with existing responsive features.

## Context and Research

### Codebase Analysis Summary

#### Existing Responsive Feature Slice
- **Location**: `src/features/responsive/`
- **Key Components**: CollapsibleToolbar, MobileNavigation, FloatingActions
- **Key Hooks**: useViewport, useScrollDirection, useToolbarVisibility
- **Services**: ViewportService (singleton pattern), PreferenceService
- **Current Integration**: Used in Layout.tsx for mobile navigation

#### Arrangement Viewer Current Implementation
- **Location**: `src/features/arrangements/`
- **Key Components**: ArrangementViewerPage, ViewerLayout, ViewerToolbar, ChordSheetViewer
- **Current Issues**:
  - CollapsibleToolbar only wraps toolbar on mobile (viewport.isMobile check)
  - ViewerLayout uses hardcoded 60px footer offset
  - No communication between CollapsibleToolbar visibility and ViewerLayout height
  - Fixed positioning causes layout calculation issues

#### Vertical Slice Architecture Pattern
The codebase follows consistent vertical slice architecture:
- Features are self-contained with components, hooks, services, types, utils
- Service-hook pattern for global state (service singleton + React hook wrapper)
- Hierarchical exports through index.ts files
- Cross-feature dependencies minimized, shared through `/shared` layer

### External Research Findings

#### Collapsible Toolbar Best Practices (2024-2025)
- **Auto-hide timing**: 3000ms inactivity delay (industry standard)
- **Animation duration**: 200-300ms for smooth transitions
- **Scroll threshold**: Hide after 100px scroll down, show immediately on scroll up
- **Activity detection**: Debounce at 100-150ms for performance
- **Accessibility**: Maintain focus trap, announce state changes
- **References**: 
  - Material Design 3: https://m3.material.io/components/app-bars/guidelines
  - Apple HIG: https://developer.apple.com/design/human-interface-guidelines/toolbars

#### CSS Viewport Units for Stability
- **Use SVH for consistency**: Prevents content jumps from dynamic browser UI
- **Fallback pattern**: Always provide `vh` fallback, then `svh`/`dvh`
- **Safe areas**: Use `env(safe-area-inset-*)` for notched devices
- **Browser support**: Chrome 108+, Firefox 101+, Safari 15.4+
- **References**:
  - MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/length
  - Web.dev: https://web.dev/blog/viewport-units

#### React 19 Performance Patterns
- **useTransition**: For non-blocking toolbar animations
- **useDeferredValue**: For search/filter updates during toolbar transitions
- **Automatic optimization**: React Compiler handles memoization
- **References**:
  - React 19 Docs: https://react.dev/blog/2024/12/05/react-19
  - Performance Guide: https://react.dev/learn/render-and-commit

### Critical Files to Reference

```typescript
// Existing implementations to extend
src/features/responsive/components/CollapsibleToolbar/index.tsx
src/features/responsive/hooks/useToolbarVisibility.ts
src/features/responsive/hooks/useScrollDirection.ts
src/features/responsive/services/viewportService.ts

// Components to modify
src/features/arrangements/pages/ArrangementViewerPage.tsx
src/features/arrangements/components/ViewerLayout.tsx
src/features/arrangements/components/ViewerToolbar.tsx

// Styles to update
src/features/responsive/components/CollapsibleToolbar/styles.css
src/features/arrangements/styles/viewer-layout.css
```

## Implementation Blueprint

### Phase 1: Enhance CollapsibleToolbar Component

#### 1.1 Update CollapsibleToolbar for Universal Usage

```typescript
// src/features/responsive/components/CollapsibleToolbar/index.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useToolbarVisibility } from '../../hooks/useToolbarVisibility'
import { useScrollDirection } from '../../hooks/useScrollDirection'
import { useViewport } from '../../hooks/useViewport'
import { useActivityDetection } from '../../hooks/useActivityDetection'
import { FloatingActions } from './FloatingActions'
import { ToolbarToggle } from './ToolbarToggle'
import './styles.css'

interface EnhancedCollapsibleToolbarProps {
  children: React.ReactNode
  // Core behavior
  autoHide?: boolean              // Enable auto-hide (default: device-dependent)
  autoHideDelay?: number          // Delay before hiding (default: 3000ms)
  defaultVisible?: boolean        // Initial visibility
  
  // Device-specific settings
  autoHideOnMobile?: boolean      // Override for mobile (default: true)
  autoHideOnTablet?: boolean      // Override for tablet (default: false)
  autoHideOnDesktop?: boolean     // Override for desktop (default: false)
  
  // Scroll behavior
  showOnScrollUp?: boolean        // Show when scrolling up
  hideOnScrollDown?: boolean      // Hide when scrolling down
  scrollThreshold?: number        // Pixels before triggering
  
  // Activity detection
  detectMouse?: boolean           // Track mouse movement
  detectTouch?: boolean           // Track touch events
  detectKeyboard?: boolean        // Track keyboard activity
  
  // FAB configuration
  showFloatingActions?: boolean   // Show FAB when hidden
  floatingActions?: string[]      // Actions to show in FAB
  
  // Callbacks
  onVisibilityChange?: (visible: boolean, height: number) => void
  
  // Persistence
  persistKey?: string             // Key for localStorage
  enablePersistence?: boolean     // Save preferences
  
  // Styling
  className?: string
  height?: number | 'auto'
  zIndex?: number
  
  // Manual control
  showToggleButton?: boolean      // Show manual toggle
  toggleButtonPosition?: 'left' | 'right'
}

export function CollapsibleToolbar({
  children,
  autoHide,
  autoHideDelay = 3000,
  defaultVisible = true,
  autoHideOnMobile = true,
  autoHideOnTablet = false,
  autoHideOnDesktop = false,
  showOnScrollUp = true,
  hideOnScrollDown = true,
  scrollThreshold = 100,
  detectMouse = true,
  detectTouch = true,
  detectKeyboard = false,
  showFloatingActions = true,
  floatingActions = ['transpose', 'stage'],
  onVisibilityChange,
  persistKey = 'toolbar-visibility',
  enablePersistence = true,
  className,
  height = 'auto',
  zIndex = 100,
  showToggleButton = true,
  toggleButtonPosition = 'right'
}: EnhancedCollapsibleToolbarProps) {
  const viewport = useViewport()
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [toolbarHeight, setToolbarHeight] = useState(0)
  
  // Determine auto-hide based on device if not explicitly set
  const shouldAutoHide = autoHide ?? (
    viewport.isMobile ? autoHideOnMobile :
    viewport.isTablet ? autoHideOnTablet :
    autoHideOnDesktop
  )
  
  // Use enhanced toolbar visibility hook
  const {
    isVisible,
    show,
    hide,
    toggle,
    isPinned,
    pin,
    unpin
  } = useToolbarVisibility({
    defaultVisible,
    autoHide: shouldAutoHide,
    autoHideDelay,
    persistKey: enablePersistence ? persistKey : undefined
  })
  
  // Scroll direction detection
  const { scrollDirection, scrollY } = useScrollDirection({
    threshold: scrollThreshold
  })
  
  // Activity detection for auto-hide
  const activity = useActivityDetection({
    enabled: shouldAutoHide && !isPinned,
    delay: autoHideDelay,
    detectMouse: detectMouse && !viewport.isMobile,
    detectTouch: detectTouch && viewport.isMobile,
    detectKeyboard
  })
  
  // Handle scroll-based visibility
  useEffect(() => {
    if (!shouldAutoHide || isPinned) return
    
    if (hideOnScrollDown && scrollDirection === 'down' && scrollY > scrollThreshold) {
      hide()
    } else if (showOnScrollUp && scrollDirection === 'up') {
      show()
    }
  }, [scrollDirection, scrollY, shouldAutoHide, isPinned, hide, show])
  
  // Handle activity-based visibility
  useEffect(() => {
    if (!shouldAutoHide || isPinned) return
    
    if (activity.isActive) {
      show()
    } else {
      hide()
    }
  }, [activity.isActive, shouldAutoHide, isPinned, show, hide])
  
  // Track toolbar height changes
  useEffect(() => {
    if (!toolbarRef.current) return
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height
        setToolbarHeight(height)
        
        // Notify parent of visibility and height changes
        if (onVisibilityChange) {
          onVisibilityChange(isVisible, isVisible ? height : 0)
        }
      }
    })
    
    resizeObserver.observe(toolbarRef.current)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [isVisible, onVisibilityChange])
  
  // Handle manual toggle
  const handleToggle = useCallback(() => {
    toggle()
    if (isPinned) {
      unpin()
    } else {
      pin()
    }
  }, [toggle, isPinned, pin, unpin])
  
  return (
    <>
      {/* Toolbar Container */}
      <div
        ref={toolbarRef}
        className={`collapsible-toolbar ${isVisible ? 'visible' : 'hidden'} ${className || ''}`}
        style={{
          position: viewport.isDesktop && !shouldAutoHide ? 'relative' : 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex,
          transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          height: height === 'auto' ? 'auto' : height
        }}
      >
        {children}
      </div>
      
      {/* Manual Toggle Button */}
      {showToggleButton && (
        <ToolbarToggle
          isVisible={isVisible}
          isPinned={isPinned}
          position={toggleButtonPosition}
          onClick={handleToggle}
        />
      )}
      
      {/* Floating Action Buttons */}
      {showFloatingActions && !isVisible && (
        <FloatingActions
          actions={floatingActions}
          onShow={show}
        />
      )}
    </>
  )
}
```

#### 1.2 Create Activity Detection Hook

```typescript
// src/features/responsive/hooks/useActivityDetection.ts

import { useState, useEffect, useRef, useCallback } from 'react'
import { debounce } from '../utils/debounce'

interface UseActivityDetectionOptions {
  enabled: boolean
  delay: number
  detectMouse?: boolean
  detectTouch?: boolean
  detectScroll?: boolean
  detectKeyboard?: boolean
}

interface ActivityState {
  isActive: boolean
  lastActivity: number
  activityType: 'mouse' | 'touch' | 'scroll' | 'keyboard' | null
}

export function useActivityDetection({
  enabled,
  delay,
  detectMouse = true,
  detectTouch = true,
  detectScroll = false,
  detectKeyboard = false
}: UseActivityDetectionOptions): ActivityState {
  const [state, setState] = useState<ActivityState>({
    isActive: true,
    lastActivity: Date.now(),
    activityType: null
  })
  
  const timeoutRef = useRef<NodeJS.Timeout>()
  const isDetectingRef = useRef(enabled)
  
  // Update detection state
  useEffect(() => {
    isDetectingRef.current = enabled
  }, [enabled])
  
  // Reset inactivity timer
  const resetTimer = useCallback((type: ActivityState['activityType']) => {
    if (!isDetectingRef.current) return
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Update activity state
    setState({
      isActive: true,
      lastActivity: Date.now(),
      activityType: type
    })
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isActive: false
      }))
    }, delay)
  }, [delay])
  
  // Debounced activity handlers
  const handleMouseActivity = useCallback(
    debounce(() => resetTimer('mouse'), 100),
    [resetTimer]
  )
  
  const handleTouchActivity = useCallback(
    debounce(() => resetTimer('touch'), 100),
    [resetTimer]
  )
  
  const handleScrollActivity = useCallback(
    debounce(() => resetTimer('scroll'), 150),
    [resetTimer]
  )
  
  const handleKeyboardActivity = useCallback(
    debounce(() => resetTimer('keyboard'), 100),
    [resetTimer]
  )
  
  // Setup event listeners
  useEffect(() => {
    if (!enabled) return
    
    const events: Array<[string, EventListener, boolean?]> = []
    
    if (detectMouse) {
      events.push(['mousemove', handleMouseActivity as EventListener])
      events.push(['mouseenter', handleMouseActivity as EventListener])
    }
    
    if (detectTouch) {
      events.push(['touchstart', handleTouchActivity as EventListener, { passive: true }])
      events.push(['touchmove', handleTouchActivity as EventListener, { passive: true }])
    }
    
    if (detectScroll) {
      events.push(['scroll', handleScrollActivity as EventListener, { passive: true }])
    }
    
    if (detectKeyboard) {
      events.push(['keydown', handleKeyboardActivity as EventListener])
    }
    
    // Add event listeners
    events.forEach(([event, handler, options]) => {
      window.addEventListener(event, handler, options as any)
    })
    
    // Initial timer
    resetTimer(null)
    
    // Cleanup
    return () => {
      events.forEach(([event, handler, options]) => {
        window.removeEventListener(event, handler, options as any)
      })
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [
    enabled,
    detectMouse,
    detectTouch,
    detectScroll,
    detectKeyboard,
    handleMouseActivity,
    handleTouchActivity,
    handleScrollActivity,
    handleKeyboardActivity,
    resetTimer
  ])
  
  return state
}
```

#### 1.3 Create Toolbar Toggle Button Component

```typescript
// src/features/responsive/components/CollapsibleToolbar/ToolbarToggle.tsx

import React from 'react'
import { ChevronDown, ChevronUp, Pin } from 'lucide-react'
import './styles.css'

interface ToolbarToggleProps {
  isVisible: boolean
  isPinned: boolean
  position: 'left' | 'right'
  onClick: () => void
}

export function ToolbarToggle({
  isVisible,
  isPinned,
  position,
  onClick
}: ToolbarToggleProps) {
  return (
    <button
      className={`toolbar-toggle ${position}`}
      onClick={onClick}
      aria-label={isVisible ? 'Hide toolbar' : 'Show toolbar'}
      aria-expanded={isVisible}
      title={
        isPinned ? 'Unpin toolbar' :
        isVisible ? 'Hide toolbar' :
        'Show toolbar'
      }
    >
      {isPinned ? (
        <Pin size={16} />
      ) : isVisible ? (
        <ChevronUp size={16} />
      ) : (
        <ChevronDown size={16} />
      )}
    </button>
  )
}
```

### Phase 2: Fix ViewerLayout Height Calculations

#### 2.1 Enhanced ViewerLayout with Dynamic Height Management

```typescript
// src/features/arrangements/components/ViewerLayout.tsx

import { useRef, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useViewport } from '@features/responsive/hooks/useViewport'

interface EnhancedViewerLayoutProps {
  header?: ReactNode
  toolbar?: ReactNode
  content: ReactNode
  controls?: ReactNode
  onToolbarHeightChange?: (height: number) => void
  toolbarHeight?: number  // Height when toolbar is hidden/visible
}

export function ViewerLayout({ 
  header, 
  toolbar, 
  content, 
  controls,
  onToolbarHeightChange,
  toolbarHeight = 0
}: EnhancedViewerLayoutProps) {
  const viewport = useViewport()
  const layoutRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLElement>(null)
  
  const [headerHeight, setHeaderHeight] = useState(0)
  const [controlsHeight, setControlsHeight] = useState(0)
  const [footerHeight, setFooterHeight] = useState(0)
  const [navHeight, setNavHeight] = useState(0)
  
  // Find and measure navigation and footer heights
  useEffect(() => {
    // Find navigation header
    const nav = document.querySelector('.nav-header')
    if (nav) {
      const navRect = nav.getBoundingClientRect()
      setNavHeight(navRect.height)
    }
    
    // Find footer
    const footer = document.querySelector('.footer')
    if (footer) {
      const footerRect = footer.getBoundingClientRect()
      setFooterHeight(footerRect.height)
    }
  }, [])
  
  // Track component height changes
  useEffect(() => {
    const updateHeights = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
      if (controlsRef.current) {
        setControlsHeight(controlsRef.current.offsetHeight)
      }
    }
    
    updateHeights()
    
    const resizeObserver = new ResizeObserver(updateHeights)
    
    if (headerRef.current) resizeObserver.observe(headerRef.current)
    if (controlsRef.current) resizeObserver.observe(controlsRef.current)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [header, controls])
  
  // Calculate content height using modern viewport units
  const calculateContentHeight = useCallback(() => {
    const totalFixedHeight = 
      navHeight +           // Navigation header
      headerHeight +        // Viewer header
      toolbarHeight +       // Toolbar (0 when hidden)
      controlsHeight +      // Viewer controls
      footerHeight          // Footer
    
    // Use SVH for stability, with VH fallback
    return `calc(100svh - ${totalFixedHeight}px)`
  }, [navHeight, headerHeight, toolbarHeight, controlsHeight, footerHeight])
  
  // Support CSS fallback for older browsers
  const contentHeightStyle = {
    height: calculateContentHeight(),
    // Fallback for browsers without SVH support
    minHeight: `calc(100vh - ${navHeight + headerHeight + toolbarHeight + controlsHeight + footerHeight}px)`,
    maxHeight: `calc(100lvh - ${navHeight + headerHeight + toolbarHeight + controlsHeight + footerHeight}px)`
  }
  
  return (
    <div 
      ref={layoutRef}
      className="viewer-layout enhanced" 
      style={{ 
        height: `calc(100svh - ${navHeight + footerHeight}px)`,
        minHeight: `calc(100vh - ${navHeight + footerHeight}px)`, // Fallback
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Header */}
      {header && (
        <div ref={headerRef} className="viewer-header-wrapper">
          {header}
        </div>
      )}
      
      {/* Toolbar - Now properly integrated with layout */}
      {toolbar && (
        <div className="viewer-toolbar-wrapper">
          {toolbar}
        </div>
      )}
      
      {/* Content - Expands to fill available space */}
      <div 
        className="viewer-content"
        style={{
          ...contentHeightStyle,
          overflow: 'hidden',
          position: 'relative',
          flex: 1,
          transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {content}
      </div>
      
      {/* Controls */}
      {controls && (
        <div ref={controlsRef} className="viewer-controls-wrapper">
          {controls}
        </div>
      )}
    </div>
  )
}
```

### Phase 3: Update ArrangementViewerPage Integration

#### 3.1 Unified Toolbar Implementation

```typescript
// src/features/arrangements/pages/ArrangementViewerPage.tsx

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
// ... other imports
import { CollapsibleToolbar } from '@features/responsive/components/CollapsibleToolbar'
import { useViewport } from '@features/responsive/hooks/useViewport'

export function ArrangementViewerPage() {
  const { slug } = useParams<{ slug: string }>()
  const { arrangement, loading, error } = useArrangementViewer(slug!)
  const { isStageMode, toggleStageMode } = useStageMode()
  const { handlePrint, printRef } = usePrint()
  const { fontSize, setFontSize } = useChordSheetSettings()
  const viewport = useViewport()
  
  // Track toolbar height for layout calculations
  const [toolbarHeight, setToolbarHeight] = useState(0)
  
  // Handle toolbar visibility changes
  const handleToolbarVisibilityChange = useCallback((visible: boolean, height: number) => {
    setToolbarHeight(visible ? height : 0)
  }, [])
  
  // ... existing code for transposition, keyboard shortcuts, etc.
  
  // Determine auto-hide behavior based on device and stage mode
  const toolbarAutoHide = useMemo(() => {
    if (isStageMode) return true // Always auto-hide in stage mode
    return viewport.isMobile // Auto-hide on mobile by default
  }, [isStageMode, viewport.isMobile])
  
  // Floating actions configuration
  const floatingActions = useMemo(() => {
    const actions = []
    if (transpositionState) actions.push('transpose')
    if (!isStageMode) actions.push('stage')
    actions.push('print')
    return actions
  }, [transpositionState, isStageMode])
  
  // ... loading and error states
  
  return (
    <ViewerLayout
      header={!isStageMode && <ViewerHeader arrangement={arrangement} />}
      toolbar={
        !isStageMode && (
          <CollapsibleToolbar
            // Core configuration
            autoHide={toolbarAutoHide}
            autoHideDelay={3000}
            defaultVisible={!viewport.isMobile}
            
            // Device-specific settings
            autoHideOnMobile={true}
            autoHideOnTablet={false}
            autoHideOnDesktop={false}
            
            // Scroll behavior
            showOnScrollUp={true}
            hideOnScrollDown={true}
            scrollThreshold={100}
            
            // Activity detection
            detectMouse={!viewport.isMobile}
            detectTouch={viewport.isMobile}
            detectKeyboard={false}
            
            // FAB configuration
            showFloatingActions={true}
            floatingActions={floatingActions}
            
            // Callbacks
            onVisibilityChange={handleToolbarVisibilityChange}
            
            // Persistence
            persistKey={`toolbar-${arrangement?.id || 'default'}`}
            enablePersistence={true}
            
            // Manual control
            showToggleButton={true}
            toggleButtonPosition="right"
          >
            <ViewerToolbar
              onPrint={handlePrint}
              onToggleStageMode={toggleStageMode}
              isStageMode={isStageMode}
              transposition={transpositionState}
            />
          </CollapsibleToolbar>
        )
      }
      content={
        <div ref={printRef} style={{ height: '100%' }}>
          <ChordSheetViewer 
            chordProText={arrangement.chordProText}
            isStageMode={isStageMode}
            transposition={transpositionState.semitones}
          />
        </div>
      }
      controls={
        isStageMode ? (
          <ViewerControls
            transposition={transpositionState}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            isMinimalMode={true}
            onToggleMinimalMode={toggleStageMode}
          />
        ) : null
      }
      // Pass toolbar height to layout
      toolbarHeight={toolbarHeight}
    />
  )
}
```

### Phase 4: Update CSS for Enhanced Styling

#### 4.1 Enhanced CollapsibleToolbar Styles

```css
/* src/features/responsive/components/CollapsibleToolbar/styles.css */

/* Toolbar Toggle Button */
.toolbar-toggle {
  position: fixed;
  top: 8px;
  z-index: 101; /* Above toolbar */
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.7;
  transition: all 200ms ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-toggle.left {
  left: 8px;
}

.toolbar-toggle.right {
  right: 8px;
}

.toolbar-toggle:hover {
  opacity: 1;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.toolbar-toggle:active {
  transform: scale(0.95);
}

.toolbar-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Enhanced toolbar animations */
.collapsible-toolbar {
  /* Smooth height transitions */
  overflow: hidden;
  will-change: transform, height;
}

.collapsible-toolbar.animating {
  pointer-events: none; /* Prevent interaction during animation */
}

/* Desktop-specific styles */
@media (min-width: 1024px) {
  .collapsible-toolbar:not(.auto-hide) {
    position: relative !important;
    transform: none !important;
    transition: none !important;
  }
  
  .toolbar-toggle {
    top: 64px; /* Below nav header */
  }
}

/* Tablet adjustments */
@media (min-width: 768px) and (max-width: 1023px) {
  .collapsible-toolbar {
    /* Slower transitions on tablet */
    transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .collapsible-toolbar {
    /* Faster transitions on mobile */
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .toolbar-toggle {
    /* Smaller on mobile */
    width: 28px;
    height: 28px;
    top: 60px; /* Below mobile nav */
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .collapsible-toolbar,
  .toolbar-toggle {
    transition: none !important;
    animation: none !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .toolbar-toggle {
    border-width: 2px;
    font-weight: bold;
  }
}

/* Safe area support for notched devices */
@supports (padding-top: env(safe-area-inset-top)) {
  .collapsible-toolbar {
    padding-top: env(safe-area-inset-top);
  }
  
  .toolbar-toggle {
    top: calc(8px + env(safe-area-inset-top));
  }
}
```

#### 4.2 ViewerLayout Enhanced Styles

```css
/* src/features/arrangements/styles/viewer-layout.css */

/* Enhanced viewer layout with dynamic height support */
.viewer-layout.enhanced {
  /* Use modern viewport units with fallbacks */
  height: 100vh; /* Fallback */
  height: 100svh; /* Stable viewport height */
  
  /* Prevent layout shifts */
  contain: layout style paint;
}

/* Toolbar wrapper adjustments for collapsible behavior */
.viewer-toolbar-wrapper {
  /* Remove fixed height to allow dynamic sizing */
  height: auto;
  
  /* Smooth transitions for height changes */
  transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Content area with smooth transitions */
.viewer-content {
  /* Smooth height transitions when toolbar shows/hides */
  transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Prevent content jump */
  transform: translateZ(0); /* Force GPU layer */
  backface-visibility: hidden;
}

/* Prevent layout shift during toolbar animation */
.viewer-layout.toolbar-animating .viewer-content {
  overflow: hidden;
}

/* Mobile-specific layout adjustments */
@media (max-width: 767px) {
  .viewer-layout.enhanced {
    /* Account for mobile browser UI */
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height */
    min-height: 100svh; /* Ensure minimum height */
  }
}

/* Safe area padding */
@supports (padding: env(safe-area-inset-top)) {
  .viewer-layout.enhanced {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

## Validation Gates

### Level 1: Type Checking and Linting
```bash
# TypeScript type checking
npx tsc --noEmit

# ESLint with auto-fix
npm run lint -- --fix

# Expected: No errors, warnings acceptable
```

### Level 2: Unit Tests
```bash
# Run tests for responsive features
npm test -- src/features/responsive

# Run tests for arrangements
npm test -- src/features/arrangements

# Test coverage check
npm run test:coverage -- --coverage.include='src/features/responsive/**' --coverage.include='src/features/arrangements/**'

# Expected: >80% coverage for modified files
```

### Level 3: Build Validation
```bash
# Development build
npm run build

# Check bundle size impact
npm run analyze

# Expected: <10KB increase in bundle size
```

### Level 4: Visual Regression Testing
```bash
# Start dev server
npm run dev

# Manual testing checklist:
# Desktop (1920x1080):
# [ ] Toolbar visible by default
# [ ] Manual toggle works
# [ ] No auto-hide on desktop
# [ ] Content fills available space

# Tablet (768x1024):
# [ ] Toolbar visible by default
# [ ] Manual toggle works
# [ ] Optional auto-hide setting
# [ ] Smooth transitions

# Mobile (375x812):
# [ ] Toolbar auto-hides after 3s
# [ ] Shows on scroll up
# [ ] Hides on scroll down
# [ ] FAB appears when hidden
# [ ] Touch targets 44px minimum
```

### Level 5: Performance Testing
```bash
# Lighthouse audit on localhost
npx lighthouse http://localhost:5173/arrangements/test-song --view

# Expected metrics:
# - Performance: >90
# - Accessibility: >95
# - Best Practices: >90
# - No layout shift from toolbar

# Animation performance:
# [ ] 60fps during toolbar transitions
# [ ] No jank during scroll
# [ ] Smooth FAB animations
```

### Level 6: Cross-Browser Testing
```bash
# Test on:
# [ ] Chrome 108+ (Windows/Mac/Linux)
# [ ] Firefox 101+ (Windows/Mac/Linux)
# [ ] Safari 15.4+ (Mac/iOS)
# [ ] Edge 108+ (Windows)
# [ ] Chrome Mobile (Android)
# [ ] Safari Mobile (iOS)

# Specific tests:
# [ ] SVH units work or fallback gracefully
# [ ] Safe area handling on iPhone
# [ ] Touch gestures work on mobile
# [ ] Keyboard shortcuts work on desktop
```

### Level 7: Accessibility Testing
```bash
# Automated accessibility scan
npm run test -- --coverage=false --testNamePattern="accessibility"

# Manual accessibility checklist:
# [ ] Keyboard navigation (Tab through controls)
# [ ] Screen reader announces toolbar state
# [ ] Focus visible on all interactive elements
# [ ] Reduced motion respected
# [ ] High contrast mode supported
# [ ] ARIA labels present and accurate
```

### Level 8: E2E Testing (if configured)
```bash
# If Playwright/Cypress is set up:
npm run test:e2e -- --spec="**/toolbar-collapse.spec.ts"

# Test scenarios:
# [ ] Auto-hide after inactivity
# [ ] Show on scroll up
# [ ] Hide on scroll down
# [ ] Manual toggle persistence
# [ ] FAB interaction
# [ ] Height calculation accuracy
```

## Implementation Tasks Checklist

### Phase 1: Core Infrastructure ✅
- [ ] Enhance CollapsibleToolbar component with universal support
- [ ] Create useActivityDetection hook
- [ ] Create ToolbarToggle component
- [ ] Update CollapsibleToolbar styles
- [ ] Add keyboard shortcut support (T key)

### Phase 2: Layout Integration ✅
- [ ] Update ViewerLayout with dynamic height calculation
- [ ] Implement SVH units with fallbacks
- [ ] Add ResizeObserver for dynamic measurements
- [ ] Handle safe areas for notched devices

### Phase 3: Page Integration ✅
- [ ] Update ArrangementViewerPage to use enhanced CollapsibleToolbar
- [ ] Remove mobile-only conditional logic
- [ ] Implement toolbar height tracking
- [ ] Configure device-specific auto-hide behavior

### Phase 4: Polish & Optimization ✅
- [ ] Add smooth transitions without content jump
- [ ] Implement will-change for performance
- [ ] Add loading states during transitions
- [ ] Optimize bundle size

### Phase 5: Testing & Documentation ✅
- [ ] Run all validation gates
- [ ] Fix any issues found
- [ ] Update component documentation
- [ ] Add usage examples

## Gotchas and Important Notes

### CSS Viewport Units
- **Always provide fallbacks**: Not all browsers support SVH/DVH yet
- **Use SVH for stability**: Prevents content jumps from browser UI changes
- **Test on real devices**: Simulators don't always show viewport issues

### Performance Considerations
- **Debounce scroll events**: Use 100-150ms debounce to prevent excessive triggers
- **Use transform instead of height**: Better performance for animations
- **Implement will-change carefully**: Can increase memory usage

### Accessibility Requirements
- **Maintain focus**: Don't lose focus when toolbar hides
- **Announce changes**: Use ARIA live regions for state changes
- **Keyboard support**: Ensure all functionality available via keyboard

### Browser Quirks
- **iOS Safari**: Address bar behavior affects viewport
- **Android Chrome**: Pull-to-refresh can interfere with scroll detection
- **Firefox**: May need vendor prefixes for some CSS properties

### State Management
- **Avoid prop drilling**: Use context or services for shared state
- **Persist preferences**: Use localStorage with proper error handling
- **Handle edge cases**: What if localStorage is full or disabled?

## Success Criteria

### Functional Requirements ✅
- Toolbar auto-hides on all devices with configurable behavior
- Manual toggle available and persistent
- No content jumping during transitions
- FAB provides quick access to hidden controls
- Smooth 60fps animations

### Performance Requirements ✅
- Bundle size increase <10KB
- 60fps during all animations
- No increase in initial load time
- Memory usage stable (no leaks)

### Accessibility Requirements ✅
- WCAG AA compliant
- Full keyboard navigation
- Screen reader compatible
- Reduced motion support

### Cross-Platform Requirements ✅
- Works on all modern browsers
- Responsive across all device sizes
- Touch and mouse input supported
- Safe area handling for notched devices

## Confidence Score: 9/10

This PRP provides comprehensive implementation guidance with:
- Complete code examples following existing patterns
- Detailed integration instructions
- Multiple validation gates
- Clear gotchas and solutions
- References to external documentation
- Follows vertical slice architecture

The implementation should succeed in one pass with minor adjustments for edge cases.

## References

### Internal Code References
- Current CollapsibleToolbar: `src/features/responsive/components/CollapsibleToolbar/`
- ViewerLayout: `src/features/arrangements/components/ViewerLayout.tsx`
- ArrangementViewerPage: `src/features/arrangements/pages/ArrangementViewerPage.tsx`
- Responsive hooks: `src/features/responsive/hooks/`

### External Documentation
- Material Design 3 Toolbars: https://m3.material.io/components/app-bars/guidelines
- CSS Viewport Units: https://web.dev/blog/viewport-units
- React 19 Performance: https://react.dev/blog/2024/12/05/react-19
- MDN ResizeObserver: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
- ARIA Practices: https://www.w3.org/WAI/ARIA/apg/patterns/

### Related PRPs
- Mobile Responsive Implementation: `PRPs/mobile-responsive-implementation.md`
- Fix Toolbar Coverage PRD: `PRPs/fix-toolbar-coverage-prd.md`