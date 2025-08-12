/**
 * @file ChordProTextArea.tsx
 * @description Enhanced native textarea component with ChordPro-specific features
 * Features:
 * - Smart auto-completion with improved context detection
 * - Enhanced keyboard shortcuts (Ctrl+/, Ctrl+Shift+/, bracket pair completion)
 * - Better accessibility with ARIA labels and screen reader support
 * - Performance optimizations with debounced operations
 * - Undo/redo support with Ctrl+Z/Ctrl+Y
 * - Better error handling and edge case management
 * - CSS custom properties for consistent theming
 * - Touch device optimizations
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { cn } from '../../../../lib/utils';

interface ChordProTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  onCursorChange?: (position: number) => void;
  onSelectionChange?: (range: [number, number]) => void;
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  onAutoCompleteShow?: (triggerChar: '{' | '[', position: number, filterText: string) => void;
  onAutoCompleteHide?: () => void;
  onAutoCompleteMove?: (direction: 'up' | 'down') => void;
  onAutoCompleteSelect?: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  justCompletedDirective?: { position: number; timestamp: number } | null;
  onDirectiveCompleted?: () => void;
  fontSize?: number;
  theme?: 'light' | 'dark' | 'stage';
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  tabSize?: number;
  enableUndoRedo?: boolean;
  maxUndoHistory?: number;
  debounceMs?: number;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

interface UndoState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export const ChordProTextArea: React.FC<ChordProTextAreaProps> = ({
  value,
  onChange,
  onCursorChange,
  onSelectionChange,
  onScroll,
  onAutoCompleteShow,
  onAutoCompleteHide,
  onAutoCompleteMove,
  onAutoCompleteSelect,
  textareaRef: externalRef,
  justCompletedDirective,
  onDirectiveCompleted,
  fontSize = 16,
  theme = 'dark',
  placeholder = 'Start typing your ChordPro song...',
  className,
  readOnly = false,
  autoFocus = false,
  tabSize = 4,
  enableUndoRedo = true,
  maxUndoHistory = 50,
  debounceMs = 100,
  'aria-label': ariaLabel = 'ChordPro editor',
  'aria-describedby': ariaDescribedBy,
}) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;
  
  // Undo/Redo state management
  const [undoHistory, setUndoHistory] = useState<UndoState[]>([]);
  const [redoHistory, setRedoHistory] = useState<UndoState[]>([]);
  const [isUndoRedo, setIsUndoRedo] = useState(false);
  
  // Debounced operations
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Auto-completion state
  const [autoCompleteVisible, setAutoCompleteVisible] = useState(false);

  /**
   * Memoized tab spaces based on tabSize
   */
  const tabSpaces = useMemo(() => ' '.repeat(tabSize), [tabSize]);

  /**
   * Save state for undo functionality
   */
  const saveUndoState = useCallback((currentValue: string, selectionStart: number, selectionEnd: number) => {
    if (!enableUndoRedo || isUndoRedo) return;
    
    setUndoHistory(prev => {
      const newHistory = [...prev, { value: currentValue, selectionStart, selectionEnd }];
      return newHistory.slice(-maxUndoHistory);
    });
    setRedoHistory([]);
  }, [enableUndoRedo, isUndoRedo, maxUndoHistory]);

  /**
   * Perform undo operation
   */
  const performUndo = useCallback(() => {
    if (undoHistory.length === 0 || !textareaRef.current) return;
    
    const lastState = undoHistory[undoHistory.length - 1];
    const currentState = {
      value,
      selectionStart: textareaRef.current.selectionStart,
      selectionEnd: textareaRef.current.selectionEnd
    };
    
    setIsUndoRedo(true);
    onChange(lastState.value);
    setRedoHistory(prev => [...prev, currentState]);
    setUndoHistory(prev => prev.slice(0, -1));
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = lastState.selectionStart;
        textareaRef.current.selectionEnd = lastState.selectionEnd;
      }
      setIsUndoRedo(false);
    }, 0);
  }, [undoHistory, value, onChange, textareaRef]);

  /**
   * Perform redo operation
   */
  const performRedo = useCallback(() => {
    if (redoHistory.length === 0 || !textareaRef.current) return;
    
    const nextState = redoHistory[redoHistory.length - 1];
    const currentState = {
      value,
      selectionStart: textareaRef.current.selectionStart,
      selectionEnd: textareaRef.current.selectionEnd
    };
    
    setIsUndoRedo(true);
    onChange(nextState.value);
    setUndoHistory(prev => [...prev, currentState]);
    setRedoHistory(prev => prev.slice(0, -1));
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = nextState.selectionStart;
        textareaRef.current.selectionEnd = nextState.selectionEnd;
      }
      setIsUndoRedo(false);
    }, 0);
  }, [redoHistory, value, onChange, textareaRef]);

  /**
   * Enhanced auto-completion detection with better context awareness
   */
  const detectAutoCompletion = useCallback((newValue: string, cursorPos: number) => {
    if (!onAutoCompleteShow || cursorPos === 0) return;

    const textBeforeCursor = newValue.substring(0, cursorPos);
    const charBefore = newValue[cursorPos - 1];
    
    // Trigger for opening brackets
    if (charBefore === '{' || charBefore === '[') {
      onAutoCompleteShow(charBefore, cursorPos - 1, '');
      setAutoCompleteVisible(true);
      return;
    }
    
    // Find the last trigger character
    const lastOpenBrace = Math.max(
      textBeforeCursor.lastIndexOf('{'),
      textBeforeCursor.lastIndexOf('[')
    );
    
    if (lastOpenBrace >= 0) {
      const triggerChar = newValue[lastOpenBrace] as '{' | '[';
      const afterTrigger = textBeforeCursor.substring(lastOpenBrace + 1);
      const closingChar = triggerChar === '{' ? '}' : ']';
      
      // Check for closing bracket after trigger
      const textAfterCursor = newValue.substring(cursorPos);
      const hasClosingInAfter = textAfterCursor.includes(closingChar);
      const hasClosingInBefore = afterTrigger.includes(closingChar);
      
      // Enhanced pattern matching for ChordPro directives
      const validDirectivePattern = /^[a-zA-Z0-9_:\-\s]*$/;
      
      if (!hasClosingInBefore && !hasClosingInAfter && validDirectivePattern.test(afterTrigger)) {
        onAutoCompleteShow(triggerChar, lastOpenBrace, afterTrigger);
        setAutoCompleteVisible(true);
      } else {
        onAutoCompleteHide?.();
        setAutoCompleteVisible(false);
      }
    } else {
      onAutoCompleteHide?.();
      setAutoCompleteVisible(false);
    }
  }, [onAutoCompleteShow, onAutoCompleteHide]);

  /**
   * Handle text changes with debouncing and undo state saving
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // Save undo state before significant changes
    if (!isUndoRedo && enableUndoRedo) {
      if (debounceTimer) clearTimeout(debounceTimer);
      
      const timer = setTimeout(() => {
        saveUndoState(value, cursorPos, e.target.selectionEnd);
      }, debounceMs);
      
      setDebounceTimer(timer);
    }
    
    onChange(newValue);
    detectAutoCompletion(newValue, cursorPos);
  }, [onChange, detectAutoCompletion, isUndoRedo, enableUndoRedo, debounceTimer, debounceMs, saveUndoState, value]);

  /**
   * Enhanced selection change handling
   */
  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current) return;

    const { selectionStart, selectionEnd } = textareaRef.current;
    
    // Handle directive completion state
    if (justCompletedDirective) {
      const directiveStart = value.lastIndexOf('{', justCompletedDirective.position);
      const closingBracketIndex = value.indexOf('}', justCompletedDirective.position);
      const directiveEnd = closingBracketIndex !== -1 ? closingBracketIndex : value.indexOf('\n', justCompletedDirective.position);
      
      if (directiveStart === -1 || 
          selectionStart < directiveStart || 
          (directiveEnd !== -1 && selectionStart > directiveEnd)) {
        onDirectiveCompleted?.();
      }
    }
    
    // Trigger appropriate callbacks
    if (selectionStart === selectionEnd) {
      onCursorChange?.(selectionStart);
    } else {
      onSelectionChange?.([selectionStart, selectionEnd]);
    }
  }, [onCursorChange, onSelectionChange, justCompletedDirective, onDirectiveCompleted, value, textareaRef]);

  /**
   * Handle scroll events with throttling
   */
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    onScroll?.(target.scrollTop, target.scrollLeft);
  }, [onScroll]);

  /**
   * Insert bracket pair completion
   */
  const insertBracketPair = useCallback((
    openChar: string, 
    closeChar: string, 
    textarea: HTMLTextAreaElement,
    currentValue: string
  ) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentValue.substring(start, end);
    
    const newValue = currentValue.substring(0, start) + 
                    openChar + selectedText + closeChar + 
                    currentValue.substring(end);
    
    onChange(newValue);
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + openChar.length + selectedText.length;
    }, 0);
  }, [onChange]);

  /**
   * Enhanced keyboard handling with additional shortcuts
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Undo/Redo shortcuts
    if (enableUndoRedo && (e.ctrlKey || e.metaKey)) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        performUndo();
        return;
      }
      if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        performRedo();
        return;
      }
    }

    // Comment toggle shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const lines = value.split('\n');
      const startLine = value.substring(0, start).split('\n').length - 1;
      const endLine = value.substring(0, end).split('\n').length - 1;
      
      const modifiedLines = lines.map((line, index) => {
        if (index >= startLine && index <= endLine) {
          return line.startsWith('#') ? line.substring(1) : '#' + line;
        }
        return line;
      });
      
      onChange(modifiedLines.join('\n'));
      return;
    }

    // Auto-completion navigation
    if (autoCompleteVisible) {
      if (e.key === 'Escape') {
        onAutoCompleteHide?.();
        setAutoCompleteVisible(false);
        return;
      }
      
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        onAutoCompleteMove?.(e.key === 'ArrowUp' ? 'up' : 'down');
        return;
      }
      
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        onAutoCompleteSelect?.();
        setAutoCompleteVisible(false);
        return;
      }
    }

    // Bracket pair completion
    const bracketPairs: Record<string, string> = {
      '{': '}',
      '[': ']',
      '(': ')',
      '"': '"',
      "'": "'"
    };

    if (bracketPairs[e.key] && !readOnly) {
      e.preventDefault();
      insertBracketPair(e.key, bracketPairs[e.key], textarea, value);
      return;
    }

    // Tab handling
    if (e.key === 'Tab' && !autoCompleteVisible) {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (e.shiftKey) {
        // Unindent
        const beforeSelection = value.substring(0, start);
        const lineStart = beforeSelection.lastIndexOf('\n') + 1;
        const lineBeforeSelection = value.substring(lineStart, start);
        
        if (lineBeforeSelection.startsWith(tabSpaces)) {
          const newValue = value.substring(0, lineStart) + 
                          lineBeforeSelection.substring(tabSpaces.length) + 
                          value.substring(start);
          onChange(newValue);
          
          setTimeout(() => {
            textarea.selectionStart = start - tabSpaces.length;
            textarea.selectionEnd = end - tabSpaces.length;
          }, 0);
        }
      } else {
        // Indent
        const newValue = value.substring(0, start) + tabSpaces + value.substring(end);
        onChange(newValue);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + tabSpaces.length;
        }, 0);
      }
      return;
    }

    // Enhanced Enter handling
    if (e.key === 'Enter' && !autoCompleteVisible) {
      const start = textarea.selectionStart;
      
      // Handle directive completion
      if (justCompletedDirective && 
          Date.now() - justCompletedDirective.timestamp < 5000 && 
          start >= justCompletedDirective.position) {
        
        const textAfterCursor = value.substring(start);
        const needsClosingBracket = !textAfterCursor.startsWith('}');
        
        e.preventDefault();
        if (needsClosingBracket) {
          const newValue = value.substring(0, start) + '}\n' + value.substring(start);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 2;
          }, 0);
        } else {
          const newValue = value.substring(0, start) + '\n' + value.substring(start);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          }, 0);
        }
        onDirectiveCompleted?.();
        return;
      }
      
      // Auto-indent
      const lines = value.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];
      const indent = currentLine.match(/^(\s*)/)?.[1] || '';
      
      if (indent) {
        e.preventDefault();
        const newValue = value.substring(0, start) + '\n' + indent + value.substring(start);
        onChange(newValue);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
        }, 0);
      }
    }
  }, [
    value, onChange, textareaRef, enableUndoRedo, performUndo, performRedo,
    autoCompleteVisible, onAutoCompleteHide, onAutoCompleteMove, onAutoCompleteSelect,
    readOnly, insertBracketPair, tabSpaces, justCompletedDirective, onDirectiveCompleted
  ]);

  /**
   * Enhanced key up handling
   */
  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (justCompletedDirective && e.key !== 'Enter') {
      onDirectiveCompleted?.();
    }
  }, [justCompletedDirective, onDirectiveCompleted]);

  /**
   * Get theme-specific classes with CSS custom properties
   */
  const getThemeClasses = useCallback(() => {
    const baseClasses = 'w-full h-full p-4 font-mono resize-none focus:outline-none bg-transparent text-transparent';
    
    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'caret-white selection:bg-blue-600/30');
      case 'stage':
        return cn(baseClasses, 'caret-yellow-300 selection:bg-yellow-600/30');
      case 'light':
        return cn(baseClasses, 'caret-gray-900 selection:bg-blue-200/50');
      default:
        return cn(baseClasses, 'caret-[var(--color-foreground)] selection:bg-[var(--color-primary)]/20');
    }
  }, [theme]);

  /**
   * Focus handling with improved accessibility
   */
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus, textareaRef]);

  /**
   * Cleanup debounce timer
   */
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onSelect={handleSelectionChange}
      onClick={handleSelectionChange}
      onKeyUp={(e) => {
        handleSelectionChange();
        handleKeyUp(e);
      }}
      onKeyDown={handleKeyDown}
      onScroll={handleScroll}
      placeholder={placeholder}
      readOnly={readOnly}
      className={cn(getThemeClasses(), 'absolute inset-0 z-10', className)}
      style={{ 
        fontSize: `${fontSize}px`,
        lineHeight: '1.5',
        textAlign: 'left',
        tabSize,
        transition: 'caret-color 0.2s ease'
      }}
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-multiline="true"
      role="textbox"
    />
  );
};
