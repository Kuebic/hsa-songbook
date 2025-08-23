name: "Streamlined Tags & Metadata System Implementation"
description: |
  Complete implementation of a sophisticated tagging system for songs and structured metadata for arrangements.
  Two-system approach: flexible semantic tags for songs, structured fields for arrangements.
  Includes autocomplete, admin moderation, and faceted search capabilities.

---

## Goal

**Feature Goal**: Implement a streamlined two-system approach for song tagging and arrangement metadata with autocomplete, moderation, and enhanced search capabilities

**Deliverable**: 
1. Tag input component with autocomplete and quick-picks
2. Song tagging system with semantic categories
3. Arrangement metadata form with structured fields
4. Admin tag management interface
5. Enhanced faceted search with filters

**Success Definition**: Users can tag songs in < 5 seconds, filter arrangements by objective criteria, and search results improve through consistent tagging

## User Persona

**Target User**: 
- **Song Contributors**: Musicians adding songs to the catalog
- **Worship Leaders**: Finding appropriate songs for services
- **Admins**: Managing tag quality and consistency

**Use Case**: 
- Quickly tag songs with themes/occasions during creation
- Filter songs by both theme AND arrangement properties
- Maintain tag consistency across the catalog

**User Journey**: 
1. Contributor starts typing theme → sees autocomplete suggestions → selects or creates tag
2. Worship leader searches "communion" → filters by key:G, difficulty:≤3 → finds perfect arrangement
3. Admin views tag analytics → merges duplicates → promotes popular custom tags

**Pain Points Addressed**:
- Currently takes 30+ seconds to add tags manually
- No autocomplete or suggestions leading to inconsistent tagging
- Can't filter arrangements by key, difficulty, or style
- Subjective themes mixed with objective metadata

## Why

- **Business value**: Improved discoverability increases song usage by 40%
- **Integration**: Enhances existing search with faceted filtering
- **Problems solved**: Inconsistent tagging, poor filtering, slow data entry
- **User impact**: 5-second tagging, powerful search filters, better discovery

## What

Two-system approach separating concerns:
1. **Song Tags**: Flexible semantic tagging (themes, occasions, moods)
2. **Arrangement Metadata**: Structured fields (key, difficulty, style, instrumentation)

### Success Criteria

- [ ] Tag entry completed in < 5 seconds with autocomplete
- [ ] Autocomplete response time < 100ms
- [ ] Support for comma-separated bulk tag entry
- [ ] Visual tag pills with remove functionality
- [ ] Arrangement metadata form with dropdowns/selects
- [ ] Admin can merge duplicate tags
- [ ] Faceted search with real-time filtering
- [ ] Mobile-friendly with 44px touch targets
- [ ] Full keyboard navigation support
- [ ] ARIA-compliant accessibility

## All Needed Context

### Context Completeness Check

_This PRP contains everything needed for an AI agent unfamiliar with the codebase to implement this feature successfully, including specific patterns, file locations, and implementation details._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://floating-ui.com/docs/react#middleware
  why: Dropdown positioning with @floating-ui/react middleware stack
  critical: Use flip(), shift(), size() middleware for intelligent positioning

- url: https://react.dev/reference/react/useOptimistic
  why: React 19 optimistic updates for tag operations
  critical: Use with useTransition for immediate UI feedback

- url: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
  why: ARIA combobox pattern for accessible autocomplete
  critical: Required roles and aria attributes for screen readers

- file: src/features/arrangements/components/ChordProEditor/components/AutoCompleteDropdown/index.tsx
  why: Existing autocomplete pattern with Floating UI, mobile support, keyboard navigation
  pattern: Complete autocomplete implementation with accessibility
  gotcha: Mobile virtual keyboard detection, portal rendering for z-index

- file: src/features/songs/components/SongManagementForm.tsx
  why: Current form implementation showing theme handling
  pattern: Form state management, validation, error handling
  gotcha: Themes currently use simple array, need transformation

- file: src/features/songs/services/songService.ts
  why: Service layer patterns for CRUD operations
  pattern: Error handling, type mapping, caching strategy
  gotcha: Clear cache after mutations, handle Supabase errors

- file: src/features/songs/hooks/mutations/useSongMutations.ts
  why: React 19 optimistic update patterns
  pattern: useOptimistic with useTransition for mutations
  gotcha: Handle optimistic rollback on error

- file: src/shared/components/notifications/NotificationProvider.tsx
  why: Success/error notification patterns
  pattern: Global notification system usage
  gotcha: Auto-dismiss timing, notification IDs

- file: src/features/songs/validation/schemas/songFormSchema.ts
  why: Zod validation patterns for forms
  pattern: Schema composition, transformations, custom refinements
  gotcha: Empty string handling, array validation

- docfile: PRPs/streamlined-tags-metadata-system-prd.md
  why: Complete PRD with data models, UI specs, API definitions
  section: All sections - comprehensive feature specification
```

### Current Codebase tree

```bash
src/
├── features/
│   ├── songs/
│   │   ├── components/
│   │   │   ├── SongManagementForm.tsx      # Current form to modify
│   │   │   └── InlineEditField.tsx        # Inline editing pattern
│   │   ├── services/
│   │   │   └── songService.ts             # Service patterns
│   │   ├── hooks/
│   │   │   └── mutations/                 # Mutation hooks
│   │   └── validation/
│   │       ├── schemas/
│   │       └── utils/
│   │           └── themeNormalization.ts  # Theme utilities
│   ├── arrangements/
│   │   ├── components/
│   │   │   └── ChordProEditor/
│   │   │       └── components/
│   │   │           └── AutoCompleteDropdown/ # Autocomplete reference
│   └── admin/                              # NEW
│       ├── components/                    # NEW
│       └── services/                      # NEW
├── shared/
│   ├── components/
│   │   ├── ui/                            # NEW - shared UI components
│   │   └── notifications/
│   └── validation/
└── lib/
    └── database.types.ts                  # Database types
```

### Desired Codebase tree with files to be added

```bash
src/
├── features/
│   ├── tags/                              # NEW - Tag system feature
│   │   ├── types/
│   │   │   └── tag.types.ts               # Tag interfaces and types
│   │   ├── components/
│   │   │   ├── TagInput.tsx               # Main tag input component
│   │   │   ├── TagPill.tsx                # Individual tag display
│   │   │   ├── QuickPickTags.tsx          # Popular tags section
│   │   │   └── TagAutocomplete.tsx        # Autocomplete dropdown
│   │   ├── services/
│   │   │   └── tagService.ts              # Tag CRUD operations
│   │   ├── hooks/
│   │   │   ├── useTagSuggestions.ts       # Autocomplete logic
│   │   │   ├── useTagMutations.ts         # Create/update/delete tags
│   │   │   └── useTagCache.ts             # Client-side caching
│   │   └── validation/
│   │       └── tagSchemas.ts              # Zod schemas for tags
│   ├── admin/
│   │   ├── components/
│   │   │   ├── TagManager.tsx             # Admin tag interface
│   │   │   ├── TagMergeDialog.tsx         # Merge duplicates UI
│   │   │   └── TagAnalytics.tsx           # Usage statistics
│   │   └── services/
│   │       └── adminTagService.ts         # Admin operations
│   ├── songs/
│   │   ├── components/
│   │   │   └── SongManagementForm.tsx     # MODIFIED - integrate TagInput
│   │   └── validation/
│   │       └── schemas/
│   │           └── songFormSchema.ts      # MODIFIED - update for tags
│   └── arrangements/
│       ├── components/
│       │   └── ArrangementMetadataForm.tsx # NEW - structured fields
│       └── types/
│           └── metadata.types.ts           # NEW - metadata types
├── shared/
│   └── components/
│       └── ui/
│           ├── Select.tsx                  # NEW - reusable select
│           ├── MultiSelect.tsx             # NEW - multi-select
│           └── DifficultySelector.tsx      # NEW - 1-5 star selector
└── lib/
    └── database.types.ts                  # MODIFIED - add tag tables
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: @floating-ui/react requires proper middleware ordering
// Example: flip() before shift() for correct fallback behavior
const floatingConfig = {
  middleware: [
    offset(4),
    flip({ fallbackPlacements: ['top-start'] }), // Must be before shift
    shift({ padding: 8 }),
    size() // Must be last for dynamic sizing
  ]
}

// CRITICAL: React 19 useOptimistic requires useTransition wrapper
// Example: Always wrap optimistic updates in startTransition
const [isPending, startTransition] = useTransition()
const [optimistic, addOptimistic] = useOptimistic(initial, reducer)
// Must use: startTransition(() => addOptimistic(update))

// CRITICAL: Supabase RLS policies required for all tables
// Example: Tags table needs public read, authenticated write
// CREATE POLICY "Tags are viewable by all" ON tags FOR SELECT USING (true);
// CREATE POLICY "Authenticated users can create tags" ON tags FOR INSERT TO authenticated USING (true);

// CRITICAL: Zod transforms run AFTER validation
// Example: normalizeThemes must handle already-validated data
themes: z.array(z.string()).transform(normalizeThemes) // normalizeThemes receives validated strings

// CRITICAL: Mobile Safari requires -webkit-tap-highlight-color
// Example: Prevent blue highlight on custom buttons
button { -webkit-tap-highlight-color: transparent; }

// CRITICAL: Virtual keyboard detection for mobile positioning
// Example: Check visualViewport for keyboard state
const isKeyboardVisible = window.visualViewport && 
  window.visualViewport.height < window.innerHeight * 0.75
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/features/tags/types/tag.types.ts
export interface Tag {
  id: string
  name: string
  normalizedName: string
  category: TagCategory
  color?: string
  usageCount: number
  isStandard: boolean
  createdAt: string
  createdBy?: string
}

export type TagCategory = 'theme' | 'occasion' | 'liturgical' | 'mood'

export interface TagSuggestion {
  tag: Tag
  matchType: 'exact' | 'fuzzy' | 'synonym'
  score: number
}

// src/features/arrangements/types/metadata.types.ts
export interface ArrangementMetadata {
  key?: MusicalKey
  difficulty?: 1 | 2 | 3 | 4 | 5
  style?: ArrangementStyle
  tempoBpm?: number
  instrumentation?: Instrument[]
  capoPosition?: number
  tuning?: GuitarTuning
  styleTags?: string[] // Limited flexible tags
}

export type MusicalKey = 'C' | 'G' | 'D' | 'A' | 'E' | 'B' | 'F' | 
                         'Bb' | 'Eb' | 'Ab' | 'Db' | 'Gb' |
                         'Am' | 'Em' | 'Bm' | 'F#m' | 'C#m' | 'G#m' |
                         'Dm' | 'Gm' | 'Cm' | 'Fm' | 'Bbm' | 'Ebm'

// src/features/tags/validation/tagSchemas.ts
import { z } from 'zod'

export const tagSchema = z.object({
  name: z.string()
    .min(2, 'Tag must be at least 2 characters')
    .max(30, 'Tag must be less than 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Tag must be lowercase with hyphens only')
    .transform(val => val.toLowerCase().trim()),
  category: z.enum(['theme', 'occasion', 'liturgical', 'mood']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional()
})

export const createTagInputSchema = tagSchema
export const updateTagSchema = tagSchema.partial()
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/features/tags/types/tag.types.ts
  - IMPLEMENT: TypeScript interfaces for Tag, TagCategory, TagSuggestion
  - FOLLOW pattern: src/features/songs/types/song.types.ts (interface structure)
  - NAMING: PascalCase interfaces, camelCase properties, SCREAMING_SNAKE constants
  - PLACEMENT: Feature-specific types directory
  - EXPORTS: Named exports for all types

Task 2: CREATE database migration supabase/migrations/20250123_add_tags_system.sql
  - IMPLEMENT: Tags, song_tags, tag_synonyms, tag_moderation_log tables
  - FOLLOW pattern: PRD Section "Database Schema" for complete SQL
  - INCLUDE: Indexes for normalized names, GIN index for text search
  - RLS: Public read on tags, authenticated write, admin moderation
  - PLACEMENT: Supabase migrations directory

Task 3: UPDATE src/lib/database.types.ts
  - REGENERATE: npx supabase gen types typescript --local > src/lib/database.types.ts
  - VERIFY: New tag tables appear in Database type
  - DEPENDENCIES: Task 2 migration must be applied first

Task 4: CREATE src/features/tags/validation/tagSchemas.ts
  - IMPLEMENT: Zod schemas for tag creation, update, validation
  - FOLLOW pattern: src/features/songs/validation/schemas/songFormSchema.ts
  - INCLUDE: Normalization transforms, custom refinements
  - DEPENDENCIES: Import types from Task 1
  - EXPORTS: Named exports for all schemas

Task 5: CREATE src/features/tags/services/tagService.ts
  - IMPLEMENT: CRUD operations, search, suggestions, synonym handling
  - FOLLOW pattern: src/features/songs/services/songService.ts (error handling, caching)
  - METHODS: getTags(), searchTags(), createTag(), getSuggestions()
  - CACHING: Simple TTL cache for popular tags
  - DEPENDENCIES: Import types and schemas from Tasks 1,4

Task 6: CREATE src/features/tags/hooks/useTagSuggestions.ts
  - IMPLEMENT: Debounced autocomplete with fuzzy matching
  - FOLLOW pattern: React 19 patterns, useDeferredValue for debouncing
  - FEATURES: Local filtering, API fallback, synonym support
  - DEPENDENCIES: Import service from Task 5
  - EXPORTS: useTagSuggestions hook

Task 7: CREATE src/features/tags/components/TagPill.tsx
  - IMPLEMENT: Individual tag display with remove button
  - FOLLOW pattern: GitHub/Stack Overflow tag pills
  - PROPS: tag, color, onRemove, size, removable
  - STYLING: CSS variables, theme-aware, semantic colors
  - ACCESSIBILITY: aria-label for remove button

Task 8: CREATE src/features/tags/components/TagAutocomplete.tsx
  - IMPLEMENT: Floating UI dropdown with suggestions
  - FOLLOW pattern: src/features/arrangements/components/ChordProEditor/components/AutoCompleteDropdown/index.tsx
  - FEATURES: Keyboard navigation, mobile support, portal rendering
  - DEPENDENCIES: @floating-ui/react, import TagPill from Task 7
  - ACCESSIBILITY: Full ARIA combobox pattern

Task 9: CREATE src/features/tags/components/TagInput.tsx
  - IMPLEMENT: Complete tag input with autocomplete and pills
  - INTEGRATE: TagAutocomplete (Task 8), TagPill (Task 7)
  - FEATURES: Comma-separated entry, quick picks, validation
  - DEPENDENCIES: Import hooks from Task 6
  - PROPS: value, onChange, maxTags, category, placeholder

Task 10: CREATE src/features/tags/components/QuickPickTags.tsx
  - IMPLEMENT: Popular tags for one-click addition
  - FOLLOW pattern: Chip/button group layout
  - FEATURES: Show top 10 tags by usage, click to add
  - DEPENDENCIES: Import tagService from Task 5

Task 11: UPDATE src/features/songs/components/SongManagementForm.tsx
  - REPLACE: Current theme input with TagInput component
  - IMPORT: TagInput from Task 9, QuickPickTags from Task 10
  - MAINTAIN: Form validation, error handling patterns
  - INTEGRATE: With existing form state management

Task 12: CREATE src/shared/components/ui/Select.tsx
  - IMPLEMENT: Reusable select component
  - FOLLOW pattern: Native select with consistent styling
  - PROPS: options, value, onChange, placeholder, disabled
  - STYLING: Match inputStyles from SongManagementForm

Task 13: CREATE src/shared/components/ui/DifficultySelector.tsx
  - IMPLEMENT: 1-5 star rating selector
  - VISUAL: Filled/empty stars, click to set
  - PROPS: value (1-5), onChange, size, readonly
  - ACCESSIBILITY: Radio group pattern with arrow keys

Task 14: CREATE src/features/arrangements/components/ArrangementMetadataForm.tsx
  - IMPLEMENT: Structured metadata fields
  - COMPONENTS: Select (Task 12), DifficultySelector (Task 13)
  - FIELDS: Key, difficulty, style, tempo, instrumentation
  - LAYOUT: Responsive grid, mobile-friendly

Task 15: CREATE src/features/admin/components/TagManager.tsx
  - IMPLEMENT: Admin interface for tag management
  - FEATURES: View all tags, usage counts, merge, promote
  - FOLLOW pattern: Data table with actions
  - PERMISSIONS: Check isAdmin from useAuth hook

Task 16: CREATE src/features/admin/services/adminTagService.ts
  - IMPLEMENT: Admin operations - merge, promote, ban
  - FOLLOW pattern: Service layer with error handling
  - METHODS: mergeTags(), promoteTag(), deleteTag()
  - LOGGING: Track all admin actions in moderation_log

Task 17: UPDATE src/features/search components
  - ENHANCE: Add faceted filtering UI
  - IMPLEMENT: Tag filter chips, arrangement metadata filters
  - INTEGRATE: With existing search functionality
  - REAL-TIME: Update results as filters change

Task 18: CREATE comprehensive tests
  - UNIT: Test each component with Vitest + Testing Library
  - INTEGRATION: Test tag creation flow, autocomplete
  - E2E: Test search with filters (if Playwright available)
  - COVERAGE: Aim for >80% coverage on new code
```

### Implementation Patterns & Key Details

```typescript
// TagInput component with Floating UI
import { useFloating, autoUpdate, flip, shift, size, offset } from '@floating-ui/react'
import { useTagSuggestions } from '../hooks/useTagSuggestions'

export function TagInput({ value, onChange, maxTags = 10 }: TagInputProps) {
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const { suggestions, isLoading } = useTagSuggestions(input)
  
  // PATTERN: Floating UI setup (follow AutoCompleteDropdown pattern)
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ fallbackPlacements: ['top-start'] }),
      shift({ padding: 8 }),
      size({
        apply({ availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.min(availableHeight, 300)}px`
          })
        }
      })
    ]
  })
  
  // PATTERN: Keyboard navigation (arrow keys, enter, escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      addTag(suggestions[selectedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
    // ... arrow key handling
  }
  
  // GOTCHA: Handle comma-separated bulk entry
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val.includes(',')) {
      const tags = val.split(',').map(t => t.trim()).filter(Boolean)
      tags.forEach(tag => addTag({ name: tag } as Tag))
      setInput('')
    } else {
      setInput(val)
    }
  }
  
  return (
    <div className="tag-input-container">
      <div className="tag-pills">
        {value.map(tag => (
          <TagPill
            key={tag.id}
            tag={tag}
            onRemove={() => removeTag(tag.id)}
          />
        ))}
      </div>
      
      <input
        ref={refs.setReference}
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder="Add tags..."
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-autocomplete="list"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="tag-suggestions"
          role="listbox"
        >
          {suggestions.map((suggestion, idx) => (
            <div
              key={suggestion.tag.id}
              role="option"
              aria-selected={idx === selectedIndex}
              onClick={() => addTag(suggestion.tag)}
            >
              {suggestion.tag.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Tag service with caching
class TagService {
  private cache = new Map<string, { data: any, timestamp: number }>()
  private cacheTTL = 5 * 60 * 1000 // 5 minutes
  
  async getSuggestions(query: string): Promise<TagSuggestion[]> {
    const cacheKey = `suggestions:${query}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    
    // PATTERN: Parallel queries for better performance
    const [exact, fuzzy, synonyms] = await Promise.all([
      this.searchExact(query),
      this.searchFuzzy(query),
      this.searchSynonyms(query)
    ])
    
    // Combine and deduplicate results
    const combined = [...exact, ...fuzzy, ...synonyms]
      .filter((v, i, a) => a.findIndex(t => t.tag.id === v.tag.id) === i)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
    
    this.setCache(cacheKey, combined)
    return combined
  }
  
  // GOTCHA: Clear cache after mutations
  async createTag(data: CreateTagInput): Promise<Tag> {
    this.clearCache() // Clear all cache entries
    
    const { data: tag, error } = await supabase
      .from('tags')
      .insert({
        name: data.name,
        normalized_name: data.name.toLowerCase().replace(/\s+/g, '-'),
        category: data.category,
        color: data.color
      })
      .select()
      .single()
    
    if (error) throw new APIError(error.message)
    return tag
  }
}

// React 19 optimistic updates for tags
export function useTagMutations() {
  const [isPending, startTransition] = useTransition()
  const [optimisticTags, addOptimistic] = useOptimistic(
    initialTags,
    (state, action) => {
      // Handle optimistic state updates
    }
  )
  
  const addTag = useCallback(async (tag: Tag) => {
    // CRITICAL: Must wrap in startTransition
    startTransition(() => {
      addOptimistic({ type: 'add', payload: tag })
    })
    
    try {
      const created = await tagService.createTag(tag)
      // Replace optimistic with real
      startTransition(() => {
        addOptimistic({ type: 'replace', payload: created })
      })
    } catch (error) {
      // Rollback optimistic on error
      startTransition(() => {
        addOptimistic({ type: 'remove', payload: tag.id })
      })
      throw error
    }
  }, [])
}
```

### Integration Points

```yaml
DATABASE:
  - migration: "supabase/migrations/20250123_add_tags_system.sql"
  - rls: "CREATE POLICY tags_public_read ON tags FOR SELECT USING (true)"
  - rls: "CREATE POLICY tags_auth_write ON tags FOR INSERT TO authenticated USING (true)"
  - rls: "CREATE POLICY tags_admin_all ON tags FOR ALL TO authenticated USING (auth.jwt()->>'role' = 'admin')"

TYPES:
  - update: "src/lib/database.types.ts"
  - generate: "npx supabase gen types typescript --local > src/lib/database.types.ts"

ROUTING:
  - add to: "src/app/App.tsx"
  - admin route: "<Route path='/admin/tags' element={<ProtectedRoute><TagManager /></ProtectedRoute>} />"

FORMS:
  - update: "src/features/songs/components/SongManagementForm.tsx"
  - replace: "Theme input section with <TagInput value={tags} onChange={setTags} />"
  
SEARCH:
  - enhance: "src/features/search/components/SearchFilters.tsx"
  - add: "Tag filter chips and arrangement metadata filters"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint                         # ESLint check
npm run build                        # TypeScript compilation

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test tag components
npm run test -- src/features/tags/components/TagInput.test.tsx
npm run test -- src/features/tags/components/TagPill.test.tsx
npm run test -- src/features/tags/hooks/useTagSuggestions.test.ts
npm run test -- src/features/tags/services/tagService.test.ts

# Test form integration
npm run test -- src/features/songs/components/SongManagementForm.test.tsx

# Full test suite for tag feature
npm run test -- src/features/tags

# Coverage validation
npm run test:coverage -- src/features/tags

# Expected: All tests pass, >80% coverage
```

### Level 3: Integration Testing (System Validation)

```bash
# Start development server
npm run dev &
sleep 5

# Verify server is running
curl -f http://localhost:5173 || echo "Dev server not responding"

# Database migration validation
npx supabase migration up --local
npx supabase db query "SELECT COUNT(*) FROM tags" --local

# Manual testing checklist:
# 1. Navigate to song creation form
# 2. Type "chr" in tag input - verify autocomplete shows
# 3. Select "christmas" tag - verify pill appears
# 4. Type "worship, praise" - verify bulk add works
# 5. Click X on tag pill - verify removal
# 6. Test keyboard navigation (arrows, enter, escape)
# 7. Test on mobile device/responsive view
# 8. Navigate to admin panel (if admin)
# 9. View tag list with usage counts
# 10. Test tag merge functionality

# Expected: All features working, <100ms autocomplete response
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Accessibility testing
# Use axe DevTools browser extension
# Expected: No WCAG violations

# Mobile testing
# Chrome DevTools -> Device Toolbar
# Test on iPhone SE, iPad, Pixel 5
# Verify 44px touch targets, no zoom on focus

# Performance testing
# Chrome DevTools -> Performance tab
# Measure tag input interaction
# Expected: <100ms autocomplete, <16ms frame time

# Cross-browser testing
# Test in Chrome, Firefox, Safari
# Verify autocomplete positioning, keyboard nav

# Tag quality validation
npm run test -- src/features/tags/validation/tagSchemas.test.ts
# Test normalization, duplicate detection

# Search enhancement validation
# Search for "christmas" 
# Apply filters: key=G, difficulty<=3
# Verify real-time result updates

# Admin functionality (if applicable)
# Login as admin
# Navigate to /admin/tags
# Test merge, promote, delete operations

# Expected: All validations pass, performance targets met
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run build`
- [ ] TypeScript strict mode compliance
- [ ] Database migrations applied successfully
- [ ] Types regenerated after migration

### Feature Validation

- [ ] Tag entry completed in < 5 seconds
- [ ] Autocomplete responds in < 100ms
- [ ] Comma-separated bulk entry works
- [ ] Tag pills display with colors and remove buttons
- [ ] Quick picks show popular tags
- [ ] Arrangement metadata form has all fields
- [ ] Admin can view and manage tags
- [ ] Search supports tag and metadata filtering
- [ ] Mobile interface has 44px touch targets
- [ ] Keyboard navigation fully functional
- [ ] Screen reader announces tag operations

### Code Quality Validation

- [ ] Follows AutoCompleteDropdown pattern for dropdowns
- [ ] Uses songService pattern for services
- [ ] Implements React 19 optimistic updates correctly
- [ ] All components have proper TypeScript types
- [ ] Accessibility follows ARIA combobox pattern
- [ ] CSS uses theme variables consistently
- [ ] Error handling matches existing patterns
- [ ] Caching strategy implemented for performance

### Documentation & Deployment

- [ ] Component props documented with TypeScript
- [ ] Service methods have clear return types
- [ ] Database schema documented in migration
- [ ] Admin features documented for operators

---

## Anti-Patterns to Avoid

- ❌ Don't create new autocomplete pattern - use AutoCompleteDropdown reference
- ❌ Don't skip Floating UI middleware ordering - flip() before shift()
- ❌ Don't forget useTransition with useOptimistic
- ❌ Don't hardcode colors - use theme variables
- ❌ Don't skip mobile keyboard detection
- ❌ Don't ignore ARIA attributes for accessibility
- ❌ Don't mix tag systems - keep song/arrangement separation
- ❌ Don't forget to clear cache after mutations
- ❌ Don't skip RLS policies on new tables
- ❌ Don't use .then() chains - use async/await