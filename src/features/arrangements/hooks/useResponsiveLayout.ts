import { useState, useEffect } from 'react'
import { useResponsiveLayout as useBaseResponsiveLayout } from '../components/ChordProEditor/hooks/useResponsiveLayout'

export type LayoutOrientation = 'horizontal' | 'vertical'
export type ViewMode = 'edit' | 'preview' | 'split'

/**
 * Hook for managing editor view modes based on responsive layout
 * Uses the base responsive layout hook for device detection
 */
export function useResponsiveLayout() {
  const baseLayout = useBaseResponsiveLayout()
  const [orientation, setOrientation] = useState<LayoutOrientation>('horizontal')
  const [viewMode, setViewMode] = useState<ViewMode>('split')

  useEffect(() => {
    // Auto-switch to edit mode on mobile, split on desktop
    if (baseLayout.isMobile && viewMode === 'split') {
      setViewMode('edit')
    } else if (baseLayout.isDesktop && (viewMode === 'edit' || viewMode === 'preview')) {
      setViewMode('split')
    }
  }, [baseLayout.isMobile, baseLayout.isDesktop, viewMode])

  const toggleViewMode = () => {
    if (baseLayout.isMobile) {
      setViewMode(prev => prev === 'edit' ? 'preview' : 'edit')
    } else {
      setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')
    }
  }

  return {
    ...baseLayout,
    orientation,
    viewMode,
    toggleViewMode,
    setViewMode
  }
}