# Multilingual Lyrics Feature - Product Requirements Prompt (PRP)

## Goal

**Feature Goal**: Enable songs to store lyrics in multiple languages (English, Japanese, Korean, plus Romaji versions) and automatically pre-populate these lyrics into ChordPro templates when creating new arrangements, with language selection capability

**Deliverable**: Multilingual lyrics storage system with automatic ChordPro template population during arrangement creation workflow

**Success Definition**: Users can store lyrics in multiple languages per song, select which language to use when creating arrangements, and have the selected lyrics automatically populated into the ChordPro editor template

## User Persona

**Target User**: Worship leaders and musicians in multilingual congregations (HSA community)

**Use Case**: Creating chord arrangements for songs that are sung in multiple languages during international services, including Romaji (romanized) versions for pronunciation assistance

**User Journey**:
1. User adds/edits a song with lyrics in multiple languages (including Romaji versions)
2. User creates a new arrangement for that song
3. System prompts user to select which language lyrics to use (if multiple available)
4. User selects preferred language (native script or Romaji version)
5. ChordPro editor opens with lyrics pre-populated in selected language
6. User adds chords to existing lyrics instead of typing from scratch

**Pain Points Addressed**:
- Currently must manually type lyrics when creating arrangements
- No way to store multilingual versions of the same song
- Time-consuming to create arrangements for songs in different languages
- Risk of typos when manually entering lyrics
- Non-native speakers need Romaji versions for pronunciation assistance

## Why

- **International Community**: HSA has congregations worldwide singing in different languages
- **Efficiency**: Pre-populating lyrics saves significant time during arrangement creation
- **Data Integrity**: Reduces errors from manual lyrics entry
- **Legal Compliance**: Works with CCLI integration to verify rights for multilingual content
- **User Experience**: Streamlines the workflow from song creation to performance-ready arrangements

## What

Enable multilingual lyrics storage at the song level with automatic population into ChordPro templates during arrangement creation.

### Success Criteria

- [ ] Songs can store lyrics in multiple languages: English, Japanese (Hiragana/Katakana), Korean (Hangul)
- [ ] Songs can store Romaji versions for Japanese and Korean lyrics
- [ ] Language selection UI shows both native script and Romaji options
- [ ] Selected lyrics automatically populate into ChordPro template
- [ ] Existing single-language workflow remains unchanged (no breaking changes)
- [ ] Languages are properly displayed with correct fonts and character encoding
- [ ] ChordPro editor handles CJK (Chinese, Japanese, Korean) characters correctly
- [ ] Foundation for future auto-conversion from Korean/Japanese to Romaji

## All Needed Context

### Context Completeness Check

_This PRP contains all database schemas, type definitions, service patterns, UI components, and ChordPro integration points needed for implementation without prior knowledge of the codebase._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/features/songs/types/song.types.ts
  why: Current Song and Arrangement interfaces that need extension
  pattern: TypeScript interface structure with metadata patterns
  gotcha: Uses string[] for songIds in arrangements for compatibility

- file: src/lib/database.types.ts
  why: Supabase database type definitions requiring updates
  pattern: Database['public']['Tables'] structure with Row/Insert/Update
  gotcha: Snake_case in database, camelCase in application layer

- file: src/features/songs/services/songService.ts
  why: Service layer patterns for CRUD operations
  pattern: Static class methods with Supabase client usage
  gotcha: Error handling with try-catch, returns null on not found

- file: src/features/songs/utils/chordProGenerator.ts
  why: ChordPro template generation that needs lyrics injection
  pattern: generateInitialChordPro function structure
  gotcha: Uses Nashville number system conversion, needs placeholder replacement

- file: src/features/arrangements/utils/chordProWorkflowService.ts
  why: Workflow for arrangement creation with template storage
  pattern: Session storage for template passing between pages
  gotcha: 30-minute session timeout, uses prefill flag system

- file: src/features/songs/components/SongManagementForm.tsx
  why: Form patterns for field handling and validation
  pattern: Native select dropdowns, Zod validation, error display
  gotcha: Uses inline styles with CSS variables for theming

- file: src/features/songs/components/ArrangementManagementForm.tsx
  why: Arrangement creation form that triggers workflow
  pattern: Form submission to service layer, modal integration
  gotcha: ChordPro text is optional during creation

- docfile: PRPs/ai_docs/supabase-jsonb-patterns.md
  why: JSONB patterns for storing multilingual content
  section: PostgreSQL JSONB with GIN indexes

- docfile: PRPs/ai_docs/react-multilingual-components.md
  why: React patterns for language selection and display
  section: Language context and selector components

- url: https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING
  why: PostgreSQL JSONB indexing for multilingual queries
  critical: GIN indexes required for JSONB query performance

- url: https://github.com/martijnversluis/ChordSheetJS
  why: ChordSheetJS library for ChordPro parsing
  critical: Handles Unicode but needs proper font configuration for CJK
```

### Current Codebase Tree

```bash
hsa-songbook/
├── src/
│   ├── features/
│   │   ├── songs/
│   │   │   ├── types/
│   │   │   │   └── song.types.ts          # Song, Arrangement interfaces
│   │   │   ├── services/
│   │   │   │   ├── songService.ts         # CRUD operations
│   │   │   │   └── arrangementService.ts  # Arrangement operations
│   │   │   ├── utils/
│   │   │   │   ├── chordProGenerator.ts   # Template generation
│   │   │   │   └── chordProTemplateGenerator.ts
│   │   │   ├── components/
│   │   │   │   ├── SongManagementForm.tsx # Song editing form
│   │   │   │   └── ArrangementManagementForm.tsx
│   │   │   └── validation/
│   │   │       └── constants/
│   │   │           └── sources.ts         # Constants patterns
│   │   └── arrangements/
│   │       ├── utils/
│   │       │   └── chordProWorkflowService.ts
│   │       └── components/
│   │           └── ChordProEditor/
│   │               └── index.tsx          # Main editor component
│   └── lib/
│       ├── database.types.ts              # Supabase types
│       └── supabase.ts                    # Supabase client
└── supabase/
    └── migrations/                         # Database migrations
```

### Desired Codebase Tree with Files to be Added

```bash
hsa-songbook/
├── src/
│   ├── features/
│   │   ├── multilingual/                  # NEW: Multilingual feature module
│   │   │   ├── types/
│   │   │   │   └── multilingual.types.ts  # Language interfaces
│   │   │   ├── contexts/
│   │   │   │   └── LanguageContext.tsx    # Language state management
│   │   │   ├── components/
│   │   │   │   ├── LanguageSelector.tsx   # Language dropdown
│   │   │   │   ├── MultilingualText.tsx   # Text display component
│   │   │   │   └── LyricsLanguageModal.tsx # Language selection modal
│   │   │   ├── hooks/
│   │   │   │   └── useLanguage.ts         # Language hook
│   │   │   ├── utils/
│   │   │   │   ├── textProcessing.ts      # CJK text utilities
│   │   │   │   └── languageDetection.ts   # Auto-detect language
│   │   │   └── services/
│   │   │       └── multilingualService.ts # Multilingual operations
│   │   ├── songs/
│   │   │   ├── types/
│   │   │   │   └── song.types.ts          # MODIFIED: Add multilingual fields
│   │   │   ├── services/
│   │   │   │   └── songService.ts         # MODIFIED: Multilingual methods
│   │   │   ├── utils/
│   │   │   │   └── chordProGenerator.ts   # MODIFIED: Lyrics injection
│   │   │   ├── components/
│   │   │   │   ├── SongManagementForm.tsx # MODIFIED: Multilingual fields
│   │   │   │   └── LyricsEditor.tsx       # NEW: Multilingual lyrics editor
│   │   │   └── validation/
│   │   │       └── constants/
│   │   │           └── languages.ts       # NEW: Language constants
│   │   └── arrangements/
│   │       └── utils/
│   │           └── chordProWorkflowService.ts # MODIFIED: Language selection
│   └── lib/
│       └── database.types.ts              # MODIFIED: JSONB types
└── supabase/
    └── migrations/
        └── 20240121_add_multilingual_lyrics.sql # NEW: Schema migration
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Supabase JSONB requires proper type casting
// When querying JSONB fields, use -> and ->> operators correctly
// -> returns JSONB, ->> returns text

// CRITICAL: ChordSheetJS Unicode handling
// Requires proper font configuration for CJK characters
// Must add spacing adjustments for CJK text under chords

// CRITICAL: React 19 concurrent features
// Use useTransition for language switching to prevent UI blocking
// Implement Suspense boundaries for lazy-loaded language data

// CRITICAL: TypeScript strict mode
// All interfaces must be explicitly typed, no implicit any
// Database nullable fields need proper null handling

// CRITICAL: Session storage has 10MB limit
// Large ChordPro templates with lyrics may need compression
// Use LZ-String compression if needed
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// src/features/multilingual/types/multilingual.types.ts
export interface MultilingualText {
  [languageCode: string]: string;
}

export interface SupportedLanguage {
  code: string;       // 'en', 'ja', 'ko'
  name: string;       // 'English', 'Japanese', 'Korean'
  nativeName: string; // 'English', '日本語', '한국어'
  rtl: boolean;       // Right-to-left support
}

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false },
  { code: 'ja-romaji', name: 'Japanese (Romaji)', nativeName: 'Japanese (Romaji)', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false },
  { code: 'ko-romaji', name: 'Korean (Romaji)', nativeName: 'Korean (Romaji)', rtl: false },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// src/features/songs/types/song.types.ts - MODIFIED
export interface Song {
  // ... existing fields ...
  lyrics?: MultilingualText;      // NEW: {"en": "...", "ja": "...", "ja-romaji": "...", "ko": "...", "ko-romaji": "..."}
  originalLanguage?: LanguageCode; // NEW: Primary language (native script only: 'en', 'ja', 'ko')
  lyricsVerified?: boolean;        // NEW: Verification status
  lyricsSource?: 'user' | 'import' | 'opensong'; // NEW: Source tracking
  autoConversionEnabled?: boolean; // NEW: Flag for future auto-conversion feature
}

// src/lib/database.types.ts - MODIFIED
export interface Database {
  public: {
    Tables: {
      songs: {
        Row: {
          // ... existing fields ...
          lyrics: Json | null;           // JSONB in database: {"en": "...", "ja": "...", "ja-romaji": "...", "ko": "...", "ko-romaji": "..."}
          original_language: string | null;  // Native script only: 'en', 'ja', 'ko'
          lyrics_verified: boolean;
          lyrics_source: string | null;
          auto_conversion_enabled: boolean; // For future Romaji auto-conversion
        }
        // ... Insert and Update types follow same pattern
      }
    }
  }
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE supabase/migrations/20240121_add_multilingual_lyrics.sql
  - IMPLEMENT: Database schema migration for multilingual support with Romaji
  - ADD: lyrics JSONB, original_language VARCHAR(10), lyrics_verified BOOLEAN, lyrics_source VARCHAR(50), auto_conversion_enabled BOOLEAN
  - CREATE: GIN indexes for JSONB query performance
  - MIGRATE: Existing data to new structure (preserve backward compatibility)
  - SUPPORT: Language codes: 'en', 'ja', 'ja-romaji', 'ko', 'ko-romaji'
  - RUN: npx supabase migration up && npx supabase gen types typescript --local

Task 2: CREATE src/features/multilingual/types/multilingual.types.ts
  - IMPLEMENT: MultilingualText, SupportedLanguage, LanguageCode types
  - FOLLOW pattern: src/features/songs/types/song.types.ts
  - EXPORT: Types for use across application
  - INCLUDE: SUPPORTED_LANGUAGES constant array with Romaji variants
  - ADD: Helper types for detecting Romaji vs native script languages

Task 3: MODIFY src/features/songs/types/song.types.ts
  - IMPORT: MultilingualText type from multilingual module
  - ADD: lyrics?: MultilingualText, originalLanguage?: string fields
  - ADD: lyricsVerified?: boolean, lyricsSource?: string fields
  - ADD: autoConversionEnabled?: boolean for future auto-conversion feature
  - MAINTAIN: Backward compatibility with existing fields
  - NOTE: originalLanguage only stores native scripts ('en', 'ja', 'ko'), not Romaji variants

Task 4: CREATE src/features/multilingual/contexts/LanguageContext.tsx
  - IMPLEMENT: React context for language state management
  - FOLLOW pattern: src/shared/contexts/ThemeContext.tsx
  - PROVIDE: currentLanguage, changeLanguage, getMultilingualText methods
  - INCLUDE: localStorage persistence for language preference

Task 5: CREATE src/features/multilingual/components/LanguageSelector.tsx
  - IMPLEMENT: Dropdown component for language selection including Romaji variants
  - FOLLOW pattern: src/features/songs/components/SongManagementForm.tsx select elements
  - USE: Native select with CSS variables for theming
  - INTEGRATE: With LanguageContext for state management
  - DISPLAY: Group native scripts and Romaji versions logically (e.g., "Japanese", "Japanese (Romaji)")

Task 6: CREATE src/features/multilingual/components/LyricsLanguageModal.tsx
  - IMPLEMENT: Modal for language selection during arrangement creation
  - FOLLOW pattern: src/shared/components/modal/Modal.tsx
  - DISPLAY: Available languages with preview of lyrics (native script and Romaji variants)
  - SHOW: Clear distinction between native script and Romaji versions
  - RETURN: Selected language code (including Romaji variants) on confirmation

Task 7: CREATE src/features/songs/components/LyricsEditor.tsx
  - IMPLEMENT: Tabbed interface for editing lyrics in multiple languages including Romaji
  - FOLLOW pattern: Form field components in SongManagementForm.tsx
  - USE: Textarea for each language with proper font support
  - VALIDATE: Unicode characters and text encoding
  - SEPARATE: Native script tabs from Romaji tabs for clear organization
  - FUTURE: Add placeholder for auto-conversion button (disabled initially)

Task 8: MODIFY src/features/songs/components/SongManagementForm.tsx
  - IMPORT: LyricsEditor component
  - ADD: Lyrics editing section with language tabs
  - UPDATE: Form submission to include multilingual lyrics
  - MAINTAIN: Existing form validation patterns

Task 9: CREATE src/features/multilingual/services/multilingualService.ts
  - IMPLEMENT: CRUD operations for multilingual content
  - FOLLOW pattern: src/features/songs/services/songService.ts
  - METHODS: updateSongLyrics, getSongLyrics, detectLanguage
  - HANDLE: JSONB queries with proper operators

Task 10: MODIFY src/features/songs/services/songService.ts
  - IMPORT: multilingualService methods
  - UPDATE: createSong to handle multilingual lyrics
  - UPDATE: updateSong to merge multilingual content
  - ADD: getLyricsForLanguage helper method

Task 11: MODIFY src/features/songs/utils/chordProGenerator.ts
  - MODIFY: generateInitialChordPro to accept lyrics parameter
  - REPLACE: Placeholder lyrics with actual multilingual content
  - HANDLE: CJK text formatting with proper spacing
  - MAINTAIN: Existing Nashville number system logic

Task 12: MODIFY src/features/arrangements/utils/chordProWorkflowService.ts
  - UPDATE: createNewArrangementWorkflow to check for multilingual lyrics
  - ADD: Language selection step if multiple languages available
  - STORE: Selected language in session storage
  - PASS: Lyrics to template generation

Task 13: CREATE src/features/multilingual/utils/textProcessing.ts
  - IMPLEMENT: CJK character detection and processing
  - METHODS: containsCJK, normalizeForSearch, calculateDisplayLength
  - HANDLE: Unicode normalization and text metrics
  - SUPPORT: Proper text truncation for UI display
  - ADD: isRomajiLanguage, getNativeLanguageCode utility functions
  - FUTURE: Add stub functions for Korean->Romaji and Japanese->Romaji conversion

Task 14: CREATE tests for multilingual features
  - IMPLEMENT: Unit tests for multilingualService
  - IMPLEMENT: Component tests for LanguageSelector, LyricsEditor
  - IMPLEMENT: Integration tests for lyrics population workflow
  - FOLLOW pattern: Existing test structures in __tests__ folders

Task 15: UPDATE ChordPro editor for CJK support
  - MODIFY: src/features/arrangements/components/ChordProEditor/index.tsx
  - ADD: Font configuration for CJK characters
  - UPDATE: Preview rendering for proper character display
  - TEST: With actual Japanese and Korean lyrics
```

### Implementation Patterns & Key Details

```typescript
// Database Migration Pattern
-- supabase/migrations/20240121_add_multilingual_lyrics.sql
ALTER TABLE songs 
ADD COLUMN lyrics JSONB DEFAULT '{}',
ADD COLUMN original_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN lyrics_verified BOOLEAN DEFAULT false,
ADD COLUMN lyrics_source VARCHAR(50),
ADD COLUMN auto_conversion_enabled BOOLEAN DEFAULT false;

-- Migrate existing data
UPDATE songs 
SET lyrics = jsonb_build_object('en', notes) 
WHERE notes IS NOT NULL AND lyrics = '{}';

-- Performance indexes for native and Romaji variants
CREATE INDEX idx_songs_lyrics ON songs USING GIN (lyrics);
CREATE INDEX idx_songs_lyrics_languages ON songs USING GIN (
  (lyrics -> 'en'), 
  (lyrics -> 'ja'), 
  (lyrics -> 'ja-romaji'), 
  (lyrics -> 'ko'), 
  (lyrics -> 'ko-romaji')
);

-- Constraint to ensure original_language is always native script
ALTER TABLE songs ADD CONSTRAINT check_original_language_native 
CHECK (original_language IN ('en', 'ja', 'ko') OR original_language IS NULL);

// Service Layer Pattern
// src/features/multilingual/services/multilingualService.ts
export class MultilingualService {
  static async updateSongLyrics(
    songId: string,
    lyrics: MultilingualText,
    language?: LanguageCode
  ): Promise<void> {
    // PATTERN: Get current lyrics first (follow songService.ts pattern)
    const { data: current } = await supabase
      .from('songs')
      .select('lyrics')
      .eq('id', songId)
      .single();

    if (!current) throw new Error('Song not found');

    // GOTCHA: Merge new lyrics with existing
    const updatedLyrics = language 
      ? { ...current.lyrics, [language]: lyrics[language] }
      : lyrics;

    // CRITICAL: Use proper JSONB update
    const { error } = await supabase
      .from('songs')
      .update({ lyrics: updatedLyrics })
      .eq('id', songId);

    if (error) throw error;
  }
}

// ChordPro Integration Pattern
// src/features/songs/utils/chordProGenerator.ts
export function generateInitialChordPro(
  formData: Partial<ArrangementFormData>,
  songTitle: string,
  lyrics?: MultilingualText,  // NEW parameter
  language: LanguageCode = 'en' // NEW parameter
): string {
  // ... existing metadata generation ...

  // PATTERN: Replace placeholder with actual lyrics (supports Romaji)
  if (lyrics && lyrics[language]) {
    const lyricsLines = lyrics[language].split('\n');
    const formattedLyrics = lyricsLines.map(line => {
      // Add placeholder chords at beginning of each line
      // GOTCHA: Handle CJK vs Romaji spacing differently
      const isRomaji = language.includes('-romaji');
      return line ? `[C]${line}` : '';
    }).join('\n');

    // Replace template lyrics with actual
    lines = lines.map(line => {
      if (line.includes('Add your lyrics here')) {
        return formattedLyrics;
      }
      return line;
    });
  }

  return lines.join('\n');
}

// Language Selection Modal Pattern
// src/features/multilingual/components/LyricsLanguageModal.tsx
const handleLanguageSelection = async () => {
  // PATTERN: Store selection in session for workflow
  sessionStorage.setItem('selected-lyrics-language', selectedLanguage);
  
  // CRITICAL: Pass language to workflow service
  await ChordProWorkflowService.storeTemplateWithLyrics(
    arrangementId,
    template,
    selectedLanguage
  );
  
  onClose(selectedLanguage);
};
```

### Integration Points

```yaml
DATABASE:
  - migration: "Add lyrics JSONB, original_language, lyrics_verified, lyrics_source columns"
  - index: "CREATE INDEX idx_songs_lyrics ON songs USING GIN (lyrics)"
  - index: "CREATE INDEX idx_songs_language ON songs (original_language)"

TYPES:
  - update: src/lib/database.types.ts after migration
  - command: "npx supabase gen types typescript --local > src/lib/database.types.ts"

COMPONENTS:
  - add to: src/features/songs/components/SongManagementForm.tsx
  - integrate: LyricsEditor component in form

WORKFLOW:
  - modify: src/features/arrangements/utils/chordProWorkflowService.ts
  - add: Language selection step in createNewArrangementWorkflow

SESSION:
  - store: Selected language in sessionStorage
  - key: 'hsa-songbook-selected-lyrics-language'
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating multilingual module files
npm run lint
npx tsc --noEmit

# Fix any TypeScript errors
# Expected: Zero errors, all types properly defined
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test multilingual service
npm run test -- src/features/multilingual/services/multilingualService.test.ts

# Test language components
npm run test -- src/features/multilingual/components/

# Test modified song service
npm run test -- src/features/songs/services/songService.test.ts

# Expected: All tests pass, coverage > 80%
```

### Level 3: Integration Testing (System Validation)

```bash
# Start development server
npm run dev

# Test database migration
npx supabase migration up

# Verify types generation
npx supabase gen types typescript --local

# Manual testing checklist:
# 1. Create song with multilingual lyrics
# 2. Edit existing song to add lyrics in multiple languages
# 3. Create arrangement and verify language selection modal
# 4. Confirm lyrics populate in ChordPro editor
# 5. Test with actual Japanese/Korean text

# Expected: Full workflow functions correctly
```

### Level 4: Domain-Specific Validation

```bash
# Test ChordPro generation with multilingual lyrics
node -e "
const { generateInitialChordPro } = require('./src/features/songs/utils/chordProGenerator');
const lyrics = { 
  en: 'Amazing grace how sweet the sound',
  ja: 'アメイジング・グレイス'
};
console.log(generateInitialChordPro({}, 'Test Song', lyrics, 'ja'));
"

# Test CJK text processing
node -e "
const { containsCJK } = require('./src/features/multilingual/utils/textProcessing');
console.log(containsCJK('こんにちは')); // Should be true
console.log(containsCJK('Hello')); // Should be false
"

# Performance test JSONB queries
psql $DATABASE_URL -c "
EXPLAIN ANALYZE 
SELECT id, lyrics->>'en' as lyrics_en 
FROM songs 
WHERE lyrics ? 'en';
"

# Expected: Proper ChordPro output, correct text detection, query uses indexes
```

## Final Validation Checklist

### Technical Validation

- [ ] All TypeScript compiles without errors: `npx tsc --noEmit`
- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] Database migration successful: `npx supabase migration up`
- [ ] Types properly generated: `npx supabase gen types typescript --local`

### Feature Validation

- [ ] Songs can store lyrics in English, Japanese (native script), and Korean (native script)
- [ ] Songs can store Romaji versions for Japanese and Korean lyrics
- [ ] Language selection modal shows both native and Romaji options when available
- [ ] Selected lyrics (including Romaji) populate into ChordPro template correctly
- [ ] CJK characters display properly in editor and preview
- [ ] Romaji text displays with appropriate fonts and spacing
- [ ] Existing single-language workflow still works
- [ ] Language preference persists across sessions
- [ ] Auto-conversion placeholders ready for future implementation

### Code Quality Validation

- [ ] Follows vertical slice architecture pattern
- [ ] All files in correct locations per desired tree
- [ ] Proper TypeScript interfaces with no implicit any
- [ ] Service methods follow existing patterns
- [ ] Form components use established validation patterns

### Documentation & Deployment

- [ ] Database schema documented in migrations
- [ ] TypeScript interfaces self-documenting
- [ ] Language constants centralized and exported
- [ ] Session storage keys documented

---

## Anti-Patterns to Avoid

- ❌ Don't store translations in separate tables - use JSONB for flexibility
- ❌ Don't hardcode language codes - use constants
- ❌ Don't skip Unicode normalization for text comparison
- ❌ Don't forget GIN indexes on JSONB columns
- ❌ Don't modify existing song workflow - extend it
- ❌ Don't assume English - always provide fallback language logic
- ❌ Don't mix native language codes with Romaji codes in originalLanguage field
- ❌ Don't implement auto-conversion in initial version - add placeholders only
- ❌ Don't allow conversion from Romaji back to native scripts (one-way only)