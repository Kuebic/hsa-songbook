import { describe, it, expect, vi } from 'vitest'
import {
  createOptimisticSong,
  updateOptimisticSong,
  isOptimisticSong,
  replaceOptimisticSong,
  removeOptimisticSong
} from '../utils/optimisticUpdates'
import type { Song } from '../../types/song.types'
import type { SongFormData } from '../../validation/schemas/songFormSchema'

// Mock generateUniqueSlug
vi.mock('../../validation/utils/slugGeneration', () => ({
  generateUniqueSlug: vi.fn((title: string) => title.toLowerCase().replace(/\s+/g, '-'))
}))

describe('optimisticUpdates', () => {
  const mockFormData: SongFormData = {
    title: 'Test Song',
    artist: 'Test Artist',
    themes: ['worship', 'contemporary'],
    compositionYear: 2023,
    ccli: '1234567',
    source: 'original',
    notes: 'Some notes',
    isPublic: true
  }
  
  const mockSong: Song = {
    id: 'real-song-id',
    title: 'Existing Song',
    artist: 'Existing Artist',
    slug: 'existing-song',
    themes: ['hymn'],
    compositionYear: 2020,
    ccli: '7654321',
    source: 'hymnal',
    notes: 'Original notes',
    metadata: {
      createdBy: 'user-123',
      lastModifiedBy: 'user-123',
      isPublic: false,
      ratings: { average: 4.5, count: 10 },
      views: 100,
    }
  }
  
  describe('createOptimisticSong', () => {
    it('creates optimistic song with correct structure', () => {
      const userId = 'test-user-id'
      const optimisticSong = createOptimisticSong(mockFormData, userId)
      
      // Should have temporary ID
      expect(optimisticSong.id).toMatch(/^temp-\d+-[a-z0-9]+$/)
      
      // Should have form data
      expect(optimisticSong.title).toBe(mockFormData.title)
      expect(optimisticSong.artist).toBe(mockFormData.artist)
      expect(optimisticSong.themes).toEqual(mockFormData.themes)
      expect(optimisticSong.compositionYear).toBe(mockFormData.compositionYear)
      expect(optimisticSong.ccli).toBe(mockFormData.ccli)
      expect(optimisticSong.source).toBe(mockFormData.source)
      expect(optimisticSong.notes).toBe(mockFormData.notes)
      
      // Should have temporary slug
      expect(optimisticSong.slug).toBe('temp-test-song')
      
      // Should have correct metadata
      expect(optimisticSong.metadata.createdBy).toBe(userId)
      expect(optimisticSong.metadata.lastModifiedBy).toBe(userId)
      expect(optimisticSong.metadata.isPublic).toBe(mockFormData.isPublic)
      expect(optimisticSong.metadata.ratings).toEqual({ average: 0, count: 0 })
      expect(optimisticSong.metadata.views).toBe(0)
    })
    
    it('handles optional fields correctly', () => {
      const minimalFormData: SongFormData = {
        title: 'Minimal Song',
        themes: ['test'],
        artist: undefined,
        compositionYear: undefined,
        ccli: undefined,
        notes: undefined,
        isPublic: false
      }
      
      const optimisticSong = createOptimisticSong(minimalFormData, 'user-id')
      
      expect(optimisticSong.title).toBe('Minimal Song')
      expect(optimisticSong.artist).toBe('')
      expect(optimisticSong.themes).toEqual(['test'])
      expect(optimisticSong.compositionYear).toBeUndefined()
      expect(optimisticSong.ccli).toBeUndefined()
      expect(optimisticSong.source).toBeUndefined()
      expect(optimisticSong.notes).toBeUndefined()
      expect(optimisticSong.metadata.isPublic).toBe(false)
    })
    
    it('generates unique IDs for multiple calls', () => {
      const song1 = createOptimisticSong(mockFormData, 'user-1')
      const song2 = createOptimisticSong(mockFormData, 'user-1')
      
      expect(song1.id).not.toBe(song2.id)
      expect(song1.id).toMatch(/^temp-/)
      expect(song2.id).toMatch(/^temp-/)
    })
  })
  
  describe('updateOptimisticSong', () => {
    it('updates song with new data', () => {
      const updates: Partial<SongFormData> = {
        title: 'Updated Title',
        artist: 'Updated Artist',
        themes: ['updated', 'theme']
      }
      
      const updatedSong = updateOptimisticSong(mockSong, updates)
      
      expect(updatedSong.title).toBe('Updated Title')
      expect(updatedSong.artist).toBe('Updated Artist')
      expect(updatedSong.themes).toEqual(['updated', 'theme'])
      
      // Should keep unchanged fields
      expect(updatedSong.id).toBe(mockSong.id)
      expect(updatedSong.compositionYear).toBe(mockSong.compositionYear)
      expect(updatedSong.ccli).toBe(mockSong.ccli)
      
      // Should update metadata
      expect(updatedSong.metadata.lastModifiedBy).toBe('current-user')
      
      // Should keep other metadata fields
      expect(updatedSong.metadata.createdBy).toBe(mockSong.metadata.createdBy)
      expect(updatedSong.metadata.ratings).toEqual(mockSong.metadata.ratings)
      expect(updatedSong.metadata.views).toBe(mockSong.metadata.views)
    })
    
    it('handles partial updates', () => {
      const updates: Partial<SongFormData> = {
        title: 'Just Title Update'
      }
      
      const updatedSong = updateOptimisticSong(mockSong, updates)
      
      expect(updatedSong.title).toBe('Just Title Update')
      expect(updatedSong.artist).toBe(mockSong.artist)
      expect(updatedSong.themes).toEqual(mockSong.themes)
    })
    
    it('does not mutate original song', () => {
      const originalTitle = mockSong.title
      
      const updates = { title: 'New Title' }
      const updatedSong = updateOptimisticSong(mockSong, updates)
      
      expect(mockSong.title).toBe(originalTitle)
      expect(updatedSong).not.toBe(mockSong)
    })
  })
  
  describe('isOptimisticSong', () => {
    it('identifies optimistic songs by temp ID', () => {
      const optimisticSong = createOptimisticSong(mockFormData, 'user-id')
      const realSong = mockSong
      
      expect(isOptimisticSong(optimisticSong)).toBe(true)
      expect(isOptimisticSong(realSong)).toBe(false)
    })
    
    it('works with different temp ID formats', () => {
      const tempSong1: Song = { ...mockSong, id: 'temp-123-abc' }
      const tempSong2: Song = { ...mockSong, id: 'temp-456-def' }
      const nonTempSong: Song = { ...mockSong, id: 'real-id' }
      
      expect(isOptimisticSong(tempSong1)).toBe(true)
      expect(isOptimisticSong(tempSong2)).toBe(true)
      expect(isOptimisticSong(nonTempSong)).toBe(false)
    })
  })
  
  describe('replaceOptimisticSong', () => {
    const tempSong: Song = { ...mockSong, id: 'temp-123-abc' }
    const realSong: Song = { ...mockSong, id: 'real-456' }
    const otherSong: Song = { ...mockSong, id: 'other-789' }
    
    it('replaces optimistic song with real song', () => {
      const songs = [otherSong, tempSong]
      const result = replaceOptimisticSong(songs, 'temp-123-abc', realSong)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toBe(otherSong)
      expect(result[1]).toBe(realSong)
      expect(result[1].id).toBe('real-456')
    })
    
    it('does not modify array if temp ID not found', () => {
      const songs = [otherSong, mockSong]
      const result = replaceOptimisticSong(songs, 'temp-not-found', realSong)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toBe(otherSong)
      expect(result[1]).toBe(mockSong)
    })
    
    it('does not mutate original array', () => {
      const songs = [tempSong, otherSong]
      const originalLength = songs.length
      const originalFirst = songs[0]
      
      const result = replaceOptimisticSong(songs, 'temp-123-abc', realSong)
      
      expect(songs).toHaveLength(originalLength)
      expect(songs[0]).toBe(originalFirst)
      expect(result).not.toBe(songs)
    })
    
    it('handles empty array', () => {
      const songs: Song[] = []
      const result = replaceOptimisticSong(songs, 'temp-123-abc', realSong)
      
      expect(result).toEqual([])
    })
  })
  
  describe('removeOptimisticSong', () => {
    const tempSong: Song = { ...mockSong, id: 'temp-123-abc' }
    const otherSong: Song = { ...mockSong, id: 'other-789' }
    
    it('removes optimistic song from array', () => {
      const songs = [otherSong, tempSong, mockSong]
      const result = removeOptimisticSong(songs, 'temp-123-abc')
      
      expect(result).toHaveLength(2)
      expect(result[0]).toBe(otherSong)
      expect(result[1]).toBe(mockSong)
      expect(result.find(s => s.id === 'temp-123-abc')).toBeUndefined()
    })
    
    it('does not modify array if temp ID not found', () => {
      const songs = [otherSong, mockSong]
      const result = removeOptimisticSong(songs, 'temp-not-found')
      
      expect(result).toHaveLength(2)
      expect(result[0]).toBe(otherSong)
      expect(result[1]).toBe(mockSong)
    })
    
    it('does not mutate original array', () => {
      const songs = [tempSong, otherSong]
      const originalLength = songs.length
      
      const result = removeOptimisticSong(songs, 'temp-123-abc')
      
      expect(songs).toHaveLength(originalLength)
      expect(result).not.toBe(songs)
    })
    
    it('handles empty array', () => {
      const songs: Song[] = []
      const result = removeOptimisticSong(songs, 'temp-123-abc')
      
      expect(result).toEqual([])
    })
    
    it('removes all instances of temp ID', () => {
      const tempSong2 = { ...tempSong }
      const songs = [tempSong, otherSong, tempSong2]
      const result = removeOptimisticSong(songs, 'temp-123-abc')
      
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(otherSong)
    })
  })
})