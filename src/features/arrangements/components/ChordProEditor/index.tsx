/**
 * @file index.tsx
 * @description Main ChordPro editor component with clean split-pane layout
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
  autoFocus?: boolean;
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
  autoFocus = false,
  readOnly = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [splitPosition, setSplitPosition] = useState(() => {
    const saved = localStorage.getItem('chordpro-editor-split-position');
    return saved ? parseFloat(saved) : 50;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(showPreview);
  const [currentTranspose, setCurrentTranspose] = useState(transpose);
  const [currentShowChords, setCurrentShowChords] = useState(showChords);

  // Debounce content for preview updates
  const debouncedContent = useDebounce(content, debounceMs);

  // Save split position to localStorage
  useEffect(() => {
    localStorage.setItem('chordpro-editor-split-position', splitPosition.toString());
  }, [splitPosition]);

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
  useEffect(() => {
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
    const baseClasses = 'chord-pro-editor-container flex flex-row border rounded-lg overflow-hidden';

    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'border-gray-700 bg-gray-900');
      case 'stage':
        return cn(baseClasses, 'border-yellow-600 bg-black');
      default:
        return cn(baseClasses, 'border-gray-300 bg-white');
    }
  };

  /**
   * Get editor background theme classes
   */
  const getEditorBackgroundClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-900 text-gray-100';
      case 'stage':
        return 'bg-black text-yellow-400';
      default:
        return 'bg-white text-gray-900';
    }
  };

  return (
    <div
      className={cn(getContainerClasses(), className)}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch'
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Editor Pane */}
      <div
        className="relative flex flex-col"
        style={{ width: isPreviewVisible ? `${splitPosition}%` : '100%' }}
      >
        {/* Background layer */}
        <div className={cn('absolute inset-0', getEditorBackgroundClasses())} />
        
        {/* CodeMirror Editor */}
        <div className="flex-1 relative z-10">
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
          'absolute bottom-0 left-0 right-0 px-3 py-1 text-xs flex justify-between border-t z-20',
          theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400' :
          theme === 'stage' ? 'bg-gray-900 border-yellow-700 text-yellow-500' :
          'bg-gray-50 border-gray-200 text-gray-600'
        )}>
          <span>Line {content.substring(0, content.length).split('\n').length}, {content.length} characters</span>
          <div className="flex items-center gap-3">
            {currentTranspose !== 0 && (
              <span>Transpose: {currentTranspose > 0 ? `+${currentTranspose}` : currentTranspose}</span>
            )}
            {isDirty && (
              <span className="text-orange-500">• Unsaved</span>
            )}
          </div>
        </div>
      </div>

      {/* Splitter */}
      {isPreviewVisible && (
        <>
          <div 
            className={cn(
              'w-1 cursor-col-resize hover:bg-blue-500 transition-colors',
              isDragging ? 'bg-blue-500' : 
              theme === 'dark' ? 'bg-gray-700' :
              theme === 'stage' ? 'bg-yellow-700' :
              'bg-gray-300'
            )}
            onMouseDown={handleMouseDown}
          />
          
          {/* Preview Pane */}
          <div
            className="flex-1 overflow-hidden relative min-w-0 border-2 border-red-500"
            style={{
              minHeight: '400px',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              minWidth: '300px'
            }}
          >
            {/* Debug indicator */}
            <div className="absolute top-0 left-0 bg-red-500 text-white p-2 text-sm z-50">
              PREVIEW PANE
            </div>

            {/* Preview controls overlay */}
            <div className={cn(
              'absolute top-2 right-2 z-30 flex items-center gap-2',
              'bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border',
              theme === 'dark' && 'bg-gray-800/90 border-gray-600',
              theme === 'stage' && 'bg-black/90 border-yellow-600/30'
            )}>
              {/* Save button */}
              {onSave && (
                <button
                  onClick={() => handleSave(content)}
                  disabled={!isDirty}
                  className={cn(
                    'p-2 rounded-md transition-colors text-sm',
                    isDirty
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                  title={isDirty ? 'Save changes (Ctrl+S)' : 'No changes to save'}
                >
                  💾
                </button>
              )}

              {/* Cancel button */}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="p-2 rounded-md transition-colors text-sm bg-gray-500 text-white hover:bg-gray-600"
                  title="Cancel editing (Esc)"
                >
                  ❌
                </button>
              )}

              <div className={cn(
                'w-px h-6',
                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
              )} />

              {/* Transpose controls */}
              <div className="flex items-center">
                <button
                  onClick={() => setCurrentTranspose(Math.max(currentTranspose - 1, -11))}
                  className="p-1 rounded-l-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                  title="Transpose down"
                >
                  ♭
                </button>
                <button
                  onClick={() => setCurrentTranspose(0)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs min-w-[2rem] border-x border-gray-200"
                  title="Reset transpose"
                >
                  {currentTranspose === 0 ? '0' : currentTranspose > 0 ? `+${currentTranspose}` : currentTranspose}
                </button>
                <button
                  onClick={() => setCurrentTranspose(Math.min(currentTranspose + 1, 11))}
                  className="p-1 rounded-r-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                  title="Transpose up"
                >
                  ♯
                </button>
              </div>

              {/* Show/hide chords */}
              <button
                onClick={() => setCurrentShowChords(!currentShowChords)}
                className={cn(
                  'p-2 rounded-md transition-colors text-sm',
                  currentShowChords
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                title={currentShowChords ? "Hide chords" : "Show chords"}
              >
                👁️
              </button>
            </div>

            <PreviewPane
              content={debouncedContent}
              transpose={currentTranspose}
              fontSize={fontSize}
              showChords={currentShowChords}
              theme={theme}
              className="h-full w-full"
            />
          </div>
        </>
      )}
    </div>
  );
};
