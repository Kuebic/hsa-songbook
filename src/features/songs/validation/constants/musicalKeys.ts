export const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm',
  'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm'
] as const

export type MusicalKey = typeof MUSICAL_KEYS[number]

export const TIME_SIGNATURES = [
  '2/2', '2/4', '3/4', '4/4', '5/4', '6/4', '7/4',
  '3/8', '6/8', '9/8', '12/8'
] as const

export type TimeSignature = typeof TIME_SIGNATURES[number]

// Group keys by type
export const MAJOR_KEYS = MUSICAL_KEYS.filter(key => !key.endsWith('m'))
export const MINOR_KEYS = MUSICAL_KEYS.filter(key => key.endsWith('m'))

// Common keys for quick selection
export const COMMON_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Dm', 'Em', 'Gm'] as const

// Enharmonic equivalents
export const ENHARMONIC_EQUIVALENTS: Record<string, string> = {
  'C#': 'Db',
  'Db': 'C#',
  'D#': 'Eb',
  'Eb': 'D#',
  'F#': 'Gb',
  'Gb': 'F#',
  'G#': 'Ab',
  'Ab': 'G#',
  'A#': 'Bb',
  'Bb': 'A#',
  'C#m': 'Dbm',
  'Dbm': 'C#m',
  'D#m': 'Ebm',
  'Ebm': 'D#m',
  'F#m': 'Gbm',
  'Gbm': 'F#m',
  'G#m': 'Abm',
  'Abm': 'G#m',
  'A#m': 'Bbm',
  'Bbm': 'A#m'
}

// Difficulty levels for arrangements
export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number]

// Tempo ranges (following arrangement validation limits: 40-240 BPM)
export const TEMPO_RANGES = {
  LARGO: { min: 40, max: 60, label: 'Largo (Very Slow)' },
  ADAGIO: { min: 60, max: 70, label: 'Adagio (Slow)' },
  ANDANTE: { min: 70, max: 90, label: 'Andante (Walking Pace)' },
  MODERATO: { min: 90, max: 110, label: 'Moderato (Moderate)' },
  ALLEGRETTO: { min: 110, max: 130, label: 'Allegretto (Moderately Fast)' },
  ALLEGRO: { min: 130, max: 160, label: 'Allegro (Fast)' },
  VIVACE: { min: 160, max: 180, label: 'Vivace (Lively)' },
  PRESTO: { min: 180, max: 200, label: 'Presto (Very Fast)' },
  PRESTISSIMO: { min: 200, max: 240, label: 'Prestissimo (Extremely Fast)' }
} as const

// Tempo validation constants
export const TEMPO_LIMITS = {
  MIN: 40,
  MAX: 240
} as const

// Capo position constants
export const CAPO_LIMITS = {
  MIN: 0,
  MAX: 12
} as const

// Duration constants (in seconds)
export const DURATION_LIMITS = {
  MIN: 1,          // 1 second
  MAX: 3600        // 1 hour
} as const

// Common arrangement tags for quick selection
export const COMMON_ARRANGEMENT_TAGS = [
  'acoustic', 'electric', 'fingerpicking', 'strumming', 'classical',
  'jazz', 'blues', 'folk', 'pop', 'rock', 'country', 'latin',
  'solo', 'duet', 'ensemble', 'easy', 'intermediate', 'advanced',
  'slow', 'medium', 'fast', 'ballad', 'upbeat', 'contemplative'
] as const

export function getTempoLabel(bpm: number): string {
  for (const [, range] of Object.entries(TEMPO_RANGES)) {
    if (bpm >= range.min && bpm <= range.max) {
      return range.label
    }
  }
  return `${bpm} BPM`
}