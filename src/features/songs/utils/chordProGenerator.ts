import { splitArrangementName } from './arrangementNaming'
import type { ArrangementFormData } from '../validation/schemas/arrangementSchema'

export interface ChordProGeneratorOptions {
  songTitle?: string
  arrangementName?: string
  key?: string
  tempo?: number
  timeSignature?: string
  includeTemplate?: boolean
}

/**
 * Generates initial ChordPro content from arrangement form data
 */
export function generateInitialChordPro(
  formData: Partial<ArrangementFormData>,
  songTitle?: string
): string {

  const { arrangementSuffix } = splitArrangementName(formData.name || '', songTitle)

  const lines: string[] = []

  // Title directive
  if (songTitle) {
    lines.push(`{title: ${songTitle}}`)
  }

  // Subtitle directive (arrangement name)
  if (arrangementSuffix) {
    lines.push(`{subtitle: ${arrangementSuffix}}`)
  }

  // Key directive
  if (formData.key) {
    lines.push(`{key: ${formData.key}}`)
  }

  // Tempo directive
  if (formData.tempo) {
    lines.push(`{tempo: ${formData.tempo}}`)
  }

  // Time signature directive
  if (formData.timeSignature) {
    lines.push(`{time: ${formData.timeSignature}}`)
  }

  // Add empty line after directives
  if (lines.length > 0) {
    lines.push('')
  }

  // Add basic template structure using Nashville numbers
  lines.push(
    '[Intro]',
    '[| ][I][] | ][I][] |]',
    '',
    '[Verse 1]',
    '[I]Add your lyrics here with [V]chords above each syllable',
    '[vi]Each line shows the chord [IV]changes throughout',
    '',
    '[Chorus]',
    '[I]This is where the [V]chorus lyrics go',
    '[vi]With the main [IV]melody and [I]hook',
    '',
    '[Verse 2]',
    '[I]Second verse continues the [V]story here',
    '[vi]Building on the first [IV]verse theme',
    '',
    '[Bridge]',
    '[vi]This section provides [IV]contrast',
    '[I]Leading back to the [V]final chorus',
    '',
    '[Outro]',
    '[| ][vi][] | ][IV][] | ][I][] |]'
  )

  // Convert Nashville numbers to actual chords based on key
  let content = lines.join('\n')

  if (formData.key) {
    const chords = getNashvilleChords(formData.key)

    content = content
      .replace(/\[I\]/g, `[${chords.I}]`)
      .replace(/\[IV\]/g, `[${chords.IV}]`)
      .replace(/\[V\]/g, `[${chords.V}]`)
      .replace(/\[vi\]/g, `[${chords.vi}]`)
  }

  return content
}

/**
 * Converts Nashville numbers to actual chords for a given key
 */
function getNashvilleChords(key: string): {
  I: string
  IV: string
  V: string
  vi: string
} {
  const isMinor = key.endsWith('m')
  const baseKey = key.replace('m', '')

  // Chromatic circle for major keys
  const chromaticKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

  // Handle enharmonic equivalents
  const keyMap: { [key: string]: string } = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  }

  const normalizedKey = keyMap[baseKey] || baseKey
  const keyIndex = chromaticKeys.indexOf(normalizedKey)

  if (keyIndex === -1) {
    // Fallback for unknown keys
    return { I: key, IV: 'IV', V: 'V', vi: 'vi' }
  }

  // Calculate Nashville number positions (0-based indexing)
  const getChordAtInterval = (interval: number): string => {
    const chordIndex = (keyIndex + interval) % 12
    return chromaticKeys[chordIndex]
  }

  if (isMinor) {
    // Minor key Nashville numbers
    return {
      I: key,                                    // i (minor tonic)
      IV: getChordAtInterval(5),                // IV (major subdominant)
      V: getChordAtInterval(7),                 // V (major dominant)
      vi: getChordAtInterval(9)                 // VI (relative major)
    }
  } else {
    // Major key Nashville numbers
    return {
      I: baseKey,                               // I (major tonic)
      IV: getChordAtInterval(5),                // IV (major subdominant)
      V: getChordAtInterval(7),                 // V (major dominant)
      vi: getChordAtInterval(9) + 'm'           // vi (relative minor)
    }
  }
}

/**
 * Generates a basic ChordPro template with just structure (no specific chords)
 */
export function generateBasicChordProTemplate(
  title?: string,
  subtitle?: string
): string {
  const lines: string[] = []

  if (title) {
    lines.push(`{title: ${title}}`)
  }

  if (subtitle) {
    lines.push(`{subtitle: ${subtitle}}`)
  }

  lines.push(
    '',
    '[Verse 1]',
    'Add your lyrics here...',
    '',
    '[Chorus]',
    'Chorus lyrics here...',
    '',
    '[Verse 2]',
    'Second verse here...',
    ''
  )

  return lines.join('\n')
}

/**
 * Updates existing ChordPro content with new metadata
 */
export function updateChordProMetadata(
  existingContent: string,
  formData: Partial<ArrangementFormData>,
  songTitle?: string
): string {
  let content = existingContent
  const { arrangementSuffix } = splitArrangementName(formData.name || '', songTitle)

  // Update or add title
  if (songTitle) {
    if (content.includes('{title:')) {
      content = content.replace(/\{title:[^}]*\}/g, `{title: ${songTitle}}`)
    } else {
      content = `{title: ${songTitle}}\n${content}`
    }
  }

  // Update or add subtitle
  if (arrangementSuffix) {
    if (content.includes('{subtitle:')) {
      content = content.replace(/\{subtitle:[^}]*\}/g, `{subtitle: ${arrangementSuffix}}`)
    } else {
      // Add after title if present, or at the beginning
      const titleMatch = content.match(/(\{title:[^}]*\})/g)
      if (titleMatch) {
        content = content.replace(titleMatch[0], `${titleMatch[0]}\n{subtitle: ${arrangementSuffix}}`)
      } else {
        content = `{subtitle: ${arrangementSuffix}}\n${content}`
      }
    }
  }

  // Update or add key
  if (formData.key) {
    if (content.includes('{key:')) {
      content = content.replace(/\{key:[^}]*\}/g, `{key: ${formData.key}}`)
    } else {
      content = addDirectiveAfterTitles(content, `{key: ${formData.key}}`)
    }
  }

  // Update or add tempo
  if (formData.tempo) {
    if (content.includes('{tempo:')) {
      content = content.replace(/\{tempo:[^}]*\}/g, `{tempo: ${formData.tempo}}`)
    } else {
      content = addDirectiveAfterTitles(content, `{tempo: ${formData.tempo}}`)
    }
  }

  // Update or add time signature
  if (formData.timeSignature) {
    if (content.includes('{time:')) {
      content = content.replace(/\{time:[^}]*\}/g, `{time: ${formData.timeSignature}}`)
    } else {
      content = addDirectiveAfterTitles(content, `{time: ${formData.timeSignature}}`)
    }
  }

  return content
}

/**
 * Helper function to add directives after title/subtitle but before the main content
 */
function addDirectiveAfterTitles(content: string, directive: string): string {
  const lines = content.split('\n')
  let insertIndex = 0

  // Find the last title/subtitle directive
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\{(title|subtitle):/)) {
      insertIndex = i + 1
    } else if (lines[i].match(/^\{/)) {
      // This is another directive, insert before it
      break
    } else if (lines[i].trim() && !lines[i].startsWith('{')) {
      // This is actual content, insert before it
      break
    }
  }

  lines.splice(insertIndex, 0, directive)
  return lines.join('\n')
}
