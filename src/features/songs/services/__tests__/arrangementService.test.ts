import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { arrangementService } from '../arrangementService'
import type { Arrangement } from '../../types/song.types'

// Create mock chain helper
const createMockQuery = () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis()
  }
  return mockQuery
}

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn()
}

vi.mock('../../../lib/supabase', () => ({
  supabase: mockSupabase
}))

// Mock console methods to avoid test noise
const originalConsoleError = console.error
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn

beforeEach(() => {
  vi.clearAllMocks()
  console.error = vi.fn()
  console.log = vi.fn()
  console.warn = vi.fn()
  
  // Reset auth mock
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null
  })
})

afterEach(() => {
  console.error = originalConsoleError
  console.log = originalConsoleLog
  console.warn = originalConsoleWarn
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
          songs: { title: 'Test Song' }
        }
      ]

      const mockQuery = createMockQuery()
      mockQuery.order.mockResolvedValue({
        data: mockData,
        error: null
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await arrangementService.getAllArrangements()

      expect(mockSupabase.from).toHaveBeenCalledWith('arrangements')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.order).toHaveBeenCalledWith('name')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('arr-1')
      expect(result[0].name).toBe('Test Arrangement 1')
    })

    it('should handle empty results', async () => {
      const mockQuery = createMockQuery()
      mockQuery.order.mockResolvedValue({
        data: [],
        error: null
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await arrangementService.getAllArrangements()

      expect(mockSupabase.from).toHaveBeenCalledWith('arrangements')
      expect(result).toHaveLength(0)
    })

    it('should handle large results', async () => {
      const mockData = Array.from({ length: 25 }, (_, i) => ({
        id: `arr-${i + 1}`,
        name: `Arrangement ${i + 1}`,
        slug: `arrangement-${i + 1}`,
        song_id: 'song-123',
        key: 'C',
        tempo: 120,
        time_signature: '4/4',
        difficulty: 'beginner',
        tags: [],
        chord_data: '',
        created_by: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }))

      const mockQuery = createMockQuery()
      mockQuery.order.mockResolvedValue({
        data: mockData,
        error: null
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await arrangementService.getAllArrangements()

      expect(result).toHaveLength(25)
      expect(result[0].id).toBe('arr-1')
      expect(result[24].id).toBe('arr-25')
    })

    it('should handle Supabase errors', async () => {
      const mockQuery = createMockQuery()
      mockQuery.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB001' }
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(arrangementService.getAllArrangements()).rejects.toThrow('Database error')
    })

    it('should use cache for repeated requests', async () => {
      const mockData = [
        {
          id: 'arr-1',
          name: 'Cached Arrangement',
          slug: 'cached-arrangement',
          song_id: 'song-123',
          key: 'C',
          tempo: 120,
          time_signature: '4/4',
          difficulty: 'beginner',
          tags: [],
          chord_data: '',
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      const mockQuery = createMockQuery()
      mockQuery.order.mockResolvedValue({
        data: mockData,
        error: null
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      // First call
      const result1 = await arrangementService.getAllArrangements()
      
      // Second call should use cache
      const result2 = await arrangementService.getAllArrangements()
      
      expect(mockSupabase.from).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(result2)
      expect(result1[0].name).toBe('Cached Arrangement')
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
        difficulty: 'intermediate',
        tags: ['worship'],
        chord_data: '{title: Test}',
        created_by: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockQuery = createMockQuery()
      mockQuery.single.mockResolvedValue({
        data: mockData,
        error: null
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await arrangementService.getArrangementById('arr-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('arrangements')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'arr-1')
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result.id).toBe('arr-1')
      expect(result.name).toBe('Test Arrangement')
    })

    it('should handle not found error', async () => {
      const mockQuery = createMockQuery()
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(arrangementService.getArrangementById('non-existent')).rejects.toThrow('Arrangement with id non-existent not found')
    })

    it('should use cache for repeated requests', async () => {
      const mockData = {
        id: 'arr-1',
        name: 'Cached Arrangement',
        slug: 'cached-arrangement',
        song_id: 'song-123',
        key: 'C',
        tempo: 120,
        time_signature: '4/4',
        difficulty: 'beginner',
        tags: [],
        chord_data: '',
        created_by: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockQuery = createMockQuery()
      mockQuery.single.mockResolvedValue({
        data: mockData,
        error: null
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      // First call
      const result1 = await arrangementService.getArrangementById('arr-1')
      
      // Second call should use cache
      const result2 = await arrangementService.getArrangementById('arr-1')
      
      expect(mockSupabase.from).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(result2)
    })
  })

  describe('getArrangementBySlug', () => {
    it('should fetch arrangement by slug successfully', async () => {
      const mockData = {
        id: 'arr-1',
        name: 'Test Arrangement',
        slug: 'test-arrangement',
        song_id: 'song-123',
        key: 'G',
        tempo: 100,
        time_signature: '3/4',
        difficulty: 'advanced',
        tags: ['fingerstyle'],
        chord_data: '{title: Test}',
        created_by: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockQuery = createMockQuery()
      mockQuery.single.mockResolvedValue({
        data: mockData,
        error: null
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await arrangementService.getArrangementBySlug('test-arrangement')

      expect(mockSupabase.from).toHaveBeenCalledWith('arrangements')
      expect(mockQuery.eq).toHaveBeenCalledWith('slug', 'test-arrangement')
      expect(result.slug).toBe('test-arrangement')
    })

    it('should handle not found error by slug', async () => {
      const mockQuery = createMockQuery()
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(arrangementService.getArrangementBySlug('non-existent-slug')).rejects.toThrow('Arrangement with slug non-existent-slug not found')
    })
  })

  describe('getArrangementsBySong', () => {
    it('should fetch arrangements for a specific song', async () => {
      const mockData = [
        {
          id: 'arr-1',
          name: 'Easy Version',
          slug: 'easy-version',
          song_id: 'song-123',
          key: 'C',
          difficulty: 'beginner',
          tags: [],
          chord_data: '',
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'arr-2',
          name: 'Advanced Version',
          slug: 'advanced-version',
          song_id: 'song-123',
          key: 'G',
          difficulty: 'advanced',
          tags: ['fingerstyle'],
          chord_data: '',
          created_by: 'user-456',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ]

      const mockQuery = createMockQuery()
      mockQuery.order.mockResolvedValue({
        data: mockData,
        error: null
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await arrangementService.getArrangementsBySongId('song-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('arrangements')
      expect(mockQuery.eq).toHaveBeenCalledWith('song_id', 'song-123')
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Easy Version')
      expect(result[1].name).toBe('Advanced Version')
    })
  })

  describe('createArrangement', () => {
    it('should create arrangement successfully', async () => {
      const arrangementData: Partial<Arrangement> = {
        name: 'New Arrangement',
        songIds: ['song-123'],
        key: 'D',
        difficulty: 'intermediate',
        tags: ['acoustic'],
        chordData: '{title: New}'
      }

      const songData = {
        title: 'Test Song'
      }

      const createdData = {
        id: 'new-arr-1',
        name: 'New Arrangement',
        slug: 'test-song-new-arrangement',
        song_id: 'song-123',
        key: 'D',
        tempo: null,
        time_signature: '4/4',
        difficulty: 'intermediate',
        tags: ['acoustic'],
        chord_data: '{title: New}',
        created_by: 'user-123',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z'
      }

      // Mock for getting existing slugs
      const slugQuery = createMockQuery()
      slugQuery.select.mockResolvedValue({
        data: [],
        error: null
      })

      // Mock for getting song title
      const songQuery = createMockQuery()
      songQuery.single.mockResolvedValue({
        data: songData,
        error: null
      })

      // Mock for creating arrangement
      const createQuery = createMockQuery()
      createQuery.single.mockResolvedValue({
        data: createdData,
        error: null
      })

      mockSupabase.from
        .mockReturnValueOnce(slugQuery)  // First call for existing slugs
        .mockReturnValueOnce(songQuery)  // Second call for song title
        .mockReturnValueOnce(createQuery) // Third call for creating arrangement

      const result = await arrangementService.createArrangement(arrangementData)

      expect(result.id).toBe('new-arr-1')
      expect(result.name).toBe('New Arrangement')
      expect(result.slug).toBe('test-song-new-arrangement')
    })

    it('should handle missing authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const arrangementData: Partial<Arrangement> = {
        name: 'New Arrangement',
        songIds: ['song-123'],
        chordData: '{title: New}'
      }

      await expect(arrangementService.createArrangement(arrangementData)).rejects.toThrow('Authentication required')
    })

    it('should handle creation errors', async () => {
      const arrangementData: Partial<Arrangement> = {
        name: 'New Arrangement',
        songIds: ['song-123'],
        chordData: '{title: New}'
      }

      // Mock for getting existing slugs
      const slugQuery = createMockQuery()
      slugQuery.select.mockResolvedValue({
        data: [],
        error: null
      })

      // Mock for getting song title
      const songQuery = createMockQuery()
      songQuery.single.mockResolvedValue({
        data: { title: 'Test Song' },
        error: null
      })

      // Mock for creating arrangement with error
      const createQuery = createMockQuery()
      createQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Unique constraint violation', code: '23505' }
      })

      mockSupabase.from
        .mockReturnValueOnce(slugQuery)  
        .mockReturnValueOnce(songQuery)  
        .mockReturnValueOnce(createQuery)

      await expect(arrangementService.createArrangement(arrangementData)).rejects.toThrow('Unique constraint violation')
    })

    it('should map form data correctly to database schema', async () => {
      const arrangementData: Partial<Arrangement> = {
        name: 'Complete Arrangement',
        songIds: ['song-123'],
        key: 'E',
        tempo: 120,
        timeSignature: '6/8',
        difficulty: 'advanced',
        tags: ['worship', 'contemporary'],
        chordData: '{title: Complete}',
        description: 'A complete arrangement',
        capo: 3,
        duration: 240
      }

      const songData = { title: 'Song Title' }

      // Mock for getting existing slugs
      const slugQuery = createMockQuery()
      slugQuery.select.mockResolvedValue({
        data: [],
        error: null
      })

      // Mock for getting song title
      const songQuery = createMockQuery()
      songQuery.single.mockResolvedValue({
        data: songData,
        error: null
      })

      // Mock for creating arrangement
      const createQuery = createMockQuery()
      createQuery.single.mockResolvedValue({
        data: {
          id: 'created-1',
          name: 'Complete Arrangement',
          slug: 'song-title-complete-arrangement',
          song_id: 'song-123',
          key: 'E',
          tempo: 120,
          time_signature: '6/8',
          difficulty: 'advanced',
          tags: ['worship', 'contemporary'],
          chord_data: '{title: Complete}',
          description: 'A complete arrangement',
          capo: 3,
          duration: 240,
          created_by: 'user-123',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z'
        },
        error: null
      })

      mockSupabase.from
        .mockReturnValueOnce(slugQuery)
        .mockReturnValueOnce(songQuery)
        .mockReturnValueOnce(createQuery)

      const result = await arrangementService.createArrangement(arrangementData)

      expect(createQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Complete Arrangement',
        song_id: 'song-123',
        key: 'E',
        tempo: 120,
        time_signature: '6/8',
        difficulty: 'advanced',
        tags: ['worship', 'contemporary'],
        chord_data: '{title: Complete}',
        description: 'A complete arrangement'
      }))
      
      expect(result.name).toBe('Complete Arrangement')
      expect(result.tempo).toBe(120)
      expect(result.timeSignature).toBe('6/8')
    })
  })
})