/**
 * @file index.tsx
 * @description Main ChordPro editor component with split-pane layout
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { cn } from '../../../../shared/utils/cn';
import { ChordProTextArea } from './ChordProTextArea';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { PreviewPane } from './PreviewPane';
import { AutoCompleteDropdown } from './AutoCompleteDropdown';
import { useEditorState } from './hooks/useEditorState';
import { useAutoComplete } from './hooks/useAutoComplete';
import { useDebounce } from '../../../../shared/hooks';

export interface ChordProEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  debounceMs?: number;
  fontSize?: number;
  theme?: 'light' | 'dark' | 'stage';
  showPreview?: boolean;
  transpose?: number;
  showChords?: boolean;
  enableChordCompletion?: boolean;
  className?: string;
  height?: number;
}

export const ChordProEditor: React.FC<ChordProEditorProps> = ({
  initialContent = '',
  onChange,
  onSave,
  debounceMs = 300,
  fontSize = 16,
  theme = 'light',
  showPreview = true,
  transpose = 0,
  showChords = true,
  enableChordCompletion = false,
  className,
  height = 600
}) => {
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [autoCompletePosition, setAutoCompletePosition] = useState({ top: 0, left: 0 });
  const [justCompletedDirective, setJustCompletedDirective] = useState<{ position: number; timestamp: number } | null>(null);
  
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    content,
    cursorPosition,
    isDirty,
    updateContent,
    setCursorPosition,
    setSelectionRange,
    undo,
    redo,
    markSaved
  } = useEditorState({
    initialContent,
    onChange
  });

  // Debounce content for preview updates
  const debouncedContent = useDebounce(content, debounceMs);

  // Extract recent chords from content for auto-completion
  const recentChords = useMemo(() => {
    const chordMatches = content.match(/\[([^\]]+)\]/g);
    if (!chordMatches) return [];
    
    const uniqueChords = [...new Set(
      chordMatches.map(match => match.slice(1, -1))
    )];
    
    return uniqueChords.slice(-20); // Keep last 20 unique chords
  }, [content]);

  // Auto-completion hook
  const {
    state: autoCompleteState,
    showAutoComplete,
    hideAutoComplete,
    moveSelection,
    getSelectedItem,
    filterItems
  } = useAutoComplete({ recentChords, enableChordCompletion });

  /**
   * Handle scroll events from textarea
   */
  const handleScroll = useCallback((scrollTop: number, scrollLeft: number) => {
    setScrollTop(scrollTop);
    setScrollLeft(scrollLeft);
  }, []);

  /**
   * Calculate cursor position for auto-completion dropdown
   */
  const calculateCursorPosition = useCallback((textPosition: number) => {
    if (!editorContainerRef.current) return { top: 0, left: 0 };
    
    const container = editorContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Create a temporary span to measure text position
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.fontSize = `${fontSize}px`;
    span.style.fontFamily = 'monospace';
    span.style.lineHeight = '1.5';
    span.style.whiteSpace = 'pre-wrap';
    span.style.padding = '16px'; // Match textarea padding
    
    const textBeforeCursor = content.substring(0, textPosition);
    span.textContent = textBeforeCursor;
    
    document.body.appendChild(span);
    const spanRect = span.getBoundingClientRect();
    document.body.removeChild(span);
    
    return {
      top: spanRect.height + 20, // Position below the line
      left: Math.min(spanRect.width % containerRect.width, containerRect.width - 250) // Ensure dropdown fits
    };
  }, [content, fontSize]);

  /**
   * Handle auto-completion show
   */
  const handleAutoCompleteShow = useCallback((triggerChar: '{' | '[', position: number, filterText: string) => {
    showAutoComplete(triggerChar, position, filterText);
    
    // Calculate and set dropdown position
    const pos = calculateCursorPosition(position);
    setAutoCompletePosition(pos);
    
    // Filter items if there's text after trigger
    if (filterText) {
      filterItems(filterText);
    }
  }, [showAutoComplete, calculateCursorPosition, filterItems]);

  /**
   * Handle auto-completion selection
   */
  const handleAutoCompleteSelect = useCallback(() => {
    const selectedItem = getSelectedItem();
    if (!selectedItem || !autoCompleteState.isVisible) return;
    
    const { triggerPosition, triggerChar } = autoCompleteState;
    let newContent;
    let newCursorPos;
    
    if (triggerChar === '{') {
      // For directives: replace any existing text after the trigger (old behavior)
      const textAfterTrigger = content.substring(triggerPosition + 1);
      const endOfInput = textAfterTrigger.search(/[}\s]|$/);
      const replaceEnd = triggerPosition + 1 + endOfInput;
      
      // Check if the insertText already includes closing bracket
      const needsClosingBracket = !selectedItem.insertText.endsWith('}');
      
      if (needsClosingBracket) {
        // For value directives like "title: ", don't add closing bracket yet
        newContent = 
          content.substring(0, triggerPosition + 1) +
          selectedItem.insertText +
          content.substring(replaceEnd);
        
        // Position cursor at the end of inserted text
        newCursorPos = triggerPosition + 1 + selectedItem.insertText.length;
        
        // Set directive completion state for special Enter handling
        setJustCompletedDirective({
          position: newCursorPos,
          timestamp: Date.now()
        });
      } else {
        // For section directives like "start_of_chorus}", include the closing bracket
        newContent = 
          content.substring(0, triggerPosition + 1) +
          selectedItem.insertText +
          content.substring(replaceEnd);
        
        // Position cursor after the }
        newCursorPos = triggerPosition + 1 + selectedItem.insertText.length;
        // No special Enter handling needed for complete directives
      }
    } else {
      // For chords: just insert without deleting (new behavior)
      newContent = 
        content.substring(0, triggerPosition + 1) +
        selectedItem.insertText +
        content.substring(triggerPosition + 1);
      
      // Position cursor before the closing bracket
      newCursorPos = triggerPosition + 1 + selectedItem.insertText.length - 1;
    }
    
    updateContent(newContent);
    hideAutoComplete();
    
    // Position cursor using direct textarea manipulation
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
        
        // Also update the editor state
        setCursorPosition(newCursorPos);
      }
    }, 0);
  }, [getSelectedItem, autoCompleteState, content, updateContent, hideAutoComplete, setCursorPosition]);

  /**
   * Handle auto-completion move
   */
  const handleAutoCompleteMove = useCallback((direction: 'up' | 'down') => {
    if (autoCompleteState.isVisible) {
      moveSelection(direction);
    }
  }, [autoCompleteState.isVisible, moveSelection]);

  /**
   * Clear directive completion state
   */
  const handleDirectiveCompleted = useCallback(() => {
    setJustCompletedDirective(null);
  }, []);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    
    // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z for redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
    
    // Ctrl/Cmd + S for save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (onSave && isDirty) {
        onSave(content);
        markSaved();
      }
    }
  }, [undo, redo, onSave, isDirty, content, markSaved]);

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
      style={{ height: `${height}px` }}
      onKeyDown={handleKeyDown}
    >
      {/* Editor Pane */}
      <div 
        ref={editorContainerRef}
        className="relative"
        style={{ width: showPreview ? `${splitPosition}%` : '100%' }}
      >
        {/* Background layer */}
        <div className={cn('absolute inset-0', getEditorBackgroundClasses())} />
        
        {/* Syntax highlighting layer */}
        <SyntaxHighlighter
          content={content}
          fontSize={fontSize}
          theme={theme}
          scrollTop={scrollTop}
          scrollLeft={scrollLeft}
        />
        
        {/* Transparent textarea layer */}
        <ChordProTextArea
          value={content}
          onChange={updateContent}
          onCursorChange={setCursorPosition}
          onSelectionChange={setSelectionRange}
          onScroll={handleScroll}
          onAutoCompleteShow={handleAutoCompleteShow}
          onAutoCompleteHide={hideAutoComplete}
          onAutoCompleteMove={autoCompleteState.isVisible ? handleAutoCompleteMove : undefined}
          onAutoCompleteSelect={autoCompleteState.isVisible ? handleAutoCompleteSelect : undefined}
          textareaRef={textareaRef}
          justCompletedDirective={justCompletedDirective}
          onDirectiveCompleted={handleDirectiveCompleted}
          fontSize={fontSize}
          theme={theme}
          className="absolute inset-0 z-10"
          autoFocus
        />
        
        {/* Auto-completion dropdown */}
        <AutoCompleteDropdown
          isVisible={autoCompleteState.isVisible}
          items={autoCompleteState.items}
          selectedIndex={autoCompleteState.selectedIndex}
          onSelect={handleAutoCompleteSelect}
          onClose={hideAutoComplete}
          position={autoCompletePosition}
          theme={theme}
          className="z-50"
        />
        
        {/* Status bar */}
        <div className={cn(
          'absolute bottom-0 left-0 right-0 px-3 py-1 text-xs flex justify-between border-t',
          theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400' :
          theme === 'stage' ? 'bg-gray-900 border-yellow-700 text-yellow-500' :
          'bg-gray-50 border-gray-200 text-gray-600'
        )}>
          <span>Line {content.substring(0, cursorPosition).split('\n').length}, Column {cursorPosition - content.lastIndexOf('\n', cursorPosition - 1)}</span>
          <span>{content.length} characters{isDirty && ' • Unsaved'}</span>
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
          <div className="flex-1 overflow-hidden">
            <PreviewPane
              content={debouncedContent}
              transpose={transpose}
              fontSize={fontSize}
              showChords={showChords}
              theme={theme}
              className="h-full"
            />
          </div>
        </>
      )}
    </div>
  );
};