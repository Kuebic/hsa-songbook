# Complete Supabase Migration for HSA Songbook

**Feature Goal**: Transform HSA Songbook from MongoDB/Express backend to Supabase, eliminating backend server while gaining real-time features, better performance, and serverless deployment.

**Deliverable**: Complete migration of data layer, authentication, and API services to Supabase with maintained feature parity and enhanced capabilities.

**Success Definition**: 
- All existing features work identically 
- Zero data loss during migration
- Improved performance and real-time capabilities
- Successful deployment to Vercel with $0/month cost
- Complete test coverage validation

## User Persona

**Target User**: HSA Songbook users (worship teams, music directors, musicians)

**Use Case**: Continue using all existing features (song management, arrangements, setlists, ChordPro editing) with improved performance and real-time collaboration

**User Journey**: 
1. Log in with existing Google/GitHub accounts (seamless auth migration)
2. Access all existing songs, arrangements, and setlists
3. Experience faster loading and real-time updates
4. Create and edit content with optimistic updates

**Pain Points Addressed**: 
- Slow API responses from Express backend
- No real-time collaboration features
- Complex backend maintenance and deployment
- High hosting costs for separate backend

## Why

- **Cost Reduction**: Eliminate Express server hosting costs ($30-50/month → $0/month)
- **Performance**: Direct Supabase queries faster than Express API layer
- **Real-time Features**: Live collaboration, instant updates across devices
- **Developer Experience**: Auto-generated TypeScript types, better debugging
- **Scalability**: Supabase handles scaling automatically
- **Maintenance**: No more backend server to maintain, deploy, or debug

## What

Transform the complete data layer from MongoDB/Express to Supabase PostgreSQL while maintaining all existing functionality:

### Core Migrations Required

1. **Database Schema**: MongoDB collections → PostgreSQL tables with proper relations
2. **Authentication**: Clerk integration → Supabase Auth 
3. **API Layer**: Express endpoints → Direct Supabase queries
4. **Real-time Features**: Add live updates for collaborative editing
5. **Data Migration**: Transfer all existing songs, arrangements, setlists
6. **Service Layer**: Update all React Query hooks to use Supabase

### Success Criteria

- [ ] All 6 core features migrated (songs, arrangements, setlists, auth, pwa, monitoring)
- [ ] Zero data loss - all existing content preserved
- [ ] Performance improvement: Page loads <2s (currently 3-5s)
- [ ] Real-time collaboration working
- [ ] All tests passing
- [ ] Production deployment successful
- [ ] Frontend-only deployment to Vercel working

## All Needed Context

### Context Completeness Check

_This PRP provides comprehensive context for migrating a mature React/TypeScript application from MongoDB/Express to Supabase, including existing patterns, vertical slice architecture, data models, and migration strategies._

### Documentation & References

```yaml
# CRITICAL SUPABASE DOCUMENTATION
- url: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
  why: React integration patterns, auth setup, client configuration
  critical: Proper TypeScript integration and environment setup

- url: https://supabase.com/docs/guides/database/postgres/row-level-security
  why: Security model for protecting user data and implementing permissions
  critical: RLS policies prevent unauthorized access and data breaches

- url: https://supabase.com/docs/guides/api/rest/generating-types  
  why: Auto-generate TypeScript types from database schema
  critical: Type safety and development experience improvements

- url: https://supabase.com/blog/migrating-mongodb-data-api-with-supabase
  why: Official MongoDB to PostgreSQL migration strategies
  critical: Data transformation patterns and migration scripts

- url: https://tanstack.com/query/v5/docs/react/guides/optimistic-updates
  why: React Query optimistic update patterns for Supabase integration
  critical: Maintaining smooth UX during backend transition

# CURRENT CODEBASE PATTERNS
- file: src/features/songs/services/songService.ts
  why: Current Express API patterns that need Supabase conversion
  pattern: Service layer with error handling, auth tokens, retry logic
  gotcha: Uses Clerk tokens for auth, MongoDB ObjectIds for references

- file: src/features/songs/hooks/mutations/useSongMutations.ts  
  why: React Query mutation patterns with optimistic updates
  pattern: onMutate/onError/onSuccess lifecycle with rollback
  gotcha: Uses React 19 useOptimistic, offline queue integration

- file: src/features/arrangements/services/EditorStorageService.ts
  why: IndexedDB storage patterns for large ChordPro content
  pattern: 3-tier storage with compression (memory → session → IndexedDB)
  gotcha: LZ-String compression must be replaced with PostgreSQL TOAST

- file: PRPs/ai_docs/mongodb_express_integration.md
  why: Complete current backend patterns and authentication flow
  section: All sections - shows exact Express patterns to replace
  
- file: PRPs/ai_docs/react-query-v5-patterns.md
  why: Advanced React Query patterns for optimistic updates with Supabase
  section: Sections 1-8 for optimistic updates, offline support, invalidation

- file: PRPs/ai_docs/react-query-optimistic-updates.md
  why: Existing optimistic update patterns to maintain during migration
  section: Mutation lifecycle, multi-cache updates, error handling
```

### Current Codebase Tree (Core Features)

```bash
src/features/
├── songs/               # Song domain slice
│   ├── types/           # Song, SongMetadata interfaces
│   ├── components/      # SongList, SongForm, SongCard, etc.
│   ├── hooks/           # useSongs, useSongMutations (React Query)
│   ├── services/        # songService.ts (Express API calls)
│   ├── pages/           # SongListPage, SongDetailPage
│   └── validation/      # Zod schemas
├── arrangements/        # ChordPro editor slice  
│   ├── types/           # Arrangement, ChordProContent interfaces
│   ├── components/      # ChordProEditor, ArrangementViewer
│   ├── hooks/           # useArrangements, useArrangementMutations
│   ├── services/        # arrangementService.ts, EditorStorageService.ts
│   └── pages/           # ArrangementEditPage
├── setlists/           # Playlist management slice
│   ├── types/           # Setlist, SetlistItem interfaces
│   ├── components/      # SetlistBuilder, SetlistPlayer
│   ├── hooks/           # useSetlists, useSetlistMutations (optimistic)
│   ├── services/        # setlistService.ts
│   └── pages/           # SetlistPage, SetlistPlayerPage
├── auth/               # Clerk authentication slice
│   ├── hooks/           # useAuth (wraps Clerk)
│   ├── components/      # ProtectedRoute, SignInButton
│   └── types/           # User, AuthState interfaces
├── pwa/                # Progressive Web App slice
│   └── services/        # Service worker, offline support
└── monitoring/         # Error tracking slice
    └── services/        # Error boundary, performance monitoring
```

### Vertical Slice Architecture Analysis

**Existing Feature Slices** (maintain during migration):
```yaml
src/features/songs/:     # Song management slice
  - types/song.types.ts  # Domain types (Song, SongMetadata, SongFormData)
  - components/          # UI components (SongList, SongForm, SongCard)
  - hooks/              # State and API hooks (useSongs, useSongMutations)
  - services/           # API communication (songService.ts → replace with Supabase)
  - pages/              # Route-specific pages (SongListPage, SongDetailPage)

src/features/arrangements/: # ChordPro editor slice  
  - types/arrangement.types.ts # Arrangement, ChordProContent interfaces
  - components/ChordProEditor/ # Complex editor with syntax highlighting
  - services/EditorStorageService.ts # IndexedDB + compression → replace with Supabase
  - hooks/mutations/     # useArrangementMutations (optimistic updates)

src/features/setlists/:  # Setlist management slice
  - types/setlist.types.ts # Setlist, SetlistItem interfaces
  - components/SetlistBuilder/ # Drag-and-drop with @dnd-kit
  - hooks/mutations/     # Sophisticated optimistic update patterns
  - services/setlistService.ts # Complex API layer → replace with Supabase
```

**Feature Boundary Definition**:
- **Songs Slice Owns**: Song CRUD, metadata, themes, search, ratings
- **Arrangements Slice Owns**: ChordPro editing, storage, transposition, printing
- **Setlists Slice Owns**: Playlist creation, ordering, sharing, playback
- **Dependencies**: Minimal cross-slice - arrangements reference songs, setlists reference arrangements
- **Shared/Common Code**: src/shared/components/ui/, src/shared/utils/, src/shared/types/
- **Slice Isolation**: Each feature can be deployed independently, services contained within slice

### Desired Codebase Tree (Post-Migration)

```bash
src/features/{feature}/
├── types/
│   └── {domain}.types.ts        # Updated with Supabase UUID types
├── components/
│   ├── {ComponentName}.tsx      # Same components, updated hooks
│   └── __tests__/               # Updated tests for Supabase patterns
├── hooks/
│   ├── use{DomainQuery}.ts      # NEW: Direct Supabase queries
│   ├── use{DomainMutation}.ts   # UPDATED: Supabase mutations with optimistic updates
│   └── __tests__/               # Updated hook tests
├── services/
│   └── {domain}SupabaseService.ts # NEW: Replace Express service with Supabase
├── pages/
│   └── {FeaturePage}.tsx        # Same pages, updated data fetching
└── index.ts                     # Updated exports

# NEW FILES
src/lib/
├── supabase.ts                  # Supabase client configuration
├── database.types.ts            # Auto-generated types from schema  
└── migrations/                  # SQL migration scripts

# MIGRATION SUPPORT
scripts/
├── migrate-to-supabase.ts       # Data migration script
└── validate-migration.ts       # Data integrity verification
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Current Clerk Auth Token Pattern
// All services use: const token = await getToken()
// Must be replaced with: supabase.auth.session()

// CRITICAL: MongoDB ObjectId References  
// Current: { songId: ObjectId, arrangementId: ObjectId }
// Supabase: { song_id: UUID, arrangement_id: UUID }

// CRITICAL: LZ-String Compression in EditorStorageService
// Current: compress(chordData) → IndexedDB
// Supabase: Store as TEXT, PostgreSQL TOAST handles compression automatically

// CRITICAL: React Query Key Factories
// All queries use factories like setlistKeys.detail(id) 
// Must maintain same patterns for cache invalidation

// CRITICAL: Optimistic Updates with React 19 useOptimistic
// Songs feature uses React 19 patterns - maintain during migration
// Must integrate with Supabase's real-time subscriptions

// CRITICAL: Offline Queue System 
// Current: localStorage queue → Express API
// Supabase: Queue → Supabase client (automatic retry)

// CRITICAL: Vite Environment Variables
// Must use VITE_ prefix: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

## Implementation Blueprint

### Data Models and Structure

Create PostgreSQL schema that maps to existing TypeScript interfaces while improving relations:

```sql
-- 1. Users table (replace Clerk user management)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Songs table (from MongoDB songs collection)
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  slug TEXT UNIQUE NOT NULL,
  composition_year INTEGER CHECK (composition_year >= 1000),
  ccli TEXT,
  themes TEXT[], -- PostgreSQL array type
  source TEXT,
  notes TEXT,
  default_arrangement_id UUID, -- Foreign key added later
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false,
  rating_average DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Arrangements table (from MongoDB arrangements collection)
CREATE TABLE arrangements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  chord_data TEXT NOT NULL, -- ChordPro content, TOAST compression automatic
  key TEXT CHECK (key IN ('C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B')),
  tempo INTEGER CHECK (tempo BETWEEN 40 AND 240),
  time_signature TEXT DEFAULT '4/4',
  difficulty TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  description TEXT,
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add foreign key constraint for default arrangement
ALTER TABLE songs 
ADD CONSTRAINT fk_songs_default_arrangement 
FOREIGN KEY (default_arrangement_id) REFERENCES arrangements(id);

-- 5. Setlists table
CREATE TABLE setlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false,
  share_id TEXT UNIQUE, -- For public sharing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Setlist items junction table
CREATE TABLE setlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id UUID REFERENCES setlists(id) ON DELETE CASCADE,
  arrangement_id UUID REFERENCES arrangements(id),
  position INTEGER NOT NULL,
  notes TEXT,
  UNIQUE(setlist_id, position)
);

-- 7. Reviews table  
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(song_id, user_id)
);

-- Performance indexes
CREATE INDEX idx_songs_slug ON songs(slug);
CREATE INDEX idx_songs_themes ON songs USING GIN(themes);
CREATE INDEX idx_arrangements_song_id ON arrangements(song_id);
CREATE INDEX idx_setlist_items_setlist_id ON setlist_items(setlist_id);
CREATE INDEX idx_songs_search ON songs USING GIN(to_tsvector('english', title || ' ' || COALESCE(artist, '')));
```

### Implementation Tasks (Ordered by Vertical Slice Completion)

**CRITICAL: Implement complete vertical slice migration - maintain feature boundaries**

```yaml
Task 1: CREATE src/lib/supabase.ts + database.types.ts
  - IMPLEMENT: Supabase client setup with TypeScript integration
  - FOLLOW pattern: Environment variables with VITE_ prefix for Vite compatibility
  - NAMING: supabase client export, Database type from generated schema
  - PLACEMENT: src/lib/ for shared infrastructure
  - SLICE BOUNDARY: Shared dependency for all feature slices
  - VALIDATION: npm run build should generate types successfully

Task 2: CREATE PostgreSQL schema in Supabase
  - IMPLEMENT: Complete database schema with RLS policies
  - FOLLOW pattern: UUID primary keys, proper foreign key constraints
  - DEPENDENCIES: Users table must be created first, then songs, arrangements, setlists
  - SLICE BOUNDARY: Database foundation for all feature slices
  - PLACEMENT: Supabase SQL Editor or migration script
  - VALIDATION: Schema creation and RLS policies applied

Task 3: MIGRATE src/features/auth/ slice to Supabase Auth
  - IMPLEMENT: Replace Clerk with Supabase Auth hooks and components
  - FOLLOW pattern: src/features/auth/hooks/useAuth.ts (maintain same interface)
  - DEPENDENCIES: Import Supabase client from Task 1
  - SLICE BOUNDARY: Auth slice owns all authentication logic
  - PLACEMENT: Within auth feature slice directory
  - VALIDATION: Login/logout flows work, protected routes enforce auth

Task 4: UPDATE src/features/songs/ slice for Supabase
  - IMPLEMENT: Replace songService.ts with Supabase queries
  - FOLLOW pattern: src/features/songs/services/songService.ts (maintain same interface)
  - DEPENDENCIES: Import types from Task 1, auth from Task 3
  - SLICE BOUNDARY: Songs slice owns all song-related data operations
  - PLACEMENT: Within songs feature slice directory
  - VALIDATION: All song CRUD operations work, optimistic updates maintained

Task 5: UPDATE src/features/arrangements/ slice for Supabase  
  - IMPLEMENT: Replace arrangement services with Supabase, remove LZ-String compression
  - FOLLOW pattern: src/features/arrangements/services/ (service structure, error handling)
  - DEPENDENCIES: Import types from Task 1, songs relationship from Task 4
  - SLICE BOUNDARY: Arrangements slice owns ChordPro data and editor state
  - PLACEMENT: Within arrangements feature slice directory
  - VALIDATION: ChordPro editing works, auto-save uses Supabase, no compression issues

Task 6: UPDATE src/features/setlists/ slice for Supabase
  - IMPLEMENT: Replace setlist services with Supabase, maintain optimistic updates
  - FOLLOW pattern: src/features/setlists/hooks/mutations/ (optimistic update patterns)
  - DEPENDENCIES: Import arrangements from Task 5, auth from Task 3
  - SLICE BOUNDARY: Setlists slice owns playlist logic and arrangement ordering
  - PLACEMENT: Within setlists feature slice directory  
  - VALIDATION: Drag-and-drop reordering works, sharing functionality maintained

Task 7: CREATE data migration script
  - IMPLEMENT: MongoDB to Supabase data transfer with validation
  - FOLLOW pattern: PRPs/ai_docs/mongodb_express_integration.md (current data patterns)
  - DEPENDENCIES: All schema from Task 2, Supabase client from Task 1
  - SLICE BOUNDARY: Cross-cutting data migration utility
  - PLACEMENT: scripts/migrate-to-supabase.ts
  - VALIDATION: All existing data transferred with integrity checks

Task 8: ADD real-time subscriptions
  - IMPLEMENT: Supabase real-time for collaborative editing
  - FOLLOW pattern: PRPs/ai_docs/react-query-v5-patterns.md (real-time sync patterns)
  - DEPENDENCIES: All feature slices from Tasks 4-6 completed
  - SLICE BOUNDARY: Real-time functionality within each relevant slice
  - PLACEMENT: Within individual feature slice hooks
  - VALIDATION: Real-time updates work across browser tabs

Task 9: UPDATE all tests for Supabase patterns
  - IMPLEMENT: Update test mocks and patterns for Supabase
  - FOLLOW pattern: src/features/*/components/__tests__/ (existing test structure)
  - COVERAGE: Test complete vertical slice functionality with Supabase
  - SLICE BOUNDARY: Tests within each feature slice test in isolation
  - PLACEMENT: Within each feature slice test directories
  - VALIDATION: All tests pass with Supabase mocking
```

### Implementation Patterns & Key Details

```typescript
// Supabase Client Setup
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Service Layer Pattern (Replace Express API)
// BEFORE (Express):
export const songService = {
  async getAllSongs(filters?: SongFilters) {
    const token = await getToken()
    const response = await fetch('/api/v1/songs', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.json()
  }
}

// AFTER (Supabase):
export const songService = {
  async getAllSongs(filters?: SongFilters) {
    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        arrangements (*)
      `)
      .eq('is_public', true)
      .order('title')
    
    if (error) throw error
    return data
  }
}

// React Query Hook Pattern (Maintain existing interface)
export function useSongs(filters?: SongFilters) {
  return useQuery({
    queryKey: songKeys.list(filters),
    queryFn: () => songService.getAllSongs(filters),
    staleTime: 5 * 60 * 1000,
  })
}

// Optimistic Update Pattern with Supabase
export function useCreateSong() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (formData: SongFormData) => {
      const { data, error } = await supabase
        .from('songs')
        .insert({
          ...formData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    
    onMutate: async (formData) => {
      // Same optimistic update pattern as existing code
      await queryClient.cancelQueries({ queryKey: songKeys.lists() })
      const previousSongs = queryClient.getQueryData(songKeys.lists())
      
      const optimisticSong = createOptimisticSong(formData)
      queryClient.setQueriesData(
        { queryKey: songKeys.lists() },
        (old: any) => old ? [optimisticSong, ...old] : [optimisticSong]
      )
      
      return { previousSongs }
    },
    
    onError: (err, formData, context) => {
      // Same rollback pattern as existing code
      if (context?.previousSongs) {
        queryClient.setQueriesData({ queryKey: songKeys.lists() }, context.previousSongs)
      }
    },
    
    onSuccess: (data) => {
      // Update cache with real server data
      queryClient.setQueryData(songKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: songKeys.lists() })
    }
  })
}

// Authentication Hook (Replace Clerk)
export function useAuth() {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    session,
    signIn: (provider: 'google' | 'github') => 
      supabase.auth.signInWithOAuth({ provider }),
    signOut: () => supabase.auth.signOut(),
    isAuthenticated: !!user
  }
}

// Real-time Subscription Pattern
export function useRealtimeSetlist(setlistId: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const subscription = supabase
      .channel(`setlist:${setlistId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'setlists',
          filter: `id=eq.${setlistId}`
        },
        (payload) => {
          queryClient.invalidateQueries({ 
            queryKey: setlistKeys.detail(setlistId) 
          })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [setlistId, queryClient])
}
```

### Integration Points & Cross-Slice Dependencies

**CRITICAL: Maintain vertical slice architecture during migration**

```yaml
WITHIN SLICE (Maintain Independence):
  - All domain-specific logic remains within slice
  - Service layer completely replaced with Supabase queries
  - Optimistic update patterns maintained
  - Component interfaces remain identical
  - Hook interfaces preserve existing contracts

SHARED/COMMON DEPENDENCIES (Updated):
  - src/lib/supabase.ts - Shared Supabase client
  - src/lib/database.types.ts - Auto-generated types
  - src/shared/components/ui/ - UI components unchanged
  - src/shared/utils/ - Utility functions unchanged
  - src/shared/hooks/ - Generic hooks updated for Supabase auth

CROSS-SLICE DEPENDENCIES (Preserved):
  - Arrangements reference songs via foreign key
  - Setlists reference arrangements via junction table
  - All references use UUIDs instead of ObjectIds
  - Public APIs (index.ts) maintain same exports

BACKEND ELIMINATION:
  - Remove: server/ directory completely
  - Remove: Express API routes and controllers
  - Remove: MongoDB models and connection logic
  - Remove: Clerk server-side middleware
  - Maintain: Frontend service layer interfaces
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint                    # ESLint 9 checks with TypeScript rules
npm run build                  # Vite 7 build with TypeScript 5.8 validation
npx tsc -b --noEmit            # Isolated TypeScript type checking

# Supabase-specific validation
npx supabase gen types typescript --project-id "$PROJECT_REF" > src/lib/database.types.ts
npm run build                  # Ensure generated types compile with Vite

# Bundle analysis for performance impact
npm run analyze                # Opens dist/stats.html to check bundle size impact

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test each migrated slice as it's completed using Vitest
npm run test src/features/songs/
npm run test src/features/arrangements/
npm run test src/features/setlists/
npm run test src/features/auth/

# Test Supabase integration
npm run test src/lib/supabase.test.ts

# Coverage validation with Vitest + V8
npm run test:coverage

# Watch mode for development
npm run test:watch

# CI mode for production validation
npm run test:ci

# UI mode for debugging (optional)
npm run test:ui

# Expected: All tests pass with Supabase mocking. If failing, debug integration issues.
```

### Level 3: Integration Testing (System Validation)

```bash
# Development server validation with Supabase
npm run dev &
sleep 10  # Allow Vite 7 startup time

# Test core user flows
curl -I http://localhost:5173/songs
curl -I http://localhost:5173/arrangements
curl -I http://localhost:5173/setlists
# Expected: 200 OK responses with Supabase data

# Test authentication flow
# Manual: Login with Google OAuth via Supabase
# Expected: User can authenticate and access protected resources

# Production build validation
npm run build                  # Vite production build
npm run preview               # Vite preview server
# Expected: Successful build with Supabase environment variables

# Bundle size validation
npm run analyze               # Check if Supabase adds significant bundle size
# Expected: Bundle size increase <100KB compared to Express client

# Test offline functionality 
# Manual: Disconnect network, verify offline queue still works
# Expected: Optimistic updates work, queue processes when reconnected
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Supabase-Specific Validation:

# Data integrity validation
node scripts/validate-migration.js
# Expected: All MongoDB data successfully transferred to Supabase

# Real-time functionality validation
# Manual: Open two browser tabs, edit setlist in one tab
# Expected: Changes appear in other tab within 1-2 seconds

# Performance validation with Supabase
npm run build && npm run preview
# Manual: Measure page load times with network throttling
# Expected: Faster than current Express API (target: <2s page loads)

# RLS (Row Level Security) validation
# Manual: Try accessing another user's private content
# Expected: Proper authorization, no unauthorized data access

# Vertical Slice Architecture Validation:
find src/features -name "*.ts" -o -name "*.tsx" | xargs grep -l "supabase" 
# Expected: Only service files import supabase, components use hooks

# Check slice completeness after migration
ls -la src/features/songs/
ls -la src/features/arrangements/  
ls -la src/features/setlists/
# Expected: All slices have updated services, maintained boundaries

# Database query performance
# Manual: Check Supabase dashboard for slow queries
# Expected: All queries <500ms, proper index usage

# Authentication flow validation
# Manual: Login, logout, protected route access
# Expected: Seamless transition from Clerk to Supabase Auth

# Offline queue validation
# Manual: Create/edit content while offline, go online
# Expected: All changes sync successfully when connection restored
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test:ci`
- [ ] Test coverage adequate: `npm run test:coverage`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npx tsc -b --noEmit`
- [ ] Production build succeeds: `npm run build`
- [ ] Preview server works: `npm run preview`
- [ ] Supabase types generate correctly: `npx supabase gen types`
- [ ] Bundle size impact acceptable: `npm run analyze`

### Feature Validation

- [ ] All songs CRUD operations work with Supabase
- [ ] ChordPro editor saves to Supabase without compression issues
- [ ] Setlist drag-and-drop reordering maintains optimistic updates
- [ ] Authentication flow works with Supabase Auth
- [ ] Real-time collaboration works across browser tabs
- [ ] Offline queue processes successfully when connection restored

### Data Migration Validation

- [ ] All existing songs transferred without data loss
- [ ] All existing arrangements preserved with correct ChordPro content
- [ ] All existing setlists maintain correct arrangement ordering
- [ ] User associations preserved during auth migration
- [ ] All foreign key relationships established correctly

### Code Quality Validation

- [ ] Vertical slice architecture maintained: Features remain self-contained
- [ ] Cross-slice dependencies minimized: Only imports from public APIs
- [ ] Service layer interfaces preserved: Components unchanged
- [ ] React Query patterns maintained: Optimistic updates work identically
- [ ] Error handling comprehensive: Network issues handled gracefully
- [ ] Performance improved: Page loads faster than Express API

### Production Deployment Validation

- [ ] Vercel deployment successful with Supabase environment variables
- [ ] Database RLS policies protect user data correctly
- [ ] Supabase free tier usage within limits
- [ ] Real-time subscriptions work in production
- [ ] All features functional in production environment

### Performance & User Experience

- [ ] Page load times improved (target: <2s vs current 3-5s)
- [ ] Optimistic updates feel immediate and smooth
- [ ] Error messages user-friendly for network issues
- [ ] Offline functionality works seamlessly
- [ ] Real-time updates enhance collaboration

---

## Anti-Patterns to Avoid

**Migration-Specific Anti-Patterns:**
- ❌ Don't migrate data without proper foreign key relationships
- ❌ Don't skip RLS policies - security is critical from day one
- ❌ Don't change component interfaces - maintain vertical slice boundaries
- ❌ Don't remove optimistic updates - user experience must be preserved
- ❌ Don't ignore offline scenarios - queue system must work

**Supabase Anti-Patterns:**
- ❌ Don't query without proper indexes - performance will suffer
- ❌ Don't expose anon key in client - use environment variables properly
- ❌ Don't skip type generation - TypeScript safety is crucial
- ❌ Don't over-invalidate queries - be specific with cache updates
- ❌ Don't ignore real-time subscription cleanup - memory leaks possible

**Vertical Slice Architecture Anti-Patterns:**
- ❌ Don't create direct Supabase imports in components - use service layer
- ❌ Don't put shared Supabase logic in one slice - use shared/
- ❌ Don't create incomplete migrations - each slice must be fully functional
- ❌ Don't violate slice boundaries for migration convenience
- ❌ Don't skip testing individual slices after migration

**PRP Quality Score: 9/10**

This PRP provides comprehensive context for a complex migration with:
- Complete current architecture understanding
- Detailed Supabase integration patterns  
- Preserved vertical slice boundaries
- Comprehensive validation strategy
- Real-world migration examples and patterns
- Performance and user experience focus

Success probability: Very High - All necessary context provided for one-pass implementation.