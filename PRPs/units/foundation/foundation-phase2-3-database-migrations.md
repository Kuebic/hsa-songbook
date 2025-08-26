name: "Foundation Phase 2.3: Database Migrations"
description: "Create missing database tables, add performance indexes, and implement Row Level Security policies"

---

## Goal

**Feature Goal**: Establish complete database schema with all required tables, indexes, and security policies for the HSA Songbook application

**Deliverable**: Supabase migration files creating missing tables, performance indexes, RLS policies, and updated TypeScript types

**Success Definition**: All code references to database tables resolve correctly, queries perform under 500ms p95, RLS policies enforce proper access control, TypeScript types are fully synchronized

## User Persona

**Target User**: HSA Songbook application and its developers

**Use Case**: Application requires complete database schema for RBAC features, moderation system, and optimized query performance

**User Journey**: 
1. Code references to permissions tables work without errors
2. Queries execute faster with proper indexes
3. Row Level Security prevents unauthorized data access
4. TypeScript provides full type safety for all tables

**Pain Points Addressed**: 
- Code crashes when referencing non-existent tables
- Slow queries without proper indexes (2.3s p99)
- Missing security policies risk data exposure
- Incomplete TypeScript types cause runtime errors

## Why

- **Stability**: Eliminates crashes from missing table references
- **Performance**: Reduces p95 query time by 30% with proper indexes
- **Security**: RLS policies provide database-level access control
- **Type Safety**: Complete types prevent runtime errors
- **Feature Enablement**: Unblocks RBAC and moderation features

## What

Create comprehensive database migrations:
- Missing tables for permissions system
- Performance indexes for common queries
- Row Level Security policies
- Type generation and synchronization

### Success Criteria

- [ ] All 6 missing tables created and accessible
- [ ] Performance indexes reduce query time by 30%
- [ ] RLS policies enforce correct access control
- [ ] TypeScript types generated and compile without errors
- [ ] Migration rollback procedures tested and documented

## All Needed Context

### Context Completeness Check

_This PRP provides complete SQL migrations, Supabase CLI commands, and type generation procedures for implementing the full database schema._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/lib/database.types.ts
  why: Current database schema and type definitions
  pattern: Supabase-generated type structure
  gotcha: This file is auto-generated - never edit directly

- file: src/features/permissions/services/permissionService.ts
  why: Shows tables that code expects but don't exist
  pattern: References to permissions, custom_roles tables
  gotcha: Currently returns mock data due to missing tables

- file: src/features/moderation/services/moderationService.ts
  why: References moderation tables that need creation
  pattern: content_reports, moderation_log tables
  gotcha: Falls back to direct queries when RPC fails

- file: PRPs/foundation-phase2-data-layer-stability-prd.md
  why: Complete schema specifications
  section: Section 6 - Data Models for SQL definitions

- url: https://supabase.com/docs/guides/cli/local-development#database-migrations
  why: Supabase migration workflow and commands
  critical: Migration naming convention and execution order

- url: https://supabase.com/docs/guides/database/postgres/row-level-security
  why: RLS policy syntax and best practices
  critical: Policy evaluation order and performance impact

- file: claude_md_files/DATABASE-SCHEMA.md
  why: Existing database schema documentation
  pattern: Current table relationships and constraints
  gotcha: May be out of sync with actual database
```

### Current Database State

```sql
-- Existing tables (from database.types.ts)
- arrangements
- role_permissions
- setlist_songs
- setlists
- songs
- user_roles
- users

-- Missing tables (referenced in code)
- permissions         # permissionService.ts line 45
- custom_roles       # permissionService.ts line 67
- permission_groups  # permissionService.ts line 89
- user_permissions   # permissionService.ts line 23
- moderation_log     # moderationService.ts line 234
- content_reports    # moderationService.ts line 156
```

### Migration File Structure

```bash
supabase/
├── migrations/
│   ├── 20240825000001_add_permission_tables.sql      # NEW
│   ├── 20240825000002_add_moderation_tables.sql      # NEW
│   ├── 20240825000003_add_performance_indexes.sql    # NEW
│   ├── 20240825000004_add_rls_policies.sql          # NEW
│   └── 20240825000005_add_helper_functions.sql       # NEW
├── seed.sql                                          # Development data
└── config.toml                                       # Supabase config
```

### Known Gotchas & Migration Rules

```sql
-- CRITICAL: Supabase migrations run in order by timestamp
-- Name format: YYYYMMDDHHMMSS_description.sql

-- CRITICAL: Use IF NOT EXISTS to make migrations idempotent
-- Prevents errors when re-running migrations

-- CRITICAL: RLS policies must be created after tables
-- Cannot create policy on non-existent table

-- CRITICAL: Foreign keys need proper cascade rules
-- ON DELETE CASCADE vs RESTRICT vs SET NULL

-- CRITICAL: Indexes on foreign keys are not automatic
-- Must explicitly create for performance

-- CRITICAL: Generate types after each migration
-- supabase gen types typescript --local
```

## Implementation Blueprint

### Database Schema Definitions

```sql
-- Table 1: Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL,  -- 'songs', 'arrangements', 'users', etc.
  action TEXT NOT NULL,    -- 'create', 'read', 'update', 'delete'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Table 2: Custom Roles
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,  -- Array of permission IDs
  is_system BOOLEAN DEFAULT false,        -- Prevent deletion of system roles
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Table 3: Permission Groups
CREATE TABLE IF NOT EXISTS permission_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions UUID[] DEFAULT ARRAY[]::UUID[],  -- Array of permission IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: User Permissions (direct assignments)
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,  -- Optional expiration
  UNIQUE(user_id, permission_id)
);

-- Table 5: Moderation Log
CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,  -- 'song', 'arrangement', 'user'
  content_id UUID NOT NULL,
  action TEXT NOT NULL,        -- 'approved', 'rejected', 'flagged'
  reason TEXT,
  moderated_by UUID NOT NULL REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table 6: Content Reports
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  report_type TEXT NOT NULL,   -- 'spam', 'inappropriate', 'copyright', etc.
  description TEXT,
  reported_by UUID REFERENCES auth.users(id),
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',  -- 'pending', 'reviewed', 'resolved'
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution TEXT
);
```

### Performance Indexes

```sql
-- Query pattern indexes from service analysis
CREATE INDEX IF NOT EXISTS idx_arrangements_visibility 
  ON arrangements(is_public, moderation_status) 
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_songs_search 
  ON songs USING gin(to_tsvector('english', title || ' ' || COALESCE(artist, '')));

CREATE INDEX IF NOT EXISTS idx_user_content 
  ON arrangements(created_by) 
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_songs_themes 
  ON songs USING gin(themes);

CREATE INDEX IF NOT EXISTS idx_moderation_pending 
  ON arrangements(moderation_status) 
  WHERE moderation_status = 'pending';

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_user_permissions_user 
  ON user_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_permissions_permission 
  ON user_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_moderation_log_content 
  ON moderation_log(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_content_reports_status 
  ON content_reports(status) 
  WHERE status = 'pending';
```

### Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Arrangements policies
CREATE POLICY "arrangements_public_read" ON arrangements
  FOR SELECT USING (
    is_public = true 
    AND (moderation_status IS NULL OR moderation_status != 'rejected')
  );

CREATE POLICY "arrangements_owner_all" ON arrangements
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "arrangements_moderator_all" ON arrangements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin')
      AND is_active = true
    )
  );

-- Songs policies (similar pattern)
CREATE POLICY "songs_public_read" ON songs
  FOR SELECT USING (
    is_public = true 
    AND (moderation_status IS NULL OR moderation_status != 'rejected')
  );

CREATE POLICY "songs_authenticated_create" ON songs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "songs_owner_update" ON songs
  FOR UPDATE USING (auth.uid() = created_by);

-- Permission system policies
CREATE POLICY "permissions_authenticated_read" ON permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "custom_roles_public_read" ON custom_roles
  FOR SELECT USING (true);

CREATE POLICY "user_permissions_own_read" ON user_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_permissions_admin_all" ON user_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );
```

### Implementation Tasks (ordered by dependencies)

```yaml
task_1:
  name: "Setup Supabase CLI and migration environment"
  requirements: |
    - Install Supabase CLI if not present
    - Run: supabase init (if not initialized)
    - Create supabase/migrations/ directory
    - Verify connection to local/remote database
    - Document current database state
  validation: "supabase db diff shows current differences"

task_2:
  name: "Create permission tables migration"
  requirements: |
    - Create: supabase/migrations/20240825000001_add_permission_tables.sql
    - Add all 4 permission tables from schema above
    - Include table comments for documentation
    - Add created_at/updated_at triggers
    - Test with: supabase db reset
  validation: "Tables created successfully in local database"

task_3:
  name: "Create moderation tables migration"
  requirements: |
    - Create: supabase/migrations/20240825000002_add_moderation_tables.sql
    - Add moderation_log and content_reports tables
    - Include proper foreign key constraints
    - Add check constraints for valid values
  validation: "Moderation tables accessible via Supabase client"

task_4:
  name: "Create performance indexes migration"
  requirements: |
    - Create: supabase/migrations/20240825000003_add_performance_indexes.sql
    - Add all indexes from Performance Indexes section
    - Include CONCURRENTLY for production safety
    - Add EXPLAIN comments for each index purpose
  validation: "EXPLAIN ANALYZE shows index usage"

task_5:
  name: "Create RLS policies migration"
  requirements: |
    - Create: supabase/migrations/20240825000004_add_rls_policies.sql
    - Enable RLS on all tables
    - Add all policies from RLS section
    - Test with different user roles
  validation: "RLS policies enforce correct access"

task_6:
  name: "Create helper functions migration"
  requirements: |
    - Create: supabase/migrations/20240825000005_add_helper_functions.sql
    - Add updated_at trigger function
    - Add user permission check functions
    - Add any RPC functions needed
  validation: "Functions callable via supabase.rpc()"

task_7:
  name: "Generate TypeScript types"
  requirements: |
    - Run: supabase gen types typescript --local > src/lib/database.types.ts
    - Verify all new tables appear in types
    - Check for any type generation warnings
    - Update imports if needed
  validation: "TypeScript compilation succeeds with new types"

task_8:
  name: "Create seed data"
  requirements: |
    - Update supabase/seed.sql with test data
    - Add sample permissions
    - Add test users with different roles
    - Add sample moderation entries
  validation: "supabase db reset populates test data"

task_9:
  name: "Test and document rollback"
  requirements: |
    - Create rollback migrations for each forward migration
    - Document rollback procedure
    - Test rollback on local database
    - Create rollback script
  validation: "Can rollback and re-apply all migrations"
```

## Testing Requirements

### Migration Testing

```bash
# Test migrations locally
supabase start
supabase db reset  # Runs all migrations

# Verify tables exist
supabase db query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"

# Test specific migration
supabase migration up --file 20240825000001_add_permission_tables.sql

# Test rollback
supabase migration down --file 20240825000001_add_permission_tables.sql
```

### RLS Policy Testing

```typescript
// Test RLS policies with different users
import { createClient } from '@supabase/supabase-js'

// Test as anonymous user
const anonClient = createClient(url, anonKey)
const { data: publicSongs } = await anonClient
  .from('songs')
  .select('*')
// Should only see public, approved songs

// Test as authenticated user
const userClient = createClient(url, anonKey, {
  auth: { persistSession: false }
})
await userClient.auth.signInWithPassword({ email, password })
const { data: userSongs } = await userClient
  .from('songs')
  .select('*')
// Should see public + own songs

// Test as admin
// Should see all songs
```

### Performance Testing

```sql
-- Test query performance with indexes
EXPLAIN ANALYZE
SELECT * FROM songs
WHERE to_tsvector('english', title || ' ' || artist) @@ to_tsquery('worship');
-- Should show index scan, not sequential scan

EXPLAIN ANALYZE
SELECT * FROM arrangements
WHERE is_public = true 
AND moderation_status IN ('approved', 'pending');
-- Should use idx_arrangements_visibility
```

## Validation Gates

### Level 1: Migration Syntax
```bash
supabase db lint
# No SQL syntax errors
```

### Level 2: Migration Execution
```bash
supabase db reset
# All migrations run successfully
```

### Level 3: Type Generation
```bash
supabase gen types typescript --local > src/lib/database.types.ts
npm run build
# TypeScript compiles without errors
```

### Level 4: RLS Testing
```bash
npm test -- migration.test.ts
# RLS policies work correctly
```

### Level 5: Performance Validation
```sql
-- Run performance queries
-- p95 < 500ms for all standard queries
```

## Rollback Procedures

```sql
-- Rollback migration template
-- supabase/migrations/20240825000001_rollback_permission_tables.sql

DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS permission_groups CASCADE;
DROP TABLE IF EXISTS custom_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

-- Remove indexes
DROP INDEX IF EXISTS idx_arrangements_visibility;
DROP INDEX IF EXISTS idx_songs_search;
-- ... etc

-- Remove policies
DROP POLICY IF EXISTS "arrangements_public_read" ON arrangements;
DROP POLICY IF EXISTS "arrangements_owner_all" ON arrangements;
-- ... etc
```

## Migration Commands Reference

```bash
# Initialize Supabase
supabase init

# Start local database
supabase start

# Create new migration
supabase migration new add_permission_tables

# Run migrations
supabase db reset           # Drop and recreate with migrations
supabase migration up        # Run pending migrations

# Generate types
supabase gen types typescript --local > src/lib/database.types.ts

# Push to production
supabase db push            # Apply to remote database

# Diff local vs remote
supabase db diff

# Create migration from diff
supabase db diff -f migration_name
```

## Common Migration Patterns

### Adding a Table with RLS
```sql
-- 1. Create table
CREATE TABLE IF NOT EXISTS my_table (...);

-- 2. Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
CREATE POLICY "my_table_read" ON my_table
  FOR SELECT USING (...);

-- 4. Add indexes
CREATE INDEX IF NOT EXISTS idx_my_table_field 
  ON my_table(field);

-- 5. Add triggers
CREATE TRIGGER update_my_table_updated_at
  BEFORE UPDATE ON my_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Adding Computed Columns
```sql
-- Add generated column for search
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', title || ' ' || COALESCE(artist, ''))
) STORED;

CREATE INDEX idx_songs_search_vector 
  ON songs USING gin(search_vector);
```

## Monitoring & Alerts

```typescript
// Monitor migration status
async function checkMigrationHealth() {
  const tables = [
    'permissions',
    'custom_roles',
    'permission_groups',
    'user_permissions',
    'moderation_log',
    'content_reports'
  ]
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select('count')
      .limit(1)
    
    if (error) {
      console.error(`Table ${table} not accessible:`, error)
    }
  }
}
```

## Final Validation Checklist

- [ ] All 6 missing tables created
- [ ] All indexes created and being used
- [ ] RLS policies enforce correct access
- [ ] TypeScript types generated without errors
- [ ] Performance benchmarks show 30% improvement
- [ ] Rollback procedures tested
- [ ] Seed data loads correctly
- [ ] Documentation updated
- [ ] Team notified of schema changes
- [ ] Monitoring confirms health