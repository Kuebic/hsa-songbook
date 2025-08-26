name: "Tag System Stage 4 - Faceted Search and Filtering"
description: |

---

## Goal

**Feature Goal**: Implement faceted search system that combines tag-based filtering for songs with structured metadata filtering for arrangements, providing real-time result updates and facet counts

**Deliverable**: Enhanced search page with faceted filters, search API endpoints with aggregation, filter UI components, and optimized database queries

**Success Definition**: Users can search and filter songs by tags and arrangement properties with < 500ms response time, seeing real-time facet counts and result updates

## User Persona (if applicable)

**Target User**: Worship leaders and musicians searching for appropriate songs and arrangements

**Use Case**: Find songs by theme (e.g., "communion") filtered by practical criteria (key, difficulty, instrumentation)

**User Journey**:
1. User enters search term or browses
2. Applies tag filters (themes, occasions)
3. Refines by arrangement criteria (key, difficulty)
4. Sees real-time result counts
5. Finds suitable songs quickly

**Pain Points Addressed**:
- Can't filter by multiple criteria simultaneously
- No visibility into available filter options
- Slow search with many filters
- Poor mobile filter experience

## Why

- **Discovery**: Help users find songs matching multiple criteria
- **Efficiency**: Reduce time to find appropriate songs from minutes to seconds
- **Transparency**: Show available options with counts before filtering
- **Performance**: Optimized queries for sub-second responses
- **Mobile**: Responsive filter UI for all devices

## What

Faceted search system with tag-based song filtering, arrangement metadata filtering, real-time facet counts, responsive filter UI, and optimized search queries.

### Success Criteria

- [ ] Search results return in < 500ms with filters
- [ ] Facet counts update in real-time
- [ ] Tag filters work with multi-select
- [ ] Arrangement filters (key, difficulty) functional
- [ ] Mobile-responsive filter UI
- [ ] URL state management for shareable searches
- [ ] Clear filter indicators and reset options
- [ ] Pagination works with filters

## All Needed Context

### Context Completeness Check

_This PRP contains search implementation patterns, faceted filtering strategies, database optimization techniques, and UI component patterns for building the complete search system._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/features/search/components/SearchPage.tsx
  why: Current search implementation to enhance
  pattern: Search state management, result display
  gotcha: Currently text-only search, needs facet integration

- file: src/features/search/hooks/useSearch.ts
  why: Search hook to extend with filtering
  pattern: Query composition, debouncing
  gotcha: Must maintain backward compatibility

- file: src/features/songs/services/songService.ts
  why: Service layer for database queries
  pattern: Query building, response mapping
  gotcha: Snake_case to camelCase conversion

- docfile: PRPs/ai_docs/fuse-js-implementation-guide.md
  why: Current search implementation details
  section: Search indexing and fuzzy matching

- file: src/shared/components/ui/Checkbox.tsx
  why: Checkbox component for filter UI
  pattern: ShadCN component usage
  gotcha: Must maintain consistent styling

- url: https://tanstack.com/table/latest/docs/framework/react/examples/filters-faceted
  why: TanStack Table faceted filtering patterns
  critical: Facet calculation and state management

- url: https://www.algolia.com/doc/guides/building-search-ui/ui-and-ux-patterns/facet-display/js/
  why: Faceted search UX best practices
  critical: Filter ordering, count display, interaction patterns

- file: src/app/pages/SearchPage.tsx
  why: Main search page to modify
  pattern: Page layout, routing
  gotcha: Must integrate with existing layout
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase

```bash
src/
├── features/
│   ├── tags/                    # From previous stages
│   ├── search/
│   │   ├── components/
│   │   │   └── SearchPage.tsx
│   │   ├── hooks/
│   │   │   └── useSearch.ts
│   │   └── services/
│   │       └── searchService.ts
│   └── songs/
│       └── services/
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
src/
├── features/
│   ├── search/
│   │   ├── components/
│   │   │   ├── SearchPage.tsx                 # MODIFY: Add faceted filters
│   │   │   ├── filters/
│   │   │   │   ├── FilterSidebar.tsx          # NEW: Main filter container
│   │   │   │   ├── TagFilter.tsx              # NEW: Tag multi-select filter
│   │   │   │   ├── MetadataFilter.tsx         # NEW: Arrangement metadata filters
│   │   │   │   ├── ActiveFilters.tsx          # NEW: Selected filter display
│   │   │   │   ├── FilterSidebar.module.css   # NEW: Filter styles
│   │   │   │   └── MobileFilterDrawer.tsx     # NEW: Mobile filter UI
│   │   │   └── results/
│   │   │       ├── SearchResults.tsx          # MODIFY: Enhanced result display
│   │   │       └── ResultCard.tsx             # MODIFY: Show tags and metadata
│   │   ├── hooks/
│   │   │   ├── useSearch.ts                   # MODIFY: Add filter support
│   │   │   ├── useFacets.ts                   # NEW: Facet calculation hook
│   │   │   ├── useFilters.ts                  # NEW: Filter state management
│   │   │   └── useUrlState.ts                 # NEW: URL state sync
│   │   ├── services/
│   │   │   ├── searchService.ts               # MODIFY: Add faceted search
│   │   │   └── facetService.ts                # NEW: Facet aggregation
│   │   ├── types/
│   │   │   └── search.types.ts                # NEW: Search and filter types
│   │   └── utils/
│   │       ├── filterUtils.ts                 # NEW: Filter helpers
│   │       └── urlUtils.ts                    # NEW: URL state utilities
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Supabase doesn't support facet aggregation natively
// Must implement client-side or use PostgreSQL functions

// CRITICAL: URL state must be shareable
// Encode filters in URL for bookmark/share functionality

// CRITICAL: Mobile needs different UI pattern
// Use drawer/modal for filters on mobile

// CRITICAL: Performance with many filters
// Implement query optimization and caching

// CRITICAL: Facet counts need real-time updates
// Recalculate when filters change

// CRITICAL: React Query cache management
// Properly invalidate when filters change
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/features/search/types/search.types.ts
export interface SearchFilters {
  query?: string
  tags?: string[]  // Tag IDs
  keys?: MusicalKey[]
  difficulty?: { min: number; max: number }
  instrumentation?: Instrument[]
  styles?: ArrangementStyle[]
  hasChords?: boolean
}

export interface FacetCount {
  value: string | number
  count: number
  label?: string
}

export interface SearchFacets {
  tags: FacetCount[]
  keys: FacetCount[]
  difficulties: FacetCount[]
  instrumentation: FacetCount[]
  styles: FacetCount[]
}

export interface SearchRequest {
  filters: SearchFilters
  pagination: {
    page: number
    limit: number
  }
  sort?: {
    field: 'relevance' | 'title' | 'created_at' | 'rating'
    direction: 'asc' | 'desc'
  }
}

export interface SearchResponse {
  results: SearchResult[]
  facets: SearchFacets
  total: number
  page: number
  totalPages: number
}

export interface SearchResult {
  song: Song & { tags: Tag[] }
  arrangements: ArrangementWithMetadata[]
  relevanceScore?: number
  highlights?: {
    title?: string
    artist?: string
    lyrics?: string
  }
}

// Filter component props
export interface FilterSidebarProps {
  filters: SearchFilters
  facets: SearchFacets
  onFiltersChange: (filters: SearchFilters) => void
  isLoading?: boolean
  className?: string
}

export interface TagFilterProps {
  selectedTags: string[]
  availableTags: FacetCount[]
  onChange: (tags: string[]) => void
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/features/search/types/search.types.ts
  - IMPLEMENT: All search, filter, and facet type definitions
  - INCLUDE: Request/response types, component props
  - FOLLOW: Existing type patterns in codebase
  - PLACEMENT: Search types directory

Task 2: CREATE src/features/search/utils/filterUtils.ts
  - IMPLEMENT: Filter serialization, parsing, validation
  - METHODS: buildFilterQuery(), parseUrlFilters(), validateFilters()
  - INCLUDE: Filter combination logic
  - PLACEMENT: Search utils directory

Task 3: CREATE src/features/search/services/facetService.ts
  - IMPLEMENT: Facet aggregation service
  - METHODS: calculateFacets(), updateFacetCounts()
  - OPTIMIZE: Use database aggregation where possible
  - CACHE: Facet results for performance
  - PLACEMENT: Search services directory

Task 4: UPDATE src/features/search/services/searchService.ts
  - ADD: Faceted search method
  - IMPLEMENT: Filter query building
  - OPTIMIZE: Database queries with proper indexes
  - INCLUDE: Result highlighting
  - PLACEMENT: Existing search service

Task 5: CREATE src/features/search/hooks/useFilters.ts
  - IMPLEMENT: Filter state management hook
  - INCLUDE: Add/remove filters, reset, validation
  - PATTERN: Controlled state with onChange callbacks
  - PLACEMENT: Search hooks directory

Task 6: CREATE src/features/search/hooks/useFacets.ts
  - IMPLEMENT: Facet calculation and caching
  - USE: React Query for data fetching
  - INCLUDE: Real-time updates on filter change
  - PLACEMENT: Search hooks directory

Task 7: CREATE src/features/search/hooks/useUrlState.ts
  - IMPLEMENT: URL synchronization for filters
  - USE: React Router hooks
  - INCLUDE: Debounced URL updates
  - PLACEMENT: Search hooks directory

Task 8: CREATE src/features/search/components/filters/TagFilter.tsx
  - IMPLEMENT: Multi-select tag filter with counts
  - USE: Checkbox component from ShadCN
  - INCLUDE: Search within tags, select all
  - STYLE: Scrollable list with max height
  - PLACEMENT: Filters subdirectory

Task 9: CREATE src/features/search/components/filters/MetadataFilter.tsx
  - IMPLEMENT: Arrangement metadata filters
  - INCLUDE: Key selector, difficulty range, instrumentation
  - USE: Appropriate ShadCN components
  - PLACEMENT: Filters subdirectory

Task 10: CREATE src/features/search/components/filters/FilterSidebar.tsx
  - IMPLEMENT: Container for all filters
  - COMPOSE: TagFilter and MetadataFilter
  - INCLUDE: Clear all, collapse sections
  - RESPONSIVE: Hidden on mobile, shown on desktop
  - PLACEMENT: Filters subdirectory

Task 11: CREATE src/features/search/components/filters/MobileFilterDrawer.tsx
  - IMPLEMENT: Mobile-specific filter UI
  - USE: Drawer/modal pattern
  - INCLUDE: Apply/cancel buttons
  - OPTIMIZE: Touch interactions
  - PLACEMENT: Filters subdirectory

Task 12: CREATE src/features/search/components/filters/ActiveFilters.tsx
  - IMPLEMENT: Pills showing active filters
  - INCLUDE: Remove individual filters
  - SHOW: Filter count when collapsed
  - PLACEMENT: Filters subdirectory

Task 13: UPDATE src/features/search/components/SearchPage.tsx
  - INTEGRATE: All filter components
  - ADD: Responsive layout with sidebar
  - UPDATE: Search results with facets
  - IMPLEMENT: Loading and empty states
  - PLACEMENT: Existing search page

Task 14: UPDATE src/features/search/hooks/useSearch.ts
  - MODIFY: Accept filters parameter
  - INTEGRATE: Facet service
  - UPDATE: Cache key strategy
  - PLACEMENT: Existing hook

Task 15: CREATE comprehensive tests
  - TEST: Filter logic and combinations
  - TEST: Facet calculations
  - TEST: URL state synchronization
  - TEST: Component interactions
  - PLACEMENT: Alongside components
```

### Implementation Patterns & Key Details

```typescript
// Faceted search service implementation
class SearchService {
  async searchWithFacets(request: SearchRequest): Promise<SearchResponse> {
    const { filters, pagination } = request;
    
    // PATTERN: Build complex query with filters
    let query = this.supabase
      .from('songs')
      .select(`
        *,
        song_tags!inner(tag_id),
        tags:song_tags(tag:tags(*)),
        arrangements(*)
      `);
    
    // Apply text search
    if (filters.query) {
      query = query.or(`title.ilike.%${filters.query}%, artist.ilike.%${filters.query}%`);
    }
    
    // Apply tag filters (many-to-many)
    if (filters.tags?.length) {
      query = query.in('song_tags.tag_id', filters.tags);
    }
    
    // Apply arrangement filters (nested)
    if (filters.keys?.length) {
      query = query.contains('arrangements.key', filters.keys);
    }
    
    // CRITICAL: Calculate facets separately for performance
    const facets = await this.calculateFacets(filters);
    
    // Pagination
    const start = (pagination.page - 1) * pagination.limit;
    query = query.range(start, start + pagination.limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw new DatabaseError('Search failed', error);
    
    return {
      results: this.mapResults(data),
      facets,
      total: count || 0,
      page: pagination.page,
      totalPages: Math.ceil((count || 0) / pagination.limit)
    };
  }
  
  private async calculateFacets(currentFilters: SearchFilters): Promise<SearchFacets> {
    // PATTERN: Parallel facet calculation
    const [tags, keys, difficulties] = await Promise.all([
      this.getTagFacets(currentFilters),
      this.getKeyFacets(currentFilters),
      this.getDifficultyFacets(currentFilters)
    ]);
    
    return { tags, keys, difficulties };
  }
}

// Filter state management hook
export function useFilters(initialFilters?: SearchFilters) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {});
  
  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  const removeFilter = useCallback((key: keyof SearchFilters) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);
  
  const hasActiveFilters = Object.keys(filters).length > 0;
  
  return {
    filters,
    updateFilter,
    removeFilter,
    clearFilters,
    hasActiveFilters
  };
}

// URL state synchronization
export function useUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filters = useMemo(() => {
    return parseUrlFilters(searchParams);
  }, [searchParams]);
  
  const updateUrl = useCallback((newFilters: SearchFilters) => {
    const params = new URLSearchParams();
    
    // Serialize filters to URL
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.tags?.length) params.set('tags', newFilters.tags.join(','));
    if (newFilters.keys?.length) params.set('keys', newFilters.keys.join(','));
    // ... other filters
    
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);
  
  // Debounce URL updates
  const debouncedUpdateUrl = useMemo(
    () => debounce(updateUrl, 500),
    [updateUrl]
  );
  
  return { filters, updateUrl: debouncedUpdateUrl };
}

// Tag filter component with facet counts
export function TagFilter({ selectedTags, availableTags, onChange }: TagFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTags = useMemo(() => {
    if (!searchTerm) return availableTags;
    return availableTags.filter(tag => 
      tag.label?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableTags, searchTerm]);
  
  return (
    <div className={styles.tagFilter}>
      <div className={styles.header}>
        <h3>Themes & Occasions</h3>
        <button 
          onClick={() => onChange([])}
          disabled={selectedTags.length === 0}
        >
          Clear
        </button>
      </div>
      
      <input
        type="text"
        placeholder="Search tags..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className={styles.searchInput}
      />
      
      <div className={styles.tagList}>
        {filteredTags.map(facet => (
          <label key={facet.value} className={styles.tagOption}>
            <Checkbox
              checked={selectedTags.includes(facet.value as string)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onChange([...selectedTags, facet.value as string]);
                } else {
                  onChange(selectedTags.filter(t => t !== facet.value));
                }
              }}
            />
            <span className={styles.tagLabel}>
              {facet.label}
              <span className={styles.count}>({facet.count})</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Mobile filter drawer
export function MobileFilterDrawer({ isOpen, onClose, ...filterProps }: MobileFilterDrawerProps) {
  const [tempFilters, setTempFilters] = useState(filterProps.filters);
  
  const handleApply = () => {
    filterProps.onFiltersChange(tempFilters);
    onClose();
  };
  
  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerHeader>
        
        <div className={styles.drawerBody}>
          <FilterSidebar
            {...filterProps}
            filters={tempFilters}
            onFiltersChange={setTempFilters}
          />
        </div>
        
        <DrawerFooter>
          <Button onClick={handleApply}>Apply Filters</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Enhanced search page with facets
export function SearchPage() {
  const { filters, updateUrl } = useUrlState();
  const { filters: filterState, updateFilter, clearFilters } = useFilters(filters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Sync filter state with URL
  useEffect(() => {
    updateUrl(filterState);
  }, [filterState, updateUrl]);
  
  // Fetch search results with facets
  const { data, isLoading } = useSearch({
    filters: filterState,
    pagination: { page: 1, limit: 20 }
  });
  
  return (
    <div className={styles.searchPage}>
      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>
        <FilterSidebar
          filters={filterState}
          facets={data?.facets || {}}
          onFiltersChange={(newFilters) => {
            Object.entries(newFilters).forEach(([key, value]) => {
              updateFilter(key as keyof SearchFilters, value);
            });
          }}
        />
      </aside>
      
      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.header}>
          <SearchInput 
            value={filterState.query || ''}
            onChange={value => updateFilter('query', value)}
          />
          
          {/* Mobile filter button */}
          <Button
            className={styles.mobileFilterBtn}
            onClick={() => setShowMobileFilters(true)}
          >
            Filters {filterState.hasActiveFilters && `(${activeFilterCount})`}
          </Button>
        </div>
        
        <ActiveFilters
          filters={filterState}
          onRemove={(key) => removeFilter(key)}
          onClear={clearFilters}
        />
        
        <SearchResults
          results={data?.results || []}
          isLoading={isLoading}
          total={data?.total || 0}
        />
      </main>
      
      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        filters={filterState}
        facets={data?.facets || {}}
        onFiltersChange={updateFilter}
      />
    </div>
  );
}
```

### Integration Points

```yaml
DEPENDENCIES:
  - types: "Tag types from Stage 1"
  - service: "Tag service from Stage 1"
  - database: "Tag relationships from Stage 1"

UI_COMPONENTS:
  - use: "ShadCN Checkbox, Button, Drawer components"
  - style: "CSS modules with theme variables"

PERFORMANCE:
  - cache: "Facet calculations with React Query"
  - optimize: "Database queries with proper indexes"
  - debounce: "URL updates and search requests"

ROUTING:
  - integrate: "React Router for URL state"
  - pattern: "Shareable filter URLs"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After each component creation
npm run lint
npm run build

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test filter components
npm run test -- src/features/search/components/filters/

# Test hooks
npm run test -- src/features/search/hooks/

# Test services
npm run test -- src/features/search/services/

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Start dev server
npm run dev

# Test search with filters:
# 1. Search for "grace"
# 2. Filter by "Christmas" tag
# 3. Filter by key "G"
# 4. Verify results update
# 5. Check facet counts

# Test URL state:
# 1. Apply filters
# 2. Copy URL
# 3. Open in new tab
# 4. Verify filters restored

# Test mobile:
# 1. Open on mobile size
# 2. Open filter drawer
# 3. Apply filters
# 4. Verify UI responsive

# Performance test:
# Open Network tab
# Apply multiple filters
# Verify < 500ms response

# Expected: All features work, performance targets met
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Facet accuracy test:
# Apply tag filter
# Verify counts for other facets update correctly
# Remove filter
# Verify counts restore

# Complex filter combinations:
# Tag: "Christmas" + Key: "G" + Difficulty: 1-3
# Verify results match all criteria
# Check no false positives

# Performance with many filters:
# Apply 5+ different filters
# Measure total query time
# Should remain < 500ms

# Mobile usability:
# Test on actual devices
# Verify drawer smooth
# Check touch targets adequate
# Test landscape orientation

# URL edge cases:
# Invalid filter values in URL
# Very long URL with many filters
# Special characters in search query

# Expected: Robust handling of all scenarios
```

## Final Validation Checklist

### Technical Validation

- [ ] All validation levels pass
- [ ] Search returns in < 500ms
- [ ] Facet counts accurate
- [ ] URL state works correctly
- [ ] Mobile UI responsive

### Feature Validation

- [ ] Tag filters functional
- [ ] Metadata filters working
- [ ] Facet counts update dynamically
- [ ] Active filters display correctly
- [ ] Clear/reset functionality works
- [ ] Pagination with filters works

### Code Quality Validation

- [ ] Follows existing patterns
- [ ] Proper error handling
- [ ] Performance optimized
- [ ] Accessibility considered
- [ ] Tests comprehensive

### Documentation & Deployment

- [ ] API documentation updated
- [ ] Filter URL format documented
- [ ] Performance benchmarks recorded
- [ ] Mobile testing completed

---

## Anti-Patterns to Avoid

- ❌ Don't fetch all data then filter client-side
- ❌ Don't forget to debounce search/filter inputs
- ❌ Don't ignore mobile experience
- ❌ Don't create separate mobile/desktop codepaths
- ❌ Don't forget URL state management
- ❌ Don't skip accessibility on filters
- ❌ Don't hardcode filter options
- ❌ Don't ignore performance with many filters