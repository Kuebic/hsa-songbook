/**
 * @file useChordValidation.ts
 * @description React hook for ChordPro content validation with ChordSheetJS integration
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import ChordSheetJS from 'chordsheetjs';
import type { 
  ValidationResult, 
  ValidationError, 
  ValidationWarning, 
  UseChordValidationResult 
} from '../types/chord.types';
import { CHORDPRO_DIRECTIVES } from '../types/chord.types';
import { isValidChord } from '../utils/chordHelpers';

/**
 * Custom hook for ChordPro content validation
 * 
 * Provides real-time validation with debouncing, error reporting, and performance metrics.
 * Uses ChordSheetJS parser for syntax validation and custom rules for best practices.
 * 
 * @param debounceDelay - Validation debounce delay in milliseconds
 * @returns UseChordValidationResult with validation state and methods
 * 
 * @example
 * ```tsx
 * const { validation, validate, isValidating, errorCount } = useChordValidation();
 * 
 * // Validate content
 * const result = validate(chordProContent);
 * 
 * // Check results
 * if (result.valid) {
 *   console.log('Content is valid');
 * } else {
 *   console.log(`Found ${errorCount} errors`);
 * }
 * ```
 */
export function useChordValidation(): UseChordValidationResult {
  const [validation] = useState<ValidationResult | null>(null);
  const [isValidating] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const validationCacheRef = useRef<Map<string, ValidationResult>>(new Map());

  /**
   * Validate ChordPro directive syntax
   */
  const validateDirective = useCallback((line: string, lineNumber: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const directiveMatch = line.match(/\{([^}:]+)(?::([^}]*))?\}/g);
    
    if (!directiveMatch) return errors;

    directiveMatch.forEach((match) => {
      const directivePattern = /\{([^}:]+)(?::([^}]*))?\}/;
      const result = match.match(directivePattern);
      
      if (!result) return;
      
      const [, directive, value] = result;
      const normalizedDirective = directive.toLowerCase().trim();
      
      // Check if directive is known
      if (!(CHORDPRO_DIRECTIVES as readonly string[]).includes(normalizedDirective)) {
        errors.push({
          line: lineNumber,
          column: line.indexOf(match) + 1,
          message: `Unknown directive '${directive}'`,
          type: 'directive',
          suggestion: `Did you mean one of: ${CHORDPRO_DIRECTIVES.filter(d => 
            d.startsWith(normalizedDirective.charAt(0))
          ).slice(0, 3).join(', ')}?`
        });
      }
      
      // Check for empty values where required
      if (['title', 'artist', 'key'].includes(normalizedDirective) && !value?.trim()) {
        errors.push({
          line: lineNumber,
          column: line.indexOf(match) + 1,
          message: `Directive '${directive}' requires a value`,
          type: 'directive',
          suggestion: `Add a value: {${directive}: your value here}`
        });
      }
    });

    return errors;
  }, []);

  /**
   * Validate chord symbols in a line
   */
  const validateChords = useCallback((line: string, lineNumber: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const chordMatches = line.match(/\[([^\]]+)\]/g);
    
    if (!chordMatches) return errors;

    chordMatches.forEach((match) => {
      const chord = match.slice(1, -1).trim();
      const column = line.indexOf(match) + 1;
      
      if (!chord) {
        errors.push({
          line: lineNumber,
          column,
          message: 'Empty chord bracket',
          type: 'chord',
          suggestion: 'Remove empty brackets or add a chord symbol'
        });
        return;
      }

      if (!isValidChord(chord)) {
        errors.push({
          line: lineNumber,
          column,
          message: `Invalid chord symbol '${chord}'`,
          type: 'chord',
          suggestion: 'Check chord spelling and format (e.g., C, Am, F#m7)'
        });
      }
    });

    return errors;
  }, []);

  /**
   * Generate validation warnings for style and best practices
   */
  const generateWarnings = useCallback((content: string): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];
    const lines = content.split('\n');

    // Check for missing metadata
    const hasTitle = /\{title:/i.test(content);
    const hasArtist = /\{artist:/i.test(content);
    const hasKey = /\{key:/i.test(content);

    if (!hasTitle) {
      warnings.push({
        line: 1,
        message: 'Song is missing a title',
        type: 'style',
        suggestion: 'Add {title: Song Title} at the beginning'
      });
    }

    if (!hasArtist) {
      warnings.push({
        line: 1,
        message: 'Song is missing artist information',
        type: 'style',
        suggestion: 'Add {artist: Artist Name} for better organization'
      });
    }

    if (!hasKey) {
      warnings.push({
        line: 1,
        message: 'Song is missing key signature',
        type: 'style',
        suggestion: 'Add {key: C} to help with transposition'
      });
    }

    // Check for very long lines
    lines.forEach((line, index) => {
      if (line.length > 120) {
        warnings.push({
          line: index + 1,
          message: 'Line is very long and may be hard to read',
          type: 'style',
          suggestion: 'Consider breaking long lines for better readability'
        });
      }
    });

    // Check for inconsistent section markers
    const hasStartChorus = /\{start_of_chorus\}/i.test(content);
    const hasSOC = /\{soc\}/i.test(content);
    
    if (hasStartChorus && hasSOC) {
      warnings.push({
        line: 1,
        message: 'Mixed section marker styles detected',
        type: 'style',
        suggestion: 'Use either {start_of_chorus}/{end_of_chorus} or {soc}/{eoc} consistently'
      });
    }

    return warnings;
  }, []);

  /**
   * Main validation function
   */
  const validate = useCallback((content: string): ValidationResult => {
    const startTime = performance.now();
    
    // Check cache first
    const cached = validationCacheRef.current.get(content);
    if (cached) {
      return cached;
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Try parsing with ChordSheetJS
      const parser = new ChordSheetJS.ChordProParser();
      parser.parse(content);
      
      // If parsing succeeds, validate line by line
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        
        // Validate directives
        errors.push(...validateDirective(line, lineNumber));
        
        // Validate chords
        errors.push(...validateChords(line, lineNumber));
      });
      
      // Generate warnings
      warnings.push(...generateWarnings(content));
      
    } catch (error) {
      // ChordSheetJS parsing failed
      let errorMessage = 'Invalid ChordPro syntax';
      let line = 1;
      const column = 1;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Try to extract line/column from error message
        const locationMatch = error.message.match(/line (\d+)/i);
        if (locationMatch) {
          line = parseInt(locationMatch[1], 10);
        }
      }
      
      errors.push({
        line,
        column,
        message: errorMessage,
        type: 'syntax',
        suggestion: 'Check ChordPro syntax - ensure all braces are properly closed'
      });
    }

    const parseTime = performance.now() - startTime;
    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      parseTime
    };

    // Cache the result
    validationCacheRef.current.set(content, result);
    
    // Limit cache size
    if (validationCacheRef.current.size > 100) {
      const firstKey = validationCacheRef.current.keys().next().value;
      if (firstKey !== undefined) {
        validationCacheRef.current.delete(firstKey);
      }
    }

    return result;
  }, [validateDirective, validateChords, generateWarnings]);

  // Note: Debounced validation can be implemented when needed for performance
  // Currently using direct validation for immediate feedback

  // Memoized derived values
  const errorCount = useMemo(() => validation?.errors.length ?? 0, [validation?.errors.length]);
  const warningCount = useMemo(() => validation?.warnings?.length ?? 0, [validation?.warnings?.length]);

  // Cleanup timeout on unmount
  useState(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  });

  return {
    validation,
    validate,
    isValidating,
    errorCount,
    warningCount
  };
}