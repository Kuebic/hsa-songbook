name: "Tag System Stage 1 - Database Schema and Core API Layer"
description: |

---

## Goal

**Feature Goal**: Establish a robust database foundation for the dual tag system (flexible song tags + structured arrangement metadata) with core API services and comprehensive validation

**Deliverable**: Database schema with migrations, TypeScript types, core tag service class, and API endpoints for tag operations

**Success Definition**: Functional tag database with CRUD operations, normalization logic, synonym mapping, and usage tracking ready for UI integration

## User Persona (if applicable)

**Target User**: Backend systems and API consumers (frontend components in later stages)

**Use Case**: Store, retrieve, normalize, and manage tags for songs while supporting structured metadata for arrangements

**User Journey**: API consumers can create tags, query with autocomplete, track usage, handle synonyms, and manage tag-song relationships

**Pain Points Addressed**: Inconsistent tag naming, duplicate concepts, lack of normalization, no usage tracking, mixed concerns between themes and technical metadata

## Why

- **Consistency**: Centralized tag normalization eliminates variations ("Xmas" vs "Christmas")
- **Performance**: Indexed normalized names enable sub-100ms autocomplete responses  
- **Flexibility**: Supports both flexible tagging (songs) and structured metadata (arrangements)
- **Data Integrity**: Foreign key constraints and validation ensure clean relationships
- **Future-Proof**: Foundation for admin tools, analytics, and faceted search

## What

Backend infrastructure providing normalized tag storage, synonym mapping, usage tracking, and efficient querying with full TypeScript type safety.

### Success Criteria

- [ ] Database schema deployed with proper indexes and constraints
- [ ] Tag CRUD operations working with < 100ms response time
- [ ] Autocomplete suggestions returning in < 50ms for 2+ character queries
- [ ] Synonym mapping correctly redirects to canonical tags
- [ ] Usage counts automatically increment/decrement on tag operations
- [ ] TypeScript types generated and aligned with database schema
- [ ] All unit tests passing with > 80% coverage

## All Needed Context

### Context Completeness Check

_This PRP contains all database patterns, Supabase conventions, type generation workflows, and error handling patterns needed for implementation._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/lib/database.types.ts
  why: Current Supabase type definitions to understand schema patterns
  pattern: Type generation workflow, naming conventions
  gotcha: Generated file - do not edit directly, regenerate after migrations

- file: src/features/songs/services/songService.ts
  why: Service class pattern with error handling and caching
  pattern: Cache strategy (30s TTL), error mapping, response structure
  gotcha: Always map snake_case DB fields to camelCase in application

- file: src/features/songs/validation/utils/themeNormalization.ts
  why: Existing theme normalization logic to integrate
  pattern: Fuzzy matching with Levenshtein distance, canonical mappings
  gotcha: 200+ theme variations already mapped - reuse this logic

- file: src/features/songs/validation/schemas/songFormSchema.ts
  why: Zod validation patterns for form data
  pattern: Transform functions, custom refinements, error messages
  gotcha: Always validate before database operations

- file: supabase/migrations/20240121_add_multilingual_lyrics.sql
  why: Migration file pattern and RLS policy examples
  pattern: Schema creation, index strategy, policy definitions
  gotcha: Always include RLS policies in migrations

- docfile: PRPs/ai_docs/hsa-songbook-database-patterns.md
  why: Comprehensive database patterns guide for this codebase
  section: Service Layer Architecture, Error Handling

- url: https://supabase.com/docs/guides/database/postgres/indexes
  why: PostgreSQL indexing best practices for tag queries
  critical: Use GIN indexes for array columns, B-tree for lookups
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase

```bash
src/
├── features/
│   ├── songs/
│   │   ├── services/
│   │   │   ├── songService.ts
│   │   │   └── arrangementService.ts
│   │   ├── validation/
│   │   │   ├── schemas/
│   │   │   ├── constants/
│   │   │   └── utils/
│   │   └── types/
│   │       ├── song.types.ts
│   │       └── arrangement.types.ts
│   └── ...
├── lib/
│   ├── database.types.ts
│   └── supabase.ts
└── shared/
    └── types/
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
src/
├── features/
│   ├── tags/                              # NEW: Tag system feature module
│   │   ├── types/
│   │   │   └── tag.types.ts              # Tag interfaces and enums
│   │   ├── validation/
│   │   │   └── tagSchemas.ts             # Zod schemas for tag operations
│   │   ├── services/
│   │   │   ├── tagService.ts             # Core tag CRUD and operations
│   │   │   └── tagService.test.ts        # Service unit tests
│   │   ├── utils/
│   │   │   ├── tagNormalizer.ts          # Normalization and synonym logic
│   │   │   └── tagNormalizer.test.ts     # Normalizer tests
│   │   └── constants/
│   │       └── tagCategories.ts          # Tag category definitions
│   └── songs/
│       ├── services/
│       │   └── songService.ts            # MODIFY: Add tag relationship methods
│       └── types/
│           └── song.types.ts              # MODIFY: Remove themes, add tag relations
└── lib/
    └── database.types.ts                  # REGENERATE: After migration
    
supabase/
└── migrations/
    └── 20250123_add_tag_system.sql       # NEW: Tag system migration
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Supabase requires RLS policies for all tables
// Without policies, queries will return empty results even if data exists

// CRITICAL: Database uses snake_case, application uses camelCase
// Always map fields in service layer, never expose DB naming to UI

// CRITICAL: Supabase type generation overwrites database.types.ts
// Run: npx supabase gen types typescript --local > src/lib/database.types.ts

// CRITICAL: React Query cache keys must be unique and stable
// Use consistent key patterns: ['tags', 'list'], ['tags', 'detail', id]

// CRITICAL: PostgreSQL arrays require special indexing
// Use GIN indexes for array columns to enable efficient contains queries
```

## Implementation Blueprint

### Data models and structure

Create the core data models ensuring type safety and consistency.

```typescript
// src/features/tags/types/tag.types.ts
export type TagCategory = 'theme' | 'occasion' | 'liturgical' | 'mood'

export interface Tag {
  id: string
  name: string
  normalizedName: string
  category: TagCategory
  color?: string
  usageCount: number
  isStandard: boolean
  createdAt: Date
  createdBy?: string
  promotedAt?: Date | null
}

export interface TagSynonym {
  id: string
  synonym: string
  canonicalTagId: string
  createdAt: Date
}

export interface SongTag {
  songId: string
  tagId: string
  addedBy?: string
  addedAt: Date
}

export interface TagSuggestion {
  tag: Tag
  matchType: 'exact' | 'fuzzy' | 'synonym'
  score: number
}

// Database to application mapping types
export interface DBTag {
  id: string
  name: string
  normalized_name: string
  category: TagCategory
  color: string | null
  usage_count: number
  is_standard: boolean
  created_at: string
  created_by: string | null
  promoted_at: string | null
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE supabase/migrations/20250123_add_tag_system.sql
  - IMPLEMENT: Complete tag system database schema with indexes
  - INCLUDE: tags, song_tags, tag_synonyms, tag_moderation_log tables
  - INDEXES: GIN for arrays, B-tree for lookups, composite for relationships
  - RLS: Policies for public read, authenticated write, admin moderation
  - PLACEMENT: Supabase migrations directory

Task 2: GENERATE src/lib/database.types.ts
  - COMMAND: npx supabase gen types typescript --local > src/lib/database.types.ts
  - VALIDATE: New tag tables appear in generated types
  - DEPENDENCIES: Task 1 migration must be applied first
  - PLACEMENT: Regenerated in lib directory

Task 3: CREATE src/features/tags/types/tag.types.ts
  - IMPLEMENT: TypeScript interfaces for tags, synonyms, relationships
  - FOLLOW pattern: src/features/songs/types/song.types.ts (interface structure)
  - INCLUDE: Application types and DB mapping types
  - NAMING: PascalCase interfaces, camelCase properties
  - PLACEMENT: Feature types directory

Task 4: CREATE src/features/tags/constants/tagCategories.ts
  - IMPLEMENT: Tag categories, colors, standard tag definitions
  - FOLLOW pattern: src/features/songs/validation/constants/themes.ts
  - INCLUDE: Color mappings, category metadata
  - PLACEMENT: Feature constants directory

Task 5: CREATE src/features/tags/validation/tagSchemas.ts
  - IMPLEMENT: Zod schemas for tag creation, updates, queries
  - FOLLOW pattern: src/features/songs/validation/schemas/songFormSchema.ts
  - INCLUDE: Name validation, category validation, color format validation
  - DEPENDENCIES: Import types from Task 3
  - PLACEMENT: Feature validation directory

Task 6: CREATE src/features/tags/utils/tagNormalizer.ts
  - IMPLEMENT: Tag normalization, synonym resolution, fuzzy matching
  - INTEGRATE: Existing theme normalization from songs feature
  - FOLLOW pattern: src/features/songs/validation/utils/themeNormalization.ts
  - INCLUDE: Levenshtein distance, canonical mappings
  - PLACEMENT: Feature utils directory

Task 7: CREATE src/features/tags/services/tagService.ts
  - IMPLEMENT: Complete tag service with CRUD, search, suggestions
  - FOLLOW pattern: src/features/songs/services/songService.ts
  - METHODS: create, update, delete, suggest, getSynonyms, incrementUsage
  - CACHING: 30-second TTL for suggestions, invalidate on mutations
  - ERROR HANDLING: Custom error classes, Supabase error mapping
  - DEPENDENCIES: Import schemas from Task 5, normalizer from Task 6
  - PLACEMENT: Feature services directory

Task 8: MODIFY src/features/songs/services/songService.ts
  - ADD: Methods for tag relationships (addTags, removeTags, getTags)
  - UPDATE: Create/update methods to handle tag associations
  - REMOVE: Direct theme array handling
  - DEPENDENCIES: Import tag service from Task 7
  - PLACEMENT: Existing song service

Task 9: CREATE src/features/tags/services/tagService.test.ts
  - IMPLEMENT: Comprehensive unit tests for tag service
  - FOLLOW pattern: Existing test patterns in codebase
  - COVERAGE: CRUD operations, normalization, suggestions, error cases
  - MOCK: Supabase client, test happy paths and edge cases
  - PLACEMENT: Alongside tag service

Task 10: CREATE src/features/tags/utils/tagNormalizer.test.ts  
  - IMPLEMENT: Unit tests for normalization logic
  - TEST: Fuzzy matching, synonym resolution, edge cases
  - COVERAGE: All normalization methods
  - PLACEMENT: Alongside normalizer utility
```

### Implementation Patterns & Key Details

```typescript
// Migration pattern with RLS
-- supabase/migrations/20250123_add_tag_system.sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  normalized_name VARCHAR(50) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('theme', 'occasion', 'liturgical', 'mood')),
  color VARCHAR(7),
  usage_count INTEGER DEFAULT 0,
  is_standard BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  promoted_at TIMESTAMPTZ
);

-- CRITICAL: Indexes for performance
CREATE INDEX idx_tags_normalized ON tags(normalized_name);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
CREATE INDEX idx_tags_category ON tags(category);

-- CRITICAL: RLS policies
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone" 
  ON tags FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create tags" 
  ON tags FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

// Service pattern with caching and error handling
class TagService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  async suggestTags(query: string, category?: TagCategory): Promise<TagSuggestion[]> {
    // PATTERN: Input validation with Zod
    const validated = tagQuerySchema.parse({ query, category });
    
    // PATTERN: Cache check
    const cacheKey = `suggest:${query}:${category || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // PATTERN: Normalized search
    const normalized = this.normalizer.normalize(query);
    
    // GOTCHA: Use .ilike() for case-insensitive PostgreSQL search
    const { data, error } = await this.supabase
      .from('tags')
      .select('*')
      .or(`normalized_name.ilike.%${normalized}%, name.ilike.%${query}%`)
      .limit(5)
      .order('usage_count', { ascending: false });

    if (error) throw new DatabaseError('Failed to fetch suggestions', error);
    
    // PATTERN: Transform and score results
    const suggestions = this.scoreAndRankSuggestions(data, query);
    
    // PATTERN: Update cache
    this.setCache(cacheKey, suggestions);
    
    return suggestions;
  }

  // CRITICAL: Increment usage atomically
  async incrementUsage(tagId: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_tag_usage', { 
      tag_id: tagId 
    });
    
    if (error) throw new DatabaseError('Failed to increment usage', error);
    
    // PATTERN: Invalidate relevant caches
    this.invalidateCache('suggest:*');
  }
}

// Normalizer pattern with fuzzy matching
export class TagNormalizer {
  private synonymMap = new Map<string, string>();
  
  normalize(input: string): string {
    const cleaned = input.toLowerCase().trim();
    
    // Check exact synonym match
    if (this.synonymMap.has(cleaned)) {
      return this.synonymMap.get(cleaned)!;
    }
    
    // PATTERN: Fuzzy match with Levenshtein distance
    const bestMatch = this.findBestMatch(cleaned);
    if (bestMatch && bestMatch.distance <= 2) {
      return bestMatch.canonical;
    }
    
    return cleaned;
  }
}
```

### Integration Points

```yaml
DATABASE:
  - migration: "supabase/migrations/20250123_add_tag_system.sql"
  - rls: "Multiple policies for read/write/admin access"
  - functions: "increment_tag_usage, merge_tags (PostgreSQL functions)"

TYPES:
  - update: "src/lib/database.types.ts"
  - generate: "npx supabase gen types typescript --local > src/lib/database.types.ts"

EXISTING_SERVICES:
  - modify: "src/features/songs/services/songService.ts"
  - integrate: "Tag operations into song CRUD methods"

CACHING:
  - strategy: "30-second TTL for suggestions"
  - invalidation: "On mutations and usage updates"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint                         # ESLint check
npm run build                        # TypeScript compilation

# Expected: Zero errors. Fix any issues before continuing.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test tag service
npm run test -- src/features/tags/services/tagService.test.ts

# Test normalizer
npm run test -- src/features/tags/utils/tagNormalizer.test.ts

# Full feature test suite
npm run test -- src/features/tags

# Coverage check
npm run test:coverage -- src/features/tags

# Expected: All tests pass with > 80% coverage
```

### Level 3: Integration Testing (System Validation)

```bash
# Start Supabase locally
npx supabase start

# Apply migration
npx supabase migration up --local

# Verify schema
npx supabase db dump --local | grep -E "(tags|song_tags|tag_synonyms)"

# Test RLS policies
npx supabase db query "SELECT * FROM tags" --local
npx supabase db query "INSERT INTO tags (name, normalized_name, category) VALUES ('test', 'test', 'theme')" --local

# Generate types
npx supabase gen types typescript --local > src/lib/database.types.ts

# Verify type generation
grep -A 10 "interface Tag" src/lib/database.types.ts

# Start dev server
npm run dev

# Expected: Migration applied, types generated, queries work
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Performance testing - Autocomplete response time
# Create test script to measure suggestion query time
node -e "
const start = Date.now();
// Query tags with 'chr' prefix
console.log('Query time:', Date.now() - start, 'ms');
"

# Normalization validation
# Test that variations map to canonical forms
node -e "
const normalizer = require('./src/features/tags/utils/tagNormalizer');
console.assert(normalizer.normalize('Xmas') === 'christmas');
console.assert(normalizer.normalize('X-mas') === 'christmas');
"

# Usage tracking validation
# Verify usage counts increment correctly
npx supabase db query "SELECT usage_count FROM tags WHERE name = 'christmas'" --local
# Add tag to song
# Re-check usage count - should increment

# RLS policy testing
# Test as anonymous user (should read but not write)
# Test as authenticated user (should read and write)
# Test as admin (should have full access including moderation)

# Expected: < 50ms autocomplete, correct normalization, working RLS
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test -- src/features/tags`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run build`
- [ ] Database migration applied successfully
- [ ] Types regenerated and aligned with schema

### Feature Validation

- [ ] Tag CRUD operations working
- [ ] Autocomplete returns results in < 50ms
- [ ] Synonym mapping redirects correctly
- [ ] Usage counts increment/decrement properly
- [ ] Normalization handles all test cases
- [ ] RLS policies enforce proper access control

### Code Quality Validation

- [ ] Follows existing service and validation patterns
- [ ] Proper error handling with custom error classes
- [ ] Cache implementation with TTL and invalidation
- [ ] Database field mapping (snake_case to camelCase)
- [ ] Test coverage > 80%

### Documentation & Deployment

- [ ] Type definitions complete and exported
- [ ] Service methods have clear interfaces
- [ ] Migration includes helpful comments
- [ ] Test cases document expected behavior

---

## Anti-Patterns to Avoid

- ❌ Don't edit database.types.ts directly - always regenerate
- ❌ Don't skip RLS policies - queries will fail silently
- ❌ Don't mix database field naming (snake_case) with app naming (camelCase)
- ❌ Don't forget to invalidate cache on mutations
- ❌ Don't hardcode tag lists - use database as source of truth
- ❌ Don't skip normalization - it's critical for consistency
- ❌ Don't ignore TypeScript errors - they prevent runtime issues
- ❌ Don't forget indexes - they're critical for performance