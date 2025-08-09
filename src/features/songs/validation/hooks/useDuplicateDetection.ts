import { useState, useCallback, useEffect } from 'react'
import { findSimilarSongs, type SimilarSong, type DuplicateDetectionOptions } from '../utils/duplicateDetection'
import type { Song } from '../../types/song.types'

/**
 * Hook configuration options
 */
interface UseDuplicateDetectionOptions extends DuplicateDetectionOptions {
  /** Debounce delay in milliseconds (default: 500) */
  debounceDelay?: number
  /** Whether to check on mount (default: false) */
  checkOnMount?: boolean
  /** Callback when duplicates are found */
  onDuplicatesFound?: (duplicates: SimilarSong[]) => void
  /** Callback when no duplicates are found */
  onNoDuplicates?: () => void
}

/**
 * Hook return value
 */
interface UseDuplicateDetectionReturn {
  /** Array of similar songs found */
  duplicates: SimilarSong[]
  /** Whether currently checking for duplicates */
  isChecking: boolean
  /** Error if checking failed */
  error: Error | null
  /** Manually trigger duplicate check */
  checkDuplicates: (title: string, artist?: string) => Promise<void>
  /** Clear current duplicates */
  clearDuplicates: () => void
  /** Whether exact duplicates were found */
  hasExactMatch: boolean
  /** Whether any similar songs were found */
  hasSimilar: boolean
}

/**
 * Hook for detecting duplicate songs
 * 
 * @param existingSongs - Array of existing songs to check against
 * @param options - Detection options
 * @returns Duplicate detection state and utilities
 */
export function useDuplicateDetection(
  existingSongs: Song[],
  options: UseDuplicateDetectionOptions = {}
): UseDuplicateDetectionReturn {
  const {
    debounceDelay = 500,
    checkOnMount = false,
    onDuplicatesFound,
    onNoDuplicates,
    ...detectionOptions
  } = options

  const [duplicates, setDuplicates] = useState<SimilarSong[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  /**
   * Clear any pending debounce timer
   */
  const clearDebounce = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      setDebounceTimer(null)
    }
  }, [debounceTimer])

  /**
   * Check for duplicates with debouncing
   */
  const checkDuplicates = useCallback(
    async (title: string, artist?: string): Promise<void> => {
      // Clear any existing timer
      clearDebounce()

      // Return early if no title
      if (!title || title.trim().length === 0) {
        setDuplicates([])
        setError(null)
        return
      }

      // Set up new debounced check
      return new Promise((resolve) => {
        const timer = setTimeout(async () => {
          setIsChecking(true)
          setError(null)

          try {
            const similar = findSimilarSongs(
              title,
              existingSongs,
              artist,
              detectionOptions
            )

            setDuplicates(similar)

            // Trigger callbacks
            if (similar.length > 0 && onDuplicatesFound) {
              onDuplicatesFound(similar)
            } else if (similar.length === 0 && onNoDuplicates) {
              onNoDuplicates()
            }

            resolve()
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to check for duplicates')
            setError(error)
            setDuplicates([])
            resolve()
          } finally {
            setIsChecking(false)
            setDebounceTimer(null)
          }
        }, debounceDelay)

        setDebounceTimer(timer)
      })
    },
    [existingSongs, detectionOptions, onDuplicatesFound, onNoDuplicates, debounceDelay, clearDebounce]
  )

  /**
   * Clear current duplicates
   */
  const clearDuplicates = useCallback(() => {
    clearDebounce()
    setDuplicates([])
    setError(null)
    setIsChecking(false)
  }, [clearDebounce])

  /**
   * Check for exact matches
   */
  const hasExactMatch = duplicates.some(d => d.similarity === 'exact')

  /**
   * Check for any similar songs
   */
  const hasSimilar = duplicates.length > 0

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearDebounce()
    }
  }, [clearDebounce])

  return {
    duplicates,
    isChecking,
    error,
    checkDuplicates,
    clearDuplicates,
    hasExactMatch,
    hasSimilar
  }
}

/**
 * Hook for real-time duplicate detection as user types
 * 
 * @param title - Current title value
 * @param artist - Current artist value
 * @param existingSongs - Array of existing songs
 * @param options - Detection options
 * @returns Duplicate detection state
 */
export function useRealtimeDuplicateDetection(
  title: string,
  artist: string | undefined,
  existingSongs: Song[],
  options: UseDuplicateDetectionOptions = {}
): UseDuplicateDetectionReturn {
  const detection = useDuplicateDetection(existingSongs, options)

  // Check for duplicates when title or artist changes
  useEffect(() => {
    if (title && title.trim().length > 0) {
      detection.checkDuplicates(title, artist)
    } else {
      detection.clearDuplicates()
    }
  }, [title, artist]) // eslint-disable-line react-hooks/exhaustive-deps

  return detection
}