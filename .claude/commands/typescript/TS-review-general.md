# General React/TypeScript/Vite Codebase Review

Perform a comprehensive review of the entire React/TypeScript/Vite codebase focusing on architecture, patterns, and best practices.

Review scope: $ARGUMENTS

If no specific scope provided, review the entire codebase.

## Review Process

1. **Codebase Analysis**
   - Analyze overall project structure and architecture
   - Review component organization and modularity
   - Check for consistency across the codebase
   - Identify technical debt and improvement opportunities

2. **Pattern Consistency**
   - Ensure consistent use of React 19 patterns and hooks
   - Validate TypeScript strict mode compliance
   - Check for consistent component and file naming conventions
   - Review import/export patterns and module resolution

3. **Performance Assessment**
   - Evaluate bundle size and Vite optimization
   - Review React memoization and rendering optimization
   - Check for unnecessary re-renders
   - Assess code splitting and lazy loading implementation

## Review Focus Areas

### 1. **Architecture & Structure**
   - Feature-based folder structure
   - Component organization (presentational vs container)
   - Custom hooks organization
   - API integration patterns
   - Proper separation of concerns with vertical slicing

### 2. **TypeScript Quality**
   - Strict mode compliance across all files
   - Type safety with no `any` types
   - Interface definitions for all props
   - Proper use of React types (ReactElement, FC, etc.)
   - Generic usage and type inference from schemas

### 3. **React-Specific Patterns**
   - React 19 features usage (Actions, use() API)
   - Hook patterns and custom hooks
   - State management approach
   - Context API usage
   - Component composition patterns

### 4. **Performance & Optimization**
   - Vite bundle optimization and chunking
   - React.lazy and Suspense usage
   - Memoization patterns (useMemo, useCallback)
   - Virtual DOM optimization
   - HMR (Hot Module Replacement) configuration

### 5. **Security & Validation**
   - Environment variable management
   - Content Security Policy implementation
   - Input validation patterns
   - API security measures
   - Zod schema consistency

### 6. **Code Quality Standards**
   - Component size limits (200 lines max)
   - Function complexity and cognitive load
   - Code duplication assessment
   - Error boundary implementation
   - Console usage and debugging practices

### 7. **Testing Coverage**
   - Vitest configuration and usage
   - Component test coverage
   - API route testing
   - Integration test quality
   - Mock usage patterns

### 8. **Dependencies & Tooling**
   - npm/pnpm/yarn usage consistency
   - Dependency management and updates
   - Vite configuration and plugins
   - Development tooling setup
   - ESLint and Prettier configurations

### 9. **Documentation & Maintenance**
   - Code documentation quality
   - README completeness
   - Component prop documentation
   - API documentation
   - CLAUDE.md updates

### 10. **Standards Compliance**
   - ESLint configuration and compliance
   - Prettier formatting consistency
   - TypeScript strict mode adherence
   - Build process compliance
   - Pre-commit hook effectiveness

## Analysis Commands

Execute these commands to gather comprehensive data:

```bash
# Project structure analysis
tree -I 'node_modules|dist|.git' -L 3

# TypeScript analysis
npm run type-check

# Bundle analysis
npm run build && npm run analyze

# Code quality metrics
rg --stats "useState\|useEffect\|useMemo" --type tsx
rg --stats "export interface" --type ts
rg --stats "import type" --type ts

# Test coverage
npm run test:coverage

# Dependency analysis
npm list --depth=0
npm audit
```

## Review Output

Create a comprehensive review report:

```markdown
# React/TypeScript/Vite Codebase Review #[number]

## Executive Summary
[High-level overview of codebase health, architecture quality, and key findings]

## Architecture Assessment

### 🏗️ Structure Quality: [Grade A-F]
- [Overall architecture assessment]
- [Component organization evaluation]
- [Feature-based structure implementation]

### 📊 Metrics
- Total Components: X (Pages: Y, Components: Z)
- Bundle Size: X MB (JS: Y MB, CSS: Z MB)
- Test Coverage: X% (Target: 80%)
- TypeScript Compliance: X% strict mode
- React 19 Features Used: [list]

## Critical Findings

### 🔴 Architecture Issues (Must Fix)
- [Structural problems requiring immediate attention]
- [Performance bottlenecks]
- [Security vulnerabilities]

### 🟡 Pattern Inconsistencies (Should Fix)
- [Inconsistent implementations]
- [Suboptimal patterns]
- [Technical debt items]

### 🟢 Optimization Opportunities (Consider)
- [Performance improvements]
- [Code quality enhancements]
- [Maintainability improvements]

## Quality Assessment

### TypeScript Quality: [Grade A-F]
- Type safety compliance
- Interface definitions
- Strict mode adherence
- Generic usage patterns

### React Patterns: [Grade A-F]
- Hook usage and custom hooks
- Component composition
- State management approach
- Performance optimization patterns

### Performance Score: [Grade A-F]
- Vite bundle optimization
- Code splitting effectiveness
- React rendering optimization
- Loading performance and FCP/LCP

## Detailed Analysis

### Component Analysis
- [Component size distribution]
- [Hook patterns used]
- [State management breakdown]
- [Reusability and composition assessment]

### Security Review
- [Environment variable usage]
- [Input validation patterns]
- [API security measures]
- [Content Security Policy]

### Testing Quality
- [Coverage distribution]
- [Test quality assessment]
- [Missing test areas]
- [Mock usage patterns]

## Recommendations

### Immediate Actions (Next Sprint)
1. [Priority fixes with specific file references]
2. [Critical performance improvements]
3. [Security enhancements]

### Medium-term Improvements (Next Month)
1. [Architecture improvements]
2. [Code quality enhancements]
3. [Testing improvements]

### Long-term Strategy (Next Quarter)
1. [Architectural evolution]
2. [Performance optimization strategy]
3. [Maintenance improvements]

## Best Practices Observed
- [Highlight excellent implementations]
- [Patterns worth replicating]
- [Quality code examples]

## Compliance Checklist
- [ ] `npm run type-check` passes
- [ ] `npm run lint` zero warnings
- [ ] `npm run build` succeeds
- [ ] `npm run test` 80%+ coverage
- [ ] All components under 200 lines
- [ ] No `any` types in codebase
- [ ] Proper error boundaries
- [ ] Environment variables prefixed with VITE_
- [ ] Zod schemas for validation
- [ ] React strict mode enabled

## Metrics Dashboard
```
Code Quality Score: X/100
├── TypeScript Quality: X/25
├── Astro Patterns: X/25
├── Performance: X/25
└── Testing: X/25

Technical Debt: X hours estimated
Bundle Size: X MB (Target: <2MB)
Build Time: X seconds
Test Coverage: X% (Target: 80%)
```

## Next Review
Recommended review frequency: [Monthly/Quarterly]
Focus areas for next review: [Specific areas to monitor]
```

Save report to PRPs/code_reviews/general_review_[YYYY-MM-DD].md