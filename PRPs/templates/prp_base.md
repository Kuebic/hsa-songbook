name: "Base PRP Template v3 - Implementation-Focused with Precision Standards"
description: |

---

## Goal

**Feature Goal**: [Specific, measurable end state of what needs to be built]

**Deliverable**: [Concrete artifact - API endpoint, service class, integration, etc.]

**Success Definition**: [How you'll know this is complete and working]

## User Persona (if applicable)

**Target User**: [Specific user type - developer, end user, admin, etc.]

**Use Case**: [Primary scenario when this feature will be used]

**User Journey**: [Step-by-step flow of how user interacts with this feature]

**Pain Points Addressed**: [Specific user frustrations this feature solves]

## Why

- [Business value and user impact]
- [Integration with existing features]
- [Problems this solves and for whom]

## What

[User-visible behavior and technical requirements]

### Success Criteria

- [ ] [Specific measurable outcomes]

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: [Complete URL with section anchor]
  why: [Specific methods/concepts needed for implementation]
  critical: [Key insights that prevent common implementation errors]

- file: [exact/path/to/pattern/file.ts or .tsx]
  why: [Specific pattern to follow - component structure, error handling, etc.]
  pattern: [Brief description of what pattern to extract]
  gotcha: [Known constraints or limitations to avoid]

- docfile: [PRPs/ai_docs/domain_specific.md]
  why: [Custom documentation for complex library/integration patterns]
  section: [Specific section if document is large]
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase

```bash

```

### Desired Codebase tree with files to be added and responsibility of file

```bash

```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: [Library name] requires [specific setup]
// Example: Supabase requires proper RLS policies for data access
// Example: React Query needs proper cache key management
// Example: ChordSheetJS requires specific input format for parsing
```

## Implementation Blueprint

### Data models and structure

Create the core data models, we ensure type safety and consistency.

```typescript
Examples:
 - TypeScript interfaces
 - Zod validation schemas
 - Supabase database types
 - React component prop types

```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/features/{domain}/types/{domain}.types.ts
  - IMPLEMENT: TypeScript interfaces for domain entities
  - FOLLOW pattern: src/features/songs/types/song.types.ts (interface structure)
  - NAMING: PascalCase for interfaces, camelCase for properties
  - PLACEMENT: Feature-specific types directory

Task 2: CREATE src/features/{domain}/validation/{domain}Schemas.ts
  - IMPLEMENT: Zod validation schemas for forms and API inputs
  - FOLLOW pattern: src/features/songs/validation/songFormSchema.ts (schema structure)
  - NAMING: camelCase schema names with descriptive suffixes
  - DEPENDENCIES: Import types from Task 1
  - PLACEMENT: Feature validation directory

Task 3: CREATE src/features/{domain}/services/{domain}Service.ts
  - IMPLEMENT: Service class with Supabase operations
  - FOLLOW pattern: src/features/songs/services/songService.ts (service structure, error handling)
  - METHODS: create(), getById(), update(), delete(), query operations
  - DEPENDENCIES: Import types and schemas from Tasks 1-2
  - PLACEMENT: Service layer in feature directory

Task 4: CREATE src/features/{domain}/hooks/use{Domain}.ts
  - IMPLEMENT: React Query hooks for data fetching
  - FOLLOW pattern: Existing hooks in codebase (TanStack Query patterns)
  - HOOKS: useQuery for fetching, useMutation for updates
  - DEPENDENCIES: Import service from Task 3
  - PLACEMENT: Feature hooks directory

Task 5: CREATE src/features/{domain}/components/{DomainComponent}.tsx
  - IMPLEMENT: React components for feature UI
  - FOLLOW pattern: src/features/songs/components/SongCard.tsx (component structure)
  - PROPS: Typed props interfaces, proper event handlers
  - DEPENDENCIES: Import hooks from Task 4
  - PLACEMENT: Feature components directory

Task 6: CREATE src/features/{domain}/services/tests/{domain}Service.test.ts
  - IMPLEMENT: Unit tests for service methods (happy path, edge cases, error handling)
  - FOLLOW pattern: Existing test files (Vitest setup, mock patterns)
  - NAMING: describe() blocks for methods, test() for scenarios
  - COVERAGE: All service methods with positive and negative test cases
  - PLACEMENT: Tests alongside the code they test
```

### Implementation Patterns & Key Details

```typescript
// Show critical patterns and gotchas - keep concise, focus on non-obvious details

// Example: Service method pattern
class {Domain}Service {
  async create{Domain}(data: Create{Domain}Input): Promise<{Domain}> {
    // PATTERN: Zod validation first (follow existing service patterns)
    const validated = {domain}Schema.parse(data);

    // GOTCHA: [Library-specific constraint or requirement]
    // PATTERN: Supabase error handling approach (reference existing service pattern)
    // CRITICAL: [Non-obvious requirement or configuration detail]

    const { data: result, error } = await this.supabase
      .from('{domain}s')
      .insert(validated)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return result;
  }
}

// Example: React component pattern
export function {Domain}Component({ {prop}: {Domain}Props }) {
  // PATTERN: React Query for data fetching (see existing components)
  const { data, isLoading, error } = use{Domain}(id);
  
  // PATTERN: Error boundaries and loading states
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  
  // RETURN: JSX with proper TypeScript typing
  return <div>{/* component content */}</div>;
}
```

### Integration Points

```yaml
DATABASE:
  - migration: "supabase/migrations/20250121_add_feature.sql"
  - rls: "CREATE POLICY feature_policy ON features FOR ALL USING (auth.uid() = user_id)"

TYPES:
  - update: "src/lib/database.types.ts"
  - generate: "npx supabase gen types typescript --local > src/lib/database.types.ts"

ROUTING:
  - add to: "src/app/App.tsx"
  - pattern: "<Route path='/feature' element={<FeaturePage />} />"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint                         # ESLint check and auto-fix
npm run build                        # TypeScript compilation check

# Project-wide validation  
npm run lint
npm run build

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test each component as it's created
npm run test -- src/features/{domain}/services/{domain}Service.test.ts
npm run test -- src/features/{domain}/components/{Component}.test.tsx

# Full test suite for affected areas
npm run test -- src/features/{domain}
npm run test

# Coverage validation
npm run test:coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Application startup validation
npm run dev &
sleep 3  # Allow startup time

# Health check validation
curl -f http://localhost:5173 || echo "Development server not responding"

# Database validation (if database integration)
npx supabase status --local
npx supabase db query "SELECT 1" --local

# Feature-specific testing
# Navigate to feature page in browser
# Test user interactions manually

# Database migration validation
npx supabase migration up --local
npx supabase gen types typescript --local > src/lib/database.types.ts

# Expected: All integrations working, proper responses, no connection errors
```

### Level 4: Creative & Domain-Specific Validation

```bash
# React Component Testing:

# Visual regression testing (if available)
npm run test:visual

# Accessibility testing
npm run test:a11y

# Performance testing (if performance requirements)
npm run test:performance

# E2E testing with Playwright (if available)
npm run test:e2e

# Mobile responsiveness testing
# Test on different screen sizes manually
# Chrome DevTools -> Device Toolbar

# Cross-browser testing
# Test in Chrome, Firefox, Safari

# PWA validation (if PWA features)
npm run build
npm run preview
# Test offline functionality

# Supabase RLS policy testing
npx supabase db test --local

# Custom Business Logic Validation
# [Add domain-specific validation commands here]

# Expected: All creative validations pass, performance meets requirements
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run build`
- [ ] TypeScript strict mode compliance

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Manual testing successful: [specific commands from Level 3]
- [ ] Error cases handled gracefully with proper error messages
- [ ] Integration points work as specified
- [ ] User persona requirements satisfied (if applicable)

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] File placement matches desired codebase tree structure
- [ ] Anti-patterns avoided (check against Anti-Patterns section)
- [ ] Dependencies properly managed and imported
- [ ] Configuration changes properly integrated

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] Logs are informative but not verbose
- [ ] Environment variables documented if new ones added

---

## Anti-Patterns to Avoid

- ❌ Don't create new patterns when existing ones work
- ❌ Don't skip validation because "it should work"
- ❌ Don't ignore failing tests - fix them
- ❌ Don't mix async/await with Promise chains
- ❌ Don't hardcode values that should be environment variables
- ❌ Don't ignore TypeScript errors - fix them
- ❌ Don't skip React hook dependency arrays
- ❌ Don't forget to handle loading and error states
