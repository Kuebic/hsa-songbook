/**
 * Custom ChordPro language definition for syntax highlighting
 */

export const chordProLanguage = {
  comments: {
    lineComment: '#',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
  ],
}

// Custom syntax highlighting rules for ChordPro
export const chordProHighlightRules = `
  /* ChordPro Syntax Highlighting */
  
  /* Directives {title: ...}, {key: ...}, etc */
  .cm-chordpro-directive {
    color: #8b5cf6;
    font-weight: bold;
  }
  
  /* Chord symbols [C], [Am], [G7], etc */
  .cm-chordpro-chord {
    color: #2563eb;
    font-weight: bold;
    background-color: rgba(37, 99, 235, 0.1);
    padding: 0 2px;
    border-radius: 2px;
  }
  
  /* Section markers like [Verse], [Chorus], etc */
  .cm-chordpro-section {
    color: #059669;
    font-weight: bold;
    text-transform: uppercase;
  }
  
  /* Comments starting with # */
  .cm-chordpro-comment {
    color: #6b7280;
    font-style: italic;
  }
  
  /* Lyrics (regular text) */
  .cm-chordpro-lyrics {
    color: #1f2937;
  }
`

/**
 * Apply ChordPro syntax highlighting to text
 * This is a simple regex-based highlighter for the textarea
 */
export function highlightChordPro(text: string): string {
  // Replace directives {key: value}
  text = text.replace(
    /\{([^:}]+):\s*([^}]+)\}/g,
    '<span class="chordpro-directive">{$1: $2}</span>'
  )
  
  // Replace chord symbols [chord]
  text = text.replace(
    /\[([A-G][^[\]]*)\]/g,
    '<span class="chordpro-chord">[$1]</span>'
  )
  
  // Replace section markers [Verse], [Chorus], etc
  text = text.replace(
    /\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Ending)(\s+\d+)?\]/gi,
    '<span class="chordpro-section">[$1$2]</span>'
  )
  
  // Replace comments (lines starting with #)
  text = text.replace(
    /^#(.*)$/gm,
    '<span class="chordpro-comment">#$1</span>'
  )
  
  return text
}