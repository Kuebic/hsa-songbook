import React, { useState, useCallback, useEffect, useRef } from 'react'

interface EditorSplitterProps {
  onResize?: (leftWidth: number) => void
  minWidth?: number
  maxWidth?: number
  defaultPosition?: number
  className?: string
  disabled?: boolean
}

/**
 * Resizable splitter component for adjusting pane sizes
 * Only visible on tablet and desktop (>= 768px)
 */
export const EditorSplitter: React.FC<EditorSplitterProps> = ({
  onResize,
  minWidth = 200,
  maxWidth = 80,
  defaultPosition = 50,
  className = '',
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const splitterRef = useRef<HTMLDivElement>(null)
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return
    
    setIsDragging(true)
    setStartX(e.clientX)
    
    // Get the left pane width
    const leftPane = splitterRef.current?.previousSibling as HTMLElement
    if (leftPane) {
      setStartWidth(leftPane.offsetWidth)
    }
    
    e.preventDefault()
    
    // Add resizing class to parent for performance optimization
    const parent = splitterRef.current?.parentElement
    if (parent) {
      parent.classList.add('resizing')
    }
  }, [disabled])
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || !e.touches[0]) return
    
    setIsDragging(true)
    setStartX(e.touches[0].clientX)
    
    const leftPane = splitterRef.current?.previousSibling as HTMLElement
    if (leftPane) {
      setStartWidth(leftPane.offsetWidth)
    }
    
    e.preventDefault()
    
    const parent = splitterRef.current?.parentElement
    if (parent) {
      parent.classList.add('resizing')
    }
  }, [disabled])
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    const deltaX = e.clientX - startX
    const newWidth = startWidth + deltaX
    const containerWidth = window.innerWidth
    
    // Calculate percentage
    const minPercent = (minWidth / containerWidth) * 100
    const maxPercent = maxWidth
    
    const widthPercent = Math.min(
      Math.max((newWidth / containerWidth) * 100, minPercent),
      maxPercent
    )
    
    onResize?.(widthPercent)
  }, [isDragging, startX, startWidth, minWidth, maxWidth, onResize])
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !e.touches[0]) return
    
    const deltaX = e.touches[0].clientX - startX
    const newWidth = startWidth + deltaX
    const containerWidth = window.innerWidth
    
    const minPercent = (minWidth / containerWidth) * 100
    const maxPercent = maxWidth
    
    const widthPercent = Math.min(
      Math.max((newWidth / containerWidth) * 100, minPercent),
      maxPercent
    )
    
    onResize?.(widthPercent)
  }, [isDragging, startX, startWidth, minWidth, maxWidth, onResize])
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    
    // Remove resizing class
    const parent = splitterRef.current?.parentElement
    if (parent) {
      parent.classList.remove('resizing')
    }
  }, [])
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return
    
    const step = 5 // 5% step
    const leftPane = splitterRef.current?.previousSibling as HTMLElement
    if (!leftPane) return
    
    const containerWidth = window.innerWidth
    const currentPercent = (leftPane.offsetWidth / containerWidth) * 100
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        onResize?.(Math.max(currentPercent - step, (minWidth / containerWidth) * 100))
        break
      case 'ArrowRight':
        e.preventDefault()
        onResize?.(Math.min(currentPercent + step, maxWidth))
        break
      case 'Home':
        e.preventDefault()
        onResize?.((minWidth / containerWidth) * 100)
        break
      case 'End':
        e.preventDefault()
        onResize?.(maxWidth)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onResize?.(defaultPosition) // Reset to default
        break
    }
  }, [disabled, minWidth, maxWidth, defaultPosition, onResize])
  
  useEffect(() => {
    if (isDragging) {
      // Add event listeners to document for mouse/touch move and up
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleMouseUp)
      
      // Prevent text selection while dragging
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove])
  
  return (
    <>
      <div
        ref={splitterRef}
        className={`editor-splitter chord-editor-divider ${className} ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize editor panes"
        aria-valuenow={defaultPosition}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={disabled ? -1 : 0}
      >
        <div className="splitter-handle" aria-hidden="true">
          <span className="splitter-dots">⋮</span>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .editor-splitter {
          width: 4px;
          background: var(--editor-divider);
          cursor: col-resize;
          position: relative;
          transition: background 0.2s ease;
          user-select: none;
          flex-shrink: 0;
        }

        .editor-splitter:hover:not(.disabled),
        .editor-splitter:focus-visible:not(.disabled),
        .editor-splitter.dragging {
          background: var(--focus-ring);
        }

        .editor-splitter.disabled {
          cursor: default;
          opacity: 0.5;
        }

        .splitter-handle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .splitter-dots {
          color: var(--text-tertiary);
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .editor-splitter:hover .splitter-dots,
        .editor-splitter:focus-visible .splitter-dots,
        .editor-splitter.dragging .splitter-dots {
          opacity: 1;
        }

        /* Larger touch target for mobile/tablet */
        @media (hover: none) and (pointer: coarse) {
          .editor-splitter {
            width: 12px;
          }
          
          .editor-splitter::before {
            content: '';
            position: absolute;
            left: -8px;
            right: -8px;
            top: 0;
            bottom: 0;
          }
        }

        /* Visual indicator when dragging */
        .editor-splitter.dragging::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 2px;
          height: 40px;
          background: var(--focus-ring);
          transform: translate(-50%, -50%);
          border-radius: 1px;
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }

        /* Hide on mobile */
        @media (max-width: 767px) {
          .editor-splitter {
            display: none !important;
          }
        }

        /* Focus styles for keyboard navigation */
        .editor-splitter:focus-visible {
          outline: 2px solid var(--focus-ring);
          outline-offset: 2px;
          border-radius: 2px;
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .editor-splitter {
            background: var(--text-primary);
            width: 2px;
          }
          
          .editor-splitter:hover:not(.disabled),
          .editor-splitter.dragging {
            width: 4px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .editor-splitter,
          .editor-splitter::after {
            transition: none;
            animation: none;
          }
        }
      ` }} />
    </>
  )
}

export default EditorSplitter