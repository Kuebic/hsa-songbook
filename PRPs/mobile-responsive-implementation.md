# Mobile Responsive Implementation PRP

## Context

This PRP implements comprehensive mobile-responsive design for HSA Songbook based on the PRD in `PRPs/mobile-responsive-prd.md`. The implementation follows the established vertical slice architecture pattern, creating a new `responsive` feature slice while enhancing existing components.

## Research Findings & Critical Context

### Codebase Architecture Analysis
The HSA Songbook uses a **vertical slice architecture** with features organized by business domain in `/src/features/`. Each feature is self-contained with its own components, hooks, services, types, and utilities. Cross-feature dependencies flow through the shared layer (`/src/shared/`).

### Existing Infrastructure to Leverage

#### 1. Responsive Layout Hook (REUSE THIS)
**File:** `/src/features/arrangements/components/ChordProEditor/hooks/useResponsiveLayout.ts`
```typescript
export interface ResponsiveLayout {
  isMobile: boolean     // < 768px
  isTablet: boolean     // 768-1024px  
  isDesktop: boolean    // > 1024px
  isLandscape: boolean
  viewportWidth: number
  viewportHeight: number
  deviceType: 'mobile' | 'tablet' | 'desktop'
}
```

#### 2. Mobile Toggle Pattern (ADAPT THIS)
**File:** `/src/features/arrangements/components/ChordProEditor/components/MobileToggle.tsx`
- State-based visibility toggle
- Responsive hiding with media queries
- ARIA accessibility patterns

#### 3. Animation System (USE THESE)
**Files:** 
- `/src/shared/styles/animations.css` - Slide, fade animations
- `/src/features/arrangements/components/ChordProEditor/styles/animations.css` - Editor animations

#### 4. Theme Variables (EXTEND THESE)
**File:** `/src/shared/styles/theme-variables.css`
- CSS custom properties for all themes
- Navigation-specific variables already defined

### Critical Issues to Fix

#### 1. Viewport Meta Tag (index.html:7)
**Current:** `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`
**Must Change To:** `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />`

#### 2. Root Overflow Conflicts (globals.css:55-73)
```css
/* PROBLEMATIC - Prevents scrolling */
body { overflow: hidden; }
#root { height: 100vh; overflow: hidden; }
```

#### 3. Layout Component Issues (Layout.tsx:40-46)
- Inline styles causing overflow conflicts
- No mobile navigation pattern
- Fixed header not responsive

### External Best Practices (2025)

#### Modern Viewport Units (Browser Support: 90%+)
- **dvh** - Dynamic viewport height (adjusts with browser UI)
- **svh** - Small viewport height (browser UI visible)
- **lvh** - Large viewport height (browser UI hidden)
Reference: https://web.dev/blog/viewport-units

#### Mobile Navigation Patterns
- Hamburger menu for screens < 768px
- Slide-out drawer with overlay
- Touch targets minimum 44x44px (iOS) / 48x48px (Android)
- Focus trap for accessibility
Reference: https://www.interaction-design.org/literature/article/hamburger-menu-ux

#### React 19 Performance Hooks
- `useDeferredValue` for non-critical UI updates
- `useTransition` for non-blocking state transitions
- `useCallback` and `useMemo` for mobile performance
Reference: https://react.dev/reference/react/hooks

## Implementation Blueprint

### Phase 1: Create Responsive Feature Slice

```
src/features/responsive/
├── components/
│   ├── MobileNavigation/
│   │   ├── index.tsx              # Main mobile nav component
│   │   ├── HamburgerButton.tsx    # Menu toggle button
│   │   ├── NavDrawer.tsx          # Slide-out navigation
│   │   ├── NavOverlay.tsx         # Background overlay
│   │   └── styles.css             # Mobile nav styles
│   ├── CollapsibleToolbar/
│   │   ├── index.tsx              # Auto-hiding toolbar wrapper
│   │   ├── FloatingActions.tsx    # FAB when toolbar hidden
│   │   └── styles.css             # Toolbar animations
│   └── ResponsiveLayout/
│       ├── index.tsx              # Enhanced layout wrapper
│       └── styles.css             # Responsive utilities
├── hooks/
│   ├── useResponsiveNav.ts        # Navigation state management
│   ├── useScrollDirection.ts      # Scroll detection for toolbar
│   ├── useViewport.ts             # Viewport with dvh/svh support
│   ├── useTouchGestures.ts        # Swipe detection
│   └── useToolbarVisibility.ts    # Toolbar auto-hide logic
├── services/
│   ├── viewportService.ts         # Viewport calculations
│   └── preferenceService.ts       # Mobile preferences persistence
├── types/
│   ├── responsive.types.ts        # Type definitions
│   └── index.ts                   # Type exports
├── utils/
│   ├── breakpoints.ts             # Breakpoint definitions
│   ├── debounce.ts                # Performance utilities
│   └── focusTrap.ts               # Accessibility utilities
└── index.ts                        # Public API exports
```

### Phase 2: Implementation Steps

#### Step 1: Fix Core CSS Issues
```typescript
// Task: Fix viewport meta tag
// File: index.html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />

// Task: Fix scrolling issues
// File: src/shared/styles/globals.css
body {
  margin: 0;
  min-width: 320px;
  overflow-x: hidden; /* Prevent horizontal scroll only */
  overflow-y: auto;   /* Allow vertical scroll */
  overscroll-behavior: none; /* Prevent pull-to-refresh */
}

#root {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height */
  overflow-x: hidden;
  overflow-y: auto;
}

#root.editor-page {
  height: 100vh;
  height: 100dvh;
  overflow: hidden; /* Only for editor pages */
}

/* Safe area support for notched devices */
:root {
  --safe-area-top: env(safe-area-inset-top);
  --safe-area-bottom: env(safe-area-inset-bottom);
  --safe-area-left: env(safe-area-inset-left);
  --safe-area-right: env(safe-area-inset-right);
}
```

#### Step 2: Create useViewport Hook
```typescript
// File: src/features/responsive/hooks/useViewport.ts
import { useState, useEffect, useCallback } from 'react'
import { debounce } from '../utils/debounce'

export interface ViewportData {
  width: number
  height: number
  dvh: number  // Dynamic viewport height
  svh: number  // Small viewport height
  lvh: number  // Large viewport height
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  orientation: 'portrait' | 'landscape'
  hasNotch: boolean
}

export function useViewport(): ViewportData {
  const [viewport, setViewport] = useState<ViewportData>(calculateViewport())

  function calculateViewport(): ViewportData {
    const width = window.innerWidth
    const height = window.innerHeight
    
    // Set CSS custom properties for viewport units fallback
    const vh = height * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
    
    return {
      width,
      height,
      dvh: height, // Will use CSS dvh when available
      svh: height, // Will use CSS svh when available
      lvh: height, // Will use CSS lvh when available
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      orientation: width > height ? 'landscape' : 'portrait',
      hasNotch: CSS.supports('padding-top: env(safe-area-inset-top)')
    }
  }

  const handleResize = useCallback(
    debounce(() => {
      setViewport(calculateViewport())
    }, 100),
    []
  )

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    // Handle iOS viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
      }
    }
  }, [handleResize])

  return viewport
}
```

#### Step 3: Create Mobile Navigation Components
```typescript
// File: src/features/responsive/components/MobileNavigation/HamburgerButton.tsx
import { memo } from 'react'
import { Menu, X } from 'lucide-react'
import styles from './styles.css'

interface HamburgerButtonProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

export const HamburgerButton = memo(function HamburgerButton({ 
  isOpen, 
  onClick,
  className 
}: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${styles.hamburger} ${className || ''}`}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation"
    >
      <span className={styles.hamburgerBox}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </span>
    </button>
  )
})

// File: src/features/responsive/components/MobileNavigation/NavDrawer.tsx
import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import styles from './styles.css'

interface NavDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: Array<{ to: string; label: string }>
}

export function NavDrawer({ isOpen, onClose, items }: NavDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(drawerRef, isOpen)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <>
      {/* Overlay */}
      <div 
        className={styles.overlay}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <nav
        ref={drawerRef}
        id="mobile-navigation"
        className={`${styles.drawer} ${isOpen ? styles.open : ''}`}
        aria-label="Mobile navigation"
      >
        <div className={styles.drawerHeader}>
          <h2>🎵 HSA Songbook</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close navigation"
          >
            <X size={24} />
          </button>
        </div>
        
        <ul className={styles.navList}>
          {items.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => 
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
                onClick={onClose}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>,
    document.body
  )
}
```

#### Step 4: Create Collapsible Toolbar
```typescript
// File: src/features/responsive/hooks/useScrollDirection.ts
import { useState, useEffect, useCallback, useRef } from 'react'

export function useScrollDirection(threshold = 10) {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  const updateScrollDirection = useCallback(() => {
    const scrollY = window.scrollY

    if (Math.abs(scrollY - lastScrollY.current) < threshold) {
      ticking.current = false
      return
    }

    setScrollDirection(scrollY > lastScrollY.current ? 'down' : 'up')
    lastScrollY.current = scrollY > 0 ? scrollY : 0
    ticking.current = false
    setIsScrolling(true)
  }, [threshold])

  const onScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(updateScrollDirection)
      ticking.current = true
    }
  }, [updateScrollDirection])

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [onScroll])

  useEffect(() => {
    if (isScrolling) {
      const timer = setTimeout(() => setIsScrolling(false), 150)
      return () => clearTimeout(timer)
    }
  }, [isScrolling])

  return { scrollDirection, isScrolling }
}

// File: src/features/responsive/components/CollapsibleToolbar/index.tsx
import { useState, useEffect, ReactNode } from 'react'
import { useScrollDirection } from '../../hooks/useScrollDirection'
import { FloatingActions } from './FloatingActions'
import styles from './styles.css'

interface CollapsibleToolbarProps {
  children: ReactNode
  autoHide?: boolean
  showFloatingActions?: boolean
  floatingActions?: string[]
}

export function CollapsibleToolbar({ 
  children, 
  autoHide = true,
  showFloatingActions = true,
  floatingActions = ['transpose', 'stage']
}: CollapsibleToolbarProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [userHidden, setUserHidden] = useState(false)
  const { scrollDirection } = useScrollDirection()

  useEffect(() => {
    if (!autoHide || userHidden) return

    if (scrollDirection === 'down' && window.scrollY > 100) {
      setIsVisible(false)
    } else if (scrollDirection === 'up') {
      setIsVisible(true)
    }
  }, [scrollDirection, autoHide, userHidden])

  return (
    <>
      <div 
        className={`${styles.toolbarWrapper} ${!isVisible ? styles.hidden : ''}`}
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        {children}
      </div>
      
      {showFloatingActions && !isVisible && (
        <FloatingActions 
          actions={floatingActions}
          onShow={() => {
            setIsVisible(true)
            setUserHidden(false)
          }}
        />
      )}
    </>
  )
}
```

#### Step 5: Enhance Layout Component
```typescript
// File: src/shared/components/Layout.tsx (Modified)
import { ReactNode, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AuthButtons, UserMenu } from '@features/auth'
import { useAuth } from '@features/auth/hooks/useAuth'
import { ErrorBoundary } from '@features/monitoring'
import { AddSongButton } from '@features/songs/components/ui/AddSongButton'
import { ThemeToggle } from './ThemeToggle'
// NEW IMPORTS
import { MobileNavigation } from '@features/responsive/components/MobileNavigation'
import { useViewport } from '@features/responsive/hooks/useViewport'
import { useResponsiveNav } from '@features/responsive/hooks/useResponsiveNav'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { isSignedIn, isLoaded } = useAuth()
  const viewport = useViewport()
  const nav = useResponsiveNav()
  
  const isEditorPage = location.pathname === '/test-editor' || 
                       location.pathname.includes('/arrangements/') ||
                       location.pathname.includes('/edit')

  const navItems = useMemo(() => [
    { to: '/', label: 'Home' },
    { to: '/songs', label: 'Songs' },
    { to: '/search', label: 'Search' },
    { to: '/setlists', label: 'Setlists' }
  ], [])

  return (
    <div className={`layout-container ${isEditorPage ? 'editor-page' : ''}`}>
      <ErrorBoundary level="section" isolate>
        <nav className="nav-header">
          <div className="nav-container">
            {/* Mobile Navigation */}
            {viewport.isMobile && (
              <MobileNavigation 
                items={navItems}
                isOpen={nav.isMenuOpen}
                onToggle={nav.toggleMenu}
                onClose={nav.closeMenu}
              />
            )}

            {/* Desktop Navigation */}
            {!viewport.isMobile && (
              <>
                <div className="nav-brand">
                  <h1>🎵 HSA Songbook</h1>
                </div>
                
                <div className="nav-links">
                  {navItems.map(item => (
                    <NavLink 
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => 
                        `nav-link ${isActive ? 'active' : ''}`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </>
            )}
            
            <div className="nav-actions">
              <ThemeToggle />
              <AddSongButton compact={viewport.isMobile} />
              {isLoaded && (
                <>
                  {!isSignedIn && <AuthButtons />}
                  {isSignedIn && <UserMenu compact={viewport.isMobile} />}
                </>
              )}
            </div>
          </div>
        </nav>
      </ErrorBoundary>
      
      <main className="main-content">
        <ErrorBoundary level="section">
          {children}
        </ErrorBoundary>
      </main>
      
      {!isEditorPage && (
        <ErrorBoundary level="section" isolate>
          <footer className="footer">
            <div className="footer-content">
              © 2025 HSA Songbook. All rights reserved.
            </div>
          </footer>
        </ErrorBoundary>
      )}
    </div>
  )
}
```

### Phase 3: CSS Implementation

```css
/* File: src/features/responsive/components/MobileNavigation/styles.css */
.hamburger {
  display: none;
  position: relative;
  padding: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--nav-text);
  transition: opacity 0.2s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  min-width: 44px;
  min-height: 44px;
}

@media (max-width: 767px) {
  .hamburger {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.hamburger:active {
  opacity: 0.7;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  animation: fadeIn 0.3s ease-out;
}

.drawer {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  height: 100dvh;
  width: 280px;
  max-width: 85vw;
  background: var(--color-background);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  transform: translateX(-100%);
  transition: transform 0.3s ease-out;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: env(safe-area-inset-bottom);
}

.drawer.open {
  transform: translateX(0);
}

.navList {
  list-style: none;
  padding: 0;
  margin: 0;
}

.navLink {
  display: block;
  padding: 16px 24px;
  color: var(--text-primary);
  text-decoration: none;
  transition: background-color 0.2s;
  font-size: 16px; /* Prevent iOS zoom */
  min-height: 44px;
  display: flex;
  align-items: center;
}

.navLink:active {
  background-color: var(--nav-hover);
}

.navLink.active {
  background-color: var(--nav-hover);
  color: var(--nav-active);
  font-weight: 600;
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  bottom: calc(24px + env(safe-area-inset-bottom));
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 1000;
}

.fab:active {
  transform: scale(0.95);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Responsive Layout Utilities */
@media (max-width: 767px) {
  .layout-container {
    padding-top: 56px; /* Reduced header height on mobile */
  }
  
  .nav-header {
    height: 56px;
    padding: 0 16px;
  }
  
  .nav-brand h1 {
    font-size: 1.25rem;
  }
  
  .hide-mobile {
    display: none !important;
  }
  
  .main-content {
    padding: 16px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .hide-tablet {
    display: none !important;
  }
}

@media (min-width: 1024px) {
  .hide-desktop {
    display: none !important;
  }
}

/* Safe area padding for notched devices */
@supports (padding-top: env(safe-area-inset-top)) {
  .nav-header {
    padding-top: env(safe-area-inset-top);
  }
  
  .drawer {
    padding-top: env(safe-area-inset-top);
  }
}
```

## Validation Gates

### Level 1: Linting & Type Checking
```bash
# Run ESLint
npm run lint

# TypeScript type checking (if separate command exists)
npx tsc --noEmit

# Expected: No errors
```

### Level 2: Unit Tests
```bash
# Run tests for responsive feature
npm test -- src/features/responsive

# Test coverage
npm run test:coverage -- src/features/responsive

# Expected: 80%+ coverage
```

### Level 3: Build Validation
```bash
# Development build
npm run build

# Check bundle size
npm run analyze

# Expected: Successful build, no increase > 50KB
```

### Level 4: Mobile Testing
```bash
# Start dev server
npm run dev

# Manual testing checklist:
# [ ] Hamburger menu appears at < 768px
# [ ] Navigation drawer slides smoothly
# [ ] Homepage scrolls properly on mobile
# [ ] Songs page scrolls without issues
# [ ] Toolbar auto-hides on scroll down
# [ ] Toolbar shows on scroll up
# [ ] FAB appears when toolbar hidden
# [ ] Touch targets are 44px minimum
# [ ] No horizontal scroll on any page
# [ ] Viewport adjusts with browser UI
```

### Level 5: Cross-Browser Testing
```bash
# Test on real devices or BrowserStack
# Devices to test:
# - iPhone 12+ (Safari, Chrome)
# - Android (Chrome, Firefox)
# - iPad (Safari)
# - Desktop (Chrome, Firefox, Safari, Edge)

# Viewport tests:
# [ ] Portrait orientation works
# [ ] Landscape orientation works
# [ ] Rotation doesn't break layout
# [ ] Notched devices show safe areas
```

### Level 6: Performance Testing
```bash
# Lighthouse audit
npx lighthouse http://localhost:5173 --view

# Expected scores:
# - Performance: > 90
# - Accessibility: > 95
# - Best Practices: > 90
# - SEO: > 90

# Core Web Vitals:
# - FCP < 1.5s
# - LCP < 2.5s
# - CLS < 0.1
# - FID < 100ms
```

### Level 7: Accessibility Testing
```bash
# Keyboard navigation test
# [ ] Tab through all interactive elements
# [ ] Focus trap works in mobile menu
# [ ] Escape closes mobile menu
# [ ] Screen reader announces menu state

# ARIA validation
# [ ] All buttons have labels
# [ ] Navigation has proper landmarks
# [ ] Focus visible on all elements
```

## Implementation Tasks

### Priority 1: Core Fixes (Critical)
1. [ ] Fix viewport meta tag in index.html
2. [ ] Fix root overflow issues in globals.css
3. [ ] Add safe area CSS variables
4. [ ] Create responsive feature slice structure

### Priority 2: Mobile Navigation (Critical)
5. [ ] Create useViewport hook with dvh support
6. [ ] Create useResponsiveNav hook
7. [ ] Implement HamburgerButton component
8. [ ] Implement NavDrawer component
9. [ ] Integrate MobileNavigation into Layout
10. [ ] Add focus trap utility
11. [ ] Style mobile navigation with animations

### Priority 3: Collapsible Toolbar (High)
12. [ ] Create useScrollDirection hook
13. [ ] Create useToolbarVisibility hook
14. [ ] Implement CollapsibleToolbar wrapper
15. [ ] Create FloatingActions component
16. [ ] Integrate with ViewerToolbar
17. [ ] Add preference persistence

### Priority 4: Polish & Optimization (Medium)
18. [ ] Add touch gesture support
19. [ ] Implement virtual scrolling for song lists
20. [ ] Add pull-to-refresh
21. [ ] Optimize animations with will-change
22. [ ] Add haptic feedback (where supported)

## Gotchas & Important Notes

### iOS Safari Specific
- Font size must be 16px minimum to prevent zoom on input focus
- Use `-webkit-overflow-scrolling: touch` for momentum scrolling
- Test safe area insets on notched devices (iPhone X+)
- Address bar height changes affect viewport

### Android Chrome
- Pull-to-refresh can interfere with scrolling
- Use `overscroll-behavior: none` to prevent
- Virtual keyboard affects viewport differently than iOS

### Performance
- Use `transform` instead of `left/top` for animations
- Debounce resize events (100ms recommended)
- Use `requestAnimationFrame` for scroll events
- Add `will-change` sparingly (memory intensive)

### Accessibility
- Focus trap is critical for mobile menu
- Ensure 44px minimum touch targets (iOS guideline)
- Test with VoiceOver (iOS) and TalkBack (Android)
- Keyboard navigation must work even on mobile

## Success Criteria

1. **Navigation**: Hamburger menu works on all mobile devices
2. **Scrolling**: All pages scroll properly without overflow
3. **Toolbar**: Auto-hides and shows smoothly
4. **Performance**: Lighthouse mobile score > 90
5. **Accessibility**: WCAG AA compliant
6. **Cross-Browser**: Works on iOS Safari, Chrome, Android
7. **No Breaking Changes**: Desktop experience unchanged

## Confidence Score: 9/10

This PRP provides comprehensive context with:
- Complete vertical slice architecture following existing patterns
- Detailed code examples from actual codebase analysis
- External documentation references for 2025 best practices
- Specific file paths and implementation steps
- Multiple validation gates for quality assurance
- Clear gotchas and platform-specific considerations

The only uncertainty (reducing from 10 to 9) is potential edge cases in specific mobile browsers that may require minor adjustments during implementation.