/**
 * Type definitions for the responsive feature slice
 */

// Enhanced viewport data with modern viewport units support
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

// Navigation state management
export interface ResponsiveNavState {
  isMenuOpen: boolean
  isMenuAnimating: boolean
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop'
}

export interface ResponsiveNavActions {
  toggleMenu: () => void
  openMenu: () => void
  closeMenu: () => void
  setAnimating: (animating: boolean) => void
}

export interface ResponsiveNavReturn extends ResponsiveNavState, ResponsiveNavActions {}

// Scroll detection
export interface ScrollDirectionData {
  scrollDirection: 'up' | 'down' | null
  isScrolling: boolean
  scrollY: number
  previousScrollY: number
}

// Touch gestures
export interface TouchGestureData {
  isSwipeLeft: boolean
  isSwipeRight: boolean
  isSwipeUp: boolean
  isSwipeDown: boolean
  touchStartX: number
  touchStartY: number
  touchEndX: number
  touchEndY: number
}

export interface SwipeGestureOptions {
  threshold?: number
  velocity?: number
  preventScrollOnTouch?: boolean
}

// Toolbar visibility
export interface ToolbarVisibilityState {
  isVisible: boolean
  isUserHidden: boolean
  isPermanentlyHidden: boolean
  autoHideEnabled: boolean
}

export interface ToolbarVisibilityActions {
  show: () => void
  hide: () => void
  toggle: () => void
  setAutoHide: (enabled: boolean) => void
  setPermanentlyHidden: (hidden: boolean) => void
}

export interface ToolbarVisibilityReturn extends ToolbarVisibilityState, ToolbarVisibilityActions {}

// Navigation items
export interface NavItem {
  to: string
  label: string
  icon?: React.ComponentType<{ size?: number }>
  isExternal?: boolean
}

// Mobile navigation component props
export interface MobileNavigationProps {
  items: NavItem[]
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  className?: string
}

export interface HamburgerButtonProps {
  isOpen: boolean
  onClick: () => void
  className?: string
  size?: number
}

export interface NavDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: NavItem[]
  className?: string
}

export interface NavOverlayProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

// Collapsible toolbar props
export interface CollapsibleToolbarProps {
  children: React.ReactNode
  autoHide?: boolean
  showFloatingActions?: boolean
  floatingActions?: string[]
  className?: string
}

export interface FloatingActionsProps {
  actions: string[]
  onShow: () => void
  onActionClick?: (action: string) => void
  className?: string
}

// Responsive layout props
export interface ResponsiveLayoutProps {
  children: React.ReactNode
  className?: string
  enableSafeArea?: boolean
  enableViewportUnits?: boolean
}

// Breakpoints
export interface Breakpoints {
  mobile: number
  tablet: number
  desktop: number
  large: number
}

export interface BreakpointQueries {
  mobile: string
  tablet: string
  desktop: string
  large: string
  mobileOnly: string
  tabletOnly: string
  desktopOnly: string
  tabletAndUp: string
  mobileAndTablet: string
}

// Preferences
export interface MobilePreferences {
  preferReducedMotion: boolean
  autoHideToolbar: boolean
  enableSwipeGestures: boolean
  hapticFeedback: boolean
  menuAnimationDuration: number
}

// Service interfaces
export interface ViewportService {
  getCurrentViewport: () => ViewportData
  subscribe: (callback: (viewport: ViewportData) => void) => () => void
  calculateViewportUnits: () => { dvh: number; svh: number; lvh: number }
  isTouch: () => boolean
}

export interface PreferenceService {
  getPreferences: () => MobilePreferences
  setPreference: <K extends keyof MobilePreferences>(
    key: K, 
    value: MobilePreferences[K]
  ) => void
  resetPreferences: () => void
  subscribe: (callback: (preferences: MobilePreferences) => void) => () => void
}

// Focus trap
export interface FocusTrapOptions {
  autoFocus?: boolean
  restoreFocus?: boolean
  allowOutsideClick?: boolean
  escapeDeactivates?: boolean
}

export interface FocusTrapReturn {
  activate: () => void
  deactivate: () => void
  isActive: boolean
}

// Utility types
export type DebounceFunction = <T extends unknown[]>(
  func: (...args: T) => void,
  delay: number
) => (...args: T) => void

export type ThrottleFunction = <T extends unknown[]>(
  func: (...args: T) => void,
  delay: number
) => (...args: T) => void