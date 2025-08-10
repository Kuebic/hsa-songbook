import { 
  Eye, 
  Undo, 
  Redo, 
  Save,
  Music,
  Hash,
  MessageSquare,
  Columns2,
  FileText
} from 'lucide-react'
import { cn } from '../../../lib/utils'

interface EditorToolbarProps {
  onTogglePreview: () => void
  showPreview: boolean
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onSave?: () => void
  onCancel?: () => void
  isDirty?: boolean
  className?: string
  isMobile?: boolean
  mobileView?: 'editor' | 'preview'
}

/**
 * Toolbar component for the chord editor with various controls
 */
export function EditorToolbar({
  onTogglePreview,
  showPreview,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onSave,
  onCancel,
  isDirty = false,
  className,
  isMobile = false,
  mobileView = 'editor'
}: EditorToolbarProps) {
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-2 border-b bg-background",
      className
    )}>
      {/* Left side - Edit controls */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo buttons */}
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              "p-2 rounded hover:bg-muted transition-colors",
              !canUndo && "opacity-50 cursor-not-allowed"
            )}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(
              "p-2 rounded hover:bg-muted transition-colors",
              !canRedo && "opacity-50 cursor-not-allowed"
            )}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
        
        {/* Quick insert buttons */}
        {!isMobile && (
          <>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-1 ml-2">
              <button
                className="p-2 rounded hover:bg-muted transition-colors text-sm flex items-center gap-1"
                title="Insert chord"
                aria-label="Insert chord"
              >
                <Music className="h-4 w-4" />
                <span className="hidden sm:inline">Chord</span>
              </button>
              <button
                className="p-2 rounded hover:bg-muted transition-colors text-sm flex items-center gap-1"
                title="Insert section"
                aria-label="Insert section"
              >
                <Hash className="h-4 w-4" />
                <span className="hidden sm:inline">Section</span>
              </button>
              <button
                className="p-2 rounded hover:bg-muted transition-colors text-sm flex items-center gap-1"
                title="Insert comment"
                aria-label="Insert comment"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Comment</span>
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Center - Preview toggle */}
      <div className="flex items-center gap-2">
        {isMobile ? (
          // Mobile view switcher
          <div className="flex items-center bg-muted rounded-md p-1">
            <button
              onClick={() => mobileView === 'preview' && onTogglePreview()}
              className={cn(
                "px-3 py-1 rounded text-sm transition-colors",
                mobileView === 'editor' && "bg-background shadow-sm"
              )}
              aria-label="Show editor"
            >
              <FileText className="h-4 w-4" />
            </button>
            <button
              onClick={() => mobileView === 'editor' && onTogglePreview()}
              className={cn(
                "px-3 py-1 rounded text-sm transition-colors",
                mobileView === 'preview' && "bg-background shadow-sm"
              )}
              aria-label="Show preview"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        ) : (
          // Desktop preview toggle
          <button
            onClick={onTogglePreview}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors",
              showPreview 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-muted hover:bg-muted/80"
            )}
            title={showPreview ? "Hide preview" : "Show preview"}
            aria-label={showPreview ? "Hide preview" : "Show preview"}
          >
            {showPreview ? (
              <>
                <Columns2 className="h-4 w-4" />
                <span className="text-sm">Split View</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span className="text-sm">Show Preview</span>
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Right side - Save/Cancel */}
      <div className="flex items-center gap-2">
        {isDirty && (
          <span className="text-xs text-muted-foreground mr-2">
            Unsaved changes
          </span>
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
            aria-label="Cancel"
          >
            Cancel
          </button>
        )}
        {onSave && (
          <button
            onClick={onSave}
            disabled={!isDirty}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
              isDirty
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            aria-label="Save"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
        )}
      </div>
    </div>
  )
}