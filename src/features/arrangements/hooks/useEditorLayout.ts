import { useCallback, useEffect, useState } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { useResponsiveLayout } from './useResponsiveLayout'

/**
 * Hook for managing editor layout and preview toggle with persistence
 */
export function useEditorLayout(defaultShowPreview = true) {
  const [showPreview, setShowPreview] = useLocalStorage('chord-editor-preview', defaultShowPreview)
  const [splitRatio, setSplitRatio] = useLocalStorage('chord-editor-split', 0.5)
  const { isMobile } = useResponsiveLayout()
  
  // On mobile, we use a different approach (tabs or single view)
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor')
  
  const togglePreview = useCallback(() => {
    if (isMobile) {
      // On mobile, toggle between editor and preview views
      setMobileView(prev => prev === 'editor' ? 'preview' : 'editor')
    } else {
      // On desktop, toggle the preview pane visibility
      setShowPreview(prev => !prev)
    }
  }, [isMobile, setShowPreview])
  
  // Adjust split ratio with bounds checking
  const adjustSplitRatio = useCallback((newRatio: number) => {
    // Ensure ratio stays between 0.2 and 0.8 for usability
    const boundedRatio = Math.max(0.2, Math.min(0.8, newRatio))
    setSplitRatio(boundedRatio)
  }, [setSplitRatio])
  
  // Mobile adjustments
  const effectiveSplitRatio = isMobile ? 1 : splitRatio
  const effectiveShowPreview = isMobile ? false : showPreview // Mobile uses different view mode
  
  // Reset mobile view when switching between mobile and desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileView('editor')
    }
  }, [isMobile])
  
  return {
    showPreview: effectiveShowPreview,
    togglePreview,
    splitRatio: effectiveSplitRatio,
    setSplitRatio: adjustSplitRatio,
    isMobile,
    mobileView,
    setMobileView
  }
}