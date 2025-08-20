/**
 * Main export file for all song-related types
 * Provides convenient access to all type definitions
 */

// Core types
export * from './song.types'
export * from './review.types'
export * from './arrangement.types'

// Re-export commonly used types for easier imports
export type {
  Song,
  Arrangement,
  SongMetadata,
  SongFilter
} from './song.types'

export type {
  Review,
  ReviewFormData,
  ReviewStats
} from './review.types'

export type {
  ArrangementWithTitle,
  ArrangementFormState,
  ArrangementValidationErrors,
  ArrangementManagementFormProps,
  ArrangementManagementModalProps,
  CreateArrangementPayload,
  UpdateArrangementPayload
} from './arrangement.types'