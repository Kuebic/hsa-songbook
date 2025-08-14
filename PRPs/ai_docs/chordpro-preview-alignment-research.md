# ChordPro Preview Alignment and Rendering Research

## External Documentation Resources

### ChordPro Standards and Implementation
- **Official ChordPro**: https://www.chordpro.org/
- **ChordPro Chords Implementation**: https://www.chordpro.org/chordpro/chordpro-chords/
- **ChordPro Directives**: https://www.chordpro.org/chordpro/chordpro-directives/
- **ChordPro GitHub**: https://github.com/ChordPro/chordpro

### ChordSheetJS Library
- **GitHub Repository**: https://github.com/martijnversluis/ChordSheetJS
- **Documentation**: https://www.chordsheetjs.org/
- **NPM Package**: https://www.npmjs.com/package/chordsheetjs
- **ChordFiddle (Live Example)**: https://github.com/martijnversluis/ChordFiddle

### CSS Chord Positioning Techniques
- **Stack Overflow - Chords Above Lyrics**: https://stackoverflow.com/questions/4154014/styling-text-to-make-it-appear-above-the-line-for-chords-above-the-lyrics
- **Stack Overflow - Responsive Chords**: https://stackoverflow.com/questions/67105309/responsive-chords-above-lyrics
- **Stack Overflow - Guitar Chord Alignment**: https://stackoverflow.com/questions/50092108/align-guitar-chords-on-web

### Live Examples and Demos
- **JS Chord Pro Rendering Engine**: https://codepen.io/gschoppe/pen/wqbJZp
- **ChordPro Renderer CodePen**: https://codepen.io/Arden/pen/ZqxjLW

### Libraries and Tools
- **Floating UI (Autocomplete Positioning)**: https://floating-ui.com/docs/getting-started
- **React Window (Virtual Scrolling)**: https://github.com/bvaughn/react-window
- **Monaco Editor**: https://github.com/microsoft/monaco-editor
- **CodeMirror 6**: https://codemirror.net/docs/

### Web Platform APIs
- **Visual Viewport API**: https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API
- **ResizeObserver API**: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
- **IntersectionObserver API**: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API

### Performance Resources
- **Web.dev Performance Patterns**: https://web.dev/patterns/web-vitals-patterns/
- **CSS Rendering Performance**: https://web.dev/rendering-performance/

### Typography and Text Rendering
- **CSS text-rendering Property**: https://developer.mozilla.org/en-US/docs/Web/CSS/text-rendering
- **Deep Dive CSS Font Metrics**: https://iamvdo.me/en/blog/css-font-metrics-line-height-and-vertical-align

### Accessibility Guidelines
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Patterns**: https://www.w3.org/WAI/ARIA/apg/patterns/
- **Touch Target Guidelines**: https://developer.apple.com/design/human-interface-guidelines/accessibility

## Key Implementation Patterns from Research

### 1. Zero-Width Chord Positioning (Most Effective)
```css
span.chord {
  position: relative;
  top: -1em;
  display: inline-block;
  width: 0;
  overflow: visible;
  font-weight: bold;
}
```

### 2. Data Attribute Approach
```css
span[data-chord]:before {
  content: attr(data-chord);
  position: absolute;
  top: -1.2em;
  left: 0;
  font-weight: bold;
  color: #2563eb;
}
```

### 3. CSS Grid Responsive Layout
```css
.chord-line {
  display: grid;
  grid-template-rows: auto auto;
  gap: 0;
  align-items: end;
}
```

### 4. Character-Level Measurement
```javascript
// Use canvas for precise character width
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.font = '16px Courier New';
const width = ctx.measureText(text).width;
```

## Critical Issues Identified

### Current Implementation Problems
1. **Title Duplication**: PreviewPane.tsx renders title manually AND ChordSheetJS output contains title
2. **Chord Positioning**: HtmlTableFormatter creates rigid table structure causing spacing issues
3. **Character Alignment**: No character-level positioning for chords (D should be above 'p' in encyclo[D]pedia)
4. **Mobile Responsiveness**: Fixed table layout doesn't adapt well to mobile viewports

### Solutions from Research
1. Use HtmlDivFormatter instead of HtmlTableFormatter for responsive layout
2. Implement character-level positioning using CSS transforms or data attributes
3. Remove manual title rendering when ChordSheetJS handles it
4. Add mobile-specific CSS with proper touch targets and font sizing

## Performance Optimization Strategies

1. **Debounced Rendering**: 100-150ms delay for preview updates
2. **Virtual Scrolling**: For documents > 500 lines
3. **Canvas Measurement Caching**: Store character widths to avoid recalculation
4. **GPU Acceleration**: Use transform instead of top/left for positioning

## Mobile-First Considerations

1. **Touch Targets**: Minimum 44px for interactive elements
2. **Font Size**: 16px minimum to prevent iOS zoom
3. **Virtual Keyboard**: Use visualViewport API for detection
4. **Swipe Gestures**: Toggle between editor and preview

## Accessibility Requirements

1. **ARIA Labels**: Proper labeling for chord elements
2. **Screen Reader Support**: Alternative text for chord positions
3. **Keyboard Navigation**: Tab through chords and lyrics
4. **Color Contrast**: WCAG AA compliance for chord colors