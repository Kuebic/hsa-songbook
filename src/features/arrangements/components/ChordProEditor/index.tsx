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
    const baseClasses = 'chord-pro-editor-container flex border rounded-lg overflow-hidden';
    
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
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      onKeyDown={handleKeyDown}
    >
      {/* Editor Pane */}
      <div 
        className="relative flex flex-col"
        style={{ width: showPreview ? `${splitPosition}%` : '100%' }}
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
      {showPreview && (
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
          <div className="flex-1 overflow-hidden relative">
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </button>
              )}

              {/* Cancel button */}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="p-2 rounded-md transition-colors text-sm bg-gray-500 text-white hover:bg-gray-600"
                  title="Cancel editing (Esc)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>

            <PreviewPane
              content={debouncedContent}
              transpose={currentTranspose}
              fontSize={fontSize}
              showChords={currentShowChords}
              theme={theme}
              className="h-full"
            />
          </div>
        </>
      )}
    </div>
  );
};
