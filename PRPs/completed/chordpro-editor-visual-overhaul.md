# PRP: ChordPro Editor Visual Overhaul - Style & Responsiveness Enhancement

## Executive Summary

Implement comprehensive visual overhaul for the ChordPro Editor based on the reference repository (https://github.com/Kuebic/hsa-songbook-react/) to enhance styling, responsiveness, and user experience. This PRP focuses on upgrading the existing ChordProEditor implementation with professional design patterns, modern styling, and mobile-first responsive layouts while maintaining all current functionality.

**Confidence Score: 9.5/10** - Very high confidence due to thorough research, existing working implementation to reference, and clear styling patterns identified.

## Critical Context and Documentation

### Reference Implementation
- **Source Repository**: https://github.com/Kuebic/hsa-songbook-react/
- **Live Demo**: Check repository for deployment link
- **Key Features**: Professional chord editor with split-screen layout, real-time preview, syntax highlighting

### Current Implementation Analysis
Based on comprehensive research of `/src/features/arrangements/components/ChordProEditor/`:
- **Main Component**: `index.tsx` - Split-screen editor with responsive design
- **Text Area**: `ChordProTextArea.tsx` - Transparent overlay for input
- **Syntax Highlighter**: `SyntaxHighlighter.tsx` - Real-time highlighting layer
- **Preview Pane**: `PreviewPane.tsx` - ChordSheetJS rendering
- **Styles**: `styles/editor.css` - Minimal current styling

### Design System Documentation
- **Tailwind CSS**: https://tailwindcss.com/docs - Utility-first CSS framework
- **Color System**: https://tailwindcss.com/docs/customizing-colors - Tailwind color palette
- **Responsive Design**: https://tailwindcss.com/docs/responsive-design - Breakpoint system
- **Dark Mode**: https://tailwindcss.com/docs/dark-mode - Dark mode implementation

### ChordSheetJS Documentation
- **Main Docs**: https://github.com/martijnversluis/ChordSheetJS
- **HTML Formatter**: https://github.com/martijnversluis/ChordSheetJS#html-table-formatter
- **CSS Classes**: https://github.com/martijnversluis/ChordSheetJS/blob/master/src/formatter/html_table_formatter.js

## Vertical Slice Architecture

### Feature Boundaries
This visual overhaul will be implemented within the existing vertical slice at `/src/features/arrangements/components/ChordProEditor/` with the following structure:

```
src/features/arrangements/components/ChordProEditor/
├── index.tsx                    # Enhanced main editor (UPDATE)
├── ChordProTextArea.tsx         # Text input layer (UPDATE)
├── SyntaxHighlighter.tsx        # Syntax highlighting (UPDATE)
├── PreviewPane.tsx              # Preview rendering (UPDATE)
├── styles/
│   ├── editor.css              # Core editor styles (UPDATE)
│   ├── themes.css              # NEW: Theme definitions
│   ├── responsive.css         # NEW: Responsive layouts
│   ├── animations.css         # NEW: Transitions and animations
│   └── print.css              # NEW: Print optimization
├── components/
│   ├── EditorSplitter.tsx     # NEW: Resizable divider component
│   ├── MobileToggle.tsx       # NEW: Mobile view toggle
│   └── ThemeSelector.tsx      # NEW: Theme switcher
└── hooks/
    ├── useEditorTheme.ts       # NEW: Theme management
    ├── useResponsiveLayout.ts # NEW: Responsive behavior
    └── useEditorAnimation.ts  # NEW: Animation controls
```

### Dependencies from Other Features
- `@shared/styles/colors.ts` - Centralized color tokens
- `@shared/hooks/useMediaQuery` - Responsive utilities
- `@shared/components/Button` - Consistent button styling
- `@features/monitoring` - Performance tracking

## Implementation Blueprint

### Phase 1: Design System & Color Tokens

#### Task 1.1: Create Centralized Color System
```typescript
// src/shared/styles/colors.ts
export const colors = {
  // Primary palette
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },
  
  // Gray scale for dark mode
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  },
  
  // Semantic colors
  chord: {
    light: '#2563eb',  // Blue for light mode
    dark: '#60a5fa',   // Lighter blue for dark mode
    hover: '#93c5fd'   // Hover state
  },
  
  directive: {
    light: '#7c3aed',  // Purple
    dark: '#a78bfa'    // Light purple
  },
  
  section: {
    light: '#059669',  // Green
    dark: '#34d399'    // Light green
  },
  
  comment: {
    light: '#6b7280',  // Gray
    dark: '#9ca3af'    // Light gray
  },
  
  error: {
    light: '#dc2626',
    dark: '#f87171'
  }
}
```

#### Task 1.2: Define CSS Variables for Theming
```css
/* src/features/arrangements/components/ChordProEditor/styles/themes.css */

/* Light Theme */
:root {
  /* Editor backgrounds */
  --editor-bg: #ffffff;
  --editor-toolbar-bg: #f9fafb;
  --editor-preview-bg: #ffffff;
  --editor-divider: #e5e7eb;
  
  /* Text colors */
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  
  /* Syntax highlighting */
  --syntax-chord: #2563eb;
  --syntax-directive: #7c3aed;
  --syntax-section: #059669;
  --syntax-comment: #6b7280;
  --syntax-error: #dc2626;
  
  /* Interactive elements */
  --selection-bg: rgba(59, 130, 246, 0.3);
  --focus-ring: #3b82f6;
  --hover-bg: #f3f4f6;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* Dark Theme */
[data-theme="dark"] {
  --editor-bg: #1f2937;
  --editor-toolbar-bg: #111827;
  --editor-preview-bg: #0f172a;
  --editor-divider: #374151;
  
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --text-tertiary: #9ca3af;
  
  --syntax-chord: #60a5fa;
  --syntax-directive: #a78bfa;
  --syntax-section: #34d399;
  --syntax-comment: #9ca3af;
  --syntax-error: #f87171;
  
  --selection-bg: rgba(96, 165, 250, 0.3);
  --focus-ring: #60a5fa;
  --hover-bg: #374151;
  
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.2);
}

/* Stage Theme (High Contrast for Performance) */
[data-theme="stage"] {
  --editor-bg: #000000;
  --editor-toolbar-bg: #0a0a0a;
  --editor-preview-bg: #000000;
  --editor-divider: #333333;
  
  --text-primary: #ffffff;
  --text-secondary: #e0e0e0;
  --text-tertiary: #a0a0a0;
  
  --syntax-chord: #ffeb3b;
  --syntax-directive: #ff9800;
  --syntax-section: #4caf50;
  --syntax-comment: #757575;
  --syntax-error: #f44336;
  
  --selection-bg: rgba(255, 235, 59, 0.4);
  --focus-ring: #ffeb3b;
  --hover-bg: #1a1a1a;
}
```

### Phase 2: Core Editor Styling Enhancement

#### Task 2.1: Update Main Editor Container
```typescript
// src/features/arrangements/components/ChordProEditor/index.tsx
import './styles/themes.css'
import './styles/responsive.css'
import './styles/animations.css'
import { useEditorTheme } from './hooks/useEditorTheme'
import { useResponsiveLayout } from './hooks/useResponsiveLayout'

export function ChordProEditor({ 
  initialContent = '', 
  onChange, 
  onSave,
  theme = 'light' 
}: ChordProEditorProps) {
  const { currentTheme, setTheme } = useEditorTheme(theme)
  const { isMobile, isTablet } = useResponsiveLayout()
  const [showPreview, setShowPreview] = useState(!isMobile)
  
  return (
    <div 
      className="chord-editor-enhanced"
      data-theme={currentTheme}
      data-device={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
    >
      {/* Toolbar with theme selector */}
      <div className="chord-editor-toolbar">
        <div className="toolbar-left">
          <button className="btn-primary" onClick={onSave}>
            <SaveIcon className="w-4 h-4" />
            <span>Save</span>
          </button>
          <button className="btn-secondary">
            <MusicIcon className="w-4 h-4" />
            <span>Transpose</span>
          </button>
        </div>
        
        <div className="toolbar-center">
          {isMobile && (
            <MobileToggle 
              showPreview={showPreview}
              onToggle={() => setShowPreview(!showPreview)}
            />
          )}
        </div>
        
        <div className="toolbar-right">
          <ThemeSelector 
            currentTheme={currentTheme}
            onThemeChange={setTheme}
          />
        </div>
      </div>
      
      {/* Main editor content */}
      <div className="chord-editor-content">
        {/* Editor pane */}
        <div 
          className={cn(
            "chord-editor-pane",
            isMobile && showPreview && "mobile-hidden"
          )}
        >
          <div className="editor-layers">
            <div className="editor-background" />
            <SyntaxHighlighter 
              content={content}
              theme={currentTheme}
              className="editor-syntax"
            />
            <ChordProTextArea 
              value={content}
              onChange={handleChange}
              className="editor-input"
            />
          </div>
          
          <div className="editor-status">
            <span>Line {cursorLine}:{cursorCol}</span>
            <span>{content.length} characters</span>
          </div>
        </div>
        
        {/* Resizable divider (desktop only) */}
        {!isMobile && (
          <EditorSplitter 
            onResize={handleResize}
            className="chord-editor-divider"
          />
        )}
        
        {/* Preview pane */}
        <div 
          className={cn(
            "chord-preview-pane",
            isMobile && !showPreview && "mobile-hidden"
          )}
        >
          <PreviewPane 
            content={debouncedContent}
            theme={currentTheme}
          />
        </div>
      </div>
    </div>
  )
}
```

#### Task 2.2: Enhanced Editor Styles
```css
/* src/features/arrangements/components/ChordProEditor/styles/editor.css */

/* Main container */
.chord-editor-enhanced {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--editor-bg);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Toolbar */
.chord-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--editor-toolbar-bg);
  border-bottom: 1px solid var(--editor-divider);
  box-shadow: var(--shadow-sm);
  min-height: 56px;
  gap: 1rem;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

/* Buttons */
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  cursor: pointer;
}

.btn-primary {
  background: var(--focus-ring);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--hover-bg);
  color: var(--text-primary);
  border-color: var(--editor-divider);
}

.btn-secondary:hover {
  background: var(--editor-divider);
}

/* Content area */
.chord-editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* Editor pane */
.chord-editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

/* Editor layers */
.editor-layers {
  flex: 1;
  position: relative;
  overflow: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 16px;
  line-height: 1.5;
}

.editor-background {
  position: absolute;
  inset: 0;
  background: var(--editor-bg);
  z-index: 0;
}

.editor-syntax {
  position: absolute;
  inset: 0;
  padding: 1rem;
  pointer-events: none;
  z-index: 1;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: hidden;
}

.editor-input {
  position: absolute;
  inset: 0;
  padding: 1rem;
  background: transparent;
  color: transparent;
  caret-color: var(--text-primary);
  resize: none;
  border: none;
  outline: none;
  z-index: 2;
  font: inherit;
  white-space: pre-wrap;
  word-break: break-word;
}

.editor-input::selection {
  background: var(--selection-bg);
  color: transparent;
}

/* Status bar */
.editor-status {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: var(--editor-toolbar-bg);
  border-top: 1px solid var(--editor-divider);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Divider */
.chord-editor-divider {
  width: 4px;
  background: var(--editor-divider);
  cursor: col-resize;
  position: relative;
  transition: background 0.2s ease;
}

.chord-editor-divider:hover {
  background: var(--focus-ring);
}

.chord-editor-divider::before {
  content: '';
  position: absolute;
  left: -2px;
  right: -2px;
  top: 0;
  bottom: 0;
}

/* Preview pane */
.chord-preview-pane {
  flex: 1;
  overflow: auto;
  background: var(--editor-preview-bg);
  padding: 1.5rem;
  min-width: 0;
}

/* Syntax highlighting */
.syntax-chord {
  color: var(--syntax-chord);
  font-weight: 600;
  background: rgba(59, 130, 246, 0.1);
  padding: 0 2px;
  border-radius: 2px;
}

.syntax-directive {
  color: var(--syntax-directive);
  font-weight: 500;
}

.syntax-section {
  color: var(--syntax-section);
  font-style: italic;
  font-size: 1.1em;
  margin: 0.5em 0;
}

.syntax-comment {
  color: var(--syntax-comment);
  font-style: italic;
  opacity: 0.8;
}

.syntax-error {
  color: var(--syntax-error);
  text-decoration: wavy underline;
  text-decoration-color: var(--syntax-error);
}

/* Focus states */
.chord-editor-enhanced *:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

/* Scrollbar styling */
.editor-layers::-webkit-scrollbar,
.chord-preview-pane::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.editor-layers::-webkit-scrollbar-track,
.chord-preview-pane::-webkit-scrollbar-track {
  background: var(--hover-bg);
  border-radius: 4px;
}

.editor-layers::-webkit-scrollbar-thumb,
.chord-preview-pane::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 4px;
}

.editor-layers::-webkit-scrollbar-thumb:hover,
.chord-preview-pane::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
```

### Phase 3: Responsive Design Implementation

#### Task 3.1: Mobile-First Responsive Layouts
```css
/* src/features/arrangements/components/ChordProEditor/styles/responsive.css */

/* Mobile styles (default) */
@media screen and (max-width: 767px) {
  .chord-editor-content {
    position: relative;
  }
  
  .chord-editor-pane,
  .chord-preview-pane {
    position: absolute;
    inset: 0;
    width: 100%;
    transition: transform 0.3s ease-out, opacity 0.3s ease;
  }
  
  .chord-editor-divider {
    display: none;
  }
  
  /* Mobile toggle animation */
  .mobile-hidden {
    transform: translateX(-100%);
    opacity: 0;
    pointer-events: none;
  }
  
  [data-device="mobile"] .chord-editor-pane {
    transform: translateX(0);
  }
  
  [data-device="mobile"] .chord-preview-pane {
    transform: translateX(100%);
  }
  
  [data-device="mobile"] .chord-editor-pane.mobile-hidden {
    transform: translateX(-100%);
  }
  
  [data-device="mobile"] .chord-preview-pane.mobile-hidden {
    transform: translateX(100%);
  }
  
  /* Reduce font sizes on mobile */
  .editor-layers {
    font-size: 14px;
  }
  
  .chord-editor-toolbar {
    padding: 0.5rem;
    min-height: 48px;
  }
  
  .btn-primary,
  .btn-secondary {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }
  
  /* Hide button text on mobile, show only icons */
  .btn-primary span,
  .btn-secondary span {
    display: none;
  }
  
  /* Mobile preview styling */
  .chord-preview-pane {
    padding: 1rem;
  }
  
  /* Adjust chord sheet for mobile */
  .chord-sheet-content {
    font-size: 0.875rem;
  }
  
  .chord-sheet-content .chord {
    font-size: 0.75rem;
  }
}

/* Tablet styles */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  .chord-editor-content {
    flex-direction: row;
  }
  
  .chord-editor-pane,
  .chord-preview-pane {
    position: relative;
    transform: none !important;
    opacity: 1 !important;
  }
  
  .chord-editor-divider {
    display: block;
  }
  
  .editor-layers {
    font-size: 15px;
  }
  
  /* Show button text on tablet */
  .btn-primary span,
  .btn-secondary span {
    display: inline;
  }
}

/* Desktop styles */
@media screen and (min-width: 1024px) {
  .chord-editor-enhanced {
    max-width: 1920px;
    margin: 0 auto;
  }
  
  .chord-editor-content {
    flex-direction: row;
  }
  
  .chord-editor-pane,
  .chord-preview-pane {
    position: relative;
    transform: none !important;
    opacity: 1 !important;
  }
  
  .chord-editor-divider {
    display: block;
  }
  
  .editor-layers {
    font-size: 16px;
  }
  
  .chord-preview-pane {
    padding: 2rem;
  }
  
  /* Wider toolbar on desktop */
  .chord-editor-toolbar {
    padding: 1rem 1.5rem;
  }
}

/* Large desktop */
@media screen and (min-width: 1536px) {
  .chord-editor-enhanced {
    max-width: 2560px;
  }
  
  .editor-layers {
    font-size: 18px;
  }
  
  .chord-preview-pane {
    padding: 3rem;
  }
}

/* Landscape mobile */
@media screen and (max-width: 767px) and (orientation: landscape) {
  .chord-editor-toolbar {
    min-height: 40px;
    padding: 0.25rem 0.5rem;
  }
  
  .editor-status {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }
}

/* Print styles */
@media print {
  .chord-editor-toolbar,
  .chord-editor-divider,
  .editor-status,
  .chord-editor-pane {
    display: none !important;
  }
  
  .chord-preview-pane {
    position: static !important;
    width: 100% !important;
    padding: 0 !important;
    background: white !important;
    color: black !important;
  }
  
  .chord-sheet-content {
    font-size: 12pt !important;
    line-height: 1.4 !important;
  }
  
  .chord-sheet-content .chord {
    color: black !important;
    font-weight: bold !important;
  }
}
```

#### Task 3.2: Responsive Layout Hook
```typescript
// src/features/arrangements/components/ChordProEditor/hooks/useResponsiveLayout.ts
import { useState, useEffect } from 'react'

interface ResponsiveLayout {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLandscape: boolean
  viewportWidth: number
  viewportHeight: number
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [layout, setLayout] = useState<ResponsiveLayout>(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      isLandscape: width > height,
      viewportWidth: width,
      viewportHeight: height
    }
  })
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const width = window.innerWidth
        const height = window.innerHeight
        
        setLayout({
          isMobile: width < 768,
          isTablet: width >= 768 && width < 1024,
          isDesktop: width >= 1024,
          isLandscape: width > height,
          viewportWidth: width,
          viewportHeight: height
        })
      }, 150) // Debounce resize events
    }
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    // Handle virtual keyboard on mobile
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', handleResize)
    }
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      window.visualViewport?.removeEventListener('resize', handleResize)
    }
  }, [])
  
  return layout
}
```

### Phase 4: Animation & Transitions

#### Task 4.1: Animation Styles
```css
/* src/features/arrangements/components/ChordProEditor/styles/animations.css */

/* Smooth transitions */
.chord-editor-enhanced * {
  transition-property: none;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}

.chord-editor-enhanced *:where(:not(.no-transition)) {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
}

/* Slide animations for mobile */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Mobile pane transitions */
[data-device="mobile"] .chord-editor-pane,
[data-device="mobile"] .chord-preview-pane {
  animation-duration: 0.3s;
  animation-timing-function: ease-out;
  animation-fill-mode: both;
}

[data-device="mobile"] .chord-editor-pane:not(.mobile-hidden) {
  animation-name: slideIn;
  animation-direction: reverse;
}

[data-device="mobile"] .chord-preview-pane:not(.mobile-hidden) {
  animation-name: slideIn;
}

/* Loading states */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Validation message animation */
@keyframes validationSlide {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.validation-message {
  animation: validationSlide 0.3s ease-out;
}

/* Focus ring animation */
@keyframes focusRing {
  0% {
    box-shadow: 0 0 0 0 var(--focus-ring);
  }
  100% {
    box-shadow: 0 0 0 4px transparent;
  }
}

.chord-editor-enhanced *:focus-visible {
  animation: focusRing 0.4s ease-out;
}

/* Button hover effects */
.btn-primary,
.btn-secondary {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover,
.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active,
.btn-secondary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

/* Resizer hover effect */
.chord-editor-divider {
  position: relative;
  overflow: hidden;
}

.chord-editor-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 40px;
  background: var(--focus-ring);
  transform: translate(-50%, -50%) scaleY(0);
  transition: transform 0.2s ease;
  border-radius: 1px;
}

.chord-editor-divider:hover::after {
  transform: translate(-50%, -50%) scaleY(1);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .chord-editor-enhanced *,
  .chord-editor-enhanced *::before,
  .chord-editor-enhanced *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Smooth scrolling */
.editor-layers,
.chord-preview-pane {
  scroll-behavior: smooth;
}

/* Theme transition */
.chord-editor-enhanced {
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}

.chord-editor-toolbar,
.editor-status {
  transition: background-color 0.3s ease-in-out, border-color 0.3s ease-in-out;
}

/* Syntax highlighting transitions */
.syntax-chord,
.syntax-directive,
.syntax-section,
.syntax-comment {
  transition: color 0.3s ease, background-color 0.3s ease;
}
```

### Phase 5: Enhanced Components

#### Task 5.1: Mobile Toggle Component
```typescript
// src/features/arrangements/components/ChordProEditor/components/MobileToggle.tsx
import React from 'react'
import { Edit3, Eye } from 'lucide-react'

interface MobileToggleProps {
  showPreview: boolean
  onToggle: () => void
}

export const MobileToggle: React.FC<MobileToggleProps> = ({ 
  showPreview, 
  onToggle 
}) => {
  return (
    <div className="mobile-toggle-container">
      <button
        onClick={onToggle}
        className="mobile-toggle-btn"
        aria-label={showPreview ? 'Show editor' : 'Show preview'}
      >
        <div className="toggle-indicator">
          <span 
            className={`toggle-option ${!showPreview ? 'active' : ''}`}
          >
            <Edit3 size={16} />
            <span>Edit</span>
          </span>
          <span 
            className={`toggle-option ${showPreview ? 'active' : ''}`}
          >
            <Eye size={16} />
            <span>Preview</span>
          </span>
        </div>
      </button>
    </div>
  )
}

// Styles for mobile toggle
const mobileToggleStyles = `
.mobile-toggle-container {
  display: inline-flex;
  padding: 2px;
  background: var(--hover-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--editor-divider);
}

.mobile-toggle-btn {
  display: flex;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
}

.toggle-indicator {
  display: flex;
  gap: 2px;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.toggle-option.active {
  background: var(--focus-ring);
  color: white;
}

.toggle-option:not(.active):hover {
  background: var(--editor-bg);
  color: var(--text-primary);
}
`
```

#### Task 5.2: Theme Selector Component
```typescript
// src/features/arrangements/components/ChordProEditor/components/ThemeSelector.tsx
import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'stage'

interface ThemeSelectorProps {
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange
}) => {
  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={16} />, label: 'Light' },
    { value: 'dark', icon: <Moon size={16} />, label: 'Dark' },
    { value: 'stage', icon: <Monitor size={16} />, label: 'Stage' }
  ]
  
  return (
    <div className="theme-selector">
      {themes.map(theme => (
        <button
          key={theme.value}
          onClick={() => onThemeChange(theme.value)}
          className={`theme-btn ${currentTheme === theme.value ? 'active' : ''}`}
          aria-label={`Switch to ${theme.label} theme`}
          title={theme.label}
        >
          {theme.icon}
        </button>
      ))}
    </div>
  )
}

// Styles for theme selector
const themeSelectorStyles = `
.theme-selector {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--hover-bg);
  border-radius: 0.5rem;
}

.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-btn:hover {
  background: var(--editor-bg);
  color: var(--text-primary);
}

.theme-btn.active {
  background: var(--focus-ring);
  color: white;
  border-color: var(--focus-ring);
}
`
```

#### Task 5.3: Editor Splitter Component
```typescript
// src/features/arrangements/components/ChordProEditor/components/EditorSplitter.tsx
import React, { useState, useCallback, useEffect } from 'react'

interface EditorSplitterProps {
  onResize?: (leftWidth: number) => void
  minWidth?: number
  maxWidth?: number
  className?: string
}

export const EditorSplitter: React.FC<EditorSplitterProps> = ({
  onResize,
  minWidth = 200,
  maxWidth = 80,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
    const leftPane = e.currentTarget.previousSibling as HTMLElement
    if (leftPane) {
      setStartWidth(leftPane.offsetWidth)
    }
    e.preventDefault()
  }, [])
  
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
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])
  
  return (
    <div
      className={`editor-splitter ${className} ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize editor panes"
      tabIndex={0}
    >
      <div className="splitter-handle">
        <span className="splitter-dots">⋮</span>
      </div>
    </div>
  )
}

// Styles for splitter
const splitterStyles = `
.editor-splitter {
  width: 4px;
  background: var(--editor-divider);
  cursor: col-resize;
  position: relative;
  transition: background 0.2s ease;
  user-select: none;
}

.editor-splitter:hover,
.editor-splitter.dragging {
  background: var(--focus-ring);
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
.editor-splitter.dragging .splitter-dots {
  opacity: 1;
}

/* Touch target for mobile/tablet */
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
`
```

### Phase 6: Syntax Highlighter Enhancement

#### Task 6.1: Enhanced Syntax Highlighting
```typescript
// src/features/arrangements/components/ChordProEditor/SyntaxHighlighter.tsx
import React, { useMemo } from 'react'
import { highlightChordPro } from '../utils/syntaxHighlight'

interface SyntaxHighlighterProps {
  content: string
  theme?: 'light' | 'dark' | 'stage'
  className?: string
  style?: React.CSSProperties
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({
  content,
  theme = 'light',
  className = '',
  style = {}
}) => {
  const highlightedContent = useMemo(() => {
    return highlightChordPro(content, theme)
  }, [content, theme])
  
  return (
    <div 
      className={`syntax-highlighter ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: highlightedContent }}
      aria-hidden="true"
    />
  )
}

// Utility function for syntax highlighting
export function highlightChordPro(text: string, theme: string): string {
  // Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // Highlight patterns
  const patterns = [
    // Directives: {title: Song Name}
    {
      regex: /\{([^:}]+):([^}]*)\}/g,
      replacement: '<span class="syntax-directive">{$1:$2}</span>'
    },
    // Environment directives: {start_of_chorus}, {end_of_chorus}
    {
      regex: /\{(start_of_|end_of_|soc|eoc|sov|eov|sob|eob|sot|eot)([^}]*)\}/g,
      replacement: '<span class="syntax-directive">{$1$2}</span>'
    },
    // Chords: [C], [Am7], [F#m]
    {
      regex: /\[([^\]]+)\]/g,
      replacement: '<span class="syntax-chord">[$1]</span>'
    },
    // Section headers: Verse 1:, Chorus:, etc.
    {
      regex: /^(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Interlude)(\s+\d+)?:/gm,
      replacement: '<span class="syntax-section">$1$2:</span>'
    },
    // Comments: # This is a comment
    {
      regex: /^#(.*)$/gm,
      replacement: '<span class="syntax-comment">#$1</span>'
    },
    // Annotations: [*annotation text]
    {
      regex: /\[\*([^\]]+)\]/g,
      replacement: '<span class="syntax-annotation">[*$1]</span>'
    }
  ]
  
  patterns.forEach(({ regex, replacement }) => {
    html = html.replace(regex, replacement)
  })
  
  return html
}
```

### Phase 7: Preview Pane Enhancement

#### Task 7.1: Enhanced Preview Pane
```typescript
// src/features/arrangements/components/ChordProEditor/PreviewPane.tsx
import React, { useEffect, useRef } from 'react'
import ChordSheetJS from 'chordsheetjs'
import './styles/preview.css'

interface PreviewPaneProps {
  content: string
  theme?: 'light' | 'dark' | 'stage'
  className?: string
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ 
  content, 
  theme = 'light',
  className = '' 
}) => {
  const previewRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!previewRef.current) return
    
    try {
      const parser = new ChordSheetJS.ChordProParser()
      const song = parser.parse(content)
      
      const formatter = new ChordSheetJS.HtmlTableFormatter()
      const html = formatter.format(song)
      
      previewRef.current.innerHTML = `
        <div class="chord-sheet-header">
          ${song.title ? `<h1 class="song-title">${song.title}</h1>` : ''}
          ${song.artist ? `<p class="song-artist">${song.artist}</p>` : ''}
          ${song.key ? `<p class="song-key">Key: ${song.key}</p>` : ''}
        </div>
        <div class="chord-sheet-content">
          ${html}
        </div>
      `
    } catch (error) {
      previewRef.current.innerHTML = `
        <div class="preview-error">
          <p>Error parsing ChordPro content:</p>
          <pre>${error.message}</pre>
        </div>
      `
    }
  }, [content])
  
  return (
    <div 
      ref={previewRef}
      className={`preview-pane ${className}`}
      data-theme={theme}
    />
  )
}
```

#### Task 7.2: Preview Pane Styles
```css
/* src/features/arrangements/components/ChordProEditor/styles/preview.css */

.preview-pane {
  height: 100%;
  overflow: auto;
  padding: 1.5rem;
  background: var(--editor-preview-bg);
  color: var(--text-primary);
  font-family: system-ui, -apple-system, sans-serif;
}

/* Header styles */
.chord-sheet-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--editor-divider);
}

.song-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.song-artist {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
  color: var(--text-secondary);
}

.song-key {
  font-size: 1rem;
  margin: 0;
  color: var(--text-tertiary);
  font-weight: 500;
}

/* Chord sheet content */
.chord-sheet-content {
  font-size: 1rem;
  line-height: 1.8;
}

.chord-sheet-content table {
  border-collapse: collapse;
  width: 100%;
}

.chord-sheet-content td {
  padding: 0;
  vertical-align: bottom;
}

/* Chord styling */
.chord-sheet-content .chord {
  color: var(--syntax-chord);
  font-weight: 600;
  font-size: 0.875em;
  font-family: 'Courier New', monospace;
  display: inline-block;
  margin-bottom: 2px;
}

/* Lyrics styling */
.chord-sheet-content .lyrics {
  color: var(--text-primary);
  white-space: pre-wrap;
}

/* Section styling */
.chord-sheet-content .section {
  margin: 1.5rem 0;
}

.chord-sheet-content .section-label {
  font-weight: 600;
  color: var(--syntax-section);
  font-style: italic;
  margin-bottom: 0.5rem;
  font-size: 1.1em;
}

/* Comment styling */
.chord-sheet-content .comment {
  color: var(--syntax-comment);
  font-style: italic;
  margin: 0.5rem 0;
  opacity: 0.8;
}

/* Error display */
.preview-error {
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.375rem;
  color: var(--syntax-error);
}

.preview-error pre {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  white-space: pre-wrap;
}

/* Mobile adjustments */
@media (max-width: 767px) {
  .preview-pane {
    padding: 1rem;
  }
  
  .song-title {
    font-size: 1.5rem;
  }
  
  .song-artist {
    font-size: 1.125rem;
  }
  
  .chord-sheet-content {
    font-size: 0.875rem;
  }
  
  .chord-sheet-content .chord {
    font-size: 0.75em;
  }
}

/* Print optimization */
@media print {
  .preview-pane {
    padding: 0;
    background: white;
    color: black;
  }
  
  .chord-sheet-content .chord {
    color: black;
    font-weight: bold;
  }
  
  .chord-sheet-header {
    border-bottom-color: black;
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// src/features/arrangements/components/ChordProEditor/__tests__/ChordProEditor.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChordProEditor } from '../index'

describe('ChordProEditor Visual Overhaul', () => {
  describe('Theme System', () => {
    it('applies light theme by default', () => {
      const { container } = render(<ChordProEditor />)
      expect(container.firstChild).toHaveAttribute('data-theme', 'light')
    })
    
    it('switches between themes', async () => {
      const { container } = render(<ChordProEditor />)
      const darkThemeBtn = screen.getByLabelText('Switch to Dark theme')
      
      fireEvent.click(darkThemeBtn)
      await waitFor(() => {
        expect(container.firstChild).toHaveAttribute('data-theme', 'dark')
      })
    })
    
    it('persists theme selection', () => {
      render(<ChordProEditor theme="stage" />)
      expect(screen.getByTestId('editor-container')).toHaveAttribute('data-theme', 'stage')
    })
  })
  
  describe('Responsive Layout', () => {
    it('shows mobile layout on small screens', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375)
      const { container } = render(<ChordProEditor />)
      
      expect(container.firstChild).toHaveAttribute('data-device', 'mobile')
      expect(screen.getByLabelText(/Show preview/)).toBeInTheDocument()
    })
    
    it('shows desktop layout on large screens', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1920)
      const { container } = render(<ChordProEditor />)
      
      expect(container.firstChild).toHaveAttribute('data-device', 'desktop')
      expect(screen.queryByLabelText(/Show preview/)).not.toBeInTheDocument()
    })
    
    it('toggles between editor and preview on mobile', async () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375)
      render(<ChordProEditor />)
      
      const toggleBtn = screen.getByLabelText(/Show preview/)
      fireEvent.click(toggleBtn)
      
      await waitFor(() => {
        expect(screen.getByTestId('preview-pane')).not.toHaveClass('mobile-hidden')
        expect(screen.getByTestId('editor-pane')).toHaveClass('mobile-hidden')
      })
    })
  })
  
  describe('Syntax Highlighting', () => {
    it('highlights chords correctly', () => {
      render(<ChordProEditor initialContent="[C]Hello [G]World" />)
      
      const highlighted = screen.getByTestId('syntax-highlighter')
      expect(highlighted.innerHTML).toContain('syntax-chord')
    })
    
    it('highlights directives correctly', () => {
      render(<ChordProEditor initialContent="{title: Test Song}" />)
      
      const highlighted = screen.getByTestId('syntax-highlighter')
      expect(highlighted.innerHTML).toContain('syntax-directive')
    })
    
    it('updates highlighting on content change', async () => {
      const { rerender } = render(<ChordProEditor initialContent="[C]Test" />)
      
      rerender(<ChordProEditor initialContent="[Am]Updated" />)
      
      await waitFor(() => {
        const highlighted = screen.getByTestId('syntax-highlighter')
        expect(highlighted.innerHTML).toContain('[Am]')
      })
    })
  })
  
  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ChordProEditor />)
      
      expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
      expect(screen.getByLabelText(/Resize editor panes/)).toBeInTheDocument()
    })
    
    it('supports keyboard navigation', async () => {
      render(<ChordProEditor />)
      
      const editor = screen.getByRole('textbox')
      editor.focus()
      
      expect(document.activeElement).toBe(editor)
    })
    
    it('respects prefers-reduced-motion', () => {
      const mockMatchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
      
      vi.spyOn(window, 'matchMedia').mockImplementation(mockMatchMedia)
      
      const { container } = render(<ChordProEditor />)
      const styles = getComputedStyle(container.firstChild as Element)
      
      expect(styles.getPropertyValue('animation-duration')).toBe('0.01ms')
    })
  })
  
  describe('Performance', () => {
    it('debounces preview updates', async () => {
      const onChangeSpy = vi.fn()
      render(<ChordProEditor onChange={onChangeSpy} />)
      
      const editor = screen.getByRole('textbox')
      
      // Type multiple characters quickly
      fireEvent.change(editor, { target: { value: 'T' } })
      fireEvent.change(editor, { target: { value: 'Te' } })
      fireEvent.change(editor, { target: { value: 'Tes' } })
      fireEvent.change(editor, { target: { value: 'Test' } })
      
      // Should only call onChange once after debounce
      await waitFor(() => {
        expect(onChangeSpy).toHaveBeenCalledTimes(1)
        expect(onChangeSpy).toHaveBeenCalledWith('Test')
      }, { timeout: 500 })
    })
    
    it('handles large documents efficiently', () => {
      const largeContent = Array(1000).fill('[C]Line of text\n').join('')
      const startTime = performance.now()
      
      render(<ChordProEditor initialContent={largeContent} />)
      
      const renderTime = performance.now() - startTime
      expect(renderTime).toBeLessThan(1000) // Should render in less than 1 second
    })
  })
})
```

## Validation Gates

### Level 1: Type Checking and Linting
```bash
# Type checking must pass
npm run type-check

# Linting must pass
npm run lint

# CSS validation
npx stylelint "src/**/*.css"
```

### Level 2: Unit Tests
```bash
# Run all tests
npm run test

# Run visual overhaul specific tests
npm run test -- ChordProEditor

# Test coverage must meet threshold (80%)
npm run test:coverage
```

### Level 3: Visual Regression Testing
```bash
# Capture baseline screenshots
npm run test:visual:baseline

# Run visual regression tests
npm run test:visual

# Review visual diffs
npm run test:visual:review
```

### Level 4: Responsive Design Testing
```bash
# Test on different viewports
npm run test:responsive

# Manual testing checklist:
# - [ ] Mobile portrait (375x667)
# - [ ] Mobile landscape (667x375)
# - [ ] Tablet (768x1024)
# - [ ] Desktop (1920x1080)
# - [ ] 4K (3840x2160)
```

### Level 5: Performance Testing
```bash
# Build and analyze bundle
npm run build
npm run analyze

# Performance metrics:
# - First Contentful Paint < 1.5s
# - Time to Interactive < 3s
# - Bundle size < 250KB
# - Lighthouse score > 90
```

### Level 6: Accessibility Testing
```bash
# Run accessibility tests
npm run test:a11y

# Manual testing:
# - [ ] Keyboard navigation works
# - [ ] Screen reader announces correctly
# - [ ] Color contrast meets WCAG AA
# - [ ] Focus indicators visible
# - [ ] Reduced motion respected
```

### Level 7: Cross-browser Testing
```bash
# Test in different browsers:
# - [ ] Chrome (latest)
# - [ ] Firefox (latest)
# - [ ] Safari (latest)
# - [ ] Edge (latest)
# - [ ] Mobile Safari (iOS)
# - [ ] Chrome Mobile (Android)
```

### Level 8: Integration Testing
```bash
# Test with real ChordPro files
npm run test:integration

# Test data persistence
npm run test:persistence

# Test with backend API
npm run test:e2e
```

## Implementation Checklist

### Phase 1: Design System ✓
- [ ] Create color token system
- [ ] Define CSS variables for themes
- [ ] Implement theme switching logic
- [ ] Add theme persistence to localStorage
- [ ] Test theme transitions

### Phase 2: Core Styling ✓
- [ ] Update main editor container styles
- [ ] Enhance toolbar styling
- [ ] Improve editor layer stacking
- [ ] Fix text area transparency issues
- [ ] Add proper scrollbar styling

### Phase 3: Responsive Design ✓
- [ ] Implement mobile-first CSS
- [ ] Add tablet breakpoints
- [ ] Create mobile toggle component
- [ ] Add responsive font sizing
- [ ] Test on various devices

### Phase 4: Animations ✓
- [ ] Add smooth transitions
- [ ] Implement mobile slide animations
- [ ] Add loading states
- [ ] Create focus animations
- [ ] Test with reduced motion

### Phase 5: Components ✓
- [ ] Build mobile toggle component
- [ ] Create theme selector
- [ ] Implement editor splitter
- [ ] Add resize functionality
- [ ] Test component interactions

### Phase 6: Syntax Highlighting ✓
- [ ] Enhance highlighting patterns
- [ ] Add theme-aware colors
- [ ] Improve performance
- [ ] Test with complex ChordPro
- [ ] Validate accessibility

### Phase 7: Preview Enhancement ✓
- [ ] Update preview pane styles
- [ ] Add ChordSheetJS styling
- [ ] Implement print styles
- [ ] Add error display
- [ ] Test rendering accuracy

### Phase 8: Testing & Validation ✓
- [ ] Write comprehensive tests
- [ ] Run all validation gates
- [ ] Fix any issues found
- [ ] Document changes
- [ ] Create migration guide

## Success Metrics

### Visual Quality
- Professional, modern appearance matching reference
- Consistent design language across all themes
- Smooth animations and transitions
- Proper contrast ratios (WCAG AA)

### Responsiveness
- Works flawlessly on all device sizes
- Smooth orientation changes
- Proper touch target sizes (44x44px minimum)
- No horizontal scrolling on mobile

### Performance
- Initial render < 100ms
- Theme switch < 50ms
- Smooth 60fps animations
- No layout shifts (CLS < 0.1)

### User Experience
- Intuitive theme switching
- Clear visual feedback
- Accessible to all users
- Print-optimized output

## Migration Guide

### For Developers
1. Update imports to include new style files
2. Replace old theme props with new theme system
3. Update any custom styles to use CSS variables
4. Test thoroughly on all target devices

### For Users
1. Themes now persist across sessions
2. Mobile experience significantly improved
3. New keyboard shortcuts available
4. Print output optimized

## External Resources

### Documentation
- **Tailwind CSS**: https://tailwindcss.com/docs
- **CSS Variables**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **Responsive Design**: https://web.dev/responsive-web-design-basics/
- **Dark Mode**: https://web.dev/prefers-color-scheme/
- **Animations**: https://web.dev/animations-guide/

### Tools
- **Chrome DevTools**: Device emulation for responsive testing
- **Lighthouse**: Performance and accessibility auditing
- **WAVE**: Web accessibility evaluation
- **BrowserStack**: Cross-browser testing

### Reference Implementations
- **GitHub Editor**: https://github.com/features/codespaces
- **CodeMirror**: https://codemirror.net/
- **VS Code Web**: https://vscode.dev/

## Confidence Score: 9.5/10

This PRP provides an extremely comprehensive blueprint for implementing the visual overhaul with:
- Complete design system with themes and tokens
- Detailed responsive design implementation
- Smooth animations and transitions
- Enhanced component architecture
- Comprehensive testing strategy
- Clear validation gates
- Thorough documentation

The implementation follows existing patterns while introducing modern styling practices that will significantly enhance the user experience across all devices.