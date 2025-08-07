# Testing Architecture - Vertical Slice Pattern

## ✅ Pure Vertical Slice Architecture

Tests are fully integrated into the Vertical Slice Architecture - no separate test folder! Each feature owns its tests, and shared test utilities live in the shared folder alongside other shared code.

## 📁 Current Test Structure

```
src/
├── shared/                         # Shared utilities (including test utils)
│   ├── test-utils/                # Shared test utilities
│   │   ├── setup.ts               # Global test setup and Clerk mocks
│   │   └── clerk-test-utils.tsx   # Reusable Clerk test utilities
│   ├── components/                # Shared UI components
│   ├── hooks/                     # Shared hooks
│   └── styles/                    # Global styles
│
└── features/
    ├── auth/
    │   ├── components/
    │   │   ├── AuthButtons.tsx
    │   │   ├── ProtectedRoute.tsx
    │   │   ├── UserMenu.tsx
    │   │   └── __tests__/          # Component tests
    │   │       ├── AuthButtons.test.tsx
    │   │       ├── ProtectedRoute.test.tsx
    │   │       └── UserMenu.test.tsx
    │   │
    │   └── hooks/
    │       ├── useAuth.ts
    │       └── __tests__/          # Hook tests
    │           └── useAuth.test.ts
    │
    └── setlists/
        └── hooks/
            ├── useSetlists.ts
            └── __tests__/          # Hook tests
                └── useSetlists.test.ts
```

## 🎯 Key Principles

### 1. **Colocation**
- Tests live next to the code they test
- Each feature owns its tests
- Easy to find related tests

### 2. **Feature Independence**
- Each feature's tests are self-contained
- No cross-feature test dependencies
- Feature can be moved/deleted with its tests

### 3. **Shared Test Utilities**
- Global test setup in `src/test/setup.ts`
- Reusable utilities in `src/test/utils/`
- Mocks and helpers available to all features

## 📝 Test File Naming Convention

- Component tests: `ComponentName.test.tsx`
- Hook tests: `useHookName.test.ts`
- Service tests: `serviceName.test.ts`
- Utility tests: `utilityName.test.ts`

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm test -- --run

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui

# Run tests for a specific feature
npm test src/features/auth

# Run tests in watch mode for a specific file
npm test AuthButtons
```

## 📊 Current Test Status

- **Total Test Suites**: 5
- **Total Tests**: 32
- **Passing**: 27
- **Coverage Areas**:
  - ✅ Authentication components
  - ✅ Protected routes
  - ✅ User hooks
  - ✅ Setlist user association
  - ✅ Clerk integration mocking

## 🔧 Test Configuration

### Vitest Configuration (`vitest.config.ts`)
- Environment: `jsdom` for React components
- Global setup: `src/test/setup.ts`
- Path aliases configured for clean imports
- Coverage exclusions for config files

### Test Setup (`src/test/setup.ts`)
- Clerk mocks configured globally
- Testing Library DOM matchers
- Browser API mocks (matchMedia, IntersectionObserver)

## 📚 Test Utilities

### Clerk Test Utils (`src/test/utils/clerk-test-utils.tsx`)
- `renderWithClerk()` - Render with Clerk context
- `createMockUser()` - Generate test users
- `setAuthState()` - Configure auth state
- `setUserState()` - Configure user state
- Mock implementations for all Clerk hooks

## ✨ Best Practices

1. **Write tests next to code** - Always create tests in `__tests__` folder
2. **Use feature-specific mocks** - Keep mocks close to the feature
3. **Share only truly generic utilities** - Most test utils should be feature-specific
4. **Test behavior, not implementation** - Focus on user interactions
5. **Maintain test isolation** - Each test should be independent

## 🚀 Adding New Tests

When adding a new feature or component:

1. Create `__tests__` folder in the component/hook directory
2. Name test file as `[ComponentName].test.tsx` or `[hookName].test.ts`
3. Import from parent directory using `../ComponentName`
4. Use shared test utilities from `@test/utils/`
5. Follow existing patterns for consistency

## 📈 Next Steps

- [ ] Add integration tests for feature interactions
- [ ] Implement E2E tests for critical user flows
- [ ] Add performance testing for large datasets
- [ ] Set up visual regression testing
- [ ] Configure CI/CD test pipeline

---

*Testing architecture follows Vertical Slice principles for maximum cohesion and minimal coupling.*