name: "RBAC Phase 4 - Fine-Grained Permissions"
description: |
  Implementation of advanced permission system with custom roles, resource-level permissions, and permission inheritance

---

## Goal

**Feature Goal**: Enable granular, resource-specific permissions beyond basic roles for flexible access control

**Deliverable**: Permission matrix system with custom roles, resource permissions, and inheritance hierarchies

**Success Definition**: Admins can create custom roles with specific permissions and assign them to users or groups

## User Persona

**Target User**: System Administrators & Organization Managers

**Use Case**: Creating department-specific roles, temporary permissions, and resource-level access control

**User Journey**: 
1. Admin creates custom role with specific permissions
2. Defines permission scope (global, resource type, or specific resource)
3. Assigns role to users or groups
4. Sets expiration or conditions
5. Monitors permission usage

**Pain Points Addressed**: 
- Basic roles too restrictive for complex organizations
- Cannot grant temporary or conditional access
- No way to delegate specific permissions
- Cannot create department/team-specific roles

## Why

- Enables complex organizational structures
- Supports principle of least privilege
- Allows temporary and conditional access
- Scales to enterprise requirements

## What

Build advanced permission system with custom role builder, permission matrix, resource-level controls, and permission inheritance.

### Success Criteria

- [ ] Custom roles can be created with specific permissions
- [ ] Permissions can be scoped to resources
- [ ] Permission inheritance works correctly
- [ ] Performance remains acceptable with complex permissions
- [ ] Audit trail captures all permission usage

## All Needed Context

### Context Completeness Check

_This PRP contains patterns for building advanced permission systems, including database design for flexible permissions and efficient permission checking._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://www.postgresql.org/docs/current/ddl-inherit.html
  why: PostgreSQL table inheritance for permission hierarchies
  critical: Understanding inheritance for efficient permission queries

- url: https://supabase.com/docs/guides/database/postgres/row-level-security
  why: Advanced RLS patterns for complex permissions
  critical: Performance considerations for complex policies

- file: src/features/admin/components/UserList.tsx
  why: UI patterns from Phase 2 admin dashboard
  pattern: Table interfaces, form handling
  gotcha: Maintain consistency with existing admin UI

- docfile: PRPs/rbac-phase1-database-auth-infrastructure.md
  why: Base RBAC implementation to extend
  section: Database schema, auth hook patterns

- docfile: PRPs/ai_docs/supabase-auth-hooks-rbac-guide.md
  why: Auth hook patterns for custom claims
  section: Advanced examples for complex permissions
```

### Current Codebase tree

```bash
hsa-songbook/
├── src/
│   ├── features/
│   │   ├── admin/  # Phase 2
│   │   ├── moderation/  # Phase 3
│   │   └── auth/
│   │       └── hooks/
│   │           └── useAuth.ts  # Enhanced in Phase 1
└── supabase/
    └── migrations/
        ├── 20250121_add_rbac_infrastructure.sql  # Phase 1
        └── 20250122_add_moderation_tables.sql  # Phase 3
```

### Desired Codebase tree with files to be added

```bash
hsa-songbook/
├── src/
│   ├── features/
│   │   └── permissions/  # NEW: Advanced permissions module
│   │       ├── components/
│   │       │   ├── PermissionMatrix.tsx  # NEW: Permission grid UI
│   │       │   ├── PermissionMatrix.module.css
│   │       │   ├── RoleBuilder.tsx  # NEW: Custom role creator
│   │       │   ├── RoleBuilder.module.css
│   │       │   ├── ResourcePermissions.tsx  # NEW: Resource-level UI
│   │       │   ├── PermissionInheritance.tsx  # NEW: Hierarchy viewer
│   │       │   └── PermissionTester.tsx  # NEW: Permission testing tool
│   │       ├── services/
│   │       │   └── permissionService.ts  # NEW: Permission API
│   │       ├── hooks/
│   │       │   ├── usePermissions.ts  # NEW: Permission checking
│   │       │   ├── useCustomRoles.ts  # NEW: Role management
│   │       │   └── usePermissionMatrix.ts  # NEW: Matrix operations
│   │       ├── types/
│   │       │   └── permission.types.ts  # NEW: Permission types
│   │       ├── utils/
│   │       │   ├── permissionResolver.ts  # NEW: Permission logic
│   │       │   └── permissionCache.ts  # NEW: Client-side cache
│   │       └── validation/
│   │           └── permissionSchemas.ts  # NEW: Validation schemas
│   ├── app/
│   │   └── pages/
│   │       └── PermissionManagement.tsx  # NEW: Permission admin page
└── supabase/
    └── migrations/
        └── 20250123_add_fine_grained_permissions.sql  # NEW: Advanced schema
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Performance with complex permissions
// - Cache permission checks aggressively
// - Use materialized views for complex queries
// - Consider Redis for permission cache in production

// CRITICAL: JWT size limitations
// - Don't add all permissions to JWT
// - Use permission groups/roles in JWT
// - Fetch detailed permissions on demand

// CRITICAL: Permission evaluation order
// - Explicit deny overrides allow
// - Most specific permission wins
// - Resource permissions override type permissions
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/features/permissions/types/permission.types.ts
export type PermissionAction = 
  | 'create' | 'read' | 'update' | 'delete'  // CRUD
  | 'approve' | 'reject' | 'flag'  // Moderation
  | 'assign_role' | 'revoke_role'  // Admin
  | 'export' | 'import' | 'bulk_edit'  // Advanced

export type ResourceType = 
  | 'song' | 'arrangement' | 'setlist' | 'user' | 'role' | 'system'

export type PermissionEffect = 'allow' | 'deny'

export type PermissionScope = 'global' | 'type' | 'resource' | 'own'

export interface Permission {
  id: string
  name: string
  resource: ResourceType
  action: PermissionAction
  scope: PermissionScope
  description?: string
}

export interface CustomRole {
  id: string
  name: string
  description?: string
  permissions: PermissionAssignment[]
  inheritsFrom?: string[]  // Parent role IDs
  createdBy: string
  createdAt: string
  isSystem: boolean  // Cannot be modified
  isActive: boolean
}

export interface PermissionAssignment {
  permissionId: string
  effect: PermissionEffect
  conditions?: PermissionCondition[]
  resourceId?: string  // For resource-specific permissions
  expiresAt?: string
}

export interface PermissionCondition {
  field: string  // e.g., 'created_by', 'status', 'category'
  operator: 'eq' | 'neq' | 'in' | 'contains' | 'gt' | 'lt'
  value: any
}

export interface UserPermissionSet {
  userId: string
  roles: string[]  // Role IDs
  directPermissions: PermissionAssignment[]  // User-specific overrides
  effectivePermissions: ResolvedPermission[]  // Computed result
  evaluatedAt: string
}

export interface ResolvedPermission {
  resource: ResourceType
  action: PermissionAction
  effect: PermissionEffect
  scope: PermissionScope
  resourceId?: string
  source: 'role' | 'direct' | 'inherited'
  priority: number  // For conflict resolution
}

export interface PermissionGroup {
  id: string
  name: string
  description?: string
  members: string[]  // User IDs
  roles: string[]  // Role IDs assigned to group
  parentGroups?: string[]  // For group nesting
}

export interface PermissionMatrix {
  roles: CustomRole[]
  permissions: Permission[]
  assignments: Map<string, Map<string, PermissionEffect>>  // roleId -> permissionId -> effect
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE supabase/migrations/20250123_add_fine_grained_permissions.sql
  - IMPLEMENT: Advanced permission schema
  - TABLES: permissions, custom_roles, role_permissions, user_permissions, permission_groups
  - FUNCTIONS: check_permission(), get_effective_permissions()
  - INDEXES: For permission lookup performance
  - PLACEMENT: supabase/migrations/

Task 2: UPDATE auth hook for complex permissions
  - MODIFY: custom_access_token_hook from Phase 1
  - ADD: Permission groups to JWT claims
  - OPTIMIZE: Keep JWT size manageable
  - PLACEMENT: Update existing migration or new one

Task 3: CREATE src/features/permissions/types/permission.types.ts
  - IMPLEMENT: All TypeScript interfaces
  - INCLUDE: Types from data models section
  - PLACEMENT: Permissions types directory

Task 4: CREATE src/features/permissions/validation/permissionSchemas.ts
  - IMPLEMENT: Zod schemas for permission forms
  - SCHEMAS: customRoleSchema, permissionAssignmentSchema
  - PLACEMENT: Permissions validation directory

Task 5: CREATE src/features/permissions/utils/permissionResolver.ts
  - IMPLEMENT: Client-side permission resolution logic
  - METHODS: resolvePermissions, checkPermission, mergePermissions
  - ALGORITHM: Handle inheritance, conflicts, conditions
  - PLACEMENT: Permissions utils directory

Task 6: CREATE src/features/permissions/utils/permissionCache.ts
  - IMPLEMENT: Client-side permission caching
  - STORAGE: IndexedDB for persistence
  - TTL: Configurable cache expiration
  - PLACEMENT: Permissions utils directory

Task 7: CREATE src/features/permissions/services/permissionService.ts
  - IMPLEMENT: API for permission management
  - METHODS: CRUD for roles, permissions, assignments
  - CACHING: Integrate with permissionCache
  - PLACEMENT: Permissions services directory

Task 8: CREATE src/features/permissions/hooks/usePermissions.ts
  - IMPLEMENT: Main permission checking hook
  - METHODS: hasPermission, checkResourceAccess
  - CACHE: Use client cache for performance
  - PLACEMENT: Permissions hooks directory

Task 9: CREATE src/features/permissions/hooks/useCustomRoles.ts
  - IMPLEMENT: Custom role management
  - METHODS: createRole, updateRole, deleteRole
  - VALIDATION: Use Zod schemas
  - PLACEMENT: Permissions hooks directory

Task 10: CREATE src/features/permissions/components/PermissionMatrix.tsx and .module.css
  - IMPLEMENT: Grid UI for permission assignments
  - FEATURES: Checkbox grid, bulk operations
  - VISUALIZATION: Clear permission overview
  - PLACEMENT: Permissions components directory

Task 11: CREATE src/features/permissions/components/RoleBuilder.tsx and .module.css
  - IMPLEMENT: UI for creating custom roles
  - FORM: Multi-step with permission selection
  - PREVIEW: Show effective permissions
  - PLACEMENT: Permissions components directory

Task 12: CREATE src/features/permissions/components/ResourcePermissions.tsx
  - IMPLEMENT: Resource-specific permission UI
  - FEATURES: Per-resource permission grants
  - HIERARCHY: Show inherited permissions
  - PLACEMENT: Permissions components directory

Task 13: CREATE src/features/permissions/components/PermissionInheritance.tsx
  - IMPLEMENT: Visual hierarchy tree
  - DISPLAY: Role inheritance chains
  - INTERACTIVE: Modify inheritance
  - PLACEMENT: Permissions components directory

Task 14: CREATE src/features/permissions/components/PermissionTester.tsx
  - IMPLEMENT: Tool to test permissions
  - INPUT: User, resource, action
  - OUTPUT: Permission result with reasoning
  - PLACEMENT: Permissions components directory

Task 15: CREATE src/app/pages/PermissionManagement.tsx
  - IMPLEMENT: Main permission admin page
  - TABS: Roles, Permissions, Groups, Testing
  - COMPOSE: All permission components
  - PLACEMENT: App pages directory

Task 16: MODIFY src/app/App.tsx
  - ADD: Route for permission management
  - PATH: /admin/permissions
  - PROTECT: Admin-only access
  - PLACEMENT: App routing

Task 17: ENHANCE useAuth hook
  - MODIFY: src/features/auth/hooks/useAuth.ts
  - ADD: Fine-grained permission checking
  - INTEGRATE: With permission service
  - PLACEMENT: Update existing hook

Task 18: CREATE permission seed data
  - IMPLEMENT: Default permissions and mappings
  - DATA: Standard CRUD permissions per resource
  - SCRIPT: SQL or TypeScript seeder
  - PLACEMENT: supabase/seed/ or scripts/
```

### Implementation Patterns & Key Details

```sql
-- Task 1: Migration (20250123_add_fine_grained_permissions.sql)
-- Migration: Fine-Grained Permissions System
-- Date: 2025-01-23
-- Description: Adds advanced permission system with custom roles and resource-level controls

-- Permission definitions
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('global', 'type', 'resource', 'own')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resource, action, scope)
);

-- Custom roles (extends basic roles from Phase 1)
CREATE TABLE IF NOT EXISTS public.custom_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

-- Role inheritance
CREATE TABLE IF NOT EXISTS public.role_inheritance (
    child_role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    parent_role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (child_role_id, parent_role_id),
    CHECK (child_role_id != parent_role_id)
);

-- Role permissions mapping
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    effect TEXT NOT NULL CHECK (effect IN ('allow', 'deny')),
    conditions JSONB,
    resource_id UUID,  -- For resource-specific permissions
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id, resource_id)
);

-- Direct user permissions (overrides roles)
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    effect TEXT NOT NULL CHECK (effect IN ('allow', 'deny')),
    conditions JSONB,
    resource_id UUID,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    reason TEXT,
    UNIQUE(user_id, permission_id, resource_id)
);

-- Permission groups for users
CREATE TABLE IF NOT EXISTS public.permission_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Group members
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID REFERENCES public.permission_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    added_by UUID REFERENCES auth.users(id),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- Group roles
CREATE TABLE IF NOT EXISTS public.group_roles (
    group_id UUID REFERENCES public.permission_groups(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, role_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup ON public.role_permissions(role_id, permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_lookup ON public.user_permissions(user_id, permission_id);
CREATE INDEX IF NOT EXISTS idx_permission_resource ON public.permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_role_inheritance ON public.role_inheritance(child_role_id);

-- Function to check specific permission
CREATE OR REPLACE FUNCTION public.check_permission(
    p_user_id UUID,
    p_resource TEXT,
    p_action TEXT,
    p_resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN := false;
    v_effect TEXT;
BEGIN
    -- Check direct user permissions first (highest priority)
    SELECT effect INTO v_effect
    FROM public.user_permissions up
    JOIN public.permissions p ON up.permission_id = p.id
    WHERE up.user_id = p_user_id
      AND p.resource = p_resource
      AND p.action = p_action
      AND (up.resource_id IS NULL OR up.resource_id = p_resource_id)
      AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ORDER BY 
        CASE WHEN up.resource_id = p_resource_id THEN 1 ELSE 2 END,
        CASE up.effect WHEN 'deny' THEN 1 ELSE 2 END
    LIMIT 1;

    -- If explicit deny, return false
    IF v_effect = 'deny' THEN
        RETURN false;
    ELSIF v_effect = 'allow' THEN
        RETURN true;
    END IF;

    -- Check role-based permissions (including inherited)
    WITH RECURSIVE role_hierarchy AS (
        -- Direct roles from user_roles
        SELECT ur.role::uuid as role_id
        FROM public.user_roles ur
        WHERE ur.user_id = p_user_id
          AND ur.is_active = true
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        
        UNION
        
        -- Roles from groups
        SELECT gr.role_id
        FROM public.group_members gm
        JOIN public.group_roles gr ON gm.group_id = gr.group_id
        WHERE gm.user_id = p_user_id
        
        UNION
        
        -- Custom roles assigned to user
        SELECT cr.id
        FROM public.custom_roles cr
        JOIN public.user_roles ur ON ur.role::text = cr.name
        WHERE ur.user_id = p_user_id
        
        UNION
        
        -- Inherited roles
        SELECT ri.parent_role_id
        FROM role_hierarchy rh
        JOIN public.role_inheritance ri ON rh.role_id = ri.child_role_id
    )
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM role_hierarchy rh
                JOIN public.role_permissions rp ON rh.role_id = rp.role_id
                JOIN public.permissions p ON rp.permission_id = p.id
                WHERE p.resource = p_resource
                  AND p.action = p_action
                  AND rp.effect = 'deny'
                  AND (rp.resource_id IS NULL OR rp.resource_id = p_resource_id)
            ) THEN false
            WHEN EXISTS (
                SELECT 1 
                FROM role_hierarchy rh
                JOIN public.role_permissions rp ON rh.role_id = rp.role_id
                JOIN public.permissions p ON rp.permission_id = p.id
                WHERE p.resource = p_resource
                  AND p.action = p_action
                  AND rp.effect = 'allow'
                  AND (rp.resource_id IS NULL OR rp.resource_id = p_resource_id)
            ) THEN true
            ELSE false
        END INTO v_has_permission;

    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get all effective permissions for a user
CREATE OR REPLACE FUNCTION public.get_effective_permissions(p_user_id UUID)
RETURNS TABLE (
    resource TEXT,
    action TEXT,
    effect TEXT,
    scope TEXT,
    resource_id UUID,
    source TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_perms AS (
        -- Direct user permissions
        SELECT 
            p.resource,
            p.action,
            up.effect,
            p.scope,
            up.resource_id,
            'direct'::TEXT as source
        FROM public.user_permissions up
        JOIN public.permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ),
    role_perms AS (
        -- Role-based permissions (with inheritance)
        WITH RECURSIVE role_hierarchy AS (
            SELECT ur.role::uuid as role_id
            FROM public.user_roles ur
            WHERE ur.user_id = p_user_id
              AND ur.is_active = true
            
            UNION
            
            SELECT ri.parent_role_id
            FROM role_hierarchy rh
            JOIN public.role_inheritance ri ON rh.role_id = ri.child_role_id
        )
        SELECT 
            p.resource,
            p.action,
            rp.effect,
            p.scope,
            rp.resource_id,
            'role'::TEXT as source
        FROM role_hierarchy rh
        JOIN public.role_permissions rp ON rh.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE (rp.expires_at IS NULL OR rp.expires_at > NOW())
    )
    -- Combine with user permissions taking priority
    SELECT DISTINCT ON (resource, action, resource_id)
        resource,
        action,
        effect,
        scope,
        resource_id,
        source
    FROM (
        SELECT * FROM user_perms
        UNION ALL
        SELECT * FROM role_perms
    ) combined
    ORDER BY 
        resource, 
        action, 
        resource_id,
        CASE source WHEN 'direct' THEN 1 ELSE 2 END,
        CASE effect WHEN 'deny' THEN 1 ELSE 2 END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Seed default permissions
INSERT INTO public.permissions (name, resource, action, scope, description) VALUES
    -- Songs
    ('songs.create', 'song', 'create', 'global', 'Create new songs'),
    ('songs.read', 'song', 'read', 'global', 'View songs'),
    ('songs.update.own', 'song', 'update', 'own', 'Edit own songs'),
    ('songs.update.all', 'song', 'update', 'global', 'Edit any song'),
    ('songs.delete.own', 'song', 'delete', 'own', 'Delete own songs'),
    ('songs.delete.all', 'song', 'delete', 'global', 'Delete any song'),
    ('songs.approve', 'song', 'approve', 'global', 'Approve songs'),
    
    -- Arrangements
    ('arrangements.create', 'arrangement', 'create', 'global', 'Create arrangements'),
    ('arrangements.read', 'arrangement', 'read', 'global', 'View arrangements'),
    ('arrangements.update.own', 'arrangement', 'update', 'own', 'Edit own arrangements'),
    ('arrangements.update.all', 'arrangement', 'update', 'global', 'Edit any arrangement'),
    ('arrangements.delete.own', 'arrangement', 'delete', 'own', 'Delete own arrangements'),
    ('arrangements.delete.all', 'arrangement', 'delete', 'global', 'Delete any arrangement'),
    
    -- Users
    ('users.read', 'user', 'read', 'global', 'View user list'),
    ('users.update', 'user', 'update', 'global', 'Update user details'),
    ('users.assign_role', 'user', 'assign_role', 'global', 'Assign roles to users'),
    ('users.revoke_role', 'user', 'revoke_role', 'global', 'Revoke user roles'),
    
    -- System
    ('system.manage_roles', 'system', 'create', 'global', 'Create and manage custom roles'),
    ('system.view_audit', 'system', 'read', 'global', 'View audit logs'),
    ('system.export', 'system', 'export', 'global', 'Export data'),
    ('system.import', 'system', 'import', 'global', 'Import data')
ON CONFLICT (resource, action, scope) DO NOTHING;

-- Create default custom roles with permissions
WITH admin_role AS (
    INSERT INTO public.custom_roles (name, description, is_system)
    VALUES ('admin', 'System Administrator', true)
    RETURNING id
),
moderator_role AS (
    INSERT INTO public.custom_roles (name, description, is_system)
    VALUES ('moderator', 'Content Moderator', true)
    RETURNING id
),
user_role AS (
    INSERT INTO public.custom_roles (name, description, is_system)
    VALUES ('user', 'Regular User', true)
    RETURNING id
)
-- Assign permissions to roles
INSERT INTO public.role_permissions (role_id, permission_id, effect)
SELECT ar.id, p.id, 'allow'
FROM admin_role ar, public.permissions p;  -- Admin gets all permissions

-- Grant necessary permissions
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.custom_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_effective_permissions TO authenticated;

-- RLS Policies
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read permissions
CREATE POLICY "Read permissions" ON public.permissions
    FOR SELECT USING (true);

-- Only admins can manage custom roles
CREATE POLICY "Admins manage roles" ON public.custom_roles
    FOR ALL USING (
        check_permission(auth.uid(), 'system', 'create')
    );

-- Only admins can manage role permissions
CREATE POLICY "Admins manage role permissions" ON public.role_permissions
    FOR ALL USING (
        check_permission(auth.uid(), 'system', 'create')
    );
```

```typescript
// Task 5: Permission Resolver (src/features/permissions/utils/permissionResolver.ts)
import type { 
  Permission, 
  PermissionAssignment, 
  ResolvedPermission,
  PermissionCondition 
} from '../types/permission.types'

export class PermissionResolver {
  private cache = new Map<string, ResolvedPermission[]>()

  resolvePermissions(
    rolePermissions: PermissionAssignment[],
    directPermissions: PermissionAssignment[],
    inheritedPermissions: PermissionAssignment[]
  ): ResolvedPermission[] {
    const resolved: Map<string, ResolvedPermission> = new Map()

    // Priority order: direct > role > inherited
    // Within each level: deny > allow, specific > general

    // Process inherited permissions (lowest priority)
    this.processPermissions(inheritedPermissions, resolved, 'inherited', 1)

    // Process role permissions
    this.processPermissions(rolePermissions, resolved, 'role', 10)

    // Process direct permissions (highest priority)
    this.processPermissions(directPermissions, resolved, 'direct', 100)

    return Array.from(resolved.values())
  }

  private processPermissions(
    assignments: PermissionAssignment[],
    resolved: Map<string, ResolvedPermission>,
    source: 'role' | 'direct' | 'inherited',
    basePriority: number
  ) {
    for (const assignment of assignments) {
      const key = this.getPermissionKey(assignment)
      const existing = resolved.get(key)

      const priority = basePriority + 
        (assignment.effect === 'deny' ? 1000 : 0) +
        (assignment.resourceId ? 100 : 0)

      if (!existing || priority > existing.priority) {
        resolved.set(key, {
          resource: this.getResourceFromAssignment(assignment),
          action: this.getActionFromAssignment(assignment),
          effect: assignment.effect,
          scope: assignment.resourceId ? 'resource' : 'type',
          resourceId: assignment.resourceId,
          source,
          priority
        })
      }
    }
  }

  checkPermission(
    permissions: ResolvedPermission[],
    resource: string,
    action: string,
    resourceId?: string,
    context?: Record<string, any>
  ): boolean {
    // Find most specific matching permission
    const matches = permissions.filter(p => 
      p.resource === resource && 
      p.action === action &&
      (!resourceId || !p.resourceId || p.resourceId === resourceId)
    )

    if (matches.length === 0) return false

    // Sort by specificity
    matches.sort((a, b) => {
      // Resource-specific > type-level > global
      if (a.resourceId && !b.resourceId) return -1
      if (!a.resourceId && b.resourceId) return 1
      
      // Deny > allow
      if (a.effect === 'deny' && b.effect === 'allow') return -1
      if (a.effect === 'allow' && b.effect === 'deny') return 1
      
      // Higher priority > lower priority
      return b.priority - a.priority
    })

    return matches[0].effect === 'allow'
  }

  evaluateConditions(
    conditions: PermissionCondition[],
    context: Record<string, any>
  ): boolean {
    return conditions.every(condition => {
      const value = context[condition.field]
      
      switch (condition.operator) {
        case 'eq':
          return value === condition.value
        case 'neq':
          return value !== condition.value
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value)
        case 'contains':
          return String(value).includes(String(condition.value))
        case 'gt':
          return value > condition.value
        case 'lt':
          return value < condition.value
        default:
          return false
      }
    })
  }

  private getPermissionKey(assignment: PermissionAssignment): string {
    return `${assignment.permissionId}:${assignment.resourceId || 'global'}`
  }

  private getResourceFromAssignment(assignment: PermissionAssignment): string {
    // This would normally look up the permission definition
    // For now, extract from permissionId format
    const parts = assignment.permissionId.split('.')
    return parts[0]
  }

  private getActionFromAssignment(assignment: PermissionAssignment): string {
    const parts = assignment.permissionId.split('.')
    return parts[1]
  }
}

// Task 8: usePermissions Hook (src/features/permissions/hooks/usePermissions.ts)
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@features/auth'
import { permissionService } from '../services/permissionService'
import { PermissionResolver } from '../utils/permissionResolver'
import { PermissionCache } from '../utils/permissionCache'
import type { ResolvedPermission } from '../types/permission.types'

const resolver = new PermissionResolver()
const cache = new PermissionCache()

export function usePermissions() {
  const { userId, userRole } = useAuth()
  const [permissions, setPermissions] = useState<ResolvedPermission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setPermissions([])
      setLoading(false)
      return
    }

    const loadPermissions = async () => {
      // Check cache first
      const cached = await cache.get(userId)
      if (cached) {
        setPermissions(cached)
        setLoading(false)
        
        // Refresh in background
        permissionService.getUserPermissions(userId).then(fresh => {
          if (JSON.stringify(fresh) !== JSON.stringify(cached)) {
            setPermissions(fresh)
            cache.set(userId, fresh)
          }
        })
        return
      }

      // Load fresh
      try {
        const userPermissions = await permissionService.getUserPermissions(userId)
        setPermissions(userPermissions)
        await cache.set(userId, userPermissions)
      } catch (error) {
        console.error('Failed to load permissions:', error)
        // Fall back to basic role-based permissions
        setPermissions(getBasicPermissions(userRole))
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [userId, userRole])

  const hasPermission = useCallback((
    resource: string,
    action: string,
    resourceId?: string,
    context?: Record<string, any>
  ): boolean => {
    return resolver.checkPermission(permissions, resource, action, resourceId, context)
  }, [permissions])

  const canEdit = useCallback((resourceType: string, resourceId?: string): boolean => {
    return hasPermission(resourceType, 'update', resourceId)
  }, [hasPermission])

  const canDelete = useCallback((resourceType: string, resourceId?: string): boolean => {
    return hasPermission(resourceType, 'delete', resourceId)
  }, [hasPermission])

  const canModerate = useCallback((): boolean => {
    return hasPermission('song', 'approve') || hasPermission('arrangement', 'approve')
  }, [hasPermission])

  const canAdmin = useCallback((): boolean => {
    return hasPermission('system', 'create')
  }, [hasPermission])

  return {
    permissions,
    loading,
    hasPermission,
    canEdit,
    canDelete,
    canModerate,
    canAdmin,
    refreshPermissions: () => cache.clear(userId!)
  }
}

function getBasicPermissions(role: string): ResolvedPermission[] {
  // Fallback permissions based on basic roles
  const base: ResolvedPermission[] = [
    { resource: 'song', action: 'read', effect: 'allow', scope: 'global', source: 'role', priority: 1 },
    { resource: 'arrangement', action: 'read', effect: 'allow', scope: 'global', source: 'role', priority: 1 }
  ]

  if (role === 'admin') {
    return [
      ...base,
      { resource: 'song', action: 'create', effect: 'allow', scope: 'global', source: 'role', priority: 10 },
      { resource: 'song', action: 'update', effect: 'allow', scope: 'global', source: 'role', priority: 10 },
      { resource: 'song', action: 'delete', effect: 'allow', scope: 'global', source: 'role', priority: 10 },
      { resource: 'system', action: 'create', effect: 'allow', scope: 'global', source: 'role', priority: 10 }
    ]
  }

  if (role === 'moderator') {
    return [
      ...base,
      { resource: 'song', action: 'update', effect: 'allow', scope: 'global', source: 'role', priority: 5 },
      { resource: 'song', action: 'approve', effect: 'allow', scope: 'global', source: 'role', priority: 5 }
    ]
  }

  return base
}

// Task 10: Permission Matrix Component (src/features/permissions/components/PermissionMatrix.tsx)
import { useState, useMemo } from 'react'
import { useCustomRoles, usePermissions } from '../hooks'
import type { CustomRole, Permission, PermissionEffect } from '../types/permission.types'
import styles from './PermissionMatrix.module.css'

export function PermissionMatrix() {
  const { roles, permissions: allPermissions, updateRolePermission } = useCustomRoles()
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null)
  const [pendingChanges, setPendingChanges] = useState<Map<string, PermissionEffect>>()

  const matrix = useMemo(() => {
    if (!selectedRole) return null

    const assignments = new Map<string, PermissionEffect>()
    selectedRole.permissions.forEach(p => {
      assignments.set(p.permissionId, p.effect)
    })
    return assignments
  }, [selectedRole])

  const handlePermissionToggle = (permissionId: string) => {
    if (!matrix) return

    const current = matrix.get(permissionId)
    const next: PermissionEffect | undefined = 
      current === 'allow' ? 'deny' :
      current === 'deny' ? undefined :
      'allow'

    const changes = new Map(pendingChanges)
    if (next) {
      changes.set(permissionId, next)
    } else {
      changes.delete(permissionId)
    }
    setPendingChanges(changes)
  }

  const handleSave = async () => {
    if (!selectedRole || !pendingChanges) return

    for (const [permissionId, effect] of pendingChanges) {
      await updateRolePermission(selectedRole.id, permissionId, effect)
    }
    
    setPendingChanges(new Map())
  }

  const getPermissionState = (permissionId: string): 'allow' | 'deny' | 'inherit' | 'none' => {
    const pending = pendingChanges?.get(permissionId)
    if (pending) return pending

    const assigned = matrix?.get(permissionId)
    if (assigned) return assigned

    // Check if inherited
    if (selectedRole?.inheritsFrom?.length) {
      // Would need to check parent roles
      return 'inherit'
    }

    return 'none'
  }

  return (
    <div className={styles.container}>
      <div className={styles.roleSelector}>
        <select
          value={selectedRole?.id || ''}
          onChange={(e) => {
            const role = roles.find(r => r.id === e.target.value)
            setSelectedRole(role || null)
            setPendingChanges(new Map())
          }}
        >
          <option value="">Select a role...</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name} {role.isSystem && '(System)'}
            </option>
          ))}
        </select>
      </div>

      {selectedRole && (
        <div className={styles.matrix}>
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Action</th>
                <th>Scope</th>
                <th>Permission</th>
              </tr>
            </thead>
            <tbody>
              {allPermissions.map(permission => {
                const state = getPermissionState(permission.id)
                return (
                  <tr key={permission.id}>
                    <td>{permission.resource}</td>
                    <td>{permission.action}</td>
                    <td>{permission.scope}</td>
                    <td>
                      <div className={styles.permissionCell}>
                        <button
                          className={`${styles.permissionBtn} ${styles[`state-${state}`]}`}
                          onClick={() => handlePermissionToggle(permission.id)}
                          disabled={selectedRole.isSystem}
                        >
                          {state === 'allow' && '✓ Allow'}
                          {state === 'deny' && '✗ Deny'}
                          {state === 'inherit' && '↑ Inherited'}
                          {state === 'none' && '○ None'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {pendingChanges && pendingChanges.size > 0 && (
            <div className={styles.actions}>
              <button onClick={handleSave} className={styles.saveBtn}>
                Save Changes ({pendingChanges.size})
              </button>
              <button onClick={() => setPendingChanges(new Map())} className={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### Integration Points

```yaml
DATABASE:
  - migration: "supabase/migrations/20250123_add_fine_grained_permissions.sql"
  - functions: "check_permission(), get_effective_permissions()"
  - performance: "Materialized views for complex permission queries"

AUTH HOOK:
  - modify: "Add permission groups to JWT"
  - optimize: "Keep JWT size under 4KB"
  - cache: "Permission resolution results"

ROUTING:
  - add to: "src/app/App.tsx"
  - path: "/admin/permissions"
  - protect: "Admin-only access"

EXISTING COMPONENTS:
  - enhance: "All components to use fine-grained permissions"
  - replace: "Simple role checks with permission checks"
  - maintain: "Backward compatibility"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating files
npm run lint
npm run build

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test permission resolver
npm run test -- src/features/permissions/utils/permissionResolver.test.ts

# Test services and hooks
npm run test -- src/features/permissions/

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Apply migration
npx supabase db push --local

# Test permission functions
npx supabase db query "
  SELECT check_permission(
    'user-id-here'::uuid,
    'song',
    'update',
    NULL
  )
" --local

# Start dev server
npm run dev

# Manual testing:
# 1. Create custom role
# 2. Assign permissions via matrix
# 3. Test permission inheritance
# 4. Verify permission checks work
```

### Level 4: Performance Testing

```bash
# Test permission query performance
npx supabase db query "
  EXPLAIN ANALYZE
  SELECT * FROM get_effective_permissions('user-id'::uuid)
" --local
# Expected: < 50ms execution time

# Test with complex permission hierarchy
# Create nested roles and groups
# Measure permission resolution time
# Expected: < 100ms for complex hierarchies

# Test JWT size
# Add user to multiple groups
# Check JWT token size
# Expected: < 4KB total size
```

## Final Validation Checklist

### Technical Validation

- [ ] Migration executes without errors
- [ ] Permission functions perform well
- [ ] JWT size remains under 4KB
- [ ] TypeScript compiles
- [ ] All tests pass

### Feature Validation

- [ ] Custom roles can be created
- [ ] Permission matrix works correctly
- [ ] Permission inheritance functions
- [ ] Resource-specific permissions work
- [ ] Permission testing tool accurate

### Code Quality Validation

- [ ] Follows existing patterns
- [ ] Efficient permission resolution
- [ ] Proper caching implemented
- [ ] Error handling comprehensive
- [ ] UI responsive and intuitive

### Documentation & Deployment

- [ ] Permission model documented
- [ ] Default permissions appropriate
- [ ] Migration reversible
- [ ] Performance benchmarks met

---

## Anti-Patterns to Avoid

- ❌ Don't put all permissions in JWT (size limit)
- ❌ Don't skip permission caching (performance)
- ❌ Don't allow circular role inheritance
- ❌ Don't evaluate permissions on every render
- ❌ Don't forget deny overrides allow
- ❌ Don't skip audit logging for permission changes
- ❌ Don't make permission checks synchronous