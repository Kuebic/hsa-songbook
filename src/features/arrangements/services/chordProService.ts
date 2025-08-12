/**
 * @file chordProService.ts
 * @description Service for ChordPro parsing, validation, and transformation
 */

import {
  ChordSheetParser,
  ChordProFormatter,
  TextFormatter,
  HtmlDivFormatter,
  HtmlTableFormatter,
  Song,
} from 'chordsheetjs';
import type {
  ChordProMetadata,
  ValidationError,
  ValidationWarning,
} from '../types/editor.types';

/**
 * Supported export formats
 */
export type ExportFormat = 'chordpro' | 'text' | 'html' | 'html-table' | 'json';

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  transposeBy?: number;
  fontSize?: number;
  theme?: 'light' | 'dark' | 'stage';
}

/**
 * Parse result
 */
export interface ParseResult {
  song: Song;
  metadata: ChordProMetadata;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * ChordPro service class
 */
export class ChordProService {
  private parser: ChordSheetParser;

  constructor() {
    this.parser = new ChordSheetParser();
  }

  /**
   * Parse ChordPro content
   */
  parse(content: string): ParseResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let song: Song | null = null;
    let metadata: ChordProMetadata = {};

    try {
      // Parse the content
      song = this.parser.parse(content);
      
      // Extract metadata
      metadata = this.extractMetadata(song);
      
      // Validate and collect warnings
      const validationWarnings = this.validateContent(content, song);
      warnings.push(...validationWarnings);
    } catch (error) {
      // Handle parse errors
      const parseErrors = this.handleParseError(error, content);
      errors.push(...parseErrors);
    }

    return {
      song: song || new Song(),
      metadata,
      errors,
      warnings,
    };
  }

  /**
   * Export song to various formats
   */
  export(content: string, options: ExportOptions): string {
    const { song } = this.parse(content);
    
    // Apply transposition if requested
    if (options.transposeBy && options.transposeBy !== 0) {
      song.transpose(options.transposeBy);
    }

    // Format based on requested format
    switch (options.format) {
      case 'chordpro': {
        const formatter = new ChordProFormatter();
        return formatter.format(song);
      }
      
      case 'text': {
        const formatter = new TextFormatter();
        return formatter.format(song);
      }
      
      case 'html': {
        const formatter = new HtmlDivFormatter();
        let html = formatter.format(song);
        
        // Apply theme styling if requested
        if (options.theme) {
          html = this.applyThemeToHtml(html, options.theme, options.fontSize);
        }
        
        return html;
      }
      
      case 'html-table': {
        const formatter = new HtmlTableFormatter();
        let html = formatter.format(song);
        
        // Apply theme styling if requested
        if (options.theme) {
          html = this.applyThemeToHtml(html, options.theme, options.fontSize);
        }
        
        return html;
      }
      
      case 'json': {
        return JSON.stringify({
          metadata: this.extractMetadata(song),
          lines: song.lines,
          paragraphs: song.paragraphs,
        }, null, 2);
      }
      
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Transpose chords in content
   */
  transpose(content: string, semitones: number): string {
    const { song } = this.parse(content);
    song.transpose(semitones);
    
    const formatter = new ChordProFormatter();
    return formatter.format(song);
  }

  /**
   * Format ChordPro content
   */
  format(content: string): string {
    const { song } = this.parse(content);
    const formatter = new ChordProFormatter();
    return formatter.format(song);
  }

  /**
   * Get all chords used in the song
   */
  getChords(content: string): string[] {
    const { song } = this.parse(content);
    const chords = new Set<string>();
    
    // Extract chords from all lines
    song.lines.forEach((line) => {
      if (line.items) {
        line.items.forEach((item: any) => {
          // Check if item has chords property (ChordLyricsPair)
          if ('chords' in item && item.chords) {
            if (typeof item.chords === 'string') {
              chords.add(item.chords);
            } else if (Array.isArray(item.chords)) {
              item.chords.forEach((chord: string) => {
                if (chord) {
                  chords.add(chord);
                }
              });
            }
          }
        });
      }
    });
    
    return Array.from(chords).sort();
  }

  /**
   * Get song sections
   */
  getSections(content: string): Array<{ type: string; label?: string; startLine: number; endLine: number }> {
    const lines = content.split('\n');
    const sections: Array<{ type: string; label?: string; startLine: number; endLine: number }> = [];
    const sectionStack: Array<{ type: string; label?: string; startLine: number }> = [];
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for section start
      const startMatch = line.match(/\{start_of_(\w+)(?::\s*(.+))?\}/);
      if (startMatch) {
        sectionStack.push({
          type: startMatch[1],
          label: startMatch[2],
          startLine: lineNum,
        });
      }
      
      // Check for section end
      const endMatch = line.match(/\{end_of_(\w+)\}/);
      if (endMatch && sectionStack.length > 0) {
        const section = sectionStack.pop();
        if (section && section.type === endMatch[1]) {
          sections.push({
            ...section,
            endLine: lineNum,
          });
        }
      }
    });
    
    return sections;
  }

  /**
   * Extract metadata from parsed song
   */
  private extractMetadata(song: Song): ChordProMetadata {
    const metadata: ChordProMetadata = {};
    const songData = song as any;
    
    // Standard metadata fields
    if (songData.title) metadata.title = songData.title;
    if (songData.subtitle) metadata.subtitle = songData.subtitle;
    if (songData.artist) metadata.artist = songData.artist;
    if (songData.composer) metadata.composer = songData.composer;
    if (songData.lyricist) metadata.lyricist = songData.lyricist;
    if (songData.copyright) metadata.copyright = songData.copyright;
    if (songData.album) metadata.album = songData.album;
    if (songData.year) metadata.year = songData.year;
    if (songData.key) metadata.key = songData.key;
    if (songData.time) metadata.time = songData.time;
    if (songData.tempo) metadata.tempo = songData.tempo;
    if (songData.duration) metadata.duration = songData.duration;
    if (songData.capo) metadata.capo = songData.capo;
    
    // Custom metadata
    if (songData.metadata) {
      Object.entries(songData.metadata).forEach(([key, value]) => {
        if (!metadata[key]) {
          const val = value as string | string[] | number;
          metadata[key] = Array.isArray(val) ? val.join(', ') : val;
        }
      });
    }
    
    return metadata;
  }

  /**
   * Validate content and return warnings
   */
  private validateContent(content: string, song: Song): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    let warningId = 0;
    
    // Check for missing title
    if (!song.title) {
      warnings.push({
        id: `warning-${warningId++}`,
        line: 1,
        column: 1,
        message: 'Missing {title:} directive',
        severity: 'warning',
      });
    }
    
    // Check for missing key
    if (!song.key) {
      warnings.push({
        id: `warning-${warningId++}`,
        line: 1,
        column: 1,
        message: 'Missing {key:} directive',
        severity: 'warning',
      });
    }
    
    // Check for unclosed sections
    const sections = this.getSections(content);
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for section start without end
      if (line.match(/\{start_of_\w+/)) {
        const hasEnd = sections.some((s) => s.startLine === lineNum);
        if (!hasEnd) {
          warnings.push({
            id: `warning-${warningId++}`,
            line: lineNum,
            column: 1,
            message: 'Unclosed section',
            severity: 'warning',
          });
        }
      }
    });
    
    return warnings;
  }

  /**
   * Handle parse errors
   */
  private handleParseError(error: any, content: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const lines = content.split('\n');
    
    // Generic error
    errors.push({
      id: 'error-0',
      line: 1,
      column: 1,
      message: error.message || 'Invalid ChordPro syntax',
      severity: 'error',
    });
    
    // Check for common syntax errors
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Unclosed directive
      if (line.includes('{') && !line.includes('}')) {
        errors.push({
          id: `error-${errors.length}`,
          line: lineNum,
          column: line.indexOf('{') + 1,
          message: 'Unclosed directive',
          severity: 'error',
        });
      }
      
      // Empty chord
      const emptyChordMatch = line.match(/\[\s*\]/);
      if (emptyChordMatch) {
        errors.push({
          id: `error-${errors.length}`,
          line: lineNum,
          column: (emptyChordMatch.index || 0) + 1,
          message: 'Empty chord notation',
          severity: 'error',
        });
      }
    });
    
    return errors;
  }

  /**
   * Apply theme styling to HTML output
   */
  private applyThemeToHtml(html: string, theme: 'light' | 'dark' | 'stage', fontSize?: number): string {
    const themes = {
      light: {
        background: '#ffffff',
        color: '#333333',
        chordColor: '#0066cc',
        directiveColor: '#666666',
      },
      dark: {
        background: '#1a1a1a',
        color: '#e0e0e0',
        chordColor: '#66b3ff',
        directiveColor: '#999999',
      },
      stage: {
        background: '#000000',
        color: '#ffffff',
        chordColor: '#ffff00',
        directiveColor: '#cccccc',
      },
    };
    
    const selectedTheme = themes[theme];
    const size = fontSize || 16;
    
    const style = `
      <style>
        .chord-sheet {
          background: ${selectedTheme.background};
          color: ${selectedTheme.color};
          font-size: ${size}px;
          font-family: 'Courier New', monospace;
          padding: 20px;
        }
        .chord {
          color: ${selectedTheme.chordColor};
          font-weight: bold;
        }
        .directive {
          color: ${selectedTheme.directiveColor};
          font-style: italic;
        }
        .section-label {
          font-weight: bold;
          margin: 10px 0;
        }
      </style>
    `;
    
    return `<div class="chord-sheet">${style}${html}</div>`;
  }
}

// Export singleton instance
export const chordProService = new ChordProService();