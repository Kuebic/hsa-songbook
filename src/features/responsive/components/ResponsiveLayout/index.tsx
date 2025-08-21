/**
 * Responsive layout wrapper component
 * Provides responsive utilities and safe area handling
 */

import { useEffect } from 'react'
import { useViewport } from '../../hooks/useViewport'
import type { ResponsiveLayoutProps } from '../../types'

export function ResponsiveLayout({
  children,
  className = '',
  enableSafeArea = true,
  enableViewportUnits = true
}: ResponsiveLayoutProps) {
  const viewport = useViewport()

  // Update CSS custom properties for viewport units
  useEffect(() => {
    if (!enableViewportUnits) return

    const root = document.documentElement
    
    // Set viewport unit fallbacks
    root.style.setProperty('--vh', `${viewport.height * 0.01}px`)
    root.style.setProperty('--vw', `${viewport.width * 0.01}px`)
    root.style.setProperty('--dvh', `${viewport.dvh * 0.01}px`)
    root.style.setProperty('--svh', `${viewport.svh * 0.01}px`)
    root.style.setProperty('--lvh', `${viewport.lvh * 0.01}px`)
    
    // Device type classes
    root.className = root.className
      .replace(/\b(mobile|tablet|desktop)-viewport\b/g, '')
      .trim()
    
    if (viewport.isMobile) {
      root.classList.add('mobile-viewport')
    } else if (viewport.isTablet) {
      root.classList.add('tablet-viewport')  
    } else {
      root.classList.add('desktop-viewport')
    }
    
    // Orientation classes
    root.className = root.className
      .replace(/\b(portrait|landscape)-orientation\b/g, '')
      .trim()
    
    root.classList.add(`${viewport.orientation}-orientation`)
    
    // Touch capability
    if ('ontouchstart' in window) {
      root.classList.add('touch-device')
    } else {
      root.classList.add('no-touch')
    }
  }, [viewport, enableViewportUnits])

  // Safe area classes
  useEffect(() => {
    if (!enableSafeArea) return

    const root = document.documentElement
    
    if (viewport.hasNotch) {
      root.classList.add('has-safe-area')
    } else {
      root.classList.remove('has-safe-area')
    }
  }, [viewport.hasNotch, enableSafeArea])

  const containerStyles: React.CSSProperties = {
    // Base layout
    width: '100%',
    minHeight: enableViewportUnits ? '100dvh' : '100vh',
    position: 'relative',
    
    // Safe area support
    ...(enableSafeArea && viewport.hasNotch && {
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)'
    }),
    
    // Device-specific adjustments
    ...(viewport.isMobile && {
      overflow: 'hidden', // Prevent zoom on iOS
      WebkitOverflowScrolling: 'touch',
      WebkitTapHighlightColor: 'transparent'
    })
  }

  return (
    <div
      className={`responsive-layout ${className}`}
      style={containerStyles}
      data-viewport={viewport.isMobile ? 'mobile' : viewport.isTablet ? 'tablet' : 'desktop'}
      data-orientation={viewport.orientation}
      data-has-notch={viewport.hasNotch}
    >
      {children}
      
      {/* Responsive utilities styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Responsive utility classes */
          .mobile-only { display: block; }
          .tablet-only { display: none; }
          .desktop-only { display: none; }
          .mobile-tablet { display: block; }
          .tablet-desktop { display: none; }
          
          @media (min-width: 768px) and (max-width: 1023px) {
            .mobile-only { display: none; }
            .tablet-only { display: block; }
            .desktop-only { display: none; }
            .mobile-tablet { display: block; }
            .tablet-desktop { display: block; }
          }
          
          @media (min-width: 1024px) {
            .mobile-only { display: none; }
            .tablet-only { display: none; }
            .desktop-only { display: block; }
            .mobile-tablet { display: none; }
            .tablet-desktop { display: block; }
          }
          
          /* Orientation utilities */
          .portrait-only { display: block; }
          .landscape-only { display: none; }
          
          @media (orientation: landscape) {
            .portrait-only { display: none; }
            .landscape-only { display: block; }
          }
          
          /* Touch utilities */
          .touch-only { display: none; }
          .no-touch-only { display: block; }
          
          .touch-device .touch-only { display: block; }
          .touch-device .no-touch-only { display: none; }
          .no-touch .touch-only { display: none; }
          .no-touch .no-touch-only { display: block; }
          
          /* Safe area utilities */
          .safe-area-top {
            padding-top: env(safe-area-inset-top);
          }
          
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
          
          .safe-area-left {
            padding-left: env(safe-area-inset-left);
          }
          
          .safe-area-right {
            padding-right: env(safe-area-inset-right);
          }
          
          .safe-area-all {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
          
          /* Viewport unit utilities */
          .min-h-screen { min-height: 100vh; }
          .min-h-dvh { min-height: 100dvh; }
          .min-h-svh { min-height: 100svh; }
          .min-h-lvh { min-height: 100lvh; }
          
          .h-screen { height: 100vh; }
          .h-dvh { height: 100dvh; }
          .h-svh { height: 100svh; }
          .h-lvh { height: 100lvh; }
          
          /* Reduced motion support */
          @media (prefers-reduced-motion: reduce) {
            .responsive-layout *,
            .responsive-layout *::before,
            .responsive-layout *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }
        `
      }} />
    </div>
  )
}

export default ResponsiveLayout