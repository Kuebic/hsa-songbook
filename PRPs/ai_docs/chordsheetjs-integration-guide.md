# ChordSheetJS Integration Guide

## Overview
ChordSheetJS is a JavaScript library for parsing and formatting chord sheets. Version 12.3.0 is actively maintained.

## Installation
```bash
npm install chordsheetjs
```

## Key Concepts

### Parsers
- **ChordProParser**: Parses ChordPro format (used in our backend)
- **ChordsOverWordsParser**: Parses regular chord sheets  
- **UltimateGuitarParser**: Parses Ultimate Guitar format

### Formatters
- **HtmlDivFormatter**: Best for responsive web/mobile (RECOMMENDED)
- **HtmlTableFormatter**: Fixed layouts, PDF generation
- **TextFormatter**: Plain text output for minimal UI
- **ChordProFormatter**: Convert back to ChordPro

## React Integration Pattern

```typescript
import { ChordProParser, HtmlDivFormatter, Song } from 'chordsheetjs';
import { useMemo } from 'react';

interface ChordViewerProps {
  chordProText: string;
  transposition?: number;
}

export function ChordViewer({ chordProText, transposition = 0 }: ChordViewerProps) {
  const { html, song } = useMemo(() => {
    const parser = new ChordProParser();
    const parsedSong = parser.parse(chordProText);
    
    // Apply transposition if needed
    if (transposition !== 0) {
      parsedSong.transpose(transposition);
    }
    
    const formatter = new HtmlDivFormatter();
    return {
      html: formatter.format(parsedSong),
      song: parsedSong
    };
  }, [chordProText, transposition]);

  return (
    <div 
      className="chord-sheet"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

## Mobile-Optimized Styling

```css
.chord-sheet {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-x: auto;
  padding: 1rem;
}

/* Chord styling */
.chord-sheet .chord {
  font-weight: bold;
  color: #1976d2;
  position: relative;
  top: -0.2em;
}

/* Directive styling */
.chord-sheet .directive {
  font-style: italic;
  color: #666;
}

/* Section headers */
.chord-sheet .chorus,
.chord-sheet .verse,
.chord-sheet .bridge {
  font-weight: bold;
  margin-top: 1em;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .chord-sheet {
    font-size: 14px;
    padding: 0.5rem;
  }
}
```

## Advanced Features

### Metadata Extraction
```typescript
const song = parser.parse(chordProText);
const metadata = {
  title: song.getMetaData('title'),
  artist: song.getMetaData('artist'),
  key: song.getMetaData('key'),
  tempo: song.getMetaData('tempo'),
  capo: song.getMetaData('capo')
};
```

### Transposition
```typescript
// Transpose up 2 semitones
song.transpose(2);

// Transpose down 3 semitones  
song.transpose(-3);
```

### Chord Manipulation
```typescript
import { Chord } from 'chordsheetjs';

const chord = Chord.parse('Ebsus4/Bb');
chord.normalize(); // Standardize notation
chord.transpose(4); // Transpose
const chordString = chord.toString();
```

## Fullscreen Mobile Pattern

```typescript
export function FullscreenChordViewer({ chordProText }: Props) {
  const [isMinimal, setIsMinimal] = useState(false);
  
  const toggleMinimal = () => {
    setIsMinimal(!isMinimal);
    
    // Toggle fullscreen on mobile
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div 
      className={`chord-viewer ${isMinimal ? 'minimal' : ''}`}
      onClick={toggleMinimal}
    >
      {!isMinimal && <Header />}
      <ChordSheet chordProText={chordProText} />
      {!isMinimal && <Controls />}
    </div>
  );
}
```

## Performance Optimization

1. **Memoize parsing**: Use useMemo to avoid re-parsing on every render
2. **Lazy load**: Only parse/format when component is visible
3. **Virtual scrolling**: For very long songs, consider virtualization
4. **Cache formatted output**: Store formatted HTML in state/context

## Common Patterns

### Auto-scroll for Performance
```typescript
const [isScrolling, setIsScrolling] = useState(false);
const [scrollSpeed, setScrollSpeed] = useState(30); // pixels per second

useEffect(() => {
  if (!isScrolling) return;
  
  const interval = setInterval(() => {
    window.scrollBy(0, 1);
  }, 1000 / scrollSpeed);
  
  return () => clearInterval(interval);
}, [isScrolling, scrollSpeed]);
```

### Print-friendly Version
```typescript
const printFormatter = new HtmlTableFormatter();
const printHtml = printFormatter.format(song);
const css = HtmlTableFormatter.cssString('.print-view');
```

## Error Handling

```typescript
try {
  const parser = new ChordProParser();
  const song = parser.parse(chordProText);
  // Success path
} catch (error) {
  console.error('Failed to parse chord sheet:', error);
  // Show fallback UI or raw text
}
```

## Testing Considerations

1. Test with various ChordPro directives
2. Test transposition edge cases
3. Test with malformed input
4. Test mobile touch interactions
5. Test fullscreen API compatibility

## References
- GitHub: https://github.com/martijnversluis/ChordSheetJS
- Documentation: https://www.chordsheetjs.org/
- NPM: https://www.npmjs.com/package/chordsheetjs