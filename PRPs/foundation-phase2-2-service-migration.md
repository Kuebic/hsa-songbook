name: "Foundation Phase 2.2: Service Migration"
description: "Migrate all database services to use QueryBuilder for consistent query patterns"

---

## Goal

**Feature Goal**: Systematically migrate all existing database services from direct Supabase calls to the new QueryBuilder pattern

**Deliverable**: Updated service files using QueryBuilder with all existing functionality preserved and tests passing

**Success Definition**: All services use QueryBuilder exclusively, zero regression bugs, all existing tests pass, TypeScript compilation succeeds

## User Persona

**Target User**: HSA Songbook application end-users and developers

**Use Case**: All existing database operations continue working identically but with improved consistency and maintainability

**User Journey**: 
1. End users experience no change in functionality
2. Developers now use consistent QueryBuilder pattern
3. Future bugs from inconsistent queries are prevented
4. Debugging is simplified with centralized query logic

**Pain Points Addressed**: 
- Duplicated query logic across 15+ service files
- Inconsistent visibility filtering causing bugs
- Difficult to maintain scattered database logic
- Hard to track down query-related issues

## Why

- **Bug Prevention**: Eliminates inconsistent query implementations that cause production bugs
- **Maintainability**: Single source of truth for query logic
- **Developer Velocity**: Faster feature development with reliable query patterns
- **Code Quality**: Reduces codebase complexity and duplication

## What

Migrate existing services to use QueryBuilder:
- songService.ts - Core song CRUD operations
- arrangementService.ts - Arrangement management
- setlistService.ts - Setlist operations
- Additional services as identified

### Success Criteria

- [ ] All service files use QueryBuilder instead of direct Supabase
- [ ] All existing unit tests pass without modification
- [ ] No TypeScript errors introduced
- [ ] Performance metrics remain within 5% of baseline
- [ ] Zero functional regressions reported

## All Needed Context

### Context Completeness Check

_This PRP provides complete migration patterns and specific line-by-line guidance for converting existing services to QueryBuilder._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/features/songs/services/songService.ts
  why: Primary service to migrate with complex queries
  pattern: Cache implementation, visibility filtering, search queries
  gotcha: Keep cache logic separate from QueryBuilder

- file: src/features/songs/services/arrangementService.ts
  why: Second service with joins and slug generation
  pattern: Joined queries with songs relationship
  gotcha: Auto-slug generation stays in service layer

- file: src/features/setlists/services/setlistService.ts
  why: Contains complex array operations and user filtering
  pattern: Array operations, user-specific queries
  gotcha: Some operations may need raw SQL via RPC

- file: PRPs/foundation-phase2-1-query-builder.md
  why: QueryBuilder API specification and usage patterns
  section: Implementation Blueprint and API Documentation
  critical: Must follow exact API defined in Phase 2.1

- file: src/lib/database/queryBuilder.ts
  why: QueryBuilder implementation from Phase 2.1
  pattern: Fluent API methods and type signatures
  gotcha: Assumes Phase 2.1 is complete

- file: src/features/admin/services/adminService.ts
  why: Contains pagination patterns to migrate
  pattern: User management queries with role filtering
  gotcha: Complex OR conditions in user filtering

- file: src/features/moderation/services/moderationService.ts
  why: RPC calls with fallback patterns
  pattern: Database functions and fallback queries
  gotcha: Some RPC calls may not be migratable
```

### Current Query Patterns to Migrate

```typescript
// BEFORE: Direct Supabase in songService.ts
let query = supabase
  .from('songs')
  .select(`
    *,
    arrangements!arrangements_song_id_fkey (*)
  `)

if (!canModerate && userId) {
  query = query.or(`and(is_public.neq.false,or(moderation_status.is.null,moderation_status.in.(approved,pending,flagged))),created_by.eq.${userId}`)
}

// AFTER: Using QueryBuilder
const query = new QueryBuilder(supabase, 'songs')
  .select(`*, arrangements!arrangements_song_id_fkey (*)`)
  .withVisibility({ userId, canModerate, roles: [], canAdmin: false })
```

### Service Files Analysis

```yaml
songService.ts:
  lines: 380
  queries: 12
  patterns:
    - Complex visibility filtering (lines 117-127)
    - Full-text search with textSearch() (lines 130-135)
    - Array operations with overlaps() (lines 138-140)
    - Caching with TTL (lines 36-60)
    - Pagination (lines 143-145)

arrangementService.ts:
  lines: 467
  queries: 15
  patterns:
    - Auto-slug generation (lines 234-256)
    - Joined queries with songs (line 89)
    - Search with ilike (lines 103-105)
    - Insert with conflict handling (lines 270-285)

setlistService.ts:
  lines: 289
  queries: 8
  patterns:
    - User-specific filtering (lines 45-50)
    - Array append operations (lines 167-172)
    - Complex updates with arrays (lines 203-215)

adminService.ts:
  lines: 523
  queries: 10
  patterns:
    - Role-based user queries (lines 78-95)
    - Pagination with range() (lines 102-104)
    - Upsert operations (lines 234-245)
```

### Known Gotchas & Migration Rules

```typescript
// CRITICAL: textSearch() is Supabase-specific, needs special handling
// Solution: Add textSearch() method to QueryBuilder or use raw query

// CRITICAL: RPC calls cannot use QueryBuilder
// Keep: await supabase.rpc('function_name', params)

// CRITICAL: Insert operations with .select() for returning data
// Pattern: queryBuilder.insert(data).select().single()

// CRITICAL: Some complex OR conditions need careful translation
// Test thoroughly with different user permission combinations

// CRITICAL: Cache layer stays in service, not in QueryBuilder
// QueryBuilder should be stateless for caching to work
```

## Implementation Blueprint

### Migration Pattern Template

```typescript
// Standard migration pattern for each service method
async function migrateMethod(params: MethodParams): Promise<Result> {
  try {
    // 1. Build permissions object
    const permissions: UserPermissions = {
      userId: params.userId,
      roles: params.roles || [],
      canModerate: params.canModerate || false,
      canAdmin: params.canAdmin || false
    }
    
    // 2. Create QueryBuilder instance
    const queryBuilder = new QueryBuilder(supabase, 'table_name')
    
    // 3. Build query using fluent API
    let query = queryBuilder
      .select('*')
      .withVisibility(permissions)
    
    // 4. Add filters
    if (params.searchQuery) {
      query = query.ilike('column', `%${params.searchQuery}%`)
    }
    
    // 5. Add pagination
    if (params.page) {
      query = query.paginate({ 
        page: params.page, 
        limit: params.limit || 20 
      })
    }
    
    // 6. Execute and handle response
    const result = await query.execute()
    
    if (result.error) {
      throw result.error
    }
    
    return result.data
  } catch (error) {
    // Keep existing error handling
    handleAPIError(error)
  }
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
task_1:
  name: "Prepare migration utilities"
  requirements: |
    - Create temporary feature flag: USE_QUERY_BUILDER
    - Add migration helper function for gradual rollout
    - Set up performance monitoring for before/after comparison
    - Document rollback procedure
  validation: "Feature flag toggles between old and new implementation"

task_2:
  name: "Migrate songService.ts READ operations"
  requirements: |
    - Start with getAllSongs() method (line 111)
    - Replace direct supabase query with QueryBuilder
    - Preserve exact visibility filtering logic
    - Maintain cache implementation unchanged
    - Handle textSearch() - may need QueryBuilder extension
    - Test with different user permissions
  validation: "npm test -- songService.test.ts (read operations pass)"

task_3:
  name: "Migrate songService.ts WRITE operations"
  requirements: |
    - Migrate createSong() (line 235)
    - Migrate updateSong() (line 289)
    - Migrate deleteSong() (line 341)
    - Handle insert().select() pattern for returning data
    - Preserve audit fields (updated_at, updated_by)
  validation: "npm test -- songService.test.ts (all tests pass)"

task_4:
  name: "Migrate arrangementService.ts"
  requirements: |
    - Follow same pattern as songService
    - Special attention to joined queries (line 89)
    - Preserve auto-slug generation logic (lines 234-256)
    - Handle upsert with on_conflict (line 270)
    - Migrate all 15 query locations
  validation: "npm test -- arrangementService.test.ts passes"

task_5:
  name: "Migrate setlistService.ts"
  requirements: |
    - Handle user-specific filtering (lines 45-50)
    - Array operations may need special handling
    - Some operations might need raw SQL via RPC
    - Test array append/remove operations carefully
  validation: "npm test -- setlistService.test.ts passes"

task_6:
  name: "Update service imports and types"
  requirements: |
    - Add import { QueryBuilder } from '@lib/database'
    - Update any service-specific types
    - Remove unused Supabase query imports
    - Update JSDoc comments
  validation: "TypeScript compilation succeeds"

task_7:
  name: "Performance validation"
  requirements: |
    - Run performance benchmarks before/after
    - Compare query execution times
    - Check memory usage patterns
    - Document any performance differences
  validation: "Performance within 5% of baseline"

task_8:
  name: "Update service tests if needed"
  requirements: |
    - Most tests should pass unchanged
    - Update mocks if QueryBuilder changes behavior
    - Add new tests for QueryBuilder-specific features
    - Ensure 100% coverage maintained
  validation: "npm run test:coverage shows no regression"
```

## Testing Requirements

### Service Test Pattern

```typescript
// src/features/songs/services/__tests__/songService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { songService } from '../songService'

// Mock QueryBuilder at module level
vi.mock('@lib/database', () => ({
  QueryBuilder: vi.fn().mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    withVisibility: vi.fn().mockReturnThis(),
    paginate: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ 
      data: mockSongs, 
      error: null 
    })
  }))
}))

describe('songService with QueryBuilder', () => {
  it('should fetch songs with visibility filtering', async () => {
    const songs = await songService.getAllSongs({
      userId: 'test-user',
      canModerate: false
    })
    
    expect(QueryBuilder).toHaveBeenCalledWith(supabase, 'songs')
    expect(songs).toEqual(mockSongs)
  })
})
```

### Migration Validation Tests

```typescript
// Temporary test file during migration
describe('QueryBuilder Migration Validation', () => {
  it('should return identical results to direct Supabase', async () => {
    const directResult = await getWithDirectSupabase()
    const queryBuilderResult = await getWithQueryBuilder()
    
    expect(queryBuilderResult).toEqual(directResult)
  })
})
```

## Validation Gates

### Level 1: Type Safety
```bash
npm run build
# No TypeScript errors
```

### Level 2: Unit Tests
```bash
npm test -- src/features/songs/services
npm test -- src/features/arrangements/services
npm test -- src/features/setlists/services
# All service tests pass
```

### Level 3: Integration Tests
```bash
npm run test:integration
# End-to-end tests pass
```

### Level 4: Manual Testing
```bash
npm run dev
# Test each service operation in browser
# Verify no functional changes
```

## Rollback Plan

```typescript
// Quick rollback via feature flag
const USE_QUERY_BUILDER = process.env.VITE_USE_QUERY_BUILDER === 'true'

export async function getAllSongs(params) {
  if (USE_QUERY_BUILDER) {
    return getAllSongsWithQueryBuilder(params)
  }
  return getAllSongsLegacy(params)
}
```

## Performance Monitoring

```typescript
// Add performance tracking
const startTime = performance.now()
const result = await queryBuilder.execute()
const duration = performance.now() - startTime

if (duration > 1000) {
  console.warn(`Slow query detected: ${duration}ms`, {
    table: 'songs',
    operation: 'select',
    filters: params
  })
}
```

## Migration Checklist by Service

### songService.ts
- [ ] getAllSongs() - lines 111-180
- [ ] getSongById() - lines 182-210
- [ ] searchSongs() - lines 212-233
- [ ] createSong() - lines 235-265
- [ ] updateSong() - lines 267-297
- [ ] deleteSong() - lines 299-315
- [ ] getSongsByIds() - lines 317-335
- [ ] checkSlugExists() - lines 337-350
- [ ] Additional helper methods

### arrangementService.ts
- [ ] getAllArrangements() - lines 78-135
- [ ] getArrangementById() - lines 137-165
- [ ] getArrangementsBySongId() - lines 167-195
- [ ] createArrangement() - lines 197-285
- [ ] updateArrangement() - lines 287-365
- [ ] deleteArrangement() - lines 367-395
- [ ] Additional methods

### setlistService.ts
- [ ] getUserSetlists() - lines 38-65
- [ ] getSetlistById() - lines 67-95
- [ ] createSetlist() - lines 97-135
- [ ] updateSetlist() - lines 137-185
- [ ] deleteSetlist() - lines 187-210
- [ ] addSongToSetlist() - lines 212-245
- [ ] removeSongFromSetlist() - lines 247-275

## Common Migration Examples

### Simple Select
```typescript
// BEFORE
const { data, error } = await supabase
  .from('songs')
  .select('*')
  .eq('id', id)
  .single()

// AFTER
const result = await new QueryBuilder(supabase, 'songs')
  .select('*')
  .eq('id', id)
  .single()
```

### With Visibility
```typescript
// BEFORE
let query = supabase.from('songs').select('*')
if (!canModerate) {
  query = query.eq('is_public', true)
}
const { data, error } = await query

// AFTER
const result = await new QueryBuilder(supabase, 'songs')
  .select('*')
  .withVisibility({ userId, canModerate, roles: [], canAdmin: false })
  .execute()
```

### With Pagination
```typescript
// BEFORE
const limit = 20
const offset = (page - 1) * limit
const { data, error } = await supabase
  .from('songs')
  .select('*')
  .range(offset, offset + limit - 1)

// AFTER
const result = await new QueryBuilder(supabase, 'songs')
  .select('*')
  .paginate({ page, limit: 20 })
  .execute()
```

## Final Validation Checklist

- [ ] All services migrated to QueryBuilder
- [ ] No direct Supabase queries remain (except RPC)
- [ ] All existing tests pass
- [ ] No TypeScript errors
- [ ] Performance benchmarks acceptable
- [ ] Feature flag tested for rollback
- [ ] Documentation updated
- [ ] Team trained on new patterns
- [ ] Monitoring in place for issues
- [ ] Zero functional regressions