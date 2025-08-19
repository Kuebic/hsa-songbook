import type { Arrangement } from '../types/song.types'

const SEPARATOR = ' - '

/**
 * Splits an arrangement name into song title and arrangement suffix
 * @param fullName - The full arrangement name (e.g., "Amazing Grace - Acoustic Version")
 * @param songTitle - The song title to use for splitting
 * @returns Object with songTitle and arrangementSuffix
 */
export function splitArrangementName(
  fullName: string, 
  songTitle?: string
): { songTitle: string; arrangementSuffix: string } {
  if (!fullName) {
    return { songTitle: songTitle || '', arrangementSuffix: '' }
  }

  // If we have a song title and the full name starts with it + separator
  if (songTitle && fullName.startsWith(songTitle + SEPARATOR)) {
    return {
      songTitle,
      arrangementSuffix: fullName.substring(songTitle.length + SEPARATOR.length)
    }
  }

  // Try to split by the separator
  const parts = fullName.split(SEPARATOR)
  if (parts.length >= 2) {
    const possibleSongTitle = parts[0]
    const suffix = parts.slice(1).join(SEPARATOR) // Handle cases with multiple separators
    
    // If we have a song title, check if it matches
    if (songTitle && possibleSongTitle === songTitle) {
      return { songTitle, arrangementSuffix: suffix }
    }
    
    // No song title provided, use what we found
    if (!songTitle) {
      return { songTitle: possibleSongTitle, arrangementSuffix: suffix }
    }
  }

  // No separator found or doesn't match expected format
  // Treat the whole name as the arrangement suffix
  return { songTitle: songTitle || '', arrangementSuffix: fullName }
}

/**
 * Combines a song title and arrangement suffix into a full name
 * @param songTitle - The song title
 * @param arrangementSuffix - The arrangement-specific part (e.g., "Acoustic Version")
 * @returns The combined full name
 */
export function combineArrangementName(
  songTitle: string, 
  arrangementSuffix: string
): string {
  if (!songTitle && !arrangementSuffix) return ''
  if (!songTitle) return arrangementSuffix
  if (!arrangementSuffix) return songTitle
  
  return `${songTitle}${SEPARATOR}${arrangementSuffix}`
}

/**
 * Gets the display name for an arrangement based on context
 * @param arrangement - The arrangement object
 * @param context - Where the arrangement is being displayed
 * @param songTitle - Optional song title for splitting/combining
 * @returns The appropriate display name
 */
export function getArrangementDisplayName(
  arrangement: Arrangement | undefined,
  context: 'song' | 'setlist' | 'editor',
  songTitle?: string
): string {
  if (!arrangement) return 'Unknown Arrangement'
  
  const { arrangementSuffix } = splitArrangementName(arrangement.name, songTitle)
  
  switch (context) {
    case 'song':
      // On song page, show only the suffix (or full name if no separator)
      return arrangementSuffix || arrangement.name
    
    case 'setlist':
      // In setlist, always show full name
      // If we have a song title and the name doesn't include it, combine them
      if (songTitle && !arrangement.name.includes(songTitle)) {
        return combineArrangementName(songTitle, arrangement.name)
      }
      return arrangement.name
    
    case 'editor':
      // In editor, show the full name
      return arrangement.name
      
    default:
      return arrangement.name
  }
}

/**
 * Generates a default arrangement suffix if none provided
 * @param existingArrangements - List of existing arrangements to avoid duplicates
 * @returns A unique default suffix
 */
export function generateDefaultArrangementSuffix(
  existingArrangements: Arrangement[] = []
): string {
  const baseSuffixes = ['Standard', 'Version 2', 'Version 3', 'Alternative', 'Simplified']
  
  for (const suffix of baseSuffixes) {
    const wouldBeDuplicate = existingArrangements.some(arr => {
      const { arrangementSuffix } = splitArrangementName(arr.name)
      return arrangementSuffix === suffix
    })
    
    if (!wouldBeDuplicate) {
      return suffix
    }
  }
  
  // If all base suffixes are taken, generate a numbered version
  let versionNum = existingArrangements.length + 1
  let suffix = `Version ${versionNum}`
  
  while (existingArrangements.some(arr => {
    const { arrangementSuffix } = splitArrangementName(arr.name)
    return arrangementSuffix === suffix
  })) {
    versionNum++
    suffix = `Version ${versionNum}`
  }
  
  return suffix
}