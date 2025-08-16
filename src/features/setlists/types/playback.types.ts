import type { Setlist, SetlistArrangement } from './setlist.types'
import type { Arrangement } from '../../songs/types/song.types'

export interface PlaybackState {
  setlist: Setlist | null
  currentIndex: number
  isPlaying: boolean
  arrangements: PopulatedArrangement[]
  keyOverrides: Map<string, string>
  history: number[]
}

export interface PopulatedArrangement extends SetlistArrangement {
  arrangement: Arrangement  // Non-optional for playback
  playbackKey?: string      // Runtime key override
}

export interface PlaybackPreferences {
  autoAdvance: boolean
  autoAdvanceDelay: number  // seconds
  fontSize: number
  scrollSpeed: number
  showChords: boolean
}

export interface PlaybackNavigationEvent {
  from: number
  to: number
  method: 'next' | 'previous' | 'jump' | 'auto'
}