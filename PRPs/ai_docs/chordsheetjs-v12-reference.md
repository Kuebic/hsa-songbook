# ChordSheetJS v12 API Reference

## Overview
ChordSheetJS v12.3.1 is a JavaScript library for parsing and formatting chords and chord sheets. This reference covers the complete API surface and implementation patterns.

## Installation
```bash
npm install chordsheetjs@^12.3.1
```

## Import Patterns
```javascript
// ES6 Modules
import ChordSheetJS from 'chordsheetjs';
import { ChordProParser, HtmlDivFormatter, Chord } from 'chordsheetjs';

// CommonJS
const ChordSheetJS = require('chordsheetjs').default;
```

## Parsers

### ChordProParser
Parses ChordPro format with directives in square brackets.

```javascript
const parser = new ChordSheetJS.ChordProParser();
const song = parser.parse(chordProText);
```

### ChordsOverWordsParser
Parses chord sheets with chords written above lyrics.

```javascript
const parser = new ChordSheetJS.ChordsOverWordsParser();
const song = parser.parse(chordSheet);
```

### UltimateGuitarParser
Parses Ultimate Guitar format chord sheets.

```javascript
const parser = new ChordSheetJS.UltimateGuitarParser();
const song = parser.parse(ugChordSheet);
```

## Formatters

### HtmlDivFormatter
Creates responsive HTML using DIV elements. Best for web display.

```javascript
const formatter = new ChordSheetJS.HtmlDivFormatter();
const html = formatter.format(song);

// With CSS generation
const css = ChordSheetJS.HtmlDivFormatter.cssString();
const scopedCss = ChordSheetJS.HtmlDivFormatter.cssString('.chord-viewer');
const cssObject = ChordSheetJS.HtmlDivFormatter.cssObject();
```

**Generated HTML Structure:**
```html
<div class="chord-sheet">
  <h1 class="title">Song Title</h1>
  <h2 class="subtitle">Artist Name</h2>
  <div class="paragraph verse">
    <div class="row">
      <div class="column">
        <div class="chord">C</div>
        <div class="lyrics">Hello</div>
      </div>
      <div class="column">
        <div class="chord">G</div>
        <div class="lyrics">world</div>
      </div>
    </div>
  </div>
</div>
```

### HtmlTableFormatter
Creates HTML using TABLE elements. Best for print/PDF.

```javascript
const formatter = new ChordSheetJS.HtmlTableFormatter();
const html = formatter.format(song);
```

**Generated HTML Structure:**
```html
<table class="chord-sheet">
  <tr>
    <td class="chord">C</td>
    <td class="chord">G</td>
  </tr>
  <tr>
    <td class="lyrics">Hello</td>
    <td class="lyrics">world</td>
  </tr>
</table>
```

### TextFormatter
Creates plain text output.

```javascript
const formatter = new ChordSheetJS.TextFormatter();
const text = formatter.format(song);
```

### ChordProFormatter
Formats back to ChordPro format.

```javascript
const formatter = new ChordSheetJS.ChordProFormatter();
const chordPro = formatter.format(song);
```

## Song Object

### Properties
```javascript
song.title          // String or null
song.subtitle       // String or null  
song.artist         // String or null
song.composer       // String or null
song.copyright      // String or null
song.album          // String or null
song.year           // String or null
song.key            // String or null
song.time           // String or null
song.tempo          // String or null
song.duration       // String or null
song.capo           // Number or null
song.metadata       // Object with all metadata
song.lines          // Array of Line objects
```

### Line Object Structure
```javascript
{
  type: 'line', // or 'chorus', 'verse', etc.
  items: [
    {
      type: 'chordLyricsPair',
      chords: 'C',
      lyrics: 'Hello '
    },
    {
      type: 'chordLyricsPair', 
      chords: 'G',
      lyrics: 'world'
    }
  ]
}
```

## Chord Manipulation

### Parsing Chords
```javascript
const chord = ChordSheetJS.Chord.parse('Ebsus4/Bb');
chord.root        // 'Eb'
chord.suffix      // 'sus4'
chord.bass        // 'Bb'
```

### Transposition
```javascript
// Transpose up by semitones
const transposed = chord.transpose(2);

// Manual transposition in v12.3.1 (song.transpose() is buggy)
song.lines.forEach(line => {
  if (line.items) {
    line.items.forEach(item => {
      if ('chords' in item && item.chords) {
        const chord = Chord.parse(item.chords);
        const transposedChord = chord.transpose(semitones);
        item.chords = transposedChord.toString();
      }
    });
  }
});
```

### Chord Normalization
```javascript
// Normalize flats/sharps
const normalized = chord.normalize();

// Use specific modifier (b or #)
const withFlats = chord.useModifier('b');
const withSharps = chord.useModifier('#');
```

### Enharmonic Equivalents
```javascript
// Convert between enharmonic equivalents
const chord = Chord.parse('C#');
const flat = chord.useModifier('b'); // Returns 'Db'
```

## Metadata Directives

### Supported ChordPro Directives
```
{title: Song Title} or {t: Song Title}
{subtitle: Artist Name} or {st: Artist Name}
{artist: Artist Name}
{composer: Composer Name}
{copyright: Copyright Info}
{album: Album Name}
{year: 2024}
{key: C}
{time: 4/4}
{tempo: 120}
{duration: 3:45}
{capo: 2}

{comment: This is a comment} or {c: This is a comment}
{start_of_verse} or {sov}
{end_of_verse} or {eov}
{start_of_chorus} or {soc}
{end_of_chorus} or {eoc}
{start_of_bridge} or {sob}
{end_of_bridge} or {eob}
```

## Serialization

### To JavaScript Object
```javascript
const serialized = song.serialize();
// Returns plain JS object that can be JSON.stringify'd
```

### From JavaScript Object
```javascript
const song = ChordSheetJS.Song.deserialize(serializedObject);
```

## CSS Classes Reference

### HtmlDivFormatter Classes
```css
.chord-sheet       /* Root container */
.title            /* Song title */
.subtitle         /* Artist/subtitle */
.paragraph        /* Section container */
.verse           /* Verse section */
.chorus          /* Chorus section */
.bridge          /* Bridge section */
.row             /* Line container */
.column          /* Chord/lyric pair container */
.chord           /* Chord text */
.lyrics          /* Lyrics text */
.comment         /* Comment text */
```

### HtmlTableFormatter Classes
```css
.chord-sheet      /* Table root */
.chord           /* Chord cell */
.lyrics          /* Lyrics cell */
```

## Known Issues in v12.3.1

1. **song.transpose() method doesn't work properly**
   - Must manually transpose each chord in the song object
   - See transposition example above for workaround

2. **Section markers treated as chords**
   - Labels like "Verse", "Chorus" may be parsed as chords
   - Filter these out when transposing

3. **Empty chord slots**
   - Empty chords may need special handling for alignment
   - Use CSS to hide or style appropriately

## Performance Considerations

1. **Parsing is CPU-intensive**
   - Cache parsed Song objects
   - Parse in web workers for large documents

2. **HTML generation**
   - Cache formatted HTML output
   - Use requestAnimationFrame for large renders

3. **Memory usage**
   - Song objects can be large for complex songs
   - Implement LRU cache with size limits

## Integration Examples

### React Component
```javascript
import { useMemo } from 'react';
import * as ChordSheetJS from 'chordsheetjs';

function ChordViewer({ chordProText, transpose = 0 }) {
  const html = useMemo(() => {
    const parser = new ChordSheetJS.ChordProParser();
    const song = parser.parse(chordProText);
    
    // Manual transposition
    if (transpose !== 0) {
      song.lines.forEach(line => {
        // ... transpose logic
      });
    }
    
    const formatter = new ChordSheetJS.HtmlDivFormatter();
    return formatter.format(song);
  }, [chordProText, transpose]);
  
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

### TypeScript Types
```typescript
import ChordSheetJS from 'chordsheetjs';

type Song = ChordSheetJS.Song;
type Chord = ChordSheetJS.Chord;
type Line = ChordSheetJS.Line;
type ChordLyricsPair = ChordSheetJS.ChordLyricsPair;
```

## Best Practices

1. **Use HtmlDivFormatter for web display**
   - Better responsive behavior
   - More flexible styling options

2. **Use HtmlTableFormatter for print**
   - Better alignment in PDFs
   - More predictable layout

3. **Cache at multiple levels**
   - Parsed songs (most expensive)
   - Formatted HTML
   - Styled output

4. **Handle errors gracefully**
   - Wrap parsing in try/catch
   - Provide fallback for invalid input

5. **Optimize for mobile**
   - Use viewport-aware font sizing
   - Implement touch gestures for transposition
   - Consider horizontal scrolling for wide songs

## Migration from Earlier Versions

### From v11.x to v12.x
- Import syntax changed (now uses default export)
- Some method signatures changed
- song.transpose() regression - use manual workaround

### Breaking Changes
- Module import pattern
- CSS generation methods moved to static methods
- Some metadata fields renamed

## Resources

- GitHub: https://github.com/martijnversluis/ChordSheetJS
- NPM: https://www.npmjs.com/package/chordsheetjs
- ChordPro Standard: https://www.chordpro.org/
- Examples: https://martijnversluis.github.io/ChordFiddle/