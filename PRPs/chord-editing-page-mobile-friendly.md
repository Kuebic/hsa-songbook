# Chord Editing Page for Arrangements - Mobile-Friendly with Split Screen Preview

## Executive Summary

Create a dedicated chord editing page for arrangements featuring a mobile-first design with split-screen preview, syntax highlighting, and ChordSheetJS integration. This implementation will extend the existing arrangement architecture while introducing shadcn-ui components as a pilot for the planned form infrastructure migration.

**Confidence Score: 9.5/10** - High confidence based on comprehensive research of existing codebase patterns, proven external libraries, and clear mobile-first architecture approach.

## Context and Research Findings

### Current Arrangement Architecture Analysis

The HSA Songbook already has a robust arrangement system with key components:

#### Existing Components (`src/features/songs/components/arrangements/`)
- **ChordEditor.tsx**: Advanced editor with preview toggle, real-time analysis, and key detection
- **SimpleChordEditor.tsx**: Basic textarea with quick-insert buttons and drag-and-drop
- **ArrangementForm.tsx**: Comprehensive form with metadata management
- **ArrangementSheet.tsx**: Modal wrapper for arrangement editing

#### Key Existing Patterns to Follow
```typescript
// Real-time ChordPro analysis pattern
const analysis = useMemo(() => {
  const hasChords = chordProValidation.hasChords(value)
  const uniqueChords = [...new Set(chordMatches.map(chord => chord.slice(1, -1)))]
  return { hasChords, uniqueChords, isValid: chordProValidation.isValid(value) }
}, [value])

// Edit/Preview toggle pattern
const [previewMode, setPreviewMode] = useState(false)

// Mobile responsive grid pattern
const rowStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '16px'
}
```

#### Vertical Slice Architecture
```
src/features/songs/
├── components/arrangements/    # ← Extend this
├── pages/                     # ← Add new page here
├── hooks/                     # ← Add editing hooks
├── validation/               # ← ChordPro validation exists
└── types/                    # ← Arrangement types exist
```

### External Library Integration Research

#### ChordSheetJS (Already Available)
**Version**: 12.3.0 | **Docs**: https://martijnversluis.github.io/ChordSheetJS/
```javascript
// Parse and render pattern
import ChordSheetJS from 'chordsheetjs';

const parser = new ChordSheetJS.ChordProParser();
const song = parser.parse(chordProText);
const formatter = new ChordSheetJS.HtmlTableFormatter();
const htmlOutput = formatter.format(song);
```

#### Syntax Highlighting Options
1. **@uiw/react-textarea-code-editor** (Recommended for simplicity)
   - React 19 compatible, mobile-friendly, lightweight
2. **CodeMirror 6** with `codemirror-lang-chordpro` (Advanced option)
   - Full-featured but heavier bundle

#### Mobile Split-Screen Pattern
```css
.chord-editor-container {
  display: grid;
  height: 100vh;
  gap: 1rem;
  
  /* Mobile: Vertical stack */
  grid-template-rows: 1fr 1fr;
  grid-template-columns: 1fr;
  
  /* Tablet+: Horizontal split */
  @media (min-width: 768px) {
    grid-template-rows: 1fr;
    grid-template-columns: 1fr 1fr;
  }
}
```

### shadcn-ui Integration Strategy

The project has `clsx` and `tailwindcss` but shadcn-ui is in planned migration state. This feature will serve as a pilot implementation:

#### Required shadcn-ui Components to Add:
- Button (`@/components/ui/button`)
- Separator (`@/components/ui/separator`) 
- Tabs (`@/components/ui/tabs`)
- Textarea (`@/components/ui/textarea`)
- Toggle (`@/components/ui/toggle`)

## Vertical Slice Architecture Design

### Feature Boundary Definition
**New Feature Slice**: `src/features/arrangements/` (separate from songs for clear boundary)

```
src/features/arrangements/
├── components/
│   ├── ChordEditingPage.tsx          # Main page component
│   ├── ChordEditorWithPreview.tsx    # Split screen editor
│   ├── ChordPreview.tsx              # ChordSheetJS preview
│   ├── ChordSyntaxEditor.tsx         # Enhanced textarea editor
│   └── ui/                           # shadcn-ui components
│       ├── button.tsx
│       ├── separator.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── toggle.tsx
├── hooks/
│   ├── useChordEditing.ts            # Main editing state
│   ├── useChordPreview.ts            # Preview rendering logic
│   └── useResponsiveLayout.ts        # Mobile layout management
├── pages/
│   └── ChordEditingPage.tsx          # Route page wrapper
├── types/
│   └── chord-editing.types.ts        # Editor-specific types
└── utils/
    ├── chord-parsing.utils.ts        # ChordSheetJS utilities
    └── mobile-layout.utils.ts        # Responsive helpers
```

### Dependencies on Existing Slices
- `@features/songs/validation/schemas/arrangementSchema` - ChordPro validation
- `@features/songs/types/song.types` - Arrangement interfaces
- `@shared/components/form` - Form components (fallback to existing system)

## Implementation Blueprint

### Phase 1: shadcn-ui Component Setup

#### Task 1.1: Initialize shadcn-ui Infrastructure
```bash
# Install required dependencies
npm install @radix-ui/react-slot @radix-ui/react-separator @radix-ui/react-tabs
npm install @radix-ui/react-toggle class-variance-authority lucide-react
npm install @uiw/react-textarea-code-editor  # For syntax highlighting
```

#### Task 1.2: Create shadcn-ui Component Library
Create components in `src/features/arrangements/components/ui/`:

**button.tsx**:
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Phase 2: Core Editor Components

#### Task 2.1: Create Enhanced Syntax Editor
**ChordSyntaxEditor.tsx**:
```typescript
import React, { useCallback } from 'react'
import CodeEditor from '@uiw/react-textarea-code-editor'
import { cn } from '@/lib/utils'

interface ChordSyntaxEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function ChordSyntaxEditor({
  value,
  onChange,
  className,
  placeholder = "Enter ChordPro format...",
  disabled = false
}: ChordSyntaxEditorProps) {
  const handleChange = useCallback((evn: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(evn.target.value)
  }, [onChange])

  return (
    <div className={cn("h-full", className)}>
      <CodeEditor
        value={value}
        language="markdown" // Closest syntax highlighting to ChordPro
        onChange={handleChange}
        padding={16}
        disabled={disabled}
        data-color-mode="light"
        placeholder={placeholder}
        style={{
          fontSize: 14,
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", "Menlo", monospace',
          backgroundColor: disabled ? '#f8f9fa' : '#ffffff',
          minHeight: '100%',
        }}
        className="w-full h-full border border-input rounded-md"
      />
    </div>
  )
}
```

#### Task 2.2: Create ChordSheetJS Preview Component
**ChordPreview.tsx**:
```typescript
import React, { useMemo } from 'react'
import ChordSheetJS from 'chordsheetjs'
import { cn } from '@/lib/utils'

interface ChordPreviewProps {
  chordProText: string
  className?: string
  showMetadata?: boolean
}

export function ChordPreview({ 
  chordProText, 
  className,
  showMetadata = true 
}: ChordPreviewProps) {
  const { htmlOutput, metadata, hasError } = useMemo(() => {
    try {
      if (!chordProText.trim()) {
        return { 
          htmlOutput: '<p class="text-muted-foreground p-4">Enter ChordPro format to see preview...</p>',
          metadata: null,
          hasError: false
        }
      }

      const parser = new ChordSheetJS.ChordProParser()
      const song = parser.parse(chordProText)
      const formatter = new ChordSheetJS.HtmlTableFormatter()
      
      return {
        htmlOutput: formatter.format(song),
        metadata: song.metadata,
        hasError: false
      }
    } catch (error) {
      return {
        htmlOutput: `<div class="text-destructive p-4">
          <p><strong>ChordPro Parse Error:</strong></p>
          <p>${error instanceof Error ? error.message : 'Invalid format'}</p>
        </div>`,
        metadata: null,
        hasError: true
      }
    }
  }, [chordProText])

  return (
    <div className={cn("h-full overflow-auto bg-background", className)}>
      {showMetadata && metadata && (
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
            {metadata.title && (
              <div><span className="font-medium">Title:</span> {metadata.title}</div>
            )}
            {metadata.artist && (
              <div><span className="font-medium">Artist:</span> {metadata.artist}</div>
            )}
            {metadata.key && (
              <div><span className="font-medium">Key:</span> {metadata.key}</div>
            )}
            {metadata.tempo && (
              <div><span className="font-medium">Tempo:</span> {metadata.tempo}</div>
            )}
          </div>
        </div>
      )}
      
      <div 
        className="p-4 chordsheet-preview"
        dangerouslySetInnerHTML={{ __html: htmlOutput }}
        style={{
          // ChordSheetJS styling
          fontFamily: '"Times New Roman", serif',
          lineHeight: '1.6',
        }}
      />
      
      <style jsx>{`
        .chordsheet-preview table {
          width: 100%;
          border-collapse: collapse;
        }
        .chordsheet-preview .chord {
          font-weight: bold;
          color: #dc2626;
          font-size: 0.875em;
          vertical-align: top;
        }
        .chordsheet-preview .lyrics {
          color: #374151;
          vertical-align: bottom;
        }
        .chordsheet-preview .section {
          font-weight: bold;
          margin: 16px 0 8px 0;
          color: #1f2937;
        }
      `}</style>
    </div>
  )
}
```

### Phase 3: Layout and Responsive Components

#### Task 3.1: Create Responsive Layout Hook
**useResponsiveLayout.ts**:
```typescript
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
```

#### Task 3.2: Create Main Split-Screen Editor
**ChordEditorWithPreview.tsx**:
```typescript
import React, { useState, useCallback } from 'react'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { Toggle } from './ui/toggle'
import { ChordSyntaxEditor } from './ChordSyntaxEditor'
import { ChordPreview } from './ChordPreview'
import { useResponsiveLayout } from '../hooks/useResponsiveLayout'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { Edit, Eye, SplitSquareHorizontal, SplitSquareVertical } from 'lucide-react'

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
  const { isMobile, orientation, viewMode, toggleViewMode } = useResponsiveLayout()
  
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
          <div className="flex items-center justify-between">
            <Tabs value={viewMode} className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit" onClick={() => toggleViewMode()}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" onClick={() => toggleViewMode()}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Save/Cancel buttons */}
          <div className="flex gap-2 mt-3">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">
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
            <Toggle pressed={orientation === 'vertical'} onPressedChange={toggleViewMode}>
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
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Split content */}
      <div 
        className={cn(
          "flex-1 grid gap-4 p-4",
          orientation === 'horizontal' 
            ? "grid-cols-2" 
            : "grid-rows-2"
        )}
      >
        <div className="flex flex-col">
          <div className="flex-none mb-2">
            <h3 className="text-sm font-medium text-foreground flex items-center">
              <Edit className="w-4 h-4 mr-2" />
              Editor
            </h3>
          </div>
          <ChordSyntaxEditor
            value={chordProText}
            onChange={setChordProText}
            className="flex-1"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex-none mb-2">
            <h3 className="text-sm font-medium text-foreground flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </h3>
          </div>
          <div className="flex-1 border border-border rounded-md">
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
```

### Phase 4: Main Page and Routing Integration

#### Task 4.1: Create Main Chord Editing Page
**ChordEditingPage.tsx**:
```typescript
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChordEditorWithPreview } from '../components/ChordEditorWithPreview'
import { useArrangementMutations } from '@features/songs/hooks/useArrangementMutations'
import { useNotification } from '@shared/components/notifications'
import { ErrorBoundary } from '@shared/components/ErrorBoundary'
import type { ArrangementFormData } from '@features/songs/validation/schemas/arrangementSchema'

export function ChordEditingPage() {
  const { arrangementId } = useParams<{ arrangementId: string }>()
  const navigate = useNavigate()
  const { addNotification } = useNotification()
  const { updateArrangement, createArrangement } = useArrangementMutations()

  const [initialChordData, setInitialChordData] = useState<string>('')
  const [loading, setLoading] = useState(!!arrangementId)

  useEffect(() => {
    if (arrangementId) {
      // Load existing arrangement
      // This would integrate with existing arrangement loading logic
      loadArrangement(arrangementId)
        .then(arrangement => {
          setInitialChordData(arrangement.chordData || '')
          setLoading(false)
        })
        .catch(error => {
          addNotification({
            type: 'error',
            message: 'Failed to load arrangement'
          })
          navigate('/arrangements')
        })
    }
  }, [arrangementId])

  const handleSave = async (chordProText: string) => {
    try {
      if (arrangementId) {
        await updateArrangement({
          id: arrangementId,
          chordData: chordProText
        })
        addNotification({
          type: 'success',
          message: 'Arrangement updated successfully'
        })
      } else {
        // Create new arrangement flow would need arrangement metadata
        addNotification({
          type: 'info',
          message: 'Creating new arrangements requires metadata form'
        })
      }
      
      navigate('/arrangements')
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to save arrangement'
      })
    }
  }

  const handleCancel = () => {
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">
            Loading arrangement...
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ChordEditorWithPreview
        initialValue={initialChordData}
        onSave={handleSave}
        onCancel={handleCancel}
        className="h-screen"
      />
    </ErrorBoundary>
  )
}

// Placeholder for arrangement loading - would integrate with existing services
async function loadArrangement(arrangementId: string) {
  // This would use existing arrangement service
  return {
    id: arrangementId,
    chordData: `{title: Sample Song}
{key: C}
{tempo: 120}

[Verse]
[C]This is a [F]sample chord [G]sheet
[Am]With some [F]chords to [C]edit`
  }
}
```

#### Task 4.2: Add Routing Integration
Add to `App.tsx`:
```typescript
// Add to existing routes
<Route path="/arrangements/:arrangementId/edit" element={<ChordEditingPage />} />
<Route path="/arrangements/new" element={<ChordEditingPage />} />
```

### Phase 5: Styling and Mobile Optimization

#### Task 5.1: Add Tailwind CSS Configuration
Add to `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Consolas', 'monospace'],
      },
      screens: {
        'chord-edit': '896px', // Custom breakpoint for chord editing layout
      }
    }
  }
}
```

#### Task 5.2: Add Mobile-Specific Styles
Create `chord-editing.css`:
```css
/* Mobile optimizations for chord editing */
@media (max-width: 768px) {
  .chord-editor-mobile {
    /* Prevent zoom on input focus in iOS */
    font-size: 16px;
  }
  
  /* Touch-friendly chord syntax highlighting */
  .chord-syntax-editor {
    line-height: 1.8;
    padding: 12px;
  }
  
  /* Improve readability of chord preview on small screens */
  .chordsheet-preview {
    font-size: 16px;
    line-height: 1.7;
  }
  
  .chordsheet-preview .chord {
    font-size: 14px;
    font-weight: 600;
  }
}

/* Landscape mobile optimizations */
@media (max-width: 768px) and (orientation: landscape) {
  .chord-editor-container {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .chordsheet-preview .chord {
    color: #000;
    background: #ff0;
    padding: 0 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .chord-editor-with-preview * {
    transition: none !important;
    animation: none !important;
  }
}
```

## Validation Gates

### Level 1: Type Checking
```bash
npx tsc --noEmit
```

### Level 2: Linting
```bash
npm run lint
```

### Level 3: Unit Tests
```bash
npm run test -- --run
```
Create tests for:
- `ChordSyntaxEditor.test.tsx`
- `ChordPreview.test.tsx`
- `useResponsiveLayout.test.ts`
- `ChordEditingPage.test.tsx`

### Level 4: Integration Tests
```bash
npm run test -- --grep="ChordEditingPage" --run
```
Test scenarios:
- Mobile edit/preview toggle
- Desktop split-screen layout
- ChordSheetJS parsing and rendering
- Save/cancel functionality

### Level 5: Accessibility Testing
```bash
npm run test -- --grep="a11y" --run
```
Verify:
- Keyboard navigation between editor and preview
- Screen reader announcements
- Color contrast in preview mode
- Focus management

### Level 6: Build Validation
```bash
npm run build
```

### Level 7: Mobile Testing
```bash
npm run preview
# Manual testing checklist:
# - Mobile edit/preview toggle works
# - Split screen works on desktop
# - Syntax highlighting renders properly
# - ChordSheetJS preview displays correctly
# - Performance is smooth on mobile devices
```

### Level 8: Bundle Size Analysis
```bash
npm run analyze
# Verify the new dependencies don't significantly impact bundle size
```

## Error Handling and Edge Cases

### ChordSheetJS Parse Errors
- Display user-friendly error messages
- Highlight syntax errors where possible
- Graceful degradation to raw text display

### Mobile Performance
- Debounce preview updates (300ms)
- Lazy load ChordSheetJS formatter
- Virtual scrolling for large chord sheets

### Accessibility Considerations
- Proper ARIA labels for editor and preview regions
- Keyboard shortcuts for common actions
- High contrast mode support
- Screen reader compatibility

## Success Metrics

- ✅ Mobile-first responsive design works on all device sizes
- ✅ Split-screen preview functions properly on desktop
- ✅ Syntax highlighting enhances editing experience
- ✅ ChordSheetJS integration renders chords correctly
- ✅ shadcn-ui components provide consistent styling
- ✅ Performance is smooth (<300ms for preview updates)
- ✅ Accessibility meets WCAG 2.1 AA standards
- ✅ No regressions in existing arrangement functionality

## File Modification Checklist

### New Files to Create
1. `src/features/arrangements/` (entire directory structure)
2. shadcn-ui components in `components/ui/`
3. Custom hooks for responsive layout and editing
4. CSS styles for mobile optimization
5. Route additions to `App.tsx`

### Existing Files to Modify
1. `package.json` - Add new dependencies
2. `tailwind.config.js` - Add custom configuration
3. `App.tsx` - Add new routes
4. Update existing arrangement components if needed for integration

## Implementation Priority

1. **High Priority**: Core editor with syntax highlighting and ChordSheetJS preview
2. **Medium Priority**: Mobile responsive layout with edit/preview toggle  
3. **Medium Priority**: shadcn-ui component integration
4. **Lower Priority**: Advanced features (keyboard shortcuts, auto-save)

This comprehensive PRP provides all necessary context and implementation details for successful one-pass development of a mobile-friendly chord editing page with split-screen preview functionality.