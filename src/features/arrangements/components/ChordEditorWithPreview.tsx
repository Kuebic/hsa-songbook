import { useState, useCallback } from 'react'
import { Button } from './ui/button'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { Toggle } from './ui/toggle'
import { ChordSyntaxEditor } from './ChordSyntaxEditor'
import { ChordPreview } from './ChordPreview'
import { useResponsiveLayout } from '../hooks/useResponsiveLayout'
import { useDebounce } from '../hooks/useDebounce'
import { cn } from '../../../lib/utils'
import { Edit, Eye, SplitSquareHorizontal, SplitSquareVertical, Save, X } from 'lucide-react'

interface ChordEditorWithPreviewProps {
  initialValue?: string
  onSave?: (value: string) => void
  onCancel?: () => void
  className?: string
}

export function ChordEditorWithPreview({
  initialValue = '',
  onSave,
  onCancel,
  className
}: ChordEditorWithPreviewProps) {
  const [chordProText, setChordProText] = useState(initialValue)
  const { isMobile, orientation, viewMode, toggleViewMode, setViewMode } = useResponsiveLayout()
  
  // Debounce preview updates for performance
  const debouncedChordProText = useDebounce(chordProText, 300)

  const handleSave = useCallback(() => {
    onSave?.(chordProText)
  }, [chordProText, onSave])

  // Mobile layout with tabs
  if (isMobile) {
    return (
      <div className={cn("flex flex-col h-screen", className)}>
        {/* Header with controls */}
        <div className="flex-none p-3 border-b bg-background/95 backdrop-blur">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'edit' | 'preview')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Save/Cancel buttons */}
          <div className="flex gap-2 mt-3">
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'edit' ? (
            <ChordSyntaxEditor
              value={chordProText}
              onChange={setChordProText}
              className="h-full"
            />
          ) : (
            <ChordPreview 
              chordProText={debouncedChordProText}
              className="h-full"
            />
          )}
        </div>
      </div>
    )
  }

  // Desktop layout with split screen
  return (
    <div className={cn("flex flex-col h-screen", className)}>
      {/* Header with controls */}
      <div className="flex-none p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Toggle 
              pressed={orientation === 'vertical'} 
              onPressedChange={toggleViewMode}
              aria-label="Toggle split orientation"
            >
              {orientation === 'horizontal' ? (
                <>
                  <SplitSquareVertical className="w-4 h-4" />
                  <span className="ml-2 hidden sm:inline">Vertical Split</span>
                </>
              ) : (
                <>
                  <SplitSquareHorizontal className="w-4 h-4" />
                  <span className="ml-2 hidden sm:inline">Horizontal Split</span>
                </>
              )}
            </Toggle>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Split content */}
      <div 
        className={cn(
          "flex-1 p-4",
          orientation === 'horizontal' 
            ? "grid grid-cols-2 gap-4" 
            : "flex flex-col gap-4"
        )}
        style={{
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        <div className={cn(
          "flex flex-col",
          orientation === 'vertical' ? "flex-1" : ""
        )} style={{ minHeight: 0 }}>
          <div className="flex-none mb-2">
            <h3 className="text-sm font-medium text-foreground flex items-center">
              <Edit className="w-4 h-4 mr-2" />
              Editor
            </h3>
          </div>
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <ChordSyntaxEditor
              value={chordProText}
              onChange={setChordProText}
              className="h-full"
            />
          </div>
        </div>

        <div className={cn(
          "flex flex-col",
          orientation === 'vertical' ? "flex-1" : ""
        )} style={{ minHeight: 0 }}>
          <div className="flex-none mb-2">
            <h3 className="text-sm font-medium text-foreground flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </h3>
          </div>
          <div className="flex-1 overflow-hidden border border-border rounded-md" style={{ minHeight: 0 }}>
            <ChordPreview 
              chordProText={debouncedChordProText}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}