# Alternative Titles Feature - Product Requirements Prompt (PRP)

## Goal

**Feature Goal**: Enable songs to have multiple alternative titles for improved searchability across languages and common variations

**Deliverable**: Database field, search integration, and form UI for managing alternative titles on songs

**Success Definition**: Users can find songs by searching any of their alternative titles (e.g., searching "Unity" finds "Urie Sowonun Tongil", searching "Bless the Lord" finds "10,000 Reasons")

## User Persona

**Target User**: Worship leaders and musicians in multilingual congregations

**Use Case**: Finding songs that have multiple known titles across languages or common variations

**User Journey**:
1. User searches for "Unity" (English title)
2. System finds "Urie Sowonun Tongil" via alternative titles
3. User clicks on the song and sees all alternative titles listed
4. When adding/editing songs, user can add multiple alternative titles

**Pain Points Addressed**:
- Can't find Korean songs when searching English titles
- Missing songs with parenthetical variations (e.g., "10,000 Reasons (Bless the Lord)")
- Different communities know songs by different names
- Romanized versions have multiple spellings

## Why

- **Multilingual Support**: HSA community spans multiple languages with songs known by different titles
- **Search Success**: Users find what they're looking for regardless of which title they know
- **Data Integrity**: One song record instead of duplicates for each title variation
- **User Experience**: Reduced frustration when searching for familiar songs

## What

Add an `alternative_titles` field to songs that is searchable and manageable through the UI.

### Success Criteria

- [ ] Songs can have 0-10 alternative titles stored
- [ ] Search finds songs by any alternative title
- [ ] Form UI allows adding/removing alternative titles
- [ ] Alternative titles display in song details
- [ ] Migration preserves existing data
- [ ] Search performance remains under 500ms
- [ ] Duplicate titles prevented within same song
- [ ] Type safety maintained throughout

## All Needed Context

### Context Completeness Check

_This PRP contains all database patterns, type definitions, form components, search integration, and validation patterns needed for implementation without prior knowledge of the codebase._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/features/songs/types/song.types.ts
  why: Current Song interface to extend with alternativeTitles
  pattern: Optional arrays use string[] type
  gotcha: Database uses snake_case, TypeScript uses camelCase

- file: src/lib/database.types.ts
  why: Database type definitions needing regeneration after migration
  pattern: Auto-generated from Supabase, don't edit manually
  gotcha: Run npx supabase gen types typescript --linked after migration

- file: src/features/songs/services/songService.ts
  why: Search implementation that needs alternative_titles integration
  pattern: textSearch uses comma-separated field names
  gotcha: Array fields need different search operators

- file: src/features/songs/components/SongManagementForm.tsx
  why: Form component needing alternative titles UI
  pattern: Themes array shows exact pattern to follow
  gotcha: Separate state for input field and array values

- file: src/features/songs/validation/schemas/songFormSchema.ts
  why: Validation schema needing alternativeTitles field
  pattern: Use z.array() with min/max constraints
  gotcha: Transform for normalization during validation

- file: supabase/migrations/20240121_add_multilingual_lyrics.sql
  why: Migration pattern to follow for database changes
  pattern: Use IF NOT EXISTS, add indexes, document columns
  gotcha: Name format is YYYYMMDD_description.sql

- url: https://supabase.com/docs/guides/database/arrays
  why: Supabase array operations documentation
  critical: Shows contains() and overlaps() operators

- url: https://www.postgresql.org/docs/current/arrays.html
  why: PostgreSQL array field documentation
  critical: TEXT[] preferred over JSONB for simple string arrays
```

### Current Codebase Structure

```bash
src/features/songs/          # Existing vertical slice
├── types/
│   └── song.types.ts       # Song interface to extend
├── services/
│   └── songService.ts      # Search to enhance
├── components/
│   └── SongManagementForm.tsx  # Form to modify
├── validation/
│   ├── schemas/
│   │   └── songFormSchema.ts   # Schema to extend
│   └── utils/
│       └── themeNormalization.ts  # Pattern for normalization
└── hooks/
    └── useSongs.ts         # Data fetching hooks
```

### Known Gotchas

```typescript
// CRITICAL: Database uses snake_case
// TypeScript: alternativeTitles
// Database: alternative_titles

// CRITICAL: Themes pattern to follow exactly
// themes: string[] with add/remove UI pattern already established

// CRITICAL: Search integration
// textSearch('title,artist,alternative_titles', query)
// Arrays are automatically handled in text search

// CRITICAL: Form state management
// Separate state for input field: const [titleInput, setTitleInput] = useState('')
// Array state in main form: alternativeTitles: string[]

// CRITICAL: After migration
// Must run: npx supabase gen types typescript --linked > src/lib/database.types.ts
```

## Implementation Blueprint

### Vertical Slice Design

This feature enhances the existing `src/features/songs/` vertical slice. No new slice needed.

```
Enhancement touches:
├── Database Layer (migration)
├── Type Layer (interfaces)
├── Service Layer (search)
├── UI Layer (form component)
└── Validation Layer (schemas)
```

### Implementation Tasks

```yaml
Task 1: CREATE supabase/migrations/20250121_add_alternative_titles.sql
  - ADD COLUMN: alternative_titles TEXT[] DEFAULT ARRAY[]::TEXT[]
  - CREATE INDEX: idx_songs_alternative_titles GIN index
  - ADD CONSTRAINT: array_length check (max 10 items)
  - DOCUMENT: Column comments explaining purpose
  - FOLLOW: Pattern from 20240121_add_multilingual_lyrics.sql

Task 2: MODIFY src/features/songs/types/song.types.ts
  - ADD: alternativeTitles?: string[] to Song interface
  - FOLLOW: themes field pattern (optional string array)
  - MAINTAIN: Backward compatibility with undefined check

Task 3: REGENERATE src/lib/database.types.ts
  - RUN: npx supabase gen types typescript --linked > src/lib/database.types.ts
  - VERIFY: alternative_titles appears in database types
  - CHECK: Proper mapping to TypeScript naming

Task 4: MODIFY src/features/songs/services/songService.ts
  - UPDATE: textSearch to include alternative_titles field
  - CHANGE: Line ~178 from 'title,artist' to 'title,artist,alternative_titles'
  - TEST: Search finds songs by alternative titles
  - MAINTAIN: Performance under 500ms

Task 5: MODIFY src/features/songs/validation/schemas/songFormSchema.ts
  - ADD: alternativeTitles field to schema
  - IMPLEMENT: z.array(z.string().min(1).max(200)).max(10).optional()
  - INCLUDE: Transform for deduplication and trimming
  - PATTERN: Follow themes validation approach

Task 6: CREATE src/features/songs/validation/utils/titleNormalization.ts
  - IMPLEMENT: normalizeTitles function (follow themeNormalization.ts pattern)
  - DEDUPLICATE: Remove duplicate titles
  - TRIM: Whitespace from each title
  - FILTER: Empty strings

Task 7: MODIFY src/features/songs/components/SongManagementForm.tsx (Part 1 - State)
  - ADD: alternativeTitles: string[] to FormState interface
  - INITIALIZE: alternativeTitles: song?.alternativeTitles || []
  - ADD: const [titleInput, setTitleInput] = useState('')
  - FOLLOW: Exact pattern from themes implementation

Task 8: MODIFY src/features/songs/components/SongManagementForm.tsx (Part 2 - Handlers)
  - IMPLEMENT: handleAddAlternativeTitle (copy handleAddTheme pattern)
  - IMPLEMENT: handleRemoveAlternativeTitle (copy handleRemoveTheme pattern)  
  - VALIDATE: No duplicates, max 10 titles, not same as main title
  - CLEAR: Input after successful add

Task 9: MODIFY src/features/songs/components/SongManagementForm.tsx (Part 3 - UI)
  - ADD: Alternative Titles section after Artist field
  - COPY: Exact UI pattern from themes (chips with × button)
  - INCLUDE: Input with Add button
  - SUPPORT: Enter key to add
  - DISABLE: When max titles reached

Task 10: MODIFY src/features/songs/components/SongManagementForm.tsx (Part 4 - Submit)
  - INCLUDE: alternativeTitles in form submission data
  - VALIDATE: Using updated schema
  - HANDLE: Validation errors for alternativeTitles field

Task 11: ADD Alternative Titles Display to Song Details
  - MODIFY: Any song detail views to show alternative titles
  - STYLE: Similar to themes display (chips/badges)
  - CONDITIONAL: Only show if alternativeTitles.length > 0

Task 12: CREATE Tests
  - ADD: Unit tests for titleNormalization utility
  - ADD: Integration test for search with alternative titles
  - ADD: Form validation tests for alternativeTitles
  - VERIFY: All validation gates pass
```

### Pseudocode Implementation

```typescript
// 1. Database Migration
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS alternative_titles TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_songs_alternative_titles 
ON songs USING GIN (alternative_titles);

// 2. Type Extension
interface Song {
  // ... existing fields
  alternativeTitles?: string[]  // Optional array like themes
}

// 3. Search Integration
const { data } = await supabase
  .from('songs')
  .select()
  .textSearch('title,artist,alternative_titles', searchQuery)  // Just add field name

// 4. Form UI (exact pattern from themes)
const handleAddAlternativeTitle = () => {
  const normalized = titleInput.trim()
  if (normalized && 
      !formState.alternativeTitles.includes(normalized) && 
      normalized !== formState.title &&  // Don't allow main title as alternative
      formState.alternativeTitles.length < 10) {
    handleFieldChange('alternativeTitles', [...formState.alternativeTitles, normalized])
    setTitleInput('')
  }
}

// 5. Validation Schema
alternativeTitles: z.array(
  z.string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title too long')
)
  .max(10, 'Maximum 10 alternative titles')
  .optional()
  .transform(titles => titles ? normalizeTitles(titles) : undefined)
```

## Validation Gates

```bash
# Level 1: Type Checking
npm run build

# Level 2: Linting  
npm run lint

# Level 3: Test Alternative Titles Search
# In your test file:
describe('Alternative Titles Search', () => {
  it('finds songs by alternative title', async () => {
    const results = await songService.searchSongs({ searchQuery: 'Unity' })
    expect(results).toContainEqual(
      expect.objectContaining({ title: 'Urie Sowonun Tongil' })
    )
  })
})

# Level 4: Form Validation Test
describe('Alternative Titles Form', () => {
  it('prevents duplicate alternative titles', () => {
    // Add same title twice, verify only one exists
  })
  
  it('limits to 10 alternative titles', () => {
    // Try adding 11th title, verify rejection
  })
})

# Level 5: Database Migration Verification
# After migration, in SQL editor:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'songs' AND column_name = 'alternative_titles';

# Level 6: Search Performance Test
# Query with alternative titles should return in < 500ms
const start = Date.now()
await songService.searchSongs({ searchQuery: 'test' })
console.log('Search time:', Date.now() - start, 'ms')

# Level 7: End-to-End Test
# 1. Add song with alternative titles via form
# 2. Search for alternative title
# 3. Verify song found
# 4. Edit song, remove alternative title
# 5. Search again, verify not found
```

## Error Handling Strategy

```typescript
// Form Level
try {
  handleAddAlternativeTitle()
} catch (error) {
  setValidationErrors(prev => ({
    ...prev,
    alternativeTitles: 'Failed to add alternative title'
  }))
}

// Service Level  
try {
  const results = await supabase
    .from('songs')
    .select()
    .textSearch('title,artist,alternative_titles', query)
  
  if (error) throw error
  return results
} catch (error) {
  console.error('Search failed:', error)
  // Fallback to title-only search
  return supabase
    .from('songs')
    .select()
    .textSearch('title', query)
}

// Migration Level
-- Use IF NOT EXISTS to prevent errors
-- Include rollback instructions in comments
```

## Testing Checklist

- [ ] Alternative titles field appears in form
- [ ] Can add up to 10 alternative titles
- [ ] Cannot add duplicate titles
- [ ] Cannot add main title as alternative
- [ ] Alternative titles are searchable
- [ ] Search performance < 500ms
- [ ] Alternative titles display in song details
- [ ] Form validation prevents invalid data
- [ ] Database migration runs without errors
- [ ] TypeScript types properly generated
- [ ] No console errors in browser
- [ ] Mobile responsive UI for alternative titles

## Anti-Patterns to Avoid

- ❌ Don't use JSONB when TEXT[] is sufficient
- ❌ Don't allow unlimited alternative titles (cap at 10)
- ❌ Don't forget GIN index for search performance
- ❌ Don't mix database naming (use snake_case consistently)
- ❌ Don't duplicate the themes UI pattern - copy it exactly
- ❌ Don't skip deduplication in normalization
- ❌ Don't allow empty strings in array
- ❌ Don't forget to regenerate TypeScript types after migration

## Performance Considerations

- GIN index on alternative_titles enables fast searches
- TEXT[] more efficient than JSONB for simple strings
- Limit array to 10 items prevents bloat
- Client-side deduplication reduces database writes
- Search includes all fields in single query (no N+1)

## Security Considerations

- Validate title length (max 200 chars) to prevent abuse
- Sanitize input to prevent XSS (React handles this)
- Array length limit prevents DoS via huge arrays
- Use parameterized queries (Supabase handles this)

## Future Enhancements (Not in Scope)

- Auto-suggest alternative titles from existing songs
- Import alternative titles from CCLI database
- Language detection for alternative titles
- Similarity matching for near-duplicates
- Bulk edit alternative titles

---

## PRP Quality Score: 9/10

**Confidence Level**: Very High

**Rationale**:
- ✅ Comprehensive context with all file references
- ✅ Exact patterns to copy from themes implementation  
- ✅ Clear database migration path
- ✅ All validation gates are executable
- ✅ Detailed error handling strategy
- ✅ Performance considerations addressed
- ✅ Security aspects covered
- ✅ Anti-patterns explicitly listed
- ✅ Test scenarios well defined
- ⚠️ Minor: Could include actual test file examples

This PRP should enable one-pass implementation with high success probability due to the extensive pattern matching with existing themes functionality and comprehensive context provided.