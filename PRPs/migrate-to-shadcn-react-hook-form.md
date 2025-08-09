name: "HSA Songbook Form Infrastructure Migration - Custom Forms to ShadCN + React Hook Form"
description: |
  Complete migration from custom form handling to modern ShadCN + React Hook Form architecture while preserving existing functionality and vertical slice architecture.

---

## Goal

**Feature Goal**: Replace the current custom form infrastructure (24 components, 2,850+ lines) with ShadCN + React Hook Form to improve developer experience, reduce boilerplate by 60%, and enhance form performance while maintaining all existing functionality and accessibility standards.

**Deliverable**: Modernized form infrastructure with React Hook Form + Zod validation, enhanced developer experience, improved performance, and maintained accessibility compliance across all feature slices.

**Success Definition**: 
- All forms (songs, setlists, search, admin) migrated to React Hook Form
- Zero functional regressions in form behavior
- 60% reduction in form handling boilerplate code  
- Maintained 70%+ test coverage across all form components
- Zero accessibility violations (maintained WCAG 2.1 AA compliance)
- Performance improvement: <100ms form interaction time (vs current <150ms)

## User Persona

**Target User**: HSA Songbook developers and form maintainers

**Use Case**: Developers need to create, modify, and maintain forms across the application with reduced complexity and improved patterns

**User Journey**: 
1. Developer needs to create/modify a form component
2. Uses modern React Hook Form + ShadCN patterns instead of manual state management
3. Benefits from automatic validation, better TypeScript support, and reduced boilerplate
4. Maintains existing UX and accessibility standards

**Pain Points Addressed**: 
- Manual state management complexity (formData, errors, touched state)
- Repetitive validation logic and error handling
- Poor TypeScript integration and type inference
- Performance issues with multiple re-renders
- Inconsistent form patterns across the codebase

## Why

- **Developer Experience**: Reduce form development time by 60% through modern patterns and reduced boilerplate
- **Performance**: Minimize re-renders with React Hook Form's uncontrolled components approach  
- **Maintainability**: Standardize on industry-standard form handling patterns
- **Type Safety**: Improved TypeScript integration with automatic type inference from Zod schemas
- **Accessibility**: Leverage ShadCN's built-in accessibility features while preserving existing standards
- **Future-Proofing**: Align with modern React ecosystem best practices and maintainable patterns

## What

Transform the HSA Songbook form infrastructure from custom manual state management to modern React Hook Form + ShadCN patterns while preserving all existing functionality, user experience, and architectural boundaries.

### Current State Analysis

**Existing Form Infrastructure:**
- **Custom FormProvider**: Manual state management with custom validation integration
- **24 Form Components**: Complex component hierarchy with manual prop management  
- **Manual Validation**: Custom `useValidation` hook with Zod schema parsing
- **Performance Issues**: Multiple re-renders due to manual state synchronization
- **Mixed Patterns**: 3 different form approaches across the codebase

**Key Files Currently:**
```
/src/shared/components/form/          # 24 components, 2,850+ lines
/src/features/songs/components/forms/ # Primary complex forms (SongForm: 244 lines)
/src/features/songs/validation/       # Sophisticated Zod schemas (331 lines)
/src/features/setlists/components/    # Simple forms for comparison
```

### Target Architecture

**Modern ShadCN + React Hook Form Infrastructure:**
- **React Hook Form**: Industry-standard form state management
- **ShadCN Components**: Accessible, composable form primitives  
- **Zod Integration**: Direct schema integration via `@hookform/resolvers/zod`
- **TypeScript-First**: Complete type inference with `z.infer<typeof schema>`
- **Performance-Optimized**: Minimal re-renders through uncontrolled components

### Success Criteria

- [ ] All 24 form components migrated to React Hook Form patterns
- [ ] SongForm (244 lines) successfully migrated with full functionality preservation
- [ ] ThemeCombobox (251 lines) complex component successfully integrated
- [ ] Real-time duplicate detection maintained and integrated with React Hook Form
- [ ] All existing Zod schemas (songFormSchema: 331 lines) work with zodResolver
- [ ] Zero accessibility regressions (maintain WCAG 2.1 AA compliance)
- [ ] 70%+ test coverage maintained across all migrated components
- [ ] Performance improvement: <100ms form interaction response time
- [ ] 60% reduction in form handling boilerplate code
- [ ] Complete migration with zero breaking changes to public APIs

## All Needed Context

### Context Completeness Check

_This PRP provides comprehensive context including current infrastructure analysis, migration challenges, implementation patterns, testing strategies, and risk mitigation. All necessary context for successful one-pass implementation is included._

### Documentation & References

```yaml
# MUST READ - ShadCN + React Hook Form Implementation
- url: https://ui.shadcn.com/docs/components/form
  why: Complete ShadCN form component architecture and composition patterns
  critical: FormField -> FormItem -> FormLabel/FormControl/FormMessage hierarchy

- url: https://react-hook-form.com/docs/useform
  why: useForm hook configuration, validation modes, and performance optimization
  critical: Controller component usage for custom fields, watch() for real-time updates

- url: https://github.com/react-hook-form/resolvers/tree/master/zod
  why: Zod resolver integration patterns and type inference
  critical: zodResolver configuration and error message customization

- file: /src/shared/components/form/Form.tsx
  why: Current FormProvider implementation to understand migration complexity
  pattern: Custom validation integration and context management patterns
  gotcha: Manual state synchronization that React Hook Form eliminates

- file: /src/features/songs/components/forms/SongForm.tsx
  why: Most complex form (244 lines) - primary migration target
  pattern: Multi-section form with complex state management and validation
  gotcha: Real-time duplicate detection integration and arrangement form modal

- file: /src/features/songs/validation/schemas/songFormSchema.ts
  why: Sophisticated Zod schemas (331 lines) that must work with zodResolver
  pattern: Complex validation with transforms, refinements, and conditional logic
  gotcha: Theme normalization and duplicate validation custom logic

- file: /src/features/songs/components/forms/fields/ThemeCombobox.tsx
  why: Complex custom component (251 lines) with sophisticated UX patterns
  pattern: Multi-select with keyboard navigation and real-time suggestions
  gotcha: Complex state management that needs Controller component wrapping

- docfile: claude_md_files/shadcn-react-hook-form-implementation-guide.md
  why: Comprehensive 64-page implementation guide created during research
  section: Migration strategies, best practices, and gotchas for HSA Songbook
```

### Current Codebase Tree Analysis

```bash
src/
├── features/
│   ├── songs/                    # Primary form complexity - 80% of form usage
│   │   ├── components/forms/     # Main migration target
│   │   │   ├── SongForm.tsx      # 244 lines - complex multi-section form
│   │   │   ├── fields/           # Custom field components
│   │   │   │   ├── ThemeCombobox.tsx  # 251 lines - sophisticated UX
│   │   │   │   └── SourceSelect.tsx   # Dropdown with validation
│   │   │   ├── sections/         # Form sections for organization
│   │   │   │   ├── BasicInfoSection.tsx
│   │   │   │   ├── CategorizationSection.tsx
│   │   │   │   └── NotesSection.tsx
│   │   │   └── utils/
│   │   │       └── SimpleFormInputs.tsx  # 359 lines - form primitives
│   │   ├── validation/           # Sophisticated Zod integration
│   │   │   └── schemas/
│   │   │       ├── songFormSchema.ts    # 331 lines - complex validation
│   │   │       └── arrangementSchema.ts # Nested form schema
│   │   └── hooks/
│   │       ├── useSongFormSubmit.ts     # Form submission logic
│   │       └── useRealtimeDuplicateDetection.ts # Must integrate with RHF
│   ├── setlists/components/      # Simple forms - good migration starting point
│   │   └── CreateSetlistForm.tsx # 124 lines - 2 field form
│   ├── search/components/        # Input validation patterns
│   │   └── SearchBar.tsx         # 109 lines - search with validation
│   └── admin/components/         # Admin-specific forms
├── shared/
│   ├── components/form/          # 24 components, 2,850+ lines - MIGRATION TARGET
│   │   ├── Form.tsx              # 251 lines - FormProvider implementation
│   │   ├── FormField.tsx         # 117 lines - Field wrapper with validation
│   │   ├── FormInput.tsx         # 205 lines - Input variants
│   │   ├── context/              # Custom form context management
│   │   ├── hooks/                # Form state management hooks
│   │   └── utils/                # Validation adapters and utilities
│   └── validation/               # Shared validation utilities
│       ├── hooks.ts              # 126 lines - useValidation hook
│       └── schemas.ts            # Shared Zod schemas
```

### Vertical Slice Architecture Analysis

**Existing Feature Slices** (maintain these boundaries):
```yaml
src/features/songs/:           # Song management slice - OWNS most form complexity
  - types/song.types.ts        # Domain types - NO CHANGES
  - components/forms/          # Form components - MIGRATION TARGET  
  - hooks/                     # State and API hooks - INTEGRATION NEEDED
  - services/                  # API communication - NO CHANGES
  - validation/                # Zod schemas - DIRECT COMPATIBILITY
  - pages/                     # Route pages - MINIMAL CHANGES

src/features/setlists/:        # Setlist management slice
  - components/CreateSetlistForm.tsx  # Simple form - EASY MIGRATION

src/features/search/:          # Search functionality slice  
  - components/SearchBar.tsx   # Input validation - STRAIGHTFORWARD MIGRATION

src/shared/components/form/:   # Shared form infrastructure - COMPLETE REPLACEMENT
  - CURRENT: Custom FormProvider system
  - TARGET: ShadCN + React Hook Form components
```

**Feature Boundary Preservation**:
- **Songs Slice Maintains**: All song-specific form logic, validation schemas, custom fields
- **Shared Infrastructure**: Provides React Hook Form + ShadCN primitives only
- **Cross-Slice Dependencies**: Minimal - only shared form components from shared/
- **Migration Strategy**: Replace shared infrastructure, adapt feature-specific components

### Desired Codebase Tree Post-Migration

```bash
src/
├── features/
│   ├── songs/components/forms/   # Migrated to React Hook Form patterns
│   │   ├── SongForm.tsx          # Uses useForm + Controller components
│   │   ├── fields/
│   │   │   ├── ThemeCombobox.tsx # Wrapped with Controller component
│   │   │   └── SourceSelect.tsx  # Direct RHF integration
│   │   └── sections/             # Form sections using ShadCN components
│   ├── setlists/components/
│   │   └── CreateSetlistForm.tsx # Migrated to useForm + zodResolver
│   └── search/components/
│       └── SearchBar.tsx         # Simple RHF input with validation
├── shared/components/form/       # ShadCN + React Hook Form infrastructure
│   ├── Form.tsx                  # ShadCN Form wrapper component
│   ├── FormField.tsx             # ShadCN FormField component
│   ├── FormItem.tsx              # ShadCN FormItem component  
│   ├── FormLabel.tsx             # ShadCN FormLabel component
│   ├── FormControl.tsx           # ShadCN FormControl component
│   ├── FormDescription.tsx       # ShadCN FormDescription component
│   ├── FormMessage.tsx           # ShadCN FormMessage component
│   ├── ui/                       # ShadCN primitive components
│   │   ├── button.tsx            # Button component
│   │   ├── input.tsx             # Input component
│   │   ├── textarea.tsx          # Textarea component
│   │   ├── select.tsx            # Select component
│   │   └── checkbox.tsx          # Checkbox component
│   └── index.ts                  # Clean public API exports
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: React Hook Form Controller for custom components
// ThemeCombobox requires Controller wrapper for RHF integration
import { Controller, Control } from 'react-hook-form'

function ThemeComboboxField({ control, name }: { control: Control, name: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <ThemeCombobox
          value={field.value}
          onChange={field.onChange}
          error={fieldState.error?.message}
        />
      )}
    />
  )
}

// GOTCHA: Zod schema transforms work differently with zodResolver
// Current: Manual parsing in handleSubmit
// New: Automatic parsing via resolver - transforms happen automatically

// CRITICAL: Real-time validation integration pattern
// Current: Manual duplicate detection with useRealtimeDuplicateDetection
// New: Integration with watch() and validation cycle
const form = useForm({ resolver: zodResolver(songFormSchema) })
const title = form.watch('title')
const artist = form.watch('artist')
const { duplicates } = useRealtimeDuplicateDetection(title, artist, existingSongs)

// GOTCHA: Form submission patterns change significantly
// Current: Manual validation then onSubmit
const validateForm = () => { /* manual logic */ }
const handleSubmit = (e) => { 
  if (!validateForm()) return
  await onSubmit(formData)
}

// New: Automatic validation via handleSubmit
const onSubmit = (data: z.infer<typeof schema>) => {
  // Data is pre-validated and typed automatically
}
return <form onSubmit={form.handleSubmit(onSubmit)}>

// PERFORMANCE: React Hook Form minimizes re-renders
// Current: Every field change triggers form re-render
// New: Only affected fields re-render (major performance improvement)
```

## Implementation Blueprint

### Migration Strategy Overview

**CRITICAL**: This is an **INFRASTRUCTURE MIGRATION** that affects multiple feature slices. We use a **PHASED APPROACH** to minimize risk while maintaining vertical slice architecture boundaries.

**Migration Approach:**
1. **Foundation Phase**: Install dependencies, create ShadCN components
2. **Simple Migration**: Start with basic forms (setlists, search)  
3. **Complex Migration**: Migrate sophisticated forms (songs, arrangements)
4. **Integration Phase**: Custom component integration and testing
5. **Cleanup Phase**: Remove legacy infrastructure

### Pre-Migration Dependencies Installation

```bash
# Install React Hook Form and ShadCN dependencies
npm install react-hook-form @hookform/resolvers
npm install @radix-ui/react-label @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge lucide-react

# Install ShadCN CLI (if not already installed)
npx shadcn@latest init

# Add form components
npx shadcn@latest add form button input textarea select checkbox label
```

### Implementation Tasks (Ordered by Risk & Complexity)

```yaml
Task 1: CREATE shared/components/ui/ ShadCN base components
  - IMPLEMENT: Install and configure ShadCN form components
  - FOLLOW pattern: ShadCN installation guide and component configuration
  - DEPENDENCIES: Radix UI components, Tailwind CSS integration
  - PLACEMENT: src/shared/components/ui/
  - VALIDATION: npm run build && npm run lint (ensure no conflicts)

Task 2: CREATE shared/components/form/ React Hook Form adapters  
  - IMPLEMENT: Modern form wrapper components using ShadCN + RHF
  - FOLLOW pattern: ShadCN Form → FormField → FormItem composition
  - DEPENDENCIES: Task 1 components, React Hook Form integration
  - PLACEMENT: src/shared/components/form/ (replace existing)
  - SLICE BOUNDARY: Provide shared form infrastructure only

Task 3: MIGRATE features/setlists/components/CreateSetlistForm.tsx (EASY START)
  - IMPLEMENT: Simple 2-field form using useForm + zodResolver  
  - FOLLOW pattern: Basic React Hook Form integration with existing schema
  - DEPENDENCIES: Task 2 form components, existing setlist schema
  - VALIDATION FOCUS: Ensure existing behavior preserved
  - SLICE BOUNDARY: Keep setlist-specific logic within setlist feature

Task 4: MIGRATE features/search/components/SearchBar.tsx (SIMPLE VALIDATION)
  - IMPLEMENT: Search input with React Hook Form validation
  - FOLLOW pattern: Single-field form with debounced validation
  - DEPENDENCIES: Task 2 form components
  - COMPLEXITY: Low - single input field
  - SLICE BOUNDARY: Search feature maintains its own validation logic

Task 5: CREATE features/songs/components/forms/fields/ RHF-compatible components
  - IMPLEMENT: Controller wrappers for existing complex components
  - FOCUS: ThemeCombobox.tsx - most complex component (251 lines)
  - FOLLOW pattern: Controller component wrapping existing UI logic
  - DEPENDENCIES: React Hook Form Controller, existing field components  
  - SLICE BOUNDARY: Song-specific complex components stay in songs feature

Task 6: MIGRATE features/songs/components/forms/SongForm.tsx (MOST COMPLEX)
  - IMPLEMENT: Convert 244-line complex form to React Hook Form
  - FOLLOW pattern: useForm + Controller for custom fields + form sections
  - DEPENDENCIES: All previous tasks, complex Zod schema integration
  - CHALLENGES: Real-time duplicate detection, arrangement form integration
  - SLICE BOUNDARY: All song business logic remains in songs feature

Task 7: INTEGRATE real-time duplicate detection with React Hook Form
  - IMPLEMENT: useRealtimeDuplicateDetection with form.watch()
  - FOLLOW pattern: Watch title/artist fields, integrate validation results
  - DEPENDENCIES: Task 6 SongForm migration, existing duplicate detection hook
  - COMPLEXITY: High - requires understanding both systems
  - SLICE BOUNDARY: Duplicate detection stays in songs feature

Task 8: MIGRATE arrangement forms and modal integration
  - IMPLEMENT: SimpleArrangementForm with React Hook Form  
  - FOLLOW pattern: Nested form integration within SongForm modal
  - DEPENDENCIES: Task 6 base form migration
  - COMPLEXITY: Medium - nested form within form context
  - SLICE BOUNDARY: Arrangement logic stays within songs feature

Task 9: CREATE comprehensive test suite for migrated forms
  - IMPLEMENT: Test coverage for all migrated form components
  - FOLLOW pattern: React Testing Library + user-event with React Hook Form
  - DEPENDENCIES: All previous migration tasks completed
  - COVERAGE TARGET: Maintain 70%+ test coverage
  - SLICE BOUNDARY: Test each feature slice's forms independently

Task 10: CLEANUP legacy form infrastructure and documentation
  - IMPLEMENT: Remove old FormProvider system and unused components  
  - FOLLOW pattern: Clean removal with public API preservation
  - DEPENDENCIES: All migrations completed and validated
  - DOCUMENTATION: Update team documentation with new patterns
  - VALIDATION: Ensure no references to old form system remain
```

### Implementation Patterns & Key Details

```typescript
// PRIMARY PATTERN: ShadCN + React Hook Form Integration
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

// Schema integration (existing Zod schemas work directly)
const form = useForm<z.infer<typeof songFormSchema>>({
  resolver: zodResolver(songFormSchema),
  defaultValues: {
    title: '',
    artist: '',
    themes: [],
    // ... other fields
  }
})

// Complex component integration pattern (ThemeCombobox example)
<FormField
  control={form.control}
  name="themes"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Themes</FormLabel>
      <FormControl>
        <ThemeCombobox
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          disabled={field.disabled}
        />
      </FormControl>
      <FormDescription>Select themes that describe this song</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>

// Real-time validation integration pattern (duplicate detection)
function SongForm({ onSubmit, existingSongs }: SongFormProps) {
  const form = useForm<SongFormData>({
    resolver: zodResolver(songFormSchema),
    mode: 'onBlur', // Validate on blur for better UX
  })
  
  // Watch fields for real-time duplicate detection
  const title = form.watch('title')
  const artist = form.watch('artist')
  
  // Integrate existing duplicate detection
  const { duplicates, hasExactMatch } = useRealtimeDuplicateDetection(
    title || '',
    artist,
    existingSongs
  )
  
  // Submission with automatic validation
  const handleSubmit = (data: SongFormData) => {
    // Data is already validated by zodResolver
    // Type-safe and validated automatically
    onSubmit(data)
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Duplicate warning integration */}
        {hasExactMatch && (
          <DuplicateWarning duplicates={duplicates} />
        )}
        
        {/* Form fields using ShadCN components */}
        <FormField name="title" ... />
        <FormField name="artist" ... />
        {/* ... other fields */}
        
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save Song'}
        </Button>
      </form>
    </Form>
  )
}

// GOTCHA: Controller component for complex custom fields
import { Controller } from 'react-hook-form'

function ThemeComboboxField({ control, name }: { control: Control<any>, name: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>Themes</FormLabel>
          <FormControl>
            <ThemeCombobox
              {...field}
              error={fieldState.error?.message}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// PERFORMANCE: Optimized rendering with React Hook Form
// Current problem: Every field change re-renders entire form
// Solution: React Hook Form's uncontrolled components minimize re-renders
```

### Integration Points & Cross-Slice Dependencies

**CRITICAL: Maintain vertical slice architecture boundaries during migration**

```yaml
WITHIN EACH SLICE (Self-contained after migration):
  - Feature-specific form components use shared ShadCN infrastructure
  - Feature-specific validation schemas remain in feature slice
  - Feature-specific form submission logic stays in feature
  - Feature-specific custom fields remain in feature slice

SHARED INFRASTRUCTURE (Enhanced):
  - src/shared/components/ui/ - ShadCN primitive components
  - src/shared/components/form/ - React Hook Form + ShadCN wrappers
  - src/shared/utils/ - Generic form utilities (no change)

CROSS-SLICE DEPENDENCIES (Minimized):
  - Import only from shared/ infrastructure
  - No direct cross-feature form dependencies
  - Maintain existing public API contracts where possible

BACKEND INTEGRATION (No changes):
  - API routes unchanged - same data contracts
  - Form submission payloads identical
  - Validation occurs client-side with same Zod schemas
  - Database schemas unaffected

MIGRATION BOUNDARIES:
  - Songs feature: Complex forms with sophisticated validation
  - Setlists feature: Simple forms - good migration starting point
  - Search feature: Basic input validation
  - Shared: Infrastructure only - no business logic
```

## Validation Loop

### Level 1: Syntax & Style (After Each Task)

```bash
# Run after each component migration - fix before proceeding
npm run lint                    # ESLint with React Hook Form rules
npm run build                   # TypeScript compilation validation  
npm run type-check             # Full TypeScript checking

# Migration-specific validation
npm test -- --grep "form"     # Run form-related tests only
npm run test:coverage -- src/shared/components/form/  # Form component coverage

# Expected: Zero errors. Fix all issues before proceeding to next task.
```

### Level 2: Component Validation (After Each Form Migration)

```bash
# Test individual migrated components
npm test -- __tests__/SongForm.test.tsx
npm test -- __tests__/CreateSetlistForm.test.tsx
npm test -- __tests__/SearchBar.test.tsx

# Test form field components  
npm test -- components/forms/fields/
npm test -- shared/components/form/

# Accessibility validation
npm test -- --grep "accessibility|a11y"

# Expected: All tests pass, accessibility maintained, no functionality regressions
```

### Level 3: Integration Testing (After Major Migrations)

```bash
# Development server validation
npm run dev &
sleep 5  # Allow Vite startup

# Form functionality validation
curl -I http://localhost:5174/  # Ensure app loads
# Manual testing: Create song, edit song, create setlist, search functionality

# Form submission validation (if API available)
# Test that form submissions work with existing API endpoints
# Verify data contracts unchanged

# Production build validation  
npm run build && npm run preview
# Expected: Successful build, no TypeScript errors, forms work in production build
```

### Level 4: Migration-Specific Validation

```bash
# React Hook Form specific validation
npm test -- --grep "react-hook-form|RHF"

# Performance validation
npm run build && npm run analyze  # Bundle size analysis
# Expected: Bundle size increase <15% (React Hook Form overhead)

# Zod integration validation
npm test -- --grep "validation|zod"  # Test schema integration

# Vertical slice architecture validation
find src/features -name "*.ts" -o -name "*.tsx" | xargs grep -l "from.*shared/components/form" 
# Expected: All features import only from shared form infrastructure

# Accessibility compliance validation  
npm test -- --grep "axe|accessibility"
# Expected: Zero axe violations maintained

# Migration completeness validation
grep -r "FormProvider\|useValidation" src/features/
# Expected: No references to old form system after cleanup

# Performance regression testing
# Compare form interaction times: should be <100ms vs current <150ms
npm run test -- --grep "performance"

# Cross-browser compatibility validation (if available)
npm run test:browsers  # Run cross-browser tests
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully  
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run build`
- [ ] Production build succeeds: `npm run build && npm run preview`
- [ ] Bundle size impact <15%: `npm run analyze`

### Feature Validation

- [ ] SongForm (244 lines) migrated with full functionality preserved
- [ ] ThemeCombobox (251 lines) works with Controller component
- [ ] Real-time duplicate detection integrated with React Hook Form
- [ ] All Zod schemas work with zodResolver
- [ ] CreateSetlistForm and SearchBar migrated successfully
- [ ] Form submission data contracts unchanged
- [ ] All existing form UX patterns preserved

### Code Quality Validation

- [ ] Follows ShadCN + React Hook Form patterns consistently
- [ ] Vertical slice architecture boundaries maintained
- [ ] No direct cross-slice form dependencies created
- [ ] Complex custom components properly wrapped with Controller
- [ ] Performance improved: <100ms form interaction time
- [ ] 70%+ test coverage maintained across all form components
- [ ] Zero accessibility regressions: `npm test -- --grep "a11y"`

### Migration-Specific Validation

- [ ] All 24 legacy form components replaced or removed
- [ ] No references to old FormProvider system
- [ ] Team documentation updated with new patterns
- [ ] Development team trained on React Hook Form patterns
- [ ] Rollback procedures documented and tested
- [ ] A/B testing completed successfully (if implemented)

### Accessibility & UX Validation

- [ ] WCAG 2.1 AA compliance maintained: Zero axe violations
- [ ] Screen reader functionality preserved and enhanced
- [ ] Keyboard navigation works across all migrated forms
- [ ] Error messages announced properly to assistive technologies
- [ ] Focus management preserved in modals and complex flows

---

## Anti-Patterns to Avoid

**Migration-Specific Anti-Patterns:**
- ❌ Don't migrate all forms simultaneously - use phased approach to reduce risk
- ❌ Don't change form behavior during migration - preserve existing UX exactly
- ❌ Don't skip testing phases - each migration must be validated before proceeding
- ❌ Don't ignore performance implications - React Hook Form should improve performance
- ❌ Don't break existing API contracts - form submission data must remain identical

**React Hook Form Anti-Patterns:**
- ❌ Don't use useState for form data - let React Hook Form manage state
- ❌ Don't manually trigger validation - use built-in validation modes
- ❌ Don't forget Controller for complex custom components (ThemeCombobox)
- ❌ Don't ignore watch() performance implications - use sparingly for real-time features
- ❌ Don't mix controlled/uncontrolled patterns - stay consistent with RHF patterns

**Vertical Slice Architecture Anti-Patterns:**
- ❌ Don't move feature-specific form logic to shared infrastructure
- ❌ Don't create new cross-slice dependencies during migration
- ❌ Don't bypass feature public APIs when importing form components
- ❌ Don't put business logic in shared form components - keep them generic
- ❌ Don't break existing feature boundaries for migration convenience

**Quality & Testing Anti-Patterns:**
- ❌ Don't reduce test coverage during migration - maintain 70%+ coverage
- ❌ Don't ignore accessibility testing - run axe validation on all forms
- ❌ Don't skip performance validation - forms should be faster, not slower
- ❌ Don't deploy without thorough integration testing across all form types
- ❌ Don't ignore bundle size impact - monitor and optimize if needed

---

## Migration Timeline & Milestones

**Week 1-2: Foundation & Setup**
- Install dependencies and configure ShadCN
- Create shared form infrastructure  
- Migrate simple forms (setlists, search)
- **Milestone**: Basic forms working with React Hook Form

**Week 3-4: Complex Form Migration**
- Migrate SongForm main component
- Integrate ThemeCombobox and custom fields
- Real-time duplicate detection integration
- **Milestone**: Song forms fully functional

**Week 5-6: Integration & Testing**
- Arrangement forms and modal integration
- Comprehensive testing and validation
- Performance optimization and bundle analysis
- **Milestone**: All forms migrated and tested

**Week 7-8: Cleanup & Documentation**
- Remove legacy form infrastructure
- Team training and documentation
- Final validation and deployment preparation
- **Milestone**: Complete migration with team ready

**Quality Score: 8/10** - Comprehensive context, clear implementation path, executable validation gates, phased approach reduces risk, preserves architecture boundaries.