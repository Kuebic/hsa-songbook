name: "Arrangement Management System Implementation - Comprehensive PRP"
description: |
  Complete implementation of arrangement management system for HSA Songbook,
  following vertical slice architecture with comprehensive validation gates.

---

## Goal

**Feature Goal**: Implement a complete arrangement management system that allows users to create, manage, and organize multiple musical arrangements for songs, with seamless integration to the ChordPro editor for chord editing.

**Deliverable**: A fully functional arrangement management feature slice including creation forms, validation, database integration, and ChordPro editor workflow integration.

**Success Definition**: Users can create arrangements with musical metadata (key, tempo, difficulty), see auto-generated titles "[Song Name] - [Arrangement Name]", and seamlessly transition to the ChordPro editor with pre-filled metadata for completing their arrangements.

## User Persona

**Target User**: Worship leaders, music directors, and church musicians who need to create multiple arrangements of the same song for different scenarios (different keys, difficulty levels, instrumental arrangements).

**Use Case**: A worship leader wants to create a simplified piano arrangement of "Amazing Grace" in the key of G for beginners, while also having a more complex arrangement in the key of C for advanced musicians.

**User Journey**: 
1. Browse to song detail page
2. Click "Add Arrangement" button
3. Fill in arrangement name ("Piano Simplified"), select key (G), set difficulty (Beginner)
4. See auto-generated title "Amazing Grace - Piano Simplified"
5. Click "Create Arrangement" 
6. Automatically navigate to ChordPro editor with pre-filled metadata
7. Complete chord progressions and lyrics in ChordPro format

**Pain Points Addressed**: 
- Manual title management and naming consistency
- Inconsistent musical metadata across arrangements
- Disconnected workflow between arrangement creation and chord editing
- Difficulty organizing multiple arrangements per song

## Why

- **User Value**: Enables organized management of multiple musical arrangements per song with proper musical metadata for transposition
- **Integration with Existing Features**: Builds on established song management and ChordPro editor functionality
- **Solves Core Workflow**: Provides seamless transition from arrangement metadata to chord editing
- **Future Foundation**: Creates basis for arrangement sharing, rating, and collaboration features

## What

Users will be able to create and manage musical arrangements with:

### Core Functionality
- **Arrangement Creation Form**: Musical metadata input (name, key, tempo, time signature, difficulty, tags, description)
- **Auto-Generated Titles**: Format "[Song Name] - [Arrangement Name]" where only arrangement name is user-editable
- **Musical Validation**: Required key field for transposition, tempo range validation, musical key validation using tonal.js
- **Tag Management**: Similar to song themes, with autocomplete and suggestion system
- **ChordPro Integration**: Automatic navigation to editor with pre-filled metadata directives

### Success Criteria

- [ ] Users can create arrangements with all required musical metadata
- [ ] Auto-generated titles follow "[Song Name] - [Arrangement Name]" format exactly
- [ ] Musical key field is required and validates against standard musical keys
- [ ] Form validation follows "reward early, punish late" pattern from existing song forms
- [ ] Successful arrangement creation automatically navigates to ChordPro editor
- [ ] ChordPro editor pre-fills with metadata directives (title, key, tempo, etc.)
- [ ] All arrangements display in song detail page with clear musical information
- [ ] Complete vertical slice passes all validation gates

## All Needed Context

### Context Completeness Check

_This PRP provides complete context for implementing arrangement management from scratch, including all patterns, libraries, validation approaches, and integration points discovered through comprehensive research._

### Documentation & References

```yaml
# MUST READ - Critical implementation patterns
- docfile: PRPs/ai_docs/arrangement-management-comprehensive-guide.md
  why: Complete implementation patterns for arrangement management
  section: All sections - musical metadata, form patterns, validation, testing
  critical: Musical key validation, auto-title generation, ChordPro integration patterns

- docfile: PRPs/ai_docs/chordsheetjs-integration-guide.md  
  why: ChordPro editor integration patterns and metadata extraction
  section: React Integration Pattern, Metadata Extraction
  critical: Pre-filling ChordPro editor with arrangement metadata

- docfile: PRPs/ai_docs/form-design-best-practices-2025.md
  why: Professional form design patterns and validation approaches
  section: Validation and Error Handling, Loading States and Optimistic UI
  critical: "Reward Early, Punish Late" validation pattern

- docfile: PRPs/ai_docs/react-query-v5-patterns.md
  why: Optimistic updates and mutation patterns
  section: Optimistic Updates Without Flicker, Smart Cache Invalidation
  critical: Mutation hooks with proper cache invalidation

# MUST FOLLOW - Existing implementation patterns
- file: src/features/songs/components/SongManagementForm.tsx
  why: Exact form structure, validation patterns, state management, and styling to mirror
  pattern: Component props, form state, validation errors, submission handling
  gotcha: Must follow identical naming and structure patterns for consistency

- file: src/features/songs/validation/schemas/songFormSchema.ts
  why: Zod schema patterns, validation rules, and field definitions
  pattern: Schema structure, field validation, transform functions, error messages
  gotcha: Follow exact validation pattern with proper TypeScript types

- file: src/features/songs/validation/schemas/arrangementSchema.ts
  why: Existing arrangement schema to extend and follow
  pattern: Musical metadata validation, key constraints, difficulty levels
  gotcha: Key field must be required, not optional as currently implemented

- file: src/features/songs/hooks/mutations/useCreateSong.ts
  why: Mutation hook patterns, optimistic updates, error handling
  pattern: Mutation function structure, notification integration, cache invalidation
  gotcha: Follow exact hook naming convention and return value structure

- file: src/features/songs/types/song.types.ts
  why: Type definition patterns and interface structure
  pattern: Interface naming, field types, metadata structures
  gotcha: Maintain consistency with existing type definitions

# External Documentation
- url: https://tonaljs.github.io/tonal/docs
  why: Musical key validation and transposition capabilities
  critical: Key.majorKey() validation for musical key constraints

- url: https://react-hook-form.com/get-started
  why: Form management patterns with TypeScript integration
  critical: useForm with Zod resolver for validation

- url: https://www.chordsheetjs.org/
  why: ChordPro format specification and parsing capabilities
  critical: Metadata directive format for pre-filling editor
```

### Current Codebase Tree

```bash
src/features/
├── songs/                           # Reference implementation patterns
│   ├── components/
│   │   ├── SongManagementForm.tsx   # CRITICAL: Form pattern to mirror exactly
│   │   ├── SongManagementModal.tsx  # Modal wrapper pattern
│   │   └── __tests__/               # Test patterns to follow
│   ├── hooks/
│   │   ├── mutations/
│   │   │   ├── useCreateSong.ts     # CRITICAL: Mutation hook pattern
│   │   │   └── useUpdateSong.ts     # Update pattern for future use
│   │   └── useSongs.ts              # Query hook pattern
│   ├── validation/
│   │   ├── schemas/
│   │   │   ├── songFormSchema.ts    # CRITICAL: Schema patterns
│   │   │   └── arrangementSchema.ts # Existing schema to extend
│   │   └── hooks/
│   │       ├── useSlugGeneration.ts # Slug generation patterns
│   │       └── useDuplicateDetection.ts # Validation patterns
│   ├── services/
│   │   └── songService.ts           # CRITICAL: Service layer pattern
│   ├── types/
│   │   └── song.types.ts            # Type definition patterns
│   └── index.ts                     # Public API exports

├── arrangements/                    # Target implementation location
│   └── [TO BE CREATED]              # Complete vertical slice

└── shared/                          # Available utilities
    ├── components/
    │   ├── ui/                      # Reusable UI components
    │   └── notifications/           # Notification system
    ├── hooks/                       # Generic hooks
    └── validation/                  # Shared validation utilities
```

### Vertical Slice Architecture Analysis

**Existing Feature Slices** (proven patterns):
```yaml
src/features/songs/:           # Song management slice (REFERENCE IMPLEMENTATION)
  - types/song.types.ts        # Domain types and interfaces
  - components/                # UI components (forms, modals, cards)
  - hooks/                     # State management and API hooks  
  - services/                  # API communication layer
  - validation/                # Zod schemas and validation logic
  - pages/                     # Route-specific page components
  - index.ts                   # Public API exports

src/features/auth/:            # Authentication slice
  - Similar vertical structure with auth-specific domain logic

src/features/arrangements/:    # Existing arrangement slice (MINIMAL - needs extension)
  - Limited implementation, mostly ChordPro editor focused
```

**Feature Boundary Definition**:
- **This Slice Owns**: Arrangement creation, management, musical metadata validation, arrangement-song relationships
- **Dependencies On Other Slices**: Songs (for parent song data), Auth (for user context), ChordPro editor (for content editing)
- **Shared/Common Code**: UI components from `@shared/components`, validation utilities, notification system
- **Slice Isolation**: Complete arrangement management logic within this slice, minimal external dependencies

### Desired Codebase Tree with Files to be Added

```bash
src/features/arrangements/
├── types/
│   └── arrangement.types.ts         # Complete arrangement domain types, form data types
├── components/
│   ├── ArrangementManagementForm.tsx    # Main form component (mirrors SongManagementForm)
│   ├── ArrangementManagementModal.tsx   # Modal wrapper for form
│   ├── ArrangementList.tsx              # List arrangements for a song
│   ├── ArrangementCard.tsx              # Individual arrangement display
│   └── __tests__/
│       ├── ArrangementManagementForm.test.tsx   # Comprehensive form tests
│       └── ArrangementCard.test.tsx             # Component tests
├── hooks/
│   ├── mutations/
│   │   ├── useCreateArrangement.ts      # Create arrangement mutation
│   │   ├── useUpdateArrangement.ts      # Update arrangement mutation
│   │   └── useArrangementMutations.ts   # Base mutation logic
│   ├── useArrangements.ts               # Query arrangements for song
│   ├── useArrangementManagementModal.ts # Modal state management
│   └── __tests__/
│       └── useCreateArrangement.test.ts # Hook testing
├── services/
│   └── arrangementService.ts           # Supabase integration, CRUD operations
├── validation/
│   ├── schemas/
│   │   └── arrangementFormSchema.ts    # Enhanced schema with musical validation
│   ├── constants/
│   │   └── musicalKeys.ts              # Musical constants (keys, time signatures)
│   └── utils/
│       └── musicalValidation.ts        # Tonal.js integration for key validation
├── pages/
│   └── ArrangementManagementExample.tsx # Example/testing page
└── index.ts                            # Public API exports for arrangements feature
```

### Known Gotchas of our Codebase & Library Quirks

```typescript
// CRITICAL: React 19 + Vite + TypeScript specific requirements
// React 19 requires updated dependency patterns
// 'use client' not needed - we're using Vite, not Next.js
// TypeScript strict mode requires proper typing throughout

// CRITICAL: Supabase integration quirks
// Must handle auth state properly - useAuth hook pattern
// Row Level Security affects all queries - ensure proper user context
// Real-time subscriptions need proper cleanup

// CRITICAL: ChordSheetJS library constraints
// Parser.parse() can throw errors - must wrap in try/catch
// Metadata extraction uses getMetaData() method
// Formatting requires specific formatter classes

// CRITICAL: Form validation patterns
// Must use exact field names from Zod schema
// Error states must match validation error keys
// "Reward Early, Punish Late" pattern required for UX

// CRITICAL: Musical validation requirements
// Key field MUST be required (currently optional in existing schema)
// Tempo validation range 40-240 BPM industry standard
// Time signatures limited to standard formats: 4/4, 3/4, 6/8, etc.
// Tonal.js Key.majorKey() for validation but handle minor keys separately

// CRITICAL: Auto-title generation
// Format MUST be "[Song Name] - [Arrangement Name]"
// User can ONLY edit arrangement name portion
// Real-time update as user types
// Used for navigation and display throughout application
```

## Implementation Blueprint

### Data Models and Structure

Create comprehensive type definitions with musical domain focus:

```typescript
// Enhanced arrangement types with musical validation
interface Arrangement {
  id: string
  name: string                      // User-editable portion only
  song_id: string
  slug: string                     // Auto-generated: song-slug-arrangement-name
  
  // Musical Properties (CRITICAL for transposition)
  key: string                      // REQUIRED - "C", "Am", "F#", etc.
  tempo?: number                   // Optional - BPM (40-240)
  time_signature: string           // Default "4/4"
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  
  // Content Organization
  chord_data?: string              // ChordPro format content
  description?: string             // Optional description
  tags: string[]                   // Max 10 tags, similar to song themes
  
  // Auto-Generated Fields
  auto_generated_title: string     // "[Song Name] - [Arrangement Name]"
  
  // Metadata
  created_by: string
  created_at: string
  updated_at: string
  is_public: boolean
}

// Form-specific types with validation
interface ArrangementFormData {
  name: string
  key: string                      // REQUIRED
  tempo?: number
  timeSignature: string
  difficulty: string
  tags: string[]
  description?: string
  songId: string                   // Parent song reference
}

// Component prop types following existing patterns
interface ArrangementManagementFormProps {
  song: Song                       // Parent song data
  arrangement?: Arrangement        // For editing existing
  onSuccess?: (arrangement: Arrangement) => void
  onCancel?: () => void
  isModal?: boolean
}
```

### Implementation Tasks (ordered by vertical slice completion)

**CRITICAL: Implement complete vertical slice - UI to data layer within feature boundary**

```yaml
Task 1: CREATE src/features/arrangements/types/arrangement.types.ts
  - IMPLEMENT: Complete domain types for arrangement management
  - FOLLOW pattern: src/features/songs/types/song.types.ts (interface structure)
  - DEPENDENCIES: None (foundation layer)
  - NAMING: PascalCase interfaces, camelCase properties
  - PLACEMENT: Within arrangements feature slice types directory
  - SLICE BOUNDARY: All arrangement-related types including forms and API responses
  - CRITICAL: Include musical metadata types, auto-generated title, validation types

Task 2: CREATE src/features/arrangements/validation/schemas/arrangementFormSchema.ts
  - IMPLEMENT: Enhanced Zod schema with musical validation using tonal.js
  - FOLLOW pattern: src/features/songs/validation/schemas/songFormSchema.ts (validation structure)
  - DEPENDENCIES: Task 1 types, tonal.js library for musical validation
  - ENHANCEMENT: Extend existing arrangementSchema.ts with required key field and musical constraints
  - PLACEMENT: Within arrangements feature slice validation directory
  - SLICE BOUNDARY: All arrangement-specific validation logic
  - CRITICAL: Key field REQUIRED, tempo range 40-240, auto-title generation validation

Task 3: CREATE src/features/arrangements/validation/constants/musicalKeys.ts
  - IMPLEMENT: Musical constants for keys, time signatures, difficulty levels
  - FOLLOW pattern: src/features/songs/validation/constants/sources.ts (constant definition)
  - DEPENDENCIES: Task 2 schema requirements
  - MUSICAL: Standard musical keys (C, C#, Dm, etc.), time signatures (4/4, 3/4, 6/8)
  - PLACEMENT: Within arrangements feature slice constants directory
  - SLICE BOUNDARY: Musical domain constants specific to arrangements
  - CRITICAL: Comprehensive key list for validation, standard time signatures

Task 4: CREATE src/features/arrangements/services/arrangementService.ts
  - IMPLEMENT: Complete Supabase integration for arrangement CRUD operations
  - FOLLOW pattern: src/features/songs/services/songService.ts (service structure, caching)
  - DEPENDENCIES: Task 1 types, Supabase client, authentication
  - INTEGRATION: Supabase arrangements table, user authentication, slug generation
  - PLACEMENT: Within arrangements feature slice services directory
  - SLICE BOUNDARY: All arrangement data access and API communication
  - CRITICAL: Auto-title generation, proper error handling, cache management

Task 5: CREATE src/features/arrangements/hooks/mutations/useCreateArrangement.ts
  - IMPLEMENT: Optimistic mutation hook for arrangement creation
  - FOLLOW pattern: src/features/songs/hooks/mutations/useCreateSong.ts (mutation structure)
  - DEPENDENCIES: Task 4 service, Task 2 validation, notification system
  - OPTIMIZATION: React 19 useOptimistic for immediate UI feedback
  - PLACEMENT: Within arrangements feature slice hooks/mutations directory
  - SLICE BOUNDARY: Arrangement creation state management and side effects
  - CRITICAL: Optimistic updates, proper error handling, cache invalidation

Task 6: CREATE src/features/arrangements/hooks/useArrangementManagementModal.ts
  - IMPLEMENT: Modal state management for arrangement forms
  - FOLLOW pattern: src/features/songs/hooks/useSongManagementModal.ts (modal hook pattern)
  - DEPENDENCIES: Task 1 types, React state management
  - MODAL: Open/close state, arrangement selection, form mode management
  - PLACEMENT: Within arrangements feature slice hooks directory
  - SLICE BOUNDARY: Modal state specific to arrangement management
  - CRITICAL: Clean state management, proper cleanup, type safety

Task 7: CREATE src/features/arrangements/components/ArrangementManagementForm.tsx
  - IMPLEMENT: Complete form component mirroring SongManagementForm
  - FOLLOW pattern: src/features/songs/components/SongManagementForm.tsx (EXACT structure)
  - DEPENDENCIES: Task 1 types, Task 2 validation, Task 5 mutations, shared UI components
  - FEATURES: Musical metadata input, auto-title preview, tag management, validation
  - PLACEMENT: Within arrangements feature slice components directory
  - SLICE BOUNDARY: Arrangement-specific form UI and interaction logic
  - CRITICAL: Musical key required field, auto-title generation, ChordPro navigation

Task 8: CREATE src/features/arrangements/components/ArrangementManagementModal.tsx
  - IMPLEMENT: Modal wrapper for arrangement form
  - FOLLOW pattern: src/features/songs/components/SongManagementModal.tsx (modal wrapper)
  - DEPENDENCIES: Task 7 form component, Task 6 modal hook, shared modal components
  - MODAL: Responsive modal with form integration, proper accessibility
  - PLACEMENT: Within arrangements feature slice components directory
  - SLICE BOUNDARY: Modal presentation layer for arrangement management
  - CRITICAL: Proper focus management, escape handling, responsive design

Task 9: CREATE src/features/arrangements/components/__tests__/ArrangementManagementForm.test.tsx
  - IMPLEMENT: Comprehensive test coverage for arrangement form
  - FOLLOW pattern: src/features/songs/components/__tests__/SongManagementForm.test.tsx
  - DEPENDENCIES: All previous tasks, Vitest testing infrastructure
  - COVERAGE: Form rendering, validation, submission, musical constraints
  - PLACEMENT: Within arrangements feature slice test directory
  - SLICE BOUNDARY: Isolated testing of arrangement form functionality
  - CRITICAL: Musical validation tests, auto-title generation, ChordPro integration

Task 10: CREATE src/features/arrangements/index.ts
  - IMPLEMENT: Public API exports for arrangements feature slice
  - FOLLOW pattern: src/features/songs/index.ts (selective exports)
  - DEPENDENCIES: All components, hooks, types, services from previous tasks
  - EXPORTS: Public interfaces, components, hooks for other features to import
  - PLACEMENT: Root of arrangements feature slice directory
  - SLICE BOUNDARY: Define external interface of arrangements feature
  - CRITICAL: Clean API, no internal implementation details exposed

Task 11: UPDATE src/features/songs/components/SongDetailPage.tsx
  - IMPLEMENT: Integration of arrangement management into song detail view
  - FOLLOW pattern: Existing song detail page structure
  - DEPENDENCIES: Task 10 arrangement exports, existing song page components
  - INTEGRATION: Add arrangement list, create arrangement button, modal triggers
  - PLACEMENT: External to arrangements slice - song slice modification
  - SLICE BOUNDARY: Cross-slice integration point
  - CRITICAL: Proper import from arrangements public API, seamless UX flow
```

### Implementation Patterns & Key Details

```typescript
// ArrangementManagementForm component pattern - CRITICAL implementation
interface ArrangementManagementFormProps {
  song: Song                       // Parent song context
  arrangement?: Arrangement        // For editing existing
  onSuccess?: (arrangement: Arrangement) => void
  onCancel?: () => void
  isModal?: boolean
}

interface ArrangementFormState {
  name: string                     // Only editable part of title
  key: string                      // REQUIRED for transposition
  tempo: string                    // String for form input
  timeSignature: string            // Default "4/4"
  difficulty: string               // Required selection
  tags: string[]                   // Max 10 tags
  description: string              // Optional
}

export function ArrangementManagementForm({ 
  song, 
  arrangement, 
  onSuccess, 
  onCancel, 
  isModal = false 
}: ArrangementManagementFormProps) {
  // PATTERN: Exact state management from SongManagementForm
  const [formState, setFormState] = useState<ArrangementFormState>({
    name: arrangement?.name || '',
    key: arrangement?.key || '',
    tempo: arrangement?.tempo?.toString() || '',
    timeSignature: arrangement?.time_signature || '4/4',
    difficulty: arrangement?.difficulty || '',
    tags: arrangement?.tags || [],
    description: arrangement?.description || ''
  })
  
  // CRITICAL: Auto-generated title computation
  const autoGeneratedTitle = useMemo(() => {
    if (!song?.title || !formState.name.trim()) return ''
    return `${song.title} - ${formState.name.trim()}`
  }, [song?.title, formState.name])
  
  // PATTERN: Field change handler (exact from SongManagementForm)
  const handleFieldChange = (field: keyof ArrangementFormState, value: string | string[]) => {
    setFormState(prev => ({ ...prev, [field]: value }))
    setValidationErrors(prev => ({ ...prev, [field]: undefined }))
  }
  
  // PATTERN: Form validation using Zod schema
  const validateForm = (): boolean => {
    const dataToValidate = {
      name: formState.name,
      key: formState.key,
      tempo: formState.tempo ? parseInt(formState.tempo) : undefined,
      timeSignature: formState.timeSignature,
      difficulty: formState.difficulty,
      tags: formState.tags,
      description: formState.description || undefined,
      songId: song.id
    }
    
    const result = arrangementFormSchema.safeParse(dataToValidate)
    // Handle validation errors...
  }
  
  // CRITICAL: Navigation to ChordPro editor after creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    
    try {
      const newArrangement = await createArrangement(formData)
      
      // Generate ChordPro template and navigate
      const template = generateChordProTemplate(newArrangement, song)
      sessionStorage.setItem(`chordpro-template-${newArrangement.id}`, template)
      
      onSuccess?.(newArrangement)
      
      // Navigate to ChordPro editor
      router.push(`/arrangements/${newArrangement.id}/edit?prefill=true`)
    } catch (error) {
      // Error handling...
    }
  }
}

// Enhanced Zod schema with musical validation
export const arrangementFormSchema = z.object({
  name: z.string()
    .min(1, 'Arrangement name is required')
    .max(100, 'Arrangement name must be less than 100 characters')
    .trim(),
  
  // CRITICAL: Required key field for transposition
  key: z.enum(MUSICAL_KEYS as readonly [string, ...string[]])
    .describe('Musical key is required for transposition'),
  
  tempo: z.number()
    .min(40, 'Tempo must be at least 40 BPM')
    .max(240, 'Tempo must be less than 240 BPM')
    .int('Tempo must be a whole number')
    .optional(),
  
  timeSignature: z.enum(TIME_SIGNATURES as readonly [string, ...string[]])
    .default('4/4'),
  
  difficulty: z.enum(DIFFICULTY_LEVELS as readonly [string, ...string[]])
    .describe('Please select a difficulty level'),
  
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .default([]),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform(val => val && val.length > 0 ? val : undefined),
  
  songId: z.string().uuid('Invalid song ID')
})

// Service layer with Supabase integration
export const arrangementService = {
  async createArrangement(data: ArrangementFormData): Promise<Arrangement> {
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) throw new Error('Authentication required')
    
    // Generate auto-title and slug
    const autoGeneratedTitle = `${song.title} - ${data.name}`
    const slug = await generateArrangementSlug(data.name, data.songId)
    
    const arrangementData = {
      name: data.name.trim(),
      song_id: data.songId,
      slug,
      key: data.key,                    // REQUIRED field
      tempo: data.tempo || null,
      time_signature: data.timeSignature || '4/4',
      difficulty: data.difficulty,
      description: data.description || null,
      tags: data.tags || [],
      created_by: user.user.id,
      is_public: false
    }
    
    const { data: arrangement, error } = await supabase
      .from('arrangements')
      .insert(arrangementData)
      .select('*, song:songs(title, artist)')
      .single()
    
    if (error) throw error
    
    return mapSupabaseArrangementToArrangement(arrangement)
  }
}

// React 19 optimistic updates pattern
export function useOptimisticArrangements(songId: string) {
  const { data: arrangements = [] } = useArrangements(songId)
  const [optimisticArrangements, addOptimisticArrangement] = useOptimistic(
    arrangements,
    (state, newArrangement: Arrangement) => [
      ...state,
      { ...newArrangement, id: `temp-${Date.now()}` }
    ]
  )
  
  // Immediate UI feedback with optimistic updates
  const createArrangementOptimistic = useCallback((formData: ArrangementFormData) => {
    const optimisticArr = {
      ...formData,
      id: `temp-${Date.now()}`,
      auto_generated_title: `${song.title} - ${formData.name}`,
      created_at: new Date().toISOString()
    }
    
    addOptimisticArrangement(optimisticArr)
    return createArrangement(formData)
  }, [song, createArrangement, addOptimisticArrangement])
  
  return {
    arrangements: optimisticArrangements,
    createArrangement: createArrangementOptimistic
  }
}
```

### Integration Points & Cross-Slice Dependencies

**CRITICAL: Minimize cross-slice dependencies to maintain architectural boundaries**

```yaml
WITHIN SLICE (Self-contained):
  - All arrangement domain logic and types
  - Arrangement-specific validation schemas and musical constraints
  - Arrangement-specific UI components and forms
  - Arrangement CRUD operations and caching
  - Arrangement-specific state management hooks

SHARED/COMMON DEPENDENCIES (Allowed):
  - src/shared/components/ui/ - Form inputs, buttons, modals
  - src/shared/hooks/ - Generic hooks (useNotification, etc.)
  - src/shared/validation/ - Base validation utilities
  - src/lib/supabase.ts - Database client
  - src/lib/utils.ts - Generic utility functions

CROSS-SLICE DEPENDENCIES (Minimize & Make Explicit):
  - @features/songs - Import Song type and useSongs hook (via public API only)
  - @features/auth - Import useAuth hook for user context (via public API only)
  - @features/arrangements - ChordPro editor navigation (existing arrangement slice)

EXTERNAL LIBRARY DEPENDENCIES:
  - tonal.js - Musical key validation and music theory operations
  - react-hook-form - Form state management and validation integration
  - zod - Schema validation with TypeScript integration
  - react-router-dom - Navigation to ChordPro editor after creation

DATABASE INTEGRATION:
  - arrangements table - CRUD operations via Supabase
  - songs table - Reference for auto-title generation
  - users table - Created by relationship and permissions

CHORDPRO EDITOR INTEGRATION:
  - sessionStorage - Store generated ChordPro template for editor pickup
  - Route navigation - Direct to /arrangements/:id/edit with prefill parameter
  - Metadata pre-fill - Generate ChordPro directives from arrangement metadata
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint                    # ESLint checks with TypeScript rules
npx tsc --noEmit               # TypeScript type checking (no JS output)
npm run format                 # Prettier formatting

# Project-wide validation  
npm run lint:fix               # Auto-fix linting issues
npm run type-check             # Full TypeScript validation

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test each component/hook as it's created
npm test -- __tests__/ArrangementManagementForm.test.tsx
npm test -- __tests__/useCreateArrangement.test.ts

# Test arrangement-specific functionality
npm test -- src/features/arrangements/components/
npm test -- src/features/arrangements/hooks/
npm test -- src/features/arrangements/validation/

# Coverage validation for arrangement slice
npm test -- --coverage --testPathPattern=arrangements --watchAll=false

# Expected: All tests pass with >90% coverage. If failing, debug and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Development server validation
npm run dev &
sleep 5  # Allow Vite startup time

# Test arrangement creation workflow
curl -I http://localhost:3000/songs/test-song-id
# Expected: 200 OK response with song detail page

# Test ChordPro editor navigation
curl -I http://localhost:3000/arrangements/test-arrangement-id/edit
# Expected: 200 OK response with ChordPro editor

# Production build validation
npm run build
# Expected: Successful build with no TypeScript errors, proper tree-shaking

# Vite preview validation
npm run preview &
sleep 3
curl -I http://localhost:4173/songs/test-song-id
# Expected: Production build serves correctly

# Expected: All integrations working, no hydration errors, proper routing
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Musical Validation (Critical for arrangement management):

# Validate musical key constraints
node -e "
const { Key } = require('tonal');
const keys = ['C', 'Am', 'F#', 'Bb', 'Invalid'];
keys.forEach(k => {
  try {
    const result = Key.majorKey(k.replace('m', ''));
    console.log(k + ': ' + (result.keySignature !== undefined ? 'VALID' : 'INVALID'));
  } catch(e) {
    console.log(k + ': INVALID');
  }
});
"
# Expected: C: VALID, Am: VALID, F#: VALID, Bb: VALID, Invalid: INVALID

# Test ChordPro metadata generation
node -e "
const arrangement = { name: 'Piano Version', key: 'C', tempo: 120 };
const song = { title: 'Amazing Grace', artist: 'John Newton' };
const template = [
  '{title: ' + song.title + ' - ' + arrangement.name + '}',
  '{artist: ' + song.artist + '}',
  '{key: ' + arrangement.key + '}',
  '{tempo: ' + arrangement.tempo + '}'
].join('\n');
console.log('Generated ChordPro Template:');
console.log(template);
"
# Expected: Proper ChordPro format with correct metadata directives

# Vertical Slice Architecture Validation:
# Check arrangement slice isolation
find src/features/arrangements -name "*.ts" -o -name "*.tsx" | \
  xargs grep -l "from.*features/[^arrangements]" | \
  grep -v "from.*features/songs" | \
  grep -v "from.*features/auth"
# Expected: No unauthorized cross-slice imports (only songs and auth allowed)

# Validate slice completeness
ls -la src/features/arrangements/
# Expected: types/, components/, hooks/, services/, validation/, index.ts

# Check circular dependencies within slice
npx madge --circular --extensions ts,tsx src/features/arrangements
# Expected: No circular dependencies

# Test musical validation in isolation
npm test -- --testNamePattern="musical.*validation" --verbose
# Expected: All musical validation tests pass (key validation, tempo ranges)

# Test auto-title generation
npm test -- --testNamePattern="auto.*title" --verbose  
# Expected: Title generation follows "[Song Name] - [Arrangement Name]" format

# Test ChordPro integration
npm test -- --testNamePattern="chordpro.*integration" --verbose
# Expected: ChordPro editor navigation and template generation work correctly

# Form validation patterns
npm test -- --testNamePattern="form.*validation" --verbose
# Expected: "Reward early, punish late" validation pattern implemented correctly

# Database constraint validation (if running against test DB)
psql -d test_db -c "
INSERT INTO arrangements (name, song_id, key, difficulty, created_by) 
VALUES ('Test', 'valid-song-id', NULL, 'beginner', 'user-id');
"
# Expected: ERROR - key field cannot be null (validates required constraint)

# React 19 optimistic updates validation
npm test -- --testNamePattern="optimistic.*update" --verbose
# Expected: useOptimistic hook properly handles immediate UI feedback

# Expected: Complete vertical slice functionality, all musical constraints validated
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- src/features/arrangements`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No formatting issues: `npm run format --check`
- [ ] Production build succeeds: `npm run build`

### Feature Validation

- [ ] Arrangement creation form renders with all required musical fields
- [ ] Musical key field is required and validates against standard keys using tonal.js
- [ ] Auto-generated title follows "[Song Name] - [Arrangement Name]" format exactly
- [ ] Tempo validation enforces 40-240 BPM range
- [ ] Time signature defaults to "4/4" with standard options
- [ ] Difficulty selection required with beginner/intermediate/advanced options
- [ ] Tag management supports up to 10 tags with autocomplete
- [ ] Form validation follows "reward early, punish late" pattern
- [ ] Successful creation navigates to ChordPro editor with pre-filled metadata
- [ ] ChordPro template includes {title}, {key}, {tempo}, {artist} directives
- [ ] Arrangements display in song detail page with musical information
- [ ] Manual testing successful: Create arrangement → Navigate to editor → Verify metadata

### Musical Domain Validation

- [ ] Musical key validation using tonal.js Key.majorKey() works correctly
- [ ] All standard musical keys supported (C, C#, Dm, Bb, etc.)
- [ ] Tempo range validation prevents invalid BPM values
- [ ] Time signature options include common formats (4/4, 3/4, 6/8, 2/4)
- [ ] Auto-title generation handles special characters in song/arrangement names
- [ ] ChordPro metadata directives format correctly for parser compatibility

### Code Quality Validation

- [ ] Follows existing SongManagementForm patterns exactly
- [ ] File placement matches desired vertical slice structure
- [ ] **Vertical slice architecture maintained**: Feature is self-contained and complete
- [ ] **Cross-slice dependencies minimized**: Only imports from songs/auth public APIs
- [ ] **Slice boundaries respected**: No direct imports from other slice internals
- [ ] Anti-patterns avoided (no hardcoded values, proper error handling)
- [ ] TypeScript strict mode compliance throughout
- [ ] React 19 useOptimistic pattern implemented for immediate UI feedback

### React 19 + TypeScript + Vite Specific

- [ ] Proper TypeScript interfaces with musical domain types
- [ ] React 19 useOptimistic hook used for optimistic updates
- [ ] Form state management follows React Hook Form patterns
- [ ] Zod schema integration with TypeScript type inference
- [ ] Vite build optimization maintains proper code splitting
- [ ] No hydration mismatches in development vs production

### Documentation & Integration

- [ ] Code is self-documenting with clear TypeScript types
- [ ] Component props interfaces properly documented
- [ ] Musical domain concepts clearly defined in types
- [ ] Integration with ChordPro editor documented and tested
- [ ] Database schema changes documented (if any)

---

## Anti-Patterns to Avoid

**General Anti-Patterns:**
- ❌ Don't create new patterns when existing song patterns work perfectly
- ❌ Don't skip musical validation - key field MUST be required
- ❌ Don't hardcode musical constants - use proper enums and validation
- ❌ Don't ignore ChordPro integration - seamless workflow is critical
- ❌ Don't bypass auto-title generation - user expects consistent naming

**Vertical Slice Architecture Anti-Patterns:**
- ❌ Don't import directly from songs/auth internals - use public APIs only
- ❌ Don't put arrangement logic in songs slice - maintain clear boundaries
- ❌ Don't create incomplete slice missing validation, tests, or service layer
- ❌ Don't violate musical domain integrity - keep music logic within arrangements
- ❌ Don't bypass slice's public API when importing from other features

**Musical Domain Anti-Patterns:**
- ❌ Don't make key field optional - transposition requires key information
- ❌ Don't accept invalid musical keys - validate with tonal.js
- ❌ Don't ignore tempo ranges - musical software has industry standards
- ❌ Don't format ChordPro incorrectly - follow specification exactly
- ❌ Don't skip auto-title generation - "[Song] - [Arrangement]" format required

**React 19 + TypeScript Anti-Patterns:**
- ❌ Don't skip useOptimistic for immediate feedback - users expect instant response
- ❌ Don't ignore TypeScript strict mode - maintain type safety throughout
- ❌ Don't use any types - proper musical domain typing is critical
- ❌ Don't skip Zod validation - form validation prevents bad data
- ❌ Don't ignore error boundaries - graceful error handling required

---

**Confidence Score: 9/10** - Comprehensive context provided with existing patterns, musical domain expertise, modern React patterns, and complete validation strategy. Success probability very high with one-pass implementation using this PRP.