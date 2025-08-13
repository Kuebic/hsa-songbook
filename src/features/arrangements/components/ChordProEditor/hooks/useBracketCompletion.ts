import { useCallback, useRef, useEffect } from 'react';
import {
  isOpeningBracket,
  isClosingBracket,
  getBracketPair,
  shouldAutoClose,
  wasAutoInserted,
  cleanupOldPairs
} from '../utils/bracketPairs';
import type { InsertedPair } from '../utils/bracketPairs';

interface UseBracketCompletionOptions {
  enabled?: boolean;
  autoCloseBrackets?: boolean;
  autoCloseBefore?: string; // Characters before which to auto-close
  autoDeletePairs?: boolean;
  autoOvertype?: boolean;
}

interface UseBracketCompletionReturn {
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
  handleBeforeInput: (e: InputEvent) => boolean;
  clearAutoInsertedPairs: () => void;
}

/**
 * Hook for smart bracket completion in ChordPro editor
 * Provides IDE-like bracket handling:
 * - Auto-closing brackets
 * - Overtype behavior for closing brackets
 * - Smart deletion of bracket pairs
 */
export const useBracketCompletion = (
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  content: string,
  onChange: (content: string, cursorPos: number) => void,
  options: UseBracketCompletionOptions = {}
): UseBracketCompletionReturn => {
  const {
    enabled = true,
    autoCloseBrackets = true,
    autoCloseBefore = ' \t\n)}]>',
    autoDeletePairs = true,
    autoOvertype = true,
  } = options;

  // Track auto-inserted bracket pairs
  const autoInsertedPairsRef = useRef<Map<number, InsertedPair>>(new Map());
  
  // Clean up old pairs periodically
  useEffect(() => {
    const interval = setInterval(() => {
      autoInsertedPairsRef.current = cleanupOldPairs(autoInsertedPairsRef.current);
    }, 10000); // Clean every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  /**
   * Handle character insertion before it happens
   */
  const handleBeforeInput = useCallback((e: InputEvent): boolean => {
    if (!enabled || !textareaRef.current || e.inputType !== 'insertText') {
      return false;
    }
    
    const char = e.data;
    if (!char || char.length !== 1) return false;
    
    const textarea = textareaRef.current;
    const position = textarea.selectionStart || 0;
    const selectionEnd = textarea.selectionEnd || 0;
    
    // Handle opening bracket with auto-close
    if (autoCloseBrackets && isOpeningBracket(char)) {
      if (shouldAutoClose(content, position, char)) {
        e.preventDefault();
        
        const pair = getBracketPair(char);
        if (!pair) return false;
        
        // If there's a selection, wrap it
        if (position !== selectionEnd) {
          const selectedText = content.substring(position, selectionEnd);
          const newContent = 
            content.slice(0, position) + 
            char + selectedText + pair.close + 
            content.slice(selectionEnd);
          
          onChange(newContent, position + selectedText.length + 1);
        } else {
          // Insert bracket pair
          const nextChar = content[position] || '';
          // const shouldAddSpace = autoCloseBefore.includes(nextChar); // For future use
          
          const newContent = 
            content.slice(0, position) + 
            char + pair.close + 
            content.slice(position);
          
          // Track this auto-insertion
          autoInsertedPairsRef.current.set(position, {
            open: char,
            close: pair.close,
            insertedAt: Date.now(),
            position
          });
          
          // Position cursor between brackets
          onChange(newContent, position + 1);
        }
        
        return true;
      }
    }
    
    // Handle closing bracket with overtype
    if (autoOvertype && isClosingBracket(char)) {
      const nextChar = content[position];
      
      if (nextChar === char && wasAutoInserted(autoInsertedPairsRef.current, position, char)) {
        e.preventDefault();
        // Just move cursor forward (overtype)
        onChange(content, position + 1);
        
        // Remove from tracking since we've overtyped it
        autoInsertedPairsRef.current.delete(position - 1);
        
        return true;
      }
    }
    
    return false;
  }, [enabled, textareaRef, content, onChange, autoCloseBrackets, autoOvertype, autoCloseBefore]);

  /**
   * Handle keyboard events for smart deletion
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
    if (!enabled || !textareaRef.current) return false;
    
    const textarea = textareaRef.current;
    const position = textarea.selectionStart || 0;
    const selectionEnd = textarea.selectionEnd || 0;
    
    // Handle backspace for smart deletion
    if (e.key === 'Backspace' && autoDeletePairs && position === selectionEnd) {
      const prevChar = content[position - 1];
      const nextChar = content[position];
      
      if (prevChar && nextChar) {
        const pair = getBracketPair(prevChar);
        
        // Check if we're between matching brackets
        if (pair && pair.open === prevChar && pair.close === nextChar) {
          // Check if this was an auto-inserted pair
          const autoInserted = autoInsertedPairsRef.current.get(position - 1);
          
          if (autoInserted && autoInserted.close === nextChar) {
            e.preventDefault();
            
            // Delete both brackets
            const newContent = 
              content.slice(0, position - 1) + 
              content.slice(position + 1);
            
            onChange(newContent, position - 1);
            
            // Remove from tracking
            autoInsertedPairsRef.current.delete(position - 1);
            
            return true;
          }
        }
      }
    }
    
    // Handle Enter key to maintain indentation
    if (e.key === 'Enter') {
      const prevChar = content[position - 1];
      const nextChar = content[position];
      
      if (prevChar && nextChar) {
        const pair = getBracketPair(prevChar);
        
        // Check if we're between brackets
        if (pair && pair.open === prevChar && pair.close === nextChar) {
          e.preventDefault();
          
          // Get current line indentation
          const lineStart = content.lastIndexOf('\n', position - 1) + 1;
          const currentLine = content.substring(lineStart, position - 1);
          const indentMatch = currentLine.match(/^(\s*)/);
          const currentIndent = indentMatch ? indentMatch[1] : '';
          
          // Insert newline with proper indentation
          const newContent = 
            content.slice(0, position) + 
            '\n' + currentIndent + '  ' + // Extra indent inside brackets
            '\n' + currentIndent + // Back to original indent for closing bracket
            content.slice(position);
          
          // Position cursor on the indented line
          onChange(newContent, position + currentIndent.length + 3);
          
          return true;
        }
      }
    }
    
    return false;
  }, [enabled, textareaRef, content, onChange, autoDeletePairs]);

  /**
   * Clear all tracked auto-inserted pairs
   */
  const clearAutoInsertedPairs = useCallback(() => {
    autoInsertedPairsRef.current.clear();
  }, []);

  // Clear pairs when content changes significantly (e.g., paste, undo)
  useEffect(() => {
    
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('paste', clearAutoInsertedPairs);
      textarea.addEventListener('cut', clearAutoInsertedPairs);
      
      return () => {
        textarea.removeEventListener('paste', clearAutoInsertedPairs);
        textarea.removeEventListener('cut', clearAutoInsertedPairs);
      };
    }
  }, [textareaRef, clearAutoInsertedPairs]);

  return {
    handleKeyDown,
    handleBeforeInput,
    clearAutoInsertedPairs
  };
};

export default useBracketCompletion;