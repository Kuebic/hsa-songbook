import { describe, it, expect, vi } from 'vitest'
import {
  slugify,
  getArtistInitials,
  generateRandomId,
  generateUniqueSlug,
  isValidSlug,
  isUniqueSlug,
  parseSlug,
  regenerateSlug
} from '../utils/slugGeneration'

describe('slugGeneration', () => {
  describe('slugify', () => {
    it('should convert to lowercase and replace spaces with hyphens', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('Test Song Title')).toBe('test-song-title')
    })

    it('should remove special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world')
      expect(slugify('Test@#$%Song')).toBe('testsong')
      expect(slugify('Song (Version 2)')).toBe('song-version-2')
    })

    it('should handle multiple spaces and hyphens', () => {
      expect(slugify('Hello   World')).toBe('hello-world')
      expect(slugify('Test---Song')).toBe('test-song')
      expect(slugify('Multiple   ---   Separators')).toBe('multiple-separators')
    })

    it('should trim leading and trailing hyphens', () => {
      expect(slugify('-Hello World-')).toBe('hello-world')
      expect(slugify('  Test Song  ')).toBe('test-song')
    })

    it('should handle edge cases', () => {
      expect(slugify('')).toBe('')
      expect(slugify('   ')).toBe('')
      expect(slugify('123')).toBe('123')
      expect(slugify('CamelCaseText')).toBe('camelcasetext')
    })
  })

  describe('getArtistInitials', () => {
    it('should extract initials from artist name', () => {
      expect(getArtistInitials('John Doe')).toBe('jd')
      expect(getArtistInitials('Mary Jane Smith')).toBe('mjs')
      expect(getArtistInitials('A B C D')).toBe('abcd')
    })

    it('should handle single name', () => {
      expect(getArtistInitials('Madonna')).toBe('m')
      expect(getArtistInitials('Prince')).toBe('p')
    })

    it('should handle edge cases', () => {
      expect(getArtistInitials('')).toBe('')
      expect(getArtistInitials('   ')).toBe('')
      expect(getArtistInitials('  John  Doe  ')).toBe('jd')
    })

    it('should handle special characters', () => {
      expect(getArtistInitials('O\'Connor')).toBe('o')
      expect(getArtistInitials('Jean-Paul Sartre')).toBe('jps')
    })
  })

  describe('generateRandomId', () => {
    it('should generate ID of specified length', () => {
      expect(generateRandomId(5)).toHaveLength(5)
      expect(generateRandomId(8)).toHaveLength(8)
      expect(generateRandomId(10)).toHaveLength(10)
    })

    it('should use default length if not specified', () => {
      expect(generateRandomId()).toHaveLength(5)
    })

    it('should only contain alphanumeric characters', () => {
      const id = generateRandomId(10)
      expect(id).toMatch(/^[a-z0-9]+$/)
    })

    it('should generate different IDs', () => {
      const id1 = generateRandomId()
      const id2 = generateRandomId()
      const id3 = generateRandomId()
      // While theoretically they could be the same, probability is very low
      expect(new Set([id1, id2, id3]).size).toBeGreaterThan(1)
    })
  })

  describe('generateUniqueSlug', () => {
    it('should generate unique slug with title only', async () => {
      const slug = await generateUniqueSlug({
        title: 'Test Song',
        existingSlugs: []
      })
      expect(slug).toMatch(/^test-song-[a-z0-9]{5}$/)
    })

    it('should include artist initials when provided', async () => {
      const slug = await generateUniqueSlug({
        title: 'Test Song',
        artist: 'John Doe',
        existingSlugs: []
      })
      expect(slug).toMatch(/^test-song-jd-[a-z0-9]{5}$/)
    })

    it('should avoid existing slugs', async () => {
      const existingSlugs = ['test-song-abc12', 'test-song-def34']
      const slug = await generateUniqueSlug({
        title: 'Test Song',
        existingSlugs
      })
      expect(slug).not.toBe('test-song-abc12')
      expect(slug).not.toBe('test-song-def34')
      expect(existingSlugs).not.toContain(slug)
    })

    it('should handle empty title', async () => {
      const slug = await generateUniqueSlug({
        title: '',
        existingSlugs: []
      })
      expect(slug).toMatch(/^song-[a-z0-9]{8}$/)
    })

    it('should use timestamp fallback after max attempts', async () => {
      // Mock Math.random to always return same value
      const originalRandom = Math.random
      Math.random = vi.fn().mockReturnValue(0.5)

      const existingSlugs = Array(20).fill('').map((_, i) => 
        `test-song-${'n'.repeat(5)}`
      )

      const slug = await generateUniqueSlug({
        title: 'Test Song',
        existingSlugs,
        maxAttempts: 1
      })

      expect(slug).toMatch(/^test-song-[a-z0-9]+$/)
      
      // Restore original Math.random
      Math.random = originalRandom
    })

    it('should respect includeArtistInitials option', async () => {
      const slug = await generateUniqueSlug({
        title: 'Test Song',
        artist: 'John Doe',
        existingSlugs: [],
        includeArtistInitials: false
      })
      expect(slug).toMatch(/^test-song-[a-z0-9]{5}$/)
      expect(slug).not.toContain('jd')
    })

    it('should respect custom random ID length', async () => {
      const slug = await generateUniqueSlug({
        title: 'Test Song',
        existingSlugs: [],
        randomIdLength: 8
      })
      expect(slug).toMatch(/^test-song-[a-z0-9]{8}$/)
    })
  })

  describe('isValidSlug', () => {
    it('should validate correct slug format', () => {
      expect(isValidSlug('test-song')).toBe(true)
      expect(isValidSlug('test-song-123')).toBe(true)
      expect(isValidSlug('a-b-c-d-e')).toBe(true)
      expect(isValidSlug('123')).toBe(true)
    })

    it('should reject invalid slug format', () => {
      expect(isValidSlug('Test-Song')).toBe(false) // uppercase
      expect(isValidSlug('test song')).toBe(false) // space
      expect(isValidSlug('test_song')).toBe(false) // underscore
      expect(isValidSlug('test-song-')).toBe(false) // trailing hyphen
      expect(isValidSlug('-test-song')).toBe(false) // leading hyphen
      expect(isValidSlug('test--song')).toBe(false) // double hyphen
      expect(isValidSlug('')).toBe(false)
    })
  })

  describe('isUniqueSlug', () => {
    it('should check slug uniqueness', () => {
      const existingSlugs = ['song-1', 'song-2', 'song-3']
      
      expect(isUniqueSlug('song-4', existingSlugs)).toBe(true)
      expect(isUniqueSlug('new-song', existingSlugs)).toBe(true)
      expect(isUniqueSlug('song-1', existingSlugs)).toBe(false)
      expect(isUniqueSlug('song-2', existingSlugs)).toBe(false)
    })

    it('should handle empty existing slugs', () => {
      expect(isUniqueSlug('any-slug', [])).toBe(true)
    })
  })

  describe('parseSlug', () => {
    it('should parse slug with ID', () => {
      const result = parseSlug('test-song-abc12')
      expect(result.base).toBe('test-song')
      expect(result.id).toBe('abc12')
      expect(result.initials).toBeUndefined()
    })

    it('should parse slug with initials and ID', () => {
      const result = parseSlug('test-song-jd-abc12')
      expect(result.base).toBe('test-song')
      expect(result.initials).toBe('jd')
      expect(result.id).toBe('abc12')
    })

    it('should handle slug without ID', () => {
      const result = parseSlug('test-song')
      expect(result.base).toBe('test-song')
      expect(result.id).toBeUndefined()
      expect(result.initials).toBeUndefined()
    })

    it('should handle complex slugs', () => {
      const result = parseSlug('amazing-grace-how-sweet-the-sound-jn-xyz99')
      expect(result.base).toBe('amazing-grace-how-sweet-the-sound')
      expect(result.initials).toBe('jn')
      expect(result.id).toBe('xyz99')
    })

    it('should not mistake non-ID parts as ID', () => {
      const result = parseSlug('test-song-version')
      expect(result.base).toBe('test-song-version')
      expect(result.id).toBeUndefined()
    })
  })

  describe('regenerateSlug', () => {
    it('should regenerate slug with new ID', async () => {
      const existingSlug = 'test-song-abc12'
      const newSlug = await regenerateSlug(existingSlug, [])
      
      expect(newSlug).toMatch(/^test-song-[a-z0-9]{5}$/)
      expect(newSlug).not.toBe(existingSlug)
    })

    it('should preserve initials structure', async () => {
      const existingSlug = 'test-song-jd-abc12'
      const newSlug = await regenerateSlug(existingSlug, [])
      
      expect(newSlug).toMatch(/^test-song-jd-[a-z0-9]{5}$/)
      expect(newSlug).not.toBe(existingSlug)
    })

    it('should handle slug without ID', async () => {
      const existingSlug = 'test-song'
      const newSlug = await regenerateSlug(existingSlug, [])
      
      expect(newSlug).toMatch(/^test-song-[a-z0-9]{5}$/)
    })

    it('should use timestamp if regenerated slug is not unique', async () => {
      // Mock generateRandomId to always return same value
      const originalRandom = Math.random
      Math.random = vi.fn().mockReturnValue(0.5)

      const existingSlug = 'test-song-abc12'
      const existingSlugs = Array(20).fill('').map(() => 
        `test-song-${'n'.repeat(5)}`
      )

      const newSlug = await regenerateSlug(existingSlug, existingSlugs)
      expect(newSlug).toMatch(/^test-song-[a-z0-9]+$/)
      
      // Restore original Math.random
      Math.random = originalRandom
    })
  })
})