/**
 * @file index.tsx
 * @description Main ChordPro editor component with CodeMirror and split-pane layout
 */

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '../../../../lib/utils';
import { ChordProCodeMirror } from './ChordProCodeMirror';
import { PreviewPane } from './PreviewPane';
import { PreviewPaneEnhanced } from './PreviewPaneEnhanced';
import { useDebounce } from '../../hooks/useDebounce';
import { useEnhancedTextArea } from './hooks/useEnhancedTextArea';
import { validateChordProContent } from './utils/textAreaUtils';
import { StatusBar } from './StatusBar';

export interface ChordProEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  onCancel?: () => void;
  debounceMs?: number;
  fontSize?: number;
  theme?: 'light' | 'dark' | 'stage';
  showPreview?: boolean;
  transpose?: number;
  showChords?: boolean;
  enableChordCompletion?: boolean;
  className?: string;
  height?: number | string;
  showToolbar?: boolean;
  defaultPreviewVisible?: boolean;
  autoFocus?: boolean;
  enableEnhancedFeatures?: boolean;
  readOnly?: boolean;
}

export const ChordProEditor: React.FC<ChordProEditorProps> = ({
  initialContent = '',
  onChange,
  onSave,
  onCancel,
  debounceMs = 300,
  fontSize = 16,
  theme = 'dark',
  showPreview = true,
  transpose = 0,
  showChords = true,
  enableChordCompletion = true,
  className,
  height = 600,
  showToolbar = true,
  defaultPreviewVisible = true,
  autoFocus = false,
  enableEnhancedFeatures = true,
  readOnly = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [splitPosition, setSplitPosition] = useState(() => {
    // Load saved split position from localStorage
    const saved = localStorage.getItem('chordpro-editor-split-position');
    return saved ? parseFloat(saved) : 50;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(showPreview && defaultPreviewVisible);
  const [isMobile, setIsMobile] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState(fontSize);
  const [currentTranspose, setCurrentTranspose] = useState(transpose);
  const [currentShowChords, setCurrentShowChords] = useState(showChords);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Enhanced textarea functionality
  const textAreaEnhanced = useEnhancedTextArea({
    value: content,
    onChange: setContent,
    enableLiveValidation: enableEnhancedFeatures,
    enableMetrics: enableEnhancedFeatures
  });

  // Debounce content for preview updates
  const debouncedContent = useDebounce(content, debounceMs);

  // Get validation errors for preview
  const validationErrors = enableEnhancedFeatures && textAreaEnhanced.validation
    ? textAreaEnhanced.validation.errors.map((error, index) => ({
        line: index + 1, // This would need proper line detection
        message: error,
        type: 'error' as const
      }))
    : [];

  // Save split position to localStorage
  useEffect(() => {
    localStorage.setItem('chordpro-editor-split-position', splitPosition.toString());
  }, [splitPosition]);

  // Check for mobile viewport - tablets and below go vertical, desktop goes horizontal
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize preview visibility based on props and viewport
  useEffect(() => {
    if (isMobile) {
      // On mobile, start with preview hidden but allow toggle
      setIsPreviewVisible(false);
      setSplitPosition(50); // Reset for when desktop view returns
    } else {
      // On desktop, show preview by default if enabled
      setIsPreviewVisible(showPreview && defaultPreviewVisible);
    }
  }, [isMobile, showPreview, defaultPreviewVisible]);

  /**
   * Handle content change
   */
  const handleChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
    if (onChange) {
      onChange(newContent);
    }
  }, [onChange]);

  /**
   * Handle save
   */
  const handleSave = useCallback((contentToSave: string) => {
    if (onSave) {
      onSave(contentToSave);
      setIsDirty(false);
    }
  }, [onSave]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S for save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (isDirty) {
        handleSave(content);
      }
    }
    
    // Escape for cancel
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  }, [isDirty, content, handleSave, onCancel]);

  /**
   * Handle splitter drag for both mouse and touch
   */
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const getClientX = useCallback((e: MouseEvent | TouchEvent): number => {
    if ('touches' in e) {
      return e.touches[0]?.clientX || 0;
    }
    return e.clientX;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const container = document.querySelector('.chord-pro-editor-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = getClientX(e);
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    // Constrain between 20% and 80% for usability
    setSplitPosition(Math.max(20, Math.min(80, percentage)));
  }, [isDragging, getClientX]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global mouse and touch event listeners
  React.useEffect(() => {
    if (isDragging) {
      // Add both mouse and touch event listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('touchend', handleMouseUp);

      // Prevent scrolling during drag on touch devices
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleMouseMove);
        document.removeEventListener('touchend', handleMouseUp);
        document.body.style.overflow = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  /**
   * Get container theme classes
   */
  const getContainerClasses = () => {
    const baseClasses = 'chord-pro-editor-container border rounded-lg overflow-hidden';

    // Force explicit flex properties
    let layoutClasses = 'flex flex-nowrap';
    if (isMobile) {
      layoutClasses += ' flex-col';
    } else {
      layoutClasses += ' flex-row';
    }

    switch (theme) {
      case 'dark':
        return cn(baseClasses, layoutClasses, 'border-gray-700 bg-gray-900');
      case 'stage':
        return cn(baseClasses, layoutClasses, 'border-yellow-600 bg-black');
      default:
        return cn(baseClasses, layoutClasses, 'border-gray-300 bg-white');
    }
  };

  return (
    <div
      className={cn(
        getContainerClasses(),
        'flex flex-col', // Always column for main container
        className
      )}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Editor Pane */}
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          width: (showPreview && isPreviewVisible && !isMobile) ? `calc(${splitPosition}% - 0.5rem)` : '100%',
          flexShrink: 0,
          height: '100%'
        }}
      >
        {/* Toolbar (if enabled) */}
        {showToolbar && (
          <div className={cn(
            'flex items-center justify-between px-6 py-4 border-b shadow-sm',
            'bg-gradient-to-r from-white via-gray-50 to-white',
            theme === 'dark' && 'from-gray-800 via-gray-750 to-gray-800 border-gray-700' ,
            theme === 'stage' && 'from-gray-900 via-black to-gray-900 border-yellow-600/20',
            theme === 'light' && 'border-gray-200'
          )}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave(content)}
                disabled={!isDirty}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm',
                  isDirty
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-md border border-emerald-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                )}
                title={isDirty ? 'Save changes' : 'No changes to save'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Save
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm bg-gray-500 text-white hover:bg-gray-600 hover:shadow-md border border-gray-600"
                  title="Cancel editing"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              )}
              {showPreview && (
                <>
                  <div className={cn(
                    'w-px h-6',
                    theme === 'dark' ? 'bg-gray-600' :
                    theme === 'stage' ? 'bg-yellow-700' :
                    'bg-gray-300'
                  )} />
                  <button
                    onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm border',
                      isPreviewVisible
                        ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md border-blue-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'
                    )}
                    title={isPreviewVisible ? 'Hide preview' : 'Show preview'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview
                  </button>

                  {/* Enhanced controls when enhanced features and preview are enabled */}
                  {enableEnhancedFeatures && isPreviewVisible && (
                    <>
                      <div className={cn('w-px h-6', theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300')} />

                      {/* Zoom controls */}
                      <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                        <button
                          onClick={() => setZoomLevel(Math.max(zoomLevel - 0.1, 0.5))}
                          disabled={zoomLevel <= 0.5}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 rounded-l-lg"
                          title="Zoom out"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="21 21l-4.35-4.35"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setZoomLevel(1)}
                          className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 min-w-16 border-x border-gray-200 transition-colors duration-200"
                          title="Reset zoom"
                        >
                          {Math.round(zoomLevel * 100)}%
                        </button>
                        <button
                          onClick={() => setZoomLevel(Math.min(zoomLevel + 0.1, 2))}
                          disabled={zoomLevel >= 2}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 rounded-r-lg"
                          title="Zoom in"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="21 21l-4.35-4.35"/>
                            <line x1="11" y1="8" x2="11" y2="14"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                          </svg>
                        </button>
                      </div>

                      <div className={cn('w-px h-6', theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300')} />

                      {/* Transpose controls */}
                      <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                        <button
                          onClick={() => setCurrentTranspose(Math.max(currentTranspose - 1, -11))}
                          className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200 rounded-l-lg"
                          title="Transpose down"
                        >
                          ♭
                        </button>
                        <button
                          onClick={() => setCurrentTranspose(0)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 min-w-12 border-x border-gray-200 transition-colors duration-200"
                          title="Reset transpose"
                        >
                          {currentTranspose === 0 ? '0' : currentTranspose > 0 ? `+${currentTranspose}` : currentTranspose}
                        </button>
                        <button
                          onClick={() => setCurrentTranspose(Math.min(currentTranspose + 1, 11))}
                          className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200 rounded-r-lg"
                          title="Transpose up"
                        >
                          ♯
                        </button>
                      </div>

                      <div className={cn('w-px h-6', theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300')} />

                      {/* Show/hide chords */}
                      <button
                        onClick={() => setCurrentShowChords(!currentShowChords)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm border',
                          currentShowChords
                            ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md border-blue-600'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'
                        )}
                        title={currentShowChords ? "Hide chords" : "Show chords"}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Chords
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
            <span className={cn(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' :
              theme === 'stage' ? 'text-yellow-500' :
              'text-gray-600'
            )}>
              {isDirty && '• Unsaved changes'}
            </span>
          </div>
        )}
        
        {/* CodeMirror Editor */}
        <div className="flex-1 overflow-hidden">
          <ChordProCodeMirror
            value={content}
            onChange={handleChange}
            onSave={handleSave}
            theme={theme}
            fontSize={fontSize}
            autoFocus={autoFocus}
            height="100%"
            showLineNumbers={true}
            showFoldGutter={true}
            enableAutocomplete={enableChordCompletion}
            enableLinting={true}
          />
        </div>
        
        {/* Status bar */}
        <div className={cn(
          'px-3 py-1 text-xs flex justify-between border-t',
          theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400' :
          theme === 'stage' ? 'bg-gray-900 border-yellow-700 text-yellow-500' :
          'bg-gray-50 border-gray-200 text-gray-600'
        )}>
          <span>{content.length} characters</span>
          <span>{content.split('\n').length} lines</span>
        </div>
      </div>


      {/* Mobile horizontal divider */}
      {showPreview && isPreviewVisible && isMobile && (
        <div 
          className={cn(
            'h-1 w-full',
            theme === 'dark' ? 'bg-gray-700' :
            theme === 'stage' ? 'bg-yellow-700' :
            'bg-gray-300'
          )}
        />
      )}
      
      {/* Draggable Splitter */}
      {showPreview && isPreviewVisible && !isMobile && (
        <div
          className={cn(
            "w-4 cursor-col-resize flex items-center justify-center group transition-colors duration-200",
            isDragging && "opacity-80"
          )}
          style={{
            backgroundColor: 'var(--color-card)',
            borderLeft: '1px solid var(--color-border)',
            borderRight: '1px solid var(--color-border)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.backgroundColor = 'var(--color-card)';
            }
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          role="separator"
          aria-label="Resize panels"
          tabIndex={0}
          onKeyDown={(e) => {
            // Keyboard accessibility for resizing
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setSplitPosition(Math.max(20, splitPosition - 5));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              setSplitPosition(Math.min(80, splitPosition + 5));
            }
          }}
        >
          {/* Visual indicator */}
          <div
            className="w-1 h-16 rounded-full opacity-40 group-hover:opacity-70 transition-opacity"
            style={{ backgroundColor: 'var(--color-secondary)' }}
          />
        </div>
      )}

      {/* Preview Pane */}
      {showPreview && isPreviewVisible && (
        <div
          className="overflow-hidden flex flex-col"
          style={{
            width: isMobile ? '100%' : `calc(${100 - splitPosition}% - 0.5rem)`,
            flexShrink: 0,
            height: '100%'
          }}
        >
          <PreviewPane
            content={debouncedContent}
            transpose={currentTranspose}
            fontSize={currentFontSize}
            showChords={currentShowChords}
            theme={theme}
            className="h-full"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              width: `${100 / zoomLevel}%`,
            }}
          />
        </div>
      )}

      {/* Status Bar */}
      {enableEnhancedFeatures && (
        <StatusBar
          metrics={textAreaEnhanced.metrics}
          validation={textAreaEnhanced.validation}
          theme={theme}
          isModified={isDirty}
          currentMode="ChordPro"
        />
      )}
    </div>
  );
};
