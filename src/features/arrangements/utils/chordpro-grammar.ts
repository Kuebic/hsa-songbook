/**
 * ChordPro Language Grammar for Shiki
 * Based on TextMate grammar format
 */

export const chordProGrammar = {
  name: 'chordpro',
  scopeName: 'source.chordpro',
  patterns: [
    {
      // Directives like {title: Song Name}, {key: C}, etc.
      name: 'keyword.control.directive.chordpro',
      match: '\\{([^:}]+):\\s*([^}]*)\\}',
      captures: {
        0: { name: 'keyword.control.directive.chordpro' },
        1: { name: 'entity.name.tag.directive.chordpro' },
        2: { name: 'string.unquoted.directive-value.chordpro' }
      }
    },
    {
      // Section markers like [Verse], [Chorus], [Bridge]
      name: 'entity.name.section.chordpro',
      match: '\\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Ending|Instrumental|Interlude|Vamp|Breakdown|Refrain)(\\s+\\d+)?\\]',
      captures: {
        0: { name: 'entity.name.section.chordpro' }
      }
    },
    {
      // Chord symbols like [C], [Am7], [G/B], etc.
      name: 'markup.bold.chord.chordpro',
      match: '\\[([A-G][#b]?(?:maj|min|m|M|dim|aug|sus|add)?[0-9]*(?:\\/[A-G][#b]?)?)\\]',
      captures: {
        0: { name: 'markup.bold.chord.chordpro' }
      }
    },
    {
      // Comments starting with #
      name: 'comment.line.number-sign.chordpro',
      match: '^#.*$',
      captures: {
        0: { name: 'comment.line.number-sign.chordpro' }
      }
    },
    {
      // Tab notation {start_of_tab} ... {end_of_tab}
      name: 'markup.raw.tab.chordpro',
      begin: '\\{start_of_tab\\}',
      end: '\\{end_of_tab\\}',
      beginCaptures: {
        0: { name: 'punctuation.definition.tab.begin.chordpro' }
      },
      endCaptures: {
        0: { name: 'punctuation.definition.tab.end.chordpro' }
      },
      patterns: [
        {
          name: 'markup.raw.tab-content.chordpro',
          match: '.*'
        }
      ]
    }
  ]
}

/**
 * ChordPro Theme for Shiki
 * Defines colors for different token types
 */
export const chordProTheme = {
  name: 'chordpro-theme',
  type: 'light',
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#1f2937',
  },
  tokenColors: [
    {
      scope: ['keyword.control.directive.chordpro', 'entity.name.tag.directive.chordpro'],
      settings: {
        foreground: '#8b5cf6', // Purple for directives
        fontStyle: 'bold'
      }
    },
    {
      scope: 'string.unquoted.directive-value.chordpro',
      settings: {
        foreground: '#7c3aed' // Lighter purple for directive values
      }
    },
    {
      scope: 'entity.name.section.chordpro',
      settings: {
        foreground: '#059669', // Green for sections
        fontStyle: 'bold'
      }
    },
    {
      scope: 'markup.bold.chord.chordpro',
      settings: {
        foreground: '#2563eb', // Blue for chords
        fontStyle: 'bold'
      }
    },
    {
      scope: 'comment.line.number-sign.chordpro',
      settings: {
        foreground: '#6b7280', // Gray for comments
        fontStyle: 'italic'
      }
    },
    {
      scope: ['punctuation.definition.tab.begin.chordpro', 'punctuation.definition.tab.end.chordpro'],
      settings: {
        foreground: '#9ca3af'
      }
    },
    {
      scope: 'markup.raw.tab-content.chordpro',
      settings: {
        foreground: '#4b5563',
        fontStyle: 'normal'
      }
    }
  ]
}