import { bench, describe } from 'vitest'
import { QueryBuilder } from '../../queryBuilder'
import { setupBenchmarkData, setSeed } from '../helpers/testData'
// Mock supabase client for testing
const supabase = {} as any

// Set consistent seed for reproducible benchmarks
setSeed(54321)

describe.skip('Query Performance Benchmarks', async () => {
  // Setup benchmark data once
  const { largeDataset } = await setupBenchmarkData('medium')
  const client = supabase
  
  // Define common test scenarios
  const testUserId = largeDataset.users[0].id!
  const testSongId = largeDataset.songs[0].id!
  // const _testArrangementId = largeDataset.arrangements[0].id!
  
  describe('Basic Query Operations', () => {
    bench('Simple select query - 20 records', async () => {
      await new QueryBuilder(client, 'songs')
        .select('id, title, artist')
        .limit(20)
        .execute()
    })
    
    bench('Simple select query - 100 records', async () => {
      await new QueryBuilder(client, 'songs')
        .select('id, title, artist')
        .limit(100)
        .execute()
    })
    
    bench('Select with single condition', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*')
        .eq('is_public', true)
        .limit(20)
        .execute()
    })
    
    bench('Select with multiple conditions', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*')
        .eq('is_public', true)
        .eq('moderation_status', 'approved')
        .limit(20)
        .execute()
    })
  })
  
  describe('Complex Filtered Queries', () => {
    bench('Query with visibility filter - anonymous', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*')
        .withVisibility({ 
          userId: undefined, 
          roles: [], 
          canModerate: false, 
          canAdmin: false 
        })
        .limit(20)
        .execute()
    })
    
    bench('Query with visibility filter - authenticated user', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*')
        .withVisibility({ 
          userId: testUserId, 
          roles: ['user'], 
          canModerate: false, 
          canAdmin: false 
        })
        .limit(20)
        .execute()
    })
    
    bench('Query with visibility filter - moderator', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*')
        .withVisibility({ 
          userId: testUserId, 
          roles: ['moderator'], 
          canModerate: true, 
          canAdmin: false 
        })
        .limit(20)
        .execute()
    })
    
    bench('Complex filter with ILIKE and IN operators', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*')
        .withVisibility({ 
          userId: testUserId, 
          roles: ['user'], 
          canModerate: false, 
          canAdmin: false 
        })
        .ilike('title', '%worship%')
        .in('themes', ['praise', 'worship'])
        .paginate({ page: 1, limit: 20 })
        .execute()
    })
  })
  
  describe('Joined Queries', () => {
    bench('Simple join - arrangements with songs', async () => {
      await new QueryBuilder(client, 'arrangements')
        .select('*, songs(*)')
        .limit(20)
        .execute()
    })
    
    bench('Join with visibility filter', async () => {
      await new QueryBuilder(client, 'arrangements')
        .select('*, songs(*)')
        .withVisibility({ 
          userId: testUserId, 
          roles: ['user'], 
          canModerate: false, 
          canAdmin: false 
        })
        .orderBy('created_at', { ascending: false })
        .limit(50)
        .execute()
    })
    
    bench('Multiple joins - setlists with items and arrangements', async () => {
      await new QueryBuilder(client, 'setlists')
        .select(`
          *,
          setlist_items (
            *,
            arrangements (
              *,
              songs (*)
            )
          )
        `)
        .eq('created_by', testUserId)
        .limit(10)
        .execute()
    })
  })
  
  describe('Full-Text Search', () => {
    bench('Basic text search', async () => {
      await client
        .from('songs')
        .select('*')
        .textSearch('title', 'worship', {
          type: 'plain',
          config: 'english'
        })
        .limit(10)
    })
    
    bench('Multi-field text search', async () => {
      await client
        .from('songs')
        .select('*')
        .textSearch('title,artist', 'amazing grace', {
          type: 'websearch',
          config: 'english'
        })
        .limit(10)
    })
    
    bench('Text search with additional filters', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*')
        .textSearch('title,artist', 'worship', {
          type: 'websearch',
          config: 'english'
        })
        .eq('is_public', true)
        .in('themes', ['worship', 'praise'])
        .limit(20)
        .execute()
    })
  })
  
  describe('Pagination Performance', () => {
    bench('First page query', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*')
        .paginate({ page: 1, limit: 20 })
        .execute()
    })
    
    bench('Middle page query (page 10)', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*')
        .paginate({ page: 10, limit: 20 })
        .execute()
    })
    
    bench('Large page query (page 50)', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*')
        .paginate({ page: 50, limit: 20 })
        .execute()
    })
    
    bench('Pagination with count', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*', { count: 'exact' })
        .paginate({ page: 1, limit: 20 })
        .execute()
    })
  })
  
  describe('Sorting and Ordering', () => {
    bench('Single field ordering', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*')
        .orderBy('created_at', { ascending: false })
        .limit(50)
        .execute()
    })
    
    bench('Multiple field ordering', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*')
        .orderBy('themes', { ascending: true })
        .orderBy('title', { ascending: true })
        .limit(50)
        .execute()
    })
    
    bench('Ordering with complex filter', async () => {
      await new QueryBuilder(client, 'arrangements')
        .select('*')
        .withVisibility({ 
          userId: testUserId, 
          roles: ['user'], 
          canModerate: false, 
          canAdmin: false 
        })
        .orderBy('rating_average', { ascending: false })
        .orderBy('views', { ascending: false })
        .limit(20)
        .execute()
    })
  })
  
  describe('Aggregation Queries', () => {
    bench('Count query', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*', { count: 'exact' })
        .eq('is_public', true)
        .execute()
    })
    
    bench('Group by with count', async () => {
      await client
        .from('songs')
        .select('language, count(*)')
        .execute()
    })
    
    bench('Complex aggregation with filter', async () => {
      await client
        .from('arrangements')
        .select('song_id, count(*), avg(rating_average)')
        .eq('is_public', true)
        .execute()
        .limit(20)
    })
  })
  
  describe('Write Operations', () => {
    bench('Single insert', async () => {
      await new QueryBuilder(client, 'songs')
        .insert({
          title: 'Benchmark Song',
          artist: 'Benchmark Artist',
          created_by: testUserId,
          is_public: true,
          slug: `benchmark-${Date.now()}`
        })
        .execute()
    })
    
    bench('Bulk insert - 10 records', async () => {
      const records = Array.from({ length: 10 }, (_, i) => ({
        title: `Bulk Song ${i}`,
        artist: 'Bulk Artist',
        created_by: testUserId,
        is_public: true,
        slug: `bulk-${Date.now()}-${i}`
      }))
      
      await new QueryBuilder(client, 'songs')
        .insert(records)
        .execute()
    })
    
    bench('Update single record', async () => {
      await new QueryBuilder(client, 'songs')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testSongId)
        .execute()
    })
    
    bench('Update multiple records', async () => {
      await new QueryBuilder(client, 'arrangements')
        .update({ views: 0 })
        .eq('created_by', testUserId)
        .execute()
    })
    
    bench('Upsert operation', async () => {
      await new QueryBuilder(client, 'songs')
        .upsert({
          id: testSongId,
          title: 'Upserted Song',
          artist: 'Upserted Artist',
          created_by: testUserId,
          is_public: true,
          slug: `upsert-${Date.now()}`
        })
        .execute()
    })
  })
  
  describe('Concurrent Operations', () => {
    bench('5 concurrent reads', async () => {
      await Promise.all([
        new QueryBuilder(client, 'songs').select('*').limit(10).execute(),
        new QueryBuilder(client, 'songs').select('*').limit(10).execute(),
        new QueryBuilder(client, 'songs').select('*').limit(10).execute(),
        new QueryBuilder(client, 'songs').select('*').limit(10).execute(),
        new QueryBuilder(client, 'songs').select('*').limit(10).execute(),
      ])
    })
    
    bench('Mixed concurrent operations', async () => {
      await Promise.all([
        new QueryBuilder(client, 'songs').select('*').limit(10).execute(),
        new QueryBuilder(client, 'arrangements').select('*').limit(10).execute(),
        new QueryBuilder(client, 'setlists').select('*').limit(10).execute(),
        new QueryBuilder(client, 'songs')
          .select('*', { count: 'exact' })
          .execute(),
      ])
    })
    
    bench('10 concurrent filtered queries', async () => {
      const queries = Array.from({ length: 10 }, () =>
        new QueryBuilder(client, 'songs')
          .select('*')
          .withVisibility({ 
            userId: testUserId, 
            roles: ['user'], 
            canModerate: false, 
            canAdmin: false 
          })
          .limit(5)
          .execute()
      )
      
      await Promise.all(queries)
    })
  })
  
  describe('Edge Cases and Stress Tests', () => {
    bench('Query with many filters', async () => {
      await new QueryBuilder(client, 'songs')
        .select('*')
        .eq('is_public', true)
        .neq('moderation_status', 'rejected')
        .gt('created_at', '2023-01-01')
        .lt('created_at', '2024-12-31')
        .ilike('title', '%song%')
        .in('themes', ['worship', 'praise', 'prayer'])
        .neq('artist', null)
        .limit(20)
        .execute()
    })
    
    bench('Deep nested join query', async () => {
      await client
        .from('setlists')
        .select(`
          id,
          name,
          setlist_items (
            id,
            position,
            arrangements (
              id,
              name,
              songs (
                id,
                title,
                artist
              )
            )
          )
        `)
        .limit(5)
    })
    
    bench('Large IN clause (100 items)', async () => {
      const ids = largeDataset.songs.slice(0, 100).map((s: any) => s.id).filter(Boolean)
      
      await new QueryBuilder(client, 'songs')
        .select('id, title')
        .in('id', ids)
        .execute()
    })
  })
})