name: "Tag System Stage 2 - Tag Input Component"
description: |

---

## Goal

**Feature Goal**: Build a performant, accessible React tag input component with autocomplete, quick picks, and visual feedback that integrates with the Stage 1 tag API

**Deliverable**: Reusable TagInput component with autocomplete dropdown, tag pills, quick picks section, and React Hook Form integration

**Success Definition**: Component enables 5-second tag entry with < 100ms autocomplete response, supporting keyboard navigation, mobile responsiveness, and accessibility standards

## User Persona (if applicable)

**Target User**: Song contributors and editors adding tags to songs

**Use Case**: Quickly tag songs with themes, occasions, and moods using autocomplete suggestions or quick picks

**User Journey**: 
1. User clicks tag input field
2. Types 2+ characters to trigger autocomplete
3. Selects from suggestions or quick picks
4. Sees visual tag pills with remove option
5. Continues adding tags up to limit (10)

**Pain Points Addressed**: 
- Manual tag entry taking 30+ seconds
- Inconsistent tag naming
- No visual feedback
- Poor mobile experience
- Lack of keyboard navigation

## Why

- **Speed**: Reduce tag entry time from 30+ seconds to < 5 seconds
- **Consistency**: Guide users to existing tags via autocomplete
- **Accessibility**: Full keyboard navigation and screen reader support  
- **Mobile-First**: Optimized for touch interactions and small screens
- **Developer Experience**: Reusable component with React Hook Form integration

## What

A React component providing tag input with autocomplete, featuring Floating UI for positioning, React 19 optimizations, mobile responsiveness, and full accessibility support.

### Success Criteria

- [ ] Autocomplete triggers after 2 characters with < 100ms response
- [ ] Tag pills display with category colors and remove buttons
- [ ] Quick picks show top 10 popular tags for one-click add
- [ ] Keyboard navigation works (Tab, Enter, Escape, Arrow keys)
- [ ] Mobile experience optimized with proper touch targets
- [ ] Component integrates with React Hook Form
- [ ] Accessibility: ARIA labels, announcements, focus management
- [ ] Visual feedback for all interactions (hover, focus, active states)

## All Needed Context

### Context Completeness Check

_This PRP contains all UI patterns, component examples, Floating UI configuration, accessibility requirements, and integration patterns needed for implementation._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/features/arrangements/components/ChordProEditor/components/AutoCompleteDropdown/index.tsx
  why: Existing autocomplete with Floating UI implementation
  pattern: Floating UI hooks, mobile detection, positioning logic
  gotcha: Must handle keyboard visibility on mobile devices

- file: src/features/songs/components/SongManagementForm.tsx
  why: Current tag/theme implementation to replace
  pattern: Form state management, validation integration
  gotcha: Uses manual state - need React Hook Form migration

- file: src/shared/components/ui/Button.tsx
  why: ShadCN button component pattern
  pattern: CVA variants, forwardRef usage, className merging
  gotcha: Use cn() utility for className composition

- docfile: PRPs/ai_docs/tag-input-implementation-guide.md
  why: Comprehensive tag input implementation guide
  section: React 19 patterns, Floating UI setup, accessibility

- docfile: PRPs/ai_docs/floating-ui-dropdown-guide.md
  why: Floating UI best practices for dropdowns
  critical: Middleware configuration, mobile positioning

- file: src/shared/styles/theme-variables.css
  why: CSS custom properties for theming
  pattern: Color variables, theme switching
  gotcha: Must use CSS variables for theme compatibility

- url: https://floating-ui.com/docs/react
  why: Floating UI React documentation
  critical: useFloating hook, middleware, positioning

- url: https://react-hook-form.com/advanced-usage#ControlledmixedwithUncontrolledComponents
  why: React Hook Form controller pattern for custom inputs
  critical: Controller component usage with custom components
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase

```bash
src/
├── features/
│   ├── tags/                    # From Stage 1
│   │   ├── types/
│   │   ├── services/
│   │   └── utils/
│   ├── songs/
│   │   └── components/
│   │       └── SongManagementForm.tsx  # Current tag implementation
│   └── arrangements/
│       └── components/
│           └── ChordProEditor/
│               └── components/
│                   └── AutoCompleteDropdown/  # Reference implementation
├── shared/
│   ├── components/
│   │   └── ui/                 # ShadCN components
│   └── styles/
│       └── theme-variables.css # Theme system
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
src/
├── features/
│   └── tags/
│       ├── components/
│       │   ├── TagInput/
│       │   │   ├── index.tsx                    # Main TagInput component
│       │   │   ├── TagInput.tsx                 # Core component logic
│       │   │   ├── TagInput.module.css         # Component styles
│       │   │   ├── TagInput.test.tsx           # Component tests
│       │   │   ├── TagPill.tsx                 # Individual tag pill component
│       │   │   ├── QuickPicks.tsx              # Quick picks section
│       │   │   ├── AutocompleteDropdown.tsx    # Suggestion dropdown
│       │   │   └── types.ts                    # Component prop types
│       │   └── index.ts                        # Feature component exports
│       └── hooks/
│           ├── useTagSuggestions.ts            # Autocomplete data fetching
│           ├── useTagInput.ts                  # Tag input state management
│           └── useTagSuggestions.test.ts       # Hook tests
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Floating UI requires refs for positioning
// Must use forwardRef for component compatibility

// CRITICAL: Mobile keyboard detection affects dropdown positioning
// Check window.visualViewport for keyboard visibility

// CRITICAL: React Hook Form requires Controller for custom inputs
// Wrap component with Controller and handle value/onChange

// CRITICAL: CSS custom properties required for theming
// Never hardcode colors - use var(--color-*) variables

// CRITICAL: Performance - debounce autocomplete requests
// Use useDeferredValue or manual debouncing for search queries

// CRITICAL: Accessibility - manage focus programmatically
// Return focus to input after tag removal or selection
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/features/tags/components/TagInput/types.ts
import { Tag, TagCategory, TagSuggestion } from '../../types/tag.types'
import { Control, FieldError } from 'react-hook-form'

export interface TagInputProps {
  value: Tag[]
  onChange: (tags: Tag[]) => void
  maxTags?: number
  placeholder?: string
  category?: TagCategory
  quickPicks?: Tag[]
  disabled?: boolean
  error?: FieldError
  className?: string
  name?: string
  // React Hook Form integration
  control?: Control<any>
}

export interface TagPillProps {
  tag: Tag
  onRemove: (tag: Tag) => void
  disabled?: boolean
  className?: string
}

export interface QuickPicksProps {
  tags: Tag[]
  selectedTags: Tag[]
  onSelect: (tag: Tag) => void
  maxVisible?: number
  className?: string
}

export interface AutocompleteDropdownProps {
  isOpen: boolean
  suggestions: TagSuggestion[]
  onSelect: (suggestion: TagSuggestion) => void
  onClose: () => void
  activeIndex: number
  inputRef: React.RefObject<HTMLInputElement>
}

// Hook types
export interface UseTagSuggestionsOptions {
  query: string
  category?: TagCategory
  excludeTags?: string[]
  enabled?: boolean
}

export interface UseTagInputOptions {
  maxTags?: number
  onTagAdd?: (tag: Tag) => void
  onTagRemove?: (tag: Tag) => void
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/features/tags/components/TagInput/types.ts
  - IMPLEMENT: TypeScript interfaces for all tag input components
  - INCLUDE: Props interfaces, hook options, internal state types
  - FOLLOW pattern: Existing component type definitions
  - PLACEMENT: Component types file

Task 2: CREATE src/features/tags/hooks/useTagSuggestions.ts
  - IMPLEMENT: React Query hook for fetching tag suggestions
  - FOLLOW pattern: TanStack Query patterns in codebase
  - INCLUDE: Debouncing, caching, error handling
  - INTEGRATE: Tag service from Stage 1
  - PLACEMENT: Feature hooks directory

Task 3: CREATE src/features/tags/hooks/useTagInput.ts
  - IMPLEMENT: State management hook for tag input logic
  - INCLUDE: Add/remove tags, validation, keyboard handlers
  - PATTERN: Custom hook with clear API surface
  - PLACEMENT: Feature hooks directory

Task 4: CREATE src/features/tags/components/TagInput/TagPill.tsx
  - IMPLEMENT: Individual tag display with remove button
  - STYLING: Use CSS modules with theme variables
  - INCLUDE: Color coding by category, hover states
  - ACCESSIBILITY: ARIA labels, keyboard support
  - PLACEMENT: TagInput subdirectory

Task 5: CREATE src/features/tags/components/TagInput/QuickPicks.tsx
  - IMPLEMENT: Popular tags for one-click selection
  - PATTERN: Grid layout, responsive design
  - INCLUDE: Disabled state for already selected tags
  - PLACEMENT: TagInput subdirectory

Task 6: CREATE src/features/tags/components/TagInput/AutocompleteDropdown.tsx
  - IMPLEMENT: Floating UI dropdown with suggestions
  - FOLLOW pattern: src/features/arrangements/components/ChordProEditor/components/AutoCompleteDropdown
  - INCLUDE: Keyboard navigation, mobile optimization
  - MIDDLEWARE: offset, flip, shift, size from Floating UI
  - PLACEMENT: TagInput subdirectory

Task 7: CREATE src/features/tags/components/TagInput/TagInput.tsx
  - IMPLEMENT: Main component orchestrating all subcomponents
  - INTEGRATE: Hooks from Tasks 2-3, components from Tasks 4-6
  - INCLUDE: React Hook Form Controller support
  - PATTERN: Compound component with clear separation
  - PLACEMENT: TagInput subdirectory

Task 8: CREATE src/features/tags/components/TagInput/TagInput.module.css
  - IMPLEMENT: Component styles using CSS modules
  - USE: CSS custom properties for all colors
  - INCLUDE: Responsive styles, animations, focus states
  - PATTERN: Mobile-first approach
  - PLACEMENT: TagInput subdirectory

Task 9: CREATE src/features/tags/components/TagInput/index.tsx
  - IMPLEMENT: Export wrapper with default props
  - PATTERN: Clean public API
  - PLACEMENT: TagInput subdirectory

Task 10: CREATE src/features/tags/components/TagInput/TagInput.test.tsx
  - IMPLEMENT: Component tests with Testing Library
  - COVERAGE: User interactions, accessibility, edge cases
  - MOCK: API calls, test keyboard navigation
  - PLACEMENT: TagInput subdirectory

Task 11: CREATE src/features/tags/hooks/useTagSuggestions.test.ts
  - IMPLEMENT: Hook tests with renderHook
  - TEST: Debouncing, caching, error states
  - PLACEMENT: Hooks directory
```

### Implementation Patterns & Key Details

```typescript
// useTagSuggestions hook with debouncing
export function useTagSuggestions({
  query,
  category,
  excludeTags = [],
  enabled = true
}: UseTagSuggestionsOptions) {
  // PATTERN: React 19 useDeferredValue for performance
  const deferredQuery = useDeferredValue(query);
  
  return useQuery({
    queryKey: ['tags', 'suggestions', deferredQuery, category],
    queryFn: () => tagService.suggestTags(deferredQuery, category),
    enabled: enabled && deferredQuery.length >= 2,
    staleTime: 30000, // 30 seconds
    select: (data) => data.filter(s => !excludeTags.includes(s.tag.id))
  });
}

// TagInput component with Floating UI
export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(
  ({ value = [], onChange, maxTags = 10, ...props }, ref) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    
    // PATTERN: Floating UI setup
    const { refs, floatingStyles, context } = useFloating({
      open: isOpen,
      onOpenChange: setIsOpen,
      placement: 'bottom-start',
      middleware: [
        offset(4),
        flip({ fallbackPlacements: ['top-start', 'bottom-end'] }),
        shift({ padding: 8 }),
        size({
          apply({ availableHeight, elements }) {
            Object.assign(elements.floating.style, {
              maxHeight: `${Math.min(300, availableHeight)}px`
            });
          }
        })
      ]
    });
    
    // PATTERN: Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
      }
    };
    
    // CRITICAL: Accessibility announcements
    const announce = useCallback((message: string) => {
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);
    }, []);
    
    return (
      <div className={styles.container}>
        <div className={styles.tagList}>
          {value.map(tag => (
            <TagPill
              key={tag.id}
              tag={tag}
              onRemove={handleRemoveTag}
              disabled={props.disabled}
            />
          ))}
          <input
            ref={mergeRefs([ref, refs.setReference])}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={props.disabled || value.length >= maxTags}
            className={styles.input}
            aria-label="Add tags"
            aria-describedby={props.error ? 'tag-error' : undefined}
            {...props}
          />
        </div>
        
        {isOpen && (
          <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className={styles.dropdown}
            >
              <AutocompleteDropdown
                suggestions={suggestions}
                onSelect={handleSelect}
                activeIndex={activeIndex}
              />
            </div>
          </FloatingPortal>
        )}
        
        {quickPicks && (
          <QuickPicks
            tags={quickPicks}
            selectedTags={value}
            onSelect={handleAddTag}
          />
        )}
      </div>
    );
  }
);

// React Hook Form integration
export function TagInputField({ name, control, ...props }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TagInput
          {...props}
          value={field.value || []}
          onChange={field.onChange}
          error={fieldState.error}
        />
      )}
    />
  );
}

// CSS Module with theme variables
/* TagInput.module.css */
.container {
  position: relative;
  width: 100%;
}

.tagList {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-background);
  min-height: 3rem;
}

.tagPill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.tagPill[data-category="christmas"] {
  background: #fee2e2;
  color: #991b1b;
}

.dropdown {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  overflow-y: auto;
  z-index: 50;
}

@media (max-width: 640px) {
  .tagList {
    padding: 0.5rem;
  }
  
  .tagPill {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
  }
}
```

### Integration Points

```yaml
DEPENDENCIES:
  - service: "src/features/tags/services/tagService.ts from Stage 1"
  - types: "src/features/tags/types/tag.types.ts from Stage 1"
  - utils: "src/lib/utils.ts for cn() className helper"

EXTERNAL_PACKAGES:
  - install: "@floating-ui/react for dropdown positioning"
  - install: "react-hook-form for form integration"
  - existing: "@tanstack/react-query for data fetching"

THEME_INTEGRATION:
  - use: "CSS custom properties from theme-variables.css"
  - respect: "Theme context for dark/light/stage modes"

EXPORTS:
  - component: "Export from src/features/tags/components/index.ts"
  - usage: "Import in song forms for Stage 3"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After each component creation
npm run lint
npm run build

# Fix any ESLint or TypeScript errors immediately
# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test individual components
npm run test -- src/features/tags/components/TagInput/TagInput.test.tsx
npm run test -- src/features/tags/hooks/useTagSuggestions.test.ts

# Test coverage
npm run test:coverage -- src/features/tags/components

# Expected: All tests pass, > 80% coverage
```

### Level 3: Integration Testing (System Validation)

```bash
# Start dev server
npm run dev

# Create test page with TagInput
# Test in browser:
# 1. Type "chr" - autocomplete should appear in < 100ms
# 2. Select "Christmas" - tag pill should appear
# 3. Click X on pill - tag should be removed
# 4. Use keyboard navigation (arrows, enter, escape)
# 5. Test on mobile device or responsive mode

# Accessibility testing
# Use axe DevTools extension
# Check for ARIA labels, keyboard navigation
# Test with screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)

# Performance testing
# Open DevTools Performance tab
# Type in tag input - measure autocomplete response time
# Should be < 100ms for suggestions to appear

# Expected: All interactions smooth, accessible, performant
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Mobile testing
# Test on actual mobile devices if available
# Verify touch targets are 44x44px minimum
# Check dropdown positioning near screen edges
# Verify keyboard doesn't obscure dropdown

# Theme testing
# Toggle between light/dark/stage themes
# Verify all colors use CSS variables
# Check contrast ratios meet WCAG AA standards

# React Hook Form integration
# Create test form with TagInput
# Verify validation works
# Check form submission includes tag data
# Test error state display

# Edge cases
# Add maximum tags (10) - input should disable
# Type very long tag name - should truncate nicely
# Rapid typing - debouncing should work
# Network error - graceful degradation

# Browser compatibility
# Test in Chrome, Firefox, Safari, Edge
# Verify Floating UI positioning works in all

# Expected: Component robust across all scenarios
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Component renders without errors
- [ ] TypeScript types fully defined
- [ ] No console warnings or errors
- [ ] Tests pass with > 80% coverage

### Feature Validation

- [ ] Autocomplete triggers after 2 characters
- [ ] Suggestions appear in < 100ms
- [ ] Tag pills display with correct colors
- [ ] Remove buttons work on pills
- [ ] Quick picks section functional
- [ ] Keyboard navigation fully working
- [ ] Mobile experience optimized
- [ ] Accessibility standards met

### Code Quality Validation

- [ ] Follows existing component patterns
- [ ] Uses CSS modules with theme variables
- [ ] Proper error handling throughout
- [ ] Performance optimized with debouncing
- [ ] Clean component API surface

### Documentation & Deployment

- [ ] Props documented with TypeScript
- [ ] Storybook story created (if applicable)
- [ ] Usage examples in comments
- [ ] Exported from feature module

---

## Anti-Patterns to Avoid

- ❌ Don't hardcode colors - use CSS variables
- ❌ Don't skip accessibility attributes
- ❌ Don't forget to debounce autocomplete
- ❌ Don't ignore mobile experience
- ❌ Don't create new patterns - follow existing ones
- ❌ Don't mix inline styles with CSS modules
- ❌ Don't forget focus management
- ❌ Don't skip error boundary integration