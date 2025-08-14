# Chord Transposition Enhancement Research

## Overview
This document contains comprehensive research findings for enhancing the chord transposition feature in the HSA Songbook application, including both arrangement view mode and ChordPro editor integration.

## ChordSheetJS Transposition Capabilities

### Core API Methods
```javascript
// Song-level transposition
song.transpose(semitones)          // Main method: positive = up, negative = down
song.transposeUp(semitones)        // Explicitly transpose up
song.transposeDown(semitones)      // Explicitly transpose down

// Individual chord transposition
const chord = ChordSheetJS.Chord.parse('C');
const transposedChord = chord.transpose(4);  // C to E

// Key transposition
const key = ChordSheetJS.Key.parse('G');
const newKey = key.transpose(2);  // G to A
```

### Current Implementation Pattern
```typescript
// From chordProService.ts
transpose(content: string, semitones: number): string {
  const { song } = this.parse(content);
  song.transpose(semitones);
  
  const formatter = new ChordProFormatter();
  return formatter.format(song);
}
```

### Supported Chord Notations
- Basic chords: C, D, E, F, G, A, B
- Accidentals: C#, Db, F#, Bb
- Complex chords: Cmaj7, Am7, D7sus4, Gmaj7/B
- Slash chords: G/B, C/E, D/F#
- Extended chords: C9, D11, F13
- Modified chords: Cadd9, Dsus2, Em7b5

## TonalJS Alternative (For Advanced Features)

### When to Consider TonalJS
- Need for complex music theory operations
- Enharmonic spelling preferences
- Modal interchange calculations
- Advanced harmonic analysis

### Key TonalJS Features
```javascript
import { Chord, Interval, Key } from 'tonal';

// Transpose with music theory awareness
const transposed = Chord.transpose('Cmaj7', '3m');  // Eb major 7

// Key-aware transposition
const newKey = Key.transpose('C major', 2);  // D major

// Enharmonic considerations
const chord = Chord.get('C#');
const enharmonic = Chord.enharmonicEquivalent(chord);  // Db
```

## UI/UX Best Practices

### Control Patterns
1. **Button Controls** (Current Implementation)
   - Simple +/- buttons with clear visual indicators
   - Current key display between buttons
   - Touch-friendly targets (min 44px)

2. **Enhanced Patterns to Consider**
   - Key selector dropdown for direct key selection
   - Reset to original key button
   - Capo position calculator
   - Common keys quick select

### State Management Architecture
```typescript
// Recommended Context Pattern
interface TransposeContextValue {
  semitones: number;
  originalKey: string;
  currentKey: string;
  transpose: (steps: number) => void;
  reset: () => void;
  setKey: (key: string) => void;
}
```

### Mobile Considerations
- Bottom-right positioning for thumb access
- Semi-transparent overlay in stage mode
- Large touch targets with proper padding
- Gesture support for quick transpose

## Performance Optimizations

### Caching Strategy
```typescript
// Memoize expensive calculations
const transposedContent = useMemo(() => {
  if (semitones === 0) return originalContent;
  return chordProService.transpose(originalContent, semitones);
}, [originalContent, semitones]);
```

### Real-time Performance
- Debounce rapid transpose clicks
- Use requestAnimationFrame for smooth UI updates
- Cache parsed chord objects
- Consider Web Workers for large songs (100+ chords)

## Accessibility Requirements

### ARIA Implementation
```jsx
<button 
  onClick={() => transpose(-1)}
  aria-label="Transpose down one semitone"
  aria-keyshortcuts="Alt+-"
>
  −
</button>
<span 
  role="status" 
  aria-live="polite"
  aria-label={`Current key: ${currentKey}`}
>
  {currentKey}
</span>
```

### Keyboard Navigation
- Alt + Plus: Transpose up
- Alt + Minus: Transpose down
- Alt + 0: Reset to original key
- Tab navigation through controls

## Integration Points

### ChordPro Editor Integration
1. **Live Preview Updates**
   - Real-time transposition in preview pane
   - Maintain scroll sync during transpose
   - Update syntax highlighting for new chords

2. **Editor State Management**
   ```typescript
   interface EditorTransposeState {
     editorContent: string;        // Original content
     previewSemitones: number;      // Preview-only transpose
     appliedSemitones: number;      // Applied to actual content
     isPreviewMode: boolean;        // Preview vs applied
   }
   ```

3. **Apply vs Preview Pattern**
   - Preview button: Shows transposed without modifying source
   - Apply button: Modifies actual ChordPro content
   - Undo support for applied transposition

### Arrangement Viewer Integration
- Already implemented in ViewerToolbar and ViewerControls
- Stage mode has minimal floating controls
- Persistence through arrangement preferences

## Common Pitfalls to Avoid

### Music Theory Mistakes
1. **Simple Math Approach** (Wrong)
   ```typescript
   // DON'T: Ignores music theory
   const newNote = NOTES[(noteIndex + semitones) % 12];
   ```

2. **Context-Aware Approach** (Correct)
   ```typescript
   // DO: Respects key signatures
   const transposed = song.transpose(semitones);
   ```

### State Management Issues
- Don't mutate ChordSheetJS song objects directly
- Avoid global state pollution
- Prevent excessive re-renders with proper memoization
- Handle edge cases (-12 to +12 range limits)

### UI/UX Problems
- Missing visual feedback for current transposition
- No way to reset to original key
- Poor mobile touch targets
- Lack of keyboard shortcuts

## Recommended Enhancements

### Phase 1: Core Enhancements
1. Add keyboard shortcuts for transposition
2. Implement reset to original key button
3. Add visual indicator for transposition amount
4. Improve mobile touch targets

### Phase 2: Advanced Features
1. Key selector dropdown
2. Capo position suggestions
3. Enharmonic spelling preferences
4. Common keys quick select

### Phase 3: Editor Integration
1. Live preview transposition
2. Apply vs preview modes
3. Undo/redo support
4. Batch transposition for multiple songs

## Testing Considerations

### Unit Tests
```typescript
describe('Transposition', () => {
  test('transposes up correctly', () => {
    const result = transpose('C', 2);
    expect(result).toBe('D');
  });
  
  test('handles edge cases', () => {
    const result = transpose('B', 1);
    expect(result).toBe('C');
  });
  
  test('respects range limits', () => {
    const result = transpose('C', 13);
    expect(result).toBe('C'); // Clamped to ±12
  });
});
```

### Integration Tests
- Test transpose + print workflow
- Test transpose + stage mode interaction
- Test persistence across navigation
- Test mobile gesture support

### E2E Tests
- User can transpose using buttons
- User can transpose using keyboard
- Transposition persists in preferences
- Stage mode transpose works correctly

## References

### Documentation
- [ChordSheetJS Documentation](https://github.com/martijnversluis/ChordSheetJS)
- [TonalJS Documentation](https://github.com/tonaljs/tonal)
- [React Context Best Practices](https://react.dev/reference/react/useContext)

### Example Implementations
- [ChordFiddle](https://martijnversluis.github.io/ChordFiddle/) - ChordSheetJS playground
- [chord-buildr](https://github.com/jekrch/chord-buildr) - React chord progression app
- [Rendering chords with React](https://andytran.ca/blog/2021/06/30/render-chords/) - Tutorial

### Related PRPs
- `PRPs/chordpro-editor-integration.md` - Editor implementation details
- `PRPs/enhance-arrangement-viewer.md` - Viewer enhancements