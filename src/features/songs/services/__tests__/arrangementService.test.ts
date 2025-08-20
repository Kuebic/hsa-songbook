import { describe, it, expect, vi, beforeEach } from 'vitest'
import { arrangementService } from '../arrangementService'
import type { Arrangement } from '../../types/song.types'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn()
  }))
}

vi.mock('../../../lib/supabase', () => ({
  supabase: mockSupabase
}))

// Mock console methods to avoid test noise
const originalConsoleError = console.error
const originalConsoleLog = console.log

beforeEach(() => {
  vi.clearAllMocks()
  console.error = vi.fn()
  console.log = vi.fn()
  
  // Reset auth mock
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null
  })
})

afterEach(() => {
  console.error = originalConsoleError
  console.log = originalConsoleLog
})

describe('arrangementService', () => {
  describe('getAllArrangements', () => {
    it('should fetch all arrangements successfully', async () => {
      const mockData = [
        {
          id: 'arr-1',
          name: 'Test Arrangement 1',
          slug: 'test-arrangement-1',
          song_id: 'song-123',
          key: 'C',
          tempo: 120,
          time_signature: '4/4',
          difficulty: 'beginner',
          tags: ['acoustic'],
          chord_data: '{title: Test}',
          description: 'Test description',
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_public: true
        }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.single = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: 1
      })

      const result = await arrangementService.getAllArrangements()

      expect(mockSupabase.from).toHaveBeenCalledWith('arrangements')
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact' })
      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true)
      expect(mockQuery.order).toHaveBeenCalledWith('name')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('arr-1')
      expect(result[0].name).toBe('Test Arrangement 1')
    })

    it('should handle empty results', async () => {
      const mockQuery = mockSupabase.from()
      mockQuery.single = vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      const result = await arrangementService.getAllArrangements()

      expect(mockSupabase.from).toHaveBeenCalledWith('arrangements')
      expect(result).toHaveLength(0)
    })

    it('should handle large results', async () => {
      const mockData = Array.from({ length: 25 }, (_, i) => ({
        id: `arr-${i + 1}`,
        name: `Test Arrangement ${i + 1}`,
        slug: `test-arrangement-${i + 1}`,
        song_id: 'song-123',
        key: 'C',
        tempo: 120,
        time_signature: '4/4',
        difficulty: 'beginner',
        tags: ['acoustic'],
        chord_data: '{title: Test}',
        description: 'Test description',
        created_by: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_public: true
      }))

      const mockQuery = mockSupabase.from()
      mockQuery.single = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: 25
      })

      const result = await arrangementService.getAllArrangements()

      expect(result).toHaveLength(25)
      expect(result[0].name).toBe('Test Arrangement 1')
      expect(result[24].name).toBe('Test Arrangement 25')
    })

    it('should handle Supabase errors', async () => {
      const mockQuery = mockSupabase.from()
      mockQuery.single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null
      })

      await expect(arrangementService.getAllArrangements()).rejects.toThrow('Database error')
    })

    it('should use cache for repeated requests', async () => {
      const mockData = [{ id: 'arr-1', name: 'Test' }]
      const mockQuery = mockSupabase.from()
      mockQuery.single = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: 1
      })

      // First call
      await arrangementService.getAllArrangements()
      
      // Second call with same parameters should use cache
      await arrangementService.getAllArrangements()

      expect(mockSupabase.from).toHaveBeenCalledTimes(1)
    })
  })

  describe('getArrangementById', () => {
    it('should fetch arrangement by ID successfully', async () => {
      const mockData = {
        id: 'arr-1',
        name: 'Test Arrangement',
        slug: 'test-arrangement',
        song_id: 'song-123',
        key: 'C',
        tempo: 120,
        time_signature: '4/4',
        difficulty: 'beginner',
        tags: ['acoustic'],
        chord_data: '{title: Test}',
        description: 'Test description',
        created_by: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await arrangementService.getArrangementById('arr-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('arrangements')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'arr-1')
      expect(result.id).toBe('arr-1')
      expect(result.name).toBe('Test Arrangement')
      expect(result.songIds).toEqual(['song-123'])
    })

    it('should handle not found error', async () => {
      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      await expect(arrangementService.getArrangementById('non-existent')).rejects.toThrow(
        'Arrangement with id non-existent not found'
      )
    })

    it('should use cache for repeated requests', async () => {
      const mockData = { id: 'arr-1', name: 'Test' }
      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: mockData,
        error: null
      })

      // First call
      await arrangementService.getArrangementById('arr-1')
      
      // Second call should use cache
      await arrangementService.getArrangementById('arr-1')

      expect(mockSupabase.from).toHaveBeenCalledTimes(1)
    })
  })

  describe('getArrangementBySlug', () => {
    it('should fetch arrangement by slug successfully', async () => {
      const mockData = {
        id: 'arr-1',
        name: 'Test Arrangement',
        slug: 'test-arrangement',
        song_id: 'song-123',
        key: 'C',
        tempo: null,
        time_signature: '4/4',
        difficulty: 'beginner',
        tags: [],
        chord_data: '',
        description: null,
        created_by: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await arrangementService.getArrangementBySlug('test-arrangement')

      expect(mockQuery.eq).toHaveBeenCalledWith('slug', 'test-arrangement')
      expect(result.slug).toBe('test-arrangement')
    })

    it('should handle not found error by slug', async () => {
      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      await expect(arrangementService.getArrangementBySlug('non-existent-slug')).rejects.toThrow(
        'Arrangement with slug non-existent-slug not found'
      )
    })
  })

  describe('getArrangementsBySong', () => {
    it('should fetch arrangements for a specific song', async () => {
      const mockData = [
        {
          id: 'arr-1',
          name: 'Arrangement 1',
          slug: 'arrangement-1',
          song_id: 'song-123',
          key: 'C',
          tempo: 120,
          time_signature: '4/4',
          difficulty: 'beginner',
          tags: [],
          chord_data: '',
          description: null,
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const mockQuery = mockSupabase.from()
      mockQuery.single = vi.fn().mockResolvedValue({
        data: mockData,
        error: null
      })

      const result = await arrangementService.getArrangementsBySongId('song-123')

      expect(mockQuery.eq).toHaveBeenCalledWith('song_id', 'song-123')
      expect(mockQuery.order).toHaveBeenCalledWith('name')
      expect(result).toHaveLength(1)
      expect(result[0].songIds).toEqual(['song-123'])
    })
  })

  describe('createArrangement', () => {
    it('should create arrangement successfully', async () => {
      const formData: Partial<Arrangement> = {
        name: 'New Arrangement',
        slug: 'new-arrangement',
        songIds: ['song-123'],
        key: 'C',
        tempo: 120,
        timeSignature: '4/4',
        difficulty: 'beginner',
        tags: ['acoustic'],
        chordData: '{title: New Arrangement}',
        description: 'A new arrangement'
      }

      const mockCreatedData = {
        id: 'arr-new',
        name: 'New Arrangement',
        slug: 'new-arrangement',
        song_id: 'song-123',
        key: 'C',
        tempo: 120,
        time_signature: '4/4',
        difficulty: 'beginner',
        tags: ['acoustic'],
        chord_data: '{title: New Arrangement}',
        description: 'A new arrangement',
        created_by: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: mockCreatedData,
        error: null
      })

      const result = await arrangementService.createArrangement(formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('arrangements')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        name: 'New Arrangement',
        song_id: 'song-123',
        slug: 'new-arrangement',
        chord_data: '{title: New Arrangement}',
        key: 'C',
        tempo: 120,
        time_signature: '4/4',
        difficulty: 'beginner',
        description: 'A new arrangement',
        tags: ['acoustic'],
        created_by: 'user-123'
      })
      expect(result.id).toBe('arr-new')
      expect(result.name).toBe('New Arrangement')
    })

    it('should handle missing authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const formData: Partial<Arrangement> = {
        name: 'Test',
        difficulty: 'beginner',
        key: 'C',
        tags: [],
        chordData: ''
      }

      await expect(arrangementService.createArrangement(formData)).rejects.toThrow(
        'Authentication required'
      )
    })

    it('should handle creation errors', async () => {
      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Unique constraint violation' }
      })

      const formData: Partial<Arrangement> = {
        name: 'Duplicate',
        difficulty: 'beginner',
        key: 'C',
        tags: [],
        chordData: ''
      }

      await expect(arrangementService.createArrangement(formData)).rejects.toThrow(
        'Unique constraint violation'
      )
    })

    it('should map form data correctly to database schema', async () => {
      const formData: Partial<Arrangement> = {
        name: 'Complex Arrangement',
        slug: 'complex-arrangement',
        songIds: ['song-456'],
        key: 'F#',
        tempo: 95,
        timeSignature: '6/8',
        difficulty: 'advanced',
        tags: ['jazz', 'complex'],
        chordData: 'alternative chord data',
        chordProText: '{title: Complex}',
        description: 'Complex description',
        notes: 'Some notes',
        capo: 3,
        duration: 180
      }

      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: { 
          id: 'arr-complex',
          ...formData,
          song_id: 'song-456',
          chord_data: '{title: Complex}', // chordProText should take precedence
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        error: null
      })

      await arrangementService.createArrangement(formData)

      expect(mockQuery.insert).toHaveBeenCalledWith({
        name: 'Complex Arrangement',
        song_id: 'song-456',
        slug: 'complex-arrangement',
        chord_data: '{title: Complex}', // chordProText takes precedence over chordData
        key: 'F#',
        tempo: 95,
        time_signature: '6/8',
        difficulty: 'advanced',
        description: 'Complex description',
        tags: ['jazz', 'complex'],
        created_by: 'user-123'
      })
    })
  })

  describe('updateArrangement', () => {
    it('should update arrangement successfully', async () => {
      const updateData: Partial<Partial<Arrangement>> = {
        name: 'Updated Arrangement',
        key: 'G',
        tempo: 140
      }

      const mockUpdatedData = {
        id: 'arr-1',
        name: 'Updated Arrangement',
        slug: 'original-slug',
        song_id: 'song-123',
        key: 'G',
        tempo: 140,
        time_signature: '4/4',
        difficulty: 'beginner',
        tags: [],
        chord_data: '',
        description: null,
        created_by: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: mockUpdatedData,
        error: null
      })

      const result = await arrangementService.updateArrangement('arr-1', updateData)

      expect(mockQuery.update).toHaveBeenCalledWith({
        name: 'Updated Arrangement',
        key: 'G',
        tempo: 140
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'arr-1')
      expect(result.name).toBe('Updated Arrangement')
      expect(result.key).toBe('G')
      expect(result.tempo).toBe(140)
    })

    it('should handle partial updates correctly', async () => {
      const updateData: Partial<Partial<Arrangement>> = {
        tags: ['updated-tag']
      }

      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: {
          id: 'arr-1',
          name: 'Original Name',
          tags: ['updated-tag']
        },
        error: null
      })

      await arrangementService.updateArrangement('arr-1', updateData)

      expect(mockQuery.update).toHaveBeenCalledWith({
        tags: ['updated-tag']
      })
    })

    it('should handle not found error during update', async () => {
      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      await expect(arrangementService.updateArrangement('non-existent', {})).rejects.toThrow(
        'Arrangement with id non-existent not found'
      )
    })

    it('should map chordProText to chord_data during update', async () => {
      const updateData: Partial<Partial<Arrangement>> = {
        chordProText: '{title: Updated ChordPro}'
      }

      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: { id: 'arr-1', chord_data: '{title: Updated ChordPro}' },
        error: null
      })

      await arrangementService.updateArrangement('arr-1', updateData)

      expect(mockQuery.update).toHaveBeenCalledWith({
        chord_data: '{title: Updated ChordPro}'
      })
    })
  })

  describe('deleteArrangement', () => {
    it('should delete arrangement successfully', async () => {
      const mockQuery = mockSupabase.from()
      mockQuery.delete = vi.fn().mockResolvedValue({
        error: null
      })

      await arrangementService.deleteArrangement('arr-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('arrangements')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'arr-1')
    })

    it('should handle deletion errors', async () => {
      const mockQuery = mockSupabase.from()
      mockQuery.delete = vi.fn().mockResolvedValue({
        error: { message: 'Cannot delete referenced row' }
      })

      await expect(arrangementService.deleteArrangement('arr-1')).rejects.toThrow(
        'Cannot delete referenced row'
      )
    })
  })

  describe('data mapping', () => {
    it('should map Supabase data to Arrangement type correctly', async () => {
      const mockSupabaseData = {
        id: 'arr-1',
        name: 'Test Arrangement',
        slug: 'test-arrangement',
        song_id: 'song-123',
        key: 'Bb',
        tempo: 85,
        time_signature: '3/4',
        difficulty: 'intermediate',
        tags: ['waltz', 'classical'],
        chord_data: '{title: Test}\n[Bb]Example [F]chord [Bb]progression',
        description: 'A beautiful waltz arrangement',
        created_by: 'user-456',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: mockSupabaseData,
        error: null
      })

      const result = await arrangementService.getArrangementById('arr-1')

      expect(result).toEqual({
        id: 'arr-1',
        name: 'Test Arrangement',
        slug: 'test-arrangement',
        songIds: ['song-123'],
        key: 'Bb',
        tempo: 85,
        timeSignature: '3/4',
        difficulty: 'intermediate',
        tags: ['waltz', 'classical'],
        chordData: '{title: Test}\n[Bb]Example [F]chord [Bb]progression',
        description: 'A beautiful waltz arrangement',
        createdBy: 'user-456',
        metadata: {
          isPublic: true,
          views: 0
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z'
      })
    })

    it('should handle null values correctly', async () => {
      const mockSupabaseData = {
        id: 'arr-minimal',
        name: 'Minimal Arrangement',
        slug: 'minimal-arrangement',
        song_id: 'song-123',
        key: null,
        tempo: null,
        time_signature: null,
        difficulty: null,
        tags: null,
        chord_data: null,
        description: null,
        created_by: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: mockSupabaseData,
        error: null
      })

      const result = await arrangementService.getArrangementById('arr-minimal')

      expect(result.key).toBe('')
      expect(result.tempo).toBeUndefined()
      expect(result.timeSignature).toBe(null)
      expect(result.difficulty).toBe('beginner')
      expect(result.tags).toEqual([])
      expect(result.chordData).toBe(null)
      expect(result.description).toBeUndefined()
      expect(result.createdBy).toBe('')
    })
  })

  describe('error handling', () => {
    it('should handle generic network errors', async () => {
      const mockQuery = mockSupabase.from()
      mockQuery.single.mockRejectedValue(new Error('Network connection failed'))

      await expect(arrangementService.getArrangementById('arr-1')).rejects.toThrow(
        'Failed to fetch arrangement'
      )
    })

    it('should handle malformed data gracefully', async () => {
      const mockQuery = mockSupabase.from()
      mockQuery.single.mockResolvedValue({
        data: { invalid: 'data' },
        error: null
      })

      // Should not throw, just return with default values
      const result = await arrangementService.getArrangementById('arr-1')
      expect(result.id).toBeUndefined()
    })
  })
})