/**
 * Validation utilities exports
 */

export { levenshteinDistance } from './levenshtein'
export {
  normalizeTheme,
  normalizeThemes,
  getSuggestedThemes,
  isValidTheme,
  themeStats,
  type ThemeStats
} from './themeNormalization'
export {
  normalizeTitle,
  findSimilarSongs,
  isDuplicateSong,
  getDuplicateSummary,
  type SimilarSong,
  type SimilarityLevel,
  type DuplicateDetectionOptions
} from './duplicateDetection'
export {
  slugify,
  getArtistInitials,
  generateRandomId,
  generateUniqueSlug,
  isValidSlug,
  isUniqueSlug,
  parseSlug,
  regenerateSlug,
  type SlugOptions
} from './slugGeneration'