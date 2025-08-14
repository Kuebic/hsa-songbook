# PRP: ChordPro Preview Alignment and Rendering Fix

## Feature Overview

Fix the ChordPro preview rendering to properly position chords above specific characters (e.g., D above 'p' in encyclo[D]pedia), eliminate excessive spacing between words, and resolve the duplicate title display issue. The implementation will enhance the existing preview system while maintaining the vertical slice architecture within the `arrangements` feature.

## Problem Statement

The current ChordPro preview has critical rendering issues:

1. **Incorrect Chord Positioning**: Chords are not aligned above their intended characters - when ChordPro markup shows `encyclo[D]pedia`, the chord "D" should appear precisely above the letter "p", not elsewhere
2. **Excessive Word Spacing**: The HtmlTableFormatter creates unnecessary gaps between words, making lyrics hard to read
3. **Title Duplication**: The song title appears twice in the preview - once from manual rendering and once from ChordSheetJS output
4. **Rigid Table Layout**: Current table-based rendering doesn't adapt well to different screen sizes

## Success Criteria

- [ ] Chords positioned exactly above their target characters (D above 'p' in encyclo[D]pedia)
- [ ] No excessive spacing between words in lyrics
- [ ] Title displays only once in preview
- [ ] Responsive layout that works on mobile and desktop
- [ ] Performance: Preview updates within 150ms of typing
- [ ] Maintains existing editor-preview sync functionality
- [ ] All existing tests pass plus new tests for alignment
- [ ] Accessible to screen readers with proper ARIA labels

## Context and Research

### Comprehensive Research Documentation
- **Alignment Research**: `PRPs/ai_docs/chordpro-preview-alignment-research.md`
- **ChordSheetJS Guide**: `PRPs/ai_docs/chordsheetjs-integration-guide.md`
- **Editor Alignment Research**: `PRPs/ai_docs/chordpro-editor-alignment-research.md`

### Current Implementation Analysis

**Location**: `/src/features/arrangements/components/ChordProEditor/`

**Key Files**:
- `PreviewPane.tsx` (lines 36-65): Renders preview using ChordSheetJS
- `styles/preview.css` (lines 64-100): Current chord positioning styles
- `styles/chordsheet.css` (lines 45-66): Alternative chord styles

**Current Issues Identified**:

1. **Title Duplication** (`PreviewPane.tsx`, lines 47-62):
   ```typescript
   // Manual title rendering
   ${song.title ? `<h1 class="song-title">${song.title}</h1>` : ''}
   // Plus ChordSheetJS output which may also contain title
   ${html}
   ```

2. **Table-Based Rendering** (`PreviewPane.tsx`, line 41):
   ```typescript
   const formatter = new ChordSheetJS.HtmlTableFormatter();
   ```
   - Creates rigid table structure with excessive cell padding
   - Doesn't support character-level positioning

3. **CSS Chord Positioning** (`preview.css`, lines 82-94):
   ```css
   .chord-sheet-content .chord {
     vertical-align: bottom;  /* Not precise enough */
     margin-bottom: 2px;      /* Fixed spacing */
   }
   ```

### External Resources

**Key Documentation**:
- ChordSheetJS Formatters: https://github.com/martijnversluis/ChordSheetJS
- CSS Chord Positioning: https://stackoverflow.com/questions/4154014/styling-text-to-make-it-appear-above-the-line-for-chords-above-the-lyrics
- ChordPro Standard: https://www.chordpro.org/chordpro/chordpro-chords/

**Working Examples**:
- JS ChordPro Renderer: https://codepen.io/gschoppe/pen/wqbJZp
- ChordFiddle: https://github.com/martijnversluis/ChordFiddle

## Vertical Slice Architecture

This fix stays within the `arrangements` feature slice:

```
src/features/arrangements/
├── components/
│   └── ChordProEditor/
│       ├── PreviewPane.tsx            # MODIFY: Switch formatter, fix title
│       ├── utils/
│       │   ├── chordProCache.ts       # Existing caching
│       │   └── chordRenderer.ts       # NEW: Custom chord rendering
│       └── styles/
│           ├── preview.css             # MODIFY: New chord positioning
│           └── chordAlignment.css     # NEW: Character-level styles
└── styles/
    └── chordsheet.css                  # MODIFY: Update for new approach
```

### Dependencies
- `chordsheetjs` (v10.1.1) - Already installed
- No new external dependencies required

## Implementation Blueprint

### Phase 1: Fix Title Duplication

```typescript
// PreviewPane.tsx - Remove manual title rendering
const song = parseSongWithCache(content);
const formatter = new ChordSheetJS.HtmlDivFormatter(); // Switch to HtmlDivFormatter

// Check if ChordSheetJS output contains title
const hasTitle = song.title || song.artist;
const formatterConfig = {
  // Configure formatter to handle metadata
  renderBlankLines: false,
  // Let ChordSheetJS handle all metadata
};

const html = formatter.format(song);

// Only wrap output, don't add duplicate metadata
previewRef.current.innerHTML = `
  <div class="chord-sheet-wrapper">
    <div class="chord-sheet-content">
      ${html}
    </div>
  </div>
`;
```

### Phase 2: Implement Character-Level Chord Positioning

```typescript
// utils/chordRenderer.ts - NEW FILE
export interface ChordPosition {
  chord: string;
  charIndex: number;
  lyricLine: string;
}

export class CharacterChordRenderer {
  /**
   * Parse ChordPro notation and extract chord positions
   */
  parseChordPositions(line: string): ChordPosition[] {
    const positions: ChordPosition[] = [];
    let cleanLine = '';
    let charIndex = 0;
    
    // Parse line character by character
    let i = 0;
    while (i < line.length) {
      if (line[i] === '[') {
        // Found chord marker
        const closeIndex = line.indexOf(']', i);
        if (closeIndex !== -1) {
          const chord = line.substring(i + 1, closeIndex);
          positions.push({
            chord,
            charIndex: cleanLine.length,
            lyricLine: ''
          });
          i = closeIndex + 1;
        } else {
          cleanLine += line[i];
          i++;
        }
      } else {
        cleanLine += line[i];
        i++;
      }
    }
    
    // Update positions with clean line
    positions.forEach(pos => {
      pos.lyricLine = cleanLine;
    });
    
    return positions;
  }
  
  /**
   * Render line with chords positioned above characters
   */
  renderLine(line: string): HTMLElement {
    const positions = this.parseChordPositions(line);
    const container = document.createElement('div');
    container.className = 'chord-line-container';
    
    if (positions.length === 0) {
      // No chords, just lyrics
      container.textContent = line;
      return container;
    }
    
    const lyricSpan = document.createElement('span');
    lyricSpan.className = 'lyric-with-chords';
    
    const cleanLine = positions[0].lyricLine;
    let lastIndex = 0;
    
    positions.forEach((pos, idx) => {
      // Add text before chord
      if (pos.charIndex > lastIndex) {
        const textNode = document.createTextNode(
          cleanLine.substring(lastIndex, pos.charIndex)
        );
        lyricSpan.appendChild(textNode);
      }
      
      // Add character with chord
      const charSpan = document.createElement('span');
      charSpan.className = 'chord-anchor';
      charSpan.setAttribute('data-chord', pos.chord);
      charSpan.textContent = cleanLine[pos.charIndex] || '';
      lyricSpan.appendChild(charSpan);
      
      lastIndex = pos.charIndex + 1;
    });
    
    // Add remaining text
    if (lastIndex < cleanLine.length) {
      const textNode = document.createTextNode(
        cleanLine.substring(lastIndex)
      );
      lyricSpan.appendChild(textNode);
    }
    
    container.appendChild(lyricSpan);
    return container;
  }
}
```

### Phase 3: CSS for Precise Chord Positioning

```css
/* styles/chordAlignment.css - NEW FILE */

/* Character-level chord positioning */
.chord-line-container {
  position: relative;
  line-height: 2.2;
  font-family: 'Courier New', Courier, monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.lyric-with-chords {
  position: relative;
}

/* Zero-width chord positioning technique */
.chord-anchor {
  position: relative;
}

.chord-anchor::before {
  content: attr(data-chord);
  position: absolute;
  top: -1.2em;
  left: 0;
  color: var(--syntax-chord, #2563eb);
  font-weight: 600;
  font-size: 0.875em;
  white-space: nowrap;
  /* Ensure chord doesn't affect text flow */
  pointer-events: none;
  /* Optional: Background for readability */
  background: rgba(255, 255, 255, 0.9);
  padding: 0 2px;
  border-radius: 2px;
}

/* Dark mode support */
[data-theme="dark"] .chord-anchor::before {
  background: rgba(30, 30, 30, 0.9);
  color: var(--syntax-chord-dark, #60a5fa);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .chord-line-container {
    font-size: 14px;
    line-height: 2;
  }
  
  .chord-anchor::before {
    font-size: 0.8em;
    top: -1.1em;
  }
}

/* Print optimization */
@media print {
  .chord-anchor::before {
    color: black;
    font-weight: bold;
    background: none;
  }
}

/* Prevent selection issues */
.chord-anchor::selection,
.chord-anchor::before::selection {
  background: transparent;
}
```

### Phase 4: Custom ChordSheetJS Formatter Integration

```typescript
// PreviewPane.tsx - Enhanced implementation
import { CharacterChordRenderer } from './utils/chordRenderer';

export const PreviewPane: React.FC<PreviewPaneProps> = ({ content, theme, className }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef(new CharacterChordRenderer());
  
  const updatePreview = useMemo(
    () => debounce((content: string) => {
      if (!previewRef.current) return;
      
      try {
        const song = parseSongWithCache(content);
        
        // Use HtmlDivFormatter for better flexibility
        const formatter = new ChordSheetJS.HtmlDivFormatter();
        
        // Custom configuration to prevent title duplication
        const formatterConfig = {
          // Ensure formatter doesn't duplicate metadata
          evaluate: true,
          metadata: {
            separator: '',
          },
        };
        
        // Format the song
        let html = formatter.format(song);
        
        // Post-process to apply character-level positioning
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Find all chord-lyric pairs and re-render with character positioning
        const chordLines = tempDiv.querySelectorAll('.chord-sheet-line');
        chordLines.forEach(line => {
          // Extract original ChordPro text if available
          const chordProText = line.getAttribute('data-chordpro');
          if (chordProText) {
            const rendered = rendererRef.current.renderLine(chordProText);
            line.replaceWith(rendered);
          }
        });
        
        // Build final HTML without duplicate title
        const finalHtml = `
          <div class="chord-sheet-wrapper">
            ${!song.title ? '' : `
              <div class="chord-sheet-header">
                <h1 class="song-title">${song.title}</h1>
                ${song.artist ? `<p class="song-artist">${song.artist}</p>` : ''}
              </div>
            `}
            <div class="chord-sheet-content">
              ${tempDiv.innerHTML}
            </div>
          </div>
        `;
        
        previewRef.current.innerHTML = finalHtml;
        
      } catch (error) {
        console.error('Preview error:', error);
        // Error handling...
      }
    }, 100),
    []
  );
  
  // Rest of component...
};
```

### Phase 5: Alternative Approach - Pure Custom Renderer

If ChordSheetJS integration proves problematic, implement a pure custom renderer:

```typescript
// utils/customChordProRenderer.ts
export class CustomChordProRenderer {
  private directives: Map<string, string> = new Map();
  
  parse(content: string): ParsedSong {
    const lines = content.split('\n');
    const sections: Section[] = [];
    let currentSection: Section | null = null;
    
    lines.forEach(line => {
      // Handle directives
      if (line.startsWith('{') && line.endsWith('}')) {
        const directive = line.slice(1, -1);
        const [key, ...valueParts] = directive.split(':');
        const value = valueParts.join(':').trim();
        this.directives.set(key.toLowerCase(), value);
        
        // Handle section directives
        if (key.startsWith('start_of_')) {
          const sectionType = key.replace('start_of_', '');
          currentSection = { type: sectionType, lines: [] };
        } else if (key.startsWith('end_of_')) {
          if (currentSection) {
            sections.push(currentSection);
            currentSection = null;
          }
        }
      } else if (line.trim()) {
        // Handle chord/lyric lines
        const rendered = this.renderChordLine(line);
        if (currentSection) {
          currentSection.lines.push(rendered);
        } else {
          sections.push({ type: 'verse', lines: [rendered] });
        }
      }
    });
    
    return {
      title: this.directives.get('title'),
      artist: this.directives.get('artist'),
      sections
    };
  }
  
  private renderChordLine(line: string): string {
    // Use character-level positioning algorithm
    const positions: ChordPosition[] = [];
    let cleanLine = '';
    let i = 0;
    
    while (i < line.length) {
      if (line[i] === '[') {
        const closeIndex = line.indexOf(']', i);
        if (closeIndex !== -1) {
          const chord = line.substring(i + 1, closeIndex);
          positions.push({
            chord,
            charIndex: cleanLine.length
          });
          i = closeIndex + 1;
          continue;
        }
      }
      cleanLine += line[i];
      i++;
    }
    
    // Build HTML with positioned chords
    if (positions.length === 0) {
      return `<div class="lyric-line">${cleanLine}</div>`;
    }
    
    let html = '<div class="chord-line-container"><span class="lyric-with-chords">';
    let lastIndex = 0;
    
    positions.forEach(pos => {
      // Add text before chord
      if (pos.charIndex > lastIndex) {
        html += cleanLine.substring(lastIndex, pos.charIndex);
      }
      
      // Add character with chord
      html += `<span class="chord-anchor" data-chord="${pos.chord}">`;
      html += cleanLine[pos.charIndex] || '';
      html += '</span>';
      
      lastIndex = pos.charIndex + 1;
    });
    
    // Add remaining text
    if (lastIndex < cleanLine.length) {
      html += cleanLine.substring(lastIndex);
    }
    
    html += '</span></div>';
    return html;
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
// PreviewPane.test.tsx
describe('PreviewPane', () => {
  it('displays title only once', () => {
    const content = '{title: Amazing Grace}\n{artist: John Newton}\n[G]Amazing [C]grace';
    const { container } = render(<PreviewPane content={content} />);
    const titles = container.querySelectorAll('.song-title');
    expect(titles).toHaveLength(1);
    expect(titles[0].textContent).toBe('Amazing Grace');
  });
  
  it('positions chords above correct characters', () => {
    const content = 'encyclo[D]pedia';
    const { container } = render(<PreviewPane content={content} />);
    const chordAnchors = container.querySelectorAll('.chord-anchor');
    expect(chordAnchors[0].getAttribute('data-chord')).toBe('D');
    expect(chordAnchors[0].textContent).toBe('p'); // D should be above 'p'
  });
  
  it('does not add excessive spacing between words', () => {
    const content = '[C]Hello [G]world [Am]test';
    const { container } = render(<PreviewPane content={content} />);
    const lyrics = container.querySelector('.lyric-with-chords');
    expect(lyrics?.textContent).toBe('Hello world test'); // No extra spaces
  });
});

// chordRenderer.test.ts
describe('CharacterChordRenderer', () => {
  const renderer = new CharacterChordRenderer();
  
  it('parses chord positions correctly', () => {
    const positions = renderer.parseChordPositions('encyclo[D]pedia');
    expect(positions).toEqual([
      { chord: 'D', charIndex: 7, lyricLine: 'encyclopedia' }
    ]);
  });
  
  it('handles multiple chords in a line', () => {
    const positions = renderer.parseChordPositions('[C]Amazing [G]grace, how [D]sweet');
    expect(positions).toHaveLength(3);
    expect(positions[0]).toEqual({ chord: 'C', charIndex: 0, lyricLine: 'Amazing grace, how sweet' });
    expect(positions[1]).toEqual({ chord: 'G', charIndex: 8, lyricLine: 'Amazing grace, how sweet' });
    expect(positions[2]).toEqual({ chord: 'D', charIndex: 19, lyricLine: 'Amazing grace, how sweet' });
  });
});
```

### Integration Tests

```typescript
describe('ChordPro Preview Integration', () => {
  it('renders complete song with proper alignment', async () => {
    const songContent = `
{title: Test Song}
{artist: Test Artist}
{key: G}

[G]This is the [C]first verse
With encyclo[D]pedia example
[Am]Multiple [F]chords [G]here
    `;
    
    render(<ChordProEditor initialContent={songContent} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getAllByText('Test Song')).toHaveLength(1); // No duplication
    });
    
    // Check chord positioning
    const dChord = screen.getByText('D').closest('.chord-anchor');
    expect(dChord?.textContent).toBe('p'); // D above 'p'
  });
});
```

### Performance Tests

```typescript
describe('Preview Performance', () => {
  it('updates preview within 150ms', async () => {
    const { rerender } = render(<PreviewPane content="" />);
    const startTime = performance.now();
    
    rerender(<PreviewPane content="[G]Test [C]content" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(150);
  });
});
```

## Validation Gates

Execute these commands to validate the implementation:

```bash
# Level 1: Syntax & Type Checking
npm run lint && npm run type-check

# Level 2: Build Verification
npm run build

# Level 3: Test Validation
npm run test:ci

# Level 4: Development Server Check
npm run dev
# Verify in browser:
# - No console errors
# - Title displays once
# - Chords positioned correctly
# - No excessive spacing

# Level 5: Production Build Test
npm run build && npm run preview
# Test production build

# Level 6: Coverage Check
npm run test:coverage
# Ensure > 70% coverage

# Level 7: Bundle Analysis
npm run analyze:ci
# Verify no significant size increase

# Level 8: Visual Regression Test (manual)
# 1. Open ChordPro editor
# 2. Enter: encyclo[D]pedia
# 3. Verify D appears above 'p'
# 4. Enter: {title: Test}\n[C]Hello [G]world
# 5. Verify title appears once
# 6. Verify no extra spacing between words
```

## Implementation Checklist

- [ ] Switch from HtmlTableFormatter to HtmlDivFormatter
- [ ] Remove manual title rendering in PreviewPane
- [ ] Implement CharacterChordRenderer utility
- [ ] Create chordAlignment.css with zero-width positioning
- [ ] Add character-level chord parsing
- [ ] Update preview.css to remove table-specific styles
- [ ] Write unit tests for chord positioning
- [ ] Write integration tests for complete preview
- [ ] Test on mobile devices for responsive layout
- [ ] Verify accessibility with screen readers
- [ ] Document the new rendering approach
- [ ] Update any affected component documentation

## Risk Mitigation

### Potential Issues and Solutions

1. **ChordSheetJS Compatibility**
   - Risk: Custom rendering might conflict with library
   - Mitigation: Implement pure custom renderer as fallback

2. **Performance on Large Documents**
   - Risk: Character-level processing might be slow
   - Mitigation: Use memoization and virtual scrolling

3. **Browser Compatibility**
   - Risk: CSS positioning might vary across browsers
   - Mitigation: Test on all major browsers, use CSS prefixes

4. **Mobile Touch Targets**
   - Risk: Small chord text hard to tap
   - Mitigation: Increase touch target size while keeping visual compact

## Rollback Plan

If issues arise:
1. Keep original PreviewPane.tsx as PreviewPane.old.tsx
2. Feature flag for new renderer: `useNewRenderer` prop
3. Gradual rollout with A/B testing if needed
4. Revert to HtmlTableFormatter if critical issues

## Success Metrics

- Preview rendering time < 150ms (measured)
- Zero duplicate titles (tested)
- Chords positioned within 2px of target (visual test)
- Mobile usability score > 95 (Lighthouse)
- No regression in existing functionality (test suite)

## Quality Score

**Confidence Level: 9/10**

High confidence due to:
- Comprehensive research with working examples
- Clear problem identification in current code
- Multiple implementation approaches (ChordSheetJS enhancement + custom fallback)
- Detailed testing strategy
- Existing infrastructure supports changes
- Clear validation gates

Minor uncertainty (-1) for:
- Exact ChordSheetJS customization limits may require exploration

This PRP provides a complete blueprint for fixing the ChordPro preview alignment issues with multiple implementation strategies, comprehensive testing, and clear validation gates to ensure one-pass implementation success.