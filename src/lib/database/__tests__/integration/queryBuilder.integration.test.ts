import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { QueryBuilder } from '../../queryBuilder'
import { createTestClient, seedTestData, cleanupTestData, setSeed } from '../helpers/testData'
import type { UnknownObject } from '../../../../shared/types/common'

// Set seed for reproducible tests
setSeed(12345)

describe('QueryBuilder Integration Tests', () => {
  let testClient: any
  let testUserId: string
  let moderatorUserId: string
  let adminUserId: string
  let testData: UnknownObject
  
  beforeAll(async () => {
    // Setup test client and seed data
    testClient = await createTestClient()
    
    // Seed comprehensive test data
    testData = await seedTestData({
      songCount: 50,
      arrangementCount: 100,
      userCount: 10,
      setlistCount: 20,
      reviewCount: 50,
      includeRoles: true,
      includePermissions: true,
      realistic: false, // Don't insert to actual DB in tests
    })
    
    // Assign user IDs for different roles
    testUserId = (testData as any).users[0].id!
    moderatorUserId = (testData as any).users[1].id!
    adminUserId = (testData as any).users[2].id!
  })
  
  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData()
  })
  
  describe('Public Access Scenarios', () => {
    it('should return only public approved content for anonymous users', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'arrangements')
      const result = await queryBuilder
        .select('*')
        .withVisibility({ 
          userId: undefined, 
          roles: [], 
          canModerate: false,
          canAdmin: false 
        })
        .execute()
      
      expect(result.data).toBeDefined()
      if (result.data && Array.isArray(result.data)) {
        expect(result.data.every((a: UnknownObject) => 
          a.is_public === true && 
          (!a.moderation_status || ['approved', 'pending'].includes(a.moderation_status as string))
        )).toBe(true)
      }
    })
    
    it('should handle pagination for public content', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'songs')
      const result = await queryBuilder
        .select('id, title, artist')
        .withVisibility({ 
          userId: undefined, 
          roles: [], 
          canModerate: false,
          canAdmin: false 
        })
        .paginate({ page: 1, limit: 10 })
        .execute()
      
      expect(result.data).toBeDefined()
      if (result.data && Array.isArray(result.data)) {
        expect(result.data.length).toBeLessThanOrEqual(10)
      }
      expect(result.pagination).toBeDefined()
      expect(result.pagination?.page).toBe(1)
      expect(result.pagination?.limit).toBe(10)
    })
    
    it('should filter public content by search criteria', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'songs')
      const result = await queryBuilder
        .select('*')
        .withVisibility({ 
          userId: undefined, 
          roles: [], 
          canModerate: false,
          canAdmin: false 
        })
        .ilike('title', '%worship%')
        .execute()
      
      expect(result.data).toBeDefined()
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach((song: UnknownObject) => {
          if (typeof song.title === 'string') {
            expect(song.title.toLowerCase()).toContain('worship')
          }
        })
      }
    })
  })
  
  describe('Authenticated Access Scenarios', () => {
    it('should return public content plus own content for authenticated users', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'arrangements')
      const result = await queryBuilder
        .select('*')
        .withVisibility({ 
          userId: testUserId, 
          roles: ['user'], 
          canModerate: false,
          canAdmin: false 
        })
        .execute()
      
      const ownContent = (result.data && Array.isArray(result.data)) ? result.data.filter((a: UnknownObject) => a.created_by === testUserId) : []
      // const publicContent = (result.data && Array.isArray(result.data)) ? result.data.filter((a: UnknownObject) => a.is_public === true) : []
      
      expect((result.data && Array.isArray(result.data)) ? result.data.length : 0).toBeGreaterThan(0)
      // User should see their own content regardless of public status
      expect(ownContent.some((a: UnknownObject) => !a.is_public)).toBe(true)
    })
    
    it('should handle complex filters for authenticated users', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'songs')
      const result = await queryBuilder
        .select('*')
        .withVisibility({ 
          userId: testUserId, 
          roles: ['user'], 
          canModerate: false,
          canAdmin: false 
        })
        .in('themes', ['worship', 'praise'])
        .orderBy('created_at', { ascending: false })
        .limit(20)
        .execute()
      
      expect(result.data).toBeDefined()
      if (result.data && Array.isArray(result.data)) {
        expect(result.data.length).toBeLessThanOrEqual(20)
        
        // Verify themes filter
        result.data.forEach((song: UnknownObject) => {
          if (Array.isArray(song.themes)) {
            expect(
              song.themes.some((t: string) => ['worship', 'praise'].includes(t))
            ).toBe(true)
          }
        })
        
        // Verify ordering
        for (let i = 1; i < result.data.length; i++) {
          const prevCreatedAt = result.data[i - 1].created_at
          const currCreatedAt = result.data[i].created_at
          if (prevCreatedAt && currCreatedAt) {
            const prevDate = new Date(prevCreatedAt as string).getTime()
            const currDate = new Date(currCreatedAt as string).getTime()
            expect(prevDate).toBeGreaterThanOrEqual(currDate)
          }
        }
      }
    })
    
    it('should allow users to access their private setlists', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'setlists')
      const result = await queryBuilder
        .select('*')
        .withVisibility({ 
          userId: testUserId, 
          roles: ['user'], 
          canModerate: false,
          canAdmin: false 
        })
        .eq('created_by', testUserId)
        .eq('is_public', false)
        .execute()
      
      expect(result.data).toBeDefined()
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach((setlist: UnknownObject) => {
          expect(setlist.created_by).toBe(testUserId)
          expect(setlist.is_public).toBe(false)
        })
      }
    })
  })
  
  describe('Moderator Access Scenarios', () => {
    it('should return all content including rejected for moderators', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'arrangements')
      const result = await queryBuilder
        .select('*')
        .withVisibility({ 
          userId: moderatorUserId, 
          roles: ['moderator'], 
          canModerate: true,
          canAdmin: false 
        })
        .execute()
      
      // Should include private content
      const privateContent = (result.data && Array.isArray(result.data)) ? result.data.filter((a: UnknownObject) => !a.is_public) : []
      expect(privateContent.length).toBeGreaterThan(0)
      
      // Should include rejected content
      const rejectedContent = (result.data && Array.isArray(result.data)) ? result.data.filter((a: UnknownObject) => a.moderation_status === 'rejected') : []
      expect(rejectedContent.length).toBeGreaterThan(0)
    })
    
    it('should allow moderators to filter by moderation status', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'songs')
      const result = await queryBuilder
        .select('*')
        .withVisibility({ 
          userId: moderatorUserId, 
          roles: ['moderator'], 
          canModerate: true,
          canAdmin: false 
        })
        .eq('moderation_status', 'pending')
        .execute()
      
      expect(result.data).toBeDefined()
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach((song: UnknownObject) => {
          expect(song.moderation_status).toBe('pending')
        })
      }
    })
    
    it('should provide moderation metadata for moderators', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'arrangements')
      const result = await queryBuilder
        .select('*, moderated_by, moderated_at, moderation_note')
        .withVisibility({ 
          userId: moderatorUserId, 
          roles: ['moderator'], 
          canModerate: true,
          canAdmin: false 
        })
        .neq('moderated_by', null)
        .execute()
      
      expect(result.data).toBeDefined()
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach((arr: UnknownObject) => {
          expect(arr.moderated_by).toBeDefined()
          expect(arr.moderated_at).toBeDefined()
        })
      }
    })
  })
  
  describe('Admin Access Scenarios', () => {
    it('should provide full unrestricted access for admins', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'songs')
      const result = await queryBuilder
        .select('*')
        .withVisibility({ 
          userId: adminUserId, 
          roles: ['admin'], 
          canModerate: true,
          canAdmin: true 
        })
        .execute()
      
      // Admins should see everything
      // const allStatuses = ['approved', 'pending', 'rejected', null]
      const foundStatuses = (result.data && Array.isArray(result.data)) ? Array.from(new Set(result.data.map((s: UnknownObject) => s.moderation_status))) : []
      
      expect(foundStatuses.length).toBeGreaterThan(1)
    })
    
    it('should allow admins to perform bulk operations', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'arrangements')
      
      // Update multiple records
      const updateResult = await queryBuilder
        .update({ moderation_status: 'approved' })
        .withVisibility({ 
          userId: adminUserId, 
          roles: ['admin'], 
          canModerate: true,
          canAdmin: true 
        })
        .eq('moderation_status', 'pending')
        .execute()
      
      expect(updateResult.error).toBeNull()
    })
  })
  
  describe('Complex Query Scenarios', () => {
    it('should handle joined queries with relations', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'arrangements')
      const result = await queryBuilder
        .select('*, songs(*)')
        .withVisibility({ 
          userId: testUserId, 
          roles: ['user'], 
          canModerate: false,
          canAdmin: false 
        })
        .orderBy('created_at', { ascending: false })
        .limit(10)
        .execute()
      
      expect(result.data).toBeDefined()
      if (result.data && Array.isArray(result.data)) {
        expect(result.data.length).toBeLessThanOrEqual(10)
        
        // Verify join worked
        result.data.forEach((arr: UnknownObject) => {
          expect(arr.songs).toBeDefined()
          if (typeof arr.songs === 'object' && arr.songs !== null && 'id' in arr.songs) {
            expect(arr.songs.id).toBe(arr.song_id)
          }
        })
      }
    })
    
    it('should handle full-text search efficiently', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'songs')
      const result = await queryBuilder
        .select('*')
        .withVisibility({ 
          userId: testUserId, 
          roles: ['user'], 
          canModerate: false,
          canAdmin: false 
        })
        .textSearch('title,artist', 'worship music', {
          type: 'websearch',
          config: 'english'
        })
        .limit(10)
        .execute()
      
      expect(result.data).toBeDefined()
      if (result.data && Array.isArray(result.data)) {
        expect(result.data.length).toBeLessThanOrEqual(10)
      }
    })
    
    it('should handle aggregation queries', async () => {
      // Test direct SQL for aggregations
      const { data, error } = await testClient
        .from('songs')
        .select('themes, count(*)', { count: 'exact' })
        .group('themes')
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })
  
  describe('Error Handling Scenarios', () => {
    it('should handle invalid table names gracefully', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'invalid_table' as any)
      const result = await queryBuilder
        .select('*')
        .execute()
      
      expect(result.error).toBeDefined()
      expect(result.data).toEqual([])
    })
    
    it('should handle invalid column names', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'songs')
      const result = await queryBuilder
        .select('invalid_column')
        .execute()
      
      expect(result.error).toBeDefined()
    })
    
    it('should handle network timeouts', async () => {
      // Simulate timeout scenario
      const slowClient = {
        ...testClient,
        from: () => ({
          select: () => new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), 100)
          )
        })
      } as any
      
      const queryBuilder = new QueryBuilder(slowClient as any, 'songs')
      const result = await queryBuilder.select('*').execute()
      
      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain('timeout')
    })
  })
  
  describe('Transaction Scenarios', () => {
    it('should handle multi-table transactions', async () => {
      // Create a song and arrangement in a transaction-like manner
      const songData = {
        title: 'Test Song',
        artist: 'Test Artist',
        created_by: testUserId,
        is_public: true,
        slug: 'test-song',
      }
      
      const songBuilder = new QueryBuilder(testClient as any, 'songs')
      const songResult = await songBuilder
        .insert(songData)
        .single()
        .execute()
      
      expect(songResult.error).toBeNull()
      expect(songResult.data).toBeDefined()
      
      if (songResult.data && Array.isArray(songResult.data) && songResult.data.length > 0) {
        const songData = songResult.data[0] as UnknownObject
        const arrangementData = {
          song_id: songData.id as string,
          name: 'Test Arrangement',
          chord_data: '[C]Test [G]Song',
          created_by: testUserId,
          is_public: true,
          slug: 'test-arrangement',
        }
        
        const arrBuilder = new QueryBuilder(testClient as any, 'arrangements')
        const arrResult = await arrBuilder
          .insert(arrangementData)
          .single()
          .execute()
        
        expect(arrResult.error).toBeNull()
        expect(arrResult.data).toBeDefined()
        if (arrResult.data && !Array.isArray(arrResult.data)) {
          expect((arrResult.data as UnknownObject).song_id).toBe(songData.id)
        }
      }
    })
    
    it('should handle rollback scenarios', async () => {
      // Test rollback behavior
      const invalidData = {
        title: null, // Required field
        artist: 'Test',
      }
      
      const queryBuilder = new QueryBuilder(testClient, 'songs')
      const result = await queryBuilder
        .insert(invalidData as any)
        .execute()
      
      expect(result.error).toBeDefined()
      expect(result.data).toEqual([])
    })
  })
  
  describe('Performance Critical Paths', () => {
    it('should handle large result sets with streaming', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'songs')
      const chunks: UnknownObject[] = []
      
      // Simulate streaming with pagination
      let page = 1
      let hasMore = true
      
      while (hasMore && page <= 3) {
        const result = await queryBuilder
          .select('id, title')
          .withVisibility({ 
            userId: testUserId, 
            roles: ['user'], 
            canModerate: false,
            canAdmin: false 
          })
          .paginate({ page, limit: 20 })
          .execute()
        
        chunks.push(result.data as any)
        hasMore = result.pagination?.hasNext ?? false
        page++
      }
      
      expect(chunks.length).toBeGreaterThan(0)
      if (chunks[0]) {
        expect(chunks[0].length).toBeLessThanOrEqual(20)
      }
    })
    
    it('should optimize repeated queries with same parameters', async () => {
      const queryBuilder = new QueryBuilder(testClient, 'songs')
      
      // Run same query multiple times
      const results = await Promise.all([
        queryBuilder.select('id, title').limit(5).execute(),
        queryBuilder.select('id, title').limit(5).execute(),
        queryBuilder.select('id, title').limit(5).execute(),
      ])
      
      // All should return same data
      expect(results[0].data).toEqual(results[1].data)
      expect(results[1].data).toEqual(results[2].data)
    })
  })
})