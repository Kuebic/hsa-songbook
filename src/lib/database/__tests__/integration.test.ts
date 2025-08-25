/**
 * Integration tests for QueryBuilder
 * Validates TypeScript types and real-world usage patterns
 */

import { describe, it, expect, vi } from 'vitest'
import { QueryBuilder } from '../queryBuilder'
import type { UserPermissions } from '../types'

// Mock Supabase client for testing
const createMockSupabase = () => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  textSearch: vi.fn().mockReturnThis(),
  overlaps: vi.fn().mockReturnThis(),
})

describe('QueryBuilder Integration', () => {
  it('should work with real Supabase types', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createMockSupabase() as any
    
    const query = new QueryBuilder(supabase, 'songs')
    
    // Build a complex query using fluent API
    const result = await query
      .select('id, title, artist')
      .eq('is_public', true)
      .ilike('title', '%test%')
      .orderBy('created_at', { ascending: false })
      .limit(10)
      .execute()
    
    // Result should have correct structure
    expect(result).toBeDefined()
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
  })

  it('should apply visibility filtering correctly', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createMockSupabase() as any
    
    const permissions: UserPermissions = {
      userId: 'test-user-123',
      roles: ['user'],
      canModerate: false,
      canAdmin: false
    }
    
    const query = new QueryBuilder(supabase, 'songs')
    
    const result = await query
      .select('*')
      .withVisibility(permissions)
      .execute()
    
    // Verify visibility filter was applied
    expect(supabase.or).toHaveBeenCalled()
    expect(result.error).toBeNull()
  })

  it('should handle pagination correctly', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createMockSupabase() as any
    supabase.select.mockImplementation((_columns: string, options?: any) => {
      if (options?.count) {
        // Return mock with count
        return {
          ...createMockSupabase(),
          single: vi.fn().mockResolvedValue({ 
            data: Array(50).fill({ id: 1, title: 'Test' }), 
            error: null,
            count: 50
          })
        }
      }
      return createMockSupabase()
    })
    
    const query = new QueryBuilder(supabase, 'songs')
    
    const result = await query
      .select('*')
      .paginate({ page: 2, limit: 20 })
      .execute()
    
    // Verify pagination was applied
    expect(supabase.range).toHaveBeenCalledWith(20, 39)
    expect(result.pagination).toBeDefined()
    if (result.pagination) {
      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(20)
      expect(result.pagination.hasNext).toBeDefined()
      expect(result.pagination.hasPrev).toBeDefined()
    }
  })

  it('should handle errors gracefully', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createMockSupabase() as any
    const testError = { message: 'Database error', code: 'PGRST116' }
    supabase.single.mockResolvedValue({ data: null, error: testError })
    
    const query = new QueryBuilder(supabase, 'songs')
    
    const result = await query
      .select('*')
      .eq('id', 'non-existent')
      .single()
      .execute()
    
    // Error should be transformed to DatabaseError
    expect(result.data).toBeNull()
    expect(result.error).toBeDefined()
    expect(result.error?.name).toBe('NotFoundError')
  })

  it('should support method chaining', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createMockSupabase() as any
    
    const query = new QueryBuilder(supabase, 'arrangements')
    
    const result = await query
      .select('*, songs(*)')
      .eq('is_public', true)
      .in('difficulty', ['beginner', 'intermediate'])
      .ilike('name', '%worship%')
      .orderBy('created_at')
      .limit(25)
      .execute()
    
    // All methods should have been called
    expect(supabase.eq).toHaveBeenCalledWith('is_public', true)
    expect(supabase.in).toHaveBeenCalledWith('difficulty', ['beginner', 'intermediate'])
    expect(supabase.ilike).toHaveBeenCalledWith('name', '%worship%')
    expect(supabase.order).toHaveBeenCalledWith('created_at', undefined)
    expect(supabase.limit).toHaveBeenCalledWith(25)
    expect(result.error).toBeNull()
  })

  it('should handle insert operations', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createMockSupabase() as any
    const mockData = { id: '123', title: 'New Song' }
    supabase.single.mockResolvedValue({ data: mockData, error: null })
    
    const query = new QueryBuilder(supabase, 'songs')
    
    const result = await query
      .insert({ title: 'New Song', artist: 'Test Artist', slug: 'new-song' })
      .select()
      .single()
      .execute()
    
    expect(supabase.insert).toHaveBeenCalled()
    expect(result.data).toEqual(mockData)
    expect(result.error).toBeNull()
  })

  it('should handle update operations', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createMockSupabase() as any
    
    const query = new QueryBuilder(supabase, 'songs')
    
    const result = await query
      .update({ title: 'Updated Title' })
      .eq('id', '123')
      .execute()
    
    expect(supabase.update).toHaveBeenCalledWith({ title: 'Updated Title' })
    expect(supabase.eq).toHaveBeenCalledWith('id', '123')
    expect(result.error).toBeNull()
  })

  it('should handle delete operations', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createMockSupabase() as any
    
    const query = new QueryBuilder(supabase, 'songs')
    
    const result = await query
      .delete()
      .eq('id', '123')
      .execute()
    
    expect(supabase.delete).toHaveBeenCalled()
    expect(supabase.eq).toHaveBeenCalledWith('id', '123')
    expect(result.error).toBeNull()
  })
})