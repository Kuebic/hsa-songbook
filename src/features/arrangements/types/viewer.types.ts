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
  onFontSizeChange: (size: number) => void
  scrollSpeed: number
  onScrollSpeedChange: (speed: number) => void
  isScrolling: boolean
  onToggleScroll: () => void
  isMinimalMode: boolean
  onToggleMinimalMode: () => void
}

export interface ArrangementViewerData {
  id: string
  name: string
  slug: string
  songTitle?: string
  artist?: string
  key?: string
  tempo?: number
  timeSignature?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  chordProText: string
  createdBy?: string
  tags?: string[]
}

export interface ChordSheetSettings {
  fontSize: number
  fontFamily: string
  scrollSpeed: number
  isScrolling: boolean
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