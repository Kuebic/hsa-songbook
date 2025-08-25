name: "Phase 3 - Supabase Seed Data & Testing System"
description: |
  Create comprehensive test data system with realistic seed data, data generation utilities, and environment-specific configurations

---

## Goal

**Feature Goal**: Implement a robust seed data system that provides consistent, realistic test data for development and testing

**Deliverable**: Seed data files, data generation utilities, environment-specific seeds, and testing framework integration

**Success Definition**: Developers can reset to known state with realistic data in <5 seconds, all test scenarios covered with appropriate data

## User Persona

**Target User**: HSA Songbook developers and QA testers

**Use Case**: Testing features with realistic data without production access

**User Journey**:
1. Reset database to clean state
2. Seed data automatically loads
3. Test features with realistic data
4. Add custom test scenarios as needed
5. Share test data across team

**Pain Points Addressed**:
- Inconsistent test data across developers
- Time spent manually creating test data
- Difficulty reproducing bugs
- Lack of edge case test data
- No standard test scenarios

## Why

- **Consistency**: All developers work with same test data
- **Efficiency**: No manual data creation needed
- **Bug Reproduction**: Consistent data for debugging
- **Test Coverage**: Edge cases and scenarios covered
- **Onboarding**: New developers get working data immediately

## What

Comprehensive seed data system using SQL seed files, TypeScript data generators, environment-specific configurations, and integration with testing frameworks.

### Success Criteria

- [ ] Base seed.sql file with core data
- [ ] Song and arrangement samples covering all genres
- [ ] User accounts with different permission levels
- [ ] Setlist examples with various configurations
- [ ] Data generation utilities for bulk testing
- [ ] Environment-specific seed variations
- [ ] Performance <5 seconds for full seed

## All Needed Context

### Context Completeness Check

_"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_ - YES

### Documentation & References

```yaml
- url: https://supabase.com/docs/guides/local-development/seeding-your-database
  why: Official seed data documentation and patterns
  critical: Explains seed.sql execution and best practices

- url: https://www.chordpro.org/chordpro/chordpro-introduction/
  why: ChordPro format for arrangement chord_data field
  critical: Need valid ChordPro syntax for realistic arrangements

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/lib/database.types.ts
  why: Database schema for seed data structure
  pattern: All table definitions and relationships
  gotcha: Foreign key constraints must be respected

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/song-database/
  why: Existing song data that could be used for seeds
  pattern: Real song examples and structures
  gotcha: May need permission/licensing considerations

- docfile: PRPs/supabase-local-development-prd.md
  why: Seed data requirements and structure
  section: Phase 3 and Data Models sections
```

### Current Codebase tree

```bash
hsa-songbook/
├── supabase/
│   ├── migrations/           # Schema definitions (from Phase 2)
│   └── config.toml          # Local configuration
├── song-database/           # Existing song data
│   └── *.txt               # Song files in various formats
└── src/
    └── lib/
        └── database.types.ts # TypeScript types
```

### Desired Codebase tree with files to be added

```bash
hsa-songbook/
├── supabase/
│   ├── seed.sql                      # NEW: Main seed file
│   └── seeds/                        # NEW: Additional seed modules
│       ├── 01_users.sql             # NEW: User accounts
│       ├── 02_songs.sql             # NEW: Song data
│       ├── 03_arrangements.sql      # NEW: Arrangements
│       ├── 04_setlists.sql          # NEW: Setlists
│       └── 05_permissions.sql       # NEW: Permissions
├── scripts/
│   ├── generate-seed-data.ts        # NEW: TypeScript generator
│   └── import-songs.ts              # NEW: Import from song-database
└── test/
    └── fixtures/                     # NEW: Test-specific data
        ├── edge-cases.sql           # NEW: Edge case scenarios
        └── performance.sql          # NEW: Large dataset
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: ChordPro format required for chord_data
// Must include valid ChordPro directives and chord notations

// CRITICAL: UUID generation in PostgreSQL
// Use gen_random_uuid() for ID generation

// CRITICAL: Auth.users table managed by Supabase
// Cannot directly insert users - use auth.users() functions

// CRITICAL: Foreign key constraints
// Insert data in correct order: users -> songs -> arrangements -> setlists
```

## Implementation Blueprint

### Data models and structure

```sql
-- Seed data structure following schema

-- User types for testing
CREATE TYPE seed_user AS (
    email TEXT,
    role TEXT,
    display_name TEXT
);

-- Song categories from requirements
CREATE TYPE song_category AS ENUM (
    'worship',
    'hymn', 
    'christmas',
    'easter',
    'communion',
    'prayer',
    'thanksgiving'
);

-- Arrangement difficulties
CREATE TYPE difficulty_level AS ENUM (
    'easy',
    'medium', 
    'hard'
);

-- Sample ChordPro format for arrangements
-- {title:Amazing Grace}
-- {key:G}
-- {tempo:72}
-- {time:3/4}
-- 
-- [G]Amazing [G7]grace how [C]sweet the [G]sound
-- That [G]saved a [D]wretch like [G]me
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE base seed.sql file
  - CREATE: supabase/seed.sql with core data
  - INCLUDE: Sample songs, arrangements, users
  - FOLLOW pattern: SQL best practices, transactions
  - CRITICAL: Use gen_random_uuid() for IDs
  - TEST: supabase db reset loads seeds
  - PLACEMENT: supabase/seed.sql

Task 2: CREATE modular seed files
  - CREATE: supabase/seeds/01_users.sql
  - CREATE: supabase/seeds/02_songs.sql  
  - CREATE: supabase/seeds/03_arrangements.sql
  - CREATE: supabase/seeds/04_setlists.sql
  - CREATE: supabase/seeds/05_permissions.sql
  - FOLLOW pattern: Numbered prefixes for order
  - PLACEMENT: supabase/seeds/ directory

Task 3: IMPLEMENT TypeScript data generator
  - CREATE: scripts/generate-seed-data.ts
  - IMPLEMENT: Faker.js for realistic data
  - GENERATE: Valid ChordPro arrangements
  - OUTPUT: SQL insert statements
  - FOLLOW pattern: TypeScript with types from database.types.ts
  - PLACEMENT: scripts/ directory

Task 4: CREATE song import utility
  - CREATE: scripts/import-songs.ts
  - PARSE: Existing song-database files
  - CONVERT: To database format
  - GENERATE: SQL inserts or direct Supabase calls
  - FOLLOW pattern: Error handling and validation
  - PLACEMENT: scripts/ directory

Task 5: CREATE test fixture data
  - CREATE: test/fixtures/edge-cases.sql
  - INCLUDE: Unicode characters, long text, nulls
  - CREATE: test/fixtures/performance.sql
  - INCLUDE: 1000+ songs for performance testing
  - FOLLOW pattern: Documented test scenarios
  - PLACEMENT: test/fixtures/ directory

Task 6: UPDATE package.json scripts
  - ADD: "seed:generate": "tsx scripts/generate-seed-data.ts"
  - ADD: "seed:import": "tsx scripts/import-songs.ts"
  - ADD: "seed:reset": "supabase db reset"
  - ADD: "seed:custom": "supabase db seed -f"
  - FOLLOW pattern: Existing script naming
  - PLACEMENT: package.json scripts section

Task 7: CREATE seed data documentation
  - CREATE: supabase/seeds/README.md
  - DOCUMENT: Available test accounts
  - LIST: Test scenarios covered
  - EXPLAIN: How to add custom seeds
  - FOLLOW pattern: Markdown documentation
  - PLACEMENT: supabase/seeds/README.md

Task 8: INTEGRATE with testing framework
  - UPDATE: vitest setup file
  - ADD: Database reset before test suites
  - IMPLEMENT: Test-specific seed loading
  - FOLLOW pattern: src/shared/test-utils/setup.ts
  - CRITICAL: Isolate test data from dev data
  - PLACEMENT: Test configuration files
```

### Implementation Patterns & Key Details

```sql
-- supabase/seed.sql - Main seed file
BEGIN;

-- Clear existing data (for reset scenarios)
TRUNCATE TABLE setlist_songs, setlists, arrangements, songs RESTART IDENTITY CASCADE;

-- Insert test songs
INSERT INTO songs (id, title, artist, language, category, slug, hymn_number, created_at) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Amazing Grace', 'John Newton', 'en', 'hymn', 'amazing-grace', 255, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'How Great Thou Art', 'Carl Boberg', 'en', 'worship', 'how-great-thou-art', 48, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Silent Night', 'Franz Gruber', 'en', 'christmas', 'silent-night', 239, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', '성령이여 임하소서', 'Korean Traditional', 'ko', 'worship', 'holy-spirit-come', NULL, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'In Christ Alone', 'Keith Getty', 'en', 'worship', 'in-christ-alone', NULL, NOW());

-- Insert test arrangements with valid ChordPro
INSERT INTO arrangements (id, song_id, name, slug, chord_data, key, tempo, difficulty, created_at) VALUES
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Original Key',
        'original',
        '{title:Amazing Grace}
{key:G}
{tempo:72}
{time:3/4}

Verse 1:
A[G]mazing [G7]grace how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
I [G]once was [G7]lost but [C]now am [G]found
Was [Em]blind but [D]now I [G]see

Verse 2:
''Twas [G]grace that [G7]taught my [C]heart to [G]fear
And [G]grace my [Em]fears re[D]lieved
How [G]precious [G7]did that [C]grace ap[G]pear
The [Em]hour I [D]first be[G]lieved',
        'G',
        72,
        'easy',
        NOW()
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Capo 2',
        'capo-2',
        '{title:Amazing Grace}
{key:F}
{capo:2}
{tempo:72}

Verse 1:
A[F]mazing [F7]grace how [Bb]sweet the [F]sound
That [F]saved a [Dm]wretch like [C]me',
        'F',
        72,
        'easy',
        NOW()
    );

-- Insert test setlists
INSERT INTO setlists (id, name, is_public, created_at) VALUES
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'Sunday Morning Service', true, NOW()),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'Christmas Eve Service', true, NOW()),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 'Youth Group Worship', true, NOW());

-- Insert setlist songs
INSERT INTO setlist_songs (setlist_id, song_id, arrangement_id, position) VALUES
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 1),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NULL, 2),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', NULL, 3);

COMMIT;
```

```typescript
// scripts/generate-seed-data.ts
import { faker } from '@faker-js/faker';
import type { Database } from '../src/lib/database.types';

type Song = Database['public']['Tables']['songs']['Insert'];
type Arrangement = Database['public']['Tables']['arrangements']['Insert'];

const KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'];
const CATEGORIES = ['worship', 'hymn', 'christmas', 'easter', 'communion', 'prayer'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

function generateChordPro(title: string, key: string): string {
  const chords = ['C', 'F', 'G', 'Am', 'Dm', 'Em'];
  const lines = [
    `{title:${title}}`,
    `{key:${key}}`,
    `{tempo:${faker.number.int({ min: 60, max: 140 })}}`,
    '',
    'Verse 1:',
    `[${faker.helpers.arrayElement(chords)}]${faker.lorem.words(3)} [${faker.helpers.arrayElement(chords)}]${faker.lorem.words(3)}`,
    `[${faker.helpers.arrayElement(chords)}]${faker.lorem.words(4)} [${faker.helpers.arrayElement(chords)}]${faker.lorem.words(2)}`,
    '',
    'Chorus:',
    `[${faker.helpers.arrayElement(chords)}]${faker.lorem.words(3)} [${faker.helpers.arrayElement(chords)}]${faker.lorem.words(3)}`,
  ];
  
  return lines.join('\n');
}

function generateSong(): Song {
  const title = faker.music.songName();
  const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  return {
    id: faker.string.uuid(),
    title,
    artist: faker.person.fullName(),
    language: faker.helpers.arrayElement(['en', 'ko', 'es', 'zh']),
    category: faker.helpers.arrayElement(CATEGORIES),
    slug,
    hymn_number: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 500 })),
    ccli_number: faker.helpers.maybe(() => faker.string.numeric(7)),
    created_at: faker.date.past().toISOString(),
    is_public: true,
  };
}

function generateArrangement(songId: string, songTitle: string): Arrangement {
  const key = faker.helpers.arrayElement(KEYS);
  const name = faker.helpers.arrayElement(['Original', 'Alternate', 'Acoustic', 'Capo 2']);
  
  return {
    id: faker.string.uuid(),
    song_id: songId,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    chord_data: generateChordPro(songTitle, key),
    key,
    tempo: faker.number.int({ min: 60, max: 140 }),
    difficulty: faker.helpers.arrayElement(DIFFICULTIES),
    created_at: faker.date.past().toISOString(),
    is_public: true,
  };
}

// Generate SQL
console.log('-- Generated seed data');
console.log('BEGIN;');
console.log('');

// Generate songs
const songs: Song[] = [];
for (let i = 0; i < 50; i++) {
  const song = generateSong();
  songs.push(song);
  
  const values = [
    `'${song.id}'`,
    `'${song.title.replace(/'/g, "''")}'`,
    song.artist ? `'${song.artist.replace(/'/g, "''")}'` : 'NULL',
    `'${song.language}'`,
    song.category ? `'${song.category}'` : 'NULL',
    `'${song.slug}'`,
    song.hymn_number || 'NULL',
  ].join(', ');
  
  console.log(`INSERT INTO songs (id, title, artist, language, category, slug, hymn_number) VALUES (${values});`);
}

console.log('');
console.log('-- Arrangements');

// Generate arrangements
songs.forEach(song => {
  const numArrangements = faker.number.int({ min: 1, max: 3 });
  for (let i = 0; i < numArrangements; i++) {
    const arr = generateArrangement(song.id!, song.title);
    const values = [
      `'${arr.id}'`,
      `'${arr.song_id}'`,
      `'${arr.name}'`,
      `'${arr.slug}'`,
      `'${arr.chord_data.replace(/'/g, "''")}'`,
      `'${arr.key}'`,
      arr.tempo || 'NULL',
      `'${arr.difficulty}'`,
    ].join(', ');
    
    console.log(`INSERT INTO arrangements (id, song_id, name, slug, chord_data, key, tempo, difficulty) VALUES (${values});`);
  }
});

console.log('');
console.log('COMMIT;');
```

### Integration Points

```yaml
SEED_FILES:
  - main: "supabase/seed.sql"
  - modules: "supabase/seeds/*.sql"
  - execution: "Automatic on db reset"

DATA_GENERATION:
  - script: "scripts/generate-seed-data.ts"
  - library: "@faker-js/faker"
  - output: "SQL insert statements"

IMPORT_TOOLS:
  - source: "song-database/*.txt"
  - script: "scripts/import-songs.ts"
  - format: "ChordPro parsing"

TESTING:
  - fixtures: "test/fixtures/*.sql"
  - setup: "vitest beforeAll hooks"
  - isolation: "Separate test database"
```

## Validation Loop

### Level 1: Seed File Validation

```bash
# Check seed file exists
test -f supabase/seed.sql || echo "Main seed file missing"

# Validate SQL syntax
supabase db lint supabase/seed.sql || echo "SQL syntax errors"

# Check modular seeds
ls supabase/seeds/*.sql 2>/dev/null | wc -l | xargs -I {} test {} -gt 0 || echo "No modular seeds"

# Expected: All seed files present and valid SQL
```

### Level 2: Seed Loading Testing

```bash
# Reset database with seeds
supabase db reset

# Verify data loaded
supabase db query "SELECT COUNT(*) FROM songs" --local
supabase db query "SELECT COUNT(*) FROM arrangements" --local
supabase db query "SELECT COUNT(*) FROM setlists" --local

# Check ChordPro data
supabase db query "SELECT chord_data FROM arrangements LIMIT 1" --local | grep -q "{title:" || echo "Invalid ChordPro"

# Expected: Data counts > 0, valid ChordPro format
```

### Level 3: Data Generation Testing

```bash
# Run data generator
npm run seed:generate > generated-seeds.sql

# Check output
grep -c "INSERT INTO" generated-seeds.sql | xargs -I {} test {} -gt 0 || echo "No inserts generated"

# Validate generated SQL
supabase db lint generated-seeds.sql || echo "Generated SQL invalid"

# Test loading generated data
supabase db reset
supabase db query "COPY (SELECT * FROM songs) TO STDOUT" --local | wc -l

# Expected: Valid SQL generated, loads successfully
```

### Level 4: Performance Testing

```bash
# Measure seed loading time
time supabase db reset

# Should complete in < 5 seconds
# If slower, optimize seed data

# Test with large dataset
cat test/fixtures/performance.sql | supabase db query --local

# Verify application performance
npm run dev &
sleep 5
time curl http://localhost:5173/api/songs

# Expected: Seed loading < 5s, app responsive with large dataset
```

## Final Validation Checklist

### Technical Validation

- [ ] seed.sql file created with base data
- [ ] Modular seed files organized by domain
- [ ] All foreign key constraints satisfied
- [ ] ChordPro format valid in arrangements
- [ ] Seed loading time < 5 seconds

### Feature Validation

- [ ] Sample songs cover all categories
- [ ] Multiple arrangements per song available
- [ ] Test users with different roles created
- [ ] Setlists with various configurations
- [ ] Edge cases and unicode handled

### Code Quality Validation

- [ ] SQL follows best practices (transactions, etc)
- [ ] TypeScript generator properly typed
- [ ] Import scripts handle errors gracefully
- [ ] Documentation includes test accounts
- [ ] Seed data doesn't include sensitive info

### Documentation & Deployment

- [ ] README documents available test data
- [ ] Test scenarios clearly listed
- [ ] Custom seed creation explained
- [ ] Package.json scripts working
- [ ] Team aware of seed data structure

---

## Anti-Patterns to Avoid

- ❌ Don't include production data in seeds
- ❌ Don't hardcode IDs that might conflict
- ❌ Don't forget foreign key order
- ❌ Don't use invalid ChordPro syntax
- ❌ Don't create unrealistic test data
- ❌ Don't skip transaction wrapping
- ❌ Don't make seeds too large (>10MB)
- ❌ Don't forget to test with empty database

## Confidence Score: 9/10

High confidence based on clear seed data patterns, comprehensive data generation approach, and proper integration with existing systems. The ChordPro format and foreign key relationships are well understood.