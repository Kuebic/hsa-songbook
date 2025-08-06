List and review any files in the staging area, both staged and unstaged.
Ensure you look at both new files and modified files.

Check the diff of each file to see what has changed.

Previous review report: $ARGUMENTS

May or may not be added, ignore the previous review if not specified.

## Review Focus Areas

1. **TypeScript Code Quality**
   - Strict TypeScript usage with explicit types
   - No `any` types - use `unknown` if type is truly unknown
   - Proper type imports with `import type { }` syntax
   - Component props interfaces defined
   - React types properly used (ReactElement, FC, PropsWithChildren)
   - Following TypeScript strict mode compliance

2. **React-Specific Patterns**
   - Functional components with hooks (useState, useEffect, etc.)
   - React 19 features usage (Actions, use() API, Suspense)
   - Custom hooks for reusable logic
   - Proper component composition and prop drilling avoidance
   - Context API usage where appropriate
   - Error boundaries for error handling

3. **Performance & Bundle Optimization**
   - Code splitting with React.lazy and dynamic imports
   - Memoization with useMemo and useCallback where needed
   - Vite bundle optimization and chunking strategies
   - Bundle size considerations
   - Avoiding unnecessary re-renders

4. **Security & Validation**
   - Input validation with Zod schemas
   - Environment variables prefixed with VITE_ for client exposure
   - XSS prevention and sanitization
   - No hardcoded secrets in client-side code
   - API integration with proper error handling

5. **State Management**
   - Local state with useState for component-specific data
   - Context API for cross-component state
   - Server state with TanStack Query or similar
   - Proper state updates without mutations

6. **Package Management**
   - Consistent package manager usage (npm/pnpm/yarn)
   - Proper dependency management
   - No unused dependencies
   - Correct dev vs runtime dependencies

7. **Code Structure & Architecture**
   - Components under 200 lines maximum
   - Functions under 50 lines with single responsibility
   - Proper separation of concerns
   - Feature-based organization
   - Vertical slice architecture followed

8. **Testing & Quality Assurance**
   - Vitest configuration and tests
   - 80%+ test coverage maintained
   - Component tests using React Testing Library
   - Integration tests for user flows
   - Proper mocking of external dependencies

9. **Build & Development**
   - `npm run type-check` passes with zero errors
   - ESLint compliance with zero warnings
   - Prettier formatting applied
   - Vite production build succeeds
   - No React hydration errors

10. **Documentation & Maintenance**
    - Clear component interfaces
    - Proper prop descriptions
    - CLAUDE.md updates for new patterns/dependencies
    - README updates if needed

## Review Output

Create a concise review report with:

```markdown
# React/TypeScript/Vite Code Review #[number]

## Summary
[2-3 sentence overview focusing on React patterns, TypeScript quality, and Vite optimization]

## Issues Found

### 🔴 Critical (Must Fix)
- [Issue with file:line and suggested fix - focus on type safety, hydration, security]

### 🟡 Important (Should Fix)
- [Issue with file:line and suggested fix - focus on performance, patterns]

### 🟢 Minor (Consider)
- [Improvement suggestions for optimization, maintainability]

## Good Practices
- [What was done well - highlight proper React patterns, TypeScript usage, Vite features]

## React-Specific Findings
- [Component patterns assessment]
- [Hook usage and custom hooks]
- [State management approach]
- [Performance optimizations]

## TypeScript Quality
- [Type safety assessment]
- [Strict mode compliance]
- [Interface definitions]

## Test Coverage
Current: X% | Required: 80%
Missing tests: [list with focus on component and API tests]

## Build Validation
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] `npm run test` passes with 80%+ coverage
```

Save report to PRPs/code_reviews/review[#].md (check existing files first)