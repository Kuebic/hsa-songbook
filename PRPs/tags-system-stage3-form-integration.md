name: "Tag System Stage 3 - Song Form Integration & Arrangement Metadata"
description: |

---

## Goal

**Feature Goal**: Integrate the tag input component into song forms, separate flexible tags (songs) from structured metadata (arrangements), and migrate existing theme data to the new tag system

**Deliverable**: Updated SongManagementForm and ArrangementManagementForm with new tag system, structured metadata fields for arrangements, and data migration utilities

**Success Definition**: Forms use new TagInput component for songs, structured fields for arrangement metadata, with seamless migration of existing data and maintained form validation

## User Persona (if applicable)

**Target User**: Song contributors and arrangement creators managing song metadata

**Use Case**: 
- Add/edit songs with thematic tags using the new tag input
- Create arrangements with structured metadata (key, difficulty, style)
- Maintain existing data during transition

**User Journey**:
1. User opens song form
2. Sees existing themes migrated to new tag system
3. Uses TagInput component to add/remove tags
4. For arrangements, uses structured dropdown fields
5. Saves with proper validation and data persistence

**Pain Points Addressed**:
- Mixed concerns between themes and technical metadata
- Manual theme entry without suggestions
- Lack of structured arrangement data
- Inconsistent data entry patterns

## Why

- **Separation of Concerns**: Clear distinction between subjective tags and objective metadata
- **Data Quality**: Structured fields ensure consistent arrangement metadata
- **User Experience**: Faster, more intuitive data entry with proper UI components
- **Migration Path**: Smooth transition from old theme system to new tags
- **Maintainability**: Cleaner form code with reusable components

## What

Refactor existing song and arrangement forms to use the new tag system, add structured metadata fields for arrangements, implement data migration utilities, and update validation schemas.

### Success Criteria

- [ ] SongManagementForm uses TagInput component for themes
- [ ] ArrangementManagementForm has structured metadata fields
- [ ] Existing themes migrate to new tag system automatically
- [ ] Form validation works with new tag structure
- [ ] API calls updated to handle new data format
- [ ] No data loss during migration
- [ ] Forms maintain current UX flow
- [ ] All tests updated and passing

## All Needed Context

### Context Completeness Check

_This PRP contains all form patterns, validation schemas, migration strategies, and integration points needed to update both forms with the new tag system._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/features/songs/components/SongManagementForm.tsx
  why: Current form implementation to refactor
  pattern: Form state management, validation, submission
  gotcha: Uses manual state - needs careful migration

- file: src/features/songs/components/arrangements/ArrangementManagementForm.tsx
  why: Arrangement form to add structured metadata
  pattern: Current tag implementation, form structure
  gotcha: Tags field needs to split into structured fields

- file: src/features/songs/validation/schemas/songFormSchema.ts
  why: Validation schema to update for new tag structure
  pattern: Zod schema patterns, transforms
  gotcha: Theme validation needs to change to tag validation

- file: src/features/songs/services/songService.ts
  why: API service to update for new data format
  pattern: CRUD operations, field mapping
  gotcha: Must handle both old and new data formats during migration

- file: src/features/songs/validation/constants/musicalKeys.ts
  why: Musical key definitions for arrangement metadata
  pattern: Key constants and enums
  gotcha: 35 keys including majors and minors

- file: src/features/songs/hooks/useSongMutations.ts
  why: Mutation hooks that need updating
  pattern: Optimistic updates, error handling
  gotcha: Must update optimistic update logic

- docfile: PRPs/ai_docs/shadcn-react-hook-form-implementation-guide.md
  why: React Hook Form migration patterns
  section: Form migration strategy

- file: src/features/songs/types/song.types.ts
  why: Type definitions to update
  pattern: Interface structure
  gotcha: Must maintain backward compatibility
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase

```bash
src/
├── features/
│   ├── tags/                    # From Stages 1-2
│   │   ├── components/
│   │   ├── services/
│   │   └── hooks/
│   └── songs/
│       ├── components/
│       │   ├── SongManagementForm.tsx
│       │   └── arrangements/
│       │       └── ArrangementManagementForm.tsx
│       ├── validation/
│       │   └── schemas/
│       ├── services/
│       └── hooks/
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
src/
├── features/
│   ├── tags/
│   │   └── utils/
│   │       ├── migration.ts                    # Theme to tag migration utilities
│   │       └── migration.test.ts               # Migration tests
│   └── songs/
│       ├── components/
│       │   ├── SongManagementForm.tsx          # MODIFY: Use TagInput
│       │   ├── arrangements/
│       │   │   ├── ArrangementManagementForm.tsx # MODIFY: Add metadata fields
│       │   │   ├── MetadataFields.tsx          # NEW: Structured metadata inputs
│       │   │   └── MetadataFields.test.tsx     # NEW: Metadata field tests
│       │   └── forms/
│       │       ├── SongFormFields.tsx          # NEW: Extracted form fields
│       │       └── ArrangementFormFields.tsx   # NEW: Extracted arrangement fields
│       ├── validation/
│       │   └── schemas/
│       │       ├── songFormSchema.ts           # MODIFY: Update for tags
│       │       └── arrangementSchema.ts        # MODIFY: Add metadata validation
│       ├── services/
│       │   ├── songService.ts                  # MODIFY: Handle tag relationships
│       │   └── migrationService.ts             # NEW: Data migration service
│       └── hooks/
│           ├── useSongMutations.ts             # MODIFY: Update mutations
│           └── useMigration.ts                 # NEW: Migration hook
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Database still has themes array during migration
// Must support both formats temporarily

// CRITICAL: Existing songs have themes that need migration
// Run migration on form load if needed

// CRITICAL: Form validation must handle both old and new formats
// Check data format and apply appropriate validation

// CRITICAL: Optimistic updates need careful handling
// Update both local state and cache correctly

// CRITICAL: Arrangement metadata is optional initially
// Don't require fields until migration complete

// CRITICAL: Tag service expects normalized names
// Always normalize before sending to API
```

## Implementation Blueprint

### Data models and structure

```typescript
// Updated song type with tags instead of themes
export interface Song {
  id: string
  title: string
  artist?: string
  slug: string
  // REMOVED: themes: string[]
  tags?: Tag[]  // NEW: Relationship to tags
  tagIds?: string[]  // NEW: For API operations
  // ... other fields
}

// Enhanced arrangement type with structured metadata
export interface ArrangementMetadata {
  key?: MusicalKey
  difficulty?: 1 | 2 | 3 | 4 | 5
  style?: ArrangementStyle
  tempoBpm?: number
  instrumentation?: Instrument[]
  capoPosition?: number
  tuning?: GuitarTuning
  styleTags?: string[]  // Limited flexible tags for arrangements
}

export interface Arrangement {
  id: string
  name: string
  songId: string
  chordData?: string
  // REMOVED: tags: string[]
  metadata?: ArrangementMetadata  // NEW: Structured metadata
  // ... other fields
}

// Migration utility types
export interface MigrationResult {
  songsUpdated: number
  themesConverted: number
  errors: string[]
}

// Form data types
export interface SongFormData {
  title: string
  artist?: string
  tags: Tag[]  // Changed from themes: string[]
  // ... other fields
}

export interface ArrangementFormData {
  name: string
  chordData?: string
  key?: MusicalKey
  difficulty?: number
  style?: ArrangementStyle
  tempo?: number
  instrumentation?: Instrument[]
  capo?: number
  tuning?: GuitarTuning
  styleTags?: string[]
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/features/tags/utils/migration.ts
  - IMPLEMENT: Theme to tag conversion utilities
  - INCLUDE: mapThemesToTags(), createTagsFromThemes()
  - INTEGRATE: Existing theme normalization logic
  - HANDLE: Edge cases, duplicates, invalid themes
  - PLACEMENT: Tag utils directory

Task 2: UPDATE src/features/songs/types/song.types.ts
  - MODIFY: Replace themes with tags/tagIds
  - ADD: ArrangementMetadata interface
  - MAINTAIN: Backward compatibility types
  - PLACEMENT: Existing types file

Task 3: UPDATE src/features/songs/validation/schemas/songFormSchema.ts
  - MODIFY: Change theme validation to tag validation
  - REMOVE: Theme normalization transform
  - ADD: Tag array validation
  - INCLUDE: Migration path for existing data
  - PLACEMENT: Existing schema file

Task 4: CREATE src/features/songs/components/arrangements/MetadataFields.tsx
  - IMPLEMENT: Structured input fields for arrangement metadata
  - INCLUDE: Key selector, difficulty slider, style dropdown
  - FOLLOW: Existing form field patterns
  - USE: ShadCN UI components where applicable
  - PLACEMENT: Arrangements component directory

Task 5: UPDATE src/features/songs/components/SongManagementForm.tsx
  - REPLACE: Theme input with TagInput component
  - IMPORT: TagInput from features/tags/components
  - ADD: Migration logic for existing themes
  - UPDATE: Form state and validation
  - MAINTAIN: Current form flow and UX
  - PLACEMENT: Existing form file

Task 6: UPDATE src/features/songs/components/arrangements/ArrangementManagementForm.tsx
  - ADD: MetadataFields component
  - REMOVE: Unstructured tags field
  - SPLIT: Tags into structured metadata + optional style tags
  - UPDATE: Form validation and submission
  - PLACEMENT: Existing form file

Task 7: CREATE src/features/songs/services/migrationService.ts
  - IMPLEMENT: Service for migrating existing data
  - METHODS: migrateThemesToTags(), updateArrangementMetadata()
  - HANDLE: Batch operations, error recovery
  - PLACEMENT: Services directory

Task 8: UPDATE src/features/songs/services/songService.ts
  - MODIFY: CRUD operations to handle tags
  - ADD: Tag relationship management
  - UPDATE: Field mapping for new structure
  - MAINTAIN: Backward compatibility
  - PLACEMENT: Existing service file

Task 9: CREATE src/features/songs/hooks/useMigration.ts
  - IMPLEMENT: Hook for running migrations
  - USE: React Query for async operations
  - INCLUDE: Progress tracking, error handling
  - PLACEMENT: Hooks directory

Task 10: UPDATE src/features/songs/hooks/useSongMutations.ts
  - MODIFY: Mutation logic for new data structure
  - UPDATE: Optimistic update handlers
  - HANDLE: Tag relationships in cache
  - PLACEMENT: Existing hooks file

Task 11: CREATE tests for all modified components
  - UPDATE: Existing tests for new structure
  - ADD: Tests for migration logic
  - TEST: Form validation with new fields
  - COVERAGE: Edge cases and error scenarios
  - PLACEMENT: Alongside components
```

### Implementation Patterns & Key Details

```typescript
// Migration utility
export const migrateThemesToTags = async (
  themes: string[],
  tagService: TagService
): Promise<Tag[]> => {
  // PATTERN: Normalize and deduplicate
  const normalizedThemes = themes
    .map(theme => normalizeTheme(theme))
    .filter((v, i, a) => a.indexOf(v) === i);
  
  // PATTERN: Create or fetch existing tags
  const tags: Tag[] = [];
  for (const theme of normalizedThemes) {
    try {
      // Check if tag exists
      const existing = await tagService.findByName(theme);
      if (existing) {
        tags.push(existing);
      } else {
        // Create new tag
        const newTag = await tagService.create({
          name: theme,
          category: 'theme',
          isStandard: STANDARD_THEMES.includes(theme)
        });
        tags.push(newTag);
      }
    } catch (error) {
      console.error(`Failed to migrate theme: ${theme}`, error);
    }
  }
  
  return tags;
};

// Updated SongManagementForm with TagInput
export function SongManagementForm({ song, onSave }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const { migrateThemes } = useMigration();
  
  // PATTERN: Migrate themes on mount if needed
  useEffect(() => {
    if (song?.themes && !song.tags) {
      migrateThemes(song.themes).then(tags => {
        setFormData(prev => ({ ...prev, tags }));
      });
    }
  }, [song]);
  
  // PATTERN: React Hook Form with TagInput
  const { control, handleSubmit, formState: { errors } } = useForm<SongFormData>({
    defaultValues: {
      title: song?.title || '',
      artist: song?.artist || '',
      tags: song?.tags || [],
    },
    resolver: zodResolver(songFormSchema)
  });
  
  const onSubmit = async (data: SongFormData) => {
    try {
      // PATTERN: Convert tags to IDs for API
      const payload = {
        ...data,
        tagIds: data.tags.map(tag => tag.id)
      };
      
      await songService.upsert(payload);
      onSave();
    } catch (error) {
      // Error handling
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Other fields */}
      
      <Controller
        name="tags"
        control={control}
        render={({ field, fieldState }) => (
          <TagInput
            {...field}
            maxTags={10}
            category="theme"
            placeholder="Add themes and occasions..."
            error={fieldState.error}
            quickPicks={popularTags}
          />
        )}
      />
      
      <button type="submit" disabled={isLoading}>
        Save Song
      </button>
    </form>
  );
}

// MetadataFields component for arrangements
export function MetadataFields({ control, errors }: MetadataFieldsProps) {
  return (
    <div className={styles.metadataGrid}>
      <Controller
        name="key"
        control={control}
        render={({ field }) => (
          <Select {...field}>
            <SelectTrigger>
              <SelectValue placeholder="Select key" />
            </SelectTrigger>
            <SelectContent>
              {MUSICAL_KEYS.map(key => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      
      <Controller
        name="difficulty"
        control={control}
        render={({ field }) => (
          <div className={styles.difficultyField}>
            <label>Difficulty</label>
            <DifficultySelector
              value={field.value}
              onChange={field.onChange}
            />
          </div>
        )}
      />
      
      <Controller
        name="instrumentation"
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            options={INSTRUMENTS}
            value={field.value || []}
            onChange={field.onChange}
            label="Instrumentation"
          />
        )}
      />
    </div>
  );
}

// Updated validation schema
export const songFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().optional(),
  // CHANGED: From themes array to tags array
  tags: z.array(tagSchema)
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed'),
  // ... other fields
});

// Service update for tag handling
class SongService {
  async upsert(data: SongFormData & { tagIds: string[] }) {
    // PATTERN: Handle tag relationships
    const { tagIds, ...songData } = data;
    
    // Create/update song
    const { data: song, error } = await this.supabase
      .from('songs')
      .upsert(songData)
      .select()
      .single();
      
    if (error) throw error;
    
    // Update tag relationships
    if (tagIds) {
      await this.updateSongTags(song.id, tagIds);
    }
    
    return song;
  }
  
  private async updateSongTags(songId: string, tagIds: string[]) {
    // Remove existing relationships
    await this.supabase
      .from('song_tags')
      .delete()
      .eq('song_id', songId);
    
    // Add new relationships
    const relationships = tagIds.map(tagId => ({
      song_id: songId,
      tag_id: tagId
    }));
    
    await this.supabase
      .from('song_tags')
      .insert(relationships);
  }
}
```

### Integration Points

```yaml
DEPENDENCIES:
  - component: "src/features/tags/components/TagInput from Stage 2"
  - service: "src/features/tags/services/tagService from Stage 1"
  - types: "src/features/tags/types/tag.types from Stage 1"

DATABASE:
  - migration: "Handle both old themes and new tags during transition"
  - relationships: "Manage song_tags junction table"

VALIDATION:
  - update: "All form schemas to handle new structure"
  - maintain: "Backward compatibility during migration"

CACHING:
  - invalidate: "Song queries when tags change"
  - update: "Optimistic updates for new structure"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After each file modification
npm run lint
npm run build

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test updated forms
npm run test -- src/features/songs/components/SongManagementForm.test.tsx
npm run test -- src/features/songs/components/arrangements/ArrangementManagementForm.test.tsx

# Test migration utilities
npm run test -- src/features/tags/utils/migration.test.ts

# Test metadata fields
npm run test -- src/features/songs/components/arrangements/MetadataFields.test.tsx

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Start dev server
npm run dev

# Test song form:
# 1. Create new song - verify TagInput works
# 2. Edit existing song with themes - verify migration
# 3. Save song - verify tags persist
# 4. Load saved song - verify tags display

# Test arrangement form:
# 1. Create arrangement - add metadata
# 2. Select key, difficulty, style
# 3. Save - verify metadata persists
# 4. Edit - verify metadata loads correctly

# Database verification
npx supabase db query "SELECT * FROM song_tags" --local
# Verify relationships created

# Expected: All forms work, data persists correctly
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Migration testing
# 1. Load song with old themes array
# 2. Verify automatic migration to tags
# 3. Check no data loss
# 4. Verify normalized correctly

# Performance testing
# Load form with many tags
# Measure render time
# Should be < 100ms

# Edge cases
# 1. Song with 10 tags (max)
# 2. Invalid theme names
# 3. Duplicate themes
# 4. Empty themes array

# Backward compatibility
# Verify old API responses still work
# Check cache updates correctly
# Test optimistic updates

# Expected: Smooth migration, no data loss
```

## Final Validation Checklist

### Technical Validation

- [ ] All validation levels pass
- [ ] Forms render without errors
- [ ] TypeScript types updated consistently
- [ ] Tests updated and passing
- [ ] No console errors or warnings

### Feature Validation

- [ ] TagInput integrated in song form
- [ ] Metadata fields added to arrangement form
- [ ] Existing themes migrate automatically
- [ ] Data persists correctly
- [ ] Validation works for all fields
- [ ] No data loss during migration

### Code Quality Validation

- [ ] Follows existing patterns
- [ ] Proper error handling
- [ ] Clean component separation
- [ ] Backward compatibility maintained
- [ ] Performance optimized

### Documentation & Deployment

- [ ] Migration strategy documented
- [ ] Form changes documented
- [ ] API changes noted
- [ ] Breaking changes identified

---

## Anti-Patterns to Avoid

- ❌ Don't lose data during migration
- ❌ Don't break existing functionality
- ❌ Don't mix old and new patterns
- ❌ Don't skip validation
- ❌ Don't forget backward compatibility
- ❌ Don't hardcode migration logic
- ❌ Don't ignore error cases
- ❌ Don't create tight coupling between forms and tags