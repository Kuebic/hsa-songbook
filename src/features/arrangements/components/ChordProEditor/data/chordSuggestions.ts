/**
 * Chord suggestions for autocomplete organized by key and type
 */

import type { AutocompleteItem } from './chordProDirectives';

/**
 * Common chord progressions by key
 */
export const CHORD_PROGRESSIONS: Record<string, string[]> = {
  // Major keys
  'C': ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
  'G': ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
  'D': ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
  'A': ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
  'E': ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
  'B': ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim'],
  'F': ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
  'Bb': ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim'],
  'Eb': ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim'],
  'Ab': ['Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'Fm', 'Gdim'],
  'Db': ['Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm', 'Cdim'],
  'Gb': ['Gb', 'Abm', 'Bbm', 'Cb', 'Db', 'Ebm', 'Fdim'],
  
  // Minor keys
  'Am': ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'],
  'Em': ['Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D'],
  'Bm': ['Bm', 'C#dim', 'D', 'Em', 'F#m', 'G', 'A'],
  'F#m': ['F#m', 'G#dim', 'A', 'Bm', 'C#m', 'D', 'E'],
  'C#m': ['C#m', 'D#dim', 'E', 'F#m', 'G#m', 'A', 'B'],
  'G#m': ['G#m', 'A#dim', 'B', 'C#m', 'D#m', 'E', 'F#'],
  'Dm': ['Dm', 'Edim', 'F', 'Gm', 'Am', 'Bb', 'C'],
  'Gm': ['Gm', 'Adim', 'Bb', 'Cm', 'Dm', 'Eb', 'F'],
  'Cm': ['Cm', 'Ddim', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb'],
  'Fm': ['Fm', 'Gdim', 'Ab', 'Bbm', 'Cm', 'Db', 'Eb'],
  'Bbm': ['Bbm', 'Cdim', 'Db', 'Ebm', 'Fm', 'Gb', 'Ab'],
  'Ebm': ['Ebm', 'Fdim', 'Gb', 'Abm', 'Bbm', 'Cb', 'Db'],
};

/**
 * Most common chords overall
 */
export const COMMON_CHORDS = [
  'C', 'G', 'Am', 'F', 'D', 'Em', 'A', 'E', 'Dm', 'Bm',
  'B', 'Cm', 'Gm', 'Bb', 'Eb', 'Ab', 'Fm', 'C#m', 'F#m', 'G#m'
];

/**
 * Chord variations and extensions
 */
export const CHORD_VARIATIONS = {
  major: ['', 'maj7', 'maj9', '6', '6/9', 'add9', 'sus2', 'sus4'],
  minor: ['m', 'm7', 'm9', 'm6', 'm11', 'madd9'],
  dominant: ['7', '9', '11', '13', '7sus4', '7b5', '7#5'],
  diminished: ['dim', 'dim7', 'm7b5', 'ø7'],
  augmented: ['aug', '+', '+7', 'aug7'],
};

/**
 * Bass note variations (slash chords)
 */
export const BASS_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Get chord suggestions based on the current key
 */
export const getChordSuggestions = (key?: string): string[] => {
  if (key && CHORD_PROGRESSIONS[key]) {
    return CHORD_PROGRESSIONS[key];
  }
  return COMMON_CHORDS;
};

/**
 * Get chord suggestions with variations
 */
export const getChordVariations = (baseChord: string): string[] => {
  const variations: string[] = [baseChord];
  
  // Determine if major or minor
  const isMinor = baseChord.includes('m') && !baseChord.includes('maj');
  const chordType = isMinor ? 'minor' : 'major';
  
  // Add variations
  CHORD_VARIATIONS[chordType].forEach(variation => {
    if (variation && variation !== 'm') {
      variations.push(baseChord.replace(/m?$/, '') + variation);
    }
  });
  
  // Add dominant variations
  CHORD_VARIATIONS.dominant.forEach(variation => {
    variations.push(baseChord.replace(/m?$/, '') + variation);
  });
  
  return variations;
};

/**
 * Convert chord strings to AutocompleteItem format
 */
export const chordsToAutocompleteItems = (chords: string[]): AutocompleteItem[] => {
  return chords.map(chord => ({
    value: chord,
    label: chord,
    description: getChordDescription(chord),
    category: 'chord',
    icon: '🎵',
  }));
};

/**
 * Get a description for a chord
 */
function getChordDescription(chord: string): string {
  if (chord.includes('maj7')) return 'Major 7th';
  if (chord.includes('m7')) return 'Minor 7th';
  if (chord.includes('7')) return 'Dominant 7th';
  if (chord.includes('dim')) return 'Diminished';
  if (chord.includes('aug') || chord.includes('+')) return 'Augmented';
  if (chord.includes('sus2')) return 'Suspended 2nd';
  if (chord.includes('sus4')) return 'Suspended 4th';
  if (chord.includes('add9')) return 'Added 9th';
  if (chord.includes('m')) return 'Minor';
  if (chord.includes('/')) return 'Slash chord';
  return 'Major';
}

/**
 * Parse a song's content to extract used chords
 */
export const extractChordsFromContent = (content: string): string[] => {
  const chordRegex = /\[([^\]]+)\]/g;
  const chords = new Set<string>();
  let match;
  
  while ((match = chordRegex.exec(content)) !== null) {
    const chord = match[1].trim();
    if (isValidChord(chord)) {
      chords.add(chord);
    }
  }
  
  return Array.from(chords).sort();
};

/**
 * Validate if a string is a valid chord
 */
export function isValidChord(chord: string): boolean {
  // Remove whitespace
  chord = chord.trim();
  
  // Empty chord is not valid
  if (!chord) return false;
  
  // Basic chord pattern: Root note + optional accidentals + optional chord quality
  const chordPattern = /^[A-G][#b]?(?:maj|min|m|M|dim|aug|sus|add)?(?:\d+)?(?:[#b]\d+)?(?:\/[A-G][#b]?)?$/;
  
  return chordPattern.test(chord);
}

/**
 * Get recently used chords from the current document
 */
export const getRecentChords = (content: string, limit = 10): string[] => {
  const chords = extractChordsFromContent(content);
  // Return most recent unique chords
  return chords.slice(-limit).reverse();
};

/**
 * Smart chord suggestions based on context
 */
export const getSmartChordSuggestions = (
  content: string,
  key?: string,
  previousChord?: string
): AutocompleteItem[] => {
  const suggestions: string[] = [];
  
  // 1. Add chords from the current key
  if (key) {
    suggestions.push(...(CHORD_PROGRESSIONS[key] || []));
  }
  
  // 2. Add recently used chords from the document
  const recentChords = getRecentChords(content, 5);
  suggestions.push(...recentChords);
  
  // 3. Add common chord progressions based on previous chord
  if (previousChord) {
    const nextChordSuggestions = getNextChordSuggestions(previousChord);
    suggestions.push(...nextChordSuggestions);
  }
  
  // 4. Add common chords if not enough suggestions
  if (suggestions.length < 10) {
    suggestions.push(...COMMON_CHORDS);
  }
  
  // Remove duplicates and limit
  const uniqueSuggestions = Array.from(new Set(suggestions)).slice(0, 20);
  
  return chordsToAutocompleteItems(uniqueSuggestions);
};

/**
 * Get likely next chords based on common progressions
 */
function getNextChordSuggestions(previousChord: string): string[] {
  // Common chord progressions
  const progressions: Record<string, string[]> = {
    'C': ['F', 'G', 'Am', 'Dm'],
    'G': ['C', 'D', 'Em', 'Am'],
    'D': ['G', 'A', 'Bm', 'Em'],
    'A': ['D', 'E', 'F#m', 'Bm'],
    'E': ['A', 'B', 'C#m', 'F#m'],
    'F': ['C', 'Bb', 'Dm', 'Gm'],
    'Am': ['F', 'G', 'C', 'Dm'],
    'Em': ['C', 'D', 'G', 'Am'],
    'Dm': ['G', 'C', 'F', 'Am'],
  };
  
  // Remove any chord extensions to find base chord
  const baseChord = previousChord.replace(/[0-9]/g, '').replace(/maj|min|dim|aug|sus|add/g, '');
  
  return progressions[baseChord] || [];
}