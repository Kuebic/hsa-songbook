/**
 * @file useAutoComplete.ts
 * @description Hook for managing auto-completion state and suggestions
 */

import { useState, useCallback, useMemo } from 'react';
import type { AutoCompleteItem, AutoCompleteState } from '../types';

interface UseAutoCompleteProps {
  recentChords?: string[];
  enableChordCompletion?: boolean;
}

export const useAutoComplete = ({ recentChords = [], enableChordCompletion = false }: UseAutoCompleteProps = {}) => {
  const [state, setState] = useState<AutoCompleteState>({
    isVisible: false,
    items: [],
    selectedIndex: 0,
    triggerChar: null,
    triggerPosition: 0
  });

  // Common ChordPro directives
  const commonDirectives: AutoCompleteItem[] = useMemo(() => [
    { value: 'title:', description: 'Song title', insertText: 'title: ' },
    { value: 'subtitle:', description: 'Song subtitle', insertText: 'subtitle: ' },
    { value: 'artist:', description: 'Song artist', insertText: 'artist: ' },
    { value: 'key:', description: 'Song key', insertText: 'key: ' },
    { value: 'tempo:', description: 'Song tempo (BPM)', insertText: 'tempo: ' },
    { value: 'capo:', description: 'Capo position', insertText: 'capo: ' },
    { value: 'time:', description: 'Time signature', insertText: 'time: ' },
    { value: 'comment:', description: 'Comment text', insertText: 'comment: ' },
    { value: 'c:', description: 'Comment (short)', insertText: 'c: ' },
    { value: 'start_of_chorus', description: 'Begin chorus section', insertText: 'start_of_chorus}' },
    { value: 'soc', description: 'Begin chorus (short)', insertText: 'soc}' },
    { value: 'end_of_chorus', description: 'End chorus section', insertText: 'end_of_chorus}' },
    { value: 'eoc', description: 'End chorus (short)', insertText: 'eoc}' },
    { value: 'start_of_verse', description: 'Begin verse section', insertText: 'start_of_verse}' },
    { value: 'sov', description: 'Begin verse (short)', insertText: 'sov}' },
    { value: 'end_of_verse', description: 'End verse section', insertText: 'end_of_verse}' },
    { value: 'eov', description: 'End verse (short)', insertText: 'eov}' },
    { value: 'start_of_bridge', description: 'Begin bridge section', insertText: 'start_of_bridge}' },
    { value: 'sob', description: 'Begin bridge (short)', insertText: 'sob}' },
    { value: 'end_of_bridge', description: 'End bridge section', insertText: 'end_of_bridge}' },
    { value: 'eob', description: 'End bridge (short)', insertText: 'eob}' },
    { value: 'start_of_tab', description: 'Begin tablature section', insertText: 'start_of_tab}' },
    { value: 'sot', description: 'Begin tab (short)', insertText: 'sot}' },
    { value: 'end_of_tab', description: 'End tablature section', insertText: 'end_of_tab}' },
    { value: 'eot', description: 'End tab (short)', insertText: 'eot}' },
    { value: 'chorus', description: 'Reference to chorus', insertText: 'chorus}' },
    { value: 'verse', description: 'Reference to verse', insertText: 'verse}' },
    { value: 'bridge', description: 'Reference to bridge', insertText: 'bridge}' }
  ], []);

  // Common chords with recent chords prioritized
  const chordSuggestions: AutoCompleteItem[] = useMemo(() => {
    const commonChords = [
      'C', 'D', 'E', 'F', 'G', 'A', 'B',
      'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm',
      'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
      'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7',
      'C/E', 'D/F#', 'G/B', 'F/A', 'Am/G', 'Em/B'
    ];

    // Combine recent chords with common chords, prioritizing recent
    const allChords = [...new Set([...recentChords, ...commonChords])];
    
    return allChords.map(chord => ({
      value: chord,
      description: recentChords.includes(chord) ? 'Recently used' : 'Common chord',
      insertText: `${chord}]`
    }));
  }, [recentChords]);

  /**
   * Show auto-completion for a specific trigger
   */
  const showAutoComplete = useCallback((triggerChar: '{' | '[', position: number, filterText: string = '') => {
    // Don't show chord completion if disabled
    if (triggerChar === '[' && !enableChordCompletion) {
      return;
    }
    
    const items = triggerChar === '{' ? commonDirectives : chordSuggestions;
    
    // Filter items based on current input
    const filteredItems = filterText 
      ? items.filter(item => 
          item.value.toLowerCase().startsWith(filterText.toLowerCase())
        )
      : items;

    setState({
      isVisible: filteredItems.length > 0,
      items: filteredItems,
      selectedIndex: 0,
      triggerChar,
      triggerPosition: position
    });
  }, [commonDirectives, chordSuggestions, enableChordCompletion]);

  /**
   * Hide auto-completion
   */
  const hideAutoComplete = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false }));
  }, []);

  /**
   * Move selection up/down
   */
  const moveSelection = useCallback((direction: 'up' | 'down') => {
    setState(prev => {
      if (!prev.isVisible || prev.items.length === 0) return prev;
      
      let newIndex;
      if (direction === 'up') {
        newIndex = prev.selectedIndex > 0 ? prev.selectedIndex - 1 : prev.items.length - 1;
      } else {
        newIndex = prev.selectedIndex < prev.items.length - 1 ? prev.selectedIndex + 1 : 0;
      }
      
      return { ...prev, selectedIndex: newIndex };
    });
  }, []);

  /**
   * Get currently selected item
   */
  const getSelectedItem = useCallback(() => {
    if (!state.isVisible || state.items.length === 0) return null;
    return state.items[state.selectedIndex] || null;
  }, [state]);

  /**
   * Filter current items based on input
   */
  const filterItems = useCallback((filterText: string) => {
    if (!state.triggerChar) return;
    
    // Don't filter chord items if chord completion is disabled
    if (state.triggerChar === '[' && !enableChordCompletion) {
      return;
    }
    
    const items = state.triggerChar === '{' ? commonDirectives : chordSuggestions;
    const filteredItems = filterText 
      ? items.filter(item => 
          item.value.toLowerCase().startsWith(filterText.toLowerCase())
        )
      : items;

    setState(prev => ({
      ...prev,
      items: filteredItems,
      selectedIndex: Math.min(prev.selectedIndex, filteredItems.length - 1),
      isVisible: filteredItems.length > 0
    }));
  }, [state.triggerChar, commonDirectives, chordSuggestions, enableChordCompletion]);

  return {
    state,
    showAutoComplete,
    hideAutoComplete,
    moveSelection,
    getSelectedItem,
    filterItems
  };
};