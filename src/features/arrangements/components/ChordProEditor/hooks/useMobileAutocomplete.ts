import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { debounce } from 'lodash-es';
import { 
  searchDirectives,
  getCommonDirectives,
  type AutocompleteItem 
} from '../data/chordProDirectives';
import { 
  getSmartChordSuggestions
} from '../data/chordSuggestions';

interface UseMobileAutocompleteOptions {
  onSelect?: (item: AutocompleteItem, trigger: string, position: number) => void;
  onChange?: (newContent: string, cursorPos: number) => void;
  maxSuggestions?: number;
  debounceMs?: number;
  enabled?: boolean;
}

interface AutocompleteState {
  isOpen: boolean;
  items: AutocompleteItem[];
  selectedIndex: number;
  trigger: '{' | '[' | null;
  triggerPosition: number;
  searchTerm: string;
  anchorEl: HTMLElement | null;
  isSearching?: boolean;
}

/**
 * Custom hook for mobile-optimized autocomplete functionality
 * Handles both ChordPro directives ({) and chord suggestions ([)
 */
export const useMobileAutocomplete = (
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  content: string,
  options: UseMobileAutocompleteOptions = {}
) => {
  const {
    onSelect,
    onChange,
    maxSuggestions = 20,
    debounceMs = 50, // Reduced for instant filtering
    enabled = true,
  } = options;

  const [state, setState] = useState<AutocompleteState>({
    isOpen: false,
    items: [],
    selectedIndex: 0,
    trigger: null,
    triggerPosition: -1,
    searchTerm: '',
    anchorEl: null,
    isSearching: false,
  });

  const lastKeyRef = useRef<string>('');
  const composingRef = useRef<boolean>(false);

  /**
   * Get suggestions based on trigger and search term
   */
  const getSuggestions = useCallback((
    trigger: '{' | '[',
    searchTerm: string
  ): AutocompleteItem[] => {
    if (trigger === '{') {
      // ChordPro directives
      if (searchTerm) {
        return searchDirectives(searchTerm);
      }
      return getCommonDirectives();
    } else if (trigger === '[') {
      // Chord suggestions
      // Extract key from content if available
      const keyMatch = content.match(/{key:\s*([A-G][#b]?m?)\}/i);
      const key = keyMatch ? keyMatch[1] : undefined;
      
      // Get the previous chord if available
      const cursorPos = textareaRef.current?.selectionStart || 0;
      const textBefore = content.substring(0, cursorPos);
      const lastChordMatch = textBefore.match(/\[([^\]]+)\][^[]*$/);
      const previousChord = lastChordMatch ? lastChordMatch[1] : undefined;
      
      return getSmartChordSuggestions(content, key, previousChord);
    }
    return [];
  }, [content, textareaRef]);

  /**
   * Check for trigger character and open autocomplete
   */
  const checkForTrigger = useCallback((
    cursorPosition: number
  ) => {
    if (!enabled || !textareaRef.current) return;

    const text = textareaRef.current.value;
    const charBefore = cursorPosition > 0 ? text[cursorPosition - 1] : '';
    
    // Check for trigger characters
    if (charBefore === '{' || charBefore === '[') {
      const trigger = charBefore as '{' | '[';
      const suggestions = getSuggestions(trigger, '');
      
      setState({
        isOpen: true,
        items: suggestions.slice(0, maxSuggestions),
        selectedIndex: 0,
        trigger,
        triggerPosition: cursorPosition - 1,
        searchTerm: '',
        anchorEl: textareaRef.current,
      });
    }
  }, [enabled, textareaRef, getSuggestions, maxSuggestions]);

  /**
   * Close autocomplete
   */
  const closeAutocomplete = useCallback(() => {
    setState({
      isOpen: false,
      items: [],
      selectedIndex: 0,
      trigger: null,
      triggerPosition: -1,
      searchTerm: '',
      anchorEl: null,
      isSearching: false,
    });
  }, []);

  /**
   * Update search term and filter suggestions
   */
  const updateSearchTerm = useCallback((
    cursorPosition: number
  ) => {
    if (!state.isOpen || state.triggerPosition === -1 || !textareaRef.current) {
      return;
    }

    const text = textareaRef.current.value;
    const searchTerm = text.substring(state.triggerPosition + 1, cursorPosition);
    
    // Close if closing bracket is typed
    if (
      (state.trigger === '{' && searchTerm.includes('}')) ||
      (state.trigger === '[' && searchTerm.includes(']'))
    ) {
      closeAutocomplete();
      return;
    }

    // Set searching state
    setState(prev => ({ ...prev, isSearching: true }));

    // Update suggestions based on search term
    const suggestions = getSuggestions(state.trigger!, searchTerm);
    
    setState(prev => ({
      ...prev,
      searchTerm,
      items: suggestions.slice(0, maxSuggestions),
      selectedIndex: 0,
      isSearching: false,
    }));
  }, [state.isOpen, state.triggerPosition, state.trigger, textareaRef, getSuggestions, maxSuggestions, closeAutocomplete]);

  /**
   * Debounced update for performance
   */
  const debouncedUpdateSearchTerm = useMemo(
    () => debounce(updateSearchTerm, debounceMs),
    [updateSearchTerm, debounceMs]
  );

  /**
   * Handle text input changes
   */
  const handleInput = useCallback(() => {
    if (!textareaRef.current || composingRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart || 0;
    
    if (state.isOpen) {
      debouncedUpdateSearchTerm(cursorPosition);
    } else {
      checkForTrigger(cursorPosition);
    }
  }, [textareaRef, state.isOpen, debouncedUpdateSearchTerm, checkForTrigger]);

  /**
   * Insert selected suggestion
   */
  const insertSuggestion = useCallback((
    item: AutocompleteItem
  ) => {
    if (!textareaRef.current || state.triggerPosition === -1) return;

    const textarea = textareaRef.current;
    const text = textarea.value;
    const startPos = state.triggerPosition;
    const endPos = textarea.selectionStart || 0;
    
    let insertText = '';
    let cursorOffset = 0;
    
    if (state.trigger === '{') {
      // Insert directive with closing brace
      insertText = `{${item.value}}`;
      cursorOffset = item.value.endsWith(':') 
        ? insertText.length - 1 // Position before closing brace
        : insertText.length; // Position after closing brace
    } else if (state.trigger === '[') {
      // Insert chord with closing bracket
      insertText = `[${item.value}]`;
      cursorOffset = insertText.length; // Position after closing bracket
    }
    
    // Update textarea value through React
    const newText = text.substring(0, startPos) + insertText + text.substring(endPos);
    const newCursorPos = startPos + cursorOffset;
    
    // Call onChange to update React state
    if (onChange) {
      onChange(newText, newCursorPos);
    } else {
      // Fallback: directly update textarea and dispatch event
      textarea.value = newText;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      
      // Trigger input event for React
      const inputEvent = new Event('input', { bubbles: true });
      textarea.dispatchEvent(inputEvent);
    }
    
    // Focus textarea
    textarea.focus();
    
    // Call onSelect callback
    onSelect?.(item, state.trigger!, state.triggerPosition);
    
    // Close autocomplete
    closeAutocomplete();
  }, [textareaRef, state.triggerPosition, state.trigger, onSelect, onChange, closeAutocomplete]);

  /**
   * Force open autocomplete with current context
   */
  const forceOpenAutocomplete = useCallback(() => {
    if (!enabled || !textareaRef.current) return;
    
    const text = textareaRef.current.value;
    const cursorPosition = textareaRef.current.selectionStart || 0;
    
    // Find the most recent trigger character before cursor
    let triggerPos = -1;
    let trigger: '{' | '[' | null = null;
    
    // Search backwards for an unclosed trigger
    for (let i = cursorPosition - 1; i >= 0; i--) {
      const char = text[i];
      
      if (char === '{') {
        // Check if this bracket is closed
        const closePos = text.indexOf('}', i);
        if (closePos === -1 || closePos >= cursorPosition) {
          trigger = '{';
          triggerPos = i;
          break;
        }
      } else if (char === '[') {
        // Check if this bracket is closed
        const closePos = text.indexOf(']', i);
        if (closePos === -1 || closePos >= cursorPosition) {
          trigger = '[';
          triggerPos = i;
          break;
        }
      }
      
      // Stop searching if we hit a newline
      if (char === '\n') break;
    }
    
    if (trigger && triggerPos >= 0) {
      const searchTerm = text.substring(triggerPos + 1, cursorPosition);
      const suggestions = getSuggestions(trigger, searchTerm);
      
      setState({
        isOpen: true,
        items: suggestions.slice(0, maxSuggestions),
        selectedIndex: 0,
        trigger,
        triggerPosition: triggerPos,
        searchTerm,
        anchorEl: textareaRef.current,
      });
    } else {
      // No trigger found, show common directives
      const suggestions = getCommonDirectives();
      
      setState({
        isOpen: true,
        items: suggestions.slice(0, maxSuggestions),
        selectedIndex: 0,
        trigger: '{',
        triggerPosition: cursorPosition,
        searchTerm: '',
        anchorEl: textareaRef.current,
      });
    }
  }, [enabled, textareaRef, getSuggestions, maxSuggestions]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ): boolean => {
    lastKeyRef.current = event.key;

    // Handle Ctrl+Space to force open autocomplete
    if (event.key === ' ' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      forceOpenAutocomplete();
      return true;
    }

    if (!state.isOpen) return false;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setState(prev => ({
          ...prev,
          selectedIndex: prev.selectedIndex > 0 
            ? prev.selectedIndex - 1 
            : prev.items.length - 1,
        }));
        return true;

      case 'ArrowDown':
        event.preventDefault();
        setState(prev => ({
          ...prev,
          selectedIndex: prev.selectedIndex < prev.items.length - 1
            ? prev.selectedIndex + 1
            : 0,
        }));
        return true;

      case 'Enter':
      case 'Tab':
        if (state.items.length > 0) {
          event.preventDefault();
          const selectedItem = state.items[state.selectedIndex];
          insertSuggestion(selectedItem);
          return true;
        }
        break;

      case 'Escape':
        event.preventDefault();
        closeAutocomplete();
        return true;

      case ' ':
        // Close on space for directives (they don't have spaces)
        if (state.trigger === '{') {
          closeAutocomplete();
        }
        break;
    }

    return false;
  }, [state.isOpen, state.items, state.selectedIndex, state.trigger, forceOpenAutocomplete, insertSuggestion, closeAutocomplete]);

  /**
   * Handle composition events (IME input)
   */
  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    composingRef.current = false;
    handleInput();
  }, [handleInput]);

  /**
   * Handle item selection from dropdown
   */
  const handleItemSelect = useCallback((item: AutocompleteItem) => {
    insertSuggestion(item);
  }, [insertSuggestion]);

  /**
   * Handle cursor position changes
   */
  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current || !state.isOpen) return;
    
    const cursorPosition = textareaRef.current.selectionStart || 0;
    
    // Close if cursor moved outside of trigger range
    if (cursorPosition <= state.triggerPosition) {
      closeAutocomplete();
    }
  }, [textareaRef, state.isOpen, state.triggerPosition, closeAutocomplete]);

  // Add selection change listener
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelect = () => handleSelectionChange();
    
    textarea.addEventListener('select', handleSelect);
    return () => textarea.removeEventListener('select', handleSelect);
  }, [textareaRef, handleSelectionChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateSearchTerm.cancel();
    };
  }, [debouncedUpdateSearchTerm]);

  return {
    // State
    isOpen: state.isOpen,
    items: state.items,
    selectedIndex: state.selectedIndex,
    anchorEl: state.anchorEl,
    isSearching: state.isSearching,
    
    // Handlers
    handleInput,
    handleKeyDown,
    handleCompositionStart,
    handleCompositionEnd,
    handleItemSelect,
    closeAutocomplete,
    
    // Utils
    insertSuggestion,
  };
};

export default useMobileAutocomplete;