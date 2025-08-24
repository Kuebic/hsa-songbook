# PRP: Professional ChordPro Editor Implementation

## Feature Overview
Implement a professional-grade ChordPro editor with real-time preview, syntax highlighting, intelligent autocomplete, and a distraction-free interface following the specifications in `claude_md_files/chordpro-editor-ideal-spec.md`.

## Critical Context and Documentation

### ChordPro Format Specification
- **Official Specification**: https://www.chordpro.org/chordpro/chordpro-directives/
- **Format Documentation**: https://www.chordpro.org/chordpro46.html
- **Chord Implementation**: https://www.chordpro.org/chordpro/chordpro-chords/

### CodeMirror 6 Documentation
- **Main Documentation**: https://codemirror.net/docs/
- **System Guide**: https://codemirror.net/docs/guide/
- **API Reference**: https://codemirror.net/docs/ref/
- **Examples**: https://codemirror.net/examples/
- **React Integration**: https://uiwjs.github.io/react-codemirror/

### Key Libraries Documentation
- **chordsheetjs**: https://github.com/martijnversluis/ChordSheetJS (ChordPro parser)
- **react-resizable-panels**: https://github.com/bvaughn/react-resizable-panels (Split pane layout)
- **@tanstack/react-virtual**: https://tanstack.com/virtual/latest (Virtual scrolling)

## Vertical Slice Architecture

### Feature Boundaries
This feature will be implemented as a new vertical slice at `/src/features/chordpro-editor/` with the following structure:

```
src/features/chordpro-editor/
├── index.ts                    # Public API exports
├── types/
│   └── editor.types.ts        # ChordPro editor specific types
├── components/
│   ├── ChordProEditor.tsx     # Main editor component
│   ├── EditorPanel.tsx        # CodeMirror editor panel
│   ├── PreviewPanel.tsx       # Real-time preview panel
│   ├── EditorToolbar.tsx      # Editor actions toolbar
│   ├── TransposeDialog.tsx    # Transposition controls
│   └── ChordPalette.tsx       # Quick chord insertion
├── hooks/
│   ├── useChordProEditor.ts   # Main editor state management
│   ├── useChordProParser.ts   # ChordPro parsing hook
│   └── useSyncScroll.ts       # Synchronized scrolling
├── services/
│   └── chordProService.ts     # ChordPro operations service
├── utils/
│   ├── chordpro-language.ts   # CodeMirror language definition
│   ├── transposition.ts       # Chord transposition logic
│   └── export.ts              # Export utilities
├── validation/
│   └── chordpro.validation.ts # ChordPro format validation
└── __tests__/
    ├── ChordProEditor.test.tsx
    ├── useChordProEditor.test.ts
    └── transposition.test.ts
```

### Dependencies from Other Features
- `@features/songs/types` - Arrangement interface
- `@features/songs/services` - arrangementService for saving
- `@shared/components/modal` - Modal component
- `@shared/components/notifications` - Notification system

## Implementation Blueprint

### Phase 1: Core Setup and Dependencies

```bash
# Install required dependencies
npm install @uiw/react-codemirror @codemirror/lang-javascript @codemirror/view @codemirror/state
npm install chordsheetjs
npm install react-resizable-panels
npm install @tanstack/react-virtual
npm install use-debounce
```

### Phase 2: Type Definitions

```typescript
// src/features/chordpro-editor/types/editor.types.ts

export interface ChordProEditorState {
  content: string
  parsedSong: ChordProSong | null
  isDirty: boolean
  currentKey: string
  isPreviewVisible: boolean
  isSaving: boolean
  errors: ChordProError[]
}

export interface ChordProSong {
  title: string
  artist?: string
  key?: string
  tempo?: number
  timeSignature?: string
  sections: ChordProSection[]
  metadata: Record<string, string>
  chords: string[]
}

export interface ChordProSection {
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'custom'
  label?: string
  lines: ChordProLine[]
}

export interface ChordProLine {
  lyrics: string
  chords: ChordPosition[]
}

export interface ChordPosition {
  chord: string
  position: number // Character position in lyrics
}

export interface ChordProError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface EditorTheme {
  name: string
  isDark: boolean
  colors: {
    background: string
    text: string
    chord: string
    directive: string
    section: string
    comment: string
    selection: string
  }
}

export interface ExportOptions {
  format: 'chordpro' | 'pdf' | 'html' | 'plaintext'
  includeMetadata: boolean
  fontSize?: number
  columns?: 1 | 2
  pageSize?: 'a4' | 'letter'
}
```

### Phase 3: ChordPro Language Support for CodeMirror

```typescript
// src/features/chordpro-editor/utils/chordpro-language.ts

import { parser } from '@lezer/javascript'
import { LRLanguage, LanguageSupport } from '@codemirror/language'
import { styleTags, Tag } from '@lezer/highlight'

// Define ChordPro tokens
const chordProTags = {
  directive: Tag.define(),
  chord: Tag.define(),
  section: Tag.define(),
  comment: Tag.define(),
  lyrics: Tag.define()
}

// Create ChordPro language definition
export const chordProLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        "DirectiveName": chordProTags.directive,
        "ChordSymbol": chordProTags.chord,
        "SectionHeader": chordProTags.section,
        "Comment": chordProTags.comment,
        "LyricText": chordProTags.lyrics
      })
    ]
  }),
  languageData: {
    commentTokens: { line: "#" },
    autocomplete: chordProCompletions
  }
})

// Autocomplete suggestions
const chordProCompletions = [
  { label: "{title:", type: "directive", detail: "Song title" },
  { label: "{artist:", type: "directive", detail: "Artist name" },
  { label: "{key:", type: "directive", detail: "Musical key" },
  { label: "{tempo:", type: "directive", detail: "Tempo in BPM" },
  { label: "{capo:", type: "directive", detail: "Capo position" },
  { label: "[Verse]", type: "section", detail: "Verse section" },
  { label: "[Chorus]", type: "section", detail: "Chorus section" },
  { label: "[Bridge]", type: "section", detail: "Bridge section" },
  // Common chords based on key
  { label: "[C]", type: "chord", detail: "C major" },
  { label: "[Am]", type: "chord", detail: "A minor" },
  { label: "[F]", type: "chord", detail: "F major" },
  { label: "[G]", type: "chord", detail: "G major" }
]

export function chordpro(): LanguageSupport {
  return new LanguageSupport(chordProLanguage)
}
```

### Phase 4: Main Editor Hook

```typescript
// src/features/chordpro-editor/hooks/useChordProEditor.ts

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDebounce } from 'use-debounce'
import ChordSheetJS from 'chordsheetjs'
import type { ChordProEditorState, ChordProSong } from '../types/editor.types'

export function useChordProEditor(initialContent = '') {
  const [state, setState] = useState<ChordProEditorState>({
    content: initialContent,
    parsedSong: null,
    isDirty: false,
    currentKey: 'C',
    isPreviewVisible: true,
    isSaving: false,
    errors: []
  })

  const [debouncedContent] = useDebounce(state.content, 200)
  const parser = useRef(new ChordSheetJS.ChordProParser())
  const formatter = useRef(new ChordSheetJS.HtmlDivFormatter())

  // Parse ChordPro content
  const parseContent = useCallback((content: string) => {
    try {
      const song = parser.current.parse(content)
      const errors = validateChordPro(content)
      
      setState(prev => ({
        ...prev,
        parsedSong: transformSong(song),
        errors,
        currentKey: song.key || prev.currentKey
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: [{
          line: 0,
          column: 0,
          message: error.message,
          severity: 'error'
        }]
      }))
    }
  }, [])

  // Parse debounced content
  useEffect(() => {
    if (debouncedContent) {
      parseContent(debouncedContent)
    }
  }, [debouncedContent, parseContent])

  // Update content
  const updateContent = useCallback((newContent: string) => {
    setState(prev => ({
      ...prev,
      content: newContent,
      isDirty: true
    }))
  }, [])

  // Transpose song
  const transpose = useCallback((semitones: number) => {
    if (!state.parsedSong) return
    
    try {
      const song = parser.current.parse(state.content)
      const transposedSong = song.transpose(semitones)
      const newContent = new ChordSheetJS.ChordProFormatter().format(transposedSong)
      
      updateContent(newContent)
    } catch (error) {
      console.error('Transpose error:', error)
    }
  }, [state.content, state.parsedSong, updateContent])

  // Toggle preview
  const togglePreview = useCallback(() => {
    setState(prev => ({ ...prev, isPreviewVisible: !prev.isPreviewVisible }))
  }, [])

  // Generate HTML preview
  const getPreviewHtml = useCallback(() => {
    if (!state.parsedSong) return ''
    
    try {
      const song = parser.current.parse(state.content)
      return formatter.current.format(song)
    } catch {
      return '<p>Error rendering preview</p>'
    }
  }, [state.content, state.parsedSong])

  return {
    // State
    content: state.content,
    parsedSong: state.parsedSong,
    isDirty: state.isDirty,
    currentKey: state.currentKey,
    isPreviewVisible: state.isPreviewVisible,
    isSaving: state.isSaving,
    errors: state.errors,
    
    // Actions
    updateContent,
    transpose,
    togglePreview,
    getPreviewHtml,
    
    // Utilities
    debouncedContent
  }
}

// Helper functions
function validateChordPro(content: string): ChordProError[] {
  const errors: ChordProError[] = []
  const lines = content.split('\n')
  
  lines.forEach((line, index) => {
    // Check for unclosed brackets
    const openBrackets = (line.match(/\[/g) || []).length
    const closeBrackets = (line.match(/\]/g) || []).length
    if (openBrackets !== closeBrackets) {
      errors.push({
        line: index + 1,
        column: 0,
        message: 'Unclosed chord bracket',
        severity: 'error'
      })
    }
    
    // Check for unclosed directives
    if (line.includes('{') && !line.includes('}')) {
      errors.push({
        line: index + 1,
        column: line.indexOf('{'),
        message: 'Unclosed directive',
        severity: 'error'
      })
    }
  })
  
  return errors
}

function transformSong(song: any): ChordProSong {
  // Transform ChordSheetJS song to our format
  return {
    title: song.title,
    artist: song.artist,
    key: song.key,
    tempo: song.tempo,
    timeSignature: song.time,
    sections: extractSections(song),
    metadata: song.metadata || {},
    chords: extractUniqueChords(song)
  }
}
```

### Phase 5: Main Editor Component

```typescript
// src/features/chordpro-editor/components/ChordProEditor.tsx

import { useMemo, useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { EditorToolbar } from './EditorToolbar'
import { PreviewPanel } from './PreviewPanel'
import { useChordProEditor } from '../hooks/useChordProEditor'
import { chordpro } from '../utils/chordpro-language'
import { editorThemes } from '../utils/themes'
import type { Arrangement } from '@features/songs/types'

interface ChordProEditorProps {
  arrangement?: Arrangement
  songTitle?: string
  onSave?: (content: string) => Promise<void>
  onClose?: () => void
}

export function ChordProEditor({
  arrangement,
  songTitle,
  onSave,
  onClose
}: ChordProEditorProps) {
  const initialContent = arrangement?.chordProText || arrangement?.chordData || 
    generateTemplate(songTitle)
  
  const {
    content,
    parsedSong,
    isDirty,
    isPreviewVisible,
    errors,
    updateContent,
    transpose,
    togglePreview,
    getPreviewHtml
  } = useChordProEditor(initialContent)

  // CodeMirror extensions
  const extensions = useMemo(() => [
    chordpro(),
    EditorView.theme({
      '&': { height: '100%' },
      '.cm-scroller': { overflow: 'auto' },
      '.cm-content': { 
        fontFamily: 'Monaco, Consolas, monospace',
        fontSize: '14px',
        lineHeight: '1.6'
      },
      '.cm-chordpro-directive': { color: '#0066cc', fontWeight: 'bold' },
      '.cm-chordpro-chord': { 
        color: '#d73502', 
        backgroundColor: '#fff3cd',
        borderRadius: '3px',
        padding: '0 4px'
      },
      '.cm-chordpro-section': { 
        color: '#6f42c1', 
        fontStyle: 'italic',
        fontSize: '1.1em'
      }
    }),
    EditorView.lineWrapping
  ], [])

  // Handle save
  const handleSave = useCallback(async () => {
    if (!onSave || !isDirty) return
    
    try {
      await onSave(content)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }, [content, isDirty, onSave])

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 's':
          e.preventDefault()
          handleSave()
          break
        case 'p':
          e.preventDefault()
          togglePreview()
          break
        case 't':
          e.preventDefault()
          // Open transpose dialog
          break
      }
    }
  }, [handleSave, togglePreview])

  const containerStyles = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#f9fafb'
  }

  const panelStyles = {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const
  }

  return (
    <div style={containerStyles} onKeyDown={handleKeyDown}>
      <EditorToolbar
        isDirty={isDirty}
        isPreviewVisible={isPreviewVisible}
        currentKey={parsedSong?.key || 'C'}
        onSave={handleSave}
        onTranspose={transpose}
        onTogglePreview={togglePreview}
        onClose={onClose}
      />
      
      <PanelGroup direction="horizontal" style={{ flex: 1 }}>
        <Panel defaultSize={isPreviewVisible ? 50 : 100} minSize={30}>
          <div style={panelStyles}>
            <CodeMirror
              value={content}
              height="100%"
              extensions={extensions}
              onChange={updateContent}
              placeholder="Enter ChordPro notation..."
            />
            
            {errors.length > 0 && (
              <div style={{
                padding: '8px',
                backgroundColor: '#fee',
                borderTop: '1px solid #fcc',
                fontSize: '12px',
                color: '#c00'
              }}>
                {errors[0].message} (Line {errors[0].line})
              </div>
            )}
          </div>
        </Panel>
        
        {isPreviewVisible && (
          <>
            <PanelResizeHandle style={{
              width: '4px',
              backgroundColor: '#e5e7eb',
              cursor: 'col-resize',
              transition: 'background-color 0.2s',
              ':hover': {
                backgroundColor: '#d1d5db'
              }
            }} />
            
            <Panel defaultSize={50} minSize={30}>
              <PreviewPanel
                html={getPreviewHtml()}
                parsedSong={parsedSong}
                currentKey={parsedSong?.key || 'C'}
              />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  )
}

// Helper function to generate template
function generateTemplate(songTitle?: string): string {
  return `{title: ${songTitle || 'New Song'}}
{artist: }
{key: C}
{tempo: 120}
{time: 4/4}

[Verse 1]
[C]Type your [F]lyrics here with [G]chords in [C]brackets

[Chorus]
[Am]This is the [F]chorus section
[C]Add more [G]lines as [C]needed

[Verse 2]
Continue adding verses, bridges, and other sections

{comment: Use curly braces for directives and comments}
`
}
```

### Phase 6: Preview Panel Component

```typescript
// src/features/chordpro-editor/components/PreviewPanel.tsx

import { useRef, useEffect } from 'react'
import { useSyncScroll } from '../hooks/useSyncScroll'
import type { ChordProSong } from '../types/editor.types'

interface PreviewPanelProps {
  html: string
  parsedSong: ChordProSong | null
  currentKey: string
}

export function PreviewPanel({ html, parsedSong, currentKey }: PreviewPanelProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  
  // Apply synchronized scrolling
  useSyncScroll('editor', 'preview', previewRef)
  
  const containerStyles = {
    height: '100%',
    overflow: 'auto',
    backgroundColor: '#ffffff',
    padding: '24px'
  }
  
  const contentStyles = {
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'Georgia, serif',
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#333'
  }
  
  const headerStyles = {
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e5e7eb'
  }
  
  return (
    <div ref={previewRef} style={containerStyles} data-scroll-id="preview">
      <div style={contentStyles}>
        {parsedSong && (
          <div style={headerStyles}>
            <h1 style={{ fontSize: '28px', margin: '0 0 8px 0' }}>
              {parsedSong.title}
            </h1>
            {parsedSong.artist && (
              <p style={{ margin: '0', color: '#6b7280', fontSize: '18px' }}>
                {parsedSong.artist}
              </p>
            )}
            <div style={{ 
              marginTop: '12px', 
              fontSize: '14px', 
              color: '#9ca3af',
              display: 'flex',
              gap: '16px'
            }}>
              {parsedSong.key && <span>Key: {parsedSong.key}</span>}
              {parsedSong.tempo && <span>Tempo: {parsedSong.tempo} BPM</span>}
              {parsedSong.timeSignature && <span>Time: {parsedSong.timeSignature}</span>}
            </div>
          </div>
        )}
        
        <div 
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            '& .chord': {
              color: '#d73502',
              fontWeight: 'bold',
              fontSize: '14px',
              verticalAlign: 'super'
            },
            '& .verse, & .chorus, & .bridge': {
              marginBottom: '20px'
            },
            '& .section-label': {
              fontWeight: 'bold',
              color: '#6f42c1',
              marginBottom: '8px'
            }
          }}
        />
      </div>
    </div>
  )
}
```

### Phase 7: Editor Toolbar Component

```typescript
// src/features/chordpro-editor/components/EditorToolbar.tsx

import { useState } from 'react'
import { TransposeDialog } from './TransposeDialog'
import { ChordPalette } from './ChordPalette'

interface EditorToolbarProps {
  isDirty: boolean
  isPreviewVisible: boolean
  currentKey: string
  onSave: () => void
  onTranspose: (semitones: number) => void
  onTogglePreview: () => void
  onClose?: () => void
}

export function EditorToolbar({
  isDirty,
  isPreviewVisible,
  currentKey,
  onSave,
  onTranspose,
  onTogglePreview,
  onClose
}: EditorToolbarProps) {
  const [showTranspose, setShowTranspose] = useState(false)
  const [showChordPalette, setShowChordPalette] = useState(false)
  
  const toolbarStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    minHeight: '48px'
  }
  
  const buttonGroupStyles = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  }
  
  const buttonStyles = {
    padding: '6px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f3f4f6'
    }
  }
  
  const primaryButtonStyles = {
    ...buttonStyles,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    ':hover': {
      backgroundColor: '#2563eb'
    }
  }
  
  return (
    <>
      <div style={toolbarStyles}>
        <div style={buttonGroupStyles}>
          <button
            style={primaryButtonStyles}
            onClick={onSave}
            disabled={!isDirty}
            title="Save (Cmd+S)"
          >
            💾 Save
          </button>
          
          <button
            style={buttonStyles}
            onClick={() => setShowTranspose(true)}
            title="Transpose (Cmd+T)"
          >
            🎵 Transpose ({currentKey})
          </button>
          
          <button
            style={buttonStyles}
            onClick={() => setShowChordPalette(true)}
            title="Insert Chord (Cmd+K)"
          >
            🎸 Chords
          </button>
          
          <button
            style={buttonStyles}
            onClick={onTogglePreview}
            title="Toggle Preview (Cmd+P)"
          >
            {isPreviewVisible ? '👁️ Hide Preview' : '👁️‍🗨️ Show Preview'}
          </button>
        </div>
        
        <div style={buttonGroupStyles}>
          {isDirty && (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Unsaved changes
            </span>
          )}
          
          {onClose && (
            <button
              style={buttonStyles}
              onClick={onClose}
              title="Close Editor"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>
      
      {showTranspose && (
        <TransposeDialog
          currentKey={currentKey}
          onTranspose={(semitones) => {
            onTranspose(semitones)
            setShowTranspose(false)
          }}
          onClose={() => setShowTranspose(false)}
        />
      )}
      
      {showChordPalette && (
        <ChordPalette
          currentKey={currentKey}
          onInsert={(chord) => {
            // Insert chord at cursor position
            setShowChordPalette(false)
          }}
          onClose={() => setShowChordPalette(false)}
        />
      )}
    </>
  )
}
```

### Phase 8: Testing Implementation

```typescript
// src/features/chordpro-editor/__tests__/ChordProEditor.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChordProEditor } from '../components/ChordProEditor'

describe('ChordProEditor', () => {
  const mockOnSave = vi.fn()
  const mockOnClose = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Rendering Tests', () => {
    it('renders editor with initial content', () => {
      render(
        <ChordProEditor
          songTitle="Test Song"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByText(/Test Song/)).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
    
    it('renders toolbar with all buttons', () => {
      render(<ChordProEditor />)
      
      expect(screen.getByTitle(/Save/)).toBeInTheDocument()
      expect(screen.getByTitle(/Transpose/)).toBeInTheDocument()
      expect(screen.getByTitle(/Insert Chord/)).toBeInTheDocument()
      expect(screen.getByTitle(/Toggle Preview/)).toBeInTheDocument()
    })
    
    it('shows preview panel by default', () => {
      render(<ChordProEditor />)
      
      expect(screen.getByTestId('preview-panel')).toBeInTheDocument()
    })
  })
  
  describe('User Interaction Tests', () => {
    it('updates content when typing', async () => {
      const user = userEvent.setup()
      render(<ChordProEditor />)
      
      const editor = screen.getByRole('textbox')
      await user.type(editor, '[C]New chord')
      
      await waitFor(() => {
        expect(editor).toHaveValue(expect.stringContaining('[C]New chord'))
      })
    })
    
    it('toggles preview panel', async () => {
      const user = userEvent.setup()
      render(<ChordProEditor />)
      
      const toggleButton = screen.getByTitle(/Toggle Preview/)
      await user.click(toggleButton)
      
      expect(screen.queryByTestId('preview-panel')).not.toBeInTheDocument()
      
      await user.click(toggleButton)
      expect(screen.getByTestId('preview-panel')).toBeInTheDocument()
    })
    
    it('saves content when save button clicked', async () => {
      const user = userEvent.setup()
      render(<ChordProEditor onSave={mockOnSave} />)
      
      const editor = screen.getByRole('textbox')
      await user.type(editor, 'New content')
      
      const saveButton = screen.getByTitle(/Save/)
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(expect.stringContaining('New content'))
      })
    })
  })
  
  describe('Keyboard Shortcuts', () => {
    it('saves with Cmd+S', async () => {
      const user = userEvent.setup()
      render(<ChordProEditor onSave={mockOnSave} />)
      
      await user.keyboard('{Meta>}s{/Meta}')
      
      expect(mockOnSave).toHaveBeenCalled()
    })
    
    it('toggles preview with Cmd+P', async () => {
      const user = userEvent.setup()
      render(<ChordProEditor />)
      
      expect(screen.getByTestId('preview-panel')).toBeInTheDocument()
      
      await user.keyboard('{Meta>}p{/Meta}')
      
      expect(screen.queryByTestId('preview-panel')).not.toBeInTheDocument()
    })
  })
  
  describe('ChordPro Validation', () => {
    it('shows error for unclosed chord brackets', async () => {
      const user = userEvent.setup()
      render(<ChordProEditor />)
      
      const editor = screen.getByRole('textbox')
      await user.clear(editor)
      await user.type(editor, '[C missing bracket')
      
      await waitFor(() => {
        expect(screen.getByText(/Unclosed chord bracket/)).toBeInTheDocument()
      })
    })
    
    it('shows error for unclosed directives', async () => {
      const user = userEvent.setup()
      render(<ChordProEditor />)
      
      const editor = screen.getByRole('textbox')
      await user.clear(editor)
      await user.type(editor, '{title: Unclosed')
      
      await waitFor(() => {
        expect(screen.getByText(/Unclosed directive/)).toBeInTheDocument()
      })
    })
  })
  
  describe('Accessibility Tests', () => {
    it('has proper ARIA labels', () => {
      render(<ChordProEditor />)
      
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label')
      expect(screen.getByRole('toolbar')).toBeInTheDocument()
    })
    
    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<ChordProEditor />)
      
      await user.tab()
      expect(screen.getByTitle(/Save/)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByTitle(/Transpose/)).toHaveFocus()
    })
  })
})
```

### Phase 9: Integration with Arrangements

```typescript
// src/features/chordpro-editor/components/ChordProEditorModal.tsx

import { Modal } from '@shared/components/modal'
import { useNotification } from '@shared/components/notifications'
import { useArrangementMutations } from '@features/songs/hooks/useArrangementMutations'
import { ChordProEditor } from './ChordProEditor'
import type { Arrangement } from '@features/songs/types'

interface ChordProEditorModalProps {
  isOpen: boolean
  onClose: () => void
  arrangement?: Arrangement
  songId?: string
  songTitle?: string
}

export function ChordProEditorModal({
  isOpen,
  onClose,
  arrangement,
  songId,
  songTitle
}: ChordProEditorModalProps) {
  const { addNotification } = useNotification()
  const { createArrangement, updateArrangement } = useArrangementMutations()
  
  const handleSave = async (content: string) => {
    try {
      if (arrangement) {
        await updateArrangement(arrangement.id, {
          chordProText: content
        })
        addNotification({
          type: 'success',
          title: 'Arrangement Updated',
          message: 'Your changes have been saved'
        })
      } else if (songId) {
        await createArrangement({
          songIds: [songId],
          chordProText: content,
          name: `${songTitle} - ChordPro`,
          difficulty: 'intermediate'
        })
        addNotification({
          type: 'success',
          title: 'Arrangement Created',
          message: 'New arrangement has been created'
        })
      }
      onClose()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: error.message
      })
    }
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="fullscreen"
      title="ChordPro Editor"
      showCloseButton={false}
    >
      <ChordProEditor
        arrangement={arrangement}
        songTitle={songTitle}
        onSave={handleSave}
        onClose={onClose}
      />
    </Modal>
  )
}
```

## Validation Gates

### Level 1: Type Checking and Linting
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Both must pass with zero errors
```

### Level 2: Unit Tests
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Coverage must meet thresholds (70%)
```

### Level 3: Component Tests
```bash
# Test ChordPro editor specifically
npm run test -- ChordProEditor

# Test editor hooks
npm run test -- useChordProEditor

# Test transposition logic
npm run test -- transposition
```

### Level 4: Build Validation
```bash
# Development build
npm run dev
# Verify no console errors

# Production build
npm run build

# Preview production build
npm run preview
# Test all editor features
```

### Level 5: Accessibility Testing
```bash
# Run accessibility tests
npm run test -- a11y

# Manual testing:
# - Keyboard navigation (Tab, Shift+Tab)
# - Screen reader compatibility
# - Focus management
# - ARIA attributes
```

### Level 6: Performance Testing
```bash
# Test with large ChordPro files (>1000 lines)
# - Editor responsiveness < 16ms
# - Preview update < 200ms
# - Memory usage stable
# - No jank during scrolling
```

### Level 7: Integration Testing
```bash
# Test arrangement integration
# - Create new arrangement with editor
# - Update existing arrangement
# - Export to different formats
# - Save and reload
```

## Implementation Checklist

### Core Features
- [ ] CodeMirror 6 integration with React
- [ ] ChordPro syntax highlighting
- [ ] Real-time preview with chordsheetjs
- [ ] Split pane layout with react-resizable-panels
- [ ] Toolbar with common actions
- [ ] Keyboard shortcuts (Cmd+S, Cmd+P, Cmd+T)
- [ ] Error display for invalid ChordPro
- [ ] Debounced preview updates

### Advanced Features
- [ ] Chord transposition
- [ ] Chord palette for quick insertion
- [ ] Section templates (Verse, Chorus, Bridge)
- [ ] Export to PDF/HTML/Plain text
- [ ] Print preview and formatting
- [ ] Theme selection (Light/Dark/Sepia)
- [ ] Synchronized scrolling
- [ ] Auto-save with conflict resolution

### Mobile Support
- [ ] Responsive layout (tabs on mobile)
- [ ] Touch-optimized controls
- [ ] Virtual keyboard optimization
- [ ] Swipe gestures for panels

### Performance
- [ ] Virtual scrolling for large documents
- [ ] Lazy loading of preview
- [ ] Code splitting for editor bundle
- [ ] Memoization of expensive operations
- [ ] Web Worker for parsing (optional)

### Accessibility
- [ ] Full keyboard navigation
- [ ] Screen reader support
- [ ] Focus management
- [ ] ARIA labels and descriptions
- [ ] High contrast mode support

## Common Pitfalls and Solutions

### Pitfall 1: CodeMirror React Re-renders
**Problem**: CodeMirror recreates on every render
**Solution**: Use `useMemo` for extensions and proper React.memo

### Pitfall 2: Preview Scroll Sync
**Problem**: Percentage-based scroll sync breaks with formatted content
**Solution**: Use block-level element tracking

### Pitfall 3: Large Document Performance
**Problem**: Editor slows with files >500 lines
**Solution**: Implement virtual scrolling with @tanstack/react-virtual

### Pitfall 4: ChordPro Parsing Errors
**Problem**: Invalid ChordPro crashes parser
**Solution**: Wrap parsing in try-catch, show user-friendly errors

### Pitfall 5: Mobile Keyboard Issues
**Problem**: Virtual keyboard covers editor
**Solution**: Adjust viewport and use visualViewport API

## Success Metrics

### Performance KPIs
- Initial load: <2s
- Time to interactive: <3s
- Typing latency: <16ms
- Preview update: <200ms
- Save operation: <500ms

### User Experience KPIs
- Error rate: <1%
- Task completion: >95%
- Zero accessibility violations
- Mobile responsive: 100%

## External Resources

### Essential Documentation
- CodeMirror 6 Guide: https://codemirror.net/docs/guide/
- ChordSheetJS API: https://github.com/martijnversluis/ChordSheetJS
- React CodeMirror: https://uiwjs.github.io/react-codemirror/
- Resizable Panels: https://github.com/bvaughn/react-resizable-panels

### Implementation Examples
- CodeMirror Custom Language: https://codemirror.net/examples/lang-package/
- ChordPro Parser Usage: https://github.com/martijnversluis/ChordSheetJS/tree/master/examples
- Split Editor: https://codemirror.net/examples/split/

## Confidence Score: 9/10

This PRP provides comprehensive context for implementing a professional ChordPro editor with:
- Complete type definitions and interfaces
- Detailed component implementations
- Integration with existing codebase patterns
- Comprehensive testing strategy
- Performance optimization techniques
- Accessibility requirements
- Mobile responsive design
- Clear validation gates

The implementation follows the existing vertical slice architecture perfectly and reuses patterns from the current codebase while introducing modern editor capabilities through well-documented libraries.