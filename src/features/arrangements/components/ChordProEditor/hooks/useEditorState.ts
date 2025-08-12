/**
 * @file useEditorState.ts
 * @description Hook for managing ChordPro editor state including undo/redo
 */

import { useState, useCallback, useRef } from 'react';

export interface EditorState {
  content: string;
  cursorPosition: number;
  selectionRange?: [number, number];
  undoStack: string[];
  redoStack: string[];
  isDirty: boolean;
  lastSaved?: Date;
  recentChords: string[];
}

interface UseEditorStateOptions {
  initialContent?: string;
  maxUndoStackSize?: number;
  maxRecentChords?: number;
  onChange?: (content: string) => void;
}

export const useEditorState = ({
  initialContent = '',
  maxUndoStackSize = 50,
  maxRecentChords = 20,
  onChange
}: UseEditorStateOptions = {}) => {
  const [content, setContent] = useState(initialContent);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectionRange, setSelectionRange] = useState<[number, number] | undefined>();
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [recentChords, setRecentChords] = useState<string[]>([]);
  
  const previousContentRef = useRef(initialContent);

  /**
   * Update content and manage undo stack
   */
  const updateContent = useCallback((newContent: string, addToUndo = true) => {
    if (newContent === content) return;

    if (addToUndo && content !== previousContentRef.current) {
      setUndoStack(prev => {
        const newStack = [...prev, content];
        return newStack.slice(-maxUndoStackSize);
      });
      setRedoStack([]);
    }

    setContent(newContent);
    setIsDirty(true);
    previousContentRef.current = newContent;
    
    // Extract and track recent chords
    const chordMatches = newContent.match(/\[([^\]]+)\]/g) || [];
    const uniqueChords = [...new Set(chordMatches.map(chord => chord.slice(1, -1)))];
    setRecentChords(prev => {
      const combined = [...uniqueChords, ...prev];
      return [...new Set(combined)].slice(0, maxRecentChords);
    });

    onChange?.(newContent);
  }, [content, maxUndoStackSize, maxRecentChords, onChange]);

  /**
   * Undo last change
   */
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const previousContent = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, content]);
    updateContent(previousContent, false);
  }, [undoStack, content, updateContent]);

  /**
   * Redo last undone change
   */
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextContent = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, content]);
    updateContent(nextContent, false);
  }, [redoStack, content, updateContent]);

  /**
   * Mark content as saved
   */
  const markSaved = useCallback(() => {
    setIsDirty(false);
    setLastSaved(new Date());
  }, []);

  /**
   * Reset editor state
   */
  const reset = useCallback((newContent = '') => {
    setContent(newContent);
    setCursorPosition(0);
    setSelectionRange(undefined);
    setUndoStack([]);
    setRedoStack([]);
    setIsDirty(false);
    setLastSaved(undefined);
    previousContentRef.current = newContent;
  }, []);

  return {
    // State
    content,
    cursorPosition,
    selectionRange,
    isDirty,
    lastSaved,
    recentChords,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    
    // Actions
    updateContent,
    setCursorPosition,
    setSelectionRange,
    undo,
    redo,
    markSaved,
    reset
  };
};