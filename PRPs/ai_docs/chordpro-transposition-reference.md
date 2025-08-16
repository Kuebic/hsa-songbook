# ChordPro Transposition Reference Guide

## ChordSheetJS v12.3.1 - Key Documentation

### Installation
```bash
npm install chordsheetjs@12.3.1
```

### Core Classes

#### Chord Class
The main class for chord parsing and transposition.

```javascript
import { Chord } from 'chordsheetjs';

// Parse a chord
const chord = Chord.parse('Am7');

// Transpose methods
chord.transposeUp();        // Up 1 semitone
chord.transposeDown();      // Down 1 semitone  
chord.transpose(n);         // Up/down n semitones

// Convert to string
chord.toString();           // Returns transposed chord string
```

#### Song Class Transposition Workaround
⚠️ **Important**: ChordSheetJS v12.3.1 has a bug where `song.transpose()` doesn't work properly. Use manual transposition:

```javascript
// Manual transposition pattern
song.lines.forEach((line) => {
  line.items.forEach((item) => {
    if ('chords' in item && item.chords && typeof item.chords === 'string') {
      const chord = Chord.parse(item.chords);
      const transposedChord = chord.transpose(semitones);
      item.chords = transposedChord.toString();
    }
  });
});
```

### Parser Classes

```javascript
import { ChordProParser, ChordsOverWordsParser } from 'chordsheetjs';

// ChordPro format (with directives)
const parser = new ChordProParser();
const song = parser.parse('{title: Amazing Grace}\n[G]Amazing [C]grace');

// Simple chord-over-lyrics format
const simpleParser = new ChordsOverWordsParser();
const simpleSong = simpleParser.parse('G        C\nAmazing grace');
```

### Formatter Classes

```javascript
import { ChordProFormatter, HtmlDivFormatter, TextFormatter } from 'chordsheetjs';

// Format back to ChordPro
const chordProFormatter = new ChordProFormatter();
const chordProOutput = chordProFormatter.format(song);

// Format to HTML with flexbox layout
const htmlFormatter = new HtmlDivFormatter();
const htmlOutput = htmlFormatter.format(song);

// Format to plain text
const textFormatter = new TextFormatter();
const textOutput = textFormatter.format(song);
```

## Enharmonic Handling

### Sharp/Flat Preference Patterns

```javascript
// Key signature awareness
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
const SHARP_KEYS = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];

// Enharmonic pairs
const ENHARMONIC_PAIRS = {
  'C#': 'Db', 'Db': 'C#',
  'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#',
  'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#'
};

// Convert based on key context
function getPreferredEnharmonic(chord, keyContext) {
  const isFlat = FLAT_KEYS.includes(keyContext);
  const isSharp = SHARP_KEYS.includes(keyContext);
  
  if (isFlat && chord.includes('#')) {
    return ENHARMONIC_PAIRS[chord] || chord;
  }
  if (isSharp && chord.includes('b')) {
    return ENHARMONIC_PAIRS[chord] || chord;
  }
  return chord;
}
```

## Semitone Calculations

### Key-to-Key Transposition

```javascript
const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getSemitonesInterval(fromKey, toKey) {
  const fromIndex = CHROMATIC_SCALE.indexOf(normalizeKey(fromKey));
  const toIndex = CHROMATIC_SCALE.indexOf(normalizeKey(toKey));
  
  let interval = toIndex - fromIndex;
  if (interval < -6) interval += 12;
  if (interval > 6) interval -= 12;
  
  return interval;
}

// Normalize enharmonic equivalents
function normalizeKey(key) {
  const isMinor = key.endsWith('m');
  const baseKey = isMinor ? key.slice(0, -1) : key;
  
  // Convert flats to sharps for indexing
  const normalized = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  }[baseKey] || baseKey;
  
  return isMinor ? `${normalized}m` : normalized;
}
```

## React Hook Pattern

```javascript
import { useState, useCallback, useMemo } from 'react';
import { Chord } from 'chordsheetjs';

export function useTransposition(originalKey, options = {}) {
  const [semitones, setSemitones] = useState(0);
  
  const currentKey = useMemo(() => {
    if (!originalKey) return undefined;
    return transposeKey(originalKey, semitones);
  }, [originalKey, semitones]);
  
  const transposeUp = useCallback(() => {
    setSemitones(prev => Math.min(prev + 1, 12));
  }, []);
  
  const transposeDown = useCallback(() => {
    setSemitones(prev => Math.max(prev - 1, -12));
  }, []);
  
  const transposeToKey = useCallback((targetKey) => {
    if (!originalKey) return;
    const interval = getSemitonesInterval(originalKey, targetKey);
    setSemitones(interval);
  }, [originalKey]);
  
  const reset = useCallback(() => {
    setSemitones(0);
  }, []);
  
  // Persist to localStorage if enabled
  useEffect(() => {
    if (options.persist && options.storageKey) {
      localStorage.setItem(options.storageKey, semitones.toString());
    }
  }, [semitones, options.persist, options.storageKey]);
  
  return {
    semitones,
    currentKey,
    originalKey,
    isTransposed: semitones !== 0,
    canTransposeUp: semitones < 12,
    canTransposeDown: semitones > -12,
    transposeUp,
    transposeDown,
    transposeToKey,
    reset
  };
}
```

## Performance Optimization Patterns

### Memoization
```javascript
const transposedContent = useMemo(() => {
  if (semitones === 0) return originalContent;
  
  const parser = new ChordProParser();
  const song = parser.parse(originalContent);
  
  // Manual transposition
  song.lines.forEach(line => {
    line.items.forEach(item => {
      if (item.chords) {
        const chord = Chord.parse(item.chords);
        item.chords = chord.transpose(semitones).toString();
      }
    });
  });
  
  const formatter = new ChordProFormatter();
  return formatter.format(song);
}, [originalContent, semitones]);
```

### Caching Strategy
```javascript
const transpositionCache = new Map();

function getCachedTransposition(content, semitones) {
  const cacheKey = `${content.substring(0, 100)}_${semitones}`;
  
  if (transpositionCache.has(cacheKey)) {
    return transpositionCache.get(cacheKey);
  }
  
  const transposed = performTransposition(content, semitones);
  transpositionCache.set(cacheKey, transposed);
  
  // Limit cache size
  if (transpositionCache.size > 50) {
    const firstKey = transpositionCache.keys().next().value;
    transpositionCache.delete(firstKey);
  }
  
  return transposed;
}
```

## Common Gotchas

1. **Song.transpose() Bug**: Always use manual transposition in v12.3.1
2. **Enharmonic Confusion**: Bb and A# are the same note but different in context
3. **Key Detection**: ChordPro `{key:}` directive may not always be present
4. **Complex Chords**: Slash chords need both parts transposed
5. **Performance**: Parse once, transpose individual chords, format once

## Reference Links

- [ChordSheetJS GitHub](https://github.com/martijnversluis/ChordSheetJS)
- [ChordSheetJS NPM](https://www.npmjs.com/package/chordsheetjs)
- [ChordJS (underlying chord library)](https://github.com/martijnversluis/ChordJS)
- [ChordFiddle (online playground)](https://chordfiddle.com/)

## Version Compatibility

This guide is specific to ChordSheetJS v12.3.1. Check for updates as the transpose bug may be fixed in future versions.