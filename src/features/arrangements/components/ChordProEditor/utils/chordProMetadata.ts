/**
 * @file chordProMetadata.ts
 * @description Utility functions for extracting metadata from ChordPro content
 */

/**
 * Helper function to extract metadata from ChordPro content
 */
export function extractChordProMetadata(content: string): Record<string, string> {
  const metadata: Record<string, string> = {}
  
  // Extract directives with values
  const directiveRegex = /\{([^:}]+):([^}]*)\}/g
  let match
  
  while ((match = directiveRegex.exec(content)) !== null) {
    const [, key, value] = match
    metadata[key.toLowerCase().trim()] = value.trim()
  }
  
  return metadata
}

/**
 * Extract the key from ChordPro content
 */
export function getKeyFromMetadata(content: string): string | null {
  const metadata = extractChordProMetadata(content)
  return metadata.key || null
}

/**
 * Basic chord validation to prevent false positives
 */
export function isValidChord(chord: string): boolean {
  // Remove whitespace
  chord = chord.trim()
  
  // Empty chord is not valid
  if (!chord) return false
  
  // Basic chord pattern: Root note + optional accidentals + optional chord quality
  // Examples: C, C#, Cm, C7, Cmaj7, C#m7b5, Dsus4, etc.
  const chordPattern = /^[A-G][#b]?(?:maj|min|m|M|dim|aug|sus|add)?(?:\d+)?(?:[#b]\d+)?(?:\/[A-G][#b]?)?$/
  
  return chordPattern.test(chord)
}