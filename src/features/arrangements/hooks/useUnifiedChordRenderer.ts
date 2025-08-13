/**
 * @file useUnifiedChordRenderer.ts
 * @description Unified hook for rendering chord sheets consistently across preview and viewer
 */

import { useState, useEffect, useCallback } from 'react';
import * as ChordSheetJS from 'chordsheetjs';
import { chordPreferencesService } from '../services/chordPreferencesService';
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
}

/**
 * Hook for unified chord sheet rendering with preferences
 */
export function useUnifiedChordRenderer(): UseUnifiedChordRendererReturn {
  const [preferences, setPreferences] = useState<ChordDisplayPreferences>(
    chordPreferencesService.getPreferences()
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
   * Process ChordSheetJS HTML output to add proper styling and structure
   */
  const processChordSheetHTML = useCallback((html: string): string => {
    let processed = html;

    // Remove duplicate title and subtitle elements from ChordSheetJS output
    processed = processed.replace(/<h1 class="title">[^<]*<\/h1>/g, '');
    processed = processed.replace(/<h2 class="subtitle">[^<]*<\/h2>/g, '');

    // Add enhanced row styling with flexbox layout for proper alignment
    processed = processed.replace(
      /<div class="row">([^<]*(?:<[^>]*>[^<]*)*?)<\/div>/g,
      '<div class="row chord-row">$1</div>'
    );

    // Add column styling for precise chord-lyrics alignment
    processed = processed.replace(
      /<div class="column">([^<]*(?:<[^>]*>[^<]*)*?)<\/div>/g,
      '<div class="column chord-column">$1</div>'
    );

    // Process chord elements with theme awareness
    processed = processed.replace(
      /<div class="chord">([^<]+)<\/div>/g,
      '<div class="chord chord-element">$1</div>'
    );

    // Handle empty chord slots (for proper alignment)
    processed = processed.replace(
      /<div class="chord"><\/div>/g,
      '<div class="chord chord-empty"></div>'
    );

    // Add lyrics styling
    processed = processed.replace(
      /<div class="lyrics">([^<]*)<\/div>/g,
      '<div class="lyrics chord-lyrics">$1</div>'
    );

    // Add section styling based on ChordSheetJS structure
    processed = processed.replace(
      /<div class="paragraph verse">([^]*?)<\/div>/g,
      '<div class="paragraph verse chord-verse">$1</div>'
    );

    processed = processed.replace(
      /<div class="paragraph chorus">([^]*?)<\/div>/g,
      '<div class="paragraph chorus chord-chorus">$1</div>'
    );

    processed = processed.replace(
      /<div class="paragraph bridge">([^]*?)<\/div>/g,
      '<div class="paragraph bridge chord-bridge">$1</div>'
    );

    return processed;
  }, []);

  /**
   * Apply preference styles with inline CSS injection
   */
  const applyPreferenceStyles = useCallback((html: string, options?: RenderOptions): string => {
    const fontSize = options?.fontSize || preferences.fontSize;
    const fontFamily = options?.fontFamily || preferences.fontFamily;
    
    // Get theme colors
    const getThemeColors = () => {
      switch (preferences.theme) {
        case 'dark':
          return {
            chord: '#60a5fa',
            lyric: '#f3f4f6',
            comment: '#9ca3af',
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
    };

    const colors = getThemeColors();
    const processedHtml = processChordSheetHTML(html);

    // Inline CSS for precise positioning (matches reference implementation)
    const inlineCSS = `
      <style>
        .chord-sheet-content .chord-row {
          display: flex;
          align-items: flex-end;
          min-height: 2.5em;
          margin-bottom: 0.25rem;
        }
        
        .chord-sheet-content .chord-column {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-right: 0.125rem;
          position: relative;
        }
        
        .chord-sheet-content .chord {
          line-height: 1;
          margin-bottom: 0.125rem;
          white-space: nowrap;
          min-height: 1.2em;
          color: ${colors.chord};
          font-weight: 600;
        }
        
        .chord-sheet-content .chord-empty {
          visibility: hidden;
        }
        
        .chord-sheet-content .chord-lyrics {
          line-height: 1.4;
          white-space: pre;
          color: ${colors.lyric};
        }
        
        /* Ensure proper spacing and alignment */
        .chord-sheet-content .chord-column:last-child {
          margin-right: 0;
        }
        
        /* Handle empty lyrics (for chords at word end) */
        .chord-sheet-content .chord-lyrics:empty::after {
          content: ' ';
          white-space: pre;
        }

        /* Section styling */
        .chord-sheet-content .chord-verse,
        .chord-sheet-content .chord-chorus,
        .chord-sheet-content .chord-bridge {
          margin-bottom: 1.5em;
        }

        /* Comment and directive styling */
        .chord-sheet-content .comment {
          color: ${colors.comment};
          font-style: italic;
        }

        .chord-sheet-content .directive {
          color: ${colors.section};
          font-weight: bold;
        }
      </style>
    `;

    return `
      ${inlineCSS}
      <div class="chord-sheet-rendered chord-sheet-content" data-theme="${preferences.theme}" style="font-size: ${fontSize}px; font-family: ${fontFamily}; line-height: ${preferences.lineHeight};">
        ${processedHtml}
      </div>
    `;
  }, [preferences, processChordSheetHTML]);

  /**
   * Render ChordPro content to HTML
   */
  const renderChordSheet = useCallback((content: string, options?: RenderOptions): string => {
    if (!content || !content.trim()) {
      return '<div class="empty-state">No content to display</div>';
    }

    try {
      // Parse the ChordPro content
      const parser = new ChordSheetJS.ChordProParser();
      const song = parser.parse(content);

      // Apply transposition if specified
      if (options?.transpose !== undefined && options.transpose !== 0) {
        song.transpose(options.transpose);
      }

      // Use HtmlDivFormatter for responsive layout (works better for both preview and viewer)
      const formatter = new ChordSheetJS.HtmlDivFormatter();
      let html = formatter.format(song);

      // Apply preference styles
      html = applyPreferenceStyles(html, options);

      return html;
    } catch (error) {
      console.error('Error rendering chord sheet:', error);
      return `
        <div class="error-state">
          <h3>Error rendering chord sheet</h3>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    }
  }, [applyPreferenceStyles]);

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
  }, []);

  return {
    renderChordSheet,
    preferences,
    updatePreferences,
    resetPreferences,
    isValidChordPro
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