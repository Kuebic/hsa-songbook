# 🎵 Chord Positioning Implementation Guide

## Overview

The ChordDisplay component now supports **precise chord positioning** exactly where chords appear in ChordPro format, including mid-word placement like `encyclo[C#]pedia`.

## How It Works

### ChordSheetJS Column-Based Architecture

ChordSheetJS's `HtmlDivFormatter` uses a **column-based layout system** that naturally supports precise positioning:

```html
<!-- For: encyclo[C#]pedia -->
<div class="row">
  <div class="column">
    <div class="chord"></div>        <!-- Empty chord slot -->
    <div class="lyrics">encyclo</div>
  </div>
  <div class="column">
    <div class="chord">C#</div>       <!-- Chord positioned here -->
    <div class="lyrics">pedia</div>   <!-- Remaining lyrics -->
  </div>
</div>
```

### CSS Flexbox Layout

Our enhanced ChordDisplay component adds CSS to display columns properly:

```css
.chord-row {
  display: flex;
  align-items: flex-end;
  min-height: 2.5em;
}

.chord-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.chord {
  line-height: 1;
  margin-bottom: 0.125rem;
  min-height: 1.2em;
}

.chord-lyrics {
  line-height: 1.4;
  white-space: pre;
}
```

## Positioning Examples

### 1. Mid-word Positioning
```
Input:  encyclo[C#]pedia
Output: [empty] + "encyclo"  |  [C#] + "pedia"
Result:          C#
        encyclopedia
```

### 2. Word-start Positioning  
```
Input:  [G]wonderful
Output: [G] + "wonderful"
Result: G
        wonderful
```

### 3. Word-end Positioning
```
Input:  amazing[Am]
Output: [empty] + "amazing"  |  [Am] + ""
Result:         Am
        amazing
```

### 4. Complex Multi-chord
```
Input:  super[C]cali[G]fragi[Am]listic
Output: [empty]+"super" | [C]+"cali" | [G]+"fragi" | [Am]+"listic"  
Result:        C         G            Am
        supercalifragilistic
```

## Implementation Details

### Enhanced Processing

The `ChordDisplay.tsx` component processes ChordSheetJS HTML output:

1. **Adds CSS classes** for styling and layout
2. **Handles empty chord slots** for proper alignment  
3. **Preserves precise positioning** through column structure
4. **Supports chord hiding** while maintaining layout

### Key Features

- ✅ **Pixel-perfect positioning** - chords appear exactly where brackets are placed
- ✅ **Responsive layout** - works on all screen sizes
- ✅ **Theme support** - light, dark, and stage themes
- ✅ **Accessibility** - proper ARIA labels and keyboard navigation
- ✅ **Performance** - memoized HTML processing
- ✅ **Transposition** - positioning preserved when chords change

### Browser Compatibility

The flexbox-based layout works in all modern browsers:
- Chrome/Edge 29+
- Firefox 28+ 
- Safari 9+
- iOS Safari 9+
- Android 4.4+

## Testing

Comprehensive test suite in `ChordPositioning.test.tsx` covers:

- ✅ Mid-word chord placement
- ✅ Word-start positioning
- ✅ Word-end positioning  
- ✅ Complex multi-chord scenarios
- ✅ Theme consistency
- ✅ Transposition behavior
- ✅ HTML structure validation
- ✅ Accessibility requirements

## Usage Examples

### Basic Usage
```tsx
<ChordDisplay 
  content="encyclo[C#]pedia [G]wonderful"
  theme="light"
  fontSize={18}
/>
```

### With Transposition
```tsx
<ChordDisplay 
  content="[C]Amazing [F]grace [G]how [C]sweet"
  transpose={2}  // C→D, F→G, G→A
/>
```

### Stage Performance
```tsx
<ChordDisplay 
  content="[C]Start encyclo[G#]pedia [Am]end"
  theme="stage"    // High contrast black/yellow
  fontSize={24}    // Large text for stage
/>
```

## Performance Considerations

1. **Memoization** - HTML processing is memoized for identical content
2. **Efficient DOM** - Minimal DOM manipulation through string processing
3. **CSS-only layout** - No JavaScript positioning calculations
4. **Responsive design** - Single layout works across all screen sizes

## Future Enhancements

Potential improvements for advanced use cases:

- **Audio playback** - Play chord sounds on click
- **Chord diagrams** - Show fingering diagrams on hover
- **Export formats** - PDF/image export with positioning
- **Custom themes** - User-defined color schemes
- **Animation** - Smooth transitions between transpositions

## Troubleshooting

### Common Issues

**Q: Chords appear misaligned**
A: Ensure the container has proper CSS and the `chord-sheet-content` class is applied.

**Q: Mid-word chords don't work**  
A: Verify ChordPro syntax: `word[Chord]rest` (no spaces around brackets).

**Q: Layout breaks on mobile**
A: The flexbox layout is responsive - check for conflicting CSS rules.

**Q: Chords overlap text**
A: Verify the `min-height: 2.5em` rule is applied to `.chord-row` elements.

## Summary

This implementation achieves **perfect chord positioning** by leveraging ChordSheetJS's column-based architecture with modern CSS flexbox layout. The result is precise, responsive, and accessible chord charts that work exactly as musicians expect! 🎵