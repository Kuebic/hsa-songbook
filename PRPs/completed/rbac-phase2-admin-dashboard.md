name: "RBAC Phase 2 - Admin Dashboard"
description: |
  Implementation of admin dashboard for role management, user administration, and audit log viewing in HSA Songbook

---

## Goal

**Feature Goal**: Create an intuitive admin interface for managing user roles and viewing system audit logs

**Deliverable**: Admin dashboard with user management, role assignment UI, and audit trail viewer

**Success Definition**: Admins can view all users, assign/revoke roles, and track all role changes through the interface

## User Persona

**Target User**: System Administrators

**Use Case**: Managing user permissions and monitoring role changes across the application

**User Journey**: 
1. Admin navigates to admin dashboard
2. Views list of all users with current roles
3. Selects user to modify role
4. Assigns new role with optional expiration
5. Views audit log to confirm change

**Pain Points Addressed**: 
- No UI for role management (requires direct database access)
- No visibility into who has what permissions
- No audit trail visibility for compliance

## Why

- Enables non-technical admins to manage roles
- Provides transparency in permission management
- Ensures accountability through audit logs
- Reduces support burden for role changes

## What

Build comprehensive admin dashboard with user listing, role management interface, and audit log viewer, following existing UI patterns in the application.

### Success Criteria

- [ ] Admin dashboard accessible only to admin users
- [ ] User list displays with search and filter capabilities
- [ ] Role assignment works with immediate feedback
- [ ] Audit log shows complete history of changes
- [ ] Mobile-responsive design following existing patterns

## All Needed Context

### Context Completeness Check

_This PRP contains all UI patterns, component structures, and service integration patterns needed for implementation._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/features/songs/components/SongList.tsx
  why: Pattern for list components with search and filtering
  pattern: Table structure, search implementation, loading states
  gotcha: Use TanStack Query for data fetching

- file: src/features/songs/components/SongModal.tsx
  why: Pattern for modal forms and user interactions
  pattern: Form handling with react-hook-form, validation
  gotcha: Always use Zod schemas for validation

- file: src/shared/components/Layout.tsx
  why: Application layout structure for new pages
  pattern: Navigation integration, responsive design
  gotcha: Must integrate with existing navigation

- file: src/features/songs/services/songService.ts
  why: Service layer pattern for API calls
  pattern: Error handling, caching, type mapping
  gotcha: Clear cache after mutations

- file: src/features/auth/components/ProtectedRoute.tsx
  why: Route protection pattern
  pattern: Authentication checks, loading states
  gotcha: Must handle loading states properly

- docfile: PRPs/ai_docs/hsa-songbook-database-patterns.md
  why: Established patterns for services and hooks
  section: Service Layer Patterns, React Hook Patterns

- docfile: PRPs/rbac-phase1-database-auth-infrastructure.md
  why: Database schema and auth implementation from Phase 1
  section: Data models and structure
```

### Current Codebase tree

```bash
hsa-songbook/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   └── SearchPage.tsx
│   │   └── App.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   └── hooks/
│   │   │       └── useAuth.ts  # Enhanced with roles in Phase 1
│   │   └── songs/
│   │       ├── components/
│   │       ├── services/
│   │       └── hooks/
│   └── shared/
│       └── components/
│           ├── Layout.tsx
│           └── notifications/
```

### Desired Codebase tree with files to be added

```bash
hsa-songbook/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── ... existing pages
│   │   │   └── AdminDashboard.tsx  # NEW: Main admin page
│   │   └── App.tsx  # MODIFIED: Add admin route
│   ├── features/
│   │   └── admin/  # NEW: Admin feature module
│   │       ├── components/
│   │       │   ├── UserList.tsx  # NEW: User listing component
│   │       │   ├── UserList.module.css  # NEW: Styles
│   │       │   ├── RoleAssignmentModal.tsx  # NEW: Role change modal
│   │       │   ├── RoleAssignmentModal.module.css  # NEW: Styles
│   │       │   ├── AuditLogViewer.tsx  # NEW: Audit log component
│   │       │   ├── AuditLogViewer.module.css  # NEW: Styles
│   │       │   └── AdminNav.tsx  # NEW: Admin navigation tabs
│   │       ├── services/
│   │       │   └── adminService.ts  # NEW: Admin API service
│   │       ├── hooks/
│   │       │   ├── useUsers.ts  # NEW: User data fetching
│   │       │   ├── useRoleManagement.ts  # NEW: Role CRUD operations
│   │       │   └── useAuditLog.ts  # NEW: Audit log fetching
│   │       ├── types/
│   │       │   └── admin.types.ts  # NEW: Admin-specific types
│   │       └── validation/
│   │           └── roleSchemas.ts  # NEW: Zod schemas for forms
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: TanStack Query patterns
// - Always use queryKey arrays for cache management
// - Invalidate queries after mutations
// - Use optimistic updates for better UX

// CRITICAL: Form handling
// - Always use react-hook-form with Zod validation
// - Follow existing form patterns from songs feature

// CRITICAL: Role changes
// - Changes don't take effect until JWT refresh
// - Show clear messaging about delay
// - Consider implementing force-refresh for critical changes
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/features/admin/types/admin.types.ts
import type { UserRole } from '@features/auth/types'

export interface UserWithRole {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  createdAt: string
  lastSignIn: string | null
  role: UserRole
  roleGrantedBy: string | null
  roleGrantedAt: string | null
  roleExpiresAt: string | null
  isRoleActive: boolean
}

export interface RoleAssignment {
  userId: string
  role: UserRole
  expiresAt?: string
  reason?: string
}

export interface AuditLogEntry {
  id: string
  userId: string
  userEmail: string
  role: UserRole
  action: 'grant' | 'revoke' | 'expire'
  performedBy: string
  performedByEmail: string
  performedAt: string
  reason: string | null
  metadata: Record<string, any> | null
}

export interface AdminStats {
  totalUsers: number
  adminCount: number
  moderatorCount: number
  regularUserCount: number
  recentRoleChanges: number
}

export interface UserFilter {
  search?: string
  role?: UserRole | 'all'
  sortBy?: 'email' | 'createdAt' | 'lastSignIn' | 'role'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/features/admin/types/admin.types.ts
  - IMPLEMENT: TypeScript interfaces for admin features
  - INCLUDE: UserWithRole, RoleAssignment, AuditLogEntry types
  - PLACEMENT: New admin feature types directory

Task 2: CREATE src/features/admin/validation/roleSchemas.ts
  - IMPLEMENT: Zod schemas for role assignment forms
  - FOLLOW pattern: src/features/songs/validation/songFormSchema.ts
  - SCHEMAS: roleAssignmentSchema, userFilterSchema
  - PLACEMENT: Admin validation directory

Task 3: CREATE src/features/admin/services/adminService.ts
  - IMPLEMENT: API service for admin operations
  - FOLLOW pattern: src/features/songs/services/songService.ts
  - METHODS: getUsers, assignRole, revokeRole, getAuditLog
  - INCLUDE: Error handling, caching, type mapping
  - PLACEMENT: Admin services directory

Task 4: CREATE src/features/admin/hooks/useUsers.ts
  - IMPLEMENT: React Query hook for user listing
  - FOLLOW pattern: Existing data fetching hooks
  - FEATURES: Pagination, filtering, search
  - DEPENDENCIES: Import adminService from Task 3
  - PLACEMENT: Admin hooks directory

Task 5: CREATE src/features/admin/hooks/useRoleManagement.ts
  - IMPLEMENT: Mutations for role assignment
  - INCLUDE: Optimistic updates, error handling
  - METHODS: assignRole, revokeRole mutations
  - DEPENDENCIES: Import adminService from Task 3
  - PLACEMENT: Admin hooks directory

Task 6: CREATE src/features/admin/hooks/useAuditLog.ts
  - IMPLEMENT: Hook for fetching audit log
  - FEATURES: Pagination, filtering by user/date
  - DEPENDENCIES: Import adminService from Task 3
  - PLACEMENT: Admin hooks directory

Task 7: CREATE src/features/admin/components/UserList.tsx and .module.css
  - IMPLEMENT: User listing table component
  - FOLLOW pattern: src/features/songs/components/SongList.tsx
  - FEATURES: Search, sort, filter, pagination
  - DEPENDENCIES: Import hooks from Tasks 4-5
  - PLACEMENT: Admin components directory

Task 8: CREATE src/features/admin/components/RoleAssignmentModal.tsx and .module.css
  - IMPLEMENT: Modal for role changes
  - FOLLOW pattern: src/features/songs/components/SongModal.tsx
  - FORM: react-hook-form with Zod validation
  - DEPENDENCIES: Import validation from Task 2
  - PLACEMENT: Admin components directory

Task 9: CREATE src/features/admin/components/AuditLogViewer.tsx and .module.css
  - IMPLEMENT: Audit log display component
  - FEATURES: Timeline view, filtering, export
  - DEPENDENCIES: Import useAuditLog from Task 6
  - PLACEMENT: Admin components directory

Task 10: CREATE src/features/admin/components/AdminNav.tsx
  - IMPLEMENT: Tab navigation for admin sections
  - TABS: Users, Audit Log, Settings (future)
  - PLACEMENT: Admin components directory

Task 11: CREATE src/app/pages/AdminDashboard.tsx
  - IMPLEMENT: Main admin dashboard page
  - COMPOSE: All admin components
  - PROTECT: Wrap with admin-only protection
  - PLACEMENT: App pages directory

Task 12: MODIFY src/app/App.tsx
  - ADD: Route for admin dashboard
  - PROTECT: With ProtectedRoute requireAdmin={true}
  - PATH: /admin
  - LAZY LOAD: Like other pages

Task 13: CREATE src/features/admin/index.ts
  - EXPORT: Public API for admin feature
  - INCLUDE: Components and types for external use
  - PLACEMENT: Admin feature root
```

### Implementation Patterns & Key Details

```typescript
// Task 3: Admin Service (src/features/admin/services/adminService.ts)
import { supabase } from '../../../lib/supabase'
import type { UserWithRole, RoleAssignment, AuditLogEntry, UserFilter } from '../types/admin.types'

// Cache implementation (reuse pattern from songs service)
const requestCache = new Map()
const CACHE_TTL = 30000

export const adminService = {
  async getUsers(filter?: UserFilter): Promise<{ users: UserWithRole[]; total: number }> {
    try {
      const cacheKey = `users:${JSON.stringify(filter || {})}`
      const cached = getCachedResult(cacheKey)
      if (cached) return cached

      // Build complex query with joins
      let query = supabase
        .from('users')
        .select(`
          *,
          user_roles!left(
            role,
            granted_by,
            granted_at,
            expires_at,
            is_active
          )
        `, { count: 'exact' })

      // Apply filters
      if (filter?.search) {
        query = query.or(`email.ilike.%${filter.search}%,full_name.ilike.%${filter.search}%`)
      }

      if (filter?.role && filter.role !== 'all') {
        query = query.eq('user_roles.role', filter.role)
      }

      // Sorting
      const sortColumn = filter?.sortBy || 'created_at'
      query = query.order(sortColumn, { ascending: filter?.sortOrder !== 'desc' })

      // Pagination
      const limit = filter?.limit || 20
      const offset = ((filter?.page || 1) - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw new APIError(error.message, 500)

      const users = mapUsersWithRoles(data || [])
      const result = { users, total: count || 0 }
      
      setCachedResult(cacheKey, result)
      return result
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  async assignRole(assignment: RoleAssignment): Promise<void> {
    try {
      clearCache()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new APIError('Authentication required', 401)

      // Start transaction for role assignment and audit
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: assignment.userId,
          role: assignment.role,
          granted_by: user.id,
          granted_at: new Date().toISOString(),
          expires_at: assignment.expiresAt,
          is_active: true
        }, {
          onConflict: 'user_id'
        })

      if (roleError) throw new APIError(roleError.message, 400)

      // Log to audit
      const { error: auditError } = await supabase
        .from('role_audit_log')
        .insert({
          user_id: assignment.userId,
          role: assignment.role,
          action: 'grant',
          performed_by: user.id,
          reason: assignment.reason,
          metadata: { expires_at: assignment.expiresAt }
        })

      if (auditError) {
        console.error('Audit log error:', auditError)
        // Don't throw - audit failure shouldn't block operation
      }
    } catch (error) {
      console.error('Error assigning role:', error)
      throw error
    }
  },

  async getAuditLog(userId?: string): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('role_audit_log')
        .select(`
          *,
          user:user_id(email, full_name),
          performer:performed_by(email, full_name)
        `)
        .order('performed_at', { ascending: false })
        .limit(100)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw new APIError(error.message, 500)

      return mapAuditEntries(data || [])
    } catch (error) {
      console.error('Error fetching audit log:', error)
      throw error
    }
  }
}

// Task 7: UserList Component (src/features/admin/components/UserList.tsx)
import { useState, useMemo } from 'react'
import { useUsers, useRoleManagement } from '../hooks'
import { RoleAssignmentModal } from './RoleAssignmentModal'
import styles from './UserList.module.css'

export function UserList() {
  const [filter, setFilter] = useState<UserFilter>({ page: 1, limit: 20 })
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { data, isLoading, error } = useUsers(filter)
  const { assignRole, isAssigning } = useRoleManagement()

  const handleRoleChange = (user: UserWithRole) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleAssignRole = async (assignment: RoleAssignment) => {
    try {
      await assignRole(assignment)
      setIsModalOpen(false)
      // Show success notification
    } catch (error) {
      // Error handled in hook
    }
  }

  if (isLoading) return <div className={styles.loading}>Loading users...</div>
  if (error) return <div className={styles.error}>Error loading users</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>User Management</h2>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search users..."
            onChange={(e) => setFilter({ ...filter, search: e.target.value, page: 1 })}
            className={styles.searchInput}
          />
          <select
            onChange={(e) => setFilter({ ...filter, role: e.target.value as UserRole | 'all' })}
            className={styles.roleFilter}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="moderator">Moderators</option>
            <option value="user">Regular Users</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.fullName || '-'}</td>
                <td>
                  <span className={styles[`role-${user.role}`]}>
                    {user.role}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>{user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString() : 'Never'}</td>
                <td>
                  <button
                    onClick={() => handleRoleChange(user)}
                    className={styles.changeRoleBtn}
                  >
                    Change Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button
          onClick={() => setFilter({ ...filter, page: Math.max(1, filter.page! - 1) })}
          disabled={filter.page === 1}
        >
          Previous
        </button>
        <span>Page {filter.page} of {Math.ceil((data?.total || 0) / filter.limit!)}</span>
        <button
          onClick={() => setFilter({ ...filter, page: filter.page! + 1 })}
          disabled={filter.page! * filter.limit! >= (data?.total || 0)}
        >
          Next
        </button>
      </div>

      {isModalOpen && selectedUser && (
        <RoleAssignmentModal
          user={selectedUser}
          onAssign={handleAssignRole}
          onClose={() => setIsModalOpen(false)}
          isAssigning={isAssigning}
        />
      )}
    </div>
  )
}

// Task 11: Admin Dashboard Page (src/app/pages/AdminDashboard.tsx)
import { useState } from 'react'
import { useAuth } from '@features/auth'
import { Navigate } from 'react-router-dom'
import { UserList, AuditLogViewer, AdminNav } from '@features/admin/components'

export function AdminDashboard() {
  const { isLoaded, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users')

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <AdminNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="admin-content">
        {activeTab === 'users' && <UserList />}
        {activeTab === 'audit' && <AuditLogViewer />}
      </div>
      
      <div className="admin-notice">
        Note: Role changes take effect when users refresh their session (typically within 1 hour).
      </div>
    </div>
  )
}

// Task 12: Route addition (modification to src/app/App.tsx)
// Add lazy import at top
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })))

// Add route in Routes
<Route 
  path="/admin" 
  element={
    <ErrorBoundary level="page">
      <LazyRouteWrapper pageName="Admin Dashboard">
        <ProtectedRoute requireAdmin={true}>
          <AdminDashboard />
        </ProtectedRoute>
      </LazyRouteWrapper>
    </ErrorBoundary>
  } 
/>
```

### Integration Points

```yaml
ROUTING:
  - add to: "src/app/App.tsx"
  - pattern: "Protected admin route with lazy loading"
  - path: "/admin"

NAVIGATION:
  - update: "src/shared/components/Layout.tsx"
  - add: "Admin link visible only to admins"

TYPES:
  - integrate: "With auth types from Phase 1"
  - use: "UserRole type from auth feature"

SERVICES:
  - pattern: "Follow songService structure"
  - auth: "Use supabase.auth.getUser() for current user"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating each component
npm run lint                         # Fix any linting errors
npm run build                        # Ensure TypeScript compiles

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test services
npm run test -- src/features/admin/services/adminService.test.ts

# Test hooks
npm run test -- src/features/admin/hooks/

# Test components
npm run test -- src/features/admin/components/

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Start dev server
npm run dev

# Manual testing checklist:
# 1. Navigate to /admin as non-admin user
#    Expected: Redirected to home

# 2. Log in as admin user
# 3. Navigate to /admin
#    Expected: Admin dashboard loads

# 4. Test user listing
#    - Search for users
#    - Filter by role
#    - Sort columns
#    Expected: All functions work

# 5. Test role assignment
#    - Click "Change Role" on a user
#    - Select new role
#    - Add reason
#    - Submit
#    Expected: Success notification

# 6. Test audit log
#    - Switch to Audit Log tab
#    - View recent changes
#    Expected: Shows role changes with details
```

### Level 4: Admin-Specific Validation

```bash
# Create test admin user
npx supabase db query "
  INSERT INTO user_roles (user_id, role, is_active)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@test.com'),
    'admin',
    true
  )
" --local

# Test role persistence
# 1. Assign role to user via UI
# 2. Have that user log out and back in
# 3. Check their new permissions
# Expected: New role active after re-login

# Test audit trail
npx supabase db query "
  SELECT * FROM role_audit_log 
  ORDER BY performed_at DESC 
  LIMIT 5
" --local
# Expected: All UI actions logged

# Test RLS policies
# Try to access admin endpoints as non-admin
# Expected: 403 Forbidden
```

## Final Validation Checklist

### Technical Validation

- [ ] All TypeScript files compile without errors
- [ ] ESLint passes with no violations
- [ ] All tests pass
- [ ] Admin routes properly protected
- [ ] Database queries optimized with proper indexes

### Feature Validation

- [ ] User listing with search/filter/sort works
- [ ] Role assignment updates database correctly
- [ ] Audit log captures all changes
- [ ] Pagination works for large datasets
- [ ] Mobile responsive design

### Code Quality Validation

- [ ] Follows existing component patterns
- [ ] Uses TanStack Query for data fetching
- [ ] Forms use react-hook-form with Zod
- [ ] Proper error handling throughout
- [ ] Loading states for all async operations

### Documentation & Deployment

- [ ] Component prop types documented
- [ ] Service methods have clear comments
- [ ] Admin features documented in README
- [ ] Security considerations noted

---

## Anti-Patterns to Avoid

- ❌ Don't expose admin endpoints to non-admins
- ❌ Don't skip loading states (creates poor UX)
- ❌ Don't forget to invalidate queries after mutations
- ❌ Don't hardcode user lists (use pagination)
- ❌ Don't skip audit logging for role changes
- ❌ Don't forget mobile responsiveness
- ❌ Don't bypass RLS policies in admin features