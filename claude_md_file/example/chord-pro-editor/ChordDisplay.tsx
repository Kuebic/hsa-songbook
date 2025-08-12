/**
 * @file ChordDisplay.tsx
 * @description React component for rendering ChordPro formatted songs with transposition support
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import ChordSheetJS from 'chordsheetjs';
import { cn } from '../../../shared/utils/cn';
import { errorReporting } from '../../../shared/services/errorReporting';
import type { ChordDisplayProps } from '../types/chord.types';
import { 
  THEME_STYLES, 
  FONT_SIZE_LIMITS, 
  TRANSPOSE_LIMITS 
} from '../types/chord.types';
import { isValidChordProContent, isValidTransposeLevel } from '../utils/chordHelpers';

/**
 * ChordDisplay Component
 * 
 * Renders ChordPro formatted songs with transposition support, theming, and responsive design.
 * Optimized for performance with memoization and efficient DOM updates.
 * 
 * @example
 * ```tsx
 * <ChordDisplay
 *   content={chordProString}
 *   transpose={2}
 *   theme="stage"
 *   fontSize={20}
 *   showChords={true}
 *   onTransposeChange={(level) => console.log('Transposed to:', level)}
 * />
 * ```
 */
export const ChordDisplay = React.memo<ChordDisplayProps>(({
  content,
  transpose = TRANSPOSE_LIMITS.DEFAULT,
  fontSize = FONT_SIZE_LIMITS.DEFAULT,
  theme = 'light',
  showChords = true,
  className,
  onTransposeChange
}) => {
  // Validate and clamp props
  const validatedTranspose = useMemo(() => {
    if (!isValidTransposeLevel(transpose)) {
      console.warn(`Invalid transpose level ${transpose}, using 0`);
      return TRANSPOSE_LIMITS.DEFAULT;
    }
    return transpose;
  }, [transpose]);

  const validatedFontSize = useMemo(() => {
    const size = Math.max(FONT_SIZE_LIMITS.MIN, Math.min(FONT_SIZE_LIMITS.MAX, fontSize));
    if (size !== fontSize) {
      console.warn(`Font size ${fontSize} clamped to ${size}`);
    }
    return size;
  }, [fontSize]);

  // Notify parent of transpose changes
  useEffect(() => {
    if (onTransposeChange && validatedTranspose !== transpose) {
      onTransposeChange(validatedTranspose);
    }
  }, [validatedTranspose, transpose, onTransposeChange]);

  // Parse and transpose song content
  const { song, formattedHtml, error } = useMemo(() => {
    try {
      // Handle empty content separately from invalid content
      if (!content || content.trim().length === 0) {
        return {
          song: null,
          formattedHtml: '',
          error: null
        };
      }

      if (!isValidChordProContent(content)) {
        return {
          song: null,
          formattedHtml: '',
          error: 'Invalid ChordPro content'
        };
      }

      const parser = new ChordSheetJS.ChordProParser();
      const parsedSong = parser.parse(content);
      
      // Transpose if necessary
      const transposedSong = validatedTranspose !== 0 
        ? parsedSong.transpose(validatedTranspose)
        : parsedSong;

      // Format to HTML
      const formatter = new ChordSheetJS.HtmlDivFormatter();
      const html = formatter.format(transposedSong);

      return {
        song: transposedSong,
        formattedHtml: html,
        error: null
      };
    } catch (err) {
      // Use centralized error reporting instead of console.error
      errorReporting.reportComponentError(
        'Error processing ChordPro content',
        err instanceof Error ? err : new Error(String(err)),
        {
          component: 'ChordDisplay',
          operation: 'parse_chordpro',
          content: content?.substring(0, 100) + '...', // Log first 100 chars for context
          transpose: validatedTranspose,
        }
      );
      return {
        song: null,
        formattedHtml: '',
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }, [content, validatedTranspose]);

  // Get theme styles
  const themeStyles = THEME_STYLES[theme];

  // Process HTML to add custom styling and improve chord positioning
  const processedHtml = useMemo(() => {
    if (!formattedHtml) return '';

    let processed = formattedHtml;

    // Remove duplicate title and subtitle elements from ChordSheetJS output
    processed = processed.replace(/<h1 class="title">[^<]*<\/h1>/g, '');
    processed = processed.replace(/<h2 class="subtitle">[^<]*<\/h2>/g, '');

    // Add chord styling classes with improved positioning
    if (showChords) {
      processed = processed.replace(
        /<div class="chord">([^<]+)<\/div>/g,
        `<div class="chord ${themeStyles.chord}">$1</div>`
      );
      // Handle empty chord slots (for proper alignment)
      processed = processed.replace(
        /<div class="chord"><\/div>/g,
        `<div class="chord chord-empty"></div>`
      );
    } else {
      // Hide chords by removing chord divs but preserve layout
      processed = processed.replace(
        /<div class="chord">([^<]*)<\/div>/g,
        `<div class="chord chord-hidden"></div>`
      );
    }

    // Add enhanced row styling with flexbox layout for proper alignment
    processed = processed.replace(
      /<div class="row">([^<]*(?:<[^>]*>[^<]*)*?)<\/div>/g,
      `<div class="row chord-row ${themeStyles.line}">$1</div>`
    );

    // Add column styling for precise chord-lyrics alignment
    processed = processed.replace(
      /<div class="column">([^<]*(?:<[^>]*>[^<]*)*?)<\/div>/g,
      `<div class="column chord-column">$1</div>`
    );

    // Add lyrics styling
    processed = processed.replace(
      /<div class="lyrics">([^<]*)<\/div>/g,
      `<div class="lyrics chord-lyrics">$1</div>`
    );

    // Add section styling based on ChordSheetJS structure
    processed = processed.replace(
      /<div class="paragraph verse">([^]*?)<\/div>/g,
      `<div class="paragraph verse ${themeStyles.verse}">$1</div>`
    );

    processed = processed.replace(
      /<div class="paragraph chorus">([^]*?)<\/div>/g,
      `<div class="paragraph chorus ${themeStyles.chorus}">$1</div>`
    );

    processed = processed.replace(
      /<div class="paragraph bridge">([^]*?)<\/div>/g,
      `<div class="paragraph bridge ${themeStyles.bridge}">$1</div>`
    );

    return processed;
  }, [formattedHtml, showChords, themeStyles]);

  // Handle chord click for accessibility
  const handleChordClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('chord')) {
      // Could implement chord detail popup, audio playback, etc.
      console.log('Chord clicked:', target.textContent);
    }
  }, []);

  // Render error state
  if (error) {
    return (
      <div 
        className={cn(
          'p-4 border border-red-300 bg-red-50 text-red-800 rounded-lg',
          className
        )}
        role="alert"
        aria-label="ChordPro parsing error"
      >
        <h3 className="font-semibold mb-2">Unable to display chord chart</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Render empty state
  if (!content.trim()) {
    return (
      <div 
        className={cn(
          themeStyles.container,
          'p-6 rounded-lg text-center',
          className
        )}
        role="status"
        aria-label="No chord chart content"
      >
        <p className="text-gray-500">No chord chart to display</p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        themeStyles.container,
        'p-6 rounded-lg font-mono leading-relaxed',
        className
      )}
      style={{ fontSize: `${validatedFontSize}px` }}
      onClick={handleChordClick}
      role="document"
      aria-label={`Chord chart${song?.title ? ` for ${song.title}` : ''}`}
    >
      {/* Song metadata */}
      {song?.title && (
        <h1 className={themeStyles.title}>
          {song.title}
        </h1>
      )}
      
      {song?.subtitle && (
        <h2 className={themeStyles.subtitle}>
          {song.subtitle}
        </h2>
      )}

      {/* Key and tempo info */}
      {(song?.key || song?.tempo || song?.time) && (
        <div className="mb-4 text-sm opacity-75 flex gap-4">
          {song.key && <span>Key: {song.key}</span>}
          {song.tempo && <span>Tempo: {song.tempo}</span>}
          {song.time && <span>Time: {song.time}</span>}
          {song.capo && <span>Capo: {song.capo}</span>}
        </div>
      )}

      {/* CSS for chord positioning */}
      <style>{`
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
        }
        
        .chord-sheet-content .chord-empty {
          visibility: hidden;
        }
        
        .chord-sheet-content .chord-hidden {
          display: none;
        }
        
        .chord-sheet-content .chord-lyrics {
          line-height: 1.4;
          white-space: pre;
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
      `}</style>

      {/* Song content */}
      <div 
        className={cn(themeStyles.lyrics, 'chord-sheet-content')}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        aria-live="polite"
        aria-atomic="false"
      />

      {/* Transpose indicator */}
      {validatedTranspose !== 0 && (
        <div className="mt-4 text-xs opacity-60 text-right">
          Transposed {validatedTranspose > 0 ? '+' : ''}{validatedTranspose} semitones
        </div>
      )}
    </div>
  );
});

ChordDisplay.displayName = 'ChordDisplay';