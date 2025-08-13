/**
 * @file ChordProTextArea.tsx
 * @description Native textarea component with ChordPro-specific enhancements
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '../../../../lib/utils';

interface ChordProTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  onCursorChange?: (position: number) => void;
  onSelectionChange?: (range: [number, number]) => void;
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean | void;
  onInput?: () => void;
  onBeforeInput?: (e: InputEvent) => boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  justCompletedDirective?: { position: number; timestamp: number } | null;
  onDirectiveCompleted?: () => void;
  theme?: 'light' | 'dark' | 'stage';
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
}

export const ChordProTextArea: React.FC<ChordProTextAreaProps> = ({
  value,
  onChange,
  onCursorChange,
  onSelectionChange,
  onScroll,
  onKeyDown,
  onInput,
  onBeforeInput,
  textareaRef: externalRef,
  justCompletedDirective,
  onDirectiveCompleted,
  theme = 'light',
  placeholder = 'Start typing your ChordPro song...',
  className,
  readOnly = false,
  autoFocus = false
}) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;

  /**
   * Handle text changes and trigger auto-completion
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    onChange(newValue);
    
    // Call onInput for autocomplete handling
    onInput?.();
  }, [onChange, onInput]);

  /**
   * Handle selection changes
   */
  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current) return;

    const { selectionStart, selectionEnd } = textareaRef.current;
    
    // Clear directive completion state if cursor moved away from directive area
    if (justCompletedDirective) {
      // Find the directive area - from { to } or end of line if no }
      const directiveStart = value.lastIndexOf('{', justCompletedDirective.position);
      const closingBracketIndex = value.indexOf('}', justCompletedDirective.position);
      const directiveEnd = closingBracketIndex !== -1 ? closingBracketIndex : value.indexOf('\n', justCompletedDirective.position);
      
      if (directiveStart === -1 || 
          selectionStart < directiveStart || 
          (directiveEnd !== -1 && selectionStart > directiveEnd)) {
        onDirectiveCompleted?.();
      }
    }
    
    if (selectionStart === selectionEnd) {
      onCursorChange?.(selectionStart);
    } else {
      onSelectionChange?.([selectionStart, selectionEnd]);
    }
  }, [onCursorChange, onSelectionChange, justCompletedDirective, onDirectiveCompleted, value, textareaRef]);

  /**
   * Handle scroll events
   */
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    onScroll?.(target.scrollTop, target.scrollLeft);
  }, [onScroll]);

  /**
   * Handle key down events for special behaviors and auto-completion navigation
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // First, let external handler process the event (autocomplete)
    if (onKeyDown) {
      const handled = onKeyDown(e);
      if (handled) {
        return; // Event was handled by autocomplete
      }
    }
    
    const textarea = textareaRef.current;
    if (!textarea) return;


    // Tab key inserts 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '    ';
      
      const newValue = value.substring(0, start) + spaces + value.substring(end);
      onChange(newValue);
      
      // Move cursor after inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
      return;
    }

    // Auto-indent on Enter
    if (e.key === 'Enter') {
      const start = textarea.selectionStart;
      
      // Check if we just completed a directive and should handle Enter specially
      if (justCompletedDirective && 
          Date.now() - justCompletedDirective.timestamp < 5000 && // 5 second window
          start >= justCompletedDirective.position) { // Cursor is after or at completion position
        
        // Check if we need to add closing bracket
        const textAfterCursor = value.substring(start);
        const needsClosingBracket = !textAfterCursor.startsWith('}');
        
        if (needsClosingBracket) {
          // Add closing bracket, then newline
          e.preventDefault();
          const newValue = value.substring(0, start) + '}\n' + value.substring(start);
          onChange(newValue);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 2; // After }\n
          }, 0);
        } else {
          // Closing bracket exists, just insert newline and leave } in place
          e.preventDefault();
          const newValue = value.substring(0, start) + '\n' + value.substring(start);
          onChange(newValue);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1; // After \n
          }, 0);
        }
        
        // Clear the directive completion state
        onDirectiveCompleted?.();
        return;
      }
      
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
  }, [value, onChange, onKeyDown, justCompletedDirective, onDirectiveCompleted, textareaRef]);

  /**
   * Clear directive completion state when cursor moves or other keys are pressed
   */
  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Clear directive completion state on any key except Enter
    if (justCompletedDirective && e.key !== 'Enter') {
      onDirectiveCompleted?.();
    }
  }, [justCompletedDirective, onDirectiveCompleted]);

  /**
   * Handle beforeInput event for bracket completion
   */
  const handleBeforeInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    if (onBeforeInput) {
      // Cast to unknown first, then to InputEvent to satisfy TypeScript
      const handled = onBeforeInput(e as unknown as InputEvent);
      if (handled) {
        return; // Event was handled by bracket completion
      }
    }
  }, [onBeforeInput]);

  /**
   * Get theme-specific classes
   */
  const getThemeClasses = () => {
    // Base classes for the textarea - text-transparent allows syntax to show through
    // The debug class is added separately to make text visible in red
    const baseClasses = 'resize-none focus:outline-none bg-transparent text-transparent';
    
    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'caret-white');
      case 'stage':
        return cn(baseClasses, 'caret-yellow-300');
      default:
        return cn(baseClasses, 'caret-gray-900');
    }
  };

  /**
   * Focus textarea on mount if autoFocus is true
   */
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus, textareaRef]);

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
      onBeforeInput={handleBeforeInput}
      onScroll={handleScroll}
      placeholder={placeholder}
      readOnly={readOnly}
      className={cn(getThemeClasses(), 'chord-editor-textarea', className)}
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
    />
  );
};