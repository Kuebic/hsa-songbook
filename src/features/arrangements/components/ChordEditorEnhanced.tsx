import React, { useRef, useCallback, useEffect } from 'react'
import { cn } from '../../../lib/utils'
import { ChordSyntaxHighlight, type ChordSyntaxHighlightRef } from './ChordSyntaxHighlightIntegrated'
import { ChordPreviewPane } from './ChordPreviewPane'
import { EditorToolbar } from './EditorToolbar'
import { useChordEditor } from '../hooks/useChordEditor'
import { useEditorLayout } from '../hooks/useEditorLayout'

export interface ChordEditorEnhancedProps {
  initialContent: string
  onChange: (content: string) => void
  onSave?: (content: string) => void
  onCancel?: () => void
  height?: number | string
  showToolbar?: boolean
  defaultPreviewVisible?: boolean
  className?: string
  autoFocus?: boolean
}

/**
 * Enhanced chord editor with horizontal split layout and syntax highlighting
 */
export function ChordEditorEnhanced({
  initialContent,
  onChange,
  onSave,
  onCancel,
  height = '600px',
  showToolbar = true,
  defaultPreviewVisible = true,
  className,
  autoFocus = false
}: ChordEditorEnhancedProps) {
  const editorRef = useRef<ChordSyntaxHighlightRef>(null)
  
  // Editor state management with undo/redo
  const {
    content,
    setContent,
    isDirty,
    validation,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  } = useChordEditor(initialContent)
  
  // Layout management with preview toggle
  const {
    showPreview,
    togglePreview,
    splitRatio,
    setSplitRatio,
    isMobile,
    mobileView,
    setMobileView
  } = useEditorLayout(defaultPreviewVisible)
  
  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    onChange(newContent)
  }, [setContent, onChange])
  
  // Handle save
  const handleSave = useCallback(() => {
    if (onSave && isDirty) {
      onSave(content)
      // Note: We don't reset isDirty here as the parent component
      // should handle the saved state (e.g., by updating initialContent)
    }
  }, [onSave, isDirty, content])
  
  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      reset()
      onCancel()
    }
  }, [onCancel, reset])
  
  // Keyboard shortcuts for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])
  
  // Handle mobile view toggle
  const handleMobileToggle = useCallback(() => {
    if (isMobile) {
      setMobileView(prev => prev === 'editor' ? 'preview' : 'editor')
    } else {
      togglePreview()
    }
  }, [isMobile, setMobileView, togglePreview])
  
  // Resizable split functionality for desktop
  const [isResizing, setIsResizing] = React.useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isMobile) {
      e.preventDefault()
      setIsResizing(true)
    }
  }, [isMobile])
  
  useEffect(() => {
    if (!isResizing) return
    
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const newRatio = x / rect.width
        setSplitRatio(newRatio)
      }
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, setSplitRatio])
  
  return (
    <div 
      className={cn("chord-editor-enhanced flex flex-col", className)}
      style={{ height }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <EditorToolbar
          onTogglePreview={handleMobileToggle}
          showPreview={showPreview}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onSave={onSave ? handleSave : undefined}
          onCancel={onCancel ? handleCancel : undefined}
          isDirty={isDirty}
          isMobile={isMobile}
          mobileView={mobileView}
        />
      )}
      
      {/* Main content area */}
      <div 
        ref={containerRef}
        className={cn(
          "chord-editor-content flex-1 flex overflow-hidden",
          isMobile ? "flex-col" : "flex-row",
          isResizing && "select-none cursor-col-resize"
        )}
      >
        {/* Editor pane */}
        {(!isMobile || mobileView === 'editor') && (
          <div 
            className={cn(
              "chord-editor-pane overflow-hidden",
              isMobile ? "flex-1" : "min-w-[200px]"
            )}
            style={!isMobile ? { flex: showPreview ? splitRatio : 1 } : {}}
          >
            <ChordSyntaxHighlight
              ref={editorRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Enter ChordPro notation..."
              validation={validation}
              className="h-full"
              autoFocus={autoFocus}
            />
          </div>
        )}
        
        {/* Resizable divider (desktop only) */}
        {!isMobile && showPreview && (
          <div 
            className={cn(
              "chord-editor-divider",
              isResizing && "chord-editor-divider-active"
            )}
            onMouseDown={handleMouseDown}
          />
        )}
        
        {/* Preview pane */}
        {((!isMobile && showPreview) || (isMobile && mobileView === 'preview')) && (
          <div 
            className={cn(
              "chord-preview-pane overflow-hidden",
              isMobile ? "flex-1" : "min-w-[200px]"
            )}
            style={!isMobile ? { flex: 1 - splitRatio } : {}}
          >
            <ChordPreviewPane
              content={content}
              validation={validation}
              className="h-full"
              showMetadata={true}
              showValidation={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}