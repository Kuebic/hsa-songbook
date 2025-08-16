# Floating UI Dropdown Guide

## Official Documentation Links

### Core Floating UI Documentation
- **Main Documentation**: https://floating-ui.com/docs/react
- **Getting Started**: https://floating-ui.com/docs/getting-started
- **React Examples**: https://floating-ui.com/docs/react-examples
- **Tutorial**: https://floating-ui.com/docs/tutorial
- **GitHub Repository**: https://github.com/floating-ui/floating-ui

### Essential API References
- **useFloating Hook**: https://floating-ui.com/docs/usefloating
- **Middleware Guide**: https://floating-ui.com/docs/middleware
- **Interaction Hooks**: https://floating-ui.com/docs/react-dom-interactions
- **Auto Update**: https://floating-ui.com/docs/autoupdate

## Core Implementation Pattern

### Basic Dropdown Setup

```typescript
import { 
  useFloating, 
  autoUpdate, 
  offset, 
  flip, 
  shift, 
  useInteractions,
  useHover,
  useFocus,
  useClick,
  useDismiss,
  useRole,
  FloatingPortal
} from '@floating-ui/react'

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  offset?: number
}

export function Dropdown({ 
  trigger, 
  children, 
  placement = 'bottom-start',
  offset: offsetValue = 4 
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    middleware: [
      offset(offsetValue),
      flip({
        fallbackAxisSideDirection: "start",
      }),
      shift({ padding: 5 })
    ],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ])

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {trigger}
      </div>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 bg-white border rounded-md shadow-lg"
          >
            {children}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
```

## Mobile Optimization Strategies

### 1. Responsive Middleware Configuration

```typescript
const isMobile = window.innerWidth < 768

const middleware = [
  offset(isMobile ? 8 : 4), // Larger offset on mobile for touch targets
  flip({
    fallbackAxisSideDirection: "start",
    // On mobile, prefer bottom placement to avoid keyboard issues
    fallbackPlacements: isMobile ? ['bottom', 'top'] : undefined
  }),
  shift({ 
    padding: isMobile ? 16 : 8 // More padding on mobile
  }),
  // Ensure dropdown fits within viewport on mobile
  size({
    apply({ availableWidth, availableHeight, elements }) {
      Object.assign(elements.floating.style, {
        maxWidth: `${Math.min(availableWidth, isMobile ? 280 : 320)}px`,
        maxHeight: `${Math.min(availableHeight, isMobile ? 200 : 300)}px`,
      })
    },
  }),
]
```

### 2. Touch-Friendly Interactions

```typescript
// For mobile-optimized interactions
export function MobileDropdown({ children, trigger }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(isMobile ? 8 : 4),
      flip(),
      shift({ padding: isMobile ? 16 : 8 }),
    ],
    whileElementsMounted: autoUpdate,
  })

  // Use click for mobile, hover + focus for desktop
  const interactions = isMobile 
    ? [useClick(context), useDismiss(context)] 
    : [useHover(context), useFocus(context), useDismiss(context)]

  const { getReferenceProps, getFloatingProps } = useInteractions(interactions)

  return (
    <>
      <button 
        ref={refs.setReference} 
        {...getReferenceProps()}
        className="touch-manipulation" // Improves touch responsiveness
      >
        {trigger}
      </button>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={`
              z-50 bg-white border rounded-md shadow-lg
              ${isMobile ? 'min-h-[44px]' : ''} // Minimum touch target size
            `}
          >
            {children}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
```

### 3. Virtual Keyboard Handling

```typescript
// Handle virtual keyboard on mobile
useEffect(() => {
  if (!isMobile || !isOpen) return

  const handleViewportChange = () => {
    // Recalculate position when virtual keyboard appears/disappears
    if (refs.floating.current) {
      refs.floating.current.style.position = 'fixed'
    }
  }

  window.addEventListener('resize', handleViewportChange)
  return () => window.removeEventListener('resize', handleViewportChange)
}, [isOpen, isMobile, refs.floating])
```

## Advanced Dropdown Patterns

### 1. Select/ComboBox Implementation

```typescript
interface SelectProps<T> {
  options: T[]
  value?: T
  onSelect: (value: T) => void
  renderOption: (option: T) => React.ReactNode
  placeholder?: string
}

export function Select<T>({ 
  options, 
  value, 
  onSelect, 
  renderOption,
  placeholder = "Select option..." 
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip(),
      shift(),
      size({
        apply({ rects, elements }) {
          // Match trigger width
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
          })
        },
      }),
    ],
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'listbox' })
  
  // Keyboard navigation
  const listNav = useListNavigation(context, {
    listRef: optionRefs,
    activeIndex,
    onNavigate: setActiveIndex,
  })

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNav,
  ])

  const optionRefs = useRef<Array<HTMLElement | null>>([])

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="w-full flex items-center justify-between p-2 border rounded-md"
      >
        {value ? renderOption(value) : placeholder}
        <ChevronDownIcon className="w-4 h-4" />
      </button>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {options.map((option, index) => (
              <div
                key={index}
                ref={(node) => {
                  optionRefs.current[index] = node
                }}
                {...getItemProps({
                  onClick: () => {
                    onSelect(option)
                    setIsOpen(false)
                  },
                })}
                className={`
                  p-2 cursor-pointer hover:bg-gray-100
                  ${activeIndex === index ? 'bg-blue-100' : ''}
                  ${value === option ? 'bg-blue-50 font-medium' : ''}
                `}
              >
                {renderOption(option)}
              </div>
            ))}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
```

### 2. Multi-Level Dropdown Menu

```typescript
interface MenuItem {
  label: string
  value: string
  children?: MenuItem[]
  icon?: React.ReactNode
}

export function MultiLevelDropdown({ items }: { items: MenuItem[] }) {
  const [openMenus, setOpenMenus] = useState<string[]>([])

  const toggleSubmenu = (value: string) => {
    setOpenMenus(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <MenuItem
          key={item.value}
          item={item}
          isOpen={openMenus.includes(item.value)}
          onToggle={() => toggleSubmenu(item.value)}
          level={0}
        />
      ))}
    </div>
  )
}

function MenuItem({ 
  item, 
  isOpen, 
  onToggle, 
  level 
}: { 
  item: MenuItem
  isOpen: boolean
  onToggle: () => void
  level: number 
}) {
  const hasChildren = item.children && item.children.length > 0

  return (
    <div>
      <button
        onClick={hasChildren ? onToggle : undefined}
        className={`
          w-full flex items-center justify-between p-2 text-left hover:bg-gray-100
          ${level > 0 ? 'pl-' + (4 + level * 4) : 'pl-2'}
        `}
      >
        <span className="flex items-center gap-2">
          {item.icon}
          {item.label}
        </span>
        {hasChildren && (
          <ChevronRightIcon 
            className={`w-4 h-4 transition-transform ${
              isOpen ? 'rotate-90' : ''
            }`} 
          />
        )}
      </button>
      {hasChildren && isOpen && (
        <div className="ml-4">
          <MultiLevelDropdown items={item.children} />
        </div>
      )}
    </div>
  )
}
```

## Performance Optimizations

### 1. Lazy Loading Content

```typescript
export function LazyDropdown({ trigger, children }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open)
      if (open && !hasLoaded) {
        setHasLoaded(true)
      }
    },
    whileElementsMounted: autoUpdate,
  })

  return (
    <>
      <div ref={refs.setReference}>
        {trigger}
      </div>
      {isOpen && (
        <FloatingPortal>
          <div ref={refs.setFloating} style={floatingStyles}>
            {hasLoaded ? children : <div>Loading...</div>}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
```

### 2. Virtualized Long Lists

```typescript
import { FixedSizeList as List } from 'react-window'

export function VirtualizedSelect({ 
  options, 
  onSelect 
}: { 
  options: string[]
  onSelect: (option: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(4), flip(), shift()],
    whileElementsMounted: autoUpdate,
  })

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div
      style={style}
      className="p-2 hover:bg-gray-100 cursor-pointer"
      onClick={() => {
        onSelect(options[index])
        setIsOpen(false)
      }}
    >
      {options[index]}
    </div>
  )

  return (
    <>
      <button ref={refs.setReference} onClick={() => setIsOpen(!isOpen)}>
        Select option
      </button>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="bg-white border rounded-md shadow-lg"
          >
            <List
              height={200}
              itemCount={options.length}
              itemSize={32}
              width="100%"
            >
              {Row}
            </List>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
```

## Accessibility Best Practices

### 1. Complete ARIA Implementation

```typescript
export function AccessibleDropdown({ items, onSelect }: AccessibleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [selectedValue, setSelectedValue] = useState<string | null>(null)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'listbox' })
  const listNav = useListNavigation(context, {
    listRef: itemRefs,
    activeIndex,
    onNavigate: setActiveIndex,
  })

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNav,
  ])

  const itemRefs = useRef<Array<HTMLElement | null>>([])
  const dropdownId = useId()

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${dropdownId}-label`}
        aria-describedby={selectedValue ? `${dropdownId}-value` : undefined}
      >
        {selectedValue || "Select option"}
      </button>
      
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            role="listbox"
            aria-labelledby={`${dropdownId}-label`}
            className="z-50 bg-white border rounded-md shadow-lg"
          >
            {items.map((item, index) => (
              <div
                key={item.value}
                ref={(node) => {
                  itemRefs.current[index] = node
                }}
                {...getItemProps({
                  onClick: () => {
                    setSelectedValue(item.label)
                    onSelect(item.value)
                    setIsOpen(false)
                  },
                })}
                role="option"
                aria-selected={selectedValue === item.label}
                tabIndex={activeIndex === index ? 0 : -1}
                className={`
                  p-2 cursor-pointer
                  ${activeIndex === index ? 'bg-blue-100' : 'hover:bg-gray-100'}
                  ${selectedValue === item.label ? 'bg-blue-50 font-medium' : ''}
                `}
              >
                {item.label}
              </div>
            ))}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
```

### 2. Focus Management

```typescript
import { useFocusTrap } from '@floating-ui/react'

export function FocusTrappedDropdown({ children, trigger }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
  })

  // Trap focus within dropdown when open
  const focusTrap = useFocusTrap(context, {
    enabled: isOpen,
    restoreFocus: true,
  })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
    focusTrap,
  ])

  return (
    <>
      <button ref={refs.setReference} {...getReferenceProps()}>
        {trigger}
      </button>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {children}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
```

## Testing Strategies

### 1. Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dropdown } from '../Dropdown'

describe('Dropdown', () => {
  it('opens and closes on click', async () => {
    const user = userEvent.setup()
    
    render(
      <Dropdown trigger={<button>Open</button>}>
        <div>Dropdown content</div>
      </Dropdown>
    )

    const trigger = screen.getByRole('button', { name: 'Open' })
    
    // Should be closed initially
    expect(screen.queryByText('Dropdown content')).not.toBeInTheDocument()
    
    // Click to open
    await user.click(trigger)
    await waitFor(() => {
      expect(screen.getByText('Dropdown content')).toBeInTheDocument()
    })
    
    // Click to close
    await user.click(trigger)
    await waitFor(() => {
      expect(screen.queryByText('Dropdown content')).not.toBeInTheDocument()
    })
  })

  it('closes on escape key', async () => {
    const user = userEvent.setup()
    
    render(
      <Dropdown trigger={<button>Open</button>}>
        <div>Dropdown content</div>
      </Dropdown>
    )

    await user.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('Dropdown content')).toBeInTheDocument()
    })
    
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByText('Dropdown content')).not.toBeInTheDocument()
    })
  })

  it('closes on outside click', async () => {
    const user = userEvent.setup()
    
    render(
      <div>
        <Dropdown trigger={<button>Open</button>}>
          <div>Dropdown content</div>
        </Dropdown>
        <div>Outside</div>
      </div>
    )

    await user.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('Dropdown content')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('Outside'))
    await waitFor(() => {
      expect(screen.queryByText('Dropdown content')).not.toBeInTheDocument()
    })
  })
})
```

### 2. Mobile Testing

```typescript
// Mock mobile viewport
beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375, // Mobile width
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667, // Mobile height
  })
})

it('handles mobile interactions correctly', async () => {
  const user = userEvent.setup()
  
  render(<MobileDropdown trigger={<button>Menu</button>} />)
  
  const trigger = screen.getByRole('button')
  
  // On mobile, should only respond to clicks, not hover
  await user.hover(trigger)
  expect(screen.queryByText('Dropdown content')).not.toBeInTheDocument()
  
  await user.click(trigger)
  await waitFor(() => {
    expect(screen.getByText('Dropdown content')).toBeInTheDocument()
  })
})
```

## Common Pitfalls and Solutions

### 1. Portal and Z-Index Issues
- Always use `FloatingPortal` for dropdowns that need to escape overflow containers
- Set appropriate z-index values (typically z-50 or higher)
- Test with various parent containers that have `overflow: hidden`

### 2. Performance with Large Lists
- Use virtualization for lists with 100+ items
- Implement lazy loading for dropdown content
- Consider debouncing search/filter functionality

### 3. Mobile Viewport Issues
- Account for virtual keyboard on mobile
- Use appropriate touch target sizes (minimum 44px)
- Test with various mobile viewports and orientations

### 4. Accessibility Compliance
- Always include proper ARIA attributes
- Ensure keyboard navigation works correctly
- Test with screen readers
- Maintain proper focus management

## Summary

Floating UI provides a powerful foundation for building accessible, responsive dropdown components. Key considerations:

1. **Use the full middleware stack**: offset, flip, shift, and size for robust positioning
2. **Optimize for mobile**: Larger touch targets, appropriate interactions, keyboard handling
3. **Implement proper accessibility**: ARIA attributes, keyboard navigation, focus management
4. **Consider performance**: Virtualization for large lists, lazy loading, proper cleanup
5. **Test thoroughly**: Component interactions, mobile scenarios, accessibility compliance

The examples above provide production-ready patterns that can be adapted for specific use cases while maintaining best practices for user experience and accessibility.