import { useRef, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface ViewerLayoutProps {
  header?: ReactNode
  toolbar?: ReactNode
  content: ReactNode
  controls?: ReactNode
  onToolbarHeightChange?: (height: number) => void
}

export function ViewerLayout({ 
  header, 
  toolbar, 
  content, 
  controls,
  onToolbarHeightChange 
}: ViewerLayoutProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  
  const [headerHeight, setHeaderHeight] = useState(0)
  const [toolbarHeight, setToolbarHeight] = useState(0)
  const [controlsHeight, setControlsHeight] = useState(0)
  const [viewportHeight, setViewportHeight] = useState('100vh')
  
  // Detect viewport unit support and set appropriate unit
  useEffect(() => {
    const detectViewportUnit = () => {
      // Test for small viewport height (svh) support
      const testEl = document.createElement('div')
      testEl.style.height = '100svh'
      document.body.appendChild(testEl)
      const supportsSvh = testEl.style.height === '100svh'
      document.body.removeChild(testEl)
      
      if (supportsSvh) {
        // Use svh for mobile browsers with dynamic viewport
        setViewportHeight('100svh')
      } else {
        // Test for dynamic viewport height (dvh) support
        testEl.style.height = '100dvh'
        document.body.appendChild(testEl)
        const supportsDvh = testEl.style.height === '100dvh'
        document.body.removeChild(testEl)
        
        if (supportsDvh) {
          setViewportHeight('100dvh')
        } else {
          // Fallback to standard vh
          setViewportHeight('100vh')
        }
      }
    }
    
    detectViewportUnit()
  }, [])
  
  // Use ResizeObserver to track height changes
  useEffect(() => {
    const updateHeights = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
      if (toolbarRef.current) {
        const height = toolbarRef.current.offsetHeight
        setToolbarHeight(height)
        if (onToolbarHeightChange) {
          onToolbarHeightChange(height)
        }
      }
      if (controlsRef.current) {
        setControlsHeight(controlsRef.current.offsetHeight)
      }
    }
    
    updateHeights()
    
    const resizeObserver = new ResizeObserver(updateHeights)
    
    if (headerRef.current) resizeObserver.observe(headerRef.current)
    if (toolbarRef.current) resizeObserver.observe(toolbarRef.current)
    if (controlsRef.current) resizeObserver.observe(controlsRef.current)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [header, toolbar, controls, onToolbarHeightChange])
  
  // Account for footer/statusbar (typically 60px) and dynamic component heights
  // Use CSS custom properties for better performance
  const contentHeight = `calc(${viewportHeight} - ${headerHeight + toolbarHeight + controlsHeight + 60}px)`
  
  // Set CSS custom properties for modern viewport units
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--viewport-height', viewportHeight)
    root.style.setProperty('--header-height', `${headerHeight}px`)
    root.style.setProperty('--toolbar-height', `${toolbarHeight}px`)
    root.style.setProperty('--controls-height', `${controlsHeight}px`)
  }, [viewportHeight, headerHeight, toolbarHeight, controlsHeight])
  
  return (
    <>
      <div className="viewer-layout" style={{ 
        maxHeight: `calc(${viewportHeight} - 60px)`,
        height: `calc(${viewportHeight} - 60px)`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {header && (
          <div ref={headerRef} className="viewer-header-wrapper">
            {header}
          </div>
        )}
        {toolbar && (
          <div ref={toolbarRef} className="viewer-toolbar-wrapper">
            {toolbar}
          </div>
        )}
        <div 
          className="viewer-content"
          style={{ 
            height: contentHeight,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {content}
        </div>
        {controls && (
          <div ref={controlsRef} className="viewer-controls-wrapper">
            {controls}
          </div>
        )}
      </div>
      
      {/* Inject CSS for viewport unit fallbacks and safe areas */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Viewport unit fallbacks */
          @supports not (height: 100svh) {
            @supports (height: 100dvh) {
              .viewer-layout {
                height: calc(100dvh - 60px) !important;
                max-height: calc(100dvh - 60px) !important;
              }
            }
          }
          
          @supports not (height: 100dvh) {
            .viewer-layout {
              height: calc(100vh - 60px) !important;
              max-height: calc(100vh - 60px) !important;
            }
          }
          
          /* Safe area support for notched devices */
          .viewer-layout {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
          }
          
          /* Use CSS custom properties for dynamic calculations */
          .viewer-content {
            height: calc(var(--viewport-height, 100vh) - 
                        var(--header-height, 0px) - 
                        var(--toolbar-height, 0px) - 
                        var(--controls-height, 0px) - 60px);
          }
          
          /* Ensure smooth transitions when heights change */
          .viewer-content {
            transition: height 0.3s ease;
          }
          
          @media (prefers-reduced-motion: reduce) {
            .viewer-content {
              transition: none;
            }
          }
        `
      }} />
    </>
  )
}