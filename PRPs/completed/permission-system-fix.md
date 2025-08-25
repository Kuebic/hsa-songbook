name: "Permission System Fix PRP - Foundation Phase 1"
description: |

---

## Goal

**Feature Goal**: Fix the non-functional permission system by implementing real database queries and removing stub implementations

**Deliverable**: Functional permission service that queries the existing `user_roles` table and returns actual permission data

**Success Definition**: Permission checks work correctly throughout the application with real data from the database, no more stub returns

## User Persona

**Target User**: All application users (users, moderators, admins)

**Use Case**: Users need proper access control to features based on their assigned roles

**User Journey**: 
1. User logs in via Clerk authentication
2. System queries user_roles table for their role
3. Permission service derives appropriate permissions from role
4. UI shows/hides features based on actual permissions
5. API enforces permission checks on protected operations

**Pain Points Addressed**: 
- Users see non-functional permission UI elements
- Admins cannot manage permissions
- RBAC implementation completely blocked
- Security risks from mock permission data

## Why

- Unblocks RBAC implementation for proper access control
- Removes user confusion from non-functional UI elements
- Enables proper security enforcement
- Establishes foundation for future permission features

## What

Implement a functional permission service that:
- Queries the existing `user_roles` table for actual role data
- Derives permissions from roles using predefined permission sets
- Caches permission data for performance
- Hides non-functional UI elements until fully implemented
- Returns minimal permissions on errors (fail-safe)

### Success Criteria

- [ ] Permission service returns real data from user_roles table
- [ ] Admin users can access admin features
- [ ] Moderator users can access moderation features  
- [ ] Regular users have appropriate restrictions
- [ ] Non-functional UI elements are hidden
- [ ] No console errors related to permissions
- [ ] Permission checks use cached data for performance

## All Needed Context

### Context Completeness Check

_All database connections, type definitions, existing patterns, and fallback logic are documented below for one-pass implementation success._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/features/permissions/services/permissionService.ts
  why: Current stub implementation that needs to be fixed
  pattern: Service class structure, method signatures to maintain
  gotcha: Every method currently returns empty data or throws errors

- file: src/features/permissions/hooks/usePermissions.ts
  why: Hook that consumes permission service, has fallback logic
  pattern: Lines 230-270 show fallback permission logic to replicate
  gotcha: Lines 93-94 pass empty arrays due to missing tables

- file: src/features/permissions/types/permission.types.ts
  why: Complete type definitions for permissions system
  pattern: All interfaces and types are already defined
  gotcha: DBPermission types reference non-existent tables

- file: src/lib/database.types.ts
  why: user_roles table structure (lines 548-579)
  pattern: Database type definitions for Supabase queries
  gotcha: Only user_roles table exists, others are missing

- file: src/lib/supabase.ts
  why: Supabase client for database queries
  pattern: Client initialization and helper functions
  gotcha: Must handle PGRST116 error for missing rows

- file: src/features/auth/contexts/AuthContext.tsx
  why: Auth context that provides user information
  pattern: Lines 18-26 show auth properties to integrate with
  gotcha: JWT claims already include basic role info

- file: src/app/pages/PermissionManagement.tsx
  why: UI component that needs to be conditionally hidden
  pattern: Component structure and permission checks
  gotcha: Currently non-functional, must be hidden

- docfile: PRPs/foundation-phase1-critical-fixes-prd.md
  why: Original requirements and implementation details
  section: Epic 1: Fix Permission System (lines 89-152)
```

### Current Codebase Structure

```bash
src/features/permissions/
├── services/
│   └── permissionService.ts      # STUB - needs implementation
├── hooks/
│   └── usePermissions.ts         # Has fallback logic
├── types/
│   └── permission.types.ts       # Complete type definitions
└── utils/
    └── permissionResolver.ts      # Complex resolution logic (unused)
```

### Desired Codebase Structure

```bash
src/features/permissions/
├── services/
│   └── permissionService.ts      # FIXED - queries real database
├── hooks/
│   └── usePermissions.ts         # Uses real service data
├── types/
│   └── permission.types.ts       # No changes needed
├── utils/
│   └── permissionResolver.ts      # Keep for future use
└── constants/
    └── rolePermissions.ts         # NEW - define role permission mappings
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Supabase returns PGRST116 error when no rows found
// Must handle this specific error code gracefully
if (error && error.code !== 'PGRST116') {
  // Only throw for actual errors, not missing data
}

// CRITICAL: user_roles table has nullable user_id
// Must handle null user_id in queries
.eq('user_id', userId)
.not('user_id', 'is', null)

// CRITICAL: Only user_roles table exists
// All other permission tables (custom_roles, permission_groups, etc.) don't exist
// Must return empty arrays for these until tables are created
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/features/permissions/constants/rolePermissions.ts
// Define static permission mappings for each role

import { Permission, UserRole } from '../types/permission.types'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    { action: 'read', resource: 'song', effect: 'allow', scope: 'global' },
    { action: 'read', resource: 'arrangement', effect: 'allow', scope: 'global' },
    { action: 'create', resource: 'arrangement', effect: 'allow', scope: 'own' },
    { action: 'update', resource: 'arrangement', effect: 'allow', scope: 'own' },
    { action: 'delete', resource: 'arrangement', effect: 'allow', scope: 'own' },
    { action: 'create', resource: 'setlist', effect: 'allow', scope: 'own' },
    { action: 'update', resource: 'setlist', effect: 'allow', scope: 'own' },
    { action: 'delete', resource: 'setlist', effect: 'allow', scope: 'own' },
  ],
  moderator: [
    // Include all user permissions
    ...ROLE_PERMISSIONS.user,
    { action: 'moderate', resource: 'song', effect: 'allow', scope: 'global' },
    { action: 'moderate', resource: 'arrangement', effect: 'allow', scope: 'global' },
    { action: 'approve', resource: 'song', effect: 'allow', scope: 'global' },
    { action: 'reject', resource: 'song', effect: 'allow', scope: 'global' },
    { action: 'flag', resource: 'arrangement', effect: 'allow', scope: 'global' },
    { action: 'update', resource: 'arrangement', effect: 'allow', scope: 'global' },
    { action: 'delete', resource: 'arrangement', effect: 'allow', scope: 'global' },
  ],
  admin: [
    // Admin has all permissions
    { action: '*', resource: '*', effect: 'allow', scope: 'global' },
  ],
}

// Helper to create minimal permission set for errors
export function createMinimalPermissionSet(userId: string): UserPermissionSet {
  return {
    userId,
    roles: [],
    customRoles: [],
    groups: [],
    directPermissions: [],
    effectivePermissions: [],
    evaluatedAt: new Date().toISOString(),
  }
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/features/permissions/constants/rolePermissions.ts
  - IMPLEMENT: Static role-to-permission mappings
  - FOLLOW pattern: Permission structure from permission.types.ts
  - NAMING: ROLE_PERMISSIONS constant in UPPER_SNAKE_CASE
  - PLACEMENT: New constants directory in permissions feature

Task 2: UPDATE src/features/permissions/services/permissionService.ts - getUserPermissions method
  - IMPLEMENT: Real database query to user_roles table
  - FOLLOW pattern: Lines 104-139 from foundation PRD
  - QUERY: supabase.from('user_roles').select('*').eq('user_id', userId).eq('is_active', true)
  - ERROR HANDLING: Check for PGRST116 error code (no rows found)
  - DEPENDENCIES: Import ROLE_PERMISSIONS from Task 1
  - CACHE: Store result in memory for 5 minutes

Task 3: UPDATE src/features/permissions/services/permissionService.ts - checkPermission method
  - IMPLEMENT: Use cached permission data from getUserPermissions
  - FOLLOW pattern: Check effectivePermissions array for matching permission
  - LOGIC: Return true if permission found with 'allow' effect
  - DEPENDENCIES: Calls getUserPermissions from Task 2

Task 4: UPDATE src/features/permissions/services/permissionService.ts - derivePermissionsFromRole helper
  - IMPLEMENT: Map role to permissions using ROLE_PERMISSIONS
  - FOLLOW pattern: Return Permission[] based on UserRole input
  - DEPENDENCIES: Uses ROLE_PERMISSIONS from Task 1

Task 5: UPDATE src/features/permissions/services/permissionService.ts - stub remaining methods
  - IMPLEMENT: Keep throwing "not implemented" but with better messages
  - ADD: Console warning instead of error for expected missing features
  - REASON: These require database tables that don't exist yet

Task 6: UPDATE src/app/pages/PermissionManagement.tsx
  - IMPLEMENT: Add feature flag check to hide component
  - ADD: Early return with "Coming Soon" message
  - CONDITION: Only show for admin users AND when ENABLE_ADVANCED_PERMISSIONS flag is true
  - PLACEMENT: Top of component after auth check

Task 7: ADD feature flag for advanced permissions
  - CREATE: src/shared/config/features.ts
  - IMPLEMENT: export const ENABLE_ADVANCED_PERMISSIONS = false
  - USE: Import in PermissionManagement component

Task 8: UPDATE src/features/permissions/hooks/usePermissions.ts
  - REMOVE: TODOs on lines 93-94
  - VERIFY: Hook now receives real data from service
  - TEST: Ensure fallback logic still works for errors
```

### Implementation Patterns & Key Details

```typescript
// src/features/permissions/services/permissionService.ts

import { supabase } from '@/lib/supabase'
import { ROLE_PERMISSIONS, createMinimalPermissionSet } from '../constants/rolePermissions'

class PermissionService {
  private cache = new Map<string, { data: UserPermissionSet; timestamp: number }>()
  private CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  async getUserPermissions(userId: string): Promise<UserPermissionSet> {
    // Check cache first
    const cached = this.cache.get(userId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      // CRITICAL: Query actual user_roles table
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      // GOTCHA: Handle PGRST116 error (no rows found) gracefully
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user roles:', error)
        throw new Error('Failed to fetch user permissions')
      }

      // Build permission set from actual data
      const userRole = roleData?.role || 'user'
      const permissions = this.derivePermissionsFromRole(userRole)

      const permissionSet: UserPermissionSet = {
        userId,
        roles: roleData ? [userRole] : ['user'],
        customRoles: [], // Not implemented - no table
        groups: [], // Not implemented - no table
        directPermissions: permissions,
        effectivePermissions: permissions,
        evaluatedAt: new Date().toISOString(),
      }

      // Cache the result
      this.cache.set(userId, { 
        data: permissionSet, 
        timestamp: Date.now() 
      })

      return permissionSet
    } catch (error) {
      console.error('Permission service error:', error)
      // PATTERN: Return minimal permissions on error (fail-safe)
      return createMinimalPermissionSet(userId)
    }
  }

  async checkPermission(
    userId: string,
    permission: string,
    resource?: { type: string; id: string }
  ): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId)
      
      // Check if user has the required permission
      return permissions.effectivePermissions.some(p => {
        // Admin bypass - * means all permissions
        if (p.action === '*' && p.resource === '*') return true
        
        // Check specific permission
        if (p.action === permission && p.effect === 'allow') {
          // Check resource type if specified
          if (resource) {
            return p.resource === resource.type || p.resource === '*'
          }
          return true
        }
        
        return false
      })
    } catch (error) {
      console.error('Permission check error:', error)
      return false // Fail closed - deny on error
    }
  }

  private derivePermissionsFromRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user
  }

  // Methods that require non-existent tables - keep as stubs with better messages
  async createCustomRole(role: Omit<CustomRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomRole> {
    console.warn('Custom roles not implemented - requires database tables')
    throw new Error('Custom roles feature coming soon')
  }
}

// src/app/pages/PermissionManagement.tsx
import { ENABLE_ADVANCED_PERMISSIONS } from '@/shared/config/features'

export function PermissionManagement() {
  const { user, canAdmin } = useAuth()
  
  // PATTERN: Hide non-functional UI until fully implemented
  if (!ENABLE_ADVANCED_PERMISSIONS) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Permission Management</h2>
        <p className="text-muted-foreground">
          Advanced permission management coming soon!
        </p>
      </div>
    )
  }
  
  if (!canAdmin) {
    return <Navigate to="/" replace />
  }
  
  // ... rest of component
}
```

### Integration Points

```yaml
DATABASE:
  - table: "user_roles" (already exists)
  - query: "SELECT * FROM user_roles WHERE user_id = ? AND is_active = true"
  - no migrations needed for Phase 1

AUTH:
  - integration: "src/features/auth/contexts/AuthContext.tsx"
  - jwt claims: Already include user role information
  
CONFIG:
  - create: "src/shared/config/features.ts"
  - flag: "ENABLE_ADVANCED_PERMISSIONS = false"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification
npm run lint
npm run build

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test permission service
npm run test -- src/features/permissions/services/permissionService.test.ts

# Test permission hooks
npm run test -- src/features/permissions/hooks/usePermissions.test.ts

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Start development server
npm run dev

# Test permission flow
# 1. Login as admin user
# 2. Navigate to /admin - should be accessible
# 3. Check console for permission queries

# Test as regular user  
# 1. Login as regular user
# 2. Navigate to /admin - should redirect
# 3. Verify no permission errors in console

# Test Permission Management UI
# Navigate to /permissions - should show "Coming Soon" message

# Expected: Proper access control, no console errors
```

### Level 4: Domain-Specific Validation

```bash
# Verify Supabase queries
# Check Supabase logs for user_roles queries
# Verify query performance (should be < 100ms)

# Test permission caching
# 1. Make multiple permission checks rapidly
# 2. Verify only one database query in logs
# 3. Wait 5+ minutes
# 4. Make another check - should query database again

# Test error handling
# 1. Disconnect network
# 2. Try accessing protected route
# 3. Should fail gracefully with minimal permissions

# Expected: Efficient queries, proper caching, graceful failures
```

## Final Validation Checklist

### Technical Validation

- [ ] All validation levels completed successfully
- [ ] No TypeScript errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Permission service queries real database
- [ ] Cache implementation works correctly

### Feature Validation

- [ ] Admin users can access admin features
- [ ] Moderator users can access moderation features
- [ ] Regular users have appropriate restrictions
- [ ] Non-functional UI is hidden
- [ ] Permission checks use real data

### Code Quality Validation

- [ ] Follows existing service patterns
- [ ] Proper error handling with PGRST116 check
- [ ] Uses TypeScript strict mode
- [ ] No hardcoded values
- [ ] Proper caching implementation

### Documentation & Deployment

- [ ] Feature flag documented
- [ ] Cache TTL configurable
- [ ] Error messages are user-friendly
- [ ] Console warnings instead of errors for expected missing features

---

## Anti-Patterns to Avoid

- ❌ Don't query database on every permission check (use cache)
- ❌ Don't fail open - always deny on errors
- ❌ Don't show non-functional UI elements
- ❌ Don't ignore PGRST116 error handling
- ❌ Don't hardcode role permissions in service
- ❌ Don't throw errors for expected missing features
- ❌ Don't skip null checks on user_id
- ❌ Don't forget to clear cache on role changes