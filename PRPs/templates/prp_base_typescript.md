name: "TypeScript PRP Template v3 - Implementation-Focused with Precision Standards"
description: |

---

## Goal

**Feature Goal**: [Specific, measurable end state of what needs to be built]

**Deliverable**: [Concrete artifact - React component, API route, integration, etc.]

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

- file: [exact/path/to/pattern/file.tsx]
  why: [Specific pattern to follow - component structure, hook usage, etc.]
  pattern: [Brief description of what pattern to extract]
  gotcha: [Known constraints or limitations to avoid]

- docfile: [PRPs/ai_docs/typescript_specific.md]
  why: [Custom documentation for complex TypeScript/Next.js patterns]
  section: [Specific section if document is large]
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase

```bash

```

### Vertical Slice Architecture Analysis

**Existing Feature Slices** (analyze current patterns):
```yaml
src/features/songs/:     # Song management slice
  - types/song.types.ts  # Domain types
  - components/          # UI components
  - hooks/              # State and API hooks  
  - services/           # API communication
  - pages/              # Route-specific pages

src/features/auth/:      # Authentication slice
  - Similar structure...

src/features/setlists/:  # Setlist management slice
  - Similar structure...
```

**Feature Boundary Definition**:
- **This Slice Owns**: [List specific domain responsibilities]
- **Dependencies On Other Slices**: [Minimal, explicit dependencies only]  
- **Shared/Common Code**: [What can be accessed from shared/ directory]
- **Slice Isolation**: [How this slice maintains independence]

### Desired Codebase tree with files to be added and responsibility of file

```bash
src/features/{new-feature-name}/
├── types/
│   └── {domain}.types.ts        # Domain-specific TypeScript types and interfaces
├── components/
│   ├── {ComponentName}.tsx      # Feature-specific React components
│   └── __tests__/
├── hooks/
│   ├── use{DomainAction}.ts     # Custom hooks for state and API calls
│   └── __tests__/
├── services/
│   └── {domain}Service.ts       # API communication layer
├── pages/
│   └── {FeaturePage}.tsx        # Route-specific page components
└── index.ts                     # Public API exports for this slice
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: [Library name] requires [specific setup]
// Example: Next.js 15 App Router - Route handlers must export named functions
// Example: 'use client' directive must be at top of file, affects entire component tree
// Example: Server Components can't use browser APIs or event handlers
// Example: We use TypeScript strict mode and require proper typing
```

## Implementation Blueprint

### Data models and structure

Create the core data models, we ensure type safety and consistency.

```typescript
Examples:
 - Zod schemas for validation
 - TypeScript interfaces/types
 - Database schema types
 - API response types
 - Component prop types

```

### Implementation Tasks (ordered by vertical slice completion)

**CRITICAL: Implement complete vertical slice - UI to data layer within feature boundary**

```yaml
Task 1: CREATE src/features/{feature}/types/{domain}.types.ts
  - IMPLEMENT: Complete domain types and interfaces for the feature slice
  - FOLLOW pattern: src/features/songs/types/song.types.ts (interface structure, export patterns)
  - NAMING: PascalCase for interfaces, camelCase for properties
  - PLACEMENT: Within feature slice types directory
  - SLICE BOUNDARY: Define all types needed for this feature's complete operation

Task 2: CREATE src/features/{feature}/services/{domain}Service.ts
  - IMPLEMENT: API communication layer for the feature
  - FOLLOW pattern: src/features/songs/services/songService.ts (service structure, error handling)
  - DEPENDENCIES: Import types from Task 1
  - SLICE BOUNDARY: Handle all API operations for this feature domain
  - PLACEMENT: Within feature slice services directory

Task 3: CREATE src/features/{feature}/hooks/use{DomainAction}.ts
  - IMPLEMENT: Custom hooks for state management and API integration
  - FOLLOW pattern: src/features/songs/hooks/useSongs.ts (hook structure, TypeScript generics)
  - DEPENDENCIES: Import types from Task 1, services from Task 2
  - SLICE BOUNDARY: Manage all state and side effects for this feature
  - PLACEMENT: Within feature slice hooks directory

Task 4: CREATE src/features/{feature}/components/{ComponentName}.tsx
  - IMPLEMENT: Feature-specific UI components
  - FOLLOW pattern: src/features/songs/components/ (component structure, props typing)
  - DEPENDENCIES: Import types from Task 1, hooks from Task 3
  - SLICE BOUNDARY: All UI components specific to this feature domain
  - PLACEMENT: Within feature slice components directory

Task 5: CREATE src/features/{feature}/pages/{FeaturePage}.tsx
  - IMPLEMENT: Route-specific page components that compose the feature
  - FOLLOW pattern: src/features/songs/pages/ (page structure, component composition)
  - DEPENDENCIES: Import components from Task 4, hooks from Task 3
  - SLICE BOUNDARY: Complete user-facing pages for this feature
  - PLACEMENT: Within feature slice pages directory

Task 6: CREATE src/features/{feature}/index.ts
  - IMPLEMENT: Public API exports for the feature slice
  - FOLLOW pattern: src/features/songs/index.ts (selective exports)
  - DEPENDENCIES: Export public interfaces from all previous tasks
  - SLICE BOUNDARY: Define what other slices can import from this feature
  - PLACEMENT: Root of feature slice directory

Task 7: CREATE src/features/{feature}/components/__tests__/{component}.test.tsx
  - IMPLEMENT: Complete test coverage for the feature slice
  - FOLLOW pattern: src/features/auth/components/__tests__/ (test structure, mocking)
  - COVERAGE: Test complete vertical slice functionality
  - SLICE BOUNDARY: Test feature in isolation with minimal external dependencies
  - PLACEMENT: Within feature slice test directories
```

### Implementation Patterns & Key Details

```typescript
// Show critical patterns and gotchas - keep concise, focus on non-obvious details

// Example: Component pattern
interface {Domain}Props {
  // PATTERN: Strict TypeScript interfaces (follow lib/types/existing.types.ts)
  data: {Domain}Data;
  onAction?: (id: string) => void;
}

export function {Domain}Component({ data, onAction }: {Domain}Props) {
  // PATTERN: Client/Server component patterns (check existing components)
  // GOTCHA: 'use client' needed for event handlers, useState, useEffect
  // CRITICAL: Server Components for data fetching, Client Components for interactivity

  return (
    // PATTERN: Consistent styling approach (see components/ui/)
    <div className="existing-class-pattern">
      {/* Follow existing component composition patterns */}
    </div>
  );
}

// Example: API route pattern
export async function GET(request: Request): Promise<Response> {
  // PATTERN: Request validation and error handling (see app/api/existing/route.ts)
  // GOTCHA: [TypeScript-specific constraint or Next.js requirement]
  // RETURN: Response object with proper TypeScript typing
}

// Example: Custom hook pattern
export function use{Domain}Action(): {Domain}ActionResult {
  // PATTERN: Hook structure with TypeScript generics (see hooks/useExisting.ts)
  // GOTCHA: [React hook rules and TypeScript typing requirements]
}
```

### Integration Points & Cross-Slice Dependencies

**CRITICAL: Minimize cross-slice dependencies to maintain architectural boundaries**

```yaml
WITHIN SLICE (Self-contained):
  - All feature domain logic
  - Feature-specific types and interfaces
  - Feature-specific UI components
  - Feature-specific API services
  - Feature-specific state management

SHARED/COMMON DEPENDENCIES (Allowed):
  - src/shared/components/ui/ - Common UI primitives
  - src/shared/utils/ - Generic utility functions  
  - src/shared/types/ - Cross-cutting type definitions
  - src/shared/hooks/ - Generic reusable hooks

CROSS-SLICE DEPENDENCIES (Minimize & Make Explicit):
  - Import only from other slice's index.ts (public API)
  - Document why cross-slice dependency is necessary
  - Consider if functionality should be moved to shared/

BACKEND INTEGRATION:
  - API routes: server/features/{feature}/ (mirror frontend slice structure)
  - Database: Feature-specific collections/tables
  - Services: Feature-specific server services

ROUTING:
  - Pages: src/features/{feature}/pages/
  - Routes defined by feature slice ownership
  - Route parameters typed within slice
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint                    # ESLint checks with TypeScript rules
npx tsc --noEmit               # TypeScript type checking (no JS output)
npm run format                 # Prettier formatting

# Project-wide validation
npm run lint:fix               # Auto-fix linting issues
npm run type-check             # Full TypeScript validation

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test each component/hook as it's created
npm test -- __tests__/{domain}.test.tsx
npm test -- __tests__/use{Hook}.test.ts

# Full test suite for affected areas
npm test -- components/{domain}/
npm test -- hooks/

# Coverage validation (if available)
npm test -- --coverage --watchAll=false

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Development server validation
npm run dev &
sleep 5  # Allow Next.js startup time

# Page load validation
curl -I http://localhost:3000/{feature-page}
# Expected: 200 OK response

# API endpoint validation
curl -X POST http://localhost:3000/api/{resource} \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  | jq .  # Pretty print JSON response

# Production build validation
npm run build
# Expected: Successful build with no TypeScript errors or warnings

# Component rendering validation (if SSR/SSG)
curl http://localhost:3000/{page} | grep -q "expected-content"

# Expected: All integrations working, proper responses, no hydration errors
```

### Level 4: Creative & Domain-Specific Validation

```bash
# TypeScript/React/Vite Specific Validation:

# Production build performance
npm run build && npm run preview  # Vite production build and preview

# Type safety validation  
npm run type-check               # Project-specific TypeScript checking

# Bundle analysis (if available)
npm run analyze                  # Bundle size analysis

# Vertical Slice Architecture Validation:
# Check feature slice isolation
find src/features/{feature} -name "*.ts" -o -name "*.tsx" | xargs grep -l "from.*features/[^{feature}]" 
# Expected: Minimal or zero cross-slice imports

# Validate slice completeness
ls -la src/features/{feature}/
# Expected: types/, components/, hooks/, services/, pages/, index.ts

# Check circular dependencies
npx madge --circular --extensions ts,tsx src/features/{feature}
# Expected: No circular dependencies within slice

# Test slice in isolation
npm test -- src/features/{feature}
# Expected: All tests pass without external feature dependencies

# Custom React/Vite Validation
# Component isolation testing
# Hook behavior validation
# Service integration testing
# TypeScript strict mode compliance across slice

# Expected: Complete vertical slice functionality, architectural compliance
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No formatting issues: `npm run format --check`
- [ ] Production build succeeds: `npm run build`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Manual testing successful: [specific commands from Level 3]
- [ ] Error cases handled gracefully with proper TypeScript error types
- [ ] Integration points work as specified
- [ ] User persona requirements satisfied (if applicable)

### Code Quality Validation

- [ ] Follows existing TypeScript/React patterns and naming conventions
- [ ] File placement matches desired codebase tree structure within feature slice
- [ ] **Vertical slice architecture maintained**: Feature is self-contained and complete
- [ ] **Cross-slice dependencies minimized**: Only imports from other slices' public APIs
- [ ] **Slice boundaries respected**: No violations of existing feature boundaries  
- [ ] Anti-patterns avoided (check against Anti-Patterns section)
- [ ] Dependencies properly managed with correct TypeScript typings
- [ ] Configuration changes properly integrated

### TypeScript/Next.js Specific

- [ ] Proper TypeScript interfaces and types defined
- [ ] Server/Client component patterns followed correctly
- [ ] 'use client' directives used appropriately
- [ ] API routes follow Next.js App Router patterns
- [ ] No hydration mismatches between server/client rendering

### Documentation & Deployment

- [ ] Code is self-documenting with clear TypeScript types
- [ ] Props interfaces properly documented
- [ ] Environment variables documented if new ones added

---

## Anti-Patterns to Avoid

**General Anti-Patterns:**
- ❌ Don't create new patterns when existing ones work
- ❌ Don't skip validation because "it should work"
- ❌ Don't ignore failing tests - fix them
- ❌ Don't hardcode values that should be config
- ❌ Don't catch all exceptions - be specific

**Vertical Slice Architecture Anti-Patterns:**
- ❌ Don't create direct imports between feature slices - use public APIs only
- ❌ Don't put shared business logic in one slice that others depend on - move to shared/
- ❌ Don't create incomplete slices missing layers (e.g., UI without corresponding hooks)
- ❌ Don't violate slice boundaries for "convenience" - maintain architectural discipline
- ❌ Don't create circular dependencies between slices - each should be independently deployable
- ❌ Don't bypass the slice's public API (index.ts) when importing from other features
