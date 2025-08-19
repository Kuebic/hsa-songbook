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
  
  // Add basic template structure
  lines.push(
    '[Intro]',
    '| [Key] | [Key] |',
    '',
    '[Verse 1]',
    '[Key]Add your lyrics here with [Progression]chords above each syllable',
    '[Key]Each line shows the chord [Progression]changes throughout',
    '',
    '[Chorus]',
    '[Key]This is where the [Progression]chorus lyrics go',
    '[Key]With the main [Progression]melody and [Key]hook',
    '',
    '[Verse 2]',
    '[Key]Second verse continues the [Progression]story',
    '[Key]Building on the first [Progression]verse theme',
    '',
    '[Bridge]',
    '[Different]This section provides [Musical]contrast',
    '[Resolution]Leading back to the [Key]final chorus',
    '',
    '[Outro]',
    '| [Key] | [Resolution] |'
  )
  
  // Replace placeholder [Key] with actual key if available
  let content = lines.join('\n')
  if (formData.key) {
    // Simple chord progression suggestions based on key
    const progressions = getBasicProgressions(formData.key)
    content = content
      .replace(/\[Key\]/g, `[${formData.key}]`)
      .replace(/\[Progression\]/g, `[${progressions.progression}]`)
      .replace(/\[Different\]/g, `[${progressions.bridge}]`)
      .replace(/\[Musical\]/g, `[${progressions.dominant}]`)
      .replace(/\[Resolution\]/g, `[${progressions.resolution}]`)
  }
  
  return content
}

/**
 * Gets basic chord progressions for a given key
 */
function getBasicProgressions(key: string): {
  progression: string
  bridge: string
  dominant: string
  resolution: string
} {
  // Remove 'm' for minor keys to get the base note
  const baseKey = key.replace('m', '')
  const isMinor = key.endsWith('m')
  
  // Simple chord mapping - this could be enhanced
  const majorProgressions = {
    'C': { progression: 'F', bridge: 'Am', dominant: 'G', resolution: 'F' },
    'G': { progression: 'C', bridge: 'Em', dominant: 'D', resolution: 'C' },
    'D': { progression: 'G', bridge: 'Bm', dominant: 'A', resolution: 'G' },
    'A': { progression: 'D', bridge: 'F#m', dominant: 'E', resolution: 'D' },
    'E': { progression: 'A', bridge: 'C#m', dominant: 'B', resolution: 'A' },
    'B': { progression: 'E', bridge: 'G#m', dominant: 'F#', resolution: 'E' },
    'F#': { progression: 'B', bridge: 'D#m', dominant: 'C#', resolution: 'B' },
    'F': { progression: 'Bb', bridge: 'Dm', dominant: 'C', resolution: 'Bb' },
    'Bb': { progression: 'Eb', bridge: 'Gm', dominant: 'F', resolution: 'Eb' },
    'Eb': { progression: 'Ab', bridge: 'Cm', dominant: 'Bb', resolution: 'Ab' },
    'Ab': { progression: 'Db', bridge: 'Fm', dominant: 'Eb', resolution: 'Db' },
    'Db': { progression: 'Gb', bridge: 'Bbm', dominant: 'Ab', resolution: 'Gb' },
  }
  
  const minorProgressions = {
    'C': { progression: 'F', bridge: 'G', dominant: 'G', resolution: 'F' },
    'G': { progression: 'C', bridge: 'D', dominant: 'D', resolution: 'C' },
    'D': { progression: 'G', bridge: 'A', dominant: 'A', resolution: 'G' },
    'A': { progression: 'D', bridge: 'E', dominant: 'E', resolution: 'D' },
    'E': { progression: 'A', bridge: 'B', dominant: 'B', resolution: 'A' },
    'B': { progression: 'E', bridge: 'F#', dominant: 'F#', resolution: 'E' },
    'F#': { progression: 'B', bridge: 'C#', dominant: 'C#', resolution: 'B' },
    'F': { progression: 'Bb', bridge: 'C', dominant: 'C', resolution: 'Bb' },
    'Bb': { progression: 'Eb', bridge: 'F', dominant: 'F', resolution: 'Eb' },
    'Eb': { progression: 'Ab', bridge: 'Bb', dominant: 'Bb', resolution: 'Ab' },
    'Ab': { progression: 'Db', bridge: 'Eb', dominant: 'Eb', resolution: 'Db' },
    'Db': { progression: 'Gb', bridge: 'Ab', dominant: 'Ab', resolution: 'Gb' },
  }
  
  const progressionSet = isMinor ? minorProgressions : majorProgressions
  
  return progressionSet[baseKey as keyof typeof progressionSet] || {
    progression: 'IV',
    bridge: 'vi',
    dominant: 'V',
    resolution: 'IV'
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