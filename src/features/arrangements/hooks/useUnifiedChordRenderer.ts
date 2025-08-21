/**
 * @file useUnifiedChordRenderer.ts
 * @description Optimized hook for rendering chord sheets using native ChordSheetJS formatting
 * Removes regex processing in favor of direct formatter output
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as ChordSheetJS from 'chordsheetjs';
const { Chord } = ChordSheetJS;
import { chordPreferencesService } from '../services/chordPreferencesService';
import { ChordSheetFormatterFactory } from '../formatters/ChordSheetFormatterFactory';
import { chordRenderCache } from '../services/ChordRenderCacheService';
import { PerformanceMonitor } from '../components/ChordProEditor/utils/performance';
import type { ChordDisplayPreferences, RenderOptions } from '../types/preferences.types';

export interface UseUnifiedChordRendererReturn {
  /** Render ChordPro content to HTML */
  renderChordSheet: (content: string, options?: RenderOptions) => string;
  /** Current preferences */
  preferences: ChordDisplayPreferences;
  /** Update preferences */
  updatePreferences: (updates: Partial<ChordDisplayPreferences>) => void;
  /** Reset to defaults */
  resetPreferences: () => void;
  /** Check if content is valid ChordPro */
  isValidChordPro: (content: string) => boolean;
  /** Get cache metrics */
  getCacheMetrics: () => ReturnType<typeof chordRenderCache.getMetrics>;
}

/**
 * Optimized hook for unified chord sheet rendering
 * Uses native ChordSheetJS formatting without regex processing
 */
export function useUnifiedChordRenderer(): UseUnifiedChordRendererReturn {
  const [preferences, setPreferences] = useState<ChordDisplayPreferences>(
    chordPreferencesService.getPreferences()
  );

  // Initialize performance monitor
  const performanceMonitor = useMemo(
    () => new PerformanceMonitor(process.env.NODE_ENV === 'development'),
    []
  );

  // Subscribe to preference changes
  useEffect(() => {
    const unsubscribe = chordPreferencesService.subscribe((newPreferences) => {
      setPreferences(newPreferences);
    });

    // Also listen for cross-tab changes
    const handlePreferenceChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.preferences) {
        setPreferences(customEvent.detail.preferences);
      }
    };

    window.addEventListener('chord-preferences-changed', handlePreferenceChange);

    return () => {
      unsubscribe();
      window.removeEventListener('chord-preferences-changed', handlePreferenceChange);
    };
  }, []);

  /**
   * Get theme colors based on current theme preference
   */
  const getThemeColors = useCallback(() => {
    switch (preferences.theme) {
      case 'dark':
        return {
          chord: '#60a5fa',
          lyric: '#f9fafb',
          comment: '#d1d5db',
          section: '#a78bfa',
          background: '#1f2937'
        };
      case 'stage':
        return {
          chord: '#fbbf24',
          lyric: '#ffffff',
          comment: '#d1d5db',
          section: '#f59e0b',
          background: '#000000'
        };
      default: // light
        return {
          chord: '#2563eb',
          lyric: '#111827',
          comment: '#6b7280',
          section: '#7c3aed',
          background: '#ffffff'
        };
    }
  }, [preferences.theme]);

  /**
   * Wrap HTML with theme styling
   * Now uses native ChordSheetJS classes without regex processing
   */
  const wrapWithTheme = useCallback((html: string, options?: RenderOptions): string => {
    const fontSize = options?.fontSize || preferences.fontSize;
    const fontFamily = options?.fontFamily || preferences.fontFamily;
    const colors = getThemeColors();

    // Native ChordSheetJS class styling (no regex processing needed)
    const themeCSS = `
      <style>
        /* Native ChordSheetJS classes */
        .chord-sheet-content .row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .chord-sheet-content .column {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .chord-sheet-content .chord {
          color: ${colors.chord};
          font-weight: 600;
          line-height: 1.2;
          margin-bottom: 0.125rem;
        }

        .chord-sheet-content .lyrics {
          color: ${colors.lyric};
          line-height: 1.4;
        }

        .chord-sheet-content .comment {
          color: ${colors.comment};
          font-style: italic;
          margin: 0.5rem 0;
        }

        .chord-sheet-content .verse-label,
        .chord-sheet-content .chorus-label,
        .chord-sheet-content .bridge-label {
          color: ${colors.section};
          font-weight: bold;
          margin-top: 1rem;
        }

        /* Sections */
        .chord-sheet-content .paragraph {
          margin-bottom: 1rem;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .chord-sheet-content .row {
            font-size: 1.1em;
          }
        }

        /* Print optimizations */
        @media print {
          .chord-sheet-content {
            font-size: 10pt !important;
            line-height: 1.2 !important;
          }
          
          .chord-sheet-content .row {
            page-break-inside: avoid;
          }
        }
      </style>
    `;

    return `${themeCSS}<div class="chord-sheet-rendered chord-sheet-content" data-theme="${preferences.theme}" style="font-size: ${fontSize}px; font-family: ${fontFamily}; line-height: ${preferences.lineHeight};">${html}</div>`;
  }, [preferences, getThemeColors]);

  /**
   * Optimized ChordPro rendering with multi-level caching
   */
  const renderChordSheet = useCallback((content: string, options?: RenderOptions): string => {
    if (!content || !content.trim()) {
      return '<div class="empty-state">No content to display</div>';
    }

    performanceMonitor.mark('render-start');

    try {
      // Generate cache key for styled output
      const cacheKey = chordRenderCache.generateKey(content, options);
      
      // Check Level 3 cache (styled HTML)
      let styledHtml = chordRenderCache.getStyledHtml(cacheKey);
      if (styledHtml) {
        performanceMonitor.mark('render-end');
        performanceMonitor.measure('render-cached', 'render-start', 'render-end');
        return styledHtml;
      }

      // Check Level 2 cache (formatted HTML)
      let html = chordRenderCache.getFormattedHtml(cacheKey);
      
      if (!html) {
        // Get or parse song (Level 1 cache)
        let song = chordRenderCache.getParsedSong(content);
        
        if (!song) {
          // Parse and cache
          const parser = new ChordSheetJS.ChordProParser();
          song = parser.parse(content);
          chordRenderCache.setParsedSong(content, song);
        }

        // Apply transposition if specified
        if (options?.transpose !== undefined && options.transpose !== 0) {
          // Clone song to avoid mutating cached version
          const songClone = JSON.parse(JSON.stringify(song));
          
          // Manually transpose all chords (workaround for ChordSheetJS v12.3.1 bug)
          songClone.lines.forEach((line: ChordSheetJS.Line) => {
            if (line.items) {
              line.items.forEach((item) => {
                if ('chords' in item && item.chords && typeof item.chords === 'string') {
                  // Skip section markers
                  const sectionMarkers = ['Verse', 'Chorus', 'Bridge', 'Intro', 'Outro', 'Pre-Chorus', 'Tag', 'Coda'];
                  if (!sectionMarkers.includes(item.chords)) {
                    try {
                      const chord = Chord.parse(item.chords);
                      if (chord) {
                        const transposedChord = chord.transpose(options.transpose!);
                        (item as ChordSheetJS.ChordLyricsPair).chords = transposedChord.toString();
                      }
                    } catch (_e) {
                      // Silently skip unparseable chords
                    }
                  }
                }
              });
            }
          });
          
          song = songClone;
        }

        // Get appropriate formatter from factory
        const context = options?.showDiagrams ? 'viewer' : 'preview';
        const formatter = ChordSheetFormatterFactory.getFormatterForContext(context);
        
        // Format to HTML (formatter returns an object with toString method)
        const formatted = (formatter as unknown as { format: (song: ChordSheetJS.Song) => unknown }).format(song!);
        html = typeof formatted === 'object' && formatted && 'toString' in formatted 
          ? (formatted as { toString(): string }).toString() 
          : String(formatted);
        
        // Cache formatted HTML
        chordRenderCache.setFormattedHtml(cacheKey, html!);
      }

      // Apply theme styling (no regex processing)
      styledHtml = wrapWithTheme(html!, options);
      
      // Cache styled output
      chordRenderCache.setStyledHtml(cacheKey, styledHtml!);

      performanceMonitor.mark('render-end');
      performanceMonitor.measure('render-complete', 'render-start', 'render-end');

      return styledHtml;
    } catch (error) {
      performanceMonitor.mark('render-error');
      
      // Only log non-parsing errors to reduce console noise
      if (error instanceof Error && !error.message.includes('Expected')) {
        console.error('Error rendering chord sheet:', error);
      }
      
      return `
        <div class="error-state">
          <h3>Error rendering chord sheet</h3>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    }
  }, [wrapWithTheme, performanceMonitor]);

  /**
   * Check if content is valid ChordPro
   */
  const isValidChordPro = useCallback((content: string): boolean => {
    if (!content || !content.trim()) return false;

    try {
      const parser = new ChordSheetJS.ChordProParser();
      parser.parse(content);
      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Update preferences
   */
  const updatePreferences = useCallback((updates: Partial<ChordDisplayPreferences>) => {
    chordPreferencesService.updatePreferences(updates);
  }, []);

  /**
   * Reset preferences to defaults
   */
  const resetPreferences = useCallback(() => {
    chordPreferencesService.resetPreferences();
    // Clear cache when preferences reset
    chordRenderCache.clearLevel('styled');
  }, []);

  /**
   * Get cache metrics for monitoring
   */
  const getCacheMetrics = useCallback(() => {
    return chordRenderCache.getMetrics();
  }, []);

  // Clear styled cache when preferences change
  useEffect(() => {
    chordRenderCache.clearLevel('styled');
  }, [preferences]);

  return {
    renderChordSheet,
    preferences,
    updatePreferences,
    resetPreferences,
    isValidChordPro,
    getCacheMetrics
  };
}

/**
 * Hook for getting just the preferences without rendering functionality
 */
export function useChordPreferences() {
  const [preferences, setPreferences] = useState<ChordDisplayPreferences>(
    chordPreferencesService.getPreferences()
  );

  useEffect(() => {
    const unsubscribe = chordPreferencesService.subscribe((newPreferences) => {
      setPreferences(newPreferences);
    });

    return unsubscribe;
  }, []);

  return preferences;
}
