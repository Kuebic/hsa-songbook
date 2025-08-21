import { splitArrangementName } from './arrangementNaming'
import type { ArrangementFormData } from '../validation/schemas/arrangementSchema'
import type { MultilingualText, LanguageCode } from '../../multilingual/types/multilingual.types'
import { multilingualService } from '../../multilingual/services/multilingualService'
import { DEFAULT_LANGUAGE } from '../../multilingual/types/multilingual.types'

export interface ChordProGeneratorOptions {
  songTitle?: string
  arrangementName?: string
  key?: string
  tempo?: number
  timeSignature?: string
  includeTemplate?: boolean
  // Multilingual options
  lyrics?: MultilingualText
  selectedLanguage?: LanguageCode
  includeLyrics?: boolean
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
    // Display hack: Using [| ][chord][] notation ensures pipe symbols 
    // stay on the same line as chords in the rendered view
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
    // Same display hack as intro for proper chord grid rendering
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
 * Generates ChordPro content with multilingual lyrics
 */
export function generateChordProWithLyrics(
  formData: Partial<ArrangementFormData>,
  songTitle?: string,
  lyrics?: MultilingualText,
  selectedLanguage?: LanguageCode,
  fallbackLanguage: LanguageCode = DEFAULT_LANGUAGE
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

  // Language directive for multilingual support
  const targetLanguage = selectedLanguage || fallbackLanguage
  if (targetLanguage !== DEFAULT_LANGUAGE) {
    lines.push(`{language: ${targetLanguage}}`)
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

  // Get lyrics content in target language
  let lyricsContent = ''
  if (lyrics && Object.keys(lyrics).length > 0) {
    lyricsContent = multilingualService.getText(lyrics, targetLanguage, fallbackLanguage)
  }

  if (lyricsContent.trim()) {
    // Parse and format existing lyrics
    const formattedLyrics = formatLyricsForChordPro(lyricsContent)
    lines.push(formattedLyrics)
  } else {
    // Add basic template structure if no lyrics available
    lines.push(
      '# No lyrics available in the selected language',
      '# Use the template below to add chords and structure',
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
  }

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
 * Format plain text lyrics for ChordPro structure
 */
function formatLyricsForChordPro(lyricsText: string): string {
  if (!lyricsText?.trim()) {
    return ''
  }

  const lines = lyricsText.trim().split('\n')
  const formattedLines: string[] = []
  let currentSection = ''
  let inSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines but preserve them for spacing
    if (!line) {
      if (inSection) {
        formattedLines.push('')
      }
      continue
    }
    
    // Check if this line looks like a section header (common patterns)
    const sectionMatch = line.match(/^(verse|chorus|bridge|intro|outro|tag|pre-?chorus|interlude)\s*(\d+)?$/i)
    
    if (sectionMatch) {
      // This is a section header
      if (inSection) {
        formattedLines.push('') // Add spacing before new section
      }
      
      const sectionName = sectionMatch[1]
      const sectionNumber = sectionMatch[2] || ''
      currentSection = `[${sectionName.charAt(0).toUpperCase() + sectionName.slice(1).toLowerCase()}${sectionNumber ? ' ' + sectionNumber : ''}]`
      
      formattedLines.push(currentSection)
      inSection = true
    } else {
      // This is a lyrics line
      if (!inSection) {
        // Start with a default Verse 1 if no section was specified
        formattedLines.push('[Verse 1]')
        inSection = true
      }
      
      // Add the lyrics line (chords will need to be added manually by the user)
      formattedLines.push(line)
    }
  }

  return formattedLines.join('\n')
}

/**
 * Generate ChordPro template with multilingual lyrics preview
 */
export function generateMultilingualChordProTemplate(
  songTitle: string,
  arrangementName: string,
  lyrics: MultilingualText,
  availableLanguages: LanguageCode[]
): string {
  const lines: string[] = []

  // Add header comment explaining multilingual options
  lines.push('# Multilingual ChordPro Template')
  lines.push(`# Available languages: ${availableLanguages.join(', ')}`)
  lines.push('# You can switch languages in the arrangement editor')
  lines.push('')

  // Basic metadata
  lines.push(`{title: ${songTitle}}`)
  lines.push(`{subtitle: ${arrangementName}}`)
  lines.push('')

  // Show lyrics preview in each available language
  for (const language of availableLanguages) {
    const langContent = lyrics[language]?.trim()
    if (langContent) {
      const langInfo = multilingualService.getLanguageDisplayName(language)
      lines.push(`# ${langInfo} lyrics preview:`)
      lines.push(`# ${langContent.split('\n').slice(0, 2).join(' ').substring(0, 80)}...`)
      lines.push('')
    }
  }

  lines.push('# The selected language lyrics will be inserted here when you create the arrangement')
  lines.push('[Verse 1]')
  lines.push('Lyrics will be automatically populated based on your language selection')
  lines.push('')

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
