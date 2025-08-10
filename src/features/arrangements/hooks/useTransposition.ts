import { useState, useCallback } from 'react'
import type { TranspositionState } from '../types/viewer.types'

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const KEY_ALIASES: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#'
}

function normalizeKey(key: string): string {
  return KEY_ALIASES[key] || key
}

function transposeKey(key: string, semitones: number): string {
  const normalizedKey = normalizeKey(key)
  const keyIndex = KEYS.indexOf(normalizedKey)
  if (keyIndex === -1) return key
  
  const newIndex = (keyIndex + semitones + 12) % 12
  return KEYS[newIndex]
}

export function useTransposition(originalKey?: string): TranspositionState & {
  transpose: (semitones: number) => void
  reset: () => void
} {
  const [transposition, setTransposition] = useState(0)
  
  const transpose = useCallback((semitones: number) => {
    setTransposition(prev => prev + semitones)
  }, [])
  
  const reset = useCallback(() => {
    setTransposition(0)
  }, [])
  
  const currentKey = originalKey 
    ? transposeKey(originalKey, transposition)
    : undefined
  
  return {
    transposition,
    originalKey,
    currentKey,
    transpose,
    reset
  }
}