/**
 * @file useChordEditor.ts
 * @description React hook for ChordEditor state management and operations
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  ChordEditorState,
  ChordEditorConfig,
  EditorCursorPosition,
  EditorSelection,
  UseChordEditorResult
} from '../types/chord.types';
import {
  EDITOR_FONT_SIZE_LIMITS,
  AUTO_SAVE_DELAY_LIMITS
} from '../types/chord.types';
import { useChordValidation } from './useChordValidation';

/**
 * Default editor configuration
 */
const DEFAULT_CONFIG: ChordEditorConfig = {
  theme: 'light',
  fontSize: EDITOR_FONT_SIZE_LIMITS.DEFAULT,
  showLineNumbers: true,
  wordWrap: true,
  tabSize: 2,
  autoComplete: true,
  validation: true,
  autoSave: false,
  autoSaveDelay: AUTO_SAVE_DELAY_LIMITS.DEFAULT
};

/**
 * Custom hook for ChordEditor state management
 * 
 * Provides comprehensive editor state management including content, cursor position,
 * selection handling, undo/redo functionality, and auto-save capabilities.
 * 
 * @param initialContent - Initial content for the editor
 * @param initialConfig - Initial editor configuration
 * @param onAutoSave - Callback for auto-save functionality
 * @returns UseChordEditorResult with state and operations
 * 
 * @example
 * ```tsx
 * const {
 *   state,
 *   setContent,
 *   insertText,
 *   undo,
 *   redo,
 *   canUndo,
 *   save
 * } = useChordEditor(initialContent, config, handleAutoSave);
 * 
 * // Insert a chord at cursor position
 * insertText('[C]');
 * 
 * // Undo last action
 * if (canUndo) {
 *   undo();
 * }
 * ```
 */
export function useChordEditor(
  initialContent: string = '',
  initialConfig: Partial<ChordEditorConfig> = {},
  onAutoSave?: (content: string) => void
): UseChordEditorResult {
  // Merge provided config with defaults
  const config = useMemo<ChordEditorConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...initialConfig
  }), [initialConfig]);

  // Initialize validation hook
  const { validation, validate } = useChordValidation();

  // Core state
  const [content, setContentState] = useState(initialContent);
  const [cursor, setCursorState] = useState<EditorCursorPosition>({ line: 0, column: 0 });
  const [selection, setSelectionState] = useState<EditorSelection | undefined>();
  const [isDirty, setIsDirty] = useState(false);

  // History management for undo/redo
  const historyRef = useRef<string[]>([initialContent]);
  const historyIndexRef = useRef(0);
  const maxHistorySize = 100;

  // Auto-save management
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef(initialContent);

  /**
   * Add content to history for undo/redo
   */
  const addToHistory = useCallback((newContent: string) => {
    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    // Remove any history after current index (when user made changes after undo)
    if (currentIndex < history.length - 1) {
      historyRef.current = history.slice(0, currentIndex + 1);
    }

    // Add new content to history
    historyRef.current.push(newContent);

    // Limit history size
    if (historyRef.current.length > maxHistorySize) {
      historyRef.current = historyRef.current.slice(-maxHistorySize);
    }

    // Update index
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  /**
   * Update content with history tracking
   */
  const setContent = useCallback((newContent: string) => {
    if (newContent !== content) {
      addToHistory(newContent);
      setContentState(newContent);
      setIsDirty(newContent !== lastSavedContentRef.current);

      // Validate content if validation is enabled
      if (config.validation) {
        validate(newContent);
      }

      // Trigger auto-save if enabled
      if (config.autoSave && onAutoSave) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
          onAutoSave(newContent);
          lastSavedContentRef.current = newContent;
          setIsDirty(false);
        }, config.autoSaveDelay);
      }
    }
  }, [content, config.validation, config.autoSave, config.autoSaveDelay, onAutoSave, validate, addToHistory]);

  /**
   * Update cursor position
   */
  const setCursor = useCallback((position: EditorCursorPosition) => {
    setCursorState(position);
  }, []);

  /**
   * Update selection
   */
  const setSelection = useCallback((newSelection: EditorSelection) => {
    setSelectionState(newSelection);
  }, []);

  /**
   * Insert text at cursor position
   */
  const insertText = useCallback((text: string) => {
    const lines = content.split('\n');
    const currentLine = lines[cursor.line] || '';
    
    const beforeCursor = currentLine.slice(0, cursor.column);
    const afterCursor = currentLine.slice(cursor.column);
    const newLine = beforeCursor + text + afterCursor;
    
    lines[cursor.line] = newLine;
    const newContent = lines.join('\n');
    
    setContent(newContent);
    
    // Update cursor position
    setCursor({
      line: cursor.line,
      column: cursor.column + text.length
    });
  }, [content, cursor, setContent, setCursor]);

  /**
   * Replace selected text
   */
  const replaceSelection = useCallback((text: string) => {
    if (!selection) {
      insertText(text);
      return;
    }

    const lines = content.split('\n');
    const { start, end } = selection;

    if (start.line === end.line) {
      // Single line selection
      const line = lines[start.line] || '';
      const beforeSelection = line.slice(0, start.column);
      const afterSelection = line.slice(end.column);
      lines[start.line] = beforeSelection + text + afterSelection;
    } else {
      // Multi-line selection
      const startLine = lines[start.line] || '';
      const endLine = lines[end.line] || '';
      
      const beforeSelection = startLine.slice(0, start.column);
      const afterSelection = endLine.slice(end.column);
      
      // Remove selected lines and replace with new content
      const newLines = [beforeSelection + text + afterSelection];
      lines.splice(start.line, end.line - start.line + 1, ...newLines);
    }

    const newContent = lines.join('\n');
    setContent(newContent);

    // Update cursor position to end of inserted text
    const textLines = text.split('\n');
    const newCursor: EditorCursorPosition = {
      line: start.line + textLines.length - 1,
      column: textLines.length === 1 
        ? start.column + text.length 
        : textLines[textLines.length - 1].length
    };
    
    setCursor(newCursor);
    setSelectionState(undefined);
  }, [content, selection, insertText, setContent, setCursor]);

  /**
   * Undo last action
   */
  const undo = useCallback(() => {
    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    if (currentIndex > 0) {
      historyIndexRef.current = currentIndex - 1;
      const previousContent = history[historyIndexRef.current];
      setContentState(previousContent);
      setIsDirty(previousContent !== lastSavedContentRef.current);
      
      if (config.validation) {
        validate(previousContent);
      }
    }
  }, [config.validation, validate]);

  /**
   * Redo last undone action
   */
  const redo = useCallback(() => {
    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    if (currentIndex < history.length - 1) {
      historyIndexRef.current = currentIndex + 1;
      const nextContent = history[historyIndexRef.current];
      setContentState(nextContent);
      setIsDirty(nextContent !== lastSavedContentRef.current);
      
      if (config.validation) {
        validate(nextContent);
      }
    }
  }, [config.validation, validate]);

  /**
   * Check if undo is available
   */
  const canUndo = useMemo(() => {
    return historyIndexRef.current > 0;
  }, []);

  /**
   * Check if redo is available
   */
  const canRedo = useMemo(() => {
    return historyIndexRef.current < historyRef.current.length - 1;
  }, []);

  /**
   * Format content (basic ChordPro formatting)
   */
  const format = useCallback(() => {
    const lines = content.split('\n');
    const formattedLines: string[] = [];
    
    for (const line of lines) {
      let formattedLine = line;
      
      // Normalize directive spacing
      formattedLine = formattedLine.replace(/\{\s*([^}:]+)\s*:\s*([^}]*)\s*\}/g, '{$1: $2}');
      
      // Remove trailing whitespace
      formattedLine = formattedLine.trimEnd();
      
      formattedLines.push(formattedLine);
    }
    
    // Remove multiple consecutive empty lines
    const cleanedLines: string[] = [];
    let lastWasEmpty = false;
    
    for (const line of formattedLines) {
      const isEmpty = line.trim() === '';
      
      if (!isEmpty || !lastWasEmpty) {
        cleanedLines.push(line);
      }
      
      lastWasEmpty = isEmpty;
    }
    
    const formattedContent = cleanedLines.join('\n');
    if (formattedContent !== content) {
      setContent(formattedContent);
    }
  }, [content, setContent]);

  /**
   * Save content
   */
  const save = useCallback(() => {
    if (onAutoSave) {
      onAutoSave(content);
      lastSavedContentRef.current = content;
      setIsDirty(false);
      
      // Clear auto-save timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    }
  }, [content, onAutoSave]);

  // Build current state
  const state: ChordEditorState = useMemo(() => ({
    content,
    cursor,
    selection,
    isDirty,
    validation: validation || undefined,
    config
  }), [content, cursor, selection, isDirty, validation, config]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Initial validation
  useEffect(() => {
    if (config.validation && initialContent) {
      validate(initialContent);
    }
  }, [config.validation, initialContent, validate]);

  return {
    state,
    setContent,
    setCursor,
    setSelection,
    insertText,
    replaceSelection,
    undo,
    redo,
    canUndo,
    canRedo,
    format,
    save
  };
}