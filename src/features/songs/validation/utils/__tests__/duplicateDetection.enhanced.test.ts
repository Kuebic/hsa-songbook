import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  normalizeTitle,
  findSimilarSongs,
  isDuplicateSong,
  getDuplicateSummary,
  type SimilarityLevel,
  type DuplicateDetectionOptions
} from '../duplicateDetection'
import { levenshteinDistance } from '../levenshtein'
import { songFactory, duplicateFactory } from '../../../test-utils/factories'
import type { Song } from '../../../types/song.types'

// Mock levenshtein distance for controlled testing
vi.mock('../levenshtein', () => ({
  levenshteinDistance: vi.fn()
}))

describe('duplicateDetection', () => {
  const mockLevenshteinDistance = vi.mocked(levenshteinDistance)

  beforeEach(() => {
    mockLevenshteinDistance.mockClear()
  })

  describe('normalizeTitle', () => {
    it('converts to lowercase', () => {
      expect(normalizeTitle('AMAZING GRACE')).toBe('amazing grace')
      expect(normalizeTitle('Holy Spirit')).toBe('holy spirit')
    })

    it('removes punctuation', () => {
      expect(normalizeTitle('Amazing Grace!')).toBe('amazing grace')
      expect(normalizeTitle('Holy, Holy, Holy')).toBe('holy holy holy')
      expect(normalizeTitle('Lord I Lift Your Name On High (Live)')).toBe('lord i lift your name on high live')
    })

    it('normalizes whitespace', () => {
      expect(normalizeTitle('  Amazing   Grace  ')).toBe('amazing grace')
      expect(normalizeTitle('Holy\t\nSpirit')).toBe('holy spirit')
    })

    it('handles special characters', () => {
      expect(normalizeTitle('Blessed Be Your Name @ Church')).toBe('blessed be your name  church')
      expect(normalizeTitle('10,000 Reasons')).toBe('10000 reasons')
    })

    it('handles empty and whitespace-only strings', () => {
      expect(normalizeTitle('')).toBe('')
      expect(normalizeTitle('   ')).toBe('')
      expect(normalizeTitle('\t\n')).toBe('')
    })

    it('preserves numbers and basic alphanumeric', () => {
      expect(normalizeTitle('Psalm 23')).toBe('psalm 23')
      expect(normalizeTitle('How Great Thou Art')).toBe('how great thou art')
    })
  })

  describe('findSimilarSongs - Exact Matches', () => {
    beforeEach(() => {
      mockLevenshteinDistance.mockImplementation((a, b) => a === b ? 0 : 5)
    })

    it('finds exact title matches without artist', () => {
      const targetSong = songFactory.build({ title: 'Amazing Grace' })
      const songs = [
        songFactory.build({ title: 'Amazing Grace', artist: 'John Newton' }),
        songFactory.build({ title: 'How Great Thou Art', artist: 'Carl Boberg' })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'amazing grace' && b === 'amazing grace') return 0
        return 5
      })

      const results = findSimilarSongs('Amazing Grace', songs)

      expect(results).toHaveLength(1)
      expect(results[0].similarity).toBe('exact')
      expect(results[0].distance).toBe(0)
      expect(results[0].matchedOn.title).toBe(true)
      expect(results[0].song.title).toBe('Amazing Grace')
    })

    it('finds exact matches with both title and artist', () => {
      const songs = [
        songFactory.build({ title: 'Amazing Grace', artist: 'John Newton' }),
        songFactory.build({ title: 'Amazing Grace', artist: 'Chris Tomlin' })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'amazing grace' && b === 'amazing grace') return 0
        if (a === 'john newton' && b === 'john newton') return 0
        return 5
      })

      const results = findSimilarSongs('Amazing Grace', songs, 'John Newton')

      expect(results).toHaveLength(1)
      expect(results[0].similarity).toBe('exact')
      expect(results[0].matchedOn.title).toBe(true)
      expect(results[0].matchedOn.artist).toBe(true)
      expect(results[0].song.artist).toBe('John Newton')
    })

    it('distinguishes exact title with similar artist', () => {
      const songs = [
        songFactory.build({ title: 'Amazing Grace', artist: 'John Newton' })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'amazing grace' && b === 'amazing grace') return 0
        if (a === 'john newton' && b === 'jon newton') return 1
        return 5
      })

      const results = findSimilarSongs('Amazing Grace', songs, 'Jon Newton')

      expect(results).toHaveLength(1)
      expect(results[0].similarity).toBe('very-similar')
      expect(results[0].matchedOn.title).toBe(true)
      expect(results[0].matchedOn.artist).toBe(false)
    })

    it('handles exact matches with no existing artist', () => {
      const songs = [
        songFactory.build({ title: 'Amazing Grace', artist: undefined })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'amazing grace' && b === 'amazing grace') return 0
        return 5
      })

      const results = findSimilarSongs('Amazing Grace', songs, 'John Newton')

      expect(results).toHaveLength(1)
      expect(results[0].similarity).toBe('exact')
      expect(results[0].matchedOn.title).toBe(true)
      expect(results[0].matchedOn.artist).toBe(false)
    })
  })

  describe('findSimilarSongs - Similarity Detection', () => {
    it('finds very similar songs (distance <= 3)', () => {
      const songs = [
        songFactory.build({ title: 'Amazing Grace' }),
        songFactory.build({ title: 'Amazing Graces' }) // 1 character difference
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'amazing grace' && b === 'amazing graces') return 1
        return 5
      })

      const results = findSimilarSongs('Amazing Grace', songs)

      expect(results).toHaveLength(1)
      expect(results[0].similarity).toBe('very-similar')
      expect(results[0].distance).toBe(1)
    })

    it('finds similar songs (distance <= 5 for titles >= 10 chars)', () => {
      const songs = [
        songFactory.build({ title: 'How Great Thou Art' }),
        songFactory.build({ title: 'How Great You Art' }) // 3 character difference
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'how great thou art' && b === 'how great you art') return 4
        return 10
      })

      const results = findSimilarSongs('How Great Thou Art', songs)

      expect(results).toHaveLength(1)
      expect(results[0].similarity).toBe('similar')
      expect(results[0].distance).toBe(4)
    })

    it('ignores similar matches for short titles', () => {
      const songs = [
        songFactory.build({ title: 'Grace' }),
        songFactory.build({ title: 'Graces' })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'grace' && b === 'graces') return 1
        return 10
      })

      const results = findSimilarSongs('Grace', songs, undefined, { minLengthForSimilar: 10 })

      // Should not find similar matches for short titles
      expect(results).toHaveLength(0)
    })

    it('respects custom similarity thresholds', () => {
      const songs = [
        songFactory.build({ title: 'Amazing Grace' }),
        songFactory.build({ title: 'Amazing Graces' })
      ]

      mockLevenshteinDistance.mockImplementation(() => 2)

      const options: DuplicateDetectionOptions = {
        verySimilarThreshold: 1,
        similarThreshold: 3
      }

      const results = findSimilarSongs('Amazing Grace', songs, undefined, options)

      expect(results).toHaveLength(1)
      expect(results[0].similarity).toBe('similar')
    })
  })

  describe('findSimilarSongs - Sorting and Limiting', () => {
    it('sorts results by similarity level then distance', () => {
      const songs = [
        songFactory.build({ title: 'Similar Song 1' }),
        songFactory.build({ title: 'Very Similar Song' }),
        songFactory.build({ title: 'Exact Match' }),
        songFactory.build({ title: 'Similar Song 2' })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'amazing grace' && b === 'exact match') return 0
        if (a === 'amazing grace' && b === 'very similar song') return 2
        if (a === 'amazing grace' && b === 'similar song 1') return 4
        if (a === 'amazing grace' && b === 'similar song 2') return 5
        return 10
      })

      const results = findSimilarSongs('Amazing Grace', songs)

      expect(results).toHaveLength(4)
      expect(results[0].similarity).toBe('exact')
      expect(results[1].similarity).toBe('very-similar')
      expect(results[2].similarity).toBe('similar')
      expect(results[3].similarity).toBe('similar')
    })

    it('limits results to maxResults', () => {
      const songs = Array.from({ length: 15 }, (_, i) => 
        songFactory.build({ title: `Song ${i}` })
      )

      mockLevenshteinDistance.mockImplementation(() => 2)

      const results = findSimilarSongs('Test Song', songs, undefined, { maxResults: 5 })

      expect(results).toHaveLength(5)
    })

    it('sorts similar results by distance', () => {
      const songs = [
        songFactory.build({ title: 'Song A' }),
        songFactory.build({ title: 'Song B' }),
        songFactory.build({ title: 'Song C' })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (b === 'song a') return 5
        if (b === 'song b') return 3
        if (b === 'song c') return 4
        return 10
      })

      const results = findSimilarSongs('Test Song', songs)

      expect(results).toHaveLength(3)
      expect(results[0].distance).toBe(3) // Song B
      expect(results[1].distance).toBe(4) // Song C
      expect(results[2].distance).toBe(5) // Song A
    })
  })

  describe('findSimilarSongs - Options', () => {
    it('disables artist checking when checkArtist is false', () => {
      const songs = [
        songFactory.build({ title: 'Amazing Grace', artist: 'Different Artist' })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'amazing grace' && b === 'amazing grace') return 0
        return 10
      })

      const results = findSimilarSongs(
        'Amazing Grace', 
        songs, 
        'John Newton', 
        { checkArtist: false }
      )

      expect(results).toHaveLength(1)
      expect(results[0].similarity).toBe('exact')
      expect(mockLevenshteinDistance).not.toHaveBeenCalledWith(
        expect.any(String), 
        'john newton'
      )
    })

    it('applies custom minLengthForSimilar', () => {
      const songs = [
        songFactory.build({ title: 'Short' })
      ]

      mockLevenshteinDistance.mockImplementation(() => 4)

      const results = findSimilarSongs('Short', songs, undefined, { 
        minLengthForSimilar: 3 
      })

      expect(results).toHaveLength(1)
      expect(results[0].similarity).toBe('similar')
    })

    it('handles edge cases with empty song arrays', () => {
      const results = findSimilarSongs('Amazing Grace', [])
      expect(results).toHaveLength(0)
    })

    it('handles songs with missing titles', () => {
      const songs = [
        { ...songFactory.build(), title: '' } as Song
      ]

      const results = findSimilarSongs('Amazing Grace', songs)
      expect(results).toHaveLength(0)
    })
  })

  describe('isDuplicateSong', () => {
    beforeEach(() => {
      mockLevenshteinDistance.mockImplementation((a, b) => a === b ? 0 : 5)
    })

    it('returns true for exact duplicate', () => {
      const songs = [
        songFactory.build({ title: 'Amazing Grace', artist: 'John Newton' })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'amazing grace' && b === 'amazing grace') return 0
        if (a === 'john newton' && b === 'john newton') return 0
        return 5
      })

      const result = isDuplicateSong('Amazing Grace', 'John Newton', songs)
      expect(result).toBe(true)
    })

    it('returns false for similar but not exact match', () => {
      const songs = [
        songFactory.build({ title: 'Amazing Graces', artist: 'John Newton' })
      ]

      mockLevenshteinDistance.mockImplementation(() => 1)

      const result = isDuplicateSong('Amazing Grace', 'John Newton', songs)
      expect(result).toBe(false)
    })

    it('returns false when no similar songs found', () => {
      const songs = [
        songFactory.build({ title: 'Different Song', artist: 'Different Artist' })
      ]

      mockLevenshteinDistance.mockImplementation(() => 10)

      const result = isDuplicateSong('Amazing Grace', 'John Newton', songs)
      expect(result).toBe(false)
    })

    it('handles undefined artist', () => {
      const songs = [
        songFactory.build({ title: 'Amazing Grace', artist: 'John Newton' })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'amazing grace' && b === 'amazing grace') return 0
        return 5
      })

      const result = isDuplicateSong('Amazing Grace', undefined, songs)
      expect(result).toBe(true)
    })
  })

  describe('getDuplicateSummary', () => {
    it('returns appropriate message for no similar songs', () => {
      expect(getDuplicateSummary([])).toBe('No similar songs found')
    })

    it('returns summary for exact matches only', () => {
      const similar = [
        {
          song: songFactory.build(),
          similarity: 'exact' as SimilarityLevel,
          distance: 0,
          matchedOn: { title: true, artist: true }
        }
      ]

      expect(getDuplicateSummary(similar)).toBe('Found 1 exact match')
    })

    it('returns summary for multiple exact matches', () => {
      const similar = [
        {
          song: songFactory.build(),
          similarity: 'exact' as SimilarityLevel,
          distance: 0,
          matchedOn: { title: true, artist: true }
        },
        {
          song: songFactory.build(),
          similarity: 'exact' as SimilarityLevel,
          distance: 0,
          matchedOn: { title: true, artist: false }
        }
      ]

      expect(getDuplicateSummary(similar)).toBe('Found 2 exact matches')
    })

    it('returns summary for mixed similarity levels', () => {
      const similar = [
        {
          song: songFactory.build(),
          similarity: 'exact' as SimilarityLevel,
          distance: 0,
          matchedOn: { title: true, artist: true }
        },
        {
          song: songFactory.build(),
          similarity: 'very-similar' as SimilarityLevel,
          distance: 2,
          matchedOn: { title: false, artist: false }
        },
        {
          song: songFactory.build(),
          similarity: 'similar' as SimilarityLevel,
          distance: 4,
          matchedOn: { title: false, artist: false }
        }
      ]

      expect(getDuplicateSummary(similar)).toBe('Found 1 exact match, 1 very similar, 1 similar')
    })

    it('returns summary for very similar only', () => {
      const similar = [
        {
          song: songFactory.build(),
          similarity: 'very-similar' as SimilarityLevel,
          distance: 1,
          matchedOn: { title: false, artist: false }
        },
        {
          song: songFactory.build(),
          similarity: 'very-similar' as SimilarityLevel,
          distance: 2,
          matchedOn: { title: false, artist: false }
        }
      ]

      expect(getDuplicateSummary(similar)).toBe('Found 2 very similar')
    })
  })

  describe('Performance Tests', () => {
    it('performs well with large datasets', () => {
      const largeSongSet = Array.from({ length: 1000 }, (_, i) => 
        songFactory.build({ title: `Song ${i}`, artist: `Artist ${i}` })
      )

      mockLevenshteinDistance.mockImplementation(() => 10) // No matches

      const startTime = performance.now()
      const results = findSimilarSongs('Test Song', largeSongSet)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // Should complete in under 100ms
      expect(results).toHaveLength(0)
    })

    it('handles many similar results efficiently', () => {
      const songs = Array.from({ length: 100 }, (_, i) => 
        songFactory.build({ title: `Amazing Grace ${i}` })
      )

      mockLevenshteinDistance.mockImplementation(() => 1) // All very similar

      const startTime = performance.now()
      const results = findSimilarSongs('Amazing Grace Test', songs, undefined, { maxResults: 10 })
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(50)
      expect(results).toHaveLength(10)
    })

    it('short-circuits on exact matches when appropriate', () => {
      const songs = [
        songFactory.build({ title: 'Exact Match', artist: 'Exact Artist' }),
        ...Array.from({ length: 100 }, () => songFactory.build())
      ]

      let callCount = 0
      mockLevenshteinDistance.mockImplementation((a, b) => {
        callCount++
        if (a === 'exact match' && b === 'exact match') return 0
        if (a === 'exact artist' && b === 'exact artist') return 0
        return 10
      })

      const results = findSimilarSongs('Exact Match', songs, 'Exact Artist')

      expect(results).toHaveLength(1)
      expect(results[0].similarity).toBe('exact')
      // Should not need to check all songs after finding exact match
      expect(callCount).toBeLessThan(200) // Much less than 2 * 101 songs
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles very long titles', () => {
      const longTitle = 'A'.repeat(1000)
      const songs = [
        songFactory.build({ title: longTitle })
      ]

      mockLevenshteinDistance.mockImplementation(() => 0)

      const results = findSimilarSongs(longTitle, songs)
      expect(results).toHaveLength(1)
    })

    it('handles titles with special unicode characters', () => {
      const unicodeTitle = 'Ámàzíñg Grâcé 🎵'
      const songs = [
        songFactory.build({ title: 'Amazing Grace' })
      ]

      mockLevenshteinDistance.mockImplementation(() => 2)

      const results = findSimilarSongs(unicodeTitle, songs)
      expect(results).toHaveLength(1)
    })

    it('handles null/undefined song properties gracefully', () => {
      const songs = [
        { ...songFactory.build(), title: null } as any,
        { ...songFactory.build(), artist: null } as any,
        songFactory.build({ title: 'Valid Song' })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'test song' && b === 'valid song') return 3
        return 10
      })

      const results = findSimilarSongs('Test Song', songs)
      expect(results).toHaveLength(1)
      expect(results[0].song.title).toBe('Valid Song')
    })

    it('handles zero and negative distances from levenshtein', () => {
      const songs = [songFactory.build({ title: 'Test Song' })]
      
      mockLevenshteinDistance.mockImplementation(() => -1) // Invalid distance

      const results = findSimilarSongs('Test Song', songs)
      // Should handle gracefully, potentially treating as no match
      expect(results).toHaveLength(0)
    })

    it('handles extremely similar songs with same normalized titles', () => {
      const songs = [
        songFactory.build({ title: 'Amazing Grace!' }),
        songFactory.build({ title: 'Amazing Grace?' }),
        songFactory.build({ title: 'Amazing Grace.' })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'amazing grace' && b === 'amazing grace') return 0
        return 10
      })

      const results = findSimilarSongs('Amazing Grace', songs)
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.similarity).toBe('exact')
      })
    })
  })

  describe('Real-world Scenarios', () => {
    it('handles common song title variations', () => {
      const songs = [
        songFactory.build({ title: 'Amazing Grace' }),
        songFactory.build({ title: 'Amazing Grace (Live)' }),
        songFactory.build({ title: 'Amazing Grace - Acoustic Version' }),
        songFactory.build({ title: 'The Amazing Grace' })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'amazing grace' && b === 'amazing grace') return 0
        if (a === 'amazing grace' && b === 'amazing grace live') return 5
        if (a === 'amazing grace' && b === 'amazing grace  acoustic version') return 18
        if (a === 'amazing grace' && b === 'the amazing grace') return 4
        return 20
      })

      const results = findSimilarSongs('Amazing Grace', songs)
      
      expect(results).toHaveLength(2) // Exact match and "The Amazing Grace"
      expect(results[0].similarity).toBe('exact')
      expect(results[1].similarity).toBe('similar')
    })

    it('handles artist name variations', () => {
      const songs = [
        songFactory.build({ title: 'Amazing Grace', artist: 'John Newton' }),
        songFactory.build({ title: 'Amazing Grace', artist: 'Jon Newton' }),
        songFactory.build({ title: 'Amazing Grace', artist: 'John Newton Jr.' })
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        if (a === 'amazing grace' && b === 'amazing grace') return 0
        if (a === 'john newton' && b === 'john newton') return 0
        if (a === 'john newton' && b === 'jon newton') return 1
        if (a === 'john newton' && b === 'john newton jr') return 4
        return 10
      })

      const results = findSimilarSongs('Amazing Grace', songs, 'John Newton')
      
      expect(results).toHaveLength(2)
      expect(results[0].similarity).toBe('exact')
      expect(results[1].similarity).toBe('very-similar')
    })

    it('prioritizes matches correctly in mixed scenarios', () => {
      const songs = [
        songFactory.build({ title: 'Amazing Grace', artist: 'John Newton' }), // Exact
        songFactory.build({ title: 'Amazing Graces', artist: 'John Newton' }), // Very similar title
        songFactory.build({ title: 'Amazing Grace', artist: 'Jon Newton' }), // Very similar artist
        songFactory.build({ title: 'Amazing Song', artist: 'Different Artist' }) // Similar title
      ]

      mockLevenshteinDistance.mockImplementation((a, b) => {
        // Title comparisons
        if (a === 'amazing grace' && b === 'amazing grace') return 0
        if (a === 'amazing grace' && b === 'amazing graces') return 1
        if (a === 'amazing grace' && b === 'amazing song') return 4
        
        // Artist comparisons  
        if (a === 'john newton' && b === 'john newton') return 0
        if (a === 'john newton' && b === 'jon newton') return 1
        
        return 10
      })

      const results = findSimilarSongs('Amazing Grace', songs, 'John Newton')
      
      expect(results).toHaveLength(3)
      expect(results[0].similarity).toBe('exact')
      expect(results[1].similarity).toBe('very-similar')
      expect(results[2].similarity).toBe('very-similar')
    })
  })
})