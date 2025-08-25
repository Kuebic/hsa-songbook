# Supabase Database Migrations

This directory contains all database migrations for the HSA Songbook application. Migrations are version-controlled SQL files that define schema changes and are applied in sequential order.

## Migration Workflow

### Creating a New Migration

1. **Generate a new migration file:**
   ```bash
   supabase migration new <descriptive_name>
   ```
   This creates a new file with timestamp prefix: `YYYYMMDDHHMMSS_descriptive_name.sql`

2. **Write your migration SQL:**
   - Always wrap migrations in a transaction (`BEGIN;` ... `COMMIT;`)
   - Include both schema changes and necessary data migrations
   - Add appropriate indexes for foreign keys and frequently queried columns
   - Include RLS policies for new tables

3. **Test locally:**
   ```bash
   supabase db reset
   ```
   This will apply all migrations to a fresh database

4. **Generate TypeScript types:**
   ```bash
   npm run types:generate
   ```

### Migration Naming Conventions

- **Format:** `YYYYMMDDHHMMSS_descriptive_name.sql`
- **Examples:**
  - `20250121120000_add_user_preferences.sql`
  - `20250122093000_create_song_history_table.sql`
  - `20250123140000_add_index_to_arrangements.sql`

### Migration Best Practices

#### DO:
- ✅ Use descriptive names that explain the change
- ✅ Include both `up` changes in your migration
- ✅ Test migrations on a fresh database (`supabase db reset`)
- ✅ Include indexes for foreign keys and commonly queried fields
- ✅ Define RLS policies for all new tables
- ✅ Use `IF NOT EXISTS` for creating tables/indexes
- ✅ Use transactions (`BEGIN;` ... `COMMIT;`)
- ✅ Add comments to complex migrations

#### DON'T:
- ❌ Edit migrations after they've been committed
- ❌ Use `DROP` commands without `CASCADE` consideration
- ❌ Mix schema and data migrations unnecessarily
- ❌ Forget to update TypeScript types after migrations
- ❌ Skip testing migrations locally
- ❌ Use timestamp functions that vary between environments

## Common Migration Patterns

### Creating a New Table

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS public.table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "table_name_select_policy" 
    ON public.table_name FOR SELECT 
    USING (true);

CREATE POLICY "table_name_insert_policy" 
    ON public.table_name FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Add indexes
CREATE INDEX idx_table_name_created_by ON public.table_name(created_by);

-- Add update trigger
CREATE TRIGGER update_table_name_updated_at 
    BEFORE UPDATE ON public.table_name
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

### Adding a Column

```sql
BEGIN;

ALTER TABLE public.table_name 
    ADD COLUMN IF NOT EXISTS column_name TEXT DEFAULT 'default_value';

-- Add index if needed
CREATE INDEX IF NOT EXISTS idx_table_name_column_name 
    ON public.table_name(column_name);

COMMIT;
```

### Creating an Index

```sql
BEGIN;

-- Standard index
CREATE INDEX IF NOT EXISTS idx_table_column 
    ON public.table_name(column_name);

-- Composite index
CREATE INDEX IF NOT EXISTS idx_table_multi_columns 
    ON public.table_name(column1, column2);

-- GIN index for arrays/JSONB
CREATE INDEX IF NOT EXISTS idx_table_array_column 
    ON public.table_name USING GIN(array_column);

-- Partial index
CREATE INDEX IF NOT EXISTS idx_table_partial 
    ON public.table_name(column_name) 
    WHERE is_active = true;

COMMIT;
```

### Adding a Foreign Key

```sql
BEGIN;

ALTER TABLE public.child_table 
    ADD CONSTRAINT fk_child_parent 
    FOREIGN KEY (parent_id) 
    REFERENCES public.parent_table(id) 
    ON DELETE CASCADE;

-- Add index for the foreign key
CREATE INDEX IF NOT EXISTS idx_child_parent_id 
    ON public.child_table(parent_id);

COMMIT;
```

### Creating a View

```sql
BEGIN;

CREATE OR REPLACE VIEW public.view_name AS
SELECT 
    t1.id,
    t1.name,
    COUNT(t2.id) as related_count
FROM public.table1 t1
LEFT JOIN public.table2 t2 ON t1.id = t2.table1_id
GROUP BY t1.id;

-- Grant permissions if needed
GRANT SELECT ON public.view_name TO authenticated;

COMMIT;
```

### Creating an Enum Type

```sql
BEGIN;

-- Create enum type
CREATE TYPE public.status_type AS ENUM ('draft', 'published', 'archived');

-- Use in table
ALTER TABLE public.content 
    ADD COLUMN status public.status_type DEFAULT 'draft';

COMMIT;
```

## Rollback Procedures

While Supabase doesn't support automatic rollbacks, you can create compensating migrations:

1. **Identify the migration to reverse**
2. **Create a new migration that undoes the changes:**
   ```bash
   supabase migration new revert_<original_migration_name>
   ```
3. **Write the reversal SQL**
4. **Test thoroughly before applying**

### Example Rollback Migration

```sql
-- Original: 20250122_add_user_preferences.sql
-- Rollback: 20250123_revert_add_user_preferences.sql

BEGIN;

-- Drop the table (cascades to dependent objects)
DROP TABLE IF EXISTS public.user_preferences CASCADE;

-- Remove any functions created
DROP FUNCTION IF EXISTS public.get_user_preferences(UUID);

COMMIT;
```

## Troubleshooting

### Common Issues and Solutions

#### Migration Conflicts
**Problem:** Multiple developers created migrations with conflicting timestamps.
**Solution:** Rename one migration file with a new timestamp:
```bash
mv 20250122120000_feature_a.sql 20250122120001_feature_a.sql
```

#### Permission Errors
**Problem:** Migration fails with permission denied.
**Solution:** Ensure proper ownership and grants:
```sql
ALTER TABLE public.table_name OWNER TO postgres;
GRANT ALL ON public.table_name TO authenticated;
```

#### Failed Migration Application
**Problem:** Migration partially applied before failing.
**Solution:** 
1. Manually check what was applied: `supabase migration list`
2. Clean up partial changes manually
3. Fix the migration file
4. Re-run: `supabase db reset`

#### Type Generation Issues
**Problem:** TypeScript types don't reflect schema changes.
**Solution:**
```bash
# Ensure migrations are applied
supabase db reset
# Regenerate types
npm run types:generate
# Verify the file was updated
git diff src/lib/database.types.ts
```

#### RLS Policy Conflicts
**Problem:** New RLS policy conflicts with existing ones.
**Solution:** Check existing policies first:
```sql
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

## Migration Checklist

Before committing a migration:

- [ ] Migration wrapped in transaction (`BEGIN;` ... `COMMIT;`)
- [ ] Tested with `supabase db reset`
- [ ] TypeScript types regenerated
- [ ] Indexes added for foreign keys
- [ ] RLS policies defined for new tables
- [ ] Migration file follows naming convention
- [ ] No syntax errors (validated with `supabase db lint`)
- [ ] Works on fresh database
- [ ] Documented complex logic with comments

## Useful Commands

```bash
# List all migrations and their status
supabase migration list

# Apply pending migrations
supabase migration up

# Reset database and reapply all migrations
supabase db reset

# Create a new migration
supabase migration new <name>

# Validate SQL syntax
supabase db lint <migration_file>

# Generate TypeScript types
supabase gen types typescript --local > src/lib/database.types.ts

# Show current schema diff
supabase db diff

# Push migrations to remote
supabase db push
```

## References

- [Supabase Migration Documentation](https://supabase.com/docs/guides/deployment/database-migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)