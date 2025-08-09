/**
 * Song validation module exports
 * 
 * This module provides comprehensive validation utilities for songs and arrangements,
 * including duplicate detection, theme normalization, slug generation, and Zod schemas.
 */

// Constants
export { THEME_MAPPINGS, NORMALIZED_THEMES } from './constants/themes'
export { SONG_SOURCES } from './constants/sources'
export { MUSICAL_KEYS, TIME_SIGNATURES, DIFFICULTY_LEVELS } from './constants/musicalKeys'

// Utilities
export { levenshteinDistance } from './utils/levenshtein'
export {
  normalizeTheme,
  normalizeThemes,
  getSuggestedThemes,
  isValidTheme,
  themeStats,
  type ThemeStats
} from './utils/themeNormalization'
export {
  normalizeTitle,
  findSimilarSongs,
  isDuplicateSong,
  getDuplicateSummary,
  type SimilarSong,
  type SimilarityLevel,
  type DuplicateDetectionOptions
} from './utils/duplicateDetection'
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
} from './utils/slugGeneration'

// Schemas
export {
  songFormSchema,
  updateSongFormSchema,
  songFieldSchemas,
  songSearchSchema,
  batchSongOperationSchema,
  songExportSchema,
  songImportSchema,
  songValidationHelpers,
  createSongSchema,
  type SongFormData,
  type UpdateSongFormData,
  type SongFieldName,
  type SongSearchParams,
  type BatchSongOperation,
  type SongExportOptions,
  type SongImportOptions
} from './schemas/songFormSchema'
export {
  arrangementSchema,
  updateArrangementSchema,
  arrangementFieldSchemas,
  chordProValidation,
  createArrangementSchema,
  type ArrangementFormData,
  type UpdateArrangementFormData,
  type ArrangementFieldName
} from './schemas/arrangementSchema'

// Hooks
export {
  useDuplicateDetection,
  useRealtimeDuplicateDetection
} from './hooks/useDuplicateDetection'
export {
  useSlugGeneration,
  useAutoSlugGeneration
} from './hooks/useSlugGeneration'