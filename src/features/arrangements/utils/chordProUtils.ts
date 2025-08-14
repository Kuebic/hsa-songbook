/**
 * @file chordProUtils.ts
 * @description Utility functions for ChordPro processing
 */

/**
 * Extract the key from ChordPro content
 * Looks for {key: X} or {key:X} directive
 */
export function extractKeyFromChordPro(content: string): string | null {
  if (!content) return null
  
  // Match {key: X} or {key:X} directive (case-insensitive)
  const keyMatch = content.match(/\{key:\s*([A-G][#b]?m?)\}/i)
  
  if (keyMatch && keyMatch[1]) {
    return keyMatch[1]
  }
  
  return null
}

/**
 * Update the key directive in ChordPro content
 */
export function updateKeyDirective(content: string, newKey: string): string {
  // Check if key directive exists
  const hasKeyDirective = /\{key:\s*[^}]+\}/i.test(content)
  
  if (hasKeyDirective) {
    // Replace existing key directive
    return content.replace(/\{key:\s*[^}]+\}/i, `{key: ${newKey}}`)
  } else {
    // Add key directive after title if exists, otherwise at the beginning
    const titleMatch = content.match(/(\{title:[^}]+\})/i)
    if (titleMatch) {
      const titleEnd = titleMatch.index! + titleMatch[0].length
      return content.slice(0, titleEnd) + `\n{key: ${newKey}}` + content.slice(titleEnd)
    } else {
      return `{key: ${newKey}}\n${content}`
    }
  }
}

/**
 * Extract all metadata from ChordPro content
 */
export function extractChordProMetadata(content: string): Record<string, string> {
  const metadata: Record<string, string> = {}
  
  if (!content) return metadata
  
  // Match all {directive: value} patterns
  const directivePattern = /\{([^:}]+):\s*([^}]+)\}/g
  let match
  
  while ((match = directivePattern.exec(content)) !== null) {
    const directive = match[1].toLowerCase().trim()
    const value = match[2].trim()
    metadata[directive] = value
  }
  
  return metadata
}

/**
 * Check if content has ChordPro directives
 */
export function hasChordProDirectives(content: string): boolean {
  return /\{[^:}]+:[^}]+\}/.test(content)
}

/**
 * Get display name for a key (handles enharmonic equivalents)
 */
export function getKeyDisplayName(key: string): string {
  // Map of preferred display names for keys
  const keyDisplayMap: Record<string, string> = {
    'C#': 'C♯/D♭',
    'Db': 'C♯/D♭',
    'D#': 'D♯/E♭',
    'Eb': 'D♯/E♭',
    'F#': 'F♯/G♭',
    'Gb': 'F♯/G♭',
    'G#': 'G♯/A♭',
    'Ab': 'G♯/A♭',
    'A#': 'A♯/B♭',
    'Bb': 'A♯/B♭',
    // Minor keys
    'C#m': 'C♯m/D♭m',
    'Dbm': 'C♯m/D♭m',
    'D#m': 'D♯m/E♭m',
    'Ebm': 'D♯m/E♭m',
    'F#m': 'F♯m/G♭m',
    'Gbm': 'F♯m/G♭m',
    'G#m': 'G♯m/A♭m',
    'Abm': 'G♯m/A♭m',
    'A#m': 'A♯m/B♭m',
    'Bbm': 'A♯m/B♭m'
  }
  
  return keyDisplayMap[key] || key
}