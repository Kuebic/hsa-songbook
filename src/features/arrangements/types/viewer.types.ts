// DTO interface for server responses
export interface ArrangementDTO {
  id: string
  name: string
  slug: string
  songIds: string[]
  key: string
  tempo?: number
  timeSignature?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  chordData?: string        // Server field name
  chordProText?: string     // Alternative field for compatibility
  tags: string[]
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

// ViewModel interface for UI components
export interface ArrangementViewModel {
  id: string
  name: string
  slug: string
  songIds: string[]
  songTitle?: string
  songSlug?: string
  artist?: string
  key: string
  tempo?: number
  timeSignature?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  chordProText: string      // UI field name (always populated)
  tags: string[]
  createdBy?: string
}

// Mapper function for type-safe field transformation
export const mapDTOToViewModel = (dto: ArrangementDTO): ArrangementViewModel => {
  // Handle field mapping with graceful degradation
  let chordProText = ''
  
  // Primary field: chordData (what server returns)
  if (dto.chordData) {
    chordProText = dto.chordData
  }
  // Fallback to alternative field names (migration support)
  else if (dto.chordProText) {
    chordProText = dto.chordProText
  }
  
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    songIds: dto.songIds || [],
    key: dto.key || 'C',
    tempo: dto.tempo,
    timeSignature: dto.timeSignature,
    difficulty: dto.difficulty || 'beginner',
    chordProText,  // Mapped field
    tags: dto.tags || [],
    createdBy: dto.createdBy,
    // Additional UI fields can be populated from other sources
    songTitle: undefined,
    songSlug: undefined,
    artist: undefined
  }
}

export interface ChordSheetViewerProps {
  chordProText: string
  onCenterTap?: () => void
  className?: string
}

export interface ViewerHeaderProps {
  arrangement: ArrangementViewerData
}

import type { EnhancedTranspositionState } from '../hooks/useTransposition'

export interface ViewerControlsProps {
  // Legacy props for backward compatibility
  currentKey?: string
  onTranspose?: (semitones: number) => void
  // Enhanced transposition
  transposition?: EnhancedTranspositionState & {
    transpose: (steps: number) => void
    reset: () => void
  }
  fontSize: number
  onFontSizeChange?: (size: number) => void
  isMinimalMode: boolean
  onToggleMinimalMode?: () => void
}

export interface ArrangementViewerData {
  id: string
  name: string
  slug: string
  songIds: string[]        // Added required property
  songTitle?: string
  songSlug?: string // Add song slug for navigation
  artist?: string
  key: string
  tempo?: number
  timeSignature?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  chordProText: string
  createdBy?: string
  tags: string[]
  metadata?: {
    isPublic: boolean
    views: number
    moderationStatus?: 'pending' | 'approved' | 'rejected' | 'flagged' | null
    moderationNote?: string
  }
}

export interface ChordSheetSettings {
  fontSize: number
  fontFamily: string
}

export interface TranspositionState {
  transposition: number
  originalKey?: string
  currentKey?: string
}

export interface TranspositionResult extends TranspositionState {
  transpose: (semitones: number) => void
  reset: () => void
  transposedContent?: string
}

export interface MinimalModeState {
  isMinimal: boolean
  toggleMinimal: () => void
  isMinimalMode?: boolean
  enterMinimalMode?: () => void
  exitMinimalMode?: () => void
}