import { useState, useCallback, useRef, useEffect } from 'react';
import { CommandManager } from '../commands/base/CommandManager';
import type { EditorCommand, EditorContext, CommandResult } from '../types/command.types';
import { useDebounce } from './useDebounce';

interface UseEnhancedEditorStateOptions {
  initialContent: string;
  arrangementId: string;
  onChange?: (content: string) => void;
}

export function useEnhancedEditorState({
  initialContent,
  arrangementId: _arrangementId,
  onChange
}: UseEnhancedEditorStateOptions) {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectionRange, setSelectionRange] = useState<[number, number]>([0, 0]);
  
  const commandManager = useRef(new CommandManager());
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  
  // Debounced content for validation (existing pattern)
  const debouncedContent = useDebounce(content, 300);
  
  // Update UI state based on command manager
  const updateUIState = useCallback(() => {
    setCanUndo(commandManager.current.canUndo());
    setCanRedo(commandManager.current.canRedo());
  }, []);
  
  // Execute a command
  const executeCommand = useCallback(async (command: EditorCommand): Promise<CommandResult> => {
    const context: EditorContext = {
      textareaRef,
      content,
      cursorPosition: textareaRef.current?.selectionStart ?? cursorPosition,
      selectionRange: [
        textareaRef.current?.selectionStart ?? selectionRange[0],
        textareaRef.current?.selectionEnd ?? selectionRange[1]
      ]
    };
    
    const result = await commandManager.current.execute(command, context);
    
    if (result.success && result.content !== undefined) {
      setContent(result.content);
      setIsDirty(result.content !== initialContent);
      onChange?.(result.content);
      
      // Update cursor position if provided
      if (result.cursorPosition !== undefined) {
        setCursorPosition(result.cursorPosition);
        // Set cursor in textarea after React updates
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(result.cursorPosition!, result.cursorPosition!);
          }
        }, 0);
      }
      
      updateUIState();
    }
    
    return result;
  }, [content, cursorPosition, selectionRange, initialContent, onChange, updateUIState]);
  
  // Undo operation
  const undo = useCallback(async (): Promise<CommandResult> => {
    const context: EditorContext = {
      textareaRef,
      content,
      cursorPosition: textareaRef.current?.selectionStart ?? cursorPosition,
      selectionRange: [
        textareaRef.current?.selectionStart ?? selectionRange[0],
        textareaRef.current?.selectionEnd ?? selectionRange[1]
      ]
    };
    
    const result = await commandManager.current.undo(context);
    
    if (result.success && result.content !== undefined) {
      setContent(result.content);
      setIsDirty(result.content !== initialContent);
      onChange?.(result.content);
      
      // Update cursor position if provided
      if (result.cursorPosition !== undefined) {
        setCursorPosition(result.cursorPosition);
        // Set cursor in textarea after React updates
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(result.cursorPosition!, result.cursorPosition!);
          }
        }, 0);
      }
      
      updateUIState();
    }
    
    return result;
  }, [content, cursorPosition, selectionRange, initialContent, onChange, updateUIState]);
  
  // Redo operation
  const redo = useCallback(async (): Promise<CommandResult> => {
    const context: EditorContext = {
      textareaRef,
      content,
      cursorPosition: textareaRef.current?.selectionStart ?? cursorPosition,
      selectionRange: [
        textareaRef.current?.selectionStart ?? selectionRange[0],
        textareaRef.current?.selectionEnd ?? selectionRange[1]
      ]
    };
    
    const result = await commandManager.current.redo(context);
    
    if (result.success && result.content !== undefined) {
      setContent(result.content);
      setIsDirty(result.content !== initialContent);
      onChange?.(result.content);
      
      // Update cursor position if provided
      if (result.cursorPosition !== undefined) {
        setCursorPosition(result.cursorPosition);
        // Set cursor in textarea after React updates
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(result.cursorPosition!, result.cursorPosition!);
          }
        }, 0);
      }
      
      updateUIState();
    }
    
    return result;
  }, [content, cursorPosition, selectionRange, initialContent, onChange, updateUIState]);
  
  // Handle cursor position changes
  const handleCursorPositionChange = useCallback((position: number) => {
    setCursorPosition(position);
  }, []);
  
  // Handle selection range changes
  const handleSelectionRangeChange = useCallback((range: [number, number]) => {
    setSelectionRange(range);
    setCursorPosition(range[0]);
  }, []);
  
  // Update content (for external changes)
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(newContent !== initialContent);
    onChange?.(newContent);
  }, [initialContent, onChange]);
  
  // Keyboard shortcuts (Ctrl+Z for undo, Ctrl+Y for redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if this editor is focused
      if (textareaRef.current && document.activeElement === textareaRef.current) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault();
          redo();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
  
  // Update dirty state when content changes externally
  useEffect(() => {
    setIsDirty(content !== initialContent);
  }, [content, initialContent]);
  
  return {
    // Content state
    content,
    isDirty,
    cursorPosition,
    selectionRange,
    debouncedContent,
    
    // Command state
    canUndo,
    canRedo,
    
    // Actions
    executeCommand,
    undo,
    redo,
    updateContent,
    handleCursorPositionChange,
    handleSelectionRangeChange,
    
    // Refs
    textareaRef,
    commandManager: commandManager.current,
    
    // Utils
    getHistoryInfo: () => commandManager.current.getHistoryInfo(),
    clearHistory: () => {
      commandManager.current.clear();
      updateUIState();
    },
    getHistory: () => commandManager.current.getHistory(),
    restoreHistory: (history: EditorCommand[]) => {
      commandManager.current.restoreHistory(history);
      updateUIState();
    }
  };
}