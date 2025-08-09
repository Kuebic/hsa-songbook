import { describe, it, expect } from 'vitest'
import {
  normalizeTitle,
  findSimilarSongs,
  isDuplicateSong,
  getDuplicateSummary
} from '../utils/duplicateDetection'
import type { Song } from '../../../types/song.types'

// Mock songs for testing
const mockSongs: Song[] = [
  {
    id: '1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    slug: 'amazing-grace-jn-abc12',
    themes: ['Grace', 'Salvation'],
    metadata: {
      isPublic: true,
      views: 100
    }
  },
  {
    id: '2',
    title: 'How Great Thou Art',
    artist: 'Stuart K. Hine',
    slug: 'how-great-thou-art-skh-def34',
    themes: ['Worship', 'Creation'],
    metadata: {
      isPublic: true,
      views: 150
    }
  },
  {
    id: '3',
    title: 'Be Thou My Vision',
    artist: 'Traditional',
    slug: 'be-thou-my-vision-t-ghi56',
    themes: ['Prayer', 'Devotion'],
    metadata: {
      isPublic: true,
      views: 80
    }
  },
  {
    id: '4',
    title: 'Amazing Grace', // Duplicate title, different artist
    artist: 'Chris Tomlin',
    slug: 'amazing-grace-ct-jkl78',
    themes: ['Grace', 'Modern'],
    metadata: {
      isPublic: true,
      views: 200
    }
  }
]

describe('duplicateDetection', () => {
  describe('normalizeTitle', () => {
    it('should normalize titles for comparison', () => {
      expect(normalizeTitle('Amazing Grace')).toBe('amazing grace')
      expect(normalizeTitle('How Great Thou Art!')).toBe('how great thou art')
      expect(normalizeTitle('  Test   Song  ')).toBe('test song')
    })

    it('should remove punctuation', () => {
      expect(normalizeTitle('Test, Song!')).toBe('test song')
      expect(normalizeTitle('Song (Version 2)')).toBe('song version 2')
      expect(normalizeTitle('What\'s This?')).toBe('whats this')
    })

    it('should normalize spaces', () => {
      expect(normalizeTitle('Test    Song')).toBe('test song')
      expect(normalizeTitle('Test\nSong')).toBe('test song')
      expect(normalizeTitle('Test\tSong')).toBe('test song')
    })

    it('should handle edge cases', () => {
      expect(normalizeTitle('')).toBe('')
      expect(normalizeTitle('   ')).toBe('')
      expect(normalizeTitle('123')).toBe('123')
    })
  })

  describe('findSimilarSongs', () => {
    it('should find exact title matches', () => {
      const similar = findSimilarSongs('Amazing Grace', mockSongs)
      
      expect(similar).toHaveLength(2)
      expect(similar[0].similarity).toBe('exact')
      expect(similar[0].distance).toBe(0)
      expect(similar[0].song.id).toMatch(/^[14]$/)
    })

    it('should find exact matches with artist', () => {
      const similar = findSimilarSongs('Amazing Grace', mockSongs, 'John Newton')
      
      expect(similar).toHaveLength(1)
      // Should be exact match on both title and artist
      expect(similar[0].similarity).toBe('exact')
      expect(similar[0].matchedOn.title).toBe(true)
      expect(similar[0].matchedOn.artist).toBe(true)
      expect(similar[0].song.id).toBe('1')
    })

    it('should find very similar titles', () => {
      const similar = findSimilarSongs('Amazing Graces', mockSongs) // 1 char diff
      
      expect(similar.length).toBeGreaterThan(0)
      expect(similar[0].similarity).toBe('very-similar')
      expect(similar[0].distance).toBe(1)
    })

    it('should find similar titles for longer strings', () => {
      const similar = findSimilarSongs('How Great Thou Arts', mockSongs, undefined, {
        similarThreshold: 5
      })
      
      expect(similar.length).toBeGreaterThan(0)
      expect(similar[0].song.title).toBe('How Great Thou Art')
    })

    it('should respect verySimilarThreshold', () => {
      const similar = findSimilarSongs('Amazing Gra', mockSongs, undefined, {
        verySimilarThreshold: 2
      })
      
      const verySimilar = similar.filter(s => s.similarity === 'very-similar')
      expect(verySimilar.every(s => s.distance <= 2)).toBe(true)
    })

    it('should respect similarThreshold', () => {
      const similar = findSimilarSongs('How Great You Are', mockSongs, undefined, {
        similarThreshold: 5,
        minLengthForSimilar: 10
      })
      
      const similarMatches = similar.filter(s => s.similarity === 'similar')
      expect(similarMatches.every(s => s.distance <= 5)).toBe(true)
    })

    it('should limit results', () => {
      const similar = findSimilarSongs('Amazing Grace', mockSongs, undefined, {
        maxResults: 1
      })
      
      expect(similar).toHaveLength(1)
    })

    it('should handle no matches', () => {
      const similar = findSimilarSongs('Completely Different Song XYZ', mockSongs)
      
      expect(similar).toHaveLength(0)
    })

    it('should check artist when enabled', () => {
      const similar = findSimilarSongs('Amazing Grace', mockSongs, 'John Newt', {
        checkArtist: true,
        verySimilarThreshold: 2
      })
      
      const withJohn = similar.find(s => s.song.id === '1')
      expect(withJohn).toBeDefined()
      expect(withJohn?.similarity).toBe('very-similar')
    })

    it('should not check artist when disabled', () => {
      const similar = findSimilarSongs('Amazing Grace', mockSongs, 'Different Artist', {
        checkArtist: false
      })
      
      expect(similar).toHaveLength(2)
      expect(similar.every(s => s.similarity === 'exact')).toBe(true)
    })

    it('should sort by similarity level and distance', () => {
      const similar = findSimilarSongs('Amazing Grac', mockSongs, undefined, {
        verySimilarThreshold: 3,
        similarThreshold: 5
      })
      
      // Should be sorted: exact -> very-similar -> similar
      // Within each level, sorted by distance
      for (let i = 1; i < similar.length; i++) {
        const prev = similar[i - 1]
        const curr = similar[i]
        
        const levelOrder = { 'exact': 0, 'very-similar': 1, 'similar': 2 }
        const prevLevel = levelOrder[prev.similarity]
        const currLevel = levelOrder[curr.similarity]
        
        expect(prevLevel).toBeLessThanOrEqual(currLevel)
        
        if (prevLevel === currLevel) {
          expect(prev.distance).toBeLessThanOrEqual(curr.distance)
        }
      }
    })
  })

  describe('isDuplicateSong', () => {
    it('should detect exact duplicates', () => {
      expect(isDuplicateSong('Amazing Grace', 'John Newton', mockSongs)).toBe(true)
      expect(isDuplicateSong('Amazing Grace', undefined, mockSongs)).toBe(true)
    })

    it('should not flag non-duplicates', () => {
      expect(isDuplicateSong('New Song', 'New Artist', mockSongs)).toBe(false)
      expect(isDuplicateSong('Amazing Graces', 'John Newton', mockSongs)).toBe(false)
    })

    it('should handle empty existing songs', () => {
      expect(isDuplicateSong('Any Song', 'Any Artist', [])).toBe(false)
    })
  })

  describe('getDuplicateSummary', () => {
    it('should summarize similar songs', () => {
      const similar = findSimilarSongs('Amazing Grace', mockSongs)
      const summary = getDuplicateSummary(similar)
      
      expect(summary).toContain('2 exact matches')
    })

    it('should handle single match', () => {
      const similar = findSimilarSongs('Amazing Grace', mockSongs, 'John Newton')
      const exactMatches = similar.filter(s => s.similarity === 'exact' && s.matchedOn.artist)
      const summary = getDuplicateSummary(exactMatches)
      
      expect(summary).toContain('1 exact match')
    })

    it('should handle mixed similarity levels', () => {
      const similar = [
        { similarity: 'exact' as const, distance: 0, song: mockSongs[0], matchedOn: { title: true, artist: false } },
        { similarity: 'very-similar' as const, distance: 1, song: mockSongs[1], matchedOn: { title: false, artist: false } },
        { similarity: 'very-similar' as const, distance: 2, song: mockSongs[2], matchedOn: { title: false, artist: false } },
        { similarity: 'similar' as const, distance: 3, song: mockSongs[3], matchedOn: { title: false, artist: false } }
      ]
      
      const summary = getDuplicateSummary(similar)
      
      expect(summary).toContain('1 exact match')
      expect(summary).toContain('2 very similar')
      expect(summary).toContain('1 similar')
    })

    it('should handle no similar songs', () => {
      const summary = getDuplicateSummary([])
      
      expect(summary).toBe('No similar songs found')
    })

    it('should handle only very similar', () => {
      const similar = [
        { similarity: 'very-similar' as const, distance: 1, song: mockSongs[0], matchedOn: { title: false, artist: false } },
        { similarity: 'very-similar' as const, distance: 2, song: mockSongs[1], matchedOn: { title: false, artist: false } }
      ]
      
      const summary = getDuplicateSummary(similar)
      
      expect(summary).toBe('Found 2 very similar')
    })
  })
})