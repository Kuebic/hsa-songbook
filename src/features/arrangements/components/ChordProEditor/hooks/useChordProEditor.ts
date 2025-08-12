/**
 * @file useChordProEditor.ts
 * @description Comprehensive hook for managing ChordPro editor state and operations
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  ChordProEditorState,
  EditorSettings,
  UseChordProEditorOptions,
  UseChordProEditorResult,
  EditorOperations,
  ShortcutActions,
} from '../../../types/editor.types';
import { useChordValidation } from './useChordValidation';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

/**
 * Default editor settings
 */
const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'light',
  fontSize: 16,
  showLineNumbers: false,
  enableAutocomplete: true,
  validateSyntax: true,
  autoSave: false,
  autoSaveInterval: 30000,
  wordWrap: true,
  tabSize: 2,
};

/**
 * Comprehensive hook for managing the ChordPro editor
 */
export function useChordProEditor(
  initialContent: string = '',
  options: UseChordProEditorOptions = {}
): UseChordProEditorResult {
  const {
    onChange,
    onSave,
    validateOnChange = true,
    autoSaveEnabled = false,
    autoSaveInterval = 30000,
    maxHistorySize = 50,
    initialSettings = DEFAULT_SETTINGS,
  } = options;

  // Editor state
  const [state, setState] = useState<ChordProEditorState>({
    content: initialContent,
    cursorPosition: 0,
    selectionRange: [0, 0],
    isDirty: false,
    history: {
      past: [],
      future: [],
    },
  });

  // Settings state
  const [settings, setSettings] = useState<EditorSettings>(initialSettings);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>(initialContent);

  // Validation hook
  const validation = useChordValidation(state.content, {
    validateOnChange,
    validateOnMount: true,
    debounceMs: 300,
  });

  // Update content and history
  const updateContent = useCallback((newContent: string, resetHistory = false) => {
    setState((prev) => {
      const newState: ChordProEditorState = {
        ...prev,
        content: newContent,
        isDirty: newContent !== lastSavedContentRef.current,
      };

      // Update history
      if (!resetHistory && newContent !== prev.content) {
        newState.history = {
          past: [...prev.history.past.slice(-maxHistorySize + 1), prev.content],
          future: [],
        };
      }

      return newState;
    });

    // Notify parent component
    onChange?.(newContent);
  }, [onChange, maxHistorySize]);

  // Undo operation
  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.history.past.length === 0) return prev;

      const newPast = [...prev.history.past];
      const previousContent = newPast.pop()!;

      return {
        ...prev,
        content: previousContent,
        isDirty: previousContent !== lastSavedContentRef.current,
        history: {
          past: newPast,
          future: [prev.content, ...prev.history.future],
        },
      };
    });
  }, []);

  // Redo operation
  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.history.future.length === 0) return prev;

      const newFuture = [...prev.history.future];
      const nextContent = newFuture.shift()!;

      return {
        ...prev,
        content: nextContent,
        isDirty: nextContent !== lastSavedContentRef.current,
        history: {
          past: [...prev.history.past, prev.content],
          future: newFuture,
        },
      };
    });
  }, []);

  // Save operation
  const save = useCallback(async () => {
    if (!state.isDirty || !onSave) return;

    try {
      await onSave(state.content);
      lastSavedContentRef.current = state.content;
      setState((prev) => ({ ...prev, isDirty: false }));
    } catch (error) {
      console.error('Failed to save:', error);
      throw error;
    }
  }, [state.content, state.isDirty, onSave]);

  // Insert text at cursor
  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const value = textarea.value;

    const newValue = value.substring(0, start) + text + value.substring(end);
    updateContent(newValue);

    // Update cursor position
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  }, [updateContent]);

  // Insert chord
  const insertChord = useCallback(() => {
    const chordPrompt = prompt('Enter chord (e.g., C, G7, Am):');
    if (chordPrompt) {
      insertAtCursor(`[${chordPrompt}]`);
    }
  }, [insertAtCursor]);

  // Insert directive
  const insertDirective = useCallback((directive?: string) => {
    if (directive) {
      insertAtCursor(directive);
    } else {
      const directivePrompt = prompt('Enter directive (e.g., title: Song Name):');
      if (directivePrompt) {
        insertAtCursor(`{${directivePrompt}}`);
      }
    }
  }, [insertAtCursor]);

  // Format content
  const format = useCallback(() => {
    const lines = state.content.split('\n');
    const formatted = lines.map((line) => {
      // Trim trailing whitespace
      line = line.trimEnd();

      // Format directives
      if (line.startsWith('{') && line.endsWith('}')) {
        // Ensure space after colon in directives
        line = line.replace(/:\s*/g, ': ');
      }

      return line;
    });

    updateContent(formatted.join('\n'));
  }, [state.content, updateContent]);

  // Transpose chords
  const transpose = useCallback((semitones: number) => {
    // This is a simplified transpose - in production, use a library like chordsheetjs
    const chordMap: { [key: string]: string[] } = {
      'C': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
      'Db': ['Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'C'],
    };

    const chromaticScale = chordMap['C'];
    
    const transposeChord = (chord: string): string => {
      // Extract root note
      const rootMatch = chord.match(/^([A-G][#b]?)/);
      if (!rootMatch) return chord;

      const root = rootMatch[1];
      const suffix = chord.substring(root.length);

      // Find index in chromatic scale
      let index = chromaticScale.findIndex((note) => 
        note === root || note === root.replace('b', '#')
      );
      
      if (index === -1) return chord;

      // Transpose
      index = (index + semitones + 12) % 12;
      if (index < 0) index += 12;

      return chromaticScale[index] + suffix;
    };

    const transposed = state.content.replace(/\[([^\]]+)\]/g, (_, chord) => {
      return `[${transposeChord(chord)}]`;
    });

    updateContent(transposed);
  }, [state.content, updateContent]);

  // Search functionality (placeholder)
  const search = useCallback(() => {
    const searchTerm = prompt('Search for:');
    if (searchTerm) {
      // In production, implement proper search with highlighting
      const textarea = textareaRef.current;
      if (!textarea) return;

      const index = state.content.indexOf(searchTerm);
      if (index !== -1) {
        textarea.selectionStart = index;
        textarea.selectionEnd = index + searchTerm.length;
        textarea.focus();
      } else {
        alert('Not found');
      }
    }
  }, [state.content]);

  // Replace operation (placeholder)
  const replace = useCallback((searchStr: string, replaceStr: string) => {
    const newContent = state.content.replace(new RegExp(searchStr, 'g'), replaceStr);
    updateContent(newContent);
  }, [state.content, updateContent]);

  // Editor operations
  const operations: EditorOperations = useMemo(() => ({
    undo,
    redo,
    save,
    insertChord,
    insertDirective,
    format,
    transpose,
    search,
    replace,
    insertAtCursor,
    updateContent,
  }), [undo, redo, save, insertChord, insertDirective, format, transpose, search, replace, insertAtCursor, updateContent]);

  // Create shortcuts actions that match the expected interface
  const shortcutActions: ShortcutActions = useMemo(() => ({
    undo,
    redo,
    save,
    insertChord,
    insertDirective: () => insertDirective(),  // Adapt to no-argument version
    search,
    format,
    transpose: (direction: 1 | -1) => transpose(direction),
  }), [undo, redo, save, insertChord, insertDirective, search, format, transpose]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    editorRef: textareaRef,
    actions: shortcutActions,
    enabled: true,
  });

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !state.isDirty || !onSave) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      save();
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [state.content, state.isDirty, autoSaveEnabled, autoSaveInterval, save, onSave]);

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings: EditorSettings) => {
    setSettings(newSettings);
  }, []);

  // Handle editor change
  const handleEditorChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    updateContent(newContent);

    // Update cursor position
    setState((prev) => ({
      ...prev,
      cursorPosition: e.target.selectionStart ?? 0,
      selectionRange: [
        e.target.selectionStart ?? 0,
        e.target.selectionEnd ?? 0,
      ],
    }));
  }, [updateContent]);

  // Handle selection change
  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    setState((prev) => ({
      ...prev,
      cursorPosition: textarea.selectionStart ?? 0,
      selectionRange: [
        textarea.selectionStart ?? 0,
        textarea.selectionEnd ?? 0,
      ],
    }));
  }, []);

  return {
    // State
    state,
    settings,
    validation,
    
    // Refs
    textareaRef,
    
    // Operations
    operations,
    
    // Handlers
    handleEditorChange,
    handleSelectionChange,
    handleSettingsChange,
    
    // Computed values
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
  };
}