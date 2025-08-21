/**
 * Responsive feature slice - Main exports
 * 
 * This feature provides comprehensive mobile-responsive functionality including:
 * - Mobile navigation with hamburger menu and drawer
 * - Auto-hiding toolbar with floating actions  
 * - Enhanced viewport detection with modern units
 * - Touch gesture support
 * - Responsive layout utilities
 * - Preference management
 */

// ============================================
// Component Exports
// ============================================

// Mobile Navigation
export { 
  MobileNavigation,
  HamburgerButton,
  NavDrawer,
  NavOverlay
} from './components/MobileNavigation'

// Collapsible Toolbar
export {
  CollapsibleToolbar,
  FloatingActions
} from './components/CollapsibleToolbar'

// Responsive Layout
export { ResponsiveLayout } from './components/ResponsiveLayout'

// ============================================
// Hook Exports
// ============================================

// Viewport hooks
export {
  useViewport,
  useViewportChange,
  useViewportMatch,
  useDeviceViewport,
  useSafeArea,
  usePrefersReducedMotion,
  useIsTouchDevice
} from './hooks/useViewport'

// Navigation hooks
export {
  useResponsiveNav,
  useNavItemState,
  useNavAnimations,
  useNavKeyboardHandling,
  useNavPersistence
} from './hooks/useResponsiveNav'

// Scroll hooks
export {
  useScrollDirection,
  useScrollVisibility,
  useScrollAnimation,
  useScrollToElement,
  useSmoothScroll
} from './hooks/useScrollDirection'

// Touch gesture hooks
export {
  useTouchGestures,
  useSwipeNavigation,
  useLongPress,
  usePinchZoom,
  usePullToRefresh
} from './hooks/useTouchGestures'

// Toolbar hooks
export {
  useToolbarVisibility,
  useFABVisibility,
  useSmartToolbar,
  useToolbarAnimation
} from './hooks/useToolbarVisibility'

// ============================================
// Service Exports
// ============================================

export {
  viewportService,
  useViewportService,
  viewportQueries,
  breakpointMatchers
} from './services/viewportService'

export {
  preferenceService,
  usePreferences,
  usePreference,
  preferenceValidators,
  preferencePresets,
  applyPreferencePreset,
  PREFERENCE_KEYS
} from './services/preferenceService'

// ============================================
// Utility Exports
// ============================================

export {
  breakpoints,
  breakpointQueries,
  getDeviceType,
  matchesBreakpoint,
  getMediaQuery,
  mediaQueryMatches,
  createMediaQueryListener,
  isTouchDevice,
  prefersReducedMotion,
  hasSafeArea,
  getSafeAreaInsets
} from './utils/breakpoints'

export {
  debounce,
  throttle,
  rafThrottle,
  advancedDebounce,
  once
} from './utils/debounce'

export {
  createFocusTrap,
  useFocusTrap,
  FocusTrap
} from './utils/focusTrap'

// ============================================
// Type Exports
// ============================================

export type * from './types'

// ============================================
// Constants and Presets
// ============================================

// Common breakpoint values
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440
} as const

// Common viewport queries
export const VIEWPORT_QUERIES = {
  MOBILE: '(max-width: 767px)',
  TABLET: '(min-width: 768px) and (max-width: 1023px)',
  DESKTOP: '(min-width: 1024px)',
  TOUCH: '(hover: none) and (pointer: coarse)',
  NO_TOUCH: '(hover: hover) and (pointer: fine)',
  REDUCED_MOTION: '(prefers-reduced-motion: reduce)',
  HIGH_CONTRAST: '(prefers-contrast: high)'
} as const

// Navigation item presets
export const NAV_ITEMS = {
  DEFAULT: [
    { to: '/', label: 'Home' },
    { to: '/songs', label: 'Songs' },
    { to: '/search', label: 'Search' },
    { to: '/setlists', label: 'Setlists' }
  ],
  MINIMAL: [
    { to: '/', label: 'Home' },
    { to: '/songs', label: 'Songs' }
  ]
} as const

// Floating action presets
export const FAB_ACTIONS = {
  DEFAULT: ['transpose', 'stage'],
  EDITOR: ['transpose', 'stage', 'edit'],
  VIEWER: ['transpose', 'stage'],
  MINIMAL: []
} as const

// Animation duration presets
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  REDUCED_MOTION: 0
} as const

// ============================================
// Feature Configuration
// ============================================

export interface ResponsiveConfig {
  enableMobileNav: boolean
  enableAutoHideToolbar: boolean
  enableSwipeGestures: boolean
  enableFloatingActions: boolean
  animationDuration: number
  navItems: readonly { to: string; label: string }[]
  fabActions: readonly string[]
}

export const DEFAULT_RESPONSIVE_CONFIG: ResponsiveConfig = {
  enableMobileNav: true,
  enableAutoHideToolbar: true,
  enableSwipeGestures: true,
  enableFloatingActions: true,
  animationDuration: ANIMATION_DURATIONS.NORMAL,
  navItems: NAV_ITEMS.DEFAULT,
  fabActions: FAB_ACTIONS.DEFAULT
}

// ============================================
// Version Information
// ============================================

export const RESPONSIVE_FEATURE_VERSION = '1.0.0'
export const SUPPORTED_BROWSERS = [
  'Chrome 90+',
  'Firefox 88+', 
  'Safari 14+',
  'Edge 90+'
] as const

// ============================================
// Feature Detection
// ============================================

export const FEATURE_SUPPORT = {
  dvhUnits: typeof CSS !== 'undefined' && CSS.supports('height: 100dvh'),
  visualViewport: typeof window !== 'undefined' && 'visualViewport' in window,
  safeArea: typeof CSS !== 'undefined' && CSS.supports('padding-top: env(safe-area-inset-top)'),
  touchEvents: typeof window !== 'undefined' && 'ontouchstart' in window,
  pointerEvents: typeof window !== 'undefined' && 'onpointerdown' in window,
  matchMedia: typeof window !== 'undefined' && 'matchMedia' in window
} as const