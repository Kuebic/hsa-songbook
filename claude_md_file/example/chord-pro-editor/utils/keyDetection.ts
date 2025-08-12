/**
 * @file keyDetection.ts
 * @description Automatic key detection from chord progressions
 * Uses music theory analysis to determine the most likely key
 */

import { extractChordRoot } from './lineOfFifths';
import type { KeyDetectionResult } from '../types/chord.types';

/**
 * Diatonic chords for major keys (I, ii, iii, IV, V, vi, vii°)
 */
const MAJOR_DIATONIC_PATTERNS: Record<string, string[]> = {
  'C': ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
  'G': ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
  'D': ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
  'A': ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
  'E': ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
  'B': ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim'],
  'F#': ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'E#dim'],
  'C#': ['C#', 'D#m', 'E#m', 'F#', 'G#', 'A#m', 'B#dim'],
  'F': ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
  'Bb': ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim'],
  'Eb': ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim'],
  'Ab': ['Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'Fm', 'Gdim'],
  'Db': ['Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm', 'Cdim'],
  'Gb': ['Gb', 'Abm', 'Bbm', 'Cb', 'Db', 'Ebm', 'Fdim'],
  'Cb': ['Cb', 'Dbm', 'Ebm', 'Fb', 'Gb', 'Abm', 'Bbdim'],
};

/**
 * Diatonic chords for natural minor keys (i, ii°, bIII, iv, v, bVI, bVII)
 */
const MINOR_DIATONIC_PATTERNS: Record<string, string[]> = {
  'Am': ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'],
  'Em': ['Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D'],
  'Bm': ['Bm', 'C#dim', 'D', 'Em', 'F#m', 'G', 'A'],
  'F#m': ['F#m', 'G#dim', 'A', 'Bm', 'C#m', 'D', 'E'],
  'C#m': ['C#m', 'D#dim', 'E', 'F#m', 'G#m', 'A', 'B'],
  'G#m': ['G#m', 'A#dim', 'B', 'C#m', 'D#m', 'E', 'F#'],
  'D#m': ['D#m', 'E#dim', 'F#', 'G#m', 'A#m', 'B', 'C#'],
  'A#m': ['A#m', 'B#dim', 'C#', 'D#m', 'E#m', 'F#', 'G#'],
  'Dm': ['Dm', 'Edim', 'F', 'Gm', 'Am', 'Bb', 'C'],
  'Gm': ['Gm', 'Adim', 'Bb', 'Cm', 'Dm', 'Eb', 'F'],
  'Cm': ['Cm', 'Ddim', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb'],
  'Fm': ['Fm', 'Gdim', 'Ab', 'Bbm', 'Cm', 'Db', 'Eb'],
  'Bbm': ['Bbm', 'Cdim', 'Db', 'Ebm', 'Fm', 'Gb', 'Ab'],
  'Ebm': ['Ebm', 'Fdim', 'Gb', 'Abm', 'Bbm', 'Cb', 'Db'],
  'Abm': ['Abm', 'Bbdim', 'Cb', 'Dbm', 'Ebm', 'Fb', 'Gb'],
};

/**
 * Common chord function weights for key detection
 */
const CHORD_FUNCTION_WEIGHTS = {
  tonic: 3.0,        // I, i
  dominant: 2.5,     // V, V7
  subdominant: 2.0,  // IV, iv
  secondary: 1.5,    // ii, iii, vi
  diminished: 1.0,   // vii°, ii°
  borrowed: 0.8,     // borrowed chords
  chromatic: 0.3     // chromatic chords
};

/**
 * Normalize chord symbol to basic form for analysis
 */
function normalizeChordForAnalysis(chord: string): string {
  if (!chord) return '';
  
  try {
    // Extract root and basic quality
    const root = extractChordRoot(chord);
    const quality = chord.slice(root.length);
    
    // Normalize qualities to basic forms
    if (quality.match(/^m(?!aj)/)) {
      return root + 'm'; // Minor
    } else if (quality.includes('dim')) {
      return root + 'dim'; // Diminished
    } else if (quality.includes('aug')) {
      return root + 'aug'; // Augmented
    } else {
      return root; // Major (default)
    }
  } catch (error) {
    return chord;
  }
}

/**
 * Calculate how well a chord progression fits a given key
 */
function calculateKeyFitness(chords: string[], key: string, mode: 'major' | 'minor'): number {
  const diatonicPattern = mode === 'major' 
    ? MAJOR_DIATONIC_PATTERNS[key]
    : MINOR_DIATONIC_PATTERNS[key];
    
  if (!diatonicPattern) {
    return 0;
  }
  
  let totalWeight = 0;
  let diatonicWeight = 0;
  
  chords.forEach((chord, index) => {
    const normalizedChord = normalizeChordForAnalysis(chord);
    if (!normalizedChord) return;
    
    // Position weight (later chords have less influence)
    const positionWeight = 1.0 / Math.sqrt(index + 1);
    
    if (diatonicPattern.includes(normalizedChord)) {
      // Determine chord function for weighting
      const chordIndex = diatonicPattern.indexOf(normalizedChord);
      let functionWeight = CHORD_FUNCTION_WEIGHTS.secondary; // Default
      
      if (chordIndex === 0) {
        functionWeight = CHORD_FUNCTION_WEIGHTS.tonic;
      } else if (chordIndex === 4) {
        functionWeight = CHORD_FUNCTION_WEIGHTS.dominant;
      } else if (chordIndex === 3) {
        functionWeight = CHORD_FUNCTION_WEIGHTS.subdominant;
      } else if (normalizedChord.includes('dim')) {
        functionWeight = CHORD_FUNCTION_WEIGHTS.diminished;
      }
      
      diatonicWeight += functionWeight * positionWeight;
    } else {
      // Check for common borrowed chords or secondary dominants
      if (isLikelyBorrowedChord(normalizedChord, key, mode)) {
        diatonicWeight += CHORD_FUNCTION_WEIGHTS.borrowed * positionWeight;
      } else {
        diatonicWeight += CHORD_FUNCTION_WEIGHTS.chromatic * positionWeight;
      }
    }
    
    totalWeight += positionWeight;
  });
  
  return totalWeight > 0 ? diatonicWeight / totalWeight : 0;
}

/**
 * Check if a chord is likely a borrowed chord in the given key
 */
function isLikelyBorrowedChord(chord: string, key: string, mode: 'major' | 'minor'): boolean {
  if (mode === 'major') {
    // Common borrowed chords from parallel minor
    const parallelMinorKey = key + 'm';
    const parallelMinorPattern = MINOR_DIATONIC_PATTERNS[parallelMinorKey];
    
    if (parallelMinorPattern && parallelMinorPattern.includes(chord)) {
      return true;
    }
  }
  
  // Check for secondary dominants
  if (chord.includes('7') && !chord.includes('m')) {
    return true; // Likely a secondary dominant
  }
  
  return false;
}

/**
 * Detect the most likely key from a chord progression
 */
export function detectKey(chords: string[]): KeyDetectionResult {
  if (!chords || chords.length === 0) {
    return {
      key: 'C',
      confidence: 0,
      mode: 'major'
    };
  }
  
  // Filter out invalid chords
  const validChords = chords.filter(chord => chord && typeof chord === 'string');
  
  if (validChords.length === 0) {
    return {
      key: 'C',
      confidence: 0,
      mode: 'major'
    };
  }
  
  const keyResults: Array<{ key: string; mode: 'major' | 'minor'; fitness: number }> = [];
  
  // Test all major keys
  Object.keys(MAJOR_DIATONIC_PATTERNS).forEach(key => {
    const fitness = calculateKeyFitness(validChords, key, 'major');
    keyResults.push({ key, mode: 'major', fitness });
  });
  
  // Test all minor keys
  Object.keys(MINOR_DIATONIC_PATTERNS).forEach(key => {
    const fitness = calculateKeyFitness(validChords, key, 'minor');
    keyResults.push({ key, mode: 'minor', fitness });
  });
  
  // Sort by fitness score
  keyResults.sort((a, b) => b.fitness - a.fitness);
  
  const bestResult = keyResults[0];
  const secondBest = keyResults[1];
  
  // Calculate confidence based on separation from second-best result
  let confidence = bestResult.fitness;
  if (secondBest && bestResult.fitness > 0) {
    const separation = (bestResult.fitness - secondBest.fitness) / bestResult.fitness;
    confidence = Math.min(0.95, bestResult.fitness * (0.5 + separation * 0.5));
  }
  
  // Minimum confidence for very short progressions
  if (validChords.length < 3) {
    confidence *= 0.7;
  }
  
  // Get alternative keys with decent scores
  const alternatives = keyResults
    .slice(1, 4)
    .filter(result => result.fitness > bestResult.fitness * 0.3)
    .map(result => ({
      key: result.key,
      confidence: result.fitness
    }));
  
  // Analyze diatonic vs non-diatonic chords
  const diatonicPattern = bestResult.mode === 'major'
    ? MAJOR_DIATONIC_PATTERNS[bestResult.key]
    : MINOR_DIATONIC_PATTERNS[bestResult.key];
    
  const analysis = {
    diatonicChords: validChords.filter(chord => 
      diatonicPattern?.includes(normalizeChordForAnalysis(chord))
    ),
    nonDiatonicChords: validChords.filter(chord => 
      !diatonicPattern?.includes(normalizeChordForAnalysis(chord))
    ),
    keySignature: { sharps: [], flats: [] } // Would be populated from key signature data
  };
  
  return {
    key: bestResult.key,
    confidence: Math.max(0, Math.min(1, confidence)),
    mode: bestResult.mode,
    alternativeKeys: alternatives.length > 0 ? alternatives : undefined,
    analysis
  };
}

/**
 * Detect key changes within a chord progression
 */
export function detectKeyChanges(chords: string[], windowSize: number = 4): Array<{
  position: number;
  fromKey: string;
  toKey: string;
  confidence: number;
}> {
  if (!chords || chords.length < windowSize * 2) {
    return [];
  }
  
  const keyChanges: Array<{
    position: number;
    fromKey: string;
    toKey: string;
    confidence: number;
  }> = [];
  
  let currentKey = detectKey(chords.slice(0, windowSize)).key;
  
  for (let i = windowSize; i <= chords.length - windowSize; i++) {
    const window = chords.slice(i, i + windowSize);
    const detection = detectKey(window);
    
    if (detection.key !== currentKey && detection.confidence > 0.7) {
      keyChanges.push({
        position: i,
        fromKey: currentKey,
        toKey: detection.key,
        confidence: detection.confidence
      });
      currentKey = detection.key;
    }
  }
  
  return keyChanges;
}

/**
 * Get the relative minor/major of a given key
 */
export function getRelativeKey(key: string): string {
  if (key.endsWith('m')) {
    // Minor to major - up a minor third
    const majorKeyMappings: Record<string, string> = {
      'Am': 'C', 'Em': 'G', 'Bm': 'D', 'F#m': 'A', 'C#m': 'E', 'G#m': 'B',
      'D#m': 'F#', 'A#m': 'C#', 'Dm': 'F', 'Gm': 'Bb', 'Cm': 'Eb',
      'Fm': 'Ab', 'Bbm': 'Db', 'Ebm': 'Gb', 'Abm': 'Cb'
    };
    return majorKeyMappings[key] || 'C';
  } else {
    // Major to minor - down a minor third  
    const minorKeyMappings: Record<string, string> = {
      'C': 'Am', 'G': 'Em', 'D': 'Bm', 'A': 'F#m', 'E': 'C#m', 'B': 'G#m',
      'F#': 'D#m', 'C#': 'A#m', 'F': 'Dm', 'Bb': 'Gm', 'Eb': 'Cm',
      'Ab': 'Fm', 'Db': 'Bbm', 'Gb': 'Ebm', 'Cb': 'Abm'
    };
    return minorKeyMappings[key] || 'Am';
  }
}

/**
 * Analyze chord functions within a detected key
 */
export function analyzeChordFunctions(chords: string[], key: string, mode: 'major' | 'minor' = 'major'): Array<{
  chord: string;
  function: string;
  roman: string;
  isDiatonic: boolean;
}> {
  const diatonicPattern = mode === 'major' 
    ? MAJOR_DIATONIC_PATTERNS[key]
    : MINOR_DIATONIC_PATTERNS[key];
    
  if (!diatonicPattern) {
    return chords.map(chord => ({
      chord,
      function: 'unknown',
      roman: '?',
      isDiatonic: false
    }));
  }
  
  const romanNumerals = mode === 'major'
    ? ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
    : ['i', 'ii°', 'bIII', 'iv', 'v', 'bVI', 'bVII'];
    
  return chords.map(chord => {
    const normalizedChord = normalizeChordForAnalysis(chord);
    const index = diatonicPattern.indexOf(normalizedChord);
    
    if (index !== -1) {
      return {
        chord,
        function: getFunctionName(index, mode),
        roman: romanNumerals[index],
        isDiatonic: true
      };
    } else {
      return {
        chord,
        function: 'chromatic',
        roman: '?',
        isDiatonic: false
      };
    }
  });
}

/**
 * Get function name for a chord index
 */
function getFunctionName(index: number, mode: 'major' | 'minor'): string {
  if (mode === 'major') {
    const functions = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'leading_tone'];
    return functions[index] || 'unknown';
  } else {
    const functions = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'subtonic'];
    return functions[index] || 'unknown';
  }
}