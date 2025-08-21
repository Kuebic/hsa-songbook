/**
 * @file chordSheetLazyLoader.ts
 * @description Lazy loading utilities for ChordSheetJS to optimize bundle size
 * Implements code splitting and async loading for better performance
 */

import React, { lazy } from 'react';
import type * as ChordSheetJS from 'chordsheetjs';

// Types for ChordSheetJS (to avoid importing the whole library)
export interface ChordSheetJSModule {
  ChordProParser: new () => {
    parse: (content: string) => ChordSheetJS.Song;
  };
  ChordsOverWordsParser: new () => {
    parse: (content: string) => ChordSheetJS.Song;
  };
  UltimateGuitarParser: new () => {
    parse: (content: string) => ChordSheetJS.Song;
  };
  HtmlDivFormatter: new (config?: unknown) => {
    format: (song: ChordSheetJS.Song) => string;
  };
  HtmlTableFormatter: new (config?: unknown) => {
    format: (song: ChordSheetJS.Song) => string;
  };
  TextFormatter: new (config?: unknown) => {
    format: (song: ChordSheetJS.Song) => string;
  };
  ChordProFormatter: new (config?: unknown) => {
    format: (song: ChordSheetJS.Song) => string;
  };
  Chord: {
    parse: (chord: string) => ChordSheetJS.Chord;
  };
  Song: ChordSheetJS.Song;
}

// Cache for loaded modules
let chordSheetJSModule: ChordSheetJSModule | null = null;
let loadingPromise: Promise<ChordSheetJSModule> | null = null;

/**
 * Load ChordSheetJS module asynchronously
 * Uses dynamic import for code splitting
 */
export async function loadChordSheetJS(): Promise<ChordSheetJSModule> {
  // Return cached module if already loaded
  if (chordSheetJSModule) {
    return chordSheetJSModule;
  }

  // Return existing loading promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = import('chordsheetjs').then(module => {
    chordSheetJSModule = module as unknown as ChordSheetJSModule;
    loadingPromise = null;
    return chordSheetJSModule;
  });

  return loadingPromise;
}

/**
 * Parse ChordPro content asynchronously
 * @param content - ChordPro formatted text
 * @returns Promise resolving to parsed Song object
 */
export async function parseChordProAsync(content: string): Promise<ChordSheetJS.Song> {
  const ChordSheetJS = await loadChordSheetJS();
  const parser = new ChordSheetJS.ChordProParser();
  return parser.parse(content);
}

/**
 * Parse Chords Over Words format asynchronously
 * @param content - Chords over words formatted text
 * @returns Promise resolving to parsed Song object
 */
export async function parseChordsOverWordsAsync(content: string): Promise<ChordSheetJS.Song> {
  const ChordSheetJS = await loadChordSheetJS();
  const parser = new ChordSheetJS.ChordsOverWordsParser();
  return parser.parse(content);
}

/**
 * Parse Ultimate Guitar format asynchronously
 * @param content - Ultimate Guitar formatted text
 * @returns Promise resolving to parsed Song object
 */
export async function parseUltimateGuitarAsync(content: string): Promise<ChordSheetJS.Song> {
  const ChordSheetJS = await loadChordSheetJS();
  const parser = new ChordSheetJS.UltimateGuitarParser();
  return parser.parse(content);
}

/**
 * Format song to HTML using HtmlDivFormatter asynchronously
 * @param song - Parsed song object
 * @param config - Formatter configuration
 * @returns Promise resolving to HTML string
 */
export async function formatToHtmlDivAsync(
  song: ChordSheetJS.Song,
  config?: unknown
): Promise<string> {
  const ChordSheetJS = await loadChordSheetJS();
  const formatter = new ChordSheetJS.HtmlDivFormatter(config);
  return formatter.format(song);
}

/**
 * Format song to HTML using HtmlTableFormatter asynchronously
 * @param song - Parsed song object
 * @param config - Formatter configuration
 * @returns Promise resolving to HTML string
 */
export async function formatToHtmlTableAsync(
  song: ChordSheetJS.Song,
  config?: unknown
): Promise<string> {
  const ChordSheetJS = await loadChordSheetJS();
  const formatter = new ChordSheetJS.HtmlTableFormatter(config);
  return formatter.format(song);
}

/**
 * Format song to plain text asynchronously
 * @param song - Parsed song object
 * @param config - Formatter configuration
 * @returns Promise resolving to text string
 */
export async function formatToTextAsync(
  song: ChordSheetJS.Song,
  config?: unknown
): Promise<string> {
  const ChordSheetJS = await loadChordSheetJS();
  const formatter = new ChordSheetJS.TextFormatter(config);
  return formatter.format(song);
}

/**
 * Format song back to ChordPro format asynchronously
 * @param song - Parsed song object
 * @param config - Formatter configuration
 * @returns Promise resolving to ChordPro string
 */
export async function formatToChordProAsync(
  song: ChordSheetJS.Song,
  config?: unknown
): Promise<string> {
  const ChordSheetJS = await loadChordSheetJS();
  const formatter = new ChordSheetJS.ChordProFormatter(config);
  return formatter.format(song);
}

/**
 * Parse a chord asynchronously
 * @param chord - Chord string
 * @returns Promise resolving to parsed Chord object
 */
export async function parseChordAsync(chord: string): Promise<ChordSheetJS.Chord> {
  const ChordSheetJS = await loadChordSheetJS();
  return ChordSheetJS.Chord.parse(chord);
}

/**
 * Complete ChordPro to HTML pipeline asynchronously
 * @param content - ChordPro content
 * @param format - Output format type
 * @param config - Formatter configuration
 * @returns Promise resolving to formatted string
 */
export async function renderChordProAsync(
  content: string,
  format: 'html-div' | 'html-table' | 'text' | 'chordpro' = 'html-div',
  config?: unknown
): Promise<string> {
  const song = await parseChordProAsync(content);
  
  switch (format) {
    case 'html-div':
      return formatToHtmlDivAsync(song, config);
    case 'html-table':
      return formatToHtmlTableAsync(song, config);
    case 'text':
      return formatToTextAsync(song, config);
    case 'chordpro':
      return formatToChordProAsync(song, config);
    default:
      return formatToHtmlDivAsync(song, config);
  }
}

/**
 * Preload ChordSheetJS module
 * Call this early in the application lifecycle to reduce latency
 */
export function preloadChordSheetJS(): void {
  loadChordSheetJS().catch(error => {
    console.error('Failed to preload ChordSheetJS:', error);
  });
}

/**
 * Check if ChordSheetJS is already loaded
 * @returns Boolean indicating if module is loaded
 */
export function isChordSheetJSLoaded(): boolean {
  return chordSheetJSModule !== null;
}

/**
 * Get loading state of ChordSheetJS
 * @returns Object with loading state information
 */
export function getChordSheetJSLoadingState(): {
  isLoaded: boolean;
  isLoading: boolean;
} {
  return {
    isLoaded: chordSheetJSModule !== null,
    isLoading: loadingPromise !== null
  };
}

/**
 * React component for lazy loading ChordSheetJS features
 * Wraps children and only renders when ChordSheetJS is loaded
 */
export const LazyChordSheetProvider: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = <div>Loading chord sheet...</div> }) => {
  const [isLoaded, setIsLoaded] = React.useState(isChordSheetJSLoaded());

  React.useEffect(() => {
    if (!isLoaded) {
      loadChordSheetJS().then(() => {
        setIsLoaded(true);
      });
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook for using ChordSheetJS with lazy loading
 * @returns Object with loading state and ChordSheetJS module
 */
export function useChordSheetJS() {
  const [state, setState] = React.useState<{
    isLoaded: boolean;
    isLoading: boolean;
    error: Error | null;
    module: ChordSheetJSModule | null;
  }>({
    isLoaded: isChordSheetJSLoaded(),
    isLoading: false,
    error: null,
    module: chordSheetJSModule
  });

  React.useEffect(() => {
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

/**
 * Lazy load specific ChordSheetJS components
 * Use these for code splitting at the component level
 */
export const LazyChordProEditor = lazy(() => 
  import('../components/ChordProEditor').then(module => ({
    default: module.ChordProEditor
  }))
);

export const LazyChordSheetViewer = lazy(() => 
  import('../components/ChordSheetViewer').then(module => ({
    default: module.ChordSheetViewer
  }))
);

export const LazyResponsiveChordSheet = lazy(() => 
  import('../components/ResponsiveChordSheet').then(module => ({
    default: module.ResponsiveChordSheet
  }))
);

export const LazyVirtualChordScroller = lazy(() => 
  import('../components/VirtualChordScroller').then(module => ({
    default: module.VirtualChordScroller
  }))
);

/**
 * Webpack magic comments for prefetching
 * These hints tell webpack to prefetch modules during idle time
 */
export const prefetchChordSheetComponents = () => {
  // Prefetch ChordSheetJS module
  import(/* webpackPrefetch: true */ 'chordsheetjs');
  
  // Prefetch components
  import(/* webpackPrefetch: true */ '../components/ChordProEditor');
  import(/* webpackPrefetch: true */ '../components/ChordSheetViewer');
  import(/* webpackPrefetch: true */ '../components/ResponsiveChordSheet');
  import(/* webpackPrefetch: true */ '../components/VirtualChordScroller');
};