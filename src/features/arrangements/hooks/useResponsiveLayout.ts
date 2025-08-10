import { useState, useEffect } from 'react'

export type LayoutOrientation = 'horizontal' | 'vertical'
export type ViewMode = 'edit' | 'preview' | 'split'

export function useResponsiveLayout() {
  const [isMobile, setIsMobile] = useState(false)
  const [orientation, setOrientation] = useState<LayoutOrientation>('horizontal')
  const [viewMode, setViewMode] = useState<ViewMode>('split')

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Auto-switch to edit mode on mobile, split on desktop
      if (mobile && viewMode === 'split') {
        setViewMode('edit')
      } else if (!mobile && (viewMode === 'edit' || viewMode === 'preview')) {
        setViewMode('split')
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [viewMode])

  const toggleViewMode = () => {
    if (isMobile) {
      setViewMode(prev => prev === 'edit' ? 'preview' : 'edit')
    } else {
      setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')
    }
  }

  return {
    isMobile,
    orientation,
    viewMode,
    toggleViewMode,
    setViewMode
  }
}