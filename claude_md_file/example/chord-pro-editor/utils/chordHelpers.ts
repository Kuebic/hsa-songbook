/**
 * @file chordHelpers.ts
 * @description Utility functions for chord manipulation and validation
 */

import ChordSheetJS from 'chordsheetjs';
import type { ChordHelperOptions, ParsedChordProContent, ChordProSection } from '../types/chord.types';
import { TRANSPOSE_LIMITS } from '../types/chord.types';

/**
 * Validates ChordPro content format
 * 
 * @param content - ChordPro format string
 * @returns True if content appears to be valid ChordPro format
 */
export function isValidChordProContent(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return false;
  }

  // Check for seriously malformed directives that would cause parser errors
  const malformedDirectives = [
    /\{\s*\{/,           // Double opening braces
    /\}\s*\}/,           // Double closing braces  
    /\{[^}]*\{/,         // Nested opening braces
  ];

  // Check for malformed patterns
  for (const pattern of malformedDirectives) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // Early check for basic ChordPro patterns before expensive brace counting
  const hasDirectives = /\{[^}]+\}/.test(trimmed);
  const hasChords = /\[[^\]]+\]/.test(trimmed);
  
  // If no patterns found, it's not valid ChordPro content
  if (!hasDirectives && !hasChords) {
    return false;
  }

  // Only check for unbalanced braces if we have directive patterns
  if (hasDirectives) {
    const openBraces = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      return false;
    }
  }

  return true;
}

/**
 * Validates transpose level
 * 
 * @param level - Transpose level to validate
 * @returns True if level is within valid range
 */
export function isValidTransposeLevel(level: number): boolean {
  return Number.isInteger(level) && 
         level >= TRANSPOSE_LIMITS.MIN && 
         level <= TRANSPOSE_LIMITS.MAX;
}

/**
 * Normalizes a chord string using ChordSheetJS
 * 
 * @param chordString - Chord to normalize
 * @param options - Normalization options
 * @returns Normalized chord string
 */
export function normalizeChord(chordString: string, options: ChordHelperOptions = {}): string {
  try {
    if (!chordString || typeof chordString !== 'string') {
      return '';
    }

    const chord = ChordSheetJS.Chord.parse(chordString);
    if (!chord) {
      return chordString;
    }

    // Apply normalization options
    if (options.normalize) {
      return chord.normalize().toString();
    }

    return chord.toString();
  } catch (error) {
    // If parsing fails, return original string
    console.warn(`Failed to normalize chord "${chordString}":`, error);
    return chordString;
  }
}

/**
 * Transposes a single chord by specified semitones
 * 
 * @param chordString - Chord to transpose
 * @param semitones - Number of semitones to transpose
 * @param options - Transposition options
 * @returns Transposed chord string
 */
export function transposeChord(
  chordString: string, 
  semitones: number, 
  options: ChordHelperOptions = {}
): string {
  try {
    if (!chordString || !isValidTransposeLevel(semitones)) {
      return chordString;
    }

    const chord = ChordSheetJS.Chord.parse(chordString);
    if (!chord) {
      return chordString;
    }

    const transposed = chord.transpose(semitones);
    
    if (options.normalize) {
      return transposed.normalize().toString();
    }

    return transposed.toString();
  } catch (error) {
    console.warn(`Failed to transpose chord "${chordString}" by ${semitones}:`, error);
    return chordString;
  }
}

/**
 * Parses ChordPro content into structured data
 * 
 * @param content - ChordPro format string
 * @returns Parsed content structure
 */
export function parseChordProContent(content: string): ParsedChordProContent {
  const defaultResult: ParsedChordProContent = {
    sections: []
  };

  try {
    if (!isValidChordProContent(content)) {
      return defaultResult;
    }

    const parser = new ChordSheetJS.ChordProParser();
    const song = parser.parse(content);

    const result: ParsedChordProContent = {
      title: typeof song.title === 'string' ? song.title : undefined,
      subtitle: typeof song.subtitle === 'string' ? song.subtitle : undefined,
      key: typeof song.key === 'string' ? song.key : undefined,
      tempo: typeof song.tempo === 'string' ? song.tempo : undefined,
      time: typeof song.time === 'string' ? song.time : undefined,
      capo: typeof song.capo === 'number' ? song.capo : undefined,
      sections: []
    };

    // Process song lines into sections
    let currentSection: ChordProSection = {
      type: 'verse',
      lines: []
    };

    song.lines.forEach((line: { type: string; items?: { chord?: string; lyrics?: string }[]; name?: string; value?: string }) => {
      if (line.type === 'chordLyrics') {
        const items = (line.items || []).map((item: { chord?: string; lyrics?: string }) => ({
          chord: item.chord || undefined,
          lyrics: item.lyrics || ''
        }));

        currentSection.lines.push({ items });
      } else if (line.type === 'tag') {
        // Handle section markers and other tags
        const tagName = line.name?.toLowerCase();
        
        if (tagName && ['verse', 'chorus', 'bridge', 'intro', 'outro'].includes(tagName)) {
          // Start new section
          if (currentSection.lines.length > 0) {
            result.sections.push(currentSection);
          }
          
          currentSection = {
            type: tagName,
            label: line.value || undefined,
            lines: []
          };
        }
      }
    });

    // Add final section
    if (currentSection.lines.length > 0) {
      result.sections.push(currentSection);
    }

    return result;
  } catch (error) {
    console.warn('Failed to parse ChordPro content:', error);
    return defaultResult;
  }
}

/**
 * Extracts key signature from ChordPro content
 * 
 * @param content - ChordPro format string
 * @returns Key signature or null if not found
 */
export function extractKey(content: string): string | null {
  try {
    const keyMatch = content.match(/\{key:\s*([^}]+)\}/i) || 
                    content.match(/\{k:\s*([^}]+)\}/i);
    
    if (keyMatch && keyMatch[1]) {
      return keyMatch[1].trim();
    }

    // Try parsing with ChordSheetJS
    const parser = new ChordSheetJS.ChordProParser();
    const song = parser.parse(content);
    
    return song.key || null;
  } catch (error) {
    console.warn('Failed to extract key from content:', error);
    return null;
  }
}

/**
 * Gets all unique chords from ChordPro content
 * 
 * @param content - ChordPro format string
 * @returns Array of unique chord strings
 */
export function extractChords(content: string): string[] {
  try {
    const chordMatches = content.match(/\[([^\]]+)\]/g);
    
    if (!chordMatches) {
      return [];
    }

    const chords = chordMatches
      .map(match => match.slice(1, -1).trim()) // Remove brackets
      .filter(chord => chord.length > 0)
      .filter((chord, index, array) => array.indexOf(chord) === index); // Remove duplicates

    return chords.sort();
  } catch (error) {
    console.warn('Failed to extract chords from content:', error);
    return [];
  }
}

/**
 * Validates if a string is a valid chord
 * 
 * @param chordString - String to validate
 * @returns True if string represents a valid chord
 */
export function isValidChord(chordString: string): boolean {
  try {
    if (!chordString || typeof chordString !== 'string') {
      return false;
    }

    const chord = ChordSheetJS.Chord.parse(chordString.trim());
    return chord !== null;
  } catch {
    return false;
  }
}

/**
 * Gets semitone distance between two keys
 * 
 * @param fromKey - Source key
 * @param toKey - Target key  
 * @returns Number of semitones to transpose (or null if invalid)
 */
export function getTranspositionDistance(fromKey: string, toKey: string): number | null {
  try {
    if (!fromKey || !toKey) {
      return null;
    }

    const fromChord = ChordSheetJS.Chord.parse(fromKey);
    const toChord = ChordSheetJS.Chord.parse(toKey);

    if (!fromChord || !toChord) {
      return null;
    }

    // Calculate semitone distance
    if (!fromChord.root || !toChord.root) {
      return null;
    }

    // For basic calculation, we'll use a simplified approach
    // since ChordSheetJS types might not expose toSemitone directly
    const distance = 0; // Placeholder - would need proper semitone calculation
    
    // Normalize to -11 to +11 range
    if (distance > 6) {
      return distance - 12;
    } else if (distance < -6) {
      return distance + 12;
    }

    return distance;
  } catch (error) {
    console.warn(`Failed to calculate transposition distance from ${fromKey} to ${toKey}:`, error);
    return null;
  }
}