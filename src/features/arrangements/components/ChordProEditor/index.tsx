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
        className
      )}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        // Force inline flex styles to override any CSS conflicts
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        flexWrap: 'nowrap'
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
            'flex items-center justify-between px-4 py-2 border-b',
            theme === 'dark' ? 'bg-gray-800 border-gray-700' :
            theme === 'stage' ? 'bg-gray-900 border-yellow-700' :
            'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave(content)}
                disabled={!isDirty}
                className={cn(
                  'px-3 py-1 text-sm rounded transition-colors',
                  isDirty 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                Save
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-3 py-1 text-sm rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                >
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
                      'px-3 py-1 text-sm rounded transition-colors',
                      isPreviewVisible
                        ? theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                          theme === 'stage' ? 'bg-yellow-600 text-white hover:bg-yellow-700' :
                          'bg-blue-500 text-white hover:bg-blue-600'
                        : theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' :
                          theme === 'stage' ? 'bg-gray-800 text-yellow-500 hover:bg-gray-700' :
                          'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    )}
                  >
                    {isPreviewVisible ? '👁 Preview' : '👁‍🗨 Preview'}
                  </button>

                  {/* Enhanced controls when enhanced features and preview are enabled */}
                  {enableEnhancedFeatures && isPreviewVisible && (
                    <>
                      <div className={cn('w-px h-6', theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300')} />

                      {/* Zoom controls */}
                      <button
                        onClick={() => setZoomLevel(Math.max(zoomLevel - 0.1, 0.5))}
                        disabled={zoomLevel <= 0.5}
                        className="px-2 py-1 text-xs rounded hover:bg-gray-600 disabled:opacity-50"
                        title="Zoom out"
                      >
                        🔍-
                      </button>
                      <span className="text-xs px-1">{Math.round(zoomLevel * 100)}%</span>
                      <button
                        onClick={() => setZoomLevel(Math.min(zoomLevel + 0.1, 2))}
                        disabled={zoomLevel >= 2}
                        className="px-2 py-1 text-xs rounded hover:bg-gray-600 disabled:opacity-50"
                        title="Zoom in"
                      >
                        🔍+
                      </button>

                      <div className={cn('w-px h-6', theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300')} />

                      {/* Transpose controls */}
                      <button
                        onClick={() => setCurrentTranspose(Math.max(currentTranspose - 1, -11))}
                        className="px-2 py-1 text-xs rounded hover:bg-gray-600"
                        title="Transpose down"
                      >
                        ♭
                      </button>
                      <span className="text-xs px-1 min-w-8 text-center">
                        {currentTranspose > 0 ? `+${currentTranspose}` : currentTranspose}
                      </span>
                      <button
                        onClick={() => setCurrentTranspose(Math.min(currentTranspose + 1, 11))}
                        className="px-2 py-1 text-xs rounded hover:bg-gray-600"
                        title="Transpose up"
                      >
                        ♯
                      </button>

                      <div className={cn('w-px h-6', theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300')} />

                      {/* Show/hide chords */}
                      <button
                        onClick={() => setCurrentShowChords(!currentShowChords)}
                        className={cn(
                          'px-2 py-1 text-xs rounded transition-colors',
                          currentShowChords ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'
                        )}
                        title={currentShowChords ? "Hide chords" : "Show chords"}
                      >
                        {currentShowChords ? '👁' : '👁‍🗨'}
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
          {enableEnhancedFeatures ? (
            <PreviewPaneEnhanced
              content={debouncedContent}
              transpose={currentTranspose}
              fontSize={currentFontSize}
              showChords={currentShowChords}
              theme={theme}
              className="h-full"
              onTransposeChange={setCurrentTranspose}
              onFontSizeChange={setCurrentFontSize}
              onShowChordsChange={setCurrentShowChords}
              validationErrors={validationErrors}
              readOnly={readOnly}
            />
          ) : (
            <PreviewPane
              content={debouncedContent}
              transpose={currentTranspose}
              fontSize={currentFontSize}
              showChords={currentShowChords}
              theme={theme}
              className="h-full"
            />
          )}
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
