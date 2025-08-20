/**
 * Arrangement Management Type Definitions
 * 
 * This file provides comprehensive type definitions for the arrangement management feature.
 * Key patterns and conventions:
 * 
 * 1. Auto-generated Title Pattern: "[Song Name] - [Arrangement Name]"
 *    - Example: "Amazing Grace - Contemporary Version"
 * 
 * 2. Required Key Field: Essential for transposition functionality
 * 
 * 3. Form State Management: String fields for form inputs, converted to appropriate types on submit
 * 
 * 4. Database Mapping: Snake_case database fields mapped to camelCase domain models
 * 
 * 5. Consistent Naming: Follows exact patterns from Song types for maintainability
 */

import type { Arrangement } from './song.types'

// =====================================
// CORE ARRANGEMENT TYPES
// =====================================

/**
 * Extended arrangement interface with auto-generated title pattern
 * Follows naming convention: "[Song Name] - [Arrangement Name]"
 */
export interface ArrangementWithTitle extends Arrangement {
  /** Auto-generated title following pattern: "[Song Name] - [Arrangement Name]" */
  title: string
  /** Associated song title for display purposes */
  songTitle?: string
  /** Associated song artist for display purposes */
  songArtist?: string
}

/**
 * Arrangement creation payload (before auto-generation of fields)
 */
export interface CreateArrangementPayload {
  name: string
  songIds: string[]
  key: string  // Required for transposition functionality
  tempo?: number
  timeSignature?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
  chordProText?: string
  description?: string
  notes?: string
  capo?: number
  duration?: number
  metadata?: {
    isMashup?: boolean
    mashupSections?: Array<{
      songId: string
      title: string
    }>
    isPublic: boolean
  }
}

/**
 * Arrangement update payload
 */
export interface UpdateArrangementPayload {
  id: string
  name?: string
  key?: string
  tempo?: number
  timeSignature?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
  chordProText?: string
  chordData?: string
  description?: string
  notes?: string
  capo?: number
  duration?: number
  metadata?: {
    isMashup?: boolean
    mashupSections?: Array<{
      songId: string
      title: string
    }>
    isPublic: boolean
  }
}

// =====================================
// FORM STATE INTERFACES
// =====================================

/**
 * Form state for arrangement management
 * Follows exact naming convention from Song types
 */
export interface ArrangementFormState {
  name: string
  key: string
  tempo: string  // String for form input, converted to number on submit
  timeSignature: string
  difficulty: string
  tags: string[]
  chordProText: string
  description: string
  notes: string
  capo: string  // String for form input, converted to number on submit
  duration: string  // String for form input, converted to number on submit
  isPublic: boolean
  isMashup: boolean
  mashupSections: Array<{
    songId: string
    title: string
  }>
}

/**
 * Validation errors for arrangement form fields
 * Matches FormState structure for consistent error handling
 */
export interface ArrangementValidationErrors {
  name?: string
  key?: string
  tempo?: string
  timeSignature?: string
  difficulty?: string
  tags?: string
  chordProText?: string
  description?: string
  notes?: string
  capo?: string
  duration?: string
  mashupSections?: string
  general?: string  // For non-field-specific errors
}

// =====================================
// COMPONENT PROPS INTERFACES
// =====================================

/**
 * Props for ArrangementManagementForm component
 */
export interface ArrangementManagementFormProps {
  /** Existing arrangement for editing (optional) */
  arrangement?: Arrangement
  /** Associated song ID for new arrangements */
  songId?: string
  /** Associated song for context display */
  song?: {
    id: string
    title: string
    artist?: string
  }
  /** Success callback with created/updated arrangement */
  onSuccess?: (arrangement: Arrangement) => void
  /** Cancel callback */
  onCancel?: () => void
  /** Whether form is displayed in modal */
  isModal?: boolean
  /** Whether to show advanced options */
  showAdvancedOptions?: boolean
}

/**
 * Props for ArrangementManagementModal component
 */
export interface ArrangementManagementModalProps {
  /** Modal visibility state */
  isOpen: boolean
  /** Close modal callback */
  onClose: () => void
  /** Existing arrangement for editing (optional) */
  arrangement?: Arrangement
  /** Associated song ID for new arrangements */
  songId?: string
  /** Associated song for context display */
  song?: {
    id: string
    title: string
    artist?: string
  }
  /** Success callback with created/updated arrangement */
  onSuccess?: (arrangement: Arrangement) => void
}

/**
 * Props for ArrangementSelector component
 */
export interface ArrangementSelectorProps {
  /** Available arrangements to select from */
  arrangements: Arrangement[]
  /** Currently selected arrangement ID */
  selectedArrangementId?: string
  /** Selection change callback */
  onSelectionChange: (arrangementId: string | undefined) => void
  /** Whether selector is disabled */
  disabled?: boolean
  /** Loading state */
  loading?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Allow clearing selection */
  allowClear?: boolean
}

/**
 * Props for ArrangementCard component
 */
export interface ArrangementCardProps {
  /** Arrangement to display */
  arrangement: ArrangementWithTitle
  /** Whether card is selected */
  selected?: boolean
  /** Click handler */
  onClick?: (arrangement: Arrangement) => void
  /** Edit handler */
  onEdit?: (arrangement: Arrangement) => void
  /** Delete handler */
  onDelete?: (arrangement: Arrangement) => void
  /** Whether to show actions */
  showActions?: boolean
  /** Compact display mode */
  compact?: boolean
}

/**
 * Props for ArrangementList component
 */
export interface ArrangementListProps {
  /** Arrangements to display */
  arrangements: ArrangementWithTitle[]
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: string
  /** Empty state message */
  emptyMessage?: string
  /** Selection handlers */
  onSelect?: (arrangement: Arrangement) => void
  onEdit?: (arrangement: Arrangement) => void
  onDelete?: (arrangement: Arrangement) => void
  /** Whether to show actions */
  showActions?: boolean
  /** Layout mode */
  layout?: 'grid' | 'list'
  /** Filtering and sorting */
  filter?: ArrangementFilter
  onFilterChange?: (filter: ArrangementFilter) => void
}

// =====================================
// SERVICE INTERFACES
// =====================================

/**
 * Arrangement service interface for data operations
 */
export interface ArrangementService {
  /** Create new arrangement */
  createArrangement: (payload: CreateArrangementPayload) => Promise<Arrangement>
  /** Update existing arrangement */
  updateArrangement: (payload: UpdateArrangementPayload) => Promise<Arrangement>
  /** Delete arrangement */
  deleteArrangement: (id: string) => Promise<void>
  /** Get arrangement by ID */
  getArrangement: (id: string) => Promise<Arrangement>
  /** Get arrangements by song ID */
  getArrangementsBySong: (songId: string) => Promise<Arrangement[]>
  /** Search arrangements */
  searchArrangements: (query: ArrangementSearchParams) => Promise<ArrangementSearchResponse>
}

/**
 * Mutation hook options for arrangement operations
 */
export interface UseArrangementMutationsProps {
  /** Success callback */
  onSuccess?: (data: unknown) => void
  /** Error callback */
  onError?: (error: Error) => void
  /** Loading state callback */
  onMutate?: () => void
  /** Settlement callback (success or error) */
  onSettled?: () => void
}

/**
 * Create arrangement hook options
 */
export interface UseCreateArrangementOptions extends UseArrangementMutationsProps {
  /** Auto-redirect after creation */
  autoRedirect?: boolean
  /** Cache invalidation options */
  invalidateQueries?: string[]
}

/**
 * Update arrangement hook options
 */
export interface UseUpdateArrangementOptions extends UseArrangementMutationsProps {
  /** Optimistic updates */
  optimisticUpdate?: boolean
  /** Cache invalidation options */
  invalidateQueries?: string[]
}

/**
 * Delete arrangement hook options
 */
export interface UseDeleteArrangementOptions extends UseArrangementMutationsProps {
  /** Confirmation required */
  requireConfirmation?: boolean
  /** Cache cleanup options */
  cleanupCache?: boolean
}

// =====================================
// DATABASE MAPPING TYPES
// =====================================

/**
 * Database row type for arrangements table (Supabase)
 */
export interface ArrangementRow {
  id: string
  name: string
  slug: string
  song_ids: string[]  // PostgreSQL array column
  key: string
  tempo: number | null
  time_signature: string | null
  difficulty: string
  tags: string[]  // PostgreSQL array column
  chord_data: string | null  // ChordPro text stored as chord_data
  chord_pro_text: string | null  // Alias field
  description: string | null
  notes: string | null
  capo: number | null
  duration: number | null
  created_by: string
  created_at: string
  updated_at: string
  // Metadata stored as JSONB
  metadata: {
    is_mashup?: boolean
    mashup_sections?: Array<{
      song_id: string
      title: string
    }>
    is_public: boolean
    ratings?: {
      average: number
      count: number
    }
    views: number
  } | null
}

/**
 * Database insert type for arrangements
 */
export interface ArrangementInsert {
  id?: string  // Auto-generated if not provided
  name: string
  slug: string
  song_ids: string[]
  key: string
  tempo?: number
  time_signature?: string
  difficulty: string
  tags?: string[]
  chord_data?: string
  chord_pro_text?: string
  description?: string
  notes?: string
  capo?: number
  duration?: number
  created_by: string
  metadata?: ArrangementRow['metadata']
}

/**
 * Database update type for arrangements
 */
export interface ArrangementUpdate {
  name?: string
  slug?: string
  song_ids?: string[]
  key?: string
  tempo?: number
  time_signature?: string
  difficulty?: string
  tags?: string[]
  chord_data?: string
  chord_pro_text?: string
  description?: string
  notes?: string
  capo?: number
  duration?: number
  metadata?: ArrangementRow['metadata']
  updated_at?: string
}

/**
 * Mapping utility types for database conversions
 */
export interface ArrangementMappingUtils {
  /** Convert database row to domain model */
  fromDatabase: (row: ArrangementRow) => Arrangement
  /** Convert domain model to database insert */
  toDatabase: (arrangement: CreateArrangementPayload, userId: string) => ArrangementInsert
  /** Convert domain update to database update */
  toUpdate: (update: UpdateArrangementPayload) => ArrangementUpdate
  /** Generate auto-title from song and arrangement names */
  generateTitle: (songTitle: string, arrangementName: string) => string
}

// =====================================
// SEARCH AND FILTER TYPES
// =====================================

/**
 * Arrangement search parameters
 */
export interface ArrangementSearchParams {
  /** Text search query */
  query?: string
  /** Song ID filter */
  songId?: string
  /** Musical key filter */
  key?: string
  /** Tempo range filter */
  tempoRange?: {
    min?: number
    max?: number
  }
  /** Difficulty filter */
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  /** Tags filter */
  tags?: string[]
  /** Time signature filter */
  timeSignature?: string
  /** Capo position filter */
  capo?: number
  /** Duration range filter (in seconds) */
  durationRange?: {
    min?: number
    max?: number
  }
  /** Creator filter */
  createdBy?: string
  /** Public/private filter */
  isPublic?: boolean
  /** Mashup filter */
  isMashup?: boolean
  /** Pagination */
  page?: number
  limit?: number
  /** Sorting */
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'difficulty' | 'tempo'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Arrangement search response
 */
export interface ArrangementSearchResponse {
  arrangements: ArrangementWithTitle[]
  total: number
  page: number
  pages: number
  hasMore: boolean
}

/**
 * Arrangement filter for UI components
 */
export interface ArrangementFilter {
  searchQuery?: string
  key?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
  tempoRange?: {
    min?: number
    max?: number
  }
  timeSignature?: string
  showPublicOnly?: boolean
  showMashupsOnly?: boolean
}

// =====================================
// MODAL AND UI STATE TYPES
// =====================================

/**
 * Modal state for arrangement management
 */
export interface ArrangementModalState {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  arrangement?: Arrangement
  songId?: string
  song?: {
    id: string
    title: string
    artist?: string
  }
}

/**
 * Hook return type for arrangement management modal
 */
export interface UseArrangementManagementModal {
  /** Modal state */
  modalState: ArrangementModalState
  /** Open modal for creating new arrangement */
  openCreateModal: (songId: string, song?: { id: string; title: string; artist?: string }) => void
  /** Open modal for editing arrangement */
  openEditModal: (arrangement: Arrangement) => void
  /** Open modal for viewing arrangement */
  openViewModal: (arrangement: Arrangement) => void
  /** Close modal */
  closeModal: () => void
  /** Handle arrangement creation/update success */
  handleSuccess: (arrangement: Arrangement) => void
}

// =====================================
// VALIDATION AND SCHEMA TYPES
// =====================================

/**
 * Arrangement form validation result
 */
export interface ArrangementValidationResult {
  isValid: boolean
  errors: ArrangementValidationErrors
  warnings?: Partial<ArrangementValidationErrors>
}

/**
 * ChordPro validation result
 */
export interface ChordProValidationResult {
  isValid: boolean
  hasChords: boolean
  hasDirectives: boolean
  extractedTitle?: string
  extractedKey?: string
  warnings: string[]
  errors: string[]
}

/**
 * Mashup validation result
 */
export interface MashupValidationResult {
  isValid: boolean
  sections: Array<{
    songId: string
    title: string
    isValid: boolean
    error?: string
  }>
  duplicateSongs: string[]
  errors: string[]
}

// =====================================
// EXPORT CONVENIENCE TYPES
// =====================================

/**
 * All arrangement-related types for convenient importing
 */
export type {
  // Re-export from song.types for convenience
  Arrangement
} from './song.types'

/**
 * Common arrangement field names for form handling
 */
export type ArrangementFieldName = 
  | 'name'
  | 'key' 
  | 'tempo'
  | 'timeSignature'
  | 'difficulty'
  | 'tags'
  | 'chordProText'
  | 'description'
  | 'notes'
  | 'capo'
  | 'duration'
  | 'isPublic'
  | 'isMashup'
  | 'mashupSections'

/**
 * Arrangement difficulty levels
 */
export type ArrangementDifficulty = 'beginner' | 'intermediate' | 'advanced'

/**
 * Arrangement sort options
 */
export type ArrangementSortBy = 'name' | 'created_at' | 'updated_at' | 'difficulty' | 'tempo'

/**
 * Arrangement layout modes
 */
export type ArrangementLayout = 'grid' | 'list'

/**
 * Arrangement modal modes
 */
export type ArrangementModalMode = 'create' | 'edit' | 'view'