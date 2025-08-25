/**
 * @file useChordSheetJS.ts
 * @description Hook for using ChordSheetJS with lazy loading
 */

import { useState, useEffect } from 'react';
import {
  loadChordSheetJS,
  isChordSheetJSLoaded,
  type ChordSheetJSModule
} from '../utils/chordSheetLazyLoader';

/**
 * Hook for using ChordSheetJS with lazy loading
 * @returns Object with loading state and ChordSheetJS module
 */
export function useChordSheetJS() {
  const [state, setState] = useState<{
    isLoaded: boolean;
    isLoading: boolean;
    error: Error | null;
    module: ChordSheetJSModule | null;
  }>({
    isLoaded: isChordSheetJSLoaded(),
    isLoading: false,
    error: null,
    module: null
  });

  useEffect(() => {
    if (!state.isLoaded && !state.isLoading) {
      setState(prev => ({ ...prev, isLoading: true }));
      
      loadChordSheetJS()
        .then(module => {
          setState({
            isLoaded: true,
            isLoading: false,
            error: null,
            module
          });
        })
        .catch(error => {
          setState({
            isLoaded: false,
            isLoading: false,
            error,
            module: null
          });
        });
    }
  }, [state.isLoaded, state.isLoading]);

  return state;
}