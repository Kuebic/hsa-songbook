import { levenshteinDistance } from './levenshtein'
import type { Song } from '../../types/song.types'

/**
 * Normalize a title for comparison by removing punctuation and standardizing spaces
 * 
 * @param title - Title to normalize
 * @returns Normalized title string
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')         // Normalize spaces
    .trim()
}

/**
 * Similarity level for detected duplicates
 */
export type SimilarityLevel = 'exact' | 'very-similar' | 'similar'

/**
 * Similar song detection result
 */
export interface SimilarSong {
  song: Song
  similarity: SimilarityLevel
  distance: number
  matchedOn: {
    title: boolean
    artist: boolean
  }
}

/**
 * Options for duplicate detection
 */
export interface DuplicateDetectionOptions {
  /** Maximum Levenshtein distance for "very similar" matches (default: 3) */
  verySimilarThreshold?: number
  /** Maximum Levenshtein distance for "similar" matches (default: 5) */
  similarThreshold?: number
  /** Minimum title length to apply similar threshold (default: 10) */
  minLengthForSimilar?: number
  /** Whether to check artist similarity (default: true) */
  checkArtist?: boolean
  /** Maximum number of results to return (default: 10) */
  maxResults?: number
}

/**
 * Find songs similar to the given title and artist
 * 
 * @param title - Song title to check
 * @param existingSongs - Array of existing songs to check against
 * @param artist - Optional artist name
 * @param options - Detection options
 * @returns Array of similar songs sorted by distance (most similar first)
 */
export function findSimilarSongs(
  title: string,
  existingSongs: Song[],
  artist?: string,
  options: DuplicateDetectionOptions = {}
): SimilarSong[] {
  const {
    verySimilarThreshold = 3,
    similarThreshold = 5,
    minLengthForSimilar = 10,
    checkArtist = true,
    maxResults = 10
  } = options
  
  const normalizedTitle = normalizeTitle(title)
  const normalizedArtist = artist && checkArtist ? normalizeTitle(artist) : ''
  
  const similar: SimilarSong[] = []
  
  for (const song of existingSongs) {
    const songNormalizedTitle = normalizeTitle(song.title)
    const songNormalizedArtist = song.artist ? normalizeTitle(song.artist) : ''
    
    // Calculate title distance
    const titleDistance = levenshteinDistance(songNormalizedTitle, normalizedTitle)
    
    // Check for exact title match
    if (titleDistance === 0) {
      // Check artist if provided
      if (normalizedArtist && songNormalizedArtist) {
        const artistDistance = levenshteinDistance(songNormalizedArtist, normalizedArtist)
        if (artistDistance === 0) {
          // Exact match on both title and artist
          similar.push({
            song,
            similarity: 'exact',
            distance: 0,
            matchedOn: { title: true, artist: true }
          })
          continue
        } else if (artistDistance <= verySimilarThreshold) {
          // Exact title, similar artist
          similar.push({
            song,
            similarity: 'very-similar',
            distance: artistDistance,
            matchedOn: { title: true, artist: false }
          })
          continue
        }
      } else {
        // Exact title match, no artist comparison
        similar.push({
          song,
          similarity: 'exact',
          distance: 0,
          matchedOn: { title: true, artist: false }
        })
        continue
      }
    }
    
    // Check for very similar title
    if (titleDistance > 0 && titleDistance <= verySimilarThreshold) {
      similar.push({
        song,
        similarity: 'very-similar',
        distance: titleDistance,
        matchedOn: { title: false, artist: false }
      })
    }
    // Check for similar title (only for longer titles)
    else if (
      normalizedTitle.length >= minLengthForSimilar &&
      titleDistance > verySimilarThreshold &&
      titleDistance <= similarThreshold
    ) {
      similar.push({
        song,
        similarity: 'similar',
        distance: titleDistance,
        matchedOn: { title: false, artist: false }
      })
    }
  }
  
  // Sort by distance (most similar first) and limit results
  return similar
    .sort((a, b) => {
      // Sort by similarity level first
      const levelOrder = { exact: 0, 'very-similar': 1, similar: 2 }
      const levelDiff = levelOrder[a.similarity] - levelOrder[b.similarity]
      if (levelDiff !== 0) return levelDiff
      
      // Then by distance
      return a.distance - b.distance
    })
    .slice(0, maxResults)
}

/**
 * Check if a song is likely a duplicate based on title and artist
 * 
 * @param title - Song title
 * @param artist - Song artist
 * @param existingSongs - Existing songs to check against
 * @returns True if likely duplicate found
 */
export function isDuplicateSong(
  title: string,
  artist: string | undefined,
  existingSongs: Song[]
): boolean {
  const similar = findSimilarSongs(title, existingSongs, artist, {
    maxResults: 1,
    verySimilarThreshold: 2
  })
  
  return similar.length > 0 && similar[0].similarity === 'exact'
}

/**
 * Get duplicate detection summary for display
 * 
 * @param similar - Array of similar songs
 * @returns Human-readable summary
 */
export function getDuplicateSummary(similar: SimilarSong[]): string {
  if (similar.length === 0) {
    return 'No similar songs found'
  }
  
  const exact = similar.filter(s => s.similarity === 'exact')
  const verySimilar = similar.filter(s => s.similarity === 'very-similar')
  const similar_ = similar.filter(s => s.similarity === 'similar')
  
  const parts: string[] = []
  
  if (exact.length > 0) {
    parts.push(`${exact.length} exact match${exact.length > 1 ? 'es' : ''}`)
  }
  if (verySimilar.length > 0) {
    parts.push(`${verySimilar.length} very similar`)
  }
  if (similar_.length > 0) {
    parts.push(`${similar_.length} similar`)
  }
  
  return `Found ${parts.join(', ')}`
}