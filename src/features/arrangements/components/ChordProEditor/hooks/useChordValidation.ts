/**
 * @file useChordValidation.ts
 * @description Hook for validating ChordPro content using ChordSheetJS
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import { ChordSheetParser } from 'chordsheetjs';
import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ChordProMetadata,
  ValidationOptions,
  UseChordValidationResult,
} from '../../../types/editor.types';

/**
 * Debounce utility function
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Extract metadata from parsed ChordPro content
 */
function extractMetadata(parsedSong: any): ChordProMetadata {
  const metadata: ChordProMetadata = {};
  
  // Extract standard metadata fields
  if (parsedSong?.title) metadata.title = parsedSong.title;
  if (parsedSong?.subtitle) metadata.subtitle = parsedSong.subtitle;
  if (parsedSong?.artist) metadata.artist = parsedSong.artist;
  if (parsedSong?.composer) metadata.composer = parsedSong.composer;
  if (parsedSong?.lyricist) metadata.lyricist = parsedSong.lyricist;
  if (parsedSong?.copyright) metadata.copyright = parsedSong.copyright;
  if (parsedSong?.album) metadata.album = parsedSong.album;
  if (parsedSong?.year) metadata.year = parsedSong.year;
  if (parsedSong?.key) metadata.key = parsedSong.key;
  if (parsedSong?.time) metadata.time = parsedSong.time;
  if (parsedSong?.tempo) metadata.tempo = parsedSong.tempo;
  if (parsedSong?.duration) metadata.duration = parsedSong.duration;
  if (parsedSong?.capo) metadata.capo = parsedSong.capo;
  
  // Extract custom metadata
  if (parsedSong?.metadata) {
    Object.entries(parsedSong.metadata).forEach(([key, value]) => {
      if (!metadata[key]) {
        metadata[key] = value as string | number;
      }
    });
  }
  
  return metadata;
}

/**
 * Detect warnings in ChordPro content
 */
function detectWarnings(content: string, parsedSong: any): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  let warningId = 0;
  
  // Check for missing title
  if (!parsedSong?.title && !content.includes('{title:')) {
    warnings.push({
      id: `warning-${warningId++}`,
      line: 1,
      column: 1,
      message: 'Missing {title:} directive - consider adding a song title',
      severity: 'warning',
    });
  }
  
  // Check for missing key
  if (!parsedSong?.key && !content.includes('{key:')) {
    warnings.push({
      id: `warning-${warningId++}`,
      line: 1,
      column: 1,
      message: 'Missing {key:} directive - consider specifying the song key',
      severity: 'warning',
    });
  }
  
  // Check for unclosed sections
  const startSections = (content.match(/\{start_of_\w+\}/g) || []).length;
  const endSections = (content.match(/\{end_of_\w+\}/g) || []).length;
  
  if (startSections !== endSections) {
    warnings.push({
      id: `warning-${warningId++}`,
      line: 1,
      column: 1,
      message: `Mismatched section markers: ${startSections} start markers, ${endSections} end markers`,
      severity: 'warning',
    });
  }
  
  // Check for chord positioning issues
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Check for chords without lyrics
    const chordOnlyLine = /^\s*(\[[^\]]+\]\s*)+$/.test(line);
    if (chordOnlyLine && index < lines.length - 1) {
      const nextLine = lines[index + 1];
      if (nextLine && !nextLine.trim().startsWith('{') && !nextLine.trim().startsWith('#')) {
        warnings.push({
          id: `warning-${warningId++}`,
          line: index + 1,
          column: 1,
          message: 'Chord line without lyrics - consider placing chords inline with text',
          severity: 'warning',
        });
      }
    }
  });
  
  return warnings;
}

/**
 * Parse errors from ChordSheetJS exceptions
 */
function parseErrors(error: any, content: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Try to extract line and column from error message
  let line = 1;
  let column = 1;
  let message = 'Invalid ChordPro syntax';
  
  if (error instanceof Error) {
    message = error.message;
    
    // Try to extract line number from error message
    const lineMatch = message.match(/line (\d+)/i);
    if (lineMatch) {
      line = parseInt(lineMatch[1], 10);
    }
    
    // Try to extract column number from error message
    const colMatch = message.match(/column (\d+)/i);
    if (colMatch) {
      column = parseInt(colMatch[1], 10);
    }
  }
  
  // Check for common syntax errors
  const lines = content.split('\n');
  lines.forEach((lineContent, index) => {
    const lineNum = index + 1;
    
    // Check for malformed directives
    if (lineContent.includes('{') && !lineContent.includes('}')) {
      errors.push({
        id: `error-${errors.length}`,
        line: lineNum,
        column: lineContent.indexOf('{') + 1,
        message: 'Unclosed directive - missing closing brace }',
        severity: 'error',
      });
    }
    
    if (lineContent.includes('}') && !lineContent.includes('{')) {
      errors.push({
        id: `error-${errors.length}`,
        line: lineNum,
        column: lineContent.indexOf('}') + 1,
        message: 'Unexpected closing brace } without opening brace',
        severity: 'error',
      });
    }
    
    // Check for malformed chord notation
    const chordMatches = lineContent.matchAll(/\[([^\]]*)\]/g);
    for (const match of chordMatches) {
      if (!match[1] || match[1].trim() === '') {
        errors.push({
          id: `error-${errors.length}`,
          line: lineNum,
          column: (match.index || 0) + 1,
          message: 'Empty chord notation []',
          severity: 'error',
        });
      }
    }
    
    // Check for directives missing colons
    const directiveMatch = lineContent.match(/\{([^:}\s]+)\s+([^}]+)\}/);
    if (directiveMatch) {
      const knownDirectives = [
        'title', 'subtitle', 'artist', 'composer', 'lyricist', 'copyright',
        'album', 'year', 'key', 'time', 'tempo', 'duration', 'capo',
        'comment', 'c', 'start_of_chorus', 'end_of_chorus', 'start_of_verse',
        'end_of_verse', 'start_of_bridge', 'end_of_bridge', 'start_of_tab',
        'end_of_tab', 'start_of_grid', 'end_of_grid',
      ];
      
      if (knownDirectives.includes(directiveMatch[1].toLowerCase())) {
        errors.push({
          id: `error-${errors.length}`,
          line: lineNum,
          column: (directiveMatch.index || 0) + 1,
          message: `Malformed directive - missing colon after "${directiveMatch[1]}"`,
          severity: 'error',
        });
      }
    }
  });
  
  // If no specific errors found, add generic error
  if (errors.length === 0) {
    errors.push({
      id: 'error-0',
      line,
      column,
      message,
      severity: 'error',
    });
  }
  
  return errors;
}

/**
 * Hook for validating ChordPro content
 */
export function useChordValidation(
  content: string,
  options?: ValidationOptions
): UseChordValidationResult {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    metadata: {},
    parseTime: 0,
  });
  
  // Create parser instance
  const parser = useMemo(() => new ChordSheetParser(), []);
  
  // Validation function
  const validateContent = useCallback((text: string) => {
    const startTime = performance.now();
    
    try {
      // Parse the ChordPro content
      const parsedSong = parser.parse(text);
      
      // Extract metadata
      const metadata = extractMetadata(parsedSong);
      
      // Detect warnings
      const warnings = detectWarnings(text, parsedSong);
      
      // Set validation result
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings,
        metadata,
        parseTime: performance.now() - startTime,
      };
      
      setValidationResult(result);
      return result;
    } catch (error) {
      // Parse errors from exception
      const errors = parseErrors(error, text);
      
      // Set validation result with errors
      const result: ValidationResult = {
        isValid: false,
        errors,
        warnings: [],
        metadata: {},
        parseTime: performance.now() - startTime,
      };
      
      setValidationResult(result);
      return result;
    }
  }, [parser]);
  
  // Debounced validation
  const debouncedValidate = useMemo(
    () => debounce(validateContent, options?.debounceMs ?? 300),
    [validateContent, options?.debounceMs]
  );
  
  // Validate on content change
  useEffect(() => {
    if (options?.validateOnChange !== false) {
      debouncedValidate(content);
    }
  }, [content, debouncedValidate, options?.validateOnChange]);
  
  // Validate on mount if requested
  useEffect(() => {
    if (options?.validateOnMount) {
      validateContent(content);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  return {
    ...validationResult,
    validate: validateContent,
  };
}