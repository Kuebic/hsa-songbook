name: "Reusable Form Components with ShadCN UI Integration"
description: |
  Create a comprehensive, accessible, and reusable form component library in src/shared/components
  that integrates ShadCN UI elements while maintaining compatibility with the existing custom 
  validation system. This will provide a unified form solution for the entire application.

---

## Goal

**Feature Goal**: Create a flexible, type-safe, and accessible form component library that bridges the existing custom validation system with modern ShadCN UI components, enabling rapid form development across the application.

**Deliverable**: A complete form component library in `src/shared/components/form/` with ShadCN UI integration, full TypeScript support, accessibility compliance, and seamless integration with the existing Zod validation system.

**Success Definition**: 
- All form components are fully accessible (WCAG 2.1 AA compliant)
- Components integrate seamlessly with existing `useValidation` hook
- Full TypeScript type safety with Zod schema inference
- Components are reusable across all features (songs, setlists, auth, etc.)
- Consistent styling that matches existing design patterns
- All components have comprehensive unit tests

## User Persona

**Target User**: Frontend developers building forms in the HSA Songbook application

**Use Case**: Developers need to quickly create consistent, accessible, and validated forms for various features (song creation, setlist management, user settings) without reimplementing form logic each time.

**User Journey**: 
1. Developer imports form components from shared library
2. Defines Zod schema for validation
3. Composes form using provided components
4. Form automatically handles validation, accessibility, and styling
5. Developer focuses on business logic rather than form mechanics

**Pain Points Addressed**:
- Inconsistent form implementations across features
- Repetitive validation and error handling code
- Accessibility requirements often missed
- Lack of reusable form patterns
- Manual styling for each form field

## Why

- **Consistency**: Unified form experience across the entire application
- **Developer Velocity**: Reduce form development time by 70% with pre-built components
- **Accessibility**: Ensure all forms meet WCAG 2.1 AA standards out of the box
- **Maintainability**: Centralized form logic reduces bugs and simplifies updates
- **Type Safety**: Full TypeScript integration prevents runtime errors
- **User Experience**: Consistent validation, error messaging, and interactions

## What

Create a comprehensive form component library that:
- Provides all common form input types (text, textarea, select, checkbox, radio)
- Integrates with existing `useValidation` hook and Zod schemas
- Implements full keyboard navigation and screen reader support
- Maintains visual consistency with existing components
- Supports both controlled and uncontrolled patterns
- Includes form layout components for consistent spacing

### Success Criteria

- [ ] All form components render correctly with proper styling
- [ ] Validation integrates with existing `useValidation` hook
- [ ] Error messages display inline with proper ARIA associations
- [ ] Keyboard navigation works throughout all form components
- [ ] Components are fully typed with TypeScript
- [ ] All components have >90% test coverage
- [ ] Forms are accessible via screen readers
- [ ] Components work in both light and dark themes

## All Needed Context

### Context Completeness Check

_This PRP contains all necessary context for implementation including existing patterns, integration points, styling conventions, validation systems, and accessibility requirements._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://ui.shadcn.com/docs/components/form
  why: Core ShadCN form component documentation - understand structure and patterns
  critical: Form, FormField, FormItem, FormLabel, FormControl, FormMessage components

- url: https://ui.shadcn.com/docs/installation/vite
  why: Vite-specific ShadCN setup instructions for this project
  critical: Path alias configuration, Tailwind setup for Vite

- url: https://react-hook-form.com/get-started#IntegratingwithUIlibraries
  why: React Hook Form integration patterns with UI libraries
  critical: Controller component usage, field registration patterns

- url: https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html
  why: WCAG 2.1 AA compliance for form labels and instructions
  critical: Proper label association, required field indication

- file: src/shared/validation/hooks.ts
  why: Existing validation system that must be integrated with new components
  pattern: useValidation hook with Zod schemas, validateField method
  gotcha: Custom validation system doesn't use React Hook Form - need adapter

- file: src/features/setlists/components/CreateSetlistForm.tsx
  why: Current form implementation pattern to maintain consistency
  pattern: Inline styles, error display, state management approach
  gotcha: Uses inline styles instead of CSS modules - maintain for consistency

- file: src/shared/validation/schemas.ts
  why: Existing Zod schemas that forms will use
  pattern: Schema definitions, validation messages
  gotcha: Frontend uses Zod 4.0.15, backend uses 3.22.4 - ensure compatibility

- file: package.json
  why: Check existing dependencies to avoid conflicts
  pattern: Current React version 19.1.0, TypeScript 5.8.3
  gotcha: No existing UI library dependencies - clean slate for ShadCN
```

### Current Codebase Structure

```bash
src/
├── shared/
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   ├── Layout.tsx
│   │   └── __tests__/
│   ├── validation/
│   │   ├── hooks.ts         # useValidation hook
│   │   ├── schemas.ts       # Zod schemas
│   │   ├── utils.ts         # sanitizeInput, etc.
│   │   └── index.ts
│   └── styles/
│       └── globals.css
├── features/
│   ├── songs/
│   ├── setlists/
│   │   └── components/
│   │       └── CreateSetlistForm.tsx  # Reference implementation
│   └── search/
```

### Desired Codebase Structure

```bash
src/
├── shared/
│   ├── components/
│   │   ├── form/                    # NEW: Form component library
│   │   │   ├── index.ts            # Public API exports
│   │   │   ├── Form.tsx            # Root form wrapper component
│   │   │   ├── FormField.tsx       # Field wrapper with validation
│   │   │   ├── FormInput.tsx       # Text input component
│   │   │   ├── FormTextarea.tsx    # Textarea component
│   │   │   ├── FormSelect.tsx      # Select dropdown component
│   │   │   ├── FormCheckbox.tsx    # Checkbox component
│   │   │   ├── FormRadioGroup.tsx  # Radio group component
│   │   │   ├── FormLabel.tsx       # Accessible label component
│   │   │   ├── FormError.tsx       # Error message component
│   │   │   ├── FormHelperText.tsx  # Helper text component
│   │   │   ├── FormButton.tsx      # Submit/cancel buttons
│   │   │   ├── FormSection.tsx     # Form section wrapper
│   │   │   ├── hooks/
│   │   │   │   ├── useFormField.ts # Field state management
│   │   │   │   └── useFormContext.ts # Form context hook
│   │   │   ├── utils/
│   │   │   │   ├── validation-adapter.ts # Bridge to useValidation
│   │   │   │   └── aria-helpers.ts      # ARIA attribute helpers
│   │   │   └── __tests__/
│   │   │       ├── Form.test.tsx
│   │   │       ├── FormField.test.tsx
│   │   │       └── ...
│   │   └── ...existing components
│   └── ...existing folders
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: React 19.1 - Some testing libraries may have compatibility issues
// Solution: Use @testing-library/react v16.3.0 which supports React 19

// CRITICAL: Custom validation system vs React Hook Form
// The codebase uses a custom useValidation hook, not React Hook Form
// Need to create an adapter layer to bridge ShadCN's RHF expectation

// CRITICAL: Inline styles are the current pattern
// Maintain inline styles for consistency, even though ShadCN uses Tailwind
// Create a style mapping utility to convert Tailwind classes to inline styles

// CRITICAL: Zod version mismatch between frontend (4.0.15) and backend (3.22.4)
// Ensure schemas work with both versions - test thoroughly

// CRITICAL: No existing Tailwind setup
// ShadCN requires Tailwind - need to add it without breaking existing styles
// Scope Tailwind to only affect form components initially
```

## Implementation Blueprint

### Data Models and Structure

Create the core type definitions and interfaces for the form system:

```typescript
// src/shared/components/form/types.ts
import { z } from 'zod'
import { UseValidationReturn } from '@shared/validation/hooks'

// Core form field types
export type FormFieldValue = string | number | boolean | Date | undefined

export interface FormFieldProps {
  name: string
  label?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

export interface FormContextValue<T = any> {
  validation: UseValidationReturn<T>
  values: Record<string, FormFieldValue>
  setFieldValue: (name: string, value: FormFieldValue) => void
  errors: Record<string, string>
  touched: Record<string, boolean>
  setFieldTouched: (name: string) => void
}

// Validation adapter interface
export interface ValidationAdapter<T> {
  schema: z.ZodSchema<T>
  validation: UseValidationReturn<T>
  values: T
  onSubmit: (data: T) => void | Promise<void>
}

// Style mapping for Tailwind to inline styles
export interface StyleMapping {
  base: React.CSSProperties
  focus: React.CSSProperties
  error: React.CSSProperties
  disabled: React.CSSProperties
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: SETUP Tailwind CSS configuration for form components only
  - INSTALL: tailwindcss @tailwindcss/vite tailwind-merge clsx
  - CREATE: src/shared/components/form/styles/tailwind.css (scoped styles)
  - CONFIGURE: tailwind.config.js with custom prefix 'form-' to avoid conflicts
  - FOLLOW pattern: vite.config.ts for plugin integration
  - CRITICAL: Scope Tailwind to only .form-root class to prevent style bleeding
  - PLACEMENT: Form-specific styles in src/shared/components/form/styles/

Task 2: CREATE src/shared/components/form/utils/validation-adapter.ts
  - IMPLEMENT: Bridge between useValidation hook and form components
  - CREATE: createFormAdapter function that wraps useValidation
  - FOLLOW pattern: src/shared/validation/hooks.ts (validation interface)
  - NAMING: Keep consistent with existing validation naming
  - CRITICAL: Must maintain compatibility with existing validation system
  - PLACEMENT: Utility layer in form/utils/

Task 3: CREATE src/shared/components/form/utils/style-converter.ts
  - IMPLEMENT: Tailwind class to inline style converter
  - CREATE: getFormStyles function that maps design tokens
  - FOLLOW pattern: src/features/setlists/components/CreateSetlistForm.tsx (inline styles)
  - STYLES: Match existing color palette (#e2e8f0 border, #ef4444 error, etc.)
  - CRITICAL: Maintain consistency with existing component styling
  - PLACEMENT: Style utilities in form/utils/

Task 4: CREATE src/shared/components/form/context/FormContext.tsx
  - IMPLEMENT: React Context for form state management
  - CREATE: FormProvider component and useFormContext hook
  - DEPENDENCIES: Import validation adapter from Task 2
  - PATTERN: Standard React Context pattern with TypeScript generics
  - CRITICAL: Support both controlled and uncontrolled components
  - PLACEMENT: Context providers in form/context/

Task 5: CREATE src/shared/components/form/Form.tsx
  - IMPLEMENT: Root form wrapper component
  - INTEGRATE: FormProvider from Task 4
  - FOLLOW pattern: Semantic HTML form element with ARIA attributes
  - ACCESSIBILITY: role="form", aria-label, aria-describedby
  - DEPENDENCIES: Import FormContext and validation adapter
  - PLACEMENT: Root component in form/

Task 6: CREATE src/shared/components/form/FormField.tsx
  - IMPLEMENT: Field wrapper that handles validation and state
  - INTEGRATE: useFormContext for state management
  - FOLLOW pattern: src/features/setlists/components/CreateSetlistForm.tsx (field structure)
  - ACCESSIBILITY: Proper label association, aria-invalid, aria-describedby
  - CRITICAL: Handle both onChange and onBlur validation
  - PLACEMENT: Core component in form/

Task 7: CREATE src/shared/components/form/FormInput.tsx
  - IMPLEMENT: Text input component with full accessibility
  - INTEGRATE: FormField wrapper from Task 6
  - FOLLOW pattern: Existing input styling from CreateSetlistForm
  - STYLES: Border colors, padding, focus states from style converter
  - ACCESSIBILITY: aria-required, aria-invalid, aria-describedby
  - PLACEMENT: Input component in form/

Task 8: CREATE src/shared/components/form/FormTextarea.tsx
  - IMPLEMENT: Textarea component with auto-resize option
  - FOLLOW pattern: CreateSetlistForm textarea implementation
  - STYLES: Match existing textarea styling (minHeight: 80px, resize: vertical)
  - ACCESSIBILITY: Same as FormInput
  - PLACEMENT: Input component in form/

Task 9: CREATE src/shared/components/form/FormSelect.tsx
  - IMPLEMENT: Accessible select dropdown component
  - CREATE: Custom dropdown with keyboard navigation
  - ACCESSIBILITY: Role="combobox", aria-expanded, aria-controls
  - KEYBOARD: Arrow keys navigation, Enter to select, Escape to close
  - PLACEMENT: Input component in form/

Task 10: CREATE src/shared/components/form/FormCheckbox.tsx & FormRadioGroup.tsx
  - IMPLEMENT: Checkbox and radio button components
  - ACCESSIBILITY: Proper role attributes, keyboard navigation
  - KEYBOARD: Space to toggle checkbox, arrows for radio navigation
  - STYLES: Custom checkbox/radio styles matching theme
  - PLACEMENT: Input components in form/

Task 11: CREATE src/shared/components/form/FormError.tsx & FormHelperText.tsx
  - IMPLEMENT: Error message and helper text components
  - FOLLOW pattern: Error display from CreateSetlistForm
  - ACCESSIBILITY: role="alert" for errors, aria-live regions
  - STYLES: #ef4444 for errors, #64748b for helper text
  - PLACEMENT: Support components in form/

Task 12: CREATE src/shared/components/form/__tests__/*.test.tsx
  - IMPLEMENT: Comprehensive unit tests for all components
  - FOLLOW pattern: src/shared/components/__tests__/Layout.test.tsx
  - COVERAGE: Rendering, validation, accessibility, keyboard navigation
  - TOOLS: @testing-library/react, vitest
  - CRITICAL: Test React 19 compatibility
  - PLACEMENT: Test files alongside components

Task 13: CREATE src/shared/components/form/examples/SongForm.example.tsx
  - IMPLEMENT: Example form using all components
  - DEMONSTRATE: Integration with existing song validation schemas
  - FOLLOW pattern: Real-world usage patterns
  - DOCUMENTATION: Inline comments explaining usage
  - PLACEMENT: Examples folder for reference

Task 14: UPDATE src/shared/components/index.ts
  - EXPORT: All form components for easy importing
  - MAINTAIN: Existing component exports
  - ADD: Named exports for each form component
  - PATTERN: export * from './form'
  - PLACEMENT: Shared components barrel export
```

### Implementation Patterns & Key Details

```typescript
// Validation Adapter Pattern - Bridge custom validation to form components
// src/shared/components/form/utils/validation-adapter.ts
import { useValidation } from '@shared/validation/hooks'
import { z } from 'zod'

export function createFormAdapter<T>(schema: z.ZodSchema<T>) {
  const validation = useValidation(schema)
  
  return {
    validate: validation.validate,
    validateField: (name: string, value: unknown) => {
      // CRITICAL: Map field names to validation paths
      return validation.validateField(name, value)
    },
    errors: validation.errors,
    clearErrors: validation.clearErrors,
    clearFieldError: validation.clearFieldError,
    isValid: validation.isValid
  }
}

// Style Converter Pattern - Tailwind classes to inline styles
// src/shared/components/form/utils/style-converter.ts
export const formStyles = {
  input: {
    base: {
      width: '100%',
      padding: '0.5rem',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
      fontSize: '1rem',
      transition: 'border-color 0.2s'
    },
    focus: {
      borderColor: '#3b82f6',
      outline: 'none'
    },
    error: {
      borderColor: '#ef4444'
    },
    disabled: {
      backgroundColor: '#f8fafc',
      cursor: 'not-allowed',
      opacity: 0.6
    }
  }
}

// Form Field Pattern with Accessibility
// src/shared/components/form/FormField.tsx
export function FormField({ name, label, required, children }: FormFieldProps) {
  const { errors, touched, validateField, setFieldTouched } = useFormContext()
  const fieldId = useId()
  const errorId = `${fieldId}-error`
  const helperId = `${fieldId}-helper`
  
  const hasError = touched[name] && errors[name]
  
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label 
          htmlFor={fieldId}
          style={{ 
            display: 'block',
            marginBottom: '0.25rem',
            fontWeight: 500
          }}
        >
          {label}
          {required && <span aria-label="required" style={{ color: '#ef4444' }}> *</span>}
        </label>
      )}
      
      {React.cloneElement(children, {
        id: fieldId,
        'aria-invalid': hasError ? 'true' : undefined,
        'aria-describedby': [
          hasError && errorId,
          helperText && helperId
        ].filter(Boolean).join(' ') || undefined,
        'aria-required': required || undefined,
        onBlur: () => {
          setFieldTouched(name)
          validateField(name, value)
        }
      })}
      
      {hasError && (
        <div 
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{ 
            color: '#ef4444',
            fontSize: '0.875rem',
            marginTop: '0.25rem'
          }}
        >
          {errors[name]}
        </div>
      )}
    </div>
  )
}

// Keyboard Navigation Pattern for Custom Select
// src/shared/components/form/FormSelect.tsx
export function FormSelect({ options, value, onChange }: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setFocusedIndex(prev => Math.min(prev + 1, options.length - 1))
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (isOpen) {
          onChange(options[focusedIndex].value)
          setIsOpen(false)
        } else {
          setIsOpen(true)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
    }
  }
  
  // CRITICAL: Implement proper ARIA attributes for screen readers
  return (
    <div role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
      {/* Implementation details */}
    </div>
  )
}
```

### Integration Points

```yaml
DEPENDENCIES:
  - add to: package.json
  - packages: |
      "tailwindcss": "^3.4.0",
      "@tailwindcss/vite": "^3.4.0",
      "tailwind-merge": "^2.2.0",
      "clsx": "^2.1.0"
  - devDependencies: |
      "@types/react": "^19.1.8" (existing)

CONFIG:
  - create: tailwind.config.js
  - pattern: |
      module.exports = {
        prefix: 'form-',
        content: ['./src/shared/components/form/**/*.{ts,tsx}'],
        theme: {
          extend: {
            colors: {
              border: '#e2e8f0',
              error: '#ef4444',
              focus: '#3b82f6'
            }
          }
        }
      }

VITE:
  - modify: vite.config.ts
  - add: Import Tailwind plugin for Vite
  - pattern: Follow existing plugin configuration

EXPORTS:
  - modify: src/shared/components/index.ts
  - add: export * from './form'
  - maintain: Existing exports
```

## Validation Loop

### Level 1: Syntax & Type Checking

```bash
# After each component creation
npm run lint                          # ESLint check
npx tsc --noEmit                      # TypeScript validation

# Specific file checks
npx eslint src/shared/components/form/*.tsx --fix
npx tsc --noEmit src/shared/components/form/*.tsx

# Expected: Zero errors, all types properly inferred
```

### Level 2: Unit Tests

```bash
# Run tests for form components
npm test -- src/shared/components/form

# Run with coverage
npm run test:coverage -- src/shared/components/form

# Test accessibility specifically
npm test -- src/shared/components/form --grep "accessibility"

# Expected: All tests pass, >90% coverage
```

### Level 3: Integration Testing

```bash
# Start dev server
npm run dev

# Create test page that uses form components
# Navigate to http://localhost:5173/test-form

# Test keyboard navigation
# Tab through all fields
# Use arrow keys in select/radio
# Press Escape to close dropdowns

# Test screen reader (using NVDA or macOS VoiceOver)
# Verify all labels are announced
# Verify errors are announced
# Verify required fields are indicated

# Test validation
# Submit empty required fields
# Enter invalid data
# Verify error messages appear and are associated

# Expected: Full keyboard navigation, proper screen reader announcements
```

### Level 4: Visual & Performance Testing

```bash
# Visual regression testing
npm run test -- src/shared/components/form --ui

# Bundle size check
npm run build
# Check that form components don't significantly increase bundle

# Performance testing
# Render form with 50+ fields
# Verify no lag in typing or validation

# Cross-browser testing
# Test in Chrome, Firefox, Safari, Edge
# Verify consistent behavior

# Mobile testing
# Test touch interactions
# Verify responsive layout
# Test virtual keyboard behavior

# Expected: Consistent visuals, <50ms input lag, <200kb component bundle
```

## Final Validation Checklist

### Technical Validation

- [ ] All TypeScript types properly inferred from Zod schemas
- [ ] Zero ESLint errors or warnings
- [ ] All unit tests passing with >90% coverage
- [ ] Integration with existing useValidation hook working
- [ ] No console errors or warnings in development
- [ ] Bundle size increase <200kb

### Accessibility Validation

- [ ] All form fields have associated labels
- [ ] Error messages properly associated with fields
- [ ] Full keyboard navigation working
- [ ] Screen reader testing passed
- [ ] Focus indicators visible and meet contrast requirements
- [ ] Required fields properly indicated
- [ ] ARIA attributes correctly applied

### Feature Validation

- [ ] All input types implemented (text, textarea, select, checkbox, radio)
- [ ] Validation works on blur and submit
- [ ] Error messages display correctly
- [ ] Forms can be submitted when valid
- [ ] Form reset functionality working
- [ ] Helper text displays properly

### Integration Validation

- [ ] Works with existing Zod schemas
- [ ] Maintains existing visual design
- [ ] No conflicts with existing styles
- [ ] Can be used in songs and setlists features
- [ ] TypeScript autocomplete working
- [ ] Import paths resolve correctly

### Code Quality Validation

- [ ] Follows existing code patterns
- [ ] Consistent naming conventions
- [ ] Proper file organization
- [ ] Comments where necessary
- [ ] No duplicate code
- [ ] Reusable and composable

---

## Anti-Patterns to Avoid

- ❌ Don't break existing validation system - enhance it
- ❌ Don't use React Hook Form directly - use validation adapter
- ❌ Don't let Tailwind styles leak outside form components
- ❌ Don't skip accessibility attributes
- ❌ Don't hardcode colors - use design tokens
- ❌ Don't create forms without proper keyboard navigation
- ❌ Don't ignore React 19 compatibility issues
- ❌ Don't mix CSS modules with inline styles inconsistently

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success

**Why High Confidence**:
- Comprehensive research of existing patterns
- Clear integration strategy with current validation system
- Detailed accessibility requirements
- Specific style values from existing components
- Thorough testing strategy
- Clear file structure and naming conventions

**Risk Mitigation**:
- Tailwind scoping prevents style conflicts
- Validation adapter maintains backward compatibility
- Extensive testing catches integration issues early
- Progressive implementation allows validation at each step