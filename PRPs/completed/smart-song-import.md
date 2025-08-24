name: "Smart Song Import with Auto-Fill - TypeScript Implementation PRP"
description: |
  Comprehensive implementation guide for smart song import feature with fuzzy search duplicate detection,
  community database integration, and auto-fill capabilities following HSA Songbook's vertical slice architecture

---

## Goal

**Feature Goal**: Implement a smart song import system that prevents duplicates through fuzzy search, auto-fills metadata from community databases, and provides seamless import from multiple formats

**Deliverable**: Complete vertical slice including fuzzy search component, import services, API endpoints, and UI components with full TypeScript type safety

**Success Definition**: Users can add songs 80% faster with automatic duplicate detection achieving 95% accuracy and auto-fill working for 70% of songs from community databases

## User Persona

**Target User**: Worship leaders and church administrators adding songs to their library

**Use Case**: Adding new songs from various sources (CCLI numbers, OpenSong files, manual entry) while avoiding duplicates

**User Journey**: 
1. User clicks "Add Song" → Types title/CCLI
2. System shows fuzzy matches if duplicates exist
3. If new, auto-fills from community DB
4. User reviews and saves

**Pain Points Addressed**: 
- Manual data entry taking 10-15 minutes per song
- Duplicate songs cluttering the library
- Incomplete metadata requiring research

## Why

- **Business Value**: Reduces song entry time by 80%, improves data quality and consistency
- **Integration**: Enhances existing song management with intelligent automation
- **Problems Solved**: Eliminates duplicates, reduces manual work, leverages community data

## What

Smart import system with three-tier approach:
1. Real-time fuzzy search showing existing songs as user types (< 200ms)
2. CCLI lookup and community database integration for auto-fill
3. Multi-format import support (OpenSong XML, ChordPro, CSV)

### Success Criteria

- [ ] Fuzzy search activates after 3 characters with < 200ms response
- [ ] Duplicate detection accuracy > 95%
- [ ] Auto-fill success rate > 70% for known songs
- [ ] Support for OpenSong XML import with format conversion
- [ ] Batch import for multiple files with progress tracking

## All Needed Context

### Context Completeness Check

_"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_ ✓ YES

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://fusejs.io/api/options.html
  why: Fuse.js configuration for fuzzy search implementation
  critical: Threshold tuning (0.3-0.4), includeMatches for highlighting

- url: https://github.com/NaturalIntelligence/fast-xml-parser#usage
  why: XML parsing for OpenSong format with TypeScript
  critical: XMLValidator for validation, parsing options for preserving structure

- file: /src/features/search/hooks/useSearch.ts
  why: Existing search patterns with debouncing and state management
  pattern: Debounced search hook with loading states
  gotcha: 300ms debounce for search, handle cleanup on unmount

- file: /src/features/arrangements/components/ChordProEditor/utils/fuzzyMatch.ts
  why: Sophisticated fuzzy matching implementation already in codebase
  pattern: Multi-tier matching (exact → prefix → fuzzy → Levenshtein)
  gotcha: MaxLevenshteinDistance of 3 for typo tolerance

- file: /src/features/arrangements/components/ChordProEditor/components/AutoCompleteDropdown/index.tsx
  why: Production autocomplete dropdown with Floating UI
  pattern: Portal rendering, keyboard navigation, mobile optimization
  gotcha: Virtual keyboard detection, z-index stacking with FloatingPortal

- file: /src/features/songs/services/songService.ts
  why: Song service patterns for API calls and caching
  pattern: Request deduplication, 30-second cache TTL, error handling
  gotcha: Custom error classes (APIError, NetworkError, NotFoundError)

- file: /src/features/songs/types/song.types.ts
  why: Complete TypeScript interfaces for Song and Arrangement
  pattern: Metadata structure, theme normalization
  gotcha: Themes are lowercase normalized arrays

- file: /server/features/songs/song.validation.ts
  why: Zod schemas for validation
  pattern: Transform functions for query params, regex for MongoDB IDs
  gotcha: String to number transforms for pagination

- docfile: PRPs/ai_docs/fuse-js-implementation-guide.md
  why: Comprehensive Fuse.js patterns for TypeScript/React
  section: React Hook Pattern, Highlighting Matches

- docfile: PRPs/ai_docs/opensong-xml-parsing-guide.md
  why: OpenSong XML format specification and parsing
  section: Parser Implementation, Type Definitions
```

### Current Codebase tree

```bash
src/
├── features/
│   ├── songs/              # Existing song management
│   │   ├── types/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── search/             # Basic search implementation
│   │   ├── components/
│   │   └── hooks/
│   └── arrangements/       # Has fuzzy match utils
│       └── components/
│           └── ChordProEditor/
│               └── utils/fuzzyMatch.ts
└── shared/
    ├── components/         # Reusable UI components
    ├── validation/         # Zod schemas and utils
    └── types/             # Shared TypeScript types

server/
├── features/
│   ├── songs/             # Song API endpoints
│   └── arrangements/      # Arrangement endpoints
└── shared/
    ├── middleware/        # Auth, validation middleware
    └── services/          # Compression service
```

### Vertical Slice Architecture Analysis

**Existing Feature Slices**:
```yaml
src/features/songs/:         # Song management slice
  - types/song.types.ts      # Song, Arrangement, SongFilter interfaces
  - components/              # SongCard, SongList, forms
  - hooks/                  # useSongs, useSongMutations
  - services/               # songService with caching
  - pages/                  # SongListPage, SongDetailPage

src/features/search/:        # Search slice (minimal)
  - components/SearchBar.tsx
  - hooks/useSearch.ts
```

**Feature Boundary Definition**:
- **This Slice Owns**: Song import, duplicate detection, community DB integration, format conversion
- **Dependencies On Other Slices**: 
  - `songs/types` for Song interface
  - `songs/services` for song creation
  - `shared/components/ui` for UI primitives
- **Shared/Common Code**: Validation utils, error handling, UI components
- **Slice Isolation**: Import logic self-contained, only exports public API

### Desired Codebase tree with files to be added

```bash
src/features/import/        # New import feature slice
├── types/
│   ├── import.types.ts     # ImportResult, ImportProgress, ImportSource
│   └── fuzzy.types.ts      # FuzzySearchResult, SearchOptions
├── components/
│   ├── SmartImportModal.tsx           # Main import modal
│   ├── FuzzySearchDropdown.tsx        # Duplicate detection dropdown
│   ├── ImportProgressBar.tsx          # Batch import progress
│   ├── AutoFillNotification.tsx       # Auto-fill feedback
│   └── __tests__/
├── hooks/
│   ├── useFuzzySearch.ts              # Fuse.js integration hook
│   ├── useAutoFill.ts                 # CCLI/community DB lookup
│   ├── useBulkImport.ts               # Batch import with progress
│   └── __tests__/
├── services/
│   ├── fuzzySearchService.ts          # Fuse.js wrapper service
│   ├── communityDbService.ts          # External DB integration
│   ├── openSongParser.ts              # XML parsing service
│   ├── importService.ts               # Main import orchestration
│   └── metadataCache.ts               # IndexedDB caching
├── utils/
│   ├── formatConverters.ts            # OpenSong → ChordPro conversion
│   └── importValidation.ts            # Import data validation
├── pages/
│   └── ImportPage.tsx                 # Standalone import page
└── index.ts                           # Public API exports

server/features/import/     # Server-side import endpoints
├── import.routes.ts        # API routes
├── import.controller.ts    # Request handlers
├── import.service.ts       # Business logic
└── import.validation.ts    # Zod schemas
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Fuse.js threshold - lower = stricter matching
// 0.0 = exact match only, 1.0 = match anything
// Sweet spot for song titles: 0.3-0.4

// CRITICAL: Floating UI requires portal for proper z-index
// Use FloatingPortal component, not React Portal directly

// CRITICAL: fast-xml-parser requires explicit trim option
// Without trimValues: true, whitespace breaks parsing

// CRITICAL: IndexedDB operations are async
// Always use try-catch and provide fallbacks

// CRITICAL: MongoDB text search requires index
// Ensure songs collection has text index on title, artist

// CRITICAL: TypeScript strict mode enforced
// No implicit any, all functions need return types
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/features/import/types/import.types.ts
export interface ImportSource {
  type: 'manual' | 'ccli' | 'worshipleader' | 'opensong' | 'hymnary';
  id?: string;
  confidence: number; // 0-1 reliability score
}

export interface ImportResult {
  success: boolean;
  songId?: string;
  source?: ImportSource;
  error?: string;
  duplicates?: FuzzySearchResult[];
}

export interface ImportProgress {
  current: number;
  total: number;
  fileName?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface CommunityMetadata {
  title: string;
  artist?: string;
  ccli?: string;
  year?: number;
  themes?: string[];
  chordProContent?: string;
  source: ImportSource;
}

// src/features/import/types/fuzzy.types.ts
export interface FuzzySearchResult {
  id: string;
  title: string;
  artist?: string;
  score: number; // 0-1 confidence
  matches?: Array<{
    indices: ReadonlyArray<readonly [number, number]>;
    key: string;
    value: string;
  }>;
}

export interface FuzzySearchOptions {
  threshold?: number;
  limit?: number;
  keys?: string[];
  includeMatches?: boolean;
}

// Zod schemas for validation
export const importSongSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().optional(),
  ccli: z.string().regex(/^\d{5,8}$/).optional(),
  format: z.enum(['chordpro', 'opensong', 'text']),
  content: z.string(),
  overwriteDuplicate: z.boolean().default(false)
});
```

### Implementation Tasks (ordered by vertical slice completion)

```yaml
Task 1: CREATE src/features/import/types/import.types.ts and fuzzy.types.ts
  - IMPLEMENT: Complete TypeScript interfaces for import feature
  - FOLLOW pattern: src/features/songs/types/song.types.ts (interface structure)
  - INCLUDE: ImportSource, ImportResult, ImportProgress, FuzzySearchResult
  - NAMING: Use existing conventions (PascalCase interfaces, camelCase properties)
  - PLACEMENT: Within import feature types directory

Task 2: CREATE src/features/import/services/fuzzySearchService.ts
  - IMPLEMENT: Fuse.js wrapper with TypeScript generics
  - FOLLOW pattern: PRPs/ai_docs/fuse-js-implementation-guide.md
  - CONFIG: threshold: 0.35, includeMatches: true, keys: ['title', 'artist']
  - DEPENDENCIES: npm install fuse.js
  - PLACEMENT: Within import services directory

Task 3: CREATE src/features/import/services/openSongParser.ts
  - IMPLEMENT: XML parsing service using fast-xml-parser
  - FOLLOW pattern: PRPs/ai_docs/opensong-xml-parsing-guide.md
  - DEPENDENCIES: npm install fast-xml-parser
  - INCLUDE: Parse, validate, convert to ChordPro
  - PLACEMENT: Within import services directory

Task 4: CREATE src/features/import/hooks/useFuzzySearch.ts
  - IMPLEMENT: React hook for fuzzy search with debouncing
  - FOLLOW pattern: src/features/search/hooks/useSearch.ts
  - DEPENDENCIES: Import fuzzySearchService from Task 2
  - INCLUDE: Loading states, error handling, result highlighting
  - DEBOUNCE: 200ms for instant feel

Task 5: CREATE src/features/import/hooks/useAutoFill.ts
  - IMPLEMENT: Hook for CCLI lookup and community DB integration
  - FOLLOW pattern: src/features/songs/hooks/useSongs.ts (API patterns)
  - CACHE: Use IndexedDB for 7-day cache of lookups
  - FALLBACK: Return null if not found, don't throw
  - PLACEMENT: Within import hooks directory

Task 6: CREATE src/features/import/components/FuzzySearchDropdown.tsx
  - IMPLEMENT: Autocomplete dropdown with duplicate detection
  - FOLLOW pattern: src/features/arrangements/components/ChordProEditor/components/AutoCompleteDropdown/index.tsx
  - USE: @floating-ui/react for positioning, FloatingPortal for z-index
  - INCLUDE: Keyboard navigation, highlight matches, mobile optimization
  - PLACEMENT: Within import components directory

Task 7: CREATE src/features/import/components/SmartImportModal.tsx
  - IMPLEMENT: Main import modal with all features integrated
  - FOLLOW pattern: src/features/songs/components/forms/SongFormModal.tsx
  - DEPENDENCIES: Import all hooks and components from previous tasks
  - INCLUDE: Three-step flow (search → auto-fill → save)
  - PLACEMENT: Within import components directory

Task 8: CREATE server/features/import/import.validation.ts
  - IMPLEMENT: Zod schemas for import endpoints
  - FOLLOW pattern: server/features/songs/song.validation.ts
  - INCLUDE: CCLI lookup, batch import, fuzzy search schemas
  - TRANSFORMS: String to number for query params
  - PLACEMENT: Server-side import feature

Task 9: CREATE server/features/import/import.service.ts
  - IMPLEMENT: Import business logic and community DB integration
  - FOLLOW pattern: server/features/songs/song.service.ts
  - INCLUDE: Duplicate detection, metadata merging, batch processing
  - CACHE: Implement 30-second request cache
  - PLACEMENT: Server-side import feature

Task 10: CREATE server/features/import/import.routes.ts
  - IMPLEMENT: RESTful API endpoints for import
  - FOLLOW pattern: server/features/songs/song.routes.ts
  - ROUTES: POST /fuzzy-search, GET /ccli/:number, POST /batch
  - MIDDLEWARE: Use validation from Task 8
  - PLACEMENT: Server-side import feature

Task 11: CREATE src/features/import/hooks/useBulkImport.ts
  - IMPLEMENT: Batch import with progress tracking
  - FOLLOW pattern: TanStack Query patterns in codebase
  - INCLUDE: Progress events, error accumulation, retry logic
  - WEBSOCKET: Consider Server-Sent Events for progress
  - PLACEMENT: Within import hooks directory

Task 12: CREATE src/features/import/components/__tests__/FuzzySearchDropdown.test.tsx
  - IMPLEMENT: Comprehensive tests for fuzzy search
  - FOLLOW pattern: src/features/songs/components/__tests__/
  - USE: Vitest, React Testing Library
  - COVERAGE: User interactions, keyboard nav, edge cases
  - PLACEMENT: Within import component tests

Task 13: CREATE src/features/import/index.ts
  - IMPLEMENT: Public API exports for import feature
  - FOLLOW pattern: src/features/songs/index.ts
  - EXPORT: SmartImportModal, useFuzzySearch (public API only)
  - HIDE: Internal services and utils
  - PLACEMENT: Root of import feature
```

### Implementation Patterns & Key Details

```typescript
// Fuse.js configuration for song search
const fuseOptions: Fuse.IFuseOptions<Song> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'artist', weight: 0.3 },
    { name: 'themes', weight: 0.2 }
  ],
  threshold: 0.35, // Tuned for song title matching
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  findAllMatches: false,
  location: 0,
  distance: 100
};

// Fuzzy search hook with debouncing
export function useFuzzySearch(songs: Song[]) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FuzzySearchResult[]>([]);
  
  const fuse = useMemo(
    () => new Fuse(songs, fuseOptions),
    [songs]
  );
  
  const search = useMemo(
    () => debounce((searchQuery: string) => {
      if (searchQuery.length < 3) {
        setResults([]);
        return;
      }
      const searchResults = fuse.search(searchQuery, { limit: 5 });
      setResults(searchResults.map(transformResult));
    }, 200),
    [fuse]
  );
  
  useEffect(() => {
    search(query);
  }, [query, search]);
  
  return { query, setQuery, results };
}

// Floating UI dropdown pattern
export function FuzzySearchDropdown({ onSelect }: Props) {
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(4),
      flip(),
      shift({ padding: 8 }),
      size({
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = `${Math.min(300, availableHeight)}px`;
        }
      })
    ],
    placement: 'bottom-start'
  });
  
  const role = useRole(context, { role: 'listbox' });
  const dismiss = useDismiss(context);
  const listNav = useListNavigation(context, {
    listRef: itemsRef,
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: true,
    loop: true
  });
  
  return (
    <>
      <input ref={refs.setReference} />
      {isOpen && (
        <FloatingPortal>
          <div ref={refs.setFloating} style={floatingStyles}>
            {/* Dropdown content */}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

// OpenSong parsing with error handling
export class OpenSongParser {
  parse(xmlContent: string): ParsedSong {
    const validation = XMLValidator.validate(xmlContent);
    if (validation !== true) {
      throw new Error(`Invalid XML at line ${validation.err.line}`);
    }
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true, // CRITICAL for OpenSong
      parseAttributeValue: true
    });
    
    const result = parser.parse(xmlContent);
    return this.transformToSong(result);
  }
}

// API endpoint pattern
export const fuzzySearchEndpoint = catchAsync(async (req: Request, res: Response) => {
  const { query, limit = 5 } = req.query;
  
  // Validate with Zod
  const validated = fuzzySearchSchema.parse({ query, limit });
  
  // Use service
  const results = await importService.fuzzySearch(validated.query, validated.limit);
  
  // Return standardized response
  res.json({
    success: true,
    data: results,
    searchTime: Date.now() - start
  });
});
```

### Integration Points & Cross-Slice Dependencies

```yaml
WITHIN SLICE (Self-contained):
  - All import logic and UI components
  - Fuzzy search implementation
  - Format conversion utilities
  - Community DB integration
  - Progress tracking

SHARED/COMMON DEPENDENCIES (Allowed):
  - src/shared/components/ui/Modal
  - src/shared/components/ui/Button
  - src/shared/validation/utils
  - src/shared/types/api.types

CROSS-SLICE DEPENDENCIES (Minimize & Make Explicit):
  - Import Song type from features/songs/types/song.types.ts
  - Use songService.create() for final save
  - Import theme normalization from features/songs/utils

BACKEND INTEGRATION:
  - New routes: /api/import/fuzzy-search, /api/import/ccli/:number
  - Reuse existing: /api/songs POST endpoint
  - Share validation utilities

ROUTING:
  - Modal triggered from SongListPage "Add Song" button
  - Or standalone /import page for batch operations
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After each file creation
npm run lint                    # ESLint with TypeScript rules
npx tsc --noEmit                # TypeScript type checking
npm run format                  # Prettier formatting

# Fix any issues before proceeding
npm run lint:fix               # Auto-fix what's possible

# Expected: Zero errors, all types resolved
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test fuzzy search
npm test -- src/features/import/hooks/useFuzzySearch.test.ts

# Test components
npm test -- src/features/import/components/

# Test services
npm test -- src/features/import/services/

# Coverage check
npm test -- --coverage src/features/import/

# Expected: All tests pass, > 80% coverage
```

### Level 3: Integration Testing (System Validation)

```bash
# Start dev server
npm run dev

# Test fuzzy search API
curl -X POST http://localhost:3000/api/import/fuzzy-search \
  -H "Content-Type: application/json" \
  -d '{"query": "amazing"}' \
  | jq .

# Test CCLI lookup
curl http://localhost:3000/api/import/ccli/22025 | jq .

# Test import modal
# 1. Navigate to http://localhost:3000/songs
# 2. Click "Add Song"
# 3. Type "Amaz" - should see fuzzy results
# 4. Enter CCLI 22025 - should auto-fill

# Production build
npm run build
# Expected: Successful build, no TypeScript errors
```

### Level 4: Feature-Specific Validation

```bash
# Fuzzy search accuracy test
# Create test script that validates:
# - "Amazing Grace" found with "amzing grase" (typos)
# - "How Great Thou Art" found with "how grat" (partial)
# - Confidence scores > 0.65 for good matches

# Performance validation
# - Fuzzy search < 200ms for 10,000 songs
# - Auto-fill < 500ms including cache check
# - Batch import: 100 songs < 30 seconds

# Import format validation
# Test OpenSong XML files from test-data/
find test-data -name "*.xml" -exec \
  curl -X POST http://localhost:3000/api/import/opensong \
  -F "file=@{}" \;

# Memory leak check (for bulk import)
# Monitor memory during 500+ song import

# Slice isolation check
find src/features/import -name "*.ts" -o -name "*.tsx" | \
  xargs grep -l "from.*features/" | \
  grep -v "features/songs/types" | \
  grep -v "features/import"
# Expected: Minimal cross-slice imports
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] All tests pass: `npm test -- src/features/import/`
- [ ] No linting errors: `npm run lint`
- [ ] Production build succeeds: `npm run build`
- [ ] Bundle size < 50KB for import feature

### Feature Validation

- [ ] Fuzzy search triggers after 3 characters
- [ ] Results appear in < 200ms
- [ ] Duplicates detected with > 95% accuracy
- [ ] CCLI auto-fill works when available
- [ ] OpenSong import converts correctly
- [ ] Batch import shows accurate progress
- [ ] Error messages are user-friendly

### Code Quality Validation

- [ ] Follows vertical slice architecture
- [ ] TypeScript strict mode compliance
- [ ] All functions have explicit return types
- [ ] Proper error boundaries in components
- [ ] Loading and error states handled
- [ ] Mobile responsive and accessible
- [ ] No console.log statements

### TypeScript/React Specific

- [ ] All props interfaces defined
- [ ] No implicit any types
- [ ] Proper generic constraints on hooks
- [ ] Memo/callback used appropriately
- [ ] Effects have proper dependencies
- [ ] No memory leaks in subscriptions

### Documentation & Deployment

- [ ] Public API documented in index.ts
- [ ] Complex algorithms have comments
- [ ] README updated with import feature
- [ ] Environment variables documented

---

## Anti-Patterns to Avoid

**General Anti-Patterns:**
- ❌ Don't skip debouncing on search - causes API overload
- ❌ Don't ignore TypeScript errors - they prevent runtime issues
- ❌ Don't use synchronous file reading - blocks UI
- ❌ Don't store passwords or sensitive data in IndexedDB
- ❌ Don't trust external data - always validate

**Import-Specific Anti-Patterns:**
- ❌ Don't import directly into database - validate first
- ❌ Don't block UI during batch import - use workers or chunking
- ❌ Don't ignore duplicate warnings - data quality matters
- ❌ Don't cache personal data without consent
- ❌ Don't parse XML with regex - use proper parser
- ❌ Don't assume CCLI number means public domain

---

## Confidence Score: 9/10

This PRP provides comprehensive implementation guidance with:
- Complete TypeScript type definitions
- Existing codebase patterns to follow
- External library documentation
- Step-by-step implementation tasks
- Thorough validation procedures

The implementation should succeed on first pass with this level of detail and context.