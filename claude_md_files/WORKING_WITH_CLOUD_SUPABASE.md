# Working with Cloud-Based Supabase

## Overview

This guide covers working with cloud-hosted Supabase databases when using Claude Code, including best practices for database introspection, schema management, and debugging.

## Database Schema Introspection

### Primary Method: database.types.ts (Recommended)

The most reliable way to share database schema with Claude Code is through the TypeScript types file:

```typescript
// src/lib/database.types.ts
export type Database = {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string
          user_id: string | null
          role: "admin" | "moderator" | "user"
          granted_by: string | null
          granted_at: string | null
          expires_at: string | null
          is_active: boolean | null
        }
        // ... Insert, Update types
      }
    }
    Enums: {
      user_role: "admin" | "moderator" | "user"
    }
    Functions: {
      grant_user_role: { /* ... */ }
    }
  }
}
```

**Benefits:**
- ✅ Complete type safety
- ✅ Shows exact column names, types, nullability
- ✅ Includes enums, functions, relationships
- ✅ No authentication required
- ✅ Always up-to-date if properly maintained

### Updating Database Types

```bash
# Generate fresh types from cloud database
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

**Note:** Run this after any database schema changes.

## Common Cloud Supabase Issues

### 1. CLI Authentication Problems

**Issue:** CLI commands fail with password authentication errors
```
failed SASL auth (FATAL: password authentication failed for user "postgres")
```

**Solutions:**
- Use `database.types.ts` instead of CLI introspection
- Set up database password in Supabase dashboard
- Use manual SQL execution in Supabase SQL Editor for one-off changes

### 2. Migration State Synchronization

**Problem:** Manual SQL Editor changes vs CLI migration tracking get out of sync

**Best Practices:**
```bash
# Option A: Mark manually-applied migrations as complete
npx supabase migration repair <timestamp>_migration_name

# Option B: Document manual applications
-- Status: ✅ APPLIED MANUALLY on 2025-01-23

# Option C: Use --dry-run to preview changes
npx supabase db push --dry-run
```

### 3. RLS Policy Debugging

**Common Error Pattern:**
```
Error { code: "42P17", message: 'infinite recursion detected in policy for relation "user_roles"' }
```

**Root Cause:** Circular dependency between RLS policies and JWT claims
```sql
-- PROBLEMATIC: Policy depends on JWT claim
CREATE POLICY "admin_policy" ON user_roles
  USING ((auth.jwt() ->> 'user_role') = 'admin');

-- JWT populated by auth hook that queries user_roles table
-- → Infinite recursion!
```

**Solution:** Use SECURITY DEFINER functions to bypass RLS
```sql
CREATE OR REPLACE FUNCTION public.check_admin_role(user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = user_id_param AND role = 'admin' AND is_active = true
    );
END;
$$;

CREATE POLICY "admin_policy" ON user_roles
  USING (public.check_admin_role());
```

## Debugging Database Issues with Claude Code

### 1. Share Schema Context

**Always provide** `database.types.ts` when working on database-related issues:
```
Claude, I'm having database issues. Here's my current schema:
[paste relevant sections from src/lib/database.types.ts]
```

### 2. Include Error Messages

**Provide complete error objects:**
```javascript
Error fetching roles: 
Object { 
  code: "42P17", 
  details: null, 
  hint: null, 
  message: 'infinite recursion detected in policy for relation "user_roles"' 
}
```

### 3. Share Relevant Code Context

Include the service/hook code that's failing:
```typescript
// src/features/admin/services/adminService.ts
const { data, error } = await supabase
  .from('user_roles')
  .select('*')
  .eq('is_active', true)
```

## Database Change Workflows

### For Small Changes (Recommended)
1. **Make changes in Supabase SQL Editor**
2. **Update database.types.ts**
   ```bash
   npx supabase gen types typescript --project-id YOUR_ID > src/lib/database.types.ts
   ```
3. **Commit both schema and types**
4. **Document in migration file** for reference

### For Large Changes
1. **Create migration file locally**
2. **Test locally with Docker** (if available)
3. **Apply via CLI** or **SQL Editor**
4. **Update types and commit**

## Project-Specific Notes

### HSA Songbook Database Structure

**Core RBAC Tables:**
- `users` - User profiles (synced from auth.users)
- `user_roles` - Role assignments with expiration
- `role_audit_log` - Audit trail for role changes

**Key Functions:**
- `grant_user_role(target_user_id, new_role, reason?)`
- `revoke_user_role(target_user_id, reason?)`
- `check_admin_role(user_id?)` - Security definer for RLS

**Authentication Flow:**
1. User signs in → auth.users populated
2. Custom auth hook → syncs to public.users  
3. JWT claims populated from user_roles
4. RLS policies use check_admin_role() function

## Best Practices Summary

### ✅ Do This
- Always share `database.types.ts` when working on database issues
- Use SECURITY DEFINER functions to avoid RLS recursion
- Document manually-applied migrations
- Update types file after schema changes
- Include complete error messages and context

### ❌ Avoid This
- Don't rely on CLI introspection for debugging (auth issues)
- Don't create RLS policies that depend on JWT claims populated by the same table
- Don't let migration state get out of sync
- Don't make database assumptions without seeing types file

## Future Improvements

- Set up GitHub Actions to auto-update database.types.ts
- Create database change templates
- Implement database diff checking in CI/CD
- Document all custom functions and policies

---

*Last updated: 2025-01-23*
*Project: HSA Songbook*