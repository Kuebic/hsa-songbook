/**
 * @file useChordTransposition.ts
 * @description Hook for handling chord transposition in the ChordPro editor
 */

import { useState, useCallback, useMemo } from 'react';
import { chordProService } from '../../../services/chordProService';

/**
 * Musical keys for transposition
 */
export const MUSICAL_KEYS = [
  'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 
  'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'
] as const;

/**
 * Transposition options
 */
export interface TranspositionOptions {
  preferFlats?: boolean;
  preserveCase?: boolean;
}

/**
 * Transposition result
 */
export interface TranspositionResult {
  content: string;
  originalKey?: string;
  newKey?: string;
  transposedBy: number;
}

/**
 * Hook return type
 */
export interface UseChordTranspositionResult {
  transpose: (content: string, semitones: number) => TranspositionResult;
  transposeToKey: (content: string, targetKey: string) => TranspositionResult;
  detectKey: (content: string) => string | null;
  currentTransposition: number;
  resetTransposition: () => void;
  availableKeys: readonly string[];
}

/**
 * Detect the key of a song from its content
 */
function detectSongKey(content: string): string | null {
  // First, check for explicit {key:} directive
  const keyMatch = content.match(/\{key:\s*([A-G][#b]?)(?:m|maj|min|major|minor)?\s*\}/i);
  if (keyMatch) {
    return normalizeKey(keyMatch[1]);
  }
  
  // If no explicit key, try to detect from chords
  const chords = chordProService.getChords(content);
  if (chords.length === 0) return null;
  
  // Simple heuristic: first chord is often the key
  const firstChord = chords[0];
  const rootNote = firstChord.match(/^([A-G][#b]?)/);
  if (rootNote) {
    return normalizeKey(rootNote[1]);
  }
  
  return null;
}

/**
 * Normalize key notation (e.g., Bb -> A#/Bb)
 */
function normalizeKey(key: string): string {
  const sharpToFlat: { [key: string]: string } = {
    'C#': 'C#/Db',
    'D#': 'D#/Eb',
    'F#': 'F#/Gb',
    'G#': 'G#/Ab',
    'A#': 'A#/Bb',
  };
  
  const flatToSharp: { [key: string]: string } = {
    'Db': 'C#/Db',
    'Eb': 'D#/Eb',
    'Gb': 'F#/Gb',
    'Ab': 'G#/Ab',
    'Bb': 'A#/Bb',
  };
  
  const upperKey = key.toUpperCase();
  
  if (sharpToFlat[upperKey]) {
    return sharpToFlat[upperKey];
  }
  
  if (flatToSharp[upperKey]) {
    return flatToSharp[upperKey];
  }
  
  // Return the key as-is if it's a natural note
  if (/^[A-G]$/.test(upperKey)) {
    return upperKey;
  }
  
  return key;
}

/**
 * Calculate semitones between two keys
 */
function calculateSemitones(fromKey: string, toKey: string): number {
  const keyToIndex: { [key: string]: number } = {
    'C': 0,
    'C#': 1, 'Db': 1, 'C#/Db': 1,
    'D': 2,
    'D#': 3, 'Eb': 3, 'D#/Eb': 3,
    'E': 4,
    'F': 5,
    'F#': 6, 'Gb': 6, 'F#/Gb': 6,
    'G': 7,
    'G#': 8, 'Ab': 8, 'G#/Ab': 8,
    'A': 9,
    'A#': 10, 'Bb': 10, 'A#/Bb': 10,
    'B': 11,
  };
  
  const fromIndex = keyToIndex[normalizeKey(fromKey)];
  const toIndex = keyToIndex[normalizeKey(toKey)];
  
  if (fromIndex === undefined || toIndex === undefined) {
    throw new Error('Invalid key');
  }
  
  let semitones = toIndex - fromIndex;
  
  // Normalize to -6 to +5 range (closest transposition)
  if (semitones > 6) {
    semitones -= 12;
  } else if (semitones < -6) {
    semitones += 12;
  }
  
  return semitones;
}

/**
 * Get the resulting key after transposition
 */
function getTransposedKey(originalKey: string, semitones: number): string {
  const keyToIndex: { [key: string]: number } = {
    'C': 0,
    'C#/Db': 1,
    'D': 2,
    'D#/Eb': 3,
    'E': 4,
    'F': 5,
    'F#/Gb': 6,
    'G': 7,
    'G#/Ab': 8,
    'A': 9,
    'A#/Bb': 10,
    'B': 11,
  };
  
  const indexToKey = [
    'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F',
    'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'
  ];
  
  const normalizedKey = normalizeKey(originalKey);
  const originalIndex = keyToIndex[normalizedKey];
  
  if (originalIndex === undefined) {
    return originalKey;
  }
  
  let newIndex = (originalIndex + semitones) % 12;
  if (newIndex < 0) {
    newIndex += 12;
  }
  
  return indexToKey[newIndex];
}

/**
 * Hook for chord transposition functionality
 */
export function useChordTransposition(): UseChordTranspositionResult {
  const [currentTransposition, setCurrentTransposition] = useState(0);

  /**
   * Transpose content by semitones
   */
  const transpose = useCallback((content: string, semitones: number): TranspositionResult => {
    if (semitones === 0) {
      return {
        content,
        transposedBy: 0,
      };
    }
    
    // Detect original key
    const originalKey = detectSongKey(content);
    
    // Transpose the content
    const transposedContent = chordProService.transpose(content, semitones);
    
    // Calculate new key
    const newKey = originalKey ? getTransposedKey(originalKey, semitones) : undefined;
    
    // Update key directive if present
    let finalContent = transposedContent;
    if (originalKey && newKey) {
      finalContent = finalContent.replace(
        /\{key:\s*[A-G][#b]?(?:m|maj|min|major|minor)?\s*\}/gi,
        `{key: ${newKey.split('/')[0]}}`
      );
    }
    
    // Track total transposition
    setCurrentTransposition((prev) => prev + semitones);
    
    return {
      content: finalContent,
      originalKey: originalKey || undefined,
      newKey,
      transposedBy: semitones,
    };
  }, []);

  /**
   * Transpose to a specific key
   */
  const transposeToKey = useCallback((content: string, targetKey: string): TranspositionResult => {
    const originalKey = detectSongKey(content);
    
    if (!originalKey) {
      throw new Error('Cannot determine original key for transposition');
    }
    
    const semitones = calculateSemitones(originalKey, targetKey);
    return transpose(content, semitones);
  }, [transpose]);

  /**
   * Detect the key of the song
   */
  const detectKey = useCallback((content: string): string | null => {
    return detectSongKey(content);
  }, []);

  /**
   * Reset transposition counter
   */
  const resetTransposition = useCallback(() => {
    setCurrentTransposition(0);
  }, []);

  /**
   * Available keys for transposition
   */
  const availableKeys = useMemo(() => MUSICAL_KEYS, []);

  return {
    transpose,
    transposeToKey,
    detectKey,
    currentTransposition,
    resetTransposition,
    availableKeys,
  };
}