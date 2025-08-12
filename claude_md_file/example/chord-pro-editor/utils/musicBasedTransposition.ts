/**
 * @file musicBasedTransposition.ts
 * @description High-level music-based transposition functions
 * Combines Line of Fifths algorithm with key detection for context-aware transposition
 */

import { 
  transposeProgression, 
  getTranspositionDistance,
  getEnharmonicKeys 
} from './lineOfFifths';
import { detectKey } from './keyDetection';

/**
 * Options for music-based transposition
 */
export interface MusicTranspositionOptions {
  /** Force a specific target key (overrides auto-detection) */
  targetKey?: string;
  /** Use music theory rules vs simple math-based transposition */
  useKeyContext?: boolean;
  /** Preserve the original key detection if confidence is low */
  preserveOriginalOnLowConfidence?: boolean;
  /** Minimum confidence threshold for key detection */
  confidenceThreshold?: number;
  /** Whether to analyze the entire progression for key or just the beginning */
  analyzeFullProgression?: boolean;
}

/**
 * Result of music-based transposition
 */
export interface MusicTranspositionResult {
  /** Transposed chord progression */
  chords: string[];
  /** Detected or specified source key */
  originalKey: string;
  /** Target key for transposition */
  targetKey: string;
  /** Key detection confidence (0-1) */
  confidence: number;
  /** Whether music-based rules were applied */
  usedMusicRules: boolean;
  /** Alternative target keys if enharmonic equivalents exist */
  alternativeTargetKeys?: string[];
  /** Analysis of the chord progression */
  analysis?: {
    diatonicChords: string[];
    nonDiatonicChords: string[];
    keyChanges?: Array<{ position: number; fromKey: string; toKey: string }>;
  };
  /** Any warnings or notes about the transposition */
  warnings?: string[];
}

/**
 * Transpose a chord progression using music theory rules
 */
export function transposeWithMusicRules(
  chords: string[],
  semitones: number,
  options: MusicTranspositionOptions = {}
): MusicTranspositionResult {
  const {
    useKeyContext = true,
    preserveOriginalOnLowConfidence = true,
    confidenceThreshold = 0.6
  } = options;

  // Input validation
  if (!chords || chords.length === 0) {
    return createEmptyResult();
  }

  const warnings: string[] = [];

  // Detect the original key
  const keyDetection = detectKey(chords);
  const originalKey = keyDetection.key;
  const confidence = keyDetection.confidence;

  // If confidence is too low and we should preserve original, fall back
  if (preserveOriginalOnLowConfidence && confidence < confidenceThreshold) {
    warnings.push(`Low key detection confidence (${(confidence * 100).toFixed(1)}%), using simple transposition`);
    return createSimpleTranspositionResult(chords, semitones, originalKey, warnings);
  }

  // Determine target key
  let targetKey: string;
  if (options.targetKey) {
    targetKey = options.targetKey;
  } else {
    // Calculate target key based on semitones from detected key
    try {
      const distance = semitonesToLineOfFifthsDistance(originalKey, semitones);
      targetKey = calculateTargetKey(originalKey, distance);
    } catch (error) {
      warnings.push(`Failed to calculate target key: ${error}`);
      return createSimpleTranspositionResult(chords, semitones, originalKey, warnings);
    }
  }

  // Perform music-based transposition
  try {
    const transposedChords = transposeProgression(chords, originalKey, targetKey);
    
    // Get alternative enharmonic keys
    const alternativeTargetKeys = getEnharmonicKeys(targetKey).filter(key => key !== targetKey);

    return {
      chords: transposedChords,
      originalKey,
      targetKey,
      confidence,
      usedMusicRules: useKeyContext,
      alternativeTargetKeys: alternativeTargetKeys.length > 0 ? alternativeTargetKeys : undefined,
      analysis: {
        diatonicChords: keyDetection.analysis?.diatonicChords || [],
        nonDiatonicChords: keyDetection.analysis?.nonDiatonicChords || []
      },
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error) {
    warnings.push(`Music-based transposition failed: ${error}`);
    return createSimpleTranspositionResult(chords, semitones, originalKey, warnings);
  }
}

/**
 * Transpose to a specific target key using music rules
 */
export function transposeToKey(
  chords: string[],
  targetKey: string,
  options: Omit<MusicTranspositionOptions, 'targetKey'> = {}
): MusicTranspositionResult {
  return transposeWithMusicRules(chords, 0, { ...options, targetKey });
}

/**
 * Get transposition suggestions for a chord progression
 */
export function getTranspositionSuggestions(
  chords: string[],
  originalKey?: string
): Array<{
  targetKey: string;
  semitones: number;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}> {
  const detectedKey = originalKey || detectKey(chords).key;
  
  const suggestions = [
    // Common easy keys
    { targetKey: 'C', description: 'C major (no sharps/flats)', difficulty: 'easy' as const },
    { targetKey: 'G', description: 'G major (1 sharp)', difficulty: 'easy' as const },
    { targetKey: 'F', description: 'F major (1 flat)', difficulty: 'easy' as const },
    { targetKey: 'D', description: 'D major (2 sharps)', difficulty: 'medium' as const },
    { targetKey: 'Bb', description: 'Bb major (2 flats)', difficulty: 'medium' as const },
    
    // Half-step transpositions
    { targetKey: calculateTargetKey(detectedKey, 1), description: 'Up 1 semitone', difficulty: 'medium' as const },
    { targetKey: calculateTargetKey(detectedKey, -1), description: 'Down 1 semitone', difficulty: 'medium' as const },
    
    // Common vocal range adjustments
    { targetKey: calculateTargetKey(detectedKey, -2), description: 'Down 1 tone (lower vocal range)', difficulty: 'easy' as const },
    { targetKey: calculateTargetKey(detectedKey, 2), description: 'Up 1 tone (higher vocal range)', difficulty: 'easy' as const },
  ];

  return suggestions
    .filter(suggestion => suggestion.targetKey !== detectedKey) // Remove current key
    .map(suggestion => ({
      ...suggestion,
      semitones: calculateSemitoneDistance(detectedKey, suggestion.targetKey)
    }))
    .slice(0, 8); // Limit to most useful suggestions
}

/**
 * Compare music-based vs math-based transposition results
 */
export function compareTranspositionMethods(
  chords: string[],
  semitones: number
): {
  musicBased: MusicTranspositionResult;
  mathBased: string[];
  differences: Array<{ position: number; mathChord: string; musicChord: string; reason: string }>;
} {
  const musicResult = transposeWithMusicRules(chords, semitones);
  const mathBased = chords.map(chord => simpleMathTranspose(chord, semitones));
  
  const differences: Array<{ position: number; mathChord: string; musicChord: string; reason: string }> = [];
  
  musicResult.chords.forEach((musicChord, index) => {
    const mathChord = mathBased[index];
    if (musicChord !== mathChord) {
      differences.push({
        position: index,
        mathChord,
        musicChord,
        reason: `Music-based uses key context for proper enharmonic spelling`
      });
    }
  });

  return {
    musicBased: musicResult,
    mathBased,
    differences
  };
}

// Helper functions

function createEmptyResult(): MusicTranspositionResult {
  return {
    chords: [],
    originalKey: 'C',
    targetKey: 'C',
    confidence: 0,
    usedMusicRules: false,
    warnings: ['Empty chord progression']
  };
}

function createSimpleTranspositionResult(
  chords: string[], 
  semitones: number, 
  originalKey: string, 
  warnings: string[]
): MusicTranspositionResult {
  const transposedChords = chords.map(chord => simpleMathTranspose(chord, semitones));
  
  return {
    chords: transposedChords,
    originalKey,
    targetKey: 'Unknown',
    confidence: 0,
    usedMusicRules: false,
    warnings
  };
}

function semitonesToLineOfFifthsDistance(_key: string, semitones: number): number {
  // This is a simplified mapping - in practice, we'd need to consider
  // the circle of fifths relationships more carefully
  const semitoneToFifthsMap: Record<number, number> = {
    0: 0,   // No change
    1: 7,   // Up 1 semitone ≈ 7 fifths
    2: 2,   // Up 2 semitones = 2 fifths
    3: 9,   // Up 3 semitones ≈ 9 fifths  
    4: 4,   // Up 4 semitones = 4 fifths
    5: -1,  // Up 5 semitones = -1 fifth
    6: 6,   // Up 6 semitones = 6 fifths (tritone)
    7: 1,   // Up 7 semitones = 1 fifth
    8: 8,   // Up 8 semitones ≈ 8 fifths
    9: 3,   // Up 9 semitones = 3 fifths
    10: 10, // Up 10 semitones ≈ 10 fifths
    11: 5,  // Up 11 semitones = 5 fifths
    
    // Negative semitones (going down)
    '-1': -7, '-2': -2, '-3': -9, '-4': -4, '-5': 1, '-6': -6,
    '-7': -1, '-8': -8, '-9': -3, '-10': -10, '-11': -5
  };
  
  return semitoneToFifthsMap[semitones] || 0;
}

function calculateTargetKey(originalKey: string, distance: number): string {
  try {
    const originalPosition = getLineOfFifthsPosition(originalKey);
    const targetPosition = originalPosition + distance;
    return getNoteAtLineOfFifthsPosition(targetPosition);
  } catch (error) {
    // Fallback to simple calculation
    return originalKey;
  }
}

function calculateSemitoneDistance(fromKey: string, toKey: string): number {
  try {
    return getTranspositionDistance(fromKey, toKey);
  } catch (error) {
    return 0;
  }
}

function simpleMathTranspose(chord: string, _semitones: number): string {
  // Simple chromatic transposition for comparison
  // This would use the existing math-based implementation
  return chord; // Placeholder
}

function getLineOfFifthsPosition(key: string): number {
  // Simplified position calculation
  const positions: Record<string, number> = {
    'Cb': -7, 'Gb': -6, 'Db': -5, 'Ab': -4, 'Eb': -3, 'Bb': -2, 'F': -1,
    'C': 0,
    'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'C#': 7
  };
  
  return positions[key] || 0;
}

function getNoteAtLineOfFifthsPosition(position: number): string {
  const notes = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
  const index = position + 7; // Offset to match array indexing
  
  if (index >= 0 && index < notes.length) {
    return notes[index];
  }
  
  return 'C'; // Fallback
}