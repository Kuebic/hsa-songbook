/**
 * @file useKeyboardShortcuts.ts
 * @description Hook for handling keyboard shortcuts in the ChordPro editor
 */

import { useEffect, useCallback } from 'react';
import type { UseKeyboardShortcutsOptions } from '../../../types/editor.types';

/**
 * Hook for managing keyboard shortcuts in the editor
 */
export function useKeyboardShortcuts({
  editorRef,
  actions,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      
      // Undo: Ctrl/Cmd + Z
      if (ctrl && e.key === 'z' && !shift) {
        e.preventDefault();
        actions.undo();
        return;
      }
      
      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if (ctrl && (e.key === 'y' || (e.key === 'z' && shift))) {
        e.preventDefault();
        actions.redo();
        return;
      }
      
      // Save: Ctrl/Cmd + S
      if (ctrl && e.key === 's') {
        e.preventDefault();
        actions.save();
        return;
      }
      
      // Insert Chord: Ctrl/Cmd + K
      if (ctrl && e.key === 'k') {
        e.preventDefault();
        actions.insertChord();
        return;
      }
      
      // Insert Directive: Ctrl/Cmd + D
      if (ctrl && e.key === 'd') {
        e.preventDefault();
        actions.insertDirective();
        return;
      }
      
      // Search: Ctrl/Cmd + F
      if (ctrl && e.key === 'f') {
        e.preventDefault();
        actions.search();
        return;
      }
      
      // Format: Ctrl/Cmd + Shift + F
      if (ctrl && shift && e.key === 'f') {
        e.preventDefault();
        actions.format();
        return;
      }
      
      // Transpose Up: Alt + Up Arrow
      if (alt && e.key === 'ArrowUp') {
        e.preventDefault();
        actions.transpose(1);
        return;
      }
      
      // Transpose Down: Alt + Down Arrow
      if (alt && e.key === 'ArrowDown') {
        e.preventDefault();
        actions.transpose(-1);
        return;
      }
      
      // Tab key handling for indentation
      if (e.key === 'Tab' && editorRef.current) {
        const textarea = editorRef.current;
        const start = textarea.selectionStart ?? 0;
        const end = textarea.selectionEnd ?? 0;
        const value = textarea.value;
        
        if (start === end) {
          // No selection, insert tab character
          e.preventDefault();
          const newValue = value.substring(0, start) + '  ' + value.substring(end);
          textarea.value = newValue;
          textarea.selectionStart = textarea.selectionEnd = start + 2;
          
          // Trigger change event
          const event = new Event('input', { bubbles: true });
          textarea.dispatchEvent(event);
        } else if (!shift) {
          // Selection exists and not shift+tab, indent selected lines
          e.preventDefault();
          const lines = value.substring(start, end).split('\n');
          const indentedLines = lines.map(line => '  ' + line);
          const newText = indentedLines.join('\n');
          const newValue = value.substring(0, start) + newText + value.substring(end);
          
          textarea.value = newValue;
          textarea.selectionStart = start;
          textarea.selectionEnd = start + newText.length;
          
          // Trigger change event
          const event = new Event('input', { bubbles: true });
          textarea.dispatchEvent(event);
        } else {
          // Shift+Tab: unindent selected lines
          e.preventDefault();
          const lines = value.substring(start, end).split('\n');
          const unindentedLines = lines.map(line => {
            if (line.startsWith('  ')) {
              return line.substring(2);
            } else if (line.startsWith('\t')) {
              return line.substring(1);
            }
            return line;
          });
          const newText = unindentedLines.join('\n');
          const newValue = value.substring(0, start) + newText + value.substring(end);
          
          textarea.value = newValue;
          textarea.selectionStart = start;
          textarea.selectionEnd = start + newText.length;
          
          // Trigger change event
          const event = new Event('input', { bubbles: true });
          textarea.dispatchEvent(event);
        }
      }
      
      // Escape key: cancel current operation (if any)
      if (e.key === 'Escape') {
        // This could be used to close dialogs, cancel search, etc.
        // For now, just prevent default
        e.preventDefault();
      }
    },
    [enabled, actions, editorRef]
  );
  
  useEffect(() => {
    if (!enabled) return;
    
    // We need to attach the listener to the textarea element directly
    // to ensure we capture keystrokes before they're handled by the textarea
    const textarea = editorRef.current;
    
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown);
      
      return () => {
        textarea.removeEventListener('keydown', handleKeyDown);
      };
    }
    
    // Fallback to document-level listener if textarea not available
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled, editorRef]);
}

/**
 * Helper hook to get keyboard shortcut labels for the current platform
 */
export function useShortcutLabels(): {
  modifier: string;
  undo: string;
  redo: string;
  save: string;
  insertChord: string;
  insertDirective: string;
  search: string;
  format: string;
  transposeUp: string;
  transposeDown: string;
} {
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modifier = isMac ? '⌘' : 'Ctrl';
  
  return {
    modifier,
    undo: `${modifier}+Z`,
    redo: isMac ? `${modifier}+Shift+Z` : `${modifier}+Y`,
    save: `${modifier}+S`,
    insertChord: `${modifier}+K`,
    insertDirective: `${modifier}+D`,
    search: `${modifier}+F`,
    format: `${modifier}+Shift+F`,
    transposeUp: 'Alt+↑',
    transposeDown: 'Alt+↓',
  };
}