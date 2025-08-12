/**
 * @file useKeyboardShortcuts.ts
 * @description Hook for managing keyboard shortcuts in the ChordEditor
 */

import { useMemo } from 'react';
import type { Ace } from 'ace-builds';

export interface KeyboardShortcut {
  name: string;
  bindKey: { win: string; mac: string };
  exec: (editor: Ace.Editor) => void;
  description: string;
  group?: string;
}

export interface UseKeyboardShortcutsOptions {
  /** Callback to insert text at cursor position */
  onInsertText?: (text: string) => void;
  /** Callback to insert text and position cursor */
  onInsertTextWithCursor?: (text: string, cursorOffset: number) => void;
  /** Custom shortcuts to add */
  customShortcuts?: KeyboardShortcut[];
  /** Whether to enable default shortcuts */
  enableDefaults?: boolean;
}

export interface UseKeyboardShortcutsResult {
  /** Array of keyboard shortcuts for the editor */
  shortcuts: Array<{
    name: string;
    bindKey: { win: string; mac: string };
    exec: (editor: Ace.Editor) => void;
  }>;
  /** Get shortcuts grouped by category */
  getShortcutsByGroup: () => Record<string, KeyboardShortcut[]>;
  /** Get all shortcuts as documentation */
  getShortcutsDocumentation: () => KeyboardShortcut[];
}

/**
 * Default ChordPro keyboard shortcuts
 */
const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    name: 'insertChord',
    bindKey: { win: 'Ctrl-[', mac: 'Cmd-[' },
    description: 'Insert chord bracket [C]',
    group: 'chordpro',
    exec: (editor) => {
      editor.insert('[C]');
      // Move cursor back one position to be inside the bracket
      const pos = editor.getCursorPosition();
      editor.moveCursorTo(pos.row, pos.column - 1);
    }
  },
  {
    name: 'insertDirective',
    bindKey: { win: 'Ctrl-{', mac: 'Cmd-{' },
    description: 'Insert ChordPro directive {title: }',
    group: 'chordpro',
    exec: (editor) => {
      editor.insert('{title: }');
      // Move cursor back one position to be inside the directive
      const pos = editor.getCursorPosition();
      editor.moveCursorTo(pos.row, pos.column - 1);
    }
  },
  {
    name: 'insertChorus',
    bindKey: { win: 'Ctrl-Shift-C', mac: 'Cmd-Shift-C' },
    description: 'Insert chorus section',
    group: 'chordpro',
    exec: (editor) => {
      const text = '{start_of_chorus}\n\n{end_of_chorus}';
      editor.insert(text);
      // Move cursor to the middle line
      const pos = editor.getCursorPosition();
      editor.moveCursorTo(pos.row - 1, 0);
    }
  },
  {
    name: 'insertVerse',
    bindKey: { win: 'Ctrl-Shift-V', mac: 'Cmd-Shift-V' },
    description: 'Insert verse section',
    group: 'chordpro',
    exec: (editor) => {
      const text = '{start_of_verse}\n\n{end_of_verse}';
      editor.insert(text);
      // Move cursor to the middle line
      const pos = editor.getCursorPosition();
      editor.moveCursorTo(pos.row - 1, 0);
    }
  },
  {
    name: 'insertComment',
    bindKey: { win: 'Ctrl-/', mac: 'Cmd-/' },
    description: 'Insert comment directive {comment: }',
    group: 'chordpro',
    exec: (editor) => {
      editor.insert('{comment: }');
      // Move cursor back one position
      const pos = editor.getCursorPosition();
      editor.moveCursorTo(pos.row, pos.column - 1);
    }
  },
  {
    name: 'duplicateLine',
    bindKey: { win: 'Ctrl-D', mac: 'Cmd-D' },
    description: 'Duplicate current line',
    group: 'editing',
    exec: (editor) => {
      const range = editor.getSelectionRange();
      const line = editor.session.getLine(range.start.row);
      const pos = { row: range.start.row + 1, column: 0 };
      editor.session.insert(pos, line + '\n');
    }
  },
  {
    name: 'deleteLine',
    bindKey: { win: 'Ctrl-Shift-K', mac: 'Cmd-Shift-K' },
    description: 'Delete current line',
    group: 'editing',
    exec: (editor) => {
      editor.removeToLineEnd();
      editor.removeToLineStart();
      editor.removeToLineEnd(); // Remove the newline
    }
  },
  {
    name: 'moveLinesUp',
    bindKey: { win: 'Alt-Up', mac: 'Option-Up' },
    description: 'Move lines up',
    group: 'editing',
    exec: (editor) => {
      editor.moveLinesUp();
    }
  },
  {
    name: 'moveLinesDown',
    bindKey: { win: 'Alt-Down', mac: 'Option-Down' },
    description: 'Move lines down',
    group: 'editing',
    exec: (editor) => {
      editor.moveLinesDown();
    }
  },
  {
    name: 'toggleComment',
    bindKey: { win: 'Ctrl-Shift-/', mac: 'Cmd-Shift-/' },
    description: 'Toggle line comment',
    group: 'editing',
    exec: (editor) => {
      editor.toggleCommentLines();
    }
  }
];

/**
 * Hook for managing keyboard shortcuts in ChordEditor
 * 
 * Provides default ChordPro-specific shortcuts and allows for custom shortcuts.
 * Integrates with Ace editor command system.
 * 
 * @example
 * ```tsx
 * const { shortcuts, getShortcutsDocumentation } = useKeyboardShortcuts({
 *   onInsertText: (text) => insertText(text),
 *   customShortcuts: [
 *     {
 *       name: 'customAction',
 *       bindKey: { win: 'Ctrl-K', mac: 'Cmd-K' },
 *       exec: (editor) => console.log('Custom action'),
 *       description: 'Custom action'
 *     }
 *   ]
 * });
 * ```
 */
export const useKeyboardShortcuts = ({
  onInsertText,
  onInsertTextWithCursor,
  customShortcuts = [],
  enableDefaults = true
}: UseKeyboardShortcutsOptions = {}): UseKeyboardShortcutsResult => {
  
  const shortcuts = useMemo(() => {
    const allShortcuts: KeyboardShortcut[] = [];
    
    // Add default shortcuts if enabled
    if (enableDefaults) {
      // Enhanced default shortcuts with callbacks
      const enhancedDefaults = DEFAULT_SHORTCUTS.map(shortcut => {
        if (shortcut.name === 'insertChord' && onInsertTextWithCursor) {
          return {
            ...shortcut,
            exec: () => onInsertTextWithCursor('[C]', -1)
          };
        }
        if (shortcut.name === 'insertDirective' && onInsertTextWithCursor) {
          return {
            ...shortcut,
            exec: () => onInsertTextWithCursor('{title: }', -1)
          };
        }
        return shortcut;
      });
      allShortcuts.push(...enhancedDefaults);
    }
    
    // Add custom shortcuts
    allShortcuts.push(...customShortcuts);
    
    // Return in format expected by Ace editor
    return allShortcuts.map(shortcut => ({
      name: shortcut.name,
      bindKey: shortcut.bindKey,
      exec: shortcut.exec
    }));
  }, [onInsertText, onInsertTextWithCursor, customShortcuts, enableDefaults]);

  const getShortcutsByGroup = useMemo(() => {
    return () => {
      const allShortcuts = [...DEFAULT_SHORTCUTS, ...customShortcuts];
      const grouped: Record<string, KeyboardShortcut[]> = {};
      
      allShortcuts.forEach(shortcut => {
        const group = shortcut.group || 'general';
        if (!grouped[group]) {
          grouped[group] = [];
        }
        grouped[group].push(shortcut);
      });
      
      return grouped;
    };
  }, [customShortcuts]);

  const getShortcutsDocumentation = useMemo(() => {
    return () => [...DEFAULT_SHORTCUTS, ...customShortcuts];
  }, [customShortcuts]);

  return {
    shortcuts,
    getShortcutsByGroup,
    getShortcutsDocumentation
  };
};