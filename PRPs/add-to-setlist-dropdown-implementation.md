# Implementation PRP: Add to Setlist Dropdown Feature

## Executive Summary

Implement a dropdown component that allows users to quickly add arrangements to setlists while viewing an arrangement. This PRP provides comprehensive context and implementation blueprint for one-pass development success.

**Confidence Score: 9/10** - All patterns exist in codebase, comprehensive research completed, clear implementation path.

## Critical Context References

### Essential Documentation
- **PRD**: `/PRPs/add-to-setlist-dropdown-prd.md` - Complete product requirements
- **React Query Patterns**: `/PRPs/ai_docs/react-query-optimistic-updates.md` - Optimistic update strategies
- **React Query v5 Migration**: `/PRPs/ai_docs/react-query-v5-patterns.md` - Latest patterns
- **Floating UI Guide**: `/PRPs/ai_docs/floating-ui-dropdown-guide.md` - Positioning best practices
- **Floating UI Docs**: https://floating-ui.com/docs/react - Official documentation
- **React 19 Docs**: https://react.dev/blog/2024/12/05/react-19 - Latest React features

### Codebase Patterns to Follow

#### Vertical Slice Architecture
```
src/features/setlists/
├── components/
│   └── selectors/
│       ├── AddToSetlistDropdown.tsx      # NEW - Main component
│       ├── AddToSetlistDropdown.css      # NEW - Styles
│       └── __tests__/
│           └── AddToSetlistDropdown.test.tsx  # NEW - Tests
├── hooks/
│   └── mutations/
│       └── useAddToSetlistDropdown.ts    # NEW - Dropdown-specific logic
└── types/
    └── dropdown.types.ts                 # NEW - Dropdown types
```

#### Existing Components to Reference
- **Dropdown Pattern**: `/src/features/arrangements/components/ChordProEditor/components/AutoCompleteDropdown/index.tsx`
- **Modal Pattern**: `/src/features/setlists/components/selectors/SetlistSelectorModal.tsx`
- **Current Button**: `/src/features/setlists/components/selectors/AddToSetlistButton.tsx`
- **Form Select**: `/src/shared/components/form/FormSelect.tsx`

## Implementation Blueprint

### Phase 1: Core Dropdown Component

```typescript
// AddToSetlistDropdown.tsx - Pseudocode structure
import { useFloating, autoUpdate, offset, flip, shift, size, FloatingPortal } from '@floating-ui/react'
import { useSetlists } from '../../hooks/queries/useSetlistsQuery'
import { useAddToSetlist } from '../../hooks/mutations/useAddToSetlist'
import { useCreateSetlist } from '../../hooks/mutations/useCreateSetlist'

interface AddToSetlistDropdownProps {
  arrangement: Arrangement
  variant?: 'icon' | 'button' | 'text'
  onSuccess?: (setlist: Setlist) => void
}

function AddToSetlistDropdown({ arrangement, variant = 'button', onSuccess }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  
  // Floating UI setup - FOLLOW AutoCompleteDropdown pattern
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
            maxHeight: `${Math.min(availableHeight - 10, 400)}px`
          })
        }
      })
    ],
    whileElementsMounted: autoUpdate
  })
  
  // Data fetching - FOLLOW useSetlistsQuery pattern
  const { data: setlists, isLoading } = useSetlists({
    userId: user?.id,
    includePublic: true,
    checkArrangement: arrangement.id // Check which setlists contain this
  })
  
  // Mutations - FOLLOW existing mutation patterns
  const addToSetlistMutation = useAddToSetlist()
  const createSetlistMutation = useCreateSetlist()
  
  // Filter setlists - FOLLOW SetlistSelectorModal pattern
  const filteredSetlists = useMemo(() => {
    if (!setlists?.content) return []
    
    return setlists.content
      .filter(setlist => 
        !searchQuery || 
        setlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        // Sort by: recently modified first
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
  }, [setlists?.content, searchQuery])
  
  // Click outside detection - FOLLOW FormSelect pattern
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (!refs.floating.current?.contains(target) && 
          !refs.reference.current?.contains(target)) {
        setIsOpen(false)
      }
    }
    
    // Delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, refs])
  
  // Keyboard navigation - FOLLOW FormSelect pattern
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch(e.key) {
      case 'Escape':
        setIsOpen(false)
        break
      case 'ArrowDown':
        // Navigate down
        break
      case 'Enter':
        // Select current item
        break
    }
  }
  
  // Add to setlist with optimistic update
  const handleAddToSetlist = async (setlist: Setlist) => {
    try {
      await addToSetlistMutation.mutateAsync({
        setlistId: setlist.id,
        arrangementId: arrangement.id,
        options: {
          order: setlist.arrangements.length,
          addedAt: new Date()
        }
      })
      
      // Keep dropdown open for multiple additions
      // Show success feedback
      onSuccess?.(setlist)
    } catch (error) {
      // Error handled by mutation hook
    }
  }
  
  return (
    <>
      {/* Trigger Button */}
      <button
        ref={refs.setReference}
        onClick={() => setIsOpen(!isOpen)}
        className={cn('add-to-setlist-trigger', variant)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <ListPlus className="icon" />
        {variant !== 'icon' && <span>Add to Setlist</span>}
      </button>
      
      {/* Dropdown Content */}
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="add-to-setlist-dropdown"
            role="listbox"
            onKeyDown={handleKeyDown}
          >
            {/* Search Field - Show when >10 items */}
            {filteredSetlists.length > 10 && (
              <div className="dropdown-search">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search setlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search setlists"
                />
              </div>
            )}
            
            {/* Create New Option */}
            <button
              className="dropdown-item create-new"
              onClick={() => setIsCreating(true)}
              role="option"
            >
              <Plus className="icon" />
              <span>Create new setlist</span>
            </button>
            
            {/* Divider */}
            <div className="dropdown-divider" />
            
            {/* Setlist Items */}
            <div className="dropdown-list">
              {isLoading ? (
                <div className="dropdown-loading">Loading setlists...</div>
              ) : filteredSetlists.length === 0 ? (
                <div className="dropdown-empty">
                  {searchQuery ? 'No setlists found' : 'No setlists yet'}
                </div>
              ) : (
                filteredSetlists.map(setlist => (
                  <SetlistItem
                    key={setlist.id}
                    setlist={setlist}
                    containsArrangement={setlist.containsArrangement}
                    onClick={() => handleAddToSetlist(setlist)}
                  />
                ))
              )}
            </div>
          </div>
        </FloatingPortal>
      )}
      
      {/* Create Setlist Form (inline) */}
      {isCreating && (
        <CreateSetlistForm
          onSubmit={handleCreateWithArrangement}
          onCancel={() => setIsCreating(false)}
        />
      )}
    </>
  )
}

// Setlist Item Component
function SetlistItem({ setlist, containsArrangement, onClick }) {
  return (
    <button
      className={cn('dropdown-item', containsArrangement && 'contains-arrangement')}
      onClick={onClick}
      role="option"
      aria-selected={false}
    >
      <div className="item-content">
        <div className="item-main">
          {containsArrangement && <Check className="check-icon" />}
          <span className="item-name">{setlist.name}</span>
        </div>
        <span className="item-meta">
          {formatRelativeTime(setlist.updatedAt)}
        </span>
      </div>
    </button>
  )
}
```

### Phase 2: Hook Implementation

```typescript
// useAddToSetlistDropdown.ts
export function useAddToSetlistDropdown(arrangement: Arrangement) {
  const queryClient = useQueryClient()
  const { user } = useUser()
  const { addNotification } = useNotifications()
  
  // Fetch setlists with arrangement status
  const setlistsQuery = useQuery({
    queryKey: setlistKeys.listWithArrangement(user?.id, arrangement.id),
    queryFn: () => setlistService.getSetlistsWithArrangementStatus(user?.id, arrangement.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!user
  })
  
  // Add to setlist mutation with optimistic update
  const addToSetlistMutation = useMutation({
    mutationFn: ({ setlistId, arrangementId, options }) => 
      setlistService.addArrangement(setlistId, arrangementId, options, token),
      
    onMutate: async ({ setlistId, arrangementId }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: setlistKeys.detail(setlistId) })
      
      // Snapshot previous value
      const previousSetlist = queryClient.getQueryData(setlistKeys.detail(setlistId))
      
      // Optimistically update
      queryClient.setQueryData(setlistKeys.detail(setlistId), (old: Setlist) => ({
        ...old,
        arrangements: [...old.arrangements, {
          arrangementId,
          arrangement,
          order: old.arrangements.length,
          addedAt: new Date()
        }]
      }))
      
      return { previousSetlist }
    },
    
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousSetlist) {
        queryClient.setQueryData(
          setlistKeys.detail(variables.setlistId),
          context.previousSetlist
        )
      }
      
      addNotification({
        type: 'error',
        title: 'Failed to add to setlist',
        message: err.message
      })
    },
    
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: setlistKeys.detail(variables.setlistId) })
      queryClient.invalidateQueries({ queryKey: setlistKeys.lists() })
      
      addNotification({
        type: 'success',
        title: 'Added to setlist',
        message: `Added to "${data.name}"`
      })
    }
  })
  
  // Create setlist with arrangement
  const createWithArrangementMutation = useMutation({
    mutationFn: (data: CreateSetlistRequest) =>
      setlistService.createSetlistWithArrangement(data, arrangement.id, token),
      
    onSuccess: (newSetlist) => {
      queryClient.invalidateQueries({ queryKey: setlistKeys.lists() })
      
      addNotification({
        type: 'success',
        title: 'Setlist created',
        message: `Created "${newSetlist.name}" and added arrangement`
      })
    }
  })
  
  return {
    setlists: setlistsQuery.data,
    isLoadingSetlists: setlistsQuery.isLoading,
    addToSetlist: addToSetlistMutation.mutate,
    createWithArrangement: createWithArrangementMutation.mutate,
    isAdding: addToSetlistMutation.isPending,
    isCreating: createWithArrangementMutation.isPending
  }
}
```

### Phase 3: Styles Implementation

```css
/* AddToSetlistDropdown.css */
/* Follow existing dropdown patterns from AutoCompleteDropdown */

.add-to-setlist-dropdown {
  position: absolute;
  z-index: var(--z-dropdown);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-dropdown);
  min-width: 280px;
  max-width: 400px;
  overflow: hidden;
}

.dropdown-search {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  gap: 0.5rem;
}

.dropdown-search input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.875rem;
}

.dropdown-list {
  max-height: 300px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s;
  text-align: left;
}

.dropdown-item:hover,
.dropdown-item:focus-visible {
  background-color: var(--color-primary-alpha-10);
}

.dropdown-item.contains-arrangement {
  color: var(--color-text-secondary);
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.check-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-success);
  flex-shrink: 0;
}

.item-name {
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .add-to-setlist-dropdown {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-width: none;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    animation: slideUp 0.2s ease-out;
  }
  
  .dropdown-item {
    padding: 0.875rem 1rem;
  }
  
  .item-name {
    font-size: 0.9375rem;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
```

### Phase 4: Integration with ViewerToolbar

```typescript
// Update ViewerToolbar.tsx
import { AddToSetlistDropdown } from '@features/setlists/components/selectors/AddToSetlistDropdown'

// In ViewerToolbar component, replace the button with dropdown
{arrangement && (
  <AddToSetlistDropdown
    arrangement={arrangement}
    variant="button"
    onSuccess={() => {
      // Optional: Show additional feedback
    }}
  />
)}
```

### Phase 5: Testing Implementation

```typescript
// AddToSetlistDropdown.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddToSetlistDropdown } from '../AddToSetlistDropdown'
import { dropdownTestHelpers } from '../../test-utils/dropdown-helpers'

describe('AddToSetlistDropdown', () => {
  const mockArrangement = {
    id: 'arr_123',
    name: 'Test Song',
    key: 'C'
  }
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Rendering', () => {
    it('renders trigger button with correct text', () => {
      render(<AddToSetlistDropdown arrangement={mockArrangement} />)
      expect(screen.getByRole('button', { name: /add to setlist/i })).toBeInTheDocument()
    })
    
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup()
      render(<AddToSetlistDropdown arrangement={mockArrangement} />)
      
      const trigger = screen.getByRole('button', { name: /add to setlist/i })
      await user.click(trigger)
      
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      expect(screen.getByText('Create new setlist')).toBeInTheDocument()
    })
  })
  
  describe('Setlist Display', () => {
    it('shows user setlists sorted by recency', async () => {
      const mockSetlists = [
        { id: '1', name: 'Recent', updatedAt: new Date('2024-01-15') },
        { id: '2', name: 'Older', updatedAt: new Date('2024-01-10') }
      ]
      
      // Mock useSetlists hook
      vi.mocked(useSetlists).mockReturnValue({
        data: { content: mockSetlists },
        isLoading: false
      })
      
      const { user } = await dropdownTestHelpers.openDropdown('Add to Setlist')
      
      const items = screen.getAllByRole('option')
      expect(items[1]).toHaveTextContent('Recent') // After "Create new"
      expect(items[2]).toHaveTextContent('Older')
    })
    
    it('shows checkmark for setlists containing arrangement', async () => {
      const mockSetlists = [{
        id: '1',
        name: 'My Setlist',
        containsArrangement: true
      }]
      
      vi.mocked(useSetlists).mockReturnValue({
        data: { content: mockSetlists },
        isLoading: false
      })
      
      await dropdownTestHelpers.openDropdown('Add to Setlist')
      
      const item = screen.getByText('My Setlist').closest('button')
      expect(item).toHaveClass('contains-arrangement')
      expect(item?.querySelector('.check-icon')).toBeInTheDocument()
    })
  })
  
  describe('Search Functionality', () => {
    it('shows search field when more than 10 setlists', async () => {
      const manySetlists = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
        name: `Setlist ${i}`
      }))
      
      vi.mocked(useSetlists).mockReturnValue({
        data: { content: manySetlists },
        isLoading: false
      })
      
      await dropdownTestHelpers.openDropdown('Add to Setlist')
      
      expect(screen.getByPlaceholderText('Search setlists...')).toBeInTheDocument()
    })
    
    it('filters setlists based on search query', async () => {
      const user = userEvent.setup()
      // ... setup and test filtering
    })
  })
  
  describe('Adding to Setlist', () => {
    it('adds arrangement to selected setlist with optimistic update', async () => {
      const mockMutate = vi.fn()
      vi.mocked(useAddToSetlist).mockReturnValue({
        mutateAsync: mockMutate
      })
      
      const user = userEvent.setup()
      render(<AddToSetlistDropdown arrangement={mockArrangement} />)
      
      await user.click(screen.getByRole('button', { name: /add to setlist/i }))
      await user.click(screen.getByText('My Setlist'))
      
      expect(mockMutate).toHaveBeenCalledWith({
        setlistId: expect.any(String),
        arrangementId: mockArrangement.id,
        options: expect.objectContaining({
          order: expect.any(Number),
          addedAt: expect.any(Date)
        })
      })
    })
  })
  
  describe('Keyboard Navigation', () => {
    it('closes on Escape key', async () => {
      const user = userEvent.setup()
      await dropdownTestHelpers.openDropdown('Add to Setlist')
      
      await user.keyboard('{Escape}')
      
      await dropdownTestHelpers.expectDropdownClosed()
    })
    
    it('navigates with arrow keys', async () => {
      // Test arrow key navigation
    })
  })
  
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<AddToSetlistDropdown arrangement={mockArrangement} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('has proper ARIA attributes', () => {
      render(<AddToSetlistDropdown arrangement={mockArrangement} />)
      const trigger = screen.getByRole('button', { name: /add to setlist/i })
      
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    })
  })
  
  describe('Mobile Behavior', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 })
    })
    
    it('positions dropdown as bottom sheet on mobile', async () => {
      // Test mobile-specific positioning
    })
  })
})
```

## Implementation Tasks

### Task List (In Order)

1. **Create type definitions** (`dropdown.types.ts`)
   - Define all interfaces and types
   - Export for use across components

2. **Implement core dropdown component** (`AddToSetlistDropdown.tsx`)
   - Set up Floating UI positioning
   - Implement trigger button variants
   - Add dropdown content structure

3. **Add data fetching logic** (`useAddToSetlistDropdown.ts`)
   - Integrate with existing queries
   - Set up mutations with optimistic updates
   - Handle error states

4. **Implement search and filtering**
   - Add search input for large lists
   - Implement fuzzy matching
   - Add keyboard navigation

5. **Create inline setlist creation**
   - Build form component
   - Integrate with create mutation
   - Handle validation

6. **Style the component** (`AddToSetlistDropdown.css`)
   - Follow design system tokens
   - Add mobile-specific styles
   - Implement animations

7. **Write comprehensive tests**
   - Unit tests for component
   - Integration tests for mutations
   - Accessibility tests
   - Mobile behavior tests

8. **Integrate with ViewerToolbar**
   - Replace placeholder button
   - Pass arrangement prop
   - Test integration

9. **Add performance optimizations**
   - Virtual scrolling for large lists
   - Memoize filtered results
   - Optimize re-renders

10. **Documentation and cleanup**
    - Add JSDoc comments
    - Update component documentation
    - Remove old AddToSetlistButton usage

## Validation Gates

```bash
# Level 1: Type checking
npm run type-check
# Must pass - No TypeScript errors

# Level 2: Linting
npm run lint
# Must pass - Following all ESLint rules

# Level 3: Unit tests
npm run test -- AddToSetlistDropdown
# Must pass - All component tests passing

# Level 4: Integration tests  
npm run test -- useAddToSetlistDropdown
# Must pass - Hook tests passing

# Level 5: Accessibility
npm run test:a11y
# Must pass - No accessibility violations

# Level 6: Build validation
npm run build
# Must pass - Successful production build

# Level 7: Bundle size check
npm run analyze
# Component should add <50KB to bundle

# Level 8: E2E test (if available)
npm run test:e2e -- add-to-setlist
# Must pass - User flow working end-to-end

# Level 9: Visual regression (if available)
npm run test:visual -- AddToSetlistDropdown
# Must pass - No unintended visual changes
```

## Error Handling Strategy

### Network Errors
- Show fallback UI when setlists fail to load
- Retry with exponential backoff
- Cache successful responses

### Authentication Errors
- Redirect to sign-in with return URL
- Show clear messaging about auth requirements
- Preserve user intent after sign-in

### Validation Errors
- Inline error messages in creation form
- Prevent duplicate setlist names
- Show field-specific errors

### Optimistic Update Failures
- Automatic rollback on error
- Clear error notifications
- Option to retry failed operation

## Performance Considerations

### Initial Load
- Lazy load dropdown content
- Prefetch setlists on hover (optional)
- Use React.lazy for creation form

### Large Lists
- Virtual scrolling for >50 items
- Debounce search input (150ms)
- Limit initial render to 20 items

### Memory Management
- Clean up event listeners properly
- Dispose Floating UI on unmount
- Clear search query on close

## Feature Boundaries

### This Feature Owns
- Dropdown UI component
- Search and filter logic
- Inline creation form
- Dropdown-specific hooks

### Dependencies On
- `setlistService` for API calls
- `useSetlists` query hook
- `useAddToSetlist` mutation
- `useCreateSetlist` mutation
- Auth context for user info
- Notification system

### Does NOT Include
- Setlist management page changes
- Song/arrangement modifications
- Sharing functionality
- Bulk operations (future enhancement)

## Common Pitfalls to Avoid

1. **Don't forget FloatingPortal** - Prevents z-index issues
2. **Don't skip autoUpdate** - Keeps position synced
3. **Don't forget click outside delay** - Prevents immediate close
4. **Don't mutate cache directly** - Use proper setQueryData
5. **Don't skip loading states** - Show skeleton/spinner
6. **Don't forget mobile testing** - Different positioning needed
7. **Don't skip ARIA attributes** - Required for accessibility
8. **Don't forget error boundaries** - Catch rendering errors

## Implementation Checklist

- [ ] Type definitions created
- [ ] Core component implemented
- [ ] Floating UI positioning working
- [ ] Data fetching integrated
- [ ] Search functionality added
- [ ] Create setlist form working
- [ ] Optimistic updates implemented
- [ ] Styles match design system
- [ ] Mobile behavior correct
- [ ] All tests passing
- [ ] Accessibility validated
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] PR ready for review

## Success Criteria

1. Dropdown opens/closes smoothly
2. Setlists load within 500ms
3. Search filters in real-time
4. Adding to setlist shows immediate feedback
5. Creation flow works inline
6. Mobile experience is touch-friendly
7. Keyboard navigation fully supported
8. No accessibility violations
9. All existing tests still pass
10. Bundle size increase <50KB

---

**Ready for Implementation** - All context provided, patterns documented, validation gates defined.