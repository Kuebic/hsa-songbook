import { useState, useCallback, useEffect, useMemo } from 'react'
import type { TranspositionState } from '../types/viewer.types'
import { enharmonicService } from '../services/enharmonicService'
import { chordProService } from '../services/chordProService'

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const KEY_ALIASES: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#'
}

const MINOR_KEY_ALIASES: Record<string, string> = {
  'Bbm': 'A#m',
  'Dbm': 'C#m',
  'Ebm': 'D#m',
  'Gbm': 'F#m',
  'Abm': 'G#m'
}

function normalizeKey(key: string): string {
  // Check if it's a minor key
  if (key.endsWith('m')) {
    return MINOR_KEY_ALIASES[key] || key
  }
  return KEY_ALIASES[key] || key
}

function transposeKey(key: string, semitones: number): string {
  const isMinor = key.endsWith('m')
  const normalizedKey = normalizeKey(key)
  const baseKey = isMinor ? normalizedKey.slice(0, -1) : normalizedKey
  
  const keyIndex = KEYS.indexOf(baseKey)
  if (keyIndex === -1) return key
  
  const newIndex = (keyIndex + semitones + 12 * 100) % 12 // Ensure positive
  const newKey = KEYS[newIndex]
  
  return isMinor ? `${newKey}m` : newKey
}

function calculateSemitoneDifference(fromKey: string, toKey: string): number {
  const fromNormalized = normalizeKey(fromKey)
  const toNormalized = normalizeKey(toKey)
  
  const fromBase = fromNormalized.endsWith('m') ? fromNormalized.slice(0, -1) : fromNormalized
  const toBase = toNormalized.endsWith('m') ? toNormalized.slice(0, -1) : toNormalized
  
  const fromIndex = KEYS.indexOf(fromBase)
  const toIndex = KEYS.indexOf(toBase)
  
  if (fromIndex === -1 || toIndex === -1) return 0
  
  // Calculate the shortest path
  const diff = toIndex - fromIndex
  return diff > 6 ? diff - 12 : diff < -6 ? diff + 12 : diff
}

export interface TranspositionOptions {
  persist?: boolean
  persistKey?: string
  min?: number
  max?: number
}

export interface EnhancedTranspositionState extends TranspositionState {
  semitones: number
  canTransposeUp: boolean
  canTransposeDown: boolean
  isTransposed: boolean
}

export function useTransposition(
  originalKey?: string,
  options?: TranspositionOptions
): EnhancedTranspositionState & {
  transpose: (steps: number) => void
  setTransposition: (semitones: number) => void
  reset: () => void
  transposeToKey: (targetKey: string) => void
  toggleEnharmonic: () => void
  enharmonicPreference: 'sharp' | 'flat' | 'auto'
  isEnharmonicKey: boolean
  applyEnharmonicPreference: (content: string, preference: 'sharp' | 'flat' | 'auto') => string
} {
  const {
    persist = false,
    persistKey = 'transpose-default',
    min = -12,
    max = 12
  } = options || {}
  
  // Initialize from localStorage if persist is enabled
  const getInitialValue = () => {
    if (!persist) return 0
    const stored = localStorage.getItem(`transpose-${persistKey}`)
    if (stored) {
      const value = parseInt(stored, 10)
      if (!isNaN(value) && value >= min && value <= max) {
        return value
      }
    }
    return 0
  }
  
  const [semitones, setSemitones] = useState(getInitialValue)
  const [enharmonicPreference, setEnharmonicPreference] = useState<'sharp' | 'flat' | 'auto'>(
    enharmonicService.getPreference().preference
  )
  
  // Persist to localStorage when value changes
  useEffect(() => {
    if (persist) {
      localStorage.setItem(`transpose-${persistKey}`, semitones.toString())
    }
  }, [persist, persistKey, semitones])
  
  const transpose = useCallback((steps: number) => {
    setSemitones(prev => {
      const newValue = prev + steps
      // Clamp to min/max
      return Math.max(min, Math.min(max, newValue))
    })
  }, [min, max])
  
  const setTransposition = useCallback((newSemitones: number) => {
    setSemitones(Math.max(min, Math.min(max, newSemitones)))
  }, [min, max])
  
  const reset = useCallback(() => {
    setSemitones(0)
    if (persist) {
      localStorage.removeItem(`transpose-${persistKey}`)
    }
  }, [persist, persistKey])
  
  const transposeToKey = useCallback((targetKey: string) => {
    if (!originalKey) return
    const diff = calculateSemitoneDifference(originalKey, targetKey)
    setTransposition(diff)
  }, [originalKey, setTransposition])
  
  // Calculate derived state
  const currentKey = useMemo(() => {
    return originalKey ? transposeKey(originalKey, semitones) : undefined
  }, [originalKey, semitones])
  
  const canTransposeUp = semitones < max
  const canTransposeDown = semitones > min
  const isTransposed = semitones !== 0
  const isEnharmonicKey = currentKey ? enharmonicService.isEnharmonicKey(currentKey) : false
  
  // Apply enharmonic preference to transposed content
  const applyEnharmonicPreference = useCallback((content: string, preference: 'sharp' | 'flat' | 'auto') => {
    if (preference === 'auto') return content
    
    // Use the transposeWithEnharmonic method from chordProService
    return chordProService.transposeWithEnharmonic(content, 0, preference)
  }, [])
  
  const toggleEnharmonic = useCallback(() => {
    const newPref = enharmonicPreference === 'sharp' ? 'flat' : 
                    enharmonicPreference === 'flat' ? 'sharp' : 'sharp'
    setEnharmonicPreference(newPref)
    enharmonicService.setPreference({ 
      preference: newPref,
      contextKey: currentKey 
    })
  }, [enharmonicPreference, currentKey])
  
  return {
    // Legacy fields for backward compatibility
    transposition: semitones,
    originalKey,
    currentKey,
    // New enhanced fields
    semitones,
    canTransposeUp,
    canTransposeDown,
    isTransposed,
    // Enharmonic support
    enharmonicPreference,
    toggleEnharmonic,
    isEnharmonicKey,
    applyEnharmonicPreference,
    // Methods
    transpose,
    setTransposition,
    reset,
    transposeToKey
  }
}