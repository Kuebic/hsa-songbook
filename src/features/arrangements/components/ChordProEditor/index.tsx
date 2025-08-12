/**
 * @file index.tsx
 * @description Main ChordPro editor component with CodeMirror and split-pane layout
 */

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '../../../../lib/utils';
import { ChordProCodeMirror } from './ChordProCodeMirror';
import { PreviewPane } from './PreviewPane';
import { useDebounce } from '../../hooks/useDebounce';

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
}

export const ChordProEditor: React.FC<ChordProEditorProps> = ({
  initialContent = '',
  onChange,
  onSave,
  onCancel,
  debounceMs = 300,
  fontSize = 16,
  theme = 'light',
  showPreview = true,
  transpose = 0,
  showChords = true,
  enableChordCompletion = true,
  className,
  height = 600,
  showToolbar = true,
  defaultPreviewVisible = true,
  autoFocus = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(showPreview && defaultPreviewVisible);
  const [isMobile, setIsMobile] = useState(false);

  // Debounce content for preview updates
  const debouncedContent = useDebounce(content, debounceMs);

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
   * Handle splitter drag
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = document.querySelector('.chord-pro-editor-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    setSplitPosition(Math.max(20, Math.min(80, percentage)));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global mouse event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  /**
   * Get container theme classes
   */
  const getContainerClasses = () => {
    const baseClasses = 'chord-pro-editor-container border rounded-lg overflow-hidden flex';

    // Determine flex layout based on state
    let layoutClasses = '';
    if (isMobile) {
      layoutClasses = 'flex-col';
    } else {
      layoutClasses = 'flex-row';
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
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      onKeyDown={handleKeyDown}
    >
      {/* Editor Pane */}
      <div
        className="relative overflow-hidden flex flex-col"
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

      {/* Visual Splitter - show between panes on desktop */}
      {showPreview && isPreviewVisible && !isMobile && (
        <div
          className={cn(
            'w-px bg-gray-300 border-l',
            theme === 'dark' ? 'border-gray-600 bg-gray-600' :
            theme === 'stage' ? 'border-yellow-700 bg-yellow-700' :
            'border-gray-300'
          )}
        />
      )}

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
      
      {/* Preview Pane */}
      {showPreview && isPreviewVisible && (
        <div
          className="overflow-hidden flex flex-col"
        >
          <PreviewPane
            content={debouncedContent}
            transpose={transpose}
            fontSize={fontSize}
            showChords={showChords}
            theme={theme}
            className="h-full"
          />
        </div>
      )}
    </div>
  );
};
