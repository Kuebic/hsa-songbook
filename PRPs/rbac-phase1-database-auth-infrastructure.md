name: "RBAC Phase 1 - Database & Auth Infrastructure"
description: |
  Implementation of core RBAC database schema, Supabase auth hooks, and updated authentication layer for HSA Songbook

---

## Goal

**Feature Goal**: Establish the foundational RBAC infrastructure with database schema, auth hooks, and JWT claim integration

**Deliverable**: Working auth hook system that adds role claims to JWTs, database tables for role management, and updated useAuth hook

**Success Definition**: Users can be assigned roles, JWT tokens contain role claims, and the application can read these claims

## User Persona

**Target User**: System Administrators

**Use Case**: Assigning roles to users and having those roles reflected in their authentication tokens

**User Journey**: 
1. Admin assigns role to user via database
2. User logs in or refreshes token
3. JWT contains role claim
4. Application reads role from JWT

**Pain Points Addressed**: 
- No way to distinguish admin/moderator users
- Basic email-based admin check is not scalable
- No audit trail for permission changes

## Why

- Enables granular permission management for content moderation
- Provides foundation for delegating administrative tasks
- Creates secure, database-backed role system
- Establishes audit trail for compliance

## What

Implement Supabase auth hooks with custom JWT claims for role-based access control, including database schema for role management and client-side token decoding.

### Success Criteria

- [ ] Database tables created for roles and audit logging
- [ ] Auth hook function adds role claims to JWT
- [ ] useAuth hook decodes and exposes role information
- [ ] Existing authentication continues to work
- [ ] Role changes reflected within token refresh cycle

## All Needed Context

### Context Completeness Check

_This PRP contains all database patterns, auth hook implementation details, and client integration needed for implementation without prior knowledge._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
  why: Official documentation for implementing custom access token hooks
  critical: Hook must return required claims (iss, aud, exp, iat, sub, role, aal, session_id)

- url: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
  why: Complete RBAC implementation guide with PostgreSQL functions
  critical: Shows proper permission grants for supabase_auth_admin role

- file: src/features/auth/hooks/useAuth.ts
  why: Current auth implementation to extend with role support
  pattern: Authentication state management and token handling
  gotcha: Must maintain backward compatibility with existing auth flow

- file: src/lib/database.types.ts
  why: TypeScript types for database schema
  pattern: How to structure database type definitions
  gotcha: Must regenerate after migration with npx supabase gen types

- file: supabase/migrations/20240121_add_multilingual_lyrics.sql
  why: Example of proper migration structure
  pattern: Migration file naming, IF NOT EXISTS checks, index creation
  gotcha: Always include rollback considerations

- docfile: PRPs/ai_docs/supabase-auth-hooks-rbac-guide.md
  why: Comprehensive guide for auth hooks implementation
  section: All sections - covers configuration, implementation, security

- docfile: PRPs/ai_docs/hsa-songbook-database-patterns.md
  why: Established patterns for services, hooks, and database operations
  section: Database Migration Patterns, Service Layer Patterns
```

### Current Codebase tree

```bash
hsa-songbook/
├── supabase/
│   ├── migrations/
│   │   ├── 20240108_initial_schema.sql
│   │   ├── 20240121_add_multilingual_lyrics.sql
│   │   └── ... other migrations
│   └── config.toml
├── src/
│   ├── features/
│   │   └── auth/
│   │       ├── hooks/
│   │       │   └── useAuth.ts
│   │       ├── components/
│   │       │   └── ProtectedRoute.tsx
│   │       └── types/
│   │           └── index.ts
│   └── lib/
│       ├── supabase.ts
│       └── database.types.ts
```

### Desired Codebase tree with files to be added

```bash
hsa-songbook/
├── supabase/
│   ├── migrations/
│   │   ├── ... existing migrations
│   │   └── 20250121_add_rbac_infrastructure.sql  # NEW: RBAC schema and auth hook
│   └── config.toml  # MODIFIED: Enable auth hooks
├── src/
│   ├── features/
│   │   └── auth/
│   │       ├── hooks/
│   │       │   ├── useAuth.ts  # MODIFIED: Add role decoding
│   │       │   └── useRoles.ts  # NEW: Role-specific hook
│   │       ├── types/
│   │       │   └── index.ts  # MODIFIED: Add role types
│   │       └── utils/
│   │           └── jwt.ts  # NEW: JWT decoding utilities
│   └── lib/
│       └── database.types.ts  # REGENERATED: Include new tables
├── .env.local  # MODIFIED: Add auth hook env vars (for local dev)
└── package.json  # MODIFIED: Add jwt-decode dependency
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Supabase auth hooks require specific setup
// 1. Must run `supabase stop` then `supabase start` after config changes
// 2. `supabase db reset` alone won't activate hooks
// 3. Auth hooks only modify access_token, not the auth response object

// CRITICAL: JWT limitations
// - Role changes don't take effect until token refresh (typically 1 hour)
// - Cannot invalidate tokens once issued
// - Must handle stale role data gracefully

// CRITICAL: Database permissions
// supabase_auth_admin needs explicit grants to access custom tables
// Never use SECURITY DEFINER in auth hook functions
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/features/auth/types/index.ts - Add to existing types
export type UserRole = 'admin' | 'moderator' | 'user'

export interface RoleInfo {
  role: UserRole
  grantedBy: string
  grantedAt: string
  expiresAt?: string
  isActive: boolean
}

export interface JWTClaims {
  sub: string
  email: string
  user_role?: UserRole
  can_moderate?: boolean
  can_admin?: boolean
  [key: string]: any
}

export interface AuthStateWithRoles extends AuthState {
  userRole: UserRole
  permissions: {
    canModerate: boolean
    canAdmin: boolean
  }
}

// Database types will be auto-generated after migration
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: INSTALL jwt-decode package
  - RUN: npm install jwt-decode
  - VERIFY: Package added to package.json dependencies
  - PLACEMENT: Project root

Task 2: CREATE supabase/migrations/20250121_add_rbac_infrastructure.sql
  - IMPLEMENT: Complete RBAC database schema with tables, functions, policies
  - FOLLOW pattern: supabase/migrations/20240121_add_multilingual_lyrics.sql
  - INCLUDE: user_roles table, role_audit_log table, custom_access_token_hook function
  - CRITICAL: Grant permissions to supabase_auth_admin, revoke from public
  - PLACEMENT: supabase/migrations/ directory

Task 3: MODIFY supabase/config.toml for local development
  - ADD: Auth hook configuration section
  - ENABLE: custom_access_token_hook
  - PLACEMENT: supabase/config.toml

Task 4: CREATE src/features/auth/utils/jwt.ts
  - IMPLEMENT: JWT decoding utilities with error handling
  - EXPORTS: decodeJWT, extractRoleClaims functions
  - DEPENDENCIES: jwt-decode package
  - PLACEMENT: New utils directory in auth feature

Task 5: CREATE src/features/auth/hooks/useRoles.ts
  - IMPLEMENT: Dedicated hook for role management
  - FOLLOW pattern: src/features/auth/hooks/useAuth.ts
  - METHODS: getUserRole, hasPermission, isInRole
  - DEPENDENCIES: JWT utils from Task 4
  - PLACEMENT: Alongside existing auth hooks

Task 6: MODIFY src/features/auth/hooks/useAuth.ts
  - ENHANCE: Add role decoding to existing auth flow
  - INTEGRATE: JWT decoding for custom claims
  - MAINTAIN: Backward compatibility
  - ADD: userRole, isModerator, permissions to return object
  - DEPENDENCIES: JWT utils from Task 4

Task 7: APPLY database migration and regenerate types
  - RUN: npx supabase db push (or migration up for production)
  - RUN: npx supabase gen types typescript --local > src/lib/database.types.ts
  - VERIFY: New tables appear in database.types.ts
  - PLACEMENT: src/lib/database.types.ts

Task 8: CREATE test file src/features/auth/hooks/useRoles.test.ts
  - IMPLEMENT: Unit tests for role hook
  - FOLLOW pattern: Existing test files
  - COVERAGE: Role extraction, permission checks, error cases
  - PLACEMENT: Test file alongside implementation
```

### Implementation Patterns & Key Details

```typescript
// Task 2: Database Migration (20250121_add_rbac_infrastructure.sql)
-- Migration: RBAC Infrastructure
-- Date: 2025-01-21
-- Description: Adds role-based access control with auth hooks

-- Create enum for roles
CREATE TYPE public.user_role AS ENUM ('admin', 'moderator', 'user');

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user',
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id)
);

-- Audit log for role changes
CREATE TABLE IF NOT EXISTS public.role_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    role user_role NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('grant', 'revoke', 'expire')),
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    metadata JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.role_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_at ON public.role_audit_log(performed_at DESC);

-- Custom access token hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    claims jsonb;
    user_role_value public.user_role;
BEGIN
    -- Extract existing claims
    claims := event->'claims';
    
    -- Get user's active role
    SELECT role INTO user_role_value
    FROM public.user_roles
    WHERE user_id = (event->>'user_id')::uuid
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1;
    
    -- Add role to claims (default to 'user' if no role found)
    IF user_role_value IS NOT NULL THEN
        claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role_value::text));
    ELSE
        claims := jsonb_set(claims, '{user_role}', '"user"');
        user_role_value := 'user';
    END IF;
    
    -- Add permission flags for convenience
    claims := jsonb_set(claims, '{can_moderate}', 
        to_jsonb(user_role_value IN ('admin', 'moderator')));
    claims := jsonb_set(claims, '{can_admin}', 
        to_jsonb(user_role_value = 'admin'));
    
    -- Update event with modified claims
    event := jsonb_set(event, '{claims}', claims);
    
    RETURN event;
EXCEPTION WHEN OTHERS THEN
    -- Log error and return original event to avoid blocking auth
    RAISE LOG 'Error in custom_access_token_hook: %', SQLERRM;
    RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT SELECT ON public.user_roles TO supabase_auth_admin;
GRANT INSERT, UPDATE ON public.role_audit_log TO supabase_auth_admin;

-- Revoke public access
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- RLS Policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can see their own role
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Only admins can manage roles (will check JWT claim)
CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (
        (auth.jwt() ->> 'user_role') = 'admin'
    );

-- Audit log is read-only for admins
CREATE POLICY "Admins can view audit log" ON public.role_audit_log
    FOR SELECT USING (
        (auth.jwt() ->> 'user_role') = 'admin'
    );

-- Comments for documentation
COMMENT ON TABLE public.user_roles IS 'Stores user role assignments for RBAC';
COMMENT ON TABLE public.role_audit_log IS 'Audit trail for all role changes';
COMMENT ON FUNCTION public.custom_access_token_hook IS 'Auth hook to add role claims to JWT';

// Task 3: Config modification (supabase/config.toml)
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"

// Task 4: JWT utilities (src/features/auth/utils/jwt.ts)
import { jwtDecode } from 'jwt-decode'
import type { JWTClaims, UserRole } from '../types'

export function decodeJWT(token: string): JWTClaims | null {
  try {
    return jwtDecode<JWTClaims>(token)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

export function extractRoleClaims(token: string): {
  role: UserRole
  canModerate: boolean
  canAdmin: boolean
} {
  const claims = decodeJWT(token)
  
  return {
    role: (claims?.user_role as UserRole) || 'user',
    canModerate: claims?.can_moderate || false,
    canAdmin: claims?.can_admin || false
  }
}

// Task 5: Role hook (src/features/auth/hooks/useRoles.ts)
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { extractRoleClaims } from '../utils/jwt'
import type { UserRole } from '../types'

export function useRoles() {
  const [userRole, setUserRole] = useState<UserRole>('user')
  const [permissions, setPermissions] = useState({
    canModerate: false,
    canAdmin: false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRoles = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.access_token) {
        const roleClaims = extractRoleClaims(session.access_token)
        setUserRole(roleClaims.role)
        setPermissions({
          canModerate: roleClaims.canModerate,
          canAdmin: roleClaims.canAdmin
        })
      }
      
      setLoading(false)
    }

    loadRoles()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.access_token) {
          const roleClaims = extractRoleClaims(session.access_token)
          setUserRole(roleClaims.role)
          setPermissions({
            canModerate: roleClaims.canModerate,
            canAdmin: roleClaims.canAdmin
          })
        } else {
          setUserRole('user')
          setPermissions({ canModerate: false, canAdmin: false })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const hasPermission = (permission: 'moderate' | 'admin'): boolean => {
    if (permission === 'moderate') return permissions.canModerate
    if (permission === 'admin') return permissions.canAdmin
    return false
  }

  const isInRole = (role: UserRole): boolean => {
    if (role === 'admin') return userRole === 'admin'
    if (role === 'moderator') return userRole === 'moderator' || userRole === 'admin'
    return true // Everyone is a 'user'
  }

  return {
    userRole,
    permissions,
    loading,
    hasPermission,
    isInRole,
    isModerator: permissions.canModerate,
    isAdmin: permissions.canAdmin
  }
}

// Task 6: Enhanced useAuth hook (modifications to src/features/auth/hooks/useAuth.ts)
// Add imports at top
import { extractRoleClaims } from '../utils/jwt'
import type { UserRole } from '../types'

// Add to useAuth hook state
const [userRole, setUserRole] = useState<UserRole>('user')
const [permissions, setPermissions] = useState({
  canModerate: false,
  canAdmin: false
})

// Modify initializeAuth function
const initializeAuth = async () => {
  try {
    const session = await getCurrentSession()
    const user = session?.user || null
    
    // Extract role claims if session exists
    let roleInfo = { role: 'user' as UserRole, canModerate: false, canAdmin: false }
    if (session?.access_token) {
      roleInfo = extractRoleClaims(session.access_token)
    }
    
    setAuthState({
      user,
      session,
      isLoaded: true,
      isSignedIn: !!user
    })
    
    setUserRole(roleInfo.role)
    setPermissions({
      canModerate: roleInfo.canModerate,
      canAdmin: roleInfo.canAdmin
    })
    
    // Existing user sync code...
  } catch (error) {
    // Existing error handling...
  }
}

// Update return object
return {
  // Existing properties...
  userRole,
  isModerator: permissions.canModerate,
  isAdmin: permissions.canAdmin,  // Now based on JWT claim
  permissions,
  // Rest of existing properties...
}
```

### Integration Points

```yaml
DATABASE:
  - migration: "supabase/migrations/20250121_add_rbac_infrastructure.sql"
  - rls: "Policies created for user_roles and role_audit_log tables"

TYPES:
  - update: "src/lib/database.types.ts"
  - generate: "npx supabase gen types typescript --local > src/lib/database.types.ts"

CONFIG:
  - local: "supabase/config.toml - add auth hook configuration"
  - env: ".env.local - add GOTRUE_HOOK variables for Docker deployment"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After installing jwt-decode
npm list jwt-decode                  # Verify package installed

# After creating TypeScript files
npm run lint                         # ESLint check
npm run build                        # TypeScript compilation

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new role hook
npm run test -- src/features/auth/hooks/useRoles.test.ts

# Test modified auth hook
npm run test -- src/features/auth/hooks/useAuth.test.ts

# Run all auth tests
npm run test -- src/features/auth

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Apply migration to local database
npx supabase db push --local

# Verify tables created
npx supabase db query "SELECT * FROM user_roles LIMIT 1" --local
npx supabase db query "SELECT * FROM role_audit_log LIMIT 1" --local

# Test auth hook function directly
npx supabase db query "SELECT public.custom_access_token_hook(
  jsonb_build_object(
    'user_id', '00000000-0000-0000-0000-000000000000',
    'claims', jsonb_build_object(
      'sub', '00000000-0000-0000-0000-000000000000',
      'email', 'test@example.com',
      'role', 'authenticated'
    )
  )
)" --local

# Restart Supabase to activate hooks
npx supabase stop
npx supabase start

# Start development server
npm run dev

# Manual testing:
# 1. Open browser console
# 2. Log in as a user
# 3. Check localStorage for supabase.auth.token
# 4. Decode the access_token to verify claims

# Expected: Auth hook adds user_role claim to JWT
```

### Level 4: RBAC-Specific Validation

```bash
# Insert test role via SQL
npx supabase db query "
  INSERT INTO user_roles (user_id, role, is_active) 
  VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'admin',
    true
  )
" --local

# Test role assignment
# 1. Log out and log back in
# 2. In browser console:
const { data: { session } } = await supabase.auth.getSession()
console.log('Token:', session.access_token)
# 3. Decode token at jwt.io or in console
# 4. Verify user_role claim is present

# Test permission checks in app
# 1. Check that useAuth hook returns correct role
# 2. Verify isAdmin/isModerator flags

# Expected: Role claims properly added and accessible
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Database migration applied without errors
- [ ] Auth hook function executes without errors
- [ ] JWT tokens contain role claims
- [ ] Types regenerated and compile without errors

### Feature Validation

- [ ] User roles table created and accessible
- [ ] Audit log table created with proper structure
- [ ] Auth hook adds claims to JWT tokens
- [ ] useAuth hook exposes role information
- [ ] Backward compatibility maintained

### Code Quality Validation

- [ ] Follows existing database migration patterns
- [ ] Auth hook includes error handling
- [ ] TypeScript types properly defined
- [ ] No hardcoded values
- [ ] Comprehensive error logging

### Documentation & Deployment

- [ ] Migration includes detailed comments
- [ ] Config changes documented
- [ ] JWT claim structure documented
- [ ] Environment variables documented

---

## Anti-Patterns to Avoid

- ❌ Don't use SECURITY DEFINER in auth hook functions
- ❌ Don't store sensitive data in JWT claims
- ❌ Don't skip the supabase stop/start after config changes
- ❌ Don't forget to grant permissions to supabase_auth_admin
- ❌ Don't use user_metadata for authorization (users can modify it)
- ❌ Don't expect immediate role changes (JWT refresh required)
- ❌ Don't skip error handling in the auth hook