/**
 * @file lineOfFifths.ts
 * @description Line of Fifths algorithm for music-theory correct transposition
 * Maintains proper enharmonic spelling based on key context
 */

/**
 * Line of Fifths sequence - extends infinitely in both directions
 * Each position represents a fifth relationship
 * Positive numbers = sharp direction, Negative = flat direction
 */
const LINE_OF_FIFTHS: string[] = [
  // Far flat side (rarely used in practice)
  'Fbb', 'Cbb', 'Gbb', 'Dbb', 'Abb', 'Ebb', 'Bbb',
  // Common flat notes
  'Fb', 'Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F',
  // Natural note
  'C',
  // Common sharp notes  
  'G', 'D', 'A', 'E', 'B', 'F#', 'C#',
  // More sharps
  'G#', 'D#', 'A#', 'E#', 'B#',
  // Far sharp side (rarely used in practice)
  'F##', 'C##', 'G##', 'D##', 'A##', 'E##', 'B##'
];

/**
 * Map note names to their position on the Line of Fifths
 * C is at position 0, sharps are positive, flats are negative
 */
const NOTE_POSITIONS: Map<string, number> = new Map();

// Populate the position map
LINE_OF_FIFTHS.forEach((note, index) => {
  const position = index - LINE_OF_FIFTHS.indexOf('C');
  NOTE_POSITIONS.set(note, position);
});

/**
 * Enharmonic equivalent groups for user choice
 */
export const ENHARMONIC_KEYS: Array<{ sharp: string; flat: string }> = [
  { sharp: 'C#', flat: 'Db' },
  { sharp: 'D#', flat: 'Eb' },
  { sharp: 'F#', flat: 'Gb' },
  { sharp: 'G#', flat: 'Ab' },
  { sharp: 'A#', flat: 'Bb' },
];

/**
 * Extended enharmonic equivalents including double accidentals
 * Used for avoiding complex spellings when simpler alternatives exist
 */
export const EXTENDED_ENHARMONICS: Array<{ complex: string; simple: string; reason: string }> = [
  // Double sharps to natural notes
  { complex: 'Fx', simple: 'G', reason: 'Avoid double sharp' },
  { complex: 'Cx', simple: 'D', reason: 'Avoid double sharp' },
  { complex: 'Gx', simple: 'A', reason: 'Avoid double sharp' },
  { complex: 'Dx', simple: 'E', reason: 'Avoid double sharp' },
  { complex: 'Ax', simple: 'B', reason: 'Avoid double sharp' },
  { complex: 'Ex', simple: 'F#', reason: 'Avoid double sharp' },
  { complex: 'Bx', simple: 'C#', reason: 'Avoid double sharp' },
  
  // Double flats to natural notes
  { complex: 'Bbb', simple: 'A', reason: 'Avoid double flat' },
  { complex: 'Ebb', simple: 'D', reason: 'Avoid double flat' },
  { complex: 'Abb', simple: 'G', reason: 'Avoid double flat' },
  { complex: 'Dbb', simple: 'C', reason: 'Avoid double flat' },
  { complex: 'Gbb', simple: 'F', reason: 'Avoid double flat' },
  { complex: 'Cbb', simple: 'Bb', reason: 'Avoid double flat' },
  { complex: 'Fbb', simple: 'Eb', reason: 'Avoid double flat' },
];

/**
 * Major key signatures - number of sharps/flats for each key
 */
export const KEY_SIGNATURES: Record<string, { sharps: string[]; flats: string[] }> = {
  // Natural key
  'C': { sharps: [], flats: [] },
  
  // Sharp keys
  'G': { sharps: ['F#'], flats: [] },
  'D': { sharps: ['F#', 'C#'], flats: [] },
  'A': { sharps: ['F#', 'C#', 'G#'], flats: [] },
  'E': { sharps: ['F#', 'C#', 'G#', 'D#'], flats: [] },
  'B': { sharps: ['F#', 'C#', 'G#', 'D#', 'A#'], flats: [] },
  'F#': { sharps: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'], flats: [] },
  'C#': { sharps: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'], flats: [] },
  
  // Flat keys
  'F': { sharps: [], flats: ['Bb'] },
  'Bb': { sharps: [], flats: ['Bb', 'Eb'] },
  'Eb': { sharps: [], flats: ['Bb', 'Eb', 'Ab'] },
  'Ab': { sharps: [], flats: ['Bb', 'Eb', 'Ab', 'Db'] },
  'Db': { sharps: [], flats: ['Bb', 'Eb', 'Ab', 'Db', 'Gb'] },
  'Gb': { sharps: [], flats: ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'] },
  'Cb': { sharps: [], flats: ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'] },
};

/**
 * Get the position of a note on the Line of Fifths
 */
export function getNotePosition(note: string): number {
  if (!note || typeof note !== 'string') {
    throw new Error(`Invalid note: ${note}`);
  }

  const cleanNote = note.trim();
  const position = NOTE_POSITIONS.get(cleanNote);
  
  if (position === undefined) {
    throw new Error(`Note not found in Line of Fifths: ${cleanNote}`);
  }
  
  return position;
}

/**
 * Get the note at a specific position on the Line of Fifths
 */
export function getNoteAtPosition(position: number): string {
  if (!Number.isInteger(position)) {
    throw new Error(`Position must be an integer: ${position}`);
  }

  const centerIndex = LINE_OF_FIFTHS.indexOf('C');
  const targetIndex = centerIndex + position;
  
  if (targetIndex < 0 || targetIndex >= LINE_OF_FIFTHS.length) {
    throw new Error(`Position ${position} is out of range`);
  }
  
  return LINE_OF_FIFTHS[targetIndex];
}

/**
 * Calculate the distance between two keys on the Line of Fifths
 */
export function getTranspositionDistance(fromKey: string, toKey: string): number {
  try {
    const fromPosition = getNotePosition(fromKey);
    const toPosition = getNotePosition(toKey);
    return toPosition - fromPosition;
  } catch (error) {
    throw new Error(`Cannot calculate distance from ${fromKey} to ${toKey}: ${error}`);
  }
}

/**
 * Transpose a note by a given distance on the Line of Fifths
 */
export function transposeNote(note: string, distance: number): string {
  try {
    const currentPosition = getNotePosition(note);
    const newPosition = currentPosition + distance;
    const transposedNote = getNoteAtPosition(newPosition);
    
    // Simplify double accidentals if possible
    return simplifyDoubleAccidentals(transposedNote);
  } catch (error) {
    throw new Error(`Cannot transpose ${note} by ${distance}: ${error}`);
  }
}

/**
 * Extract the root note from a chord symbol
 */
export function extractChordRoot(chordSymbol: string): string {
  if (!chordSymbol || typeof chordSymbol !== 'string') {
    throw new Error(`Invalid chord symbol: ${chordSymbol}`);
  }

  // Match note name with optional accidentals (including double sharps/flats)
  // Support both 'x' and '##' for double sharps, 'bb' for double flats
  const rootMatch = chordSymbol.match(/^([A-G](?:x|##|bb|[#b]*))/);
  
  if (!rootMatch) {
    throw new Error(`Cannot extract root from chord: ${chordSymbol}`);
  }
  
  return rootMatch[1];
}

/**
 * Extract the chord quality (everything after the root)
 */
export function extractChordQuality(chordSymbol: string): string {
  if (!chordSymbol || typeof chordSymbol !== 'string') {
    return '';
  }

  // Use the same pattern as extractChordRoot to ensure consistency
  const rootMatch = chordSymbol.match(/^[A-G](?:x|##|bb|[#b]*)/);
  if (!rootMatch) {
    return '';
  }
  
  return chordSymbol.slice(rootMatch[0].length);
}

/**
 * Transpose a chord using Line of Fifths algorithm
 */
export function transposeChord(chordSymbol: string, distance: number): string {
  try {
    const root = extractChordRoot(chordSymbol);
    const quality = extractChordQuality(chordSymbol);
    
    const newRoot = transposeNote(root, distance);
    
    return newRoot + quality;
  } catch (error) {
    console.warn(`Failed to transpose chord ${chordSymbol}:`, error);
    return chordSymbol; // Return original on error
  }
}

/**
 * Transpose a chord with context-aware enharmonic spelling
 */
export function transposeChordWithContext(chordSymbol: string, distance: number, targetKey: string): string {
  try {
    const root = extractChordRoot(chordSymbol);
    const quality = extractChordQuality(chordSymbol);
    
    // First check if the original root can be simplified (even with distance 0)
    const simplifiedOriginal = simplifyDoubleAccidentals(root);
    
    // Transpose using Line of Fifths (will be simplified if distance > 0)
    const transposedRoot = distance === 0 ? simplifiedOriginal : transposeNote(root, distance);
    
    // Then apply context-aware enharmonic spelling
    const preferredRoot = getPreferredEnharmonic(transposedRoot, targetKey);
    
    return preferredRoot + quality;
  } catch (error) {
    console.warn(`Failed to transpose chord ${chordSymbol} with context:`, error);
    return chordSymbol; // Return original on error
  }
}

/**
 * Transpose a slash chord (chord with bass note)
 */
export function transposeSlashChord(chordSymbol: string, distance: number): string {
  if (!chordSymbol.includes('/')) {
    return transposeChord(chordSymbol, distance);
  }

  try {
    const [mainChord, bassNote] = chordSymbol.split('/');
    const transposedMain = transposeChord(mainChord.trim(), distance);
    const transposedBass = transposeNote(bassNote.trim(), distance);
    
    return `${transposedMain}/${transposedBass}`;
  } catch (error) {
    console.warn(`Failed to transpose slash chord ${chordSymbol}:`, error);
    return chordSymbol;
  }
}

/**
 * Transpose a slash chord with context-aware enharmonic spelling
 */
export function transposeSlashChordWithContext(chordSymbol: string, distance: number, targetKey: string): string {
  if (!chordSymbol.includes('/')) {
    return transposeChordWithContext(chordSymbol, distance, targetKey);
  }

  try {
    const [mainChord, bassNote] = chordSymbol.split('/');
    const transposedMain = transposeChordWithContext(mainChord.trim(), distance, targetKey);
    
    // Transpose bass note and apply context-aware enharmonic spelling
    const transposedBassRoot = transposeNote(bassNote.trim(), distance);
    const preferredBass = getPreferredEnharmonic(transposedBassRoot, targetKey);
    
    return `${transposedMain}/${preferredBass}`;
  } catch (error) {
    console.warn(`Failed to transpose slash chord ${chordSymbol} with context:`, error);
    return chordSymbol;
  }
}

/**
 * Determine if a key uses sharp or flat accidentals
 */
export function keyUsesSharpAccidentals(key: string): boolean {
  const keySignature = KEY_SIGNATURES[key];
  if (!keySignature) {
    // Unknown key, make best guess based on key name
    return key.includes('#') || !key.includes('b');
  }
  
  return keySignature.sharps.length > 0;
}

/**
 * Get the preferred enharmonic spelling for a key context
 */
export function getPreferredEnharmonic(note: string, targetKey: string): string {
  // First, check for double accidental simplifications
  const simplifiedNote = simplifyDoubleAccidentals(note);
  if (simplifiedNote !== note) {
    return simplifiedNote;
  }
  
  const isSharpKey = keyUsesSharpAccidentals(targetKey);
  
  // Check if note has an enharmonic equivalent
  const enharmonic = ENHARMONIC_KEYS.find(pair => 
    pair.sharp === note || pair.flat === note
  );
  
  if (!enharmonic) {
    return note; // No enharmonic equivalent
  }
  
  // Return preferred spelling based on key context
  return isSharpKey ? enharmonic.sharp : enharmonic.flat;
}

/**
 * Simplify double accidentals to simpler enharmonic equivalents
 */
export function simplifyDoubleAccidentals(note: string): string {
  if (!note || typeof note !== 'string') {
    return note;
  }
  
  // Check if this note can be simplified
  const simplification = EXTENDED_ENHARMONICS.find(equiv => equiv.complex === note);
  
  if (simplification) {
    return simplification.simple;
  }
  
  return note; // No simplification needed
}

/**
 * Check if a note contains double accidentals
 */
export function hasDoubleAccidentals(note: string): boolean {
  if (!note || typeof note !== 'string') {
    return false;
  }
  
  // Check for double sharps (x or ##) or double flats (bb)
  return note.includes('x') || note.includes('##') || note.includes('bb');
}

/**
 * Get all enharmonic equivalents for a given key
 */
export function getEnharmonicKeys(key: string): string[] {
  const enharmonic = ENHARMONIC_KEYS.find(pair => 
    pair.sharp === key || pair.flat === key
  );
  
  if (!enharmonic) {
    return [key]; // No enharmonic equivalent
  }
  
  return [enharmonic.sharp, enharmonic.flat];
}

/**
 * Check if two keys are enharmonic equivalents
 */
export function areEnharmonicEquivalents(key1: string, key2: string): boolean {
  if (key1 === key2) return true;
  
  const equivalents = getEnharmonicKeys(key1);
  return equivalents.includes(key2);
}

/**
 * Validate that a note exists in the Line of Fifths
 */
export function isValidNote(note: string): boolean {
  if (!note || typeof note !== 'string') {
    return false;
  }
  
  return NOTE_POSITIONS.has(note.trim());
}

/**
 * Get the key signature information for a given key
 */
export function getKeySignature(key: string): { sharps: string[]; flats: string[]; accidentalCount: number } {
  const signature = KEY_SIGNATURES[key];
  
  if (!signature) {
    return { sharps: [], flats: [], accidentalCount: 0 };
  }
  
  return {
    ...signature,
    accidentalCount: signature.sharps.length + signature.flats.length
  };
}

/**
 * Transpose an entire chord progression with context-aware enharmonic spelling
 */
export function transposeProgression(
  chords: string[], 
  fromKey: string, 
  toKey: string
): string[] {
  try {
    const distance = getTranspositionDistance(fromKey, toKey);
    
    return chords.map(chord => {
      if (!chord || typeof chord !== 'string') {
        return chord;
      }
      
      return chord.includes('/') 
        ? transposeSlashChordWithContext(chord, distance, toKey)
        : transposeChordWithContext(chord, distance, toKey);
    });
  } catch (error) {
    console.warn(`Failed to transpose progression from ${fromKey} to ${toKey}:`, error);
    return chords; // Return original on error
  }
}