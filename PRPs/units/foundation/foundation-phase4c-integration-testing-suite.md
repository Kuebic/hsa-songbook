# Foundation Phase 4C: Integration Testing Suite - Implementation PRP

## Goal

**Feature Goal**: Establish comprehensive integration testing for critical user flows achieving 80% coverage on essential paths

**Deliverable**: Complete test suite covering authentication, CRUD operations, PWA functionality, and permission system with MSW mocking

**Success Definition**: 80% test coverage on critical paths, zero flaky tests, < 5 minute execution time, all integration tests passing in CI

## Context

```yaml
existing_infrastructure:
  test_runner: "vitest@3.2.4 with @vitest/ui"
  testing_library: "@testing-library/react@16.3.0"
  mocking: "msw@2.10.4, fake-indexeddb@6.1.0"
  coverage: "@vitest/coverage-v8@3.2.4"
  
test_utilities:
  location: "src/shared/test-utils/"
  auth_mocks: "src/shared/test-utils/auth-test-utils.tsx"
  providers: "src/shared/test-utils/test-providers.tsx"
  supabase_mock: "src/shared/test-utils/supabase-mock.ts"

critical_paths:
  authentication: "Clerk integration, protected routes"
  song_crud: "Create, read, update, delete with RLS"
  arrangements: "ChordPro editor with auto-save"
  setlists: "Drag-drop, sharing, offline sync"
  permissions: "RBAC with user/moderator/admin"
  pwa: "Service worker, offline, IndexedDB"

coverage_targets:
  global: "80% statements, 75% branches"
  auth: "90% (critical security)"
  services: "85% (business logic)"
  
vitest_docs:
  config: "https://vitest.dev/config/"
  coverage: "https://vitest.dev/guide/coverage"
  mocking: "https://vitest.dev/guide/mocking"
  
msw_patterns:
  setup: "https://mswjs.io/docs/getting-started"
  supabase: "https://github.com/supabase/supabase-js/discussions/480"
```

## Implementation Tasks

### 1. Enhance Vitest Configuration [enhance-vitest-config]
Update `vitest.config.ts` with optimized settings:
- Thread pool configuration for parallel execution
- Coverage thresholds per directory
- Retry configuration for stability
- Test timeout optimization
- Follow existing config pattern

### 2. Create MSW Server Setup [create-msw-setup]
Create `src/shared/test-utils/msw-setup.ts`:
- Supabase REST API handlers
- Authentication endpoints
- Real-time subscription mocks
- RLS policy simulation
- Error response scenarios

### 3. Implement Authentication Flow Tests [implement-auth-tests]
Create `src/features/auth/__tests__/auth-flow.integration.test.ts`:
- Complete signup flow with Clerk
- Login with email/password
- Protected route access control
- Session refresh handling
- Logout and cleanup

### 4. Create Song CRUD Integration Tests [create-song-tests]
Create `src/features/songs/__tests__/song-crud.integration.test.ts`:
- Create song with validation
- Read with RLS filtering
- Update with permission checks
- Delete with cascade handling
- Bulk operations performance

### 5. Test Arrangement Management [test-arrangements]
Create `src/features/arrangements/__tests__/arrangement.integration.test.ts`:
- ChordPro editor auto-save to IndexedDB
- Server synchronization when online
- Conflict resolution for concurrent edits
- Recovery dialog functionality
- Transpose and formatting operations

### 6. Implement Setlist Integration Tests [implement-setlist-tests]
Create `src/features/setlists/__tests__/setlist.integration.test.ts`:
- Create and manage setlists
- Drag-drop reordering with @dnd-kit
- Share functionality with public URLs
- Offline storage and sync
- Export to various formats

### 7. Test Permission System [test-permissions]
Create `src/features/permissions/__tests__/rbac.integration.test.ts`:
- User role enforcement
- Moderator capabilities
- Admin access control
- Permission escalation prevention
- API endpoint protection

### 8. PWA and Offline Tests [test-pwa-offline]
Create `src/features/pwa/__tests__/offline.integration.test.ts`:
- Service worker registration
- Cache-first strategies
- Offline data access from IndexedDB
- Background sync when reconnected
- Update prompt handling

### 9. Create Test Data Factories [create-test-factories]
Create `src/shared/test-utils/factories/`:
- User factory with roles
- Song factory with variations
- Arrangement factory with ChordPro
- Setlist factory with songs
- Use @faker-js/faker for realistic data

### 10. Implement Test Helpers [implement-test-helpers]
Create `src/shared/test-utils/helpers/`:
- waitForStableState utility
- Custom queries for common elements
- Supabase query matchers
- Performance measurement helpers
- Flaky test prevention utilities

### 11. Add Coverage Reporting [add-coverage-reporting]
Configure coverage in CI/CD:
- HTML reports for local development
- LCOV for CI integration
- Badge generation for README
- Threshold enforcement in PR checks

### 12. Create Test Documentation [create-test-docs]
Document testing patterns:
- Test structure guidelines
- Mocking strategies
- Common patterns and anti-patterns
- Debugging failing tests
- Performance optimization tips

## Validation Gates

### Level 1: Test Infrastructure
```bash
# MSW setup works
npm run test -- src/shared/test-utils/msw-setup.test.ts

# Factories generate valid data
npm run test -- src/shared/test-utils/factories

# Helpers function correctly
npm run test -- src/shared/test-utils/helpers
```

### Level 2: Individual Test Suites
```bash
# Run each suite individually
npm run test -- src/features/auth/__tests__
npm run test -- src/features/songs/__tests__
npm run test -- src/features/arrangements/__tests__
npm run test -- src/features/setlists/__tests__
npm run test -- src/features/permissions/__tests__
npm run test -- src/features/pwa/__tests__
```

### Level 3: Full Integration Suite
```bash
# Run all integration tests
npm run test:integration

# Check coverage meets targets
npm run test:coverage

# Verify no flaky tests (run 3 times)
npm run test:integration && npm run test:integration && npm run test:integration
```

### Level 4: CI/CD Integration
```bash
# Simulate CI environment
CI=true npm run test:ci

# Check execution time < 5 minutes
time npm run test:integration

# Verify coverage report generation
ls coverage/lcov-report/index.html
```

## Final Validation Checklist

- [ ] MSW server setup with Supabase handlers
- [ ] Authentication flow tests complete
- [ ] Song CRUD operations tested with RLS
- [ ] Arrangement management including auto-save
- [ ] Setlist functionality with offline support
- [ ] Permission system validated for all roles
- [ ] PWA features tested including service worker
- [ ] 80% coverage achieved on critical paths
- [ ] Zero flaky tests in CI runs
- [ ] Execution time under 5 minutes
- [ ] Coverage reports generating correctly
- [ ] Test documentation complete

## Risk Mitigation

```yaml
risks:
  flaky_tests:
    mitigation: "Retry logic, waitForStableState helper, proper cleanup"
  slow_execution:
    mitigation: "Parallel execution, test sharding, selective running"
  mock_drift:
    mitigation: "Regular validation against real Supabase responses"
  coverage_gaming:
    mitigation: "Focus on meaningful tests, not just coverage numbers"
```

## Success Metrics

- **Coverage**: 80% statements, 75% branches on critical paths
- **Reliability**: 100% pass rate in CI over 30 days
- **Performance**: < 5 minute total execution time
- **Maintainability**: Clear patterns, good documentation
- **Confidence**: Team trusts tests to catch regressions

## Dependencies

- Existing test utilities functional
- MSW and fake-indexeddb packages installed
- Vitest configuration properly set up
- CI/CD pipeline available for integration

## Implementation Time Estimate

- **MSW Setup**: 2 hours
- **Auth Tests**: 2 hours
- **CRUD Tests**: 3 hours
- **Feature Tests**: 4 hours
- **PWA Tests**: 2 hours
- **Documentation**: 1 hour
- **Total**: ~14 hours

## Notes

- Build on excellent existing test infrastructure
- ErrorBoundary already has comprehensive 321-line test suite
- Focus on integration over unit tests for better confidence
- Consider contract testing with actual Supabase in future
- Test data should be realistic using factories