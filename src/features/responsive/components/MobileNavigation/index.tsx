/**
 * Main mobile navigation component
 * Combines hamburger button, drawer, and overlay
 */

import { memo } from 'react'
import { useNavAnimations } from '../../hooks/useResponsiveNav'
import { HamburgerButton } from './HamburgerButton'
import { NavDrawer } from './NavDrawer'
import { NavOverlay } from './NavOverlay'
import type { MobileNavigationProps } from '../../types'

export const MobileNavigation = memo(function MobileNavigation({
  items,
  isOpen,
  onToggle,
  onClose,
  className = ''
}: MobileNavigationProps) {
  const { shouldRender } = useNavAnimations(isOpen)

  return (
    <>
      {/* Hamburger Button */}
      <HamburgerButton
        isOpen={isOpen}
        onClick={onToggle}
        className={className}
      />
      
      {/* Navigation Drawer and Overlay */}
      {shouldRender && (
        <>
          <NavOverlay
            isOpen={isOpen}
            onClick={onClose}
          />
          <NavDrawer
            isOpen={isOpen}
            onClose={onClose}
            items={items}
          />
        </>
      )}
    </>
  )
})

export default MobileNavigation

// Export individual components for flexibility
export { HamburgerButton } from './HamburgerButton'
export { NavDrawer } from './NavDrawer'
export { NavOverlay } from './NavOverlay'