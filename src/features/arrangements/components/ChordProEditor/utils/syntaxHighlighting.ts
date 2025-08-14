/**
 * @file syntaxHighlighting.ts
 * @description Utility functions for ChordPro syntax highlighting
 */

export type EditorTheme = 'light' | 'dark' | 'stage'

/**
 * Highlight ChordPro syntax with proper HTML escaping and pattern recognition
 */
export function highlightChordPro(text: string, _theme: EditorTheme): string {
  if (!text) return ''
  
  // First, escape HTML to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // Define highlighting patterns with proper order
  const patterns = [
    // Comments: # This is a comment (must come first)
    {
      regex: /^#(.*)$/gm,
      replacement: '<span class="syntax-comment">#$1</span>'
    },
    
    // Environment directives: {start_of_chorus}, {end_of_chorus}, {soc}, {eoc}
    {
      regex: /\{((?:start_of_|end_of_|so|eo)[a-z]+)(?::([^}]*))?\}/gi,
      replacement: '<span class="syntax-directive">{$1$2}</span>'
    },
    
    // Meta directives: {title:...}, {key:...}, etc.
    {
      regex: /\{([a-z_]+):([^}]*)\}/gi,
      replacement: '<span class="syntax-meta">{<span class="syntax-meta-key">$1</span>:<span class="syntax-meta-value">$2</span>}</span>'
    },
    
    // Section labels: [Verse], [Chorus], etc.
    {
      regex: /\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Coda|Interlude|Instrumental)(?:\s+\d+)?\]/gi,
      replacement: '<span class="syntax-section">[$1]</span>'
    },
    
    // Chords: [C], [Am7], [G/B], etc.
    {
      regex: /\[([A-G][#b]?(?:maj|min|m|M|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\]/g,
      replacement: '<span class="syntax-chord">[$1]</span>'
    },
    
    // Custom labels: [anything else]
    {
      regex: /\[([^\]]+)\]/g,
      replacement: '<span class="syntax-label">[$1]</span>'
    }
  ]
  
  // Apply patterns
  patterns.forEach(pattern => {
    html = html.replace(pattern.regex, pattern.replacement)
  })
  
  return html
}

/**
 * Apply theme-specific highlighting
 */
export function applyThemeHighlighting(theme: EditorTheme): string {
  const themes = {
    light: {
      chord: '#0066cc',
      section: '#008080',
      meta: '#800080',
      comment: '#808080',
      directive: '#ff6600'
    },
    dark: {
      chord: '#66b3ff',
      section: '#4dd0e1',
      meta: '#ce93d8',
      comment: '#9e9e9e',
      directive: '#ffab40'
    },
    stage: {
      chord: '#fbbf24',
      section: '#f59e0b',
      meta: '#f97316',
      comment: '#d1d5db',
      directive: '#fb923c'
    }
  }
  
  const colors = themes[theme]
  
  return `
    .syntax-chord { color: ${colors.chord}; font-weight: bold; }
    .syntax-section { color: ${colors.section}; font-weight: bold; }
    .syntax-meta { color: ${colors.meta}; }
    .syntax-meta-key { font-weight: bold; }
    .syntax-meta-value { font-style: italic; }
    .syntax-comment { color: ${colors.comment}; font-style: italic; }
    .syntax-directive { color: ${colors.directive}; font-weight: bold; }
    .syntax-label { color: ${colors.section}; }
  `
}

/**
 * Create inline styles for syntax highlighting
 */
export function createInlineStyles(theme: EditorTheme): string {
  return `
    <style>
      ${applyThemeHighlighting(theme)}
    </style>
  `
}