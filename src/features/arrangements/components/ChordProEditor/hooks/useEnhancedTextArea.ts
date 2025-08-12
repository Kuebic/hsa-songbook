/**
 * @file useEnhancedTextArea.ts
 * @description Hook for managing enhanced ChordPro textarea functionality
 */

import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import {
  UndoRedoState,
  AutoCompleteContext,
  TextAreaMetrics,
  ValidationResult,
  TextAreaConfig,
  DirectiveCompletion
} from '../types';
import {
  calculateTextAreaMetrics,
  validateChordProContent,
  findAutoCompleteContext,
  getChordProDirectives,
  getCommonChords,
  filterSuggestions,
  createUndoState,
  shouldSaveUndoState
} from '../utils/textAreaUtils';

interface UseEnhancedTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  config?: Partial<TextAreaConfig>;
  enableLiveValidation?: boolean;
  enableMetrics?: boolean;
}

interface UseEnhancedTextAreaReturn {
  // State
  undoHistory: UndoRedoState[];
  redoHistory: UndoRedoState[];
  autoCompleteContext: AutoCompleteContext | null;
  metrics: TextAreaMetrics | null;
  validation: ValidationResult | null;
  justCompletedDirective: DirectiveCompletion | null;
  
  // Actions
  performUndo: () => void;
  performRedo: () => void;
  showAutoComplete: (triggerChar: '{' | '[', position: number, filterText: string) => void;
  hideAutoComplete: () => void;
  moveAutoComplete: (direction: 'up' | 'down') => void;
  selectAutoComplete: () => void;
  completeDirective: (position: number, type: 'chord' | 'directive' | 'comment') => void;
  clearDirectiveCompletion: () => void;
  
  // Getters
  getSuggestions: () => string[];
  canUndo: boolean;
  canRedo: boolean;
  isAutoCompleteVisible: boolean;
  
  // Config
  effectiveConfig: TextAreaConfig;
}

const defaultConfig: TextAreaConfig = {
  tabSize: 4,
  enableUndoRedo: true,
  maxUndoHistory: 50,
  debounceMs: 100,
  enableBracketPairs: true,
  enableAutoIndent: true,
  enableCommentToggle: true,
  keyboardShortcuts: [
    { key: 'z', ctrlKey: true, action: 'undo', description: 'Undo' },
    { key: 'y', ctrlKey: true, action: 'redo', description: 'Redo' },
    { key: 'z', ctrlKey: true, shiftKey: true, action: 'redo', description: 'Redo' },
    { key: '/', ctrlKey: true, action: 'toggle-comment', description: 'Toggle comment' },
    { key: 'Tab', action: 'indent', description: 'Indent' },
    { key: 'Tab', shiftKey: true, action: 'unindent', description: 'Unindent' },
  ]
};

export function useEnhancedTextArea({
  value,
  onChange,
  config = {},
  enableLiveValidation = true,
  enableMetrics = true
}: UseEnhancedTextAreaProps): UseEnhancedTextAreaReturn {
  
  // Merge config with defaults
  const effectiveConfig = useMemo(() => ({
    ...defaultConfig,
    ...config
  }), [config]);

  // State management
  const [undoHistory, setUndoHistory] = useState<UndoRedoState[]>([]);
  const [redoHistory, setRedoHistory] = useState<UndoRedoState[]>([]);
  const [autoCompleteContext, setAutoCompleteContext] = useState<AutoCompleteContext | null>(null);
  const [metrics, setMetrics] = useState<TextAreaMetrics | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [justCompletedDirective, setJustCompletedDirective] = useState<DirectiveCompletion | null>(null);
  
  // Refs for internal state
  const isUndoRedoOperation = useRef(false);
  const lastSavedState = useRef<UndoRedoState | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Save undo state
   */
  const saveUndoState = useCallback((
    currentValue: string,
    selectionStart: number,
    selectionEnd: number
  ) => {
    if (!effectiveConfig.enableUndoRedo || isUndoRedoOperation.current) return;
    
    const newState = createUndoState(currentValue, selectionStart, selectionEnd);
    
    if (!shouldSaveUndoState(newState, lastSavedState.current)) return;
    
    setUndoHistory(prev => {
      const newHistory = [...prev, newState];
      return newHistory.slice(-effectiveConfig.maxUndoHistory);
    });
    
    setRedoHistory([]);
    lastSavedState.current = newState;
  }, [effectiveConfig.enableUndoRedo, effectiveConfig.maxUndoHistory]);

  /**
   * Perform undo operation
   */
  const performUndo = useCallback(() => {
    if (undoHistory.length === 0) return;
    
    const lastState = undoHistory[undoHistory.length - 1];
    const currentState = createUndoState(value, 0, 0); // Selection will be restored
    
    isUndoRedoOperation.current = true;
    onChange(lastState.value);
    
    setRedoHistory(prev => [...prev, currentState]);
    setUndoHistory(prev => prev.slice(0, -1));
    
    // Reset flag after state update
    setTimeout(() => {
      isUndoRedoOperation.current = false;
    }, 0);
  }, [undoHistory, value, onChange]);

  /**
   * Perform redo operation
   */
  const performRedo = useCallback(() => {
    if (redoHistory.length === 0) return;
    
    const nextState = redoHistory[redoHistory.length - 1];
    const currentState = createUndoState(value, 0, 0);
    
    isUndoRedoOperation.current = true;
    onChange(nextState.value);
    
    setUndoHistory(prev => [...prev, currentState]);
    setRedoHistory(prev => prev.slice(0, -1));
    
    setTimeout(() => {
      isUndoRedoOperation.current = false;
    }, 0);
  }, [redoHistory, value, onChange]);

  /**
   * Show auto-completion
   */
  const showAutoComplete = useCallback((
    triggerChar: '{' | '[', 
    position: number, 
    filterText: string
  ) => {
    setAutoCompleteContext({
      triggerChar,
      triggerPosition: position,
      filterText,
      isVisible: true,
      selectedIndex: 0
    });
  }, []);

  /**
   * Hide auto-completion
   */
  const hideAutoComplete = useCallback(() => {
    setAutoCompleteContext(null);
  }, []);

  /**
   * Move auto-completion selection
   */
  const moveAutoComplete = useCallback((direction: 'up' | 'down') => {
    setAutoCompleteContext(prev => {
      if (!prev) return null;
      
      const suggestions = getSuggestions();
      const maxIndex = suggestions.length - 1;
      
      let newIndex = prev.selectedIndex;
      if (direction === 'up') {
        newIndex = newIndex > 0 ? newIndex - 1 : maxIndex;
      } else {
        newIndex = newIndex < maxIndex ? newIndex + 1 : 0;
      }
      
      return { ...prev, selectedIndex: newIndex };
    });
  }, []);

  /**
   * Select auto-completion item
   */
  const selectAutoComplete = useCallback(() => {
    if (!autoCompleteContext) return;
    
    const suggestions = getSuggestions();
    const selectedSuggestion = suggestions[autoCompleteContext.selectedIndex];
    
    if (!selectedSuggestion) return;
    
    const triggerStart = autoCompleteContext.triggerPosition;
    const filterEnd = triggerStart + 1 + autoCompleteContext.filterText.length;
    const closingChar = autoCompleteContext.triggerChar === '{' ? '}' : ']';
    
    const newValue = value.substring(0, triggerStart + 1) + 
                    selectedSuggestion + 
                    (autoCompleteContext.triggerChar === '{' ? closingChar : '') +
                    value.substring(filterEnd);
    
    onChange(newValue);
    
    // Mark directive as completed
    if (autoCompleteContext.triggerChar === '{') {
      completeDirective(
        triggerStart + 1 + selectedSuggestion.length,
        'directive'
      );
    }
    
    hideAutoComplete();
  }, [autoCompleteContext, value, onChange]);

  /**
   * Complete directive
   */
  const completeDirective = useCallback((
    position: number, 
    type: 'chord' | 'directive' | 'comment'
  ) => {
    setJustCompletedDirective({
      position,
      timestamp: Date.now(),
      directiveType: type
    });
  }, []);

  /**
   * Clear directive completion
   */
  const clearDirectiveCompletion = useCallback(() => {
    setJustCompletedDirective(null);
  }, []);

  /**
   * Get suggestions for auto-completion
   */
  const getSuggestions = useCallback((): string[] => {
    if (!autoCompleteContext) return [];
    
    const suggestions = autoCompleteContext.triggerChar === '{'
      ? getChordProDirectives()
      : getCommonChords();
    
    return filterSuggestions(suggestions, autoCompleteContext.filterText);
  }, [autoCompleteContext]);

  // Computed properties
  const canUndo = undoHistory.length > 0;
  const canRedo = redoHistory.length > 0;
  const isAutoCompleteVisible = autoCompleteContext?.isVisible ?? false;

  /**
   * Update metrics when value changes
   */
  useEffect(() => {
    if (!enableMetrics) return;
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      const newMetrics = calculateTextAreaMetrics(value, 0, 0);
      setMetrics(newMetrics);
    }, effectiveConfig.debounceMs);
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, enableMetrics, effectiveConfig.debounceMs]);

  /**
   * Update validation when value changes
   */
  useEffect(() => {
    if (!enableLiveValidation) return;
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      const validationResult = validateChordProContent(value);
      setValidation(validationResult);
    }, effectiveConfig.debounceMs);
  }, [value, enableLiveValidation, effectiveConfig.debounceMs]);

  /**
   * Auto-detect completion context when value changes
   */
  useEffect(() => {
    if (isUndoRedoOperation.current) return;
    
    // Simple cursor position detection - in real usage this would come from the textarea
    const cursorPosition = value.length;
    const context = findAutoCompleteContext(value, cursorPosition);
    
    if (context && !autoCompleteContext) {
      setAutoCompleteContext(context);
    } else if (!context && autoCompleteContext) {
      setAutoCompleteContext(null);
    }
  }, [value, autoCompleteContext]);

  return {
    // State
    undoHistory,
    redoHistory,
    autoCompleteContext,
    metrics,
    validation,
    justCompletedDirective,
    
    // Actions
    performUndo,
    performRedo,
    showAutoComplete,
    hideAutoComplete,
    moveAutoComplete,
    selectAutoComplete,
    completeDirective,
    clearDirectiveCompletion,
    
    // Getters
    getSuggestions,
    canUndo,
    canRedo,
    isAutoCompleteVisible,
    
    // Config
    effectiveConfig
  };
}
