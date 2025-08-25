# Foundation Improvement Roadmap - HSA Songbook

## Executive Summary

This roadmap follows the 80/20 principle to create a solid foundation for the HSA Songbook application. By addressing 20% of the most critical issues, we can achieve 80% of the stability and performance improvements needed for sustainable feature development.

## Current State Analysis

### Key Issues Identified
- **Permission system completely stubbed** with TODOs blocking RBAC features
- **31 ESLint warnings** affecting development experience
- **PWA features disabled** removing offline capabilities
- **Inconsistent database query patterns** causing bugs (like the public arrangements issue)
- **Large bundle sizes** (656KB main chunk) affecting initial load performance
- **Missing database tables** referenced in code but not in schema

### Technical Debt Summary
- Missing permission tables (permissions, custom_roles, permission_groups)
- Incomplete error handling and recovery
- No production monitoring implementation
- Limited test coverage for critical paths

## 🎯 High-Impact Foundation Improvements

### Phase 1: Critical Foundation Issues (Week 1)
**Goal**: Stabilize the application and prevent cascading issues

#### 1. Fix Permission System Stub ⚡ HIGHEST PRIORITY

**Problem**: 
- `src/features/permissions/services/permissionService.ts` is completely stubbed
- All methods return empty data or mock responses
- UI shows permission features that don't work

**Impact**:
- Blocking all RBAC features
- Potential security vulnerabilities
- Confusing user experience with non-functional UI

**Solution Options**:
1. **Option A**: Implement basic permission checks using existing user_roles table
2. **Option B**: Temporarily disable permission UI and simplify to basic roles

**Implementation**:
```typescript
// Option A: Basic implementation using existing tables
async getUserPermissions(userId: string): Promise<UserPermissionSet> {
  const { data: roles } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
  
  // Map to permission set
  return {
    userId,
    roles: roles || [],
    effectivePermissions: derivePermissionsFromRoles(roles),
    evaluatedAt: new Date().toISOString()
  }
}
```

**Files to modify**:
- `src/features/permissions/services/permissionService.ts`
- `src/features/permissions/hooks/usePermissions.ts`
- Remove or hide UI in `src/app/pages/PermissionManagement.tsx` if choosing Option B

---

#### 2. Fix React Warnings

**Problem**: 31 warnings cluttering console and indicating potential bugs

**Categories**:
- Fast refresh warnings (6 instances)
- Hook dependency warnings (10 instances)
- Unused eslint-disable directives

**Quick Fixes**:
```typescript
// Before: Component file with exported constant
export const SOME_CONSTANT = 'value'
export const MyComponent = () => { ... }

// After: Move constants to separate file
// constants.ts
export const SOME_CONSTANT = 'value'

// MyComponent.tsx
import { SOME_CONSTANT } from './constants'
export const MyComponent = () => { ... }
```

**Files with most warnings**:
- `src/features/responsive/hooks/useScrollDirection.ts`
- `src/features/responsive/hooks/useViewport.ts`
- `src/features/permissions/hooks/usePermissions.ts`
- `src/features/songs/contexts/SongModalContext.tsx`

---

#### 3. Re-enable PWA Features

**Problem**: PWA features commented out, losing major functionality

**Location**: `src/app/App.tsx` lines 4-6, 34-36, 193-196

**Action Items**:
1. Uncomment PWA imports and components
2. Test offline functionality
3. Verify service worker registration
4. Test update prompts

```typescript
// Re-enable these lines in App.tsx
import { UpdatePrompt, InstallPrompt, OfflineIndicator } from '@features/pwa'
import { setupOfflineHandlers } from '@features/pwa/utils/offline'

// In component
useEffect(() => {
  setupOfflineHandlers()
}, [])

// In JSX
<OfflineIndicator />
<UpdatePrompt />
<InstallPrompt />
```

---

### Phase 2: Data Layer Stability (Week 2)
**Goal**: Consistent and reliable data operations

#### 4. Consolidate Database Query Patterns

**Problem**: Inconsistent query filtering causing bugs

**Solution**: Create centralized query builder utilities

**Implementation**:
```typescript
// src/lib/queryBuilder.ts
export const visibilityFilter = {
  forPublicUser: (query: any) => {
    return query
      .eq('is_public', true)
      .or('moderation_status.is.null,moderation_status.in.(approved,pending,flagged)')
  },
  
  forAuthenticatedUser: (query: any, userId: string) => {
    return query.or(
      `and(is_public.neq.false,or(moderation_status.is.null,moderation_status.in.(approved,pending,flagged))),created_by.eq.${userId}`
    )
  },
  
  forModerator: (query: any) => query // No filters
}

// Usage in services
const query = visibilityFilter.forPublicUser(
  supabase.from('arrangements').select('*')
)
```

**Files to update**:
- Create `src/lib/queryBuilder.ts`
- Update `src/features/songs/services/songService.ts`
- Update `src/features/songs/services/arrangementService.ts`

---

#### 5. Add Database Migration System

**Problem**: Code references tables that don't exist

**Options**:
1. **Create missing tables** via Supabase migrations
2. **Remove unused code** if features aren't needed yet

**Missing tables**:
- permissions
- custom_roles
- permission_groups
- user_permissions
- moderation_log
- content_reports

**Migration example**:
```sql
-- supabase/migrations/add_permission_tables.sql
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes and RLS policies
```

---

### Phase 3: Performance & UX (Week 3)
**Goal**: Improve user experience and application performance

#### 6. Implement Proper Error Boundaries

**Current state**: Basic ErrorBoundary exists but underutilized

**Improvements needed**:
```typescript
// src/features/monitoring/components/ErrorFallback.tsx
export const ErrorFallback = ({ error, resetError }) => (
  <div className="error-fallback">
    <h2>Something went wrong</h2>
    <details>{error.message}</details>
    <button onClick={resetError}>Try again</button>
  </div>
)

// Add specific boundaries for different features
<ErrorBoundary fallback={ErrorFallback} level="feature">
  <ArrangementEditor />
</ErrorBoundary>
```

---

#### 7. Fix Bundle Size Issues

**Problem**: Main bundle is 656KB, affecting initial load

**Solutions**:

1. **Dynamic imports for heavy libraries**:
```typescript
// Lazy load ChordSheetJS
const ChordSheetJS = lazy(() => import('chordsheetjs'))

// Lazy load editor components
const ChordEditor = lazy(() => 
  import('@features/arrangements/components/ChordEditor')
)
```

2. **Update vite.config.ts**:
```typescript
manualChunks: {
  'chord-lib': ['chordsheetjs'],
  'editor': ['@codemirror/view', '@codemirror/state'],
  'admin': ['@features/admin', '@features/moderation'],
}
```

---

### Phase 4: Developer Experience (Week 4)
**Goal**: Improve development workflow and maintainability

#### 8. Add Integration Tests

**Priority test scenarios**:
1. Public user can view approved arrangements
2. Authentication flow works correctly
3. Offline mode stores and syncs data
4. Permission checks work as expected

**Example test**:
```typescript
// src/features/songs/__tests__/public-access.test.ts
describe('Public Access', () => {
  it('shows approved arrangements to unauthenticated users', async () => {
    const arrangements = await arrangementService.getAllArrangements()
    expect(arrangements).toContainEqual(
      expect.objectContaining({
        metadata: { isPublic: true }
      })
    )
  })
})
```

---

#### 9. Setup Monitoring

**Tasks**:
1. Implement logger.ts TODO (line 61)
2. Add Sentry integration
3. Track web vitals

```typescript
// src/lib/logger.ts
if (import.meta.env.PROD) {
  // Send to Sentry
  Sentry.captureException(error, {
    level,
    extra: { component, ...context }
  })
}
```

---

## 📋 Quick Win Checklist

Execute these in order for maximum impact:

```bash
# 1. Fix ESLint warnings (5 minutes)
npm run lint -- --fix

# 2. Re-enable PWA (10 minutes)
# Uncomment lines in App.tsx
# Test with: npm run build && npm run preview

# 3. Fix permission stubs (30 minutes)
# Either implement basic version or disable UI

# 4. Create query builder utility (20 minutes)
# Centralize all visibility filters

# 5. Add error boundaries (15 minutes)
# Create fallback components
```

---

## 🚫 What NOT to Do Yet

1. **Don't add new features** - Foundation first
2. **Don't refactor working code** - If it works, leave it
3. **Don't add complex state management** - Context API is sufficient
4. **Don't optimize prematurely** - Focus on critical performance issues only
5. **Don't implement complex permissions** - Basic roles are enough for now

---

## 📊 Success Metrics

### After Phase 1-2 (2 weeks):
- ✅ **Zero console errors** in development
- ✅ **< 10 ESLint warnings** (from 31)
- ✅ **PWA score > 90** in Lighthouse
- ✅ **All permission checks** return real data or are disabled
- ✅ **Consistent query patterns** across all services

### After Phase 3-4 (4 weeks):
- ✅ **Bundle size < 500KB** for main chunk
- ✅ **Error boundary coverage** for all major features
- ✅ **80% test coverage** for critical paths
- ✅ **Production monitoring** active
- ✅ **< 3s initial load time**

---

## 🎯 Implementation Priority

### Week 1: Stop the Bleeding
- Fix permission stubs (4 hours)
- Fix React warnings (2 hours)
- Re-enable PWA (1 hour)
- Test everything (1 hour)

### Week 2: Stabilize Data Layer
- Create query builder (2 hours)
- Update all services (3 hours)
- Add missing migrations or remove code (3 hours)

### Week 3: Enhance UX
- Add error boundaries (2 hours)
- Optimize bundle size (4 hours)
- Test offline scenarios (2 hours)

### Week 4: Developer Experience
- Add integration tests (4 hours)
- Setup monitoring (2 hours)
- Documentation updates (2 hours)

---

## 🔄 Maintenance After Implementation

### Daily:
- Check error logs
- Monitor bundle size
- Review new warnings

### Weekly:
- Run full test suite
- Check Lighthouse scores
- Review error reports

### Monthly:
- Dependency updates
- Performance audit
- Security review

---

## 📚 Related Documentation

- [CLAUDE.md](./CLAUDE.md) - Project setup and conventions
- [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) - Current database structure
- [TESTING_ARCHITECTURE.md](./TESTING_ARCHITECTURE.md) - Testing guidelines
- [MVP_FEATURE_VERIFICATION.md](./MVP_FEATURE_VERIFICATION.md) - Feature checklist

---

## 🚀 Getting Started

1. Read this entire document
2. Start with Phase 1, Task 1 (Permission System)
3. Complete each phase before moving to the next
4. Test thoroughly after each change
5. Document any decisions or changes

Remember: **Stability first, features second!**