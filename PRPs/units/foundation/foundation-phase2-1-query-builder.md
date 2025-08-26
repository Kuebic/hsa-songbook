name: "Foundation Phase 2.1: Query Builder Foundation"
description: "Create type-safe QueryBuilder class with visibility filtering for consistent database operations"

---

## Goal

**Feature Goal**: Implement a centralized, type-safe QueryBuilder class that standardizes all database queries across the HSA Songbook application

**Deliverable**: Core QueryBuilder class with VisibilityFilter, PaginationHelper, and comprehensive unit tests

**Success Definition**: All new database queries can use QueryBuilder with full TypeScript type safety, visibility filtering works correctly for all user types, and unit tests achieve 100% coverage

## User Persona

**Target User**: HSA Songbook developers

**Use Case**: Any time a developer needs to query the database, they use the QueryBuilder instead of direct Supabase calls

**User Journey**: 
1. Developer imports QueryBuilder from `@lib/database`
2. Creates query with type-safe methods
3. Applies visibility filtering based on user permissions
4. Executes query with automatic error handling

**Pain Points Addressed**: 
- Inconsistent query patterns causing bugs
- Duplicated visibility filtering logic
- Lack of type safety in complex queries
- Manual pagination implementation

## Why

- **Consistency**: Single source of truth for all database queries eliminates bugs from inconsistent implementations
- **Type Safety**: Compile-time checking prevents runtime errors
- **Maintainability**: Changes to visibility rules only need updates in one place
- **Developer Experience**: Intuitive API reduces cognitive load and speeds development

## What

Create a QueryBuilder class that wraps Supabase operations with:
- Type-safe query construction
- Automatic visibility filtering based on user permissions
- Built-in pagination support
- Consistent error handling
- Query result caching

### Success Criteria

- [ ] QueryBuilder class supports all Supabase query operations
- [ ] Visibility filtering correctly applies for public/authenticated/moderator users
- [ ] TypeScript catches type mismatches at compile time
- [ ] Unit tests achieve 100% code coverage
- [ ] Performance within 5% of direct Supabase queries

## All Needed Context

### Context Completeness Check

_This PRP contains all patterns, types, and implementation details needed for a developer unfamiliar with the codebase to successfully implement the QueryBuilder._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/features/songs/services/songService.ts
  why: Current query patterns and visibility filtering logic to replicate
  pattern: Visibility filtering with canModerate, userId checks
  gotcha: Complex OR conditions need proper parentheses in filter strings

- file: src/features/songs/services/arrangementService.ts
  why: Additional query patterns including joins and search
  pattern: Join syntax with songs!arrangements_song_id_fkey(*)
  gotcha: Auto-slug generation logic should not be in QueryBuilder

- file: src/lib/database.types.ts
  why: Complete type definitions for all database tables
  pattern: Database['public']['Tables'][TableName]['Row'] type access
  gotcha: Generated file - do not modify directly

- file: src/lib/supabase.ts
  why: Supabase client configuration and helper functions
  pattern: Client initialization with auth and realtime config
  gotcha: Dev logging in fetch wrapper

- file: src/shared/test-utils/setup.ts
  why: Supabase mock patterns for testing
  pattern: Mock chain with returnThis() for fluent API
  gotcha: Must mock all chained methods

- file: src/features/admin/services/adminService.ts
  why: Pagination and complex filtering patterns
  pattern: range() for pagination, or() for complex filters
  gotcha: Offset calculation from page number

- docfile: PRPs/foundation-phase2-data-layer-stability-prd.md
  why: Complete technical specification and API design
  section: Sections 4-5 for architecture and API specs
```

### Current Codebase tree

```bash
src/
├── lib/
│   ├── database.types.ts    # Supabase generated types
│   ├── supabase.ts          # Supabase client
│   └── utils.ts             # Utility functions
├── features/
│   ├── songs/
│   │   └── services/
│   │       ├── songService.ts
│   │       └── arrangementService.ts
│   ├── admin/
│   │   └── services/
│   │       └── adminService.ts
│   └── moderation/
│       └── services/
│           └── moderationService.ts
└── shared/
    └── test-utils/
        ├── setup.ts
        └── authMocks.ts
```

### Desired Codebase tree with files to be added

```bash
src/
├── lib/
│   ├── database/                    # NEW: Database utilities folder
│   │   ├── index.ts                # Public API exports
│   │   ├── queryBuilder.ts         # Main QueryBuilder class
│   │   ├── visibilityFilter.ts    # Visibility filtering logic
│   │   ├── paginationHelper.ts    # Pagination utilities
│   │   ├── errors.ts               # Database error classes
│   │   └── __tests__/             # Unit tests
│   │       ├── queryBuilder.test.ts
│   │       ├── visibilityFilter.test.ts
│   │       └── paginationHelper.test.ts
│   ├── database.types.ts          # Existing
│   ├── supabase.ts                # Existing
│   └── utils.ts                   # Existing
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Supabase filter strings need proper escaping
// Example: query.or(`created_by.eq.${userId}`) - userId needs sanitization

// CRITICAL: Visibility filtering has complex nested conditions
// Must preserve exact logic: public + (null OR approved/pending/flagged moderation)

// CRITICAL: TypeScript with Supabase requires explicit type parameters
// Example: from<'songs'>('songs') for proper type inference

// CRITICAL: Supabase .single() throws if no rows found
// Need to handle { data: null, error: { code: 'PGRST116' } }

// CRITICAL: Tests use vi.fn().mockReturnThis() for chaining
// Every method in chain must return 'this' for fluent API
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/lib/database/types.ts
import { Database } from '@lib/database.types'

export type TableName = keyof Database['public']['Tables']
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']

export interface UserPermissions {
  userId?: string
  roles: string[]
  canModerate: boolean
  canAdmin: boolean
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface QueryResult<T> {
  data: T[]
  error: DatabaseError | null
  count: number | null
  pagination?: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface FilterOptions {
  searchQuery?: string
  themes?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
task_1:
  name: "Create database error classes"
  requirements: |
    - Create src/lib/database/errors.ts
    - Extend base Error class with DatabaseError
    - Add specific errors: NetworkError, NotFoundError, ValidationError
    - Include isRetryable() method
    - Include toUserMessage() for user-friendly errors
  validation: "File exists and exports all error classes"

task_2:
  name: "Create pagination helper"
  requirements: |
    - Create src/lib/database/paginationHelper.ts
    - calculateRange(page, limit) returns { from, to }
    - formatPaginatedResponse(data, total, page, limit) returns formatted response
    - Handle edge cases: page < 1, limit > 100
  validation: "npm test -- paginationHelper.test.ts passes"

task_3:
  name: "Create visibility filter"
  requirements: |
    - Create src/lib/database/visibilityFilter.ts
    - forPublicUser(query) - only public approved content
    - forAuthenticatedUser(query, userId) - public + own content
    - forModerator(query) - all content
    - applyFilter(query, permissions) - main entry point
    - EXACT logic from songService.ts lines 117-127
  validation: "npm test -- visibilityFilter.test.ts passes"

task_4:
  name: "Create QueryBuilder class"
  requirements: |
    - Create src/lib/database/queryBuilder.ts
    - Generic class QueryBuilder<T extends TableName>
    - Constructor takes supabase client and table name
    - Fluent API: all methods return this except execute()
    - Methods: from(), select(), insert(), update(), delete()
    - Filter methods: eq(), neq(), in(), ilike(), contains()
    - Advanced: withVisibility(), paginate(), orderBy(), limit()
    - Execute methods: execute(), single(), count()
    - Import and use VisibilityFilter and PaginationHelper
  validation: "npm test -- queryBuilder.test.ts passes"

task_5:
  name: "Create comprehensive unit tests"
  requirements: |
    - Create test files in src/lib/database/__tests__/
    - Follow pattern from src/features/songs/validation/schemas/__tests__/
    - Mock Supabase using pattern from src/shared/test-utils/setup.ts
    - Test all methods and edge cases
    - Test error handling scenarios
    - Achieve 100% code coverage
  validation: "npm run test:coverage shows 100% for database/ files"

task_6:
  name: "Create index file with exports"
  requirements: |
    - Create src/lib/database/index.ts
    - Export QueryBuilder as default
    - Export all types and interfaces
    - Export error classes
    - Add JSDoc comments for public API
  validation: "Can import { QueryBuilder } from '@lib/database'"

task_7:
  name: "Update tsconfig paths"
  requirements: |
    - Add "@lib/database": ["./src/lib/database/index.ts"] to paths
    - Add "@lib/database/*": ["./src/lib/database/*"] for internals
  validation: "TypeScript resolves @lib/database imports"
```

## Testing Requirements

### Unit Test Coverage

```typescript
// src/lib/database/__tests__/queryBuilder.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryBuilder } from '../queryBuilder'

describe('QueryBuilder', () => {
  let mockSupabase: any
  let queryBuilder: QueryBuilder<'songs'>
  
  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    }
    queryBuilder = new QueryBuilder(mockSupabase, 'songs')
  })
  
  describe('basic operations', () => {
    it('should construct select query', async () => {
      await queryBuilder.select('*').execute()
      expect(mockSupabase.from).toHaveBeenCalledWith('songs')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
    })
  })
  
  describe('visibility filtering', () => {
    it('should apply public filter for anonymous users', async () => {
      const permissions = { userId: undefined, roles: [], canModerate: false, canAdmin: false }
      await queryBuilder.withVisibility(permissions).execute()
      // Verify exact filter applied
    })
  })
  
  describe('pagination', () => {
    it('should calculate correct range', async () => {
      await queryBuilder.paginate({ page: 2, limit: 20 }).execute()
      expect(mockSupabase.range).toHaveBeenCalledWith(20, 39)
    })
  })
})
```

### Integration Test Example

```typescript
// src/lib/database/__tests__/integration.test.ts
describe('QueryBuilder Integration', () => {
  it('should work with real Supabase types', () => {
    const query = new QueryBuilder<'songs'>(supabase, 'songs')
    // TypeScript should enforce correct types
    const result = await query
      .select('id, title, artist')
      .eq('is_public', true)
      .execute()
    
    // result.data should be typed as Pick<Song, 'id' | 'title' | 'artist'>[]
  })
})
```

## Validation Gates

### Level 1: Syntax & Type Checking
```bash
npm run lint
npm run build
# No errors or warnings
```

### Level 2: Unit Tests
```bash
npm test -- src/lib/database
# All tests pass
```

### Level 3: Coverage
```bash
npm run test:coverage
# 100% coverage for src/lib/database/
```

### Level 4: Integration
```bash
# Create a test file that uses QueryBuilder
npm run dev
# No console errors, queries work correctly
```

## Performance Requirements

- Query execution time within 5% of direct Supabase calls
- No memory leaks in fluent API chains
- Proper cleanup of cached queries

## API Documentation Example

```typescript
/**
 * QueryBuilder provides a type-safe, fluent interface for database queries
 * with built-in visibility filtering and pagination.
 * 
 * @example Basic query
 * const songs = await new QueryBuilder(supabase, 'songs')
 *   .select('*')
 *   .eq('is_public', true)
 *   .execute()
 * 
 * @example With visibility filtering
 * const arrangements = await new QueryBuilder(supabase, 'arrangements')
 *   .select('*, songs(*)')
 *   .withVisibility({ userId: user.id, canModerate: false })
 *   .paginate({ page: 1, limit: 20 })
 *   .execute()
 */
export class QueryBuilder<T extends TableName> {
  // Implementation
}
```

## Common Patterns Reference

### Current Visibility Filter (from songService.ts:117-127)
```typescript
if (!canModerate && userId) {
  query = query.or(`and(is_public.neq.false,or(moderation_status.is.null,moderation_status.in.(approved,pending,flagged))),created_by.eq.${userId}`)
} else if (!canModerate) {
  query = query
    .eq('is_public', true)
    .or('moderation_status.is.null,moderation_status.in.(approved,pending,flagged)')
}
```

### Current Pagination (from adminService.ts)
```typescript
const limit = filter?.limit || 10
const offset = ((filter?.page || 1) - 1) * limit
query = query.range(offset, offset + limit - 1)
```

## Final Validation Checklist

- [ ] All TypeScript types are properly defined and exported
- [ ] QueryBuilder supports all current query patterns from services
- [ ] Visibility filtering matches exact logic from songService.ts
- [ ] Pagination helper handles all edge cases
- [ ] Error classes provide helpful user messages
- [ ] Unit tests achieve 100% coverage
- [ ] API is documented with JSDoc comments
- [ ] No performance regression vs direct Supabase
- [ ] Fluent API works with method chaining
- [ ] Mock pattern works in test environment