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
   * Apply preference styles to rendered HTML
   */
  const applyPreferenceStyles = useCallback((html: string, options?: RenderOptions): string => {
    const fontSize = options?.fontSize || preferences.fontSize;
    const fontFamily = options?.fontFamily || preferences.fontFamily;
    
    // Create a wrapper div with inline styles
    const wrapperStyles = `
      font-size: ${fontSize}px;
      font-family: ${fontFamily};
      line-height: ${preferences.lineHeight};
      color: ${preferences.lyricColor};
    `.trim();

    // Inject chord color styles
    const chordStyles = `
      <style>
        .chord-sheet-rendered .chord {
          color: ${preferences.chordColor} !important;
          font-weight: 600;
        }
        .chord-sheet-rendered .chord-sheet .chord {
          color: ${preferences.chordColor} !important;
        }
        .chord-sheet-rendered .comment {
          font-style: italic;
          color: ${preferences.theme === 'dark' ? '#9ca3af' : '#6b7280'};
        }
        .chord-sheet-rendered .directive {
          font-weight: bold;
          color: ${preferences.theme === 'dark' ? '#a78bfa' : '#7c3aed'};
        }
      </style>
    `;

    return `
      ${chordStyles}
      <div class="chord-sheet-rendered" style="${wrapperStyles}">
        ${html}
      </div>
    `;
  }, [preferences]);

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