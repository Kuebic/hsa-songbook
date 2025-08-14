import { describe, it, expect } from 'vitest'
import {
  normalizeTheme,
  normalizeThemes,
  getSuggestedThemes,
  isValidTheme,
  themeStats
} from '../utils/themeNormalization'
import { NORMALIZED_THEMES } from '../constants/themes'

describe('themeNormalization', () => {
  describe('normalizeTheme', () => {
    it('should normalize exact matches (case-insensitive)', () => {
      expect(normalizeTheme('worship')).toBe('Worship')
      expect(normalizeTheme('WORSHIP')).toBe('Worship')
      expect(normalizeTheme('Worship')).toBe('Worship')
    })

    it('should normalize variations to canonical form', () => {
      expect(normalizeTheme('worshipping')).toBe('Worship')
      expect(normalizeTheme('praising')).toBe('Praise')
      expect(normalizeTheme('praised')).toBe('Praise')
      expect(normalizeTheme('thankfulness')).toBe('Thanksgiving')
    })

    it('should preserve unknown themes', () => {
      expect(normalizeTheme('UnknownTheme')).toBe('UnknownTheme')
      expect(normalizeTheme('Custom Theme')).toBe('Custom Theme')
    })

    it('should handle edge cases', () => {
      expect(normalizeTheme('')).toBe('')
      expect(normalizeTheme('   ')).toBe('')
      expect(normalizeTheme('  worship  ')).toBe('Worship')
    })

    it('should find closest match within threshold', () => {
      expect(normalizeTheme('Adoration', 2)).toBe('Adoration')
      expect(normalizeTheme('Worsip', 2)).toBe('Worship') // 1 char diff
      expect(normalizeTheme('Prais', 2)).toBe('Praise') // 1 char diff
    })

    it('should not normalize if distance exceeds threshold', () => {
      expect(normalizeTheme('xyz', 2)).toBe('xyz')
      expect(normalizeTheme('random', 2)).toBe('random')
    })
  })

  describe('normalizeThemes', () => {
    it('should normalize array of themes', () => {
      const input = ['worship', 'PRAISE', 'thankfulness', 'Custom']
      const expected = ['Worship', 'Praise', 'Thanksgiving', 'Custom']
      expect(normalizeThemes(input)).toEqual(expected)
    })

    it('should remove duplicates after normalization', () => {
      const input = ['worship', 'Worship', 'worshipping', 'praised', 'Praise']
      const expected = ['Worship', 'Praise']
      expect(normalizeThemes(input)).toEqual(expected)
    })

    it('should filter empty themes', () => {
      const input = ['worship', '', '   ', 'praise']
      const expected = ['Worship', 'Praise']
      expect(normalizeThemes(input)).toEqual(expected)
    })

    it('should maintain order', () => {
      const input = ['Christmas', 'Easter', 'Worship']
      const expected = ['Christmas', 'Easter', 'Worship']
      expect(normalizeThemes(input)).toEqual(expected)
    })

    it('should handle empty array', () => {
      expect(normalizeThemes([])).toEqual([])
    })
  })

  describe('getSuggestedThemes', () => {
    it('should suggest themes based on partial input', () => {
      const suggestions = getSuggestedThemes('wor')
      expect(suggestions).toContain('Worship')
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.length).toBeLessThanOrEqual(5)
    })

    it('should be case-insensitive', () => {
      const suggestions1 = getSuggestedThemes('WOR')
      const suggestions2 = getSuggestedThemes('wor')
      expect(suggestions1).toEqual(suggestions2)
    })

    it('should return empty array for no matches', () => {
      expect(getSuggestedThemes('xyz')).toEqual([])
    })

    it('should limit results', () => {
      const suggestions = getSuggestedThemes('a', 3)
      expect(suggestions.length).toBeLessThanOrEqual(3)
    })

    it('should handle empty input', () => {
      expect(getSuggestedThemes('')).toEqual([])
    })

    it('should prioritize exact prefix matches', () => {
      const suggestions = getSuggestedThemes('Christ')
      expect(suggestions[0]).toBe('Christmas')
    })
  })

  describe('isValidTheme', () => {
    it('should validate normalized themes', () => {
      NORMALIZED_THEMES.forEach(theme => {
        expect(isValidTheme(theme)).toBe(true)
      })
    })

    it('should validate theme variations', () => {
      expect(isValidTheme('worship')).toBe(true)
      expect(isValidTheme('WORSHIP')).toBe(true)
      expect(isValidTheme('worshipping')).toBe(true)
    })

    it('should reject invalid themes', () => {
      expect(isValidTheme('InvalidTheme')).toBe(false)
      expect(isValidTheme('xyz')).toBe(false)
      expect(isValidTheme('')).toBe(false)
    })

    it('should handle custom validation', () => {
      const customValid = (theme: string) => theme.startsWith('Custom')
      expect(isValidTheme('CustomTheme', customValid)).toBe(true)
      expect(isValidTheme('Worship', customValid)).toBe(false)
    })
  })

  describe('themeStats', () => {
    it('should calculate theme statistics', () => {
      const themes = ['worship', 'Worship', 'praise', 'Custom', 'praising']
      const stats = themeStats(themes)

      expect(stats.total).toBe(5)
      expect(stats.unique).toBe(3) // Worship, Praise, Custom
      expect(stats.normalized).toBe(3) // worship->Worship, praise->Praise, praising->Praise
      expect(stats.unknown).toBe(1) // Custom
      expect(stats.frequency['Worship']).toBe(2)
      expect(stats.frequency['Praise']).toBe(2)
      expect(stats.frequency['Custom']).toBe(1)
    })

    it('should handle empty array', () => {
      const stats = themeStats([])
      expect(stats.total).toBe(0)
      expect(stats.unique).toBe(0)
      expect(stats.normalized).toBe(0)
      expect(stats.unknown).toBe(0)
      expect(stats.frequency).toEqual({})
    })

    it('should count all unknown themes', () => {
      const themes = ['Unknown1', 'Unknown2', 'Unknown3']
      const stats = themeStats(themes)
      expect(stats.unknown).toBe(3)
      expect(stats.normalized).toBe(0)
    })

    it('should handle all normalized themes', () => {
      const themes = ['worship', 'praise', 'thanksgiving']
      const stats = themeStats(themes)
      expect(stats.unknown).toBe(0)
      expect(stats.normalized).toBe(3)
    })
  })
})