/**
 * @file useChordTransposition.ts
 * @description React hook for managing chord transposition state
 */

import { useState, useCallback, useMemo } from 'react';
import type { TransposeHookResult } from '../types/chord.types';
import { TRANSPOSE_LIMITS } from '../types/chord.types';

/**
 * Custom hook for managing chord transposition state
 * 
 * @param initialLevel - Initial transpose level (default: 0)
 * @returns TransposeHookResult with current level and transpose functions
 * 
 * @example
 * ```tsx
 * const { transposeLevel, transposeUp, transposeDown, reset } = useChordTransposition();
 * 
 * // Transpose up by 2 semitones
 * transposeUp(2);
 * 
 * // Transpose down by 1 semitone (default)
 * transposeDown();
 * 
 * // Reset to original key
 * reset();
 * ```
 */
export function useChordTransposition(initialLevel: number = TRANSPOSE_LIMITS.DEFAULT): TransposeHookResult {
  // Clamp initial level to valid range
  const clampedInitial = Math.max(
    TRANSPOSE_LIMITS.MIN,
    Math.min(TRANSPOSE_LIMITS.MAX, initialLevel)
  );

  const [transposeLevel, setTransposeLevel] = useState<number>(clampedInitial);

  /**
   * Clamp transpose level to valid range
   */
  const clampLevel = useCallback((level: number): number => {
    return Math.max(TRANSPOSE_LIMITS.MIN, Math.min(TRANSPOSE_LIMITS.MAX, level));
  }, []);

  /**
   * Transpose up by specified semitones
   */
  const transposeUp = useCallback((semitones: number = 1) => {
    setTransposeLevel(current => clampLevel(current + semitones));
  }, [clampLevel]);

  /**
   * Transpose down by specified semitones
   */
  const transposeDown = useCallback((semitones: number = 1) => {
    setTransposeLevel(current => clampLevel(current - semitones));
  }, [clampLevel]);

  /**
   * Set specific transpose level
   */
  const transpose = useCallback((level: number) => {
    setTransposeLevel(clampLevel(level));
  }, [clampLevel]);

  /**
   * Reset to original key (0)
   */
  const reset = useCallback(() => {
    setTransposeLevel(TRANSPOSE_LIMITS.DEFAULT);
  }, []);

  /**
   * Check if at boundary levels
   */
  const isMaxTranspose = useMemo(
    () => transposeLevel === TRANSPOSE_LIMITS.MAX,
    [transposeLevel]
  );

  const isMinTranspose = useMemo(
    () => transposeLevel === TRANSPOSE_LIMITS.MIN,
    [transposeLevel]
  );

  return {
    transposeLevel,
    transposeUp,
    transposeDown,
    transpose,
    reset,
    isMaxTranspose,
    isMinTranspose
  };
}