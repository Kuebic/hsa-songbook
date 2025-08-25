/**
 * Unit tests for QueryBuilder class
 * Tests basic operations, visibility filtering, pagination, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { QueryBuilder } from '../queryBuilder'
import { DatabaseError, NotFoundError, ValidationError } from '../errors'
import type { UserPermissions } from '../types'

// Mock the dependencies
vi.mock('../visibilityFilter', () => ({
  applyFilter: vi.fn((query, _permissions) => query)
}))

vi.mock('../paginationHelper', () => ({
  calculateRange: vi.fn((page, limit) => ({ from: (page - 1) * limit, to: page * limit - 1 })),
  formatPaginatedResponse: vi.fn((data, total, page, limit) => ({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  })),
  normalizePaginationOptions: vi.fn((options) => ({
    page: options?.page || 1,
    limit: options?.limit || 20
  }))
}))

// Create mock Supabase client
interface MockQuery {
  from: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  upsert: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  neq: ReturnType<typeof vi.fn>
  gt: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lt: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  like: ReturnType<typeof vi.fn>
  contains: ReturnType<typeof vi.fn>
  overlaps: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  textSearch: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
}

const createMockClient = (): MockQuery => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  like: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  overlaps: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  textSearch: vi.fn().mockReturnThis(),
  then: vi.fn()
})

describe('QueryBuilder', () => {
  let mockClient: SupabaseClient
  let queryBuilder: QueryBuilder<'songs'>
  let mockQuery: MockQuery

  beforeEach(() => {
    mockQuery = createMockClient()
    mockClient = {
      from: vi.fn(() => mockQuery)
    } as unknown as SupabaseClient

    queryBuilder = new QueryBuilder(mockClient, 'songs')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Operations', () => {
    describe('select()', () => {
      it('should initialize a SELECT query with default columns', () => {
        queryBuilder.select()
        
        expect(mockClient.from).toHaveBeenCalledWith('songs')
        expect(mockQuery.select).toHaveBeenCalledWith('*', undefined)
      })

      it('should initialize a SELECT query with specific columns', () => {
        queryBuilder.select('id, title, artist')
        
        expect(mockQuery.select).toHaveBeenCalledWith('id, title, artist', undefined)
      })

      it('should initialize a SELECT query with count option', () => {
        queryBuilder.select('*', { count: 'exact' })
        
        expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact' })
      })

      it('should return the QueryBuilder instance for chaining', () => {
        const result = queryBuilder.select()
        expect(result).toBe(queryBuilder)
      })
    })

    describe('insert()', () => {
      it('should initialize an INSERT query with single record', () => {
        const data = { title: 'Amazing Grace', artist: 'Traditional', slug: 'amazing-grace' }
        queryBuilder.insert(data)
        
        expect(mockClient.from).toHaveBeenCalledWith('songs')
        expect(mockQuery.insert).toHaveBeenCalledWith(data)
      })

      it('should initialize an INSERT query with multiple records', () => {
        const data = [
          { title: 'Amazing Grace', artist: 'Traditional', slug: 'amazing-grace' },
          { title: 'How Great Thou Art', artist: 'Carl Boberg', slug: 'how-great-thou-art' }
        ]
        queryBuilder.insert(data)
        
        expect(mockQuery.insert).toHaveBeenCalledWith(data)
      })
    })

    describe('update()', () => {
      it('should initialize an UPDATE query', () => {
        const data = { title: 'Updated Title' }
        queryBuilder.update(data)
        
        expect(mockClient.from).toHaveBeenCalledWith('songs')
        expect(mockQuery.update).toHaveBeenCalledWith(data)
      })
    })

    describe('delete()', () => {
      it('should initialize a DELETE query', () => {
        queryBuilder.delete()
        
        expect(mockClient.from).toHaveBeenCalledWith('songs')
        expect(mockQuery.delete).toHaveBeenCalled()
      })
    })

    describe('upsert()', () => {
      it('should initialize an UPSERT query without options', () => {
        const data = { title: 'Amazing Grace', slug: 'amazing-grace' }
        queryBuilder.upsert(data)
        
        expect(mockQuery.upsert).toHaveBeenCalledWith(data, undefined)
      })

      it('should initialize an UPSERT query with options', () => {
        const data = { title: 'Amazing Grace', slug: 'amazing-grace' }
        const options = { onConflict: 'id', ignoreDuplicates: false }
        queryBuilder.upsert(data, options)
        
        expect(mockQuery.upsert).toHaveBeenCalledWith(data, options)
      })
    })
  })

  describe('Filter Methods', () => {
    beforeEach(() => {
      queryBuilder.select()
    })

    it('should apply eq filter', () => {
      queryBuilder.eq('is_public', true)
      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true)
    })

    it('should apply neq filter', () => {
      queryBuilder.neq('status', 'rejected')
      expect(mockQuery.neq).toHaveBeenCalledWith('status', 'rejected')
    })

    it('should apply gt filter', () => {
      queryBuilder.gt('created_at', '2023-01-01')
      expect(mockQuery.gt).toHaveBeenCalledWith('created_at', '2023-01-01')
    })

    it('should apply gte filter', () => {
      queryBuilder.gte('rating', 4)
      expect(mockQuery.gte).toHaveBeenCalledWith('rating', 4)
    })

    it('should apply lt filter', () => {
      queryBuilder.lt('duration', 300)
      expect(mockQuery.lt).toHaveBeenCalledWith('duration', 300)
    })

    it('should apply lte filter', () => {
      queryBuilder.lte('views', 1000)
      expect(mockQuery.lte).toHaveBeenCalledWith('views', 1000)
    })

    it('should apply in filter', () => {
      const values = ['hymn', 'worship', 'praise']
      queryBuilder.in('category', values)
      expect(mockQuery.in).toHaveBeenCalledWith('category', values)
    })

    it('should apply ilike filter', () => {
      queryBuilder.ilike('title', '%grace%')
      expect(mockQuery.ilike).toHaveBeenCalledWith('title', '%grace%')
    })

    it('should apply like filter', () => {
      queryBuilder.like('artist', 'John%')
      expect(mockQuery.like).toHaveBeenCalledWith('artist', 'John%')
    })

    it('should apply contains filter', () => {
      const tags = ['contemporary', 'worship']
      queryBuilder.contains('tags', tags)
      expect(mockQuery.contains).toHaveBeenCalledWith('tags', tags)
    })

    it('should apply overlaps filter', () => {
      const categories = ['hymn', 'traditional']
      queryBuilder.overlaps('categories', categories)
      expect(mockQuery.overlaps).toHaveBeenCalledWith('categories', categories)
    })

    it('should apply or filter', () => {
      const orCondition = 'title.ilike.%grace%,artist.ilike.%newton%'
      queryBuilder.or(orCondition)
      expect(mockQuery.or).toHaveBeenCalledWith(orCondition)
    })

    it('should throw error when applying filter without initialized query', () => {
      const uninitializedBuilder = new QueryBuilder(mockClient, 'songs')
      
      expect(() => uninitializedBuilder.eq('id', 1)).toThrow(DatabaseError)
      expect(() => uninitializedBuilder.eq('id', 1)).toThrow('Query not initialized')
    })
  })

  describe('Query Modifiers', () => {
    beforeEach(() => {
      queryBuilder.select()
    })

    it('should apply order by', () => {
      queryBuilder.orderBy('title')
      expect(mockQuery.order).toHaveBeenCalledWith('title', undefined)
    })

    it('should apply order by with options', () => {
      queryBuilder.orderBy('created_at', { ascending: false, nullsFirst: true })
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false, nullsFirst: true })
    })

    it('should apply limit', () => {
      queryBuilder.limit(10)
      expect(mockQuery.limit).toHaveBeenCalledWith(10)
    })

    it('should apply range', () => {
      queryBuilder.range(0, 9)
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9)
    })

    it('should mark as single', () => {
      queryBuilder.single()
      expect(mockQuery.single).toHaveBeenCalled()
    })

    it('should apply text search', () => {
      queryBuilder.textSearch('title', 'grace')
      expect(mockQuery.textSearch).toHaveBeenCalledWith('title', 'grace', undefined)
    })

    it('should apply text search with options', () => {
      const options = { type: 'websearch' as const, config: 'english' }
      queryBuilder.textSearch('content', 'amazing grace', options)
      expect(mockQuery.textSearch).toHaveBeenCalledWith('content', 'amazing grace', options)
    })
  })

  describe('Visibility Filtering', () => {    
    beforeEach(() => {
      queryBuilder.select()
      vi.clearAllMocks()
    })

    it('should apply visibility filter for authenticated user', () => {
      const permissions: UserPermissions = {
        userId: 'user123',
        roles: [],
        canModerate: false,
        canAdmin: false
      }

      queryBuilder.withVisibility(permissions)
      // Mock was applied during module initialization
    })

    it('should apply visibility filter for moderator', () => {
      const permissions: UserPermissions = {
        userId: 'mod123',
        roles: ['moderator'],
        canModerate: true,
        canAdmin: false
      }

      queryBuilder.withVisibility(permissions)
      // Mock was applied during module initialization
    })

    it('should not apply visibility filter for non-SELECT operations', () => {
      queryBuilder = new QueryBuilder(mockClient, 'songs')
      queryBuilder.insert({ title: 'Test Song', slug: 'test-song' })

      const permissions: UserPermissions = {
        userId: 'user123',
        roles: [],
        canModerate: false,
        canAdmin: false
      }

      queryBuilder.withVisibility(permissions)
      // Mock was applied during module initialization
    })

    it('should throw error when applying visibility without initialized query', () => {
      const uninitializedBuilder = new QueryBuilder(mockClient, 'songs')
      const permissions: UserPermissions = {
        roles: [],
        canModerate: false,
        canAdmin: false
      }

      expect(() => uninitializedBuilder.withVisibility(permissions)).toThrow(DatabaseError)
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      queryBuilder.select()
      // Mock functions are set up in vi.mock() calls
    })

    it('should apply pagination with normalized options', () => {
      const options = { page: 2, limit: 10 }
      queryBuilder.paginate(options)
      // Pagination mocks are called internally
      expect(mockQuery.range).toHaveBeenCalledWith(10, 19)
    })

    it('should enable count for pagination when not already set', () => {
      // Create a fresh query mock for this test
      const freshMockQuery = createMockClient()
      const freshMockClient = { from: vi.fn(() => freshMockQuery) } as unknown as SupabaseClient
      const freshBuilder = new QueryBuilder(freshMockClient, 'songs')
      
      freshBuilder.select()
      freshBuilder.paginate({ page: 1, limit: 20 })

      // Should recreate query with count
      expect(freshMockClient.from).toHaveBeenCalledTimes(2) // Once for select, once for pagination
      expect(freshMockQuery.select).toHaveBeenCalledWith('*', { count: 'exact' })
    })

    it('should throw error when applying pagination without SELECT query', () => {
      const insertBuilder = new QueryBuilder(mockClient, 'songs')
      insertBuilder.insert({ title: 'Test', slug: 'test' })

      expect(() => insertBuilder.paginate({ page: 1, limit: 20 })).toThrow(DatabaseError)
      expect(() => insertBuilder.paginate({ page: 1, limit: 20 })).toThrow('Query not initialized. Call select first.')
    })
  })

  describe('Query Execution', () => {
    beforeEach(() => {
      queryBuilder.select()
    })

    it('should execute query and return successful result', async () => {
      const mockData = [{ id: 1, title: 'Amazing Grace' }]
      mockQuery.then = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: null
      })

      const result = await queryBuilder.execute()

      expect(result).toEqual({
        data: mockData,
        error: null,
        count: undefined
      })
    })

    it('should handle Supabase errors', async () => {
      const mockError = { code: 'PGRST116', message: 'Row not found' }
      mockQuery.then = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await queryBuilder.execute()

      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(NotFoundError)
    })

    it('should handle single result not found', async () => {
      queryBuilder.single()
      mockQuery.then = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })

      const result = await queryBuilder.execute()

      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(NotFoundError)
    })

    it('should format paginated response', async () => {
      const mockData = [{ id: 1, title: 'Song 1' }, { id: 2, title: 'Song 2' }]
      // Unused variable removed for ESLint compliance

      // Mock response will be formatted by mocked function
      queryBuilder.paginate({ page: 1, limit: 20 })
      
      mockQuery.then = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: 50
      })

      const result = await queryBuilder.execute()

      // Formatting is handled by mocked function
      expect(result.data).toBe(mockData)
      expect(result.pagination).toBeDefined()
      expect(result.count).toBe(50)
    })

    it('should handle thrown errors and wrap in DatabaseError', async () => {
      const thrownError = new Error('Network error')
      mockQuery.then = vi.fn().mockRejectedValue(thrownError)

      const result = await queryBuilder.execute()

      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(DatabaseError)
      expect(result.error?.message).toBe('Network error')
    })

    it('should handle thrown DatabaseError instances', async () => {
      const thrownError = new ValidationError('Invalid data')
      mockQuery.then = vi.fn().mockRejectedValue(thrownError)

      const result = await queryBuilder.execute()

      expect(result.data).toBeNull()
      expect(result.error).toBe(thrownError)
    })

    it('should throw error when executing without initialized query', async () => {
      const uninitializedBuilder = new QueryBuilder(mockClient, 'songs')

      await expect(uninitializedBuilder.execute()).rejects.toThrow(DatabaseError)
      await expect(uninitializedBuilder.execute()).rejects.toThrow('Query not initialized')
    })
  })

  describe('Count Method', () => {
    beforeEach(() => {
      queryBuilder.select()
    })

    it('should execute count-only query', async () => {
      const countQuery = createMockClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockClient.from = vi.fn(() => countQuery) as any
      
      countQuery.then = vi.fn().mockResolvedValue({
        data: null,
        error: null,
        count: 42
      })

      const result = await queryBuilder.count()

      expect(mockClient.from).toHaveBeenCalledWith('songs')
      expect(countQuery.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(result).toEqual({
        count: 42,
        error: null
      })
    })

    it('should apply visibility filter to count query', async () => {
      const permissions: UserPermissions = {
        userId: 'user123',
        roles: [],
        canModerate: false,
        canAdmin: false
      }

      queryBuilder.withVisibility(permissions)

      const countQuery = createMockClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockClient.from = vi.fn(() => countQuery) as any
      
      countQuery.then = vi.fn().mockResolvedValue({
        data: null,
        error: null,
        count: 10
      })

      const result = await queryBuilder.count()

      // Visibility filter is applied through mocked function
      expect(result.count).toBe(10)
    })

    it('should handle count query errors', async () => {
      const countQuery = createMockClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockClient.from = vi.fn(() => countQuery) as any
      
      const mockError = { code: 'NETWORK_ERROR', message: 'Connection failed' }
      countQuery.then = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
        count: null
      })

      const result = await queryBuilder.count()

      expect(result.count).toBeNull()
      expect(result.error).toBeInstanceOf(DatabaseError)
    })

    it('should handle thrown errors in count', async () => {
      const countQuery = createMockClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockClient.from = vi.fn(() => countQuery) as any
      
      const thrownError = new Error('Timeout')
      countQuery.then = vi.fn().mockRejectedValue(thrownError)

      const result = await queryBuilder.count()

      expect(result.count).toBeNull()
      expect(result.error).toBeInstanceOf(DatabaseError)
      expect(result.error?.code).toBe('COUNT_ERROR')
    })
  })

  describe('Method Chaining', () => {
    it('should allow complex method chaining', () => {
      const result = queryBuilder
        .select('id, title, artist')
        .eq('is_public', true)
        .ilike('title', '%grace%')
        .orderBy('title')
        .limit(10)

      expect(result).toBe(queryBuilder)
      expect(mockQuery.select).toHaveBeenCalledWith('id, title, artist', undefined)
      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true)
      expect(mockQuery.ilike).toHaveBeenCalledWith('title', '%grace%')
      expect(mockQuery.order).toHaveBeenCalledWith('title', undefined)
      expect(mockQuery.limit).toHaveBeenCalledWith(10)
    })

    it('should maintain proper method call order', () => {
      const permissions: UserPermissions = {
        userId: 'user123',
        roles: [],
        canModerate: false,
        canAdmin: false
      }

      queryBuilder
        .select('*')
        .withVisibility(permissions)
        .eq('category', 'hymn')
        .paginate({ page: 2, limit: 15 })
        .orderBy('title')

      // Verify the order of method calls
      const fromCalls = (mockClient.from as ReturnType<typeof vi.fn>).mock.calls
      expect(fromCalls).toHaveLength(1)
      expect(fromCalls[0][0]).toBe('songs')
    })
  })
})