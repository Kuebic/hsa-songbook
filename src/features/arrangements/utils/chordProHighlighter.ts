/**
 * ChordPro syntax highlighting patterns and utilities
 */

export interface HighlightPattern {
  regex: RegExp
  className: string
  priority?: number
}

// ChordPro highlighting patterns
export const CHORDPRO_PATTERNS: HighlightPattern[] = [
  // Directives with values {key: value}
  {
    regex: /\{(?:title|t|subtitle|st|artist|a|key|tempo|time|capo):[^}]*\}/gi,
    className: 'directive',
    priority: 1
  },
  // Section directives
  {
    regex: /\{(?:start_of_chorus|end_of_chorus|soc|eoc|start_of_verse|end_of_verse|sov|eov|start_of_bridge|end_of_bridge|sob|eob)\}/gi,
    className: 'section-directive',
    priority: 1
  },
  // Section markers [Verse], [Chorus], etc.
  {
    regex: /\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Ending|Instrumental|Interlude|Vamp|Breakdown|Refrain)(\s+\d+)?\]/gi,
    className: 'section',
    priority: 2
  },
  // Chord symbols [C], [Am7], [G/B], etc.
  {
    regex: /\[[A-G][#b]?(?:m|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?\]/g,
    className: 'chord',
    priority: 3
  },
  // Comments {comment: text} or {c: text}
  {
    regex: /\{(?:comment|c):[^}]*\}/gi,
    className: 'comment',
    priority: 4
  },
  // Comment lines starting with #
  {
    regex: /^#.*/gm,
    className: 'comment-line',
    priority: 5
  }
]

/**
 * Language definition for @uiw/react-textarea-code-editor
 * This provides syntax highlighting for ChordPro format
 */
export const chordProLanguage = {
  name: 'chordpro',
  // Define token patterns for the code editor
  tokenize: (text: string) => {
    const tokens: Array<{ type: string; value: string; start: number; end: number }> = []
    
    // Sort patterns by priority
    const sortedPatterns = [...CHORDPRO_PATTERNS].sort((a, b) => 
      (a.priority || 0) - (b.priority || 0)
    )
    
    // Track which characters have been tokenized
    const tokenized = new Array(text.length).fill(false)
    
    for (const pattern of sortedPatterns) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
      let match
      
      while ((match = regex.exec(text)) !== null) {
        const start = match.index
        const end = start + match[0].length
        
        // Check if this range has already been tokenized
        let alreadyTokenized = false
        for (let i = start; i < end; i++) {
          if (tokenized[i]) {
            alreadyTokenized = true
            break
          }
        }
        
        if (!alreadyTokenized) {
          tokens.push({
            type: pattern.className,
            value: match[0],
            start,
            end
          })
          
          // Mark these characters as tokenized
          for (let i = start; i < end; i++) {
            tokenized[i] = true
          }
        }
      }
    }
    
    // Sort tokens by position
    tokens.sort((a, b) => a.start - b.start)
    
    return tokens
  }
}

/**
 * Helper function to insert chord at cursor position
 */
export function insertChordAtCursor(
  text: string,
  cursorPosition: number,
  chord: string
): { newText: string; newCursorPosition: number } {
  const before = text.substring(0, cursorPosition)
  const after = text.substring(cursorPosition)
  const chordText = `[${chord}]`
  
  return {
    newText: before + chordText + after,
    newCursorPosition: cursorPosition + chordText.length
  }
}

/**
 * Helper function to insert directive at cursor position
 */
export function insertDirectiveAtCursor(
  text: string,
  cursorPosition: number,
  directive: string,
  value = ''
): { newText: string; newCursorPosition: number } {
  const before = text.substring(0, cursorPosition)
  const after = text.substring(cursorPosition)
  const directiveText = value ? `{${directive}: ${value}}` : `{${directive}}`
  
  // If inserting at the beginning or after a newline, add a newline after
  const needsNewline = cursorPosition === 0 || 
    (cursorPosition > 0 && text[cursorPosition - 1] === '\n')
  
  const fullText = needsNewline ? directiveText + '\n' : directiveText
  
  return {
    newText: before + fullText + after,
    newCursorPosition: cursorPosition + directiveText.length + (needsNewline ? 1 : 0)
  }
}

/**
 * Common chord progressions for quick insertion
 */
export const COMMON_CHORDS = [
  'C', 'D', 'E', 'F', 'G', 'A', 'B',
  'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm',
  'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
  'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7',
  'C#', 'D#', 'F#', 'G#', 'A#',
  'Db', 'Eb', 'Gb', 'Ab', 'Bb'
]

/**
 * Common ChordPro directives
 */
export const COMMON_DIRECTIVES = [
  { name: 'title', shorthand: 't', hasValue: true, placeholder: 'Song Title' },
  { name: 'subtitle', shorthand: 'st', hasValue: true, placeholder: 'Subtitle' },
  { name: 'artist', shorthand: 'a', hasValue: true, placeholder: 'Artist Name' },
  { name: 'key', shorthand: null, hasValue: true, placeholder: 'C' },
  { name: 'tempo', shorthand: null, hasValue: true, placeholder: '120' },
  { name: 'time', shorthand: null, hasValue: true, placeholder: '4/4' },
  { name: 'capo', shorthand: null, hasValue: true, placeholder: '2' },
  { name: 'start_of_chorus', shorthand: 'soc', hasValue: false },
  { name: 'end_of_chorus', shorthand: 'eoc', hasValue: false },
  { name: 'start_of_verse', shorthand: 'sov', hasValue: false },
  { name: 'end_of_verse', shorthand: 'eov', hasValue: false },
  { name: 'comment', shorthand: 'c', hasValue: true, placeholder: 'Your comment' }
]