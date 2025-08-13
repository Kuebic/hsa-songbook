import React, { useMemo } from 'react'
import type { EditorTheme } from './components/ThemeSelector'

interface SyntaxHighlighterProps {
  content: string
  theme?: EditorTheme
  className?: string
}

/**
 * Enhanced syntax highlighter for ChordPro notation
 * Supports multiple themes and improved pattern recognition
 */
export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({ 
  content, 
  theme = 'light',
  className = ''
}) => {
  const highlightedContent = useMemo(() => {
    return highlightChordPro(content, theme)
  }, [content, theme])
  
  return (
    <div 
      className={`syntax-highlighter ${className}`}
      dangerouslySetInnerHTML={{ __html: highlightedContent }}
      aria-hidden="true"
      data-theme={theme}
    />
  )
}

/**
 * Highlight ChordPro syntax with proper HTML escaping and pattern recognition
 */
export function highlightChordPro(text: string, theme: EditorTheme): string {
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
      regex: /\{(start_of_chorus|end_of_chorus|soc|eoc|start_of_verse|end_of_verse|sov|eov|start_of_bridge|end_of_bridge|sob|eob|start_of_tab|end_of_tab|sot|eot)\}/gi,
      replacement: '<span class="syntax-directive">{<span class="directive-name">$1</span>}</span>'
    },
    
    // Directives with values: {title: Song Name}, {key: G}
    {
      regex: /\{([^:}]+):([^}]*)\}/g,
      replacement: '<span class="syntax-directive">{<span class="directive-name">$1</span>:<span class="directive-value">$2</span>}</span>'
    },
    
    // Simple directives: {chorus}, {verse}
    {
      regex: /\{([^}]+)\}/g,
      replacement: '<span class="syntax-directive">{<span class="directive-name">$1</span>}</span>'
    },
    
    // Annotations: [*annotation text]
    {
      regex: /\[\*([^\]]+)\]/g,
      replacement: '<span class="syntax-annotation">[*$1]</span>'
    },
    
    // Chords: [C], [Am7], [F#m], etc.
    {
      regex: /\[([^\]]+)\]/g,
      replacement: (match: string, chord: string) => {
        // Validate if it's actually a chord (basic validation)
        if (isValidChord(chord)) {
          return `<span class="syntax-chord">[<span class="chord-symbol">${chord}</span>]</span>`
        }
        return match // Return unchanged if not a valid chord
      }
    },
    
    // Section headers: Verse 1:, Chorus:, Bridge:, etc.
    {
      regex: /^(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Interlude|Refrain|Coda)(\s+\d+)?:/gim,
      replacement: '<span class="syntax-section">$1$2:</span>'
    },
    
    // Inline section markers without colons
    {
      regex: /^(VERSE|CHORUS|BRIDGE|INTRO|OUTRO|PRE-CHORUS|TAG|INTERLUDE|REFRAIN|CODA)(\s+\d+)?$/gim,
      replacement: '<span class="syntax-section">$1$2</span>'
    }
  ]
  
  // Apply patterns in order
  patterns.forEach(({ regex, replacement }) => {
    if (typeof replacement === 'string') {
      html = html.replace(regex, replacement)
    } else {
      // Handle function replacements
      html = html.replace(regex, replacement as (substring: string, ...args: string[]) => string)
    }
  })
  
  // Add line numbers if needed (optional enhancement)
  if (theme === 'stage') {
    // For stage theme, we might want to add line numbers for easier reference
    const lines = html.split('\n')
    html = lines
      .map((line, index) => {
        return `<span class="line-number">${(index + 1).toString().padStart(3, ' ')}:</span>${line}`
      })
      .join('\n')
  }
  
  return html
}

/**
 * Basic chord validation to prevent false positives
 */
function isValidChord(chord: string): boolean {
  // Remove whitespace
  chord = chord.trim()
  
  // Empty chord is not valid
  if (!chord) return false
  
  // Basic chord pattern: Root note + optional accidentals + optional chord quality
  // Examples: C, C#, Cm, C7, Cmaj7, C#m7b5, Dsus4, etc.
  const chordPattern = /^[A-G][#b]?(?:maj|min|m|M|dim|aug|sus|add)?(?:\d+)?(?:[#b]\d+)?(?:\/[A-G][#b]?)?$/
  
  return chordPattern.test(chord)
}

/**
 * Helper function to extract metadata from ChordPro content
 */
export function extractChordProMetadata(content: string): Record<string, string> {
  const metadata: Record<string, string> = {}
  
  // Extract directives with values
  const directiveRegex = /\{([^:}]+):([^}]*)\}/g
  let match
  
  while ((match = directiveRegex.exec(content)) !== null) {
    const key = match[1].trim().toLowerCase()
    const value = match[2].trim()
    
    // Store common metadata fields
    if (['title', 'artist', 'key', 'tempo', 'time', 'capo', 'duration'].includes(key)) {
      metadata[key] = value
    }
  }
  
  return metadata
}

/**
 * Helper function to get all unique chords from content
 */
export function extractChords(content: string): string[] {
  const chords = new Set<string>()
  const chordRegex = /\[([^\]]+)\]/g
  let match
  
  while ((match = chordRegex.exec(content)) !== null) {
    const chord = match[1].trim()
    if (isValidChord(chord)) {
      chords.add(chord)
    }
  }
  
  return Array.from(chords).sort()
}