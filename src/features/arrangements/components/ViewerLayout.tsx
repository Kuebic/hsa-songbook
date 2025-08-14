import { useRef, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface ViewerLayoutProps {
  header?: ReactNode
  toolbar?: ReactNode
  content: ReactNode
  controls?: ReactNode
}

export function ViewerLayout({ header, toolbar, content, controls }: ViewerLayoutProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  
  const [headerHeight, setHeaderHeight] = useState(0)
  const [toolbarHeight, setToolbarHeight] = useState(0)
  const [controlsHeight, setControlsHeight] = useState(0)
  
  // Use ResizeObserver to track height changes
  useEffect(() => {
    const updateHeights = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
      if (toolbarRef.current) {
        setToolbarHeight(toolbarRef.current.offsetHeight)
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
  }, [header, toolbar, controls])
  
  const contentHeight = `calc(100vh - ${headerHeight + toolbarHeight + controlsHeight}px)`
  
  return (
    <div className="viewer-layout">
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
          overflow: 'auto',
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
  )
}