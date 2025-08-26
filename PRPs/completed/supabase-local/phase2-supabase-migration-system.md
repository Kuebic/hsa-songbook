name: "Phase 2 - Supabase Migration System Implementation"
description: |
  Implement robust database migration workflow with version control, CI/CD integration, and rollback procedures

---

## Goal

**Feature Goal**: Establish a version-controlled database migration system that captures all schema changes and enables safe database evolution

**Deliverable**: Complete migration pipeline with baseline schema, migration scripts, CI/CD integration, and rollback procedures

**Success Definition**: All database schema in version control, migrations apply cleanly to fresh databases, and CI/CD automatically applies migrations to staging/production

## User Persona

**Target User**: HSA Songbook developers and DevOps engineers

**Use Case**: Managing database schema changes across development, staging, and production environments

**User Journey**:
1. Developer makes schema change locally
2. Generate migration file from changes
3. Test migration with reset
4. Commit migration to Git
5. CI/CD applies to staging/production

**Pain Points Addressed**:
- Manual schema synchronization errors
- Lack of schema version history
- Difficulty reproducing database state
- Risk of production schema corruption
- No rollback capability for bad migrations

## Why

- **Version Control**: Track all schema changes in Git history
- **Team Synchronization**: Developers work from same schema baseline
- **Safe Deployments**: Test migrations before production
- **Audit Trail**: Complete history of database evolution
- **Disaster Recovery**: Rebuild database from migrations

## What

Comprehensive migration system using Supabase CLI migration tools, including baseline extraction from current cloud database, migration generation workflow, testing procedures, and automated CI/CD deployment.

### Success Criteria

- [ ] Current schema extracted as baseline migration
- [ ] Migration generation workflow documented and tested
- [ ] All migrations apply cleanly to fresh database
- [ ] CI/CD pipeline deploys migrations automatically
- [ ] Rollback procedure tested and documented
- [ ] Type generation integrated with migration workflow

## All Needed Context

### Context Completeness Check

_"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_ - YES

### Documentation & References

```yaml
- url: https://supabase.com/docs/guides/deployment/database-migrations
  why: Official migration workflow documentation
  critical: Explains supabase db diff and migration management

- url: https://supabase.com/docs/guides/local-development/overview#database-migrations
  why: Local development migration patterns
  critical: Shows how to create and test migrations locally

- url: https://supabase.com/docs/reference/cli/supabase-migration
  why: Complete CLI migration commands reference
  critical: All migration-related commands and options

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/lib/database.types.ts
  why: Current database schema as TypeScript types
  pattern: Shows all tables, relationships, and field types
  gotcha: Generated file - do not edit manually

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/supabase/migrations/
  why: Directory for migration files
  pattern: Currently empty - will contain timestamped SQL files
  gotcha: Files must be named with timestamp prefix for ordering

- docfile: PRPs/supabase-local-development-prd.md
  why: Complete migration workflow diagrams and patterns
  section: Migration Workflow Diagram in Appendix D
```

### Current Codebase tree

```bash
hsa-songbook/
├── supabase/
│   ├── config.toml            # Local configuration (from Phase 1)
│   ├── migrations/            # Empty - needs baseline
│   └── functions/             # Edge functions
├── src/
│   └── lib/
│       └── database.types.ts  # Generated types from schema
└── .github/
    └── workflows/             # Will add migration workflow
```

### Desired Codebase tree with files to be added

```bash
hsa-songbook/
├── supabase/
│   ├── migrations/
│   │   ├── 20250121000000_baseline.sql    # NEW: Initial schema
│   │   └── README.md                      # NEW: Migration guidelines
│   └── seed.sql                          # NEW: Basic seed data
├── scripts/
│   ├── migrate-up.sh                     # NEW: Apply migrations
│   ├── migrate-down.sh                   # NEW: Rollback migrations
│   └── generate-types.sh                 # NEW: Type generation
└── .github/
    └── workflows/
        └── migrations.yml                 # NEW: CI/CD pipeline
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Tables created via Dashboard owned by supabase_admin
// Migration scripts run as postgres role - permission issues possible

// CRITICAL: Timestamp conflicts when rebasing migrations
// Solution: Rename migration files with new timestamps

// CRITICAL: RLS policies must be included in migrations
// All tables need Row Level Security policies defined

// CRITICAL: Extension dependencies must be declared
// Example: uuid-ossp, pgcrypto extensions needed
```

## Implementation Blueprint

### Data models and structure

```sql
-- Migration file structure
-- supabase/migrations/YYYYMMDDHHMMSS_description.sql

-- Required tables from database.types.ts
CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT,
    language TEXT,
    category TEXT,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS arrangements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    chord_data TEXT NOT NULL,
    key TEXT,
    tempo INTEGER,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS setlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS setlist_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setlist_id UUID REFERENCES setlists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    arrangement_id UUID REFERENCES arrangements(id),
    position INTEGER NOT NULL,
    UNIQUE(setlist_id, position)
);
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EXTRACT baseline schema from cloud database
  - RUN: supabase link --project-ref <project-id>
  - RUN: supabase db remote commit
  - VERIFY: Migration file created in supabase/migrations/
  - REVIEW: Generated SQL for completeness
  - CRITICAL: Include RLS policies and extensions
  - PLACEMENT: supabase/migrations/20250121000000_baseline.sql

Task 2: CREATE migration documentation
  - CREATE: supabase/migrations/README.md
  - DOCUMENT: Migration naming conventions
  - INCLUDE: Common patterns and gotchas
  - EXAMPLES: Sample migrations for reference
  - FOLLOW pattern: Markdown documentation standards
  - PLACEMENT: supabase/migrations/README.md

Task 3: IMPLEMENT migration helper scripts
  - CREATE: scripts/migrate-up.sh for applying migrations
  - CREATE: scripts/migrate-down.sh for rollbacks
  - CREATE: scripts/generate-types.sh for TypeScript generation
  - FOLLOW pattern: Bash scripting with error handling
  - INCLUDE: Logging and status reporting
  - PLACEMENT: scripts/ directory

Task 4: TEST migration workflow locally
  - RUN: supabase db reset to apply baseline
  - CREATE: Test migration with supabase migration new test_feature
  - APPLY: Migration with supabase db reset
  - VERIFY: Schema changes reflected correctly
  - GENERATE: Types with npm run types:generate
  - ROLLBACK: Test rollback procedure

Task 5: CREATE GitHub Actions workflow
  - CREATE: .github/workflows/migrations.yml
  - IMPLEMENT: Preview branch migrations on PR
  - IMPLEMENT: Production migrations on merge
  - INCLUDE: Rollback mechanism on failure
  - FOLLOW pattern: GitHub Actions best practices
  - PLACEMENT: .github/workflows/migrations.yml

Task 6: UPDATE package.json scripts
  - ADD: "db:migrate": "supabase migration up --local"
  - ADD: "db:reset": "supabase db reset"
  - ADD: "db:diff": "supabase db diff --schema public"
  - ADD: "types:generate": "supabase gen types typescript --local > src/lib/database.types.ts"
  - ADD: "db:push": "supabase db push"
  - PLACEMENT: package.json scripts section

Task 7: CREATE migration testing framework
  - CREATE: scripts/test-migrations.sh
  - IMPLEMENT: Fresh database creation
  - APPLY: All migrations in sequence
  - VERIFY: Final schema matches expected
  - TEST: Rollback capabilities
  - PLACEMENT: scripts/ directory

Task 8: DOCUMENT migration procedures
  - UPDATE: README.md with migration section
  - CREATE: Migration workflow examples
  - DOCUMENT: Conflict resolution steps
  - INCLUDE: Troubleshooting guide
  - FOLLOW pattern: Existing documentation style
  - PLACEMENT: Project README.md
```

### Implementation Patterns & Key Details

```bash
#!/bin/bash
# scripts/migrate-up.sh - Apply migrations to database

set -e

echo "🔄 Applying database migrations..."

# Check if Supabase is running
if ! supabase status 2>/dev/null | grep -q "RUNNING"; then
    echo "⚠️  Starting Supabase..."
    supabase start
fi

# Apply migrations
echo "📝 Running migrations..."
supabase migration up --local

# Verify migration status
echo "✅ Checking migration status..."
supabase migration list --local

# Generate updated types
echo "🏷️ Generating TypeScript types..."
supabase gen types typescript --local > src/lib/database.types.ts

echo "✅ Migrations applied successfully!"
```

```sql
-- supabase/migrations/20250121000000_baseline.sql
-- Baseline schema extracted from production

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Songs table
CREATE TABLE IF NOT EXISTS public.songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT,
    language TEXT DEFAULT 'en',
    category TEXT,
    slug TEXT UNIQUE NOT NULL,
    hymn_number INTEGER,
    ccli_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Songs policies
CREATE POLICY "Songs are viewable by everyone" 
    ON public.songs FOR SELECT 
    USING (is_public = true);

CREATE POLICY "Authenticated users can insert songs" 
    ON public.songs FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Arrangements table
CREATE TABLE IF NOT EXISTS public.arrangements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    chord_data TEXT NOT NULL,
    key TEXT,
    tempo INTEGER,
    time_signature TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_public BOOLEAN DEFAULT true,
    UNIQUE(song_id, slug)
);

-- Enable RLS
ALTER TABLE public.arrangements ENABLE ROW LEVEL SECURITY;

-- Arrangements policies  
CREATE POLICY "Arrangements are viewable by everyone"
    ON public.arrangements FOR SELECT
    USING (is_public = true);

-- Create indexes for performance
CREATE INDEX idx_songs_slug ON public.songs(slug);
CREATE INDEX idx_songs_category ON public.songs(category);
CREATE INDEX idx_arrangements_song_id ON public.arrangements(song_id);

COMMIT;
```

```yaml
# .github/workflows/migrations.yml
name: Database Migrations

on:
  pull_request:
    paths:
      - 'supabase/migrations/**'
  push:
    branches:
      - main
    paths:
      - 'supabase/migrations/**'

jobs:
  test-migrations:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Run migrations on preview branch
        if: github.event_name == 'pull_request'
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
        run: |
          supabase link --project-ref $SUPABASE_PROJECT_ID
          supabase db push --dry-run
      
      - name: Deploy migrations to production
        if: github.ref == 'refs/heads/main'
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
        run: |
          supabase link --project-ref $SUPABASE_PROJECT_ID
          supabase db push
```

### Integration Points

```yaml
DATABASE:
  - directory: "supabase/migrations/"
  - naming: "YYYYMMDDHHMMSS_description.sql"
  - order: "Alphabetical by timestamp"

TYPES:
  - generate: "supabase gen types typescript --local"
  - output: "src/lib/database.types.ts"
  - update: "After each migration"

CI/CD:
  - preview: "On pull request"
  - deploy: "On merge to main"
  - rollback: "Manual intervention required"

PACKAGE_SCRIPTS:
  - db:migrate: "Apply pending migrations"
  - db:reset: "Fresh database with migrations"
  - db:diff: "Generate migration from changes"
```

## Validation Loop

### Level 1: Migration Syntax Validation

```bash
# Validate SQL syntax in migration files
for file in supabase/migrations/*.sql; do
    echo "Checking $file..."
    supabase db lint "$file" || echo "Syntax error in $file"
done

# Check migration naming convention
ls supabase/migrations/*.sql | grep -E '^[0-9]{14}_.*\.sql$' || echo "Invalid migration names"

# Expected: All migrations pass syntax check and follow naming convention
```

### Level 2: Migration Application Testing

```bash
# Reset database to clean state
supabase db reset

# Check migration status
supabase migration list --local

# Verify all migrations applied
supabase migration list --local | grep -c "applied" | xargs -I {} test {} -gt 0 || echo "No migrations applied"

# Test schema integrity
supabase db query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" --local

# Expected: All migrations applied, core tables exist
```

### Level 3: Type Generation Validation

```bash
# Generate types from local schema
supabase gen types typescript --local > src/lib/database.types.ts

# Verify types file updated
test -f src/lib/database.types.ts || echo "Types file not generated"

# Check TypeScript compilation with new types
npm run build || echo "TypeScript compilation failed"

# Verify core tables in types
grep -q "Tables: {" src/lib/database.types.ts || echo "Tables not in types"
grep -q "songs:" src/lib/database.types.ts || echo "Songs table missing"
grep -q "arrangements:" src/lib/database.types.ts || echo "Arrangements table missing"

# Expected: Types generated successfully, TypeScript compiles
```

### Level 4: End-to-End Migration Testing

```bash
# Create test migration
TIMESTAMP=$(date +%Y%m%d%H%M%S)
cat > supabase/migrations/${TIMESTAMP}_test_migration.sql << EOF
-- Test migration
CREATE TABLE IF NOT EXISTS test_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);
EOF

# Apply migration
supabase db reset

# Verify table created
supabase db query "SELECT * FROM test_table" --local || echo "Test table not created"

# Generate updated types
supabase gen types typescript --local > src/lib/database.types.ts

# Verify types include new table
grep -q "test_table:" src/lib/database.types.ts || echo "Test table not in types"

# Cleanup test migration
rm supabase/migrations/${TIMESTAMP}_test_migration.sql
supabase db reset

# Expected: Migration workflow works end-to-end
```

## Final Validation Checklist

### Technical Validation

- [ ] Baseline migration extracted from cloud database
- [ ] All migrations apply cleanly: `supabase db reset`
- [ ] Migration helper scripts executable and working
- [ ] Type generation produces valid TypeScript
- [ ] No SQL syntax errors in migrations

### Feature Validation

- [ ] Schema changes tracked in version control
- [ ] Migration workflow documented and tested
- [ ] Rollback procedure tested and working
- [ ] CI/CD pipeline configured (ready for secrets)
- [ ] Team can create and apply migrations

### Code Quality Validation

- [ ] Migration files follow naming convention
- [ ] All tables have RLS policies defined
- [ ] Indexes created for foreign keys
- [ ] Scripts have proper error handling
- [ ] Documentation clear and comprehensive

### Documentation & Deployment

- [ ] Migration README created with examples
- [ ] Package.json scripts added and working
- [ ] CI/CD workflow file ready for deployment
- [ ] Troubleshooting guide documented
- [ ] Team trained on migration workflow

---

## Anti-Patterns to Avoid

- ❌ Don't edit migration files after committing
- ❌ Don't skip testing migrations with db reset
- ❌ Don't forget to include RLS policies
- ❌ Don't use DROP commands without CASCADE
- ❌ Don't hardcode timestamps - use functions
- ❌ Don't mix schema and data in migrations
- ❌ Don't skip type regeneration after migrations
- ❌ Don't deploy untested migrations to production

## Confidence Score: 9/10

High confidence based on official Supabase documentation, clear migration patterns, and comprehensive validation steps. The workflow is well-established and tested in production environments.