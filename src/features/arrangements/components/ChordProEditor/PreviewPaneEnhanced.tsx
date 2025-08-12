/**
 * @file PreviewPaneEnhanced.tsx
 * @description Enhanced preview pane with controls, export options, and improved UX
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../../../lib/utils';
import { ChordDisplay } from './ChordDisplay';

// Icons (using simple SVG paths for compatibility)
const ZoomInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="21 21l-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/>
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="21 21l-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const PrintIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 6,2 18,2 18,9"/><path d="6,18H4a2,2 0 0,1-2-2v-5a2,2 0 0,1,2-2H20a2,2 0 0,1,2,2v5a2,2 0 0,1-2,2H18"/><rect x="6" y="14" width="12" height="8"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/><path d="19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

interface ValidationError {
  line: number;
  message: string;
  type: 'error' | 'warning';
}

interface PreviewPaneEnhancedProps {
  content: string;
  transpose?: number;
  fontSize?: number;
  showChords?: boolean;
  theme?: 'light' | 'dark' | 'stage';
  className?: string;
  onTransposeChange?: (transpose: number) => void;
  onFontSizeChange?: (fontSize: number) => void;
  onShowChordsChange?: (showChords: boolean) => void;
  validationErrors?: ValidationError[];
  readOnly?: boolean;
}

export const PreviewPaneEnhanced: React.FC<PreviewPaneEnhancedProps> = ({
  content,
  transpose = 0,
  fontSize = 16,
  showChords = true,
  theme = 'dark',
  className,
  onTransposeChange,
  onFontSizeChange,
  onShowChordsChange,
  validationErrors = [],
  readOnly = false
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [columnLayout, setColumnLayout] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  /**
   * Get theme-specific classes with CSS custom properties
   */
  const getThemeClasses = useCallback(() => {
    const baseClasses = 'h-full flex flex-col transition-colors duration-300';
    
    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'bg-gray-900 text-gray-100');
      case 'stage':
        return cn(baseClasses, 'bg-black text-yellow-100');
      case 'light':
        return cn(baseClasses, 'bg-white text-gray-900');
      default:
        return cn(baseClasses, 'bg-[var(--color-background)] text-[var(--color-foreground)]');
    }
  }, [theme]);

  /**
   * Get toolbar theme classes
   */
  const getToolbarClasses = useCallback(() => {
    const baseClasses = 'border-b p-2 flex items-center justify-between gap-2 transition-colors duration-300';
    
    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'bg-gray-800 border-gray-700');
      case 'stage':
        return cn(baseClasses, 'bg-gray-900 border-yellow-600/20');
      case 'light':
        return cn(baseClasses, 'bg-gray-50 border-gray-200');
      default:
        return cn(baseClasses, 'bg-[var(--color-card)] border-[var(--color-border)]');
    }
  }, [theme]);

  /**
   * Handle zoom controls
   */
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
  }, []);

  /**
   * Handle transpose controls
   */
  const handleTransposeUp = useCallback(() => {
    const newTranspose = Math.min(transpose + 1, 11);
    onTransposeChange?.(newTranspose);
  }, [transpose, onTransposeChange]);

  const handleTransposeDown = useCallback(() => {
    const newTranspose = Math.max(transpose - 1, -11);
    onTransposeChange?.(newTranspose);
  }, [transpose, onTransposeChange]);

  const handleTransposeReset = useCallback(() => {
    onTransposeChange?.(0);
  }, [onTransposeChange]);

  /**
   * Handle font size controls
   */
  const handleFontSizeIncrease = useCallback(() => {
    const newSize = Math.min(fontSize + 2, 32);
    onFontSizeChange?.(newSize);
  }, [fontSize, onFontSizeChange]);

  const handleFontSizeDecrease = useCallback(() => {
    const newSize = Math.max(fontSize - 2, 10);
    onFontSizeChange?.(newSize);
  }, [fontSize, onFontSizeChange]);

  /**
   * Export to PDF (would require html2pdf or similar library)
   */
  const handleExportPDF = useCallback(() => {
    // In real implementation, use html2pdf or similar
    if (printRef.current) {
      window.print();
    }
  }, []);

  /**
   * Export to text
   */
  const handleExportText = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chordpro-song.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content]);

  /**
   * Copy to clipboard
   */
  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      // Could show a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [content]);

  /**
   * Scroll to error line
   */
  const scrollToError = useCallback((lineNumber: number) => {
    // Implementation would depend on how lines are marked in the preview
    console.log('Scroll to line:', lineNumber);
  }, []);

  /**
   * Memoized preview content with enhanced error handling
   */
  const preview = useMemo(() => {
    if (!content.trim()) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center opacity-60">
            <div className="text-4xl mb-4">🎵</div>
            <p className="text-lg mb-2">Preview will appear here</p>
            <p className="text-sm opacity-75">Start typing your ChordPro song...</p>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="flex-1 overflow-auto"
        style={{ 
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          width: `${100 / zoomLevel}%`,
          lineHeight: lineSpacing
        }}
      >
        <div className={cn('p-6', columnLayout && 'columns-2 gap-8')}>
          <ChordDisplay
            content={content}
            transpose={transpose}
            fontSize={fontSize}
            showChords={showChords}
            theme={theme}
          />
        </div>
      </div>
    );
  }, [content, transpose, fontSize, showChords, theme, zoomLevel, lineSpacing, columnLayout]);

  /**
   * Button component for toolbar
   */
  const ToolbarButton: React.FC<{
    onClick: () => void;
    children: React.ReactNode;
    title: string;
    active?: boolean;
    disabled?: boolean;
  }> = ({ onClick, children, title, active = false, disabled = false }) => (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'p-2 rounded transition-colors duration-200 flex items-center gap-1',
        'hover:bg-[var(--color-card-hover)] disabled:opacity-50 disabled:cursor-not-allowed',
        active && 'bg-[var(--color-primary)] text-white'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn(getThemeClasses(), className)}>
      {/* Toolbar */}
      <div className={getToolbarClasses()}>
        {/* Left side controls */}
        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <ToolbarButton onClick={handleZoomOut} title="Zoom out" disabled={zoomLevel <= 0.5}>
            <ZoomOutIcon />
          </ToolbarButton>
          <button
            onClick={handleZoomReset}
            className="px-2 py-1 text-xs rounded hover:bg-[var(--color-card-hover)] min-w-12"
            title="Reset zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <ToolbarButton onClick={handleZoomIn} title="Zoom in" disabled={zoomLevel >= 2}>
            <ZoomInIcon />
          </ToolbarButton>

          <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

          {/* Transpose controls */}
          {!readOnly && (
            <>
              <ToolbarButton onClick={handleTransposeDown} title="Transpose down">
                <span className="text-sm">♭</span>
              </ToolbarButton>
              <button
                onClick={handleTransposeReset}
                className="px-2 py-1 text-xs rounded hover:bg-[var(--color-card-hover)] min-w-8"
                title="Reset transpose"
              >
                {transpose > 0 ? `+${transpose}` : transpose}
              </button>
              <ToolbarButton onClick={handleTransposeUp} title="Transpose up">
                <span className="text-sm">♯</span>
              </ToolbarButton>

              <div className="w-px h-6 bg-[var(--color-border)] mx-1" />
            </>
          )}

          {/* View controls */}
          <ToolbarButton
            onClick={() => onShowChordsChange?.(!showChords)}
            title={showChords ? "Hide chords" : "Show chords"}
            active={showChords}
          >
            {showChords ? <EyeIcon /> : <EyeOffIcon />}
          </ToolbarButton>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1">
          {/* Font size controls */}
          {!readOnly && (
            <>
              <ToolbarButton onClick={handleFontSizeDecrease} title="Decrease font size">
                <span className="text-xs font-bold">A</span>
              </ToolbarButton>
              <span className="text-xs px-1 min-w-8 text-center">{fontSize}px</span>
              <ToolbarButton onClick={handleFontSizeIncrease} title="Increase font size">
                <span className="text-sm font-bold">A</span>
              </ToolbarButton>

              <div className="w-px h-6 bg-[var(--color-border)] mx-1" />
            </>
          )}

          {/* Settings */}
          <ToolbarButton
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
            active={showSettings}
          >
            <SettingsIcon />
          </ToolbarButton>

          {/* Export controls */}
          <ToolbarButton onClick={handleExportPDF} title="Print/Export PDF">
            <PrintIcon />
          </ToolbarButton>
          <ToolbarButton onClick={handleExportText} title="Download as text">
            <DownloadIcon />
          </ToolbarButton>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-[var(--color-border)] p-4 bg-[var(--color-card)]">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block mb-2 font-medium">Line Spacing</label>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                value={lineSpacing}
                onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-xs opacity-70">{lineSpacing}x</span>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={columnLayout}
                  onChange={(e) => setColumnLayout(e.target.checked)}
                />
                <span>Two-column layout</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors Panel */}
      {validationErrors.length > 0 && (
        <div className="border-b border-red-300 bg-red-50 dark:bg-red-900/20 p-2">
          <div className="text-sm text-red-800 dark:text-red-200">
            <div className="font-medium mb-1">
              {validationErrors.length} validation {validationErrors.length === 1 ? 'issue' : 'issues'}:
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="opacity-70">Line {error.line}:</span>
                  <span>{error.message}</span>
                  <button
                    onClick={() => scrollToError(error.line)}
                    className="text-xs underline hover:no-underline"
                  >
                    Go to line
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div ref={previewRef} className="flex-1 flex flex-col min-h-0">
        {preview}
      </div>

      {/* Hidden print container */}
      <div ref={printRef} className="hidden print:block">
        <ChordDisplay
          content={content}
          transpose={transpose}
          fontSize={fontSize}
          showChords={showChords}
          theme="light"
        />
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
