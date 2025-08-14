# Enharmonic Implementation Research

## ChordSheetJS Enharmonic Methods

### Core API Methods

#### useModifier() - Recommended Method
```javascript
const chord = Chord.parse('Eb/Bb');

// Convert to sharp notation
const sharpChord = chord.useModifier('#');
sharpChord.toString(); // "D#/A#"

// Convert to flat notation  
const flatChord = chord.useModifier('b');
flatChord.toString(); // "Eb/Bb"
```

#### switchModifier() - Deprecated but functional
```javascript
const chord = parseChord('Eb/Bb');
const chord2 = chord.switchModifier();
chord2.toString(); // "D#/A#"
```

#### normalize() - Simplify extreme accidentals
```javascript
const chord = Chord.parse('E#/B#');
const normalizedChord = chord.normalize();
normalizedChord.toString(); // "F/C"

// Also handles Cb→B, Fb→E
```

## Music Theory Rules for Enharmonic Spelling

### Key Signature Context

#### Sharp Keys (Use sharps for chords)
- G major (1 sharp): F#
- D major (2 sharps): F#, C#
- A major (3 sharps): F#, C#, G#
- E major (4 sharps): F#, C#, G#, D#
- B major (5 sharps): F#, C#, G#, D#, A#
- F# major (6 sharps): F#, C#, G#, D#, A#, E#
- C# major (7 sharps): All notes sharp

#### Flat Keys (Use flats for chords)
- F major (1 flat): Bb
- Bb major (2 flats): Bb, Eb
- Eb major (3 flats): Bb, Eb, Ab
- Ab major (4 flats): Bb, Eb, Ab, Db
- Db major (5 flats): Bb, Eb, Ab, Db, Gb
- Gb major (6 flats): Bb, Eb, Ab, Db, Gb, Cb
- Cb major (7 flats): All notes flat

### Enharmonic Key Preferences

Based on simplicity (fewer accidentals):
```javascript
const ENHARMONIC_PREFERENCES = {
  'C#': 'Db',  // Db has 5 flats vs C# has 7 sharps
  'D#': 'Eb',  // Eb has 3 flats vs D# has 9 sharps (theoretical)
  'F#': 'F#',  // F# has 6 sharps vs Gb has 6 flats (equal)
  'G#': 'Ab',  // Ab has 4 flats vs G# has 8 sharps (theoretical)
  'A#': 'Bb'   // Bb has 2 flats vs A# has 10 sharps (theoretical)
};
```

### Harmonic Context Rules

1. **Dominant Chords**: Use the spelling that reflects the key
   - In C major: G7 with F natural (not E#)
   - In G minor: D7 with F# (not Gb)

2. **Leading Tones**: Should be spelled as raised 7th degree
   - In A minor: G# (not Ab) leads to A
   - In D minor: C# (not Db) leads to D

3. **Borrowed Chords**: Maintain the borrowed key's spelling
   - bVII in C major: Bb (not A#)
   - Neapolitan in C: Db (not C#)

## Implementation Pattern

### Service Layer Architecture
```typescript
interface EnharmonicService {
  // Core conversion
  convertChord(chord: string, targetModifier: '#' | 'b'): string;
  
  // Batch conversion
  convertAllChords(chords: string[], targetModifier: '#' | 'b'): string[];
  
  // Context-aware conversion
  convertWithContext(chord: string, keyContext: string): string;
  
  // Preference management
  setPreference(preference: 'sharp' | 'flat' | 'auto'): void;
  getPreference(): 'sharp' | 'flat' | 'auto';
  
  // Utility methods
  isEnharmonicKey(key: string): boolean;
  getEnharmonicEquivalent(key: string): string | null;
  suggestSpelling(chord: string, key: string): string;
}
```

### State Management Pattern
```typescript
interface EnharmonicState {
  preference: 'sharp' | 'flat' | 'auto';
  contextKey?: string;
  lastToggled?: Date;
  
  // Chord mapping cache
  chordMap: Map<string, string>;
  
  // Statistics
  stats: {
    toggleCount: number;
    preferredNotation: 'sharp' | 'flat';
  };
}
```

### UI Component Pattern
```typescript
interface EnharmonicToggleProps {
  // Current state
  currentKey?: string;
  preference: 'sharp' | 'flat' | 'auto';
  
  // Callbacks
  onToggle: () => void;
  onPreferenceChange: (pref: 'sharp' | 'flat' | 'auto') => void;
  
  // Display options
  variant?: 'button' | 'switch' | 'dropdown';
  showLabel?: boolean;
  disabled?: boolean;
}
```

## Advanced Features

### Line of Fifths Algorithm

For musically correct transposition (from example codebase):
```typescript
// Line of fifths for sharp keys
const SHARP_LINE = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'E#'];

// Line of fifths for flat keys
const FLAT_LINE = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb', 'Bbb', 'Ebb', 'Abb'];

function getPreferredEnharmonic(note: string, targetKey: string): string {
  // Determine if target key prefers sharps or flats
  const useFlats = FLAT_KEY_SIGNATURES.includes(targetKey);
  
  if (useFlats && note.includes('#')) {
    return convertToFlat(note);
  } else if (!useFlats && note.includes('b')) {
    return convertToSharp(note);
  }
  
  return note;
}
```

### Capo Position Calculation

```typescript
interface CapoOption {
  position: number;      // Fret position (0-11)
  playKey: string;       // Key to play in
  actualKey: string;     // Resulting key
  chordShape: string;    // Common chord shape used
  difficulty: 'easy' | 'medium' | 'hard';
}

function calculateCapoOptions(originalKey: string, targetKey: string): CapoOption[] {
  const semitones = getKeyDistance(originalKey, targetKey);
  const options: CapoOption[] = [];
  
  // Common guitar chord shapes
  const commonShapes = ['G', 'C', 'D', 'A', 'E'];
  
  for (const shape of commonShapes) {
    for (let capo = 0; capo <= 11; capo++) {
      const resultKey = transposeKey(shape, capo);
      if (resultKey === targetKey) {
        options.push({
          position: capo,
          playKey: shape,
          actualKey: resultKey,
          chordShape: shape,
          difficulty: getShapeDifficulty(shape)
        });
      }
    }
  }
  
  return options.sort((a, b) => a.position - b.position);
}
```

### Key Detection Algorithm

```typescript
function detectKeyFromChords(chords: string[]): { key: string; confidence: number } {
  // Count diatonic chords for each possible key
  const keyScores = new Map<string, number>();
  
  for (const possibleKey of ALL_KEYS) {
    const diatonicChords = getDiatonicChords(possibleKey);
    let score = 0;
    
    for (const chord of chords) {
      if (diatonicChords.includes(normalizeChord(chord))) {
        score++;
      }
    }
    
    keyScores.set(possibleKey, score / chords.length);
  }
  
  // Find best match
  const sorted = Array.from(keyScores.entries())
    .sort((a, b) => b[1] - a[1]);
  
  return {
    key: sorted[0][0],
    confidence: sorted[0][1]
  };
}
```

## Testing Scenarios

### Enharmonic Conversion Tests
```typescript
describe('Enharmonic Conversion', () => {
  const testCases = [
    { input: 'C#', sharp: 'C#', flat: 'Db' },
    { input: 'D#m7', sharp: 'D#m7', flat: 'Ebm7' },
    { input: 'F#/A#', sharp: 'F#/A#', flat: 'Gb/Bb' },
    { input: 'Bbsus4', sharp: 'A#sus4', flat: 'Bbsus4' },
    { input: 'Gb13', sharp: 'F#13', flat: 'Gb13' }
  ];
  
  testCases.forEach(({ input, sharp, flat }) => {
    it(`should convert ${input} correctly`, () => {
      expect(convertToSharp(input)).toBe(sharp);
      expect(convertToFlat(input)).toBe(flat);
    });
  });
});
```

### Context-Aware Tests
```typescript
describe('Context-Aware Enharmonic Spelling', () => {
  it('should use flats in F major', () => {
    const result = convertWithContext('A#', 'F');
    expect(result).toBe('Bb');
  });
  
  it('should use sharps in G major', () => {
    const result = convertWithContext('Gb', 'G');
    expect(result).toBe('F#');
  });
  
  it('should handle minor keys correctly', () => {
    const result = convertWithContext('Eb', 'Am');
    expect(result).toBe('D#'); // Leading tone in A minor
  });
});
```

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Cache converted chords
```typescript
const chordCache = new Map<string, string>();

function convertChordCached(chord: string, modifier: '#' | 'b'): string {
  const key = `${chord}-${modifier}`;
  if (chordCache.has(key)) {
    return chordCache.get(key)!;
  }
  
  const result = convertChord(chord, modifier);
  chordCache.set(key, result);
  return result;
}
```

2. **Batch Processing**: Convert all chords at once
```typescript
function batchConvert(chords: string[], modifier: '#' | 'b'): string[] {
  return chords.map(chord => convertChordCached(chord, modifier));
}
```

3. **Debouncing**: For rapid toggle operations
```typescript
const debouncedToggle = useMemo(
  () => debounce(handleEnharmonicToggle, 100),
  [handleEnharmonicToggle]
);
```

## UI/UX Best Practices

### Visual Feedback
- Highlight changed chords briefly after toggle
- Show tooltip with enharmonic equivalent on hover
- Use consistent sharp (♯) and flat (♭) symbols

### Accessibility
- Provide keyboard shortcuts (Alt+E for enharmonic toggle)
- Include ARIA labels describing current notation
- Announce changes to screen readers

### Mobile Considerations
- Larger touch targets for toggle switch
- Swipe gesture for quick toggle
- Persistent preference in localStorage

## References

1. **ChordSheetJS Documentation**: https://github.com/martijnversluis/ChordSheetJS
2. **Music Theory**: Tonal Harmony by Stefan Kostka
3. **Enharmonic Equivalents**: https://www.musictheoryacademy.com/understanding-music/enharmonic-equivalents/
4. **Line of Fifths**: https://en.wikipedia.org/wiki/Circle_of_fifths
5. **Capo Theory**: https://www.guitar-chord.org/transposition-chart-for-capo.html