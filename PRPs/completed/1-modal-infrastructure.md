# Modal Infrastructure Implementation PRP

## Executive Summary
Implement a reusable, accessible modal component using the native HTML dialog element with TypeScript, proper focus management, and animation support. This infrastructure will serve as the foundation for all modal-based forms in the HSA Songbook application.

**Confidence Score: 9.5/10** - High confidence due to native browser support, clear patterns, and comprehensive research.

## Context and Research Findings

### Current State Analysis
- **No existing modal infrastructure** in the codebase
- Some references to Clerk's modal patterns but no reusable component
- Existing inline styles pattern should be maintained for consistency
- No external UI libraries currently used (keeping bundle size minimal)

### Technical Research
**Native Dialog Element Benefits:**
- Built-in focus management and keyboard support (ESC to close)
- Renders in browser's top layer (no z-index issues)
- Automatic ARIA roles and modal states
- [MDN Dialog Documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)

**Accessibility Requirements (WCAG 2.1 AA):**
- Focus moves to modal when opened
- Focus trapped within modal during interaction
- Focus returns to trigger element when closed
- Screen reader announcements for modal state
- [W3C WAI-ARIA Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

### Vertical Slice Architecture
```
src/shared/components/modal/
├── Modal.tsx                 # Core modal component
├── Modal.test.tsx           # Component tests
├── ModalProvider.tsx        # Context for nested modals
├── ModalProvider.test.tsx   # Context tests
├── hooks/
│   ├── useModal.ts         # Modal state management
│   └── useModalFocus.ts    # Focus management hook
├── utils/
│   ├── modalAnimations.ts  # Animation utilities
│   └── modalAccessibility.ts # ARIA helpers
├── types/
│   └── modal.types.ts      # TypeScript definitions
└── index.ts                 # Public exports
```

## Implementation Blueprint

### Phase 1: Core Modal Component

```typescript
// src/shared/components/modal/types/modal.types.ts
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  description?: string
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  closeOnEsc?: boolean
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
  className?: string
  testId?: string
  animationDuration?: number
  initialFocusRef?: React.RefObject<HTMLElement>
  finalFocusRef?: React.RefObject<HTMLElement>
}

export interface ModalContextValue {
  openModals: Set<string>
  registerModal: (id: string) => void
  unregisterModal: (id: string) => void
  isTopModal: (id: string) => boolean
}
```

### Phase 2: Modal Implementation

```typescript
// src/shared/components/modal/Modal.tsx
import { useRef, useEffect, useId, useCallback } from 'react'
import { useModalFocus } from './hooks/useModalFocus'
import { useModal } from './hooks/useModal'
import type { ModalProps } from './types/modal.types'

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = 'medium',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = '',
  testId = 'modal',
  animationDuration = 200,
  initialFocusRef,
  finalFocusRef
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const modalId = useId()
  const { registerModal, unregisterModal, isTopModal } = useModal()
  
  // Focus management
  useModalFocus({
    isOpen,
    dialogRef,
    initialFocusRef,
    finalFocusRef
  })
  
  // Open/close dialog
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    
    if (isOpen) {
      dialog.showModal()
      registerModal(modalId)
    } else {
      // Animate out before closing
      dialog.style.animation = `modalFadeOut ${animationDuration}ms ease-out`
      setTimeout(() => {
        dialog.close()
        dialog.style.animation = ''
      }, animationDuration)
      unregisterModal(modalId)
    }
    
    return () => {
      unregisterModal(modalId)
    }
  }, [isOpen, modalId, animationDuration])
  
  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }, [closeOnOverlayClick, onClose])
  
  // Handle ESC key
  const handleCancel = useCallback((e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault() // Prevent default close
    if (closeOnEsc && isTopModal(modalId)) {
      onClose()
    }
  }, [closeOnEsc, isTopModal, modalId, onClose])
  
  const sizeStyles: Record<typeof size, React.CSSProperties> = {
    small: { maxWidth: '400px', width: '90%' },
    medium: { maxWidth: '600px', width: '90%' },
    large: { maxWidth: '900px', width: '90%' },
    fullscreen: { width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }
  }
  
  const styles: React.CSSProperties = {
    ...sizeStyles[size],
    padding: '24px',
    borderRadius: '8px',
    border: 'none',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    animation: isOpen ? `modalFadeIn ${animationDuration}ms ease-out` : undefined,
    backgroundColor: '#ffffff',
    color: '#1e293b',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxHeight: '90vh',
    overflow: 'auto'
  }
  
  const backdropStyles: React.CSSProperties = {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'fixed',
    inset: 0,
    animation: isOpen ? `backdropFadeIn ${animationDuration}ms ease-out` : undefined
  }
  
  return (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        @keyframes modalFadeOut {
          from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
        }
        
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        dialog::backdrop {
          background-color: rgba(0, 0, 0, 0.5);
          animation: backdropFadeIn ${animationDuration}ms ease-out;
        }
      `}</style>
      
      <dialog
        ref={dialogRef}
        style={styles}
        className={className}
        onClick={handleBackdropClick}
        onCancel={handleCancel}
        aria-labelledby={title ? `${testId}-title` : undefined}
        aria-describedby={description ? `${testId}-description` : undefined}
        aria-label={!title ? 'Dialog' : undefined}
        aria-modal="true"
        data-testid={testId}
      >
        <div onClick={e => e.stopPropagation()}>
          {showCloseButton && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1,
                color: '#64748b'
              }}
              aria-label="Close dialog"
              data-testid={`${testId}-close`}
            >
              ×
            </button>
          )}
          
          {title && (
            <h2 
              id={`${testId}-title`}
              style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: 600,
                color: '#1e293b'
              }}
            >
              {title}
            </h2>
          )}
          
          {description && (
            <p 
              id={`${testId}-description`}
              style={{
                margin: '0 0 24px 0',
                fontSize: '14px',
                color: '#64748b'
              }}
            >
              {description}
            </p>
          )}
          
          {children}
        </div>
      </dialog>
    </>
  )
}
```

### Phase 3: Focus Management Hook

```typescript
// src/shared/components/modal/hooks/useModalFocus.ts
import { useRef, useEffect } from 'react'

interface UseModalFocusOptions {
  isOpen: boolean
  dialogRef: React.RefObject<HTMLDialogElement>
  initialFocusRef?: React.RefObject<HTMLElement>
  finalFocusRef?: React.RefObject<HTMLElement>
}

export function useModalFocus({
  isOpen,
  dialogRef,
  initialFocusRef,
  finalFocusRef
}: UseModalFocusOptions) {
  const previousActiveElement = useRef<HTMLElement | null>(null)
  
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return
    
    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement
    
    // Focus initial element or first focusable
    const focusTarget = initialFocusRef?.current || 
      dialogRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    
    // Use requestAnimationFrame to ensure dialog is rendered
    requestAnimationFrame(() => {
      focusTarget?.focus()
    })
    
    return () => {
      // Return focus to trigger or specified element
      const returnTarget = finalFocusRef?.current || previousActiveElement.current
      returnTarget?.focus()
    }
  }, [isOpen, dialogRef, initialFocusRef, finalFocusRef])
}
```

### Phase 4: Modal Provider for Nested Modals

```typescript
// src/shared/components/modal/ModalProvider.tsx
import { createContext, useContext, useState, useCallback } from 'react'
import type { ModalContextValue } from './types/modal.types'

const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  
  const registerModal = useCallback((id: string) => {
    setOpenModals(prev => new Set(prev).add(id))
  }, [])
  
  const unregisterModal = useCallback((id: string) => {
    setOpenModals(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])
  
  const isTopModal = useCallback((id: string) => {
    const modals = Array.from(openModals)
    return modals[modals.length - 1] === id
  }, [openModals])
  
  return (
    <ModalContext.Provider value={{ openModals, registerModal, unregisterModal, isTopModal }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    // Provide default implementation if not wrapped in provider
    return {
      openModals: new Set<string>(),
      registerModal: () => {},
      unregisterModal: () => {},
      isTopModal: () => true
    }
  }
  return context
}
```

### Phase 5: Comprehensive Tests

```typescript
// src/shared/components/modal/Modal.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'
import { ModalProvider } from './ModalProvider'

describe('Modal Component', () => {
  const mockOnClose = vi.fn()
  
  beforeEach(() => {
    mockOnClose.mockClear()
  })
  
  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      )
      
      expect(screen.getByText('Modal content')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    
    it('does not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      )
      
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
    })
    
    it('renders title and description when provided', () => {
      render(
        <Modal 
          isOpen={true} 
          onClose={mockOnClose}
          title="Test Title"
          description="Test Description"
        >
          <p>Content</p>
        </Modal>
      )
      
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
    })
  })
  
  describe('Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <Modal isOpen={true} onClose={mockOnClose} showCloseButton={true}>
          <p>Content</p>
        </Modal>
      )
      
      await user.click(screen.getByLabelText('Close dialog'))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
    
    it('calls onClose when ESC key is pressed', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnEsc={true}>
          <p>Content</p>
        </Modal>
      )
      
      fireEvent.keyDown(document.body, { key: 'Escape' })
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
    
    it('does not close on ESC when closeOnEsc is false', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnEsc={false}>
          <p>Content</p>
        </Modal>
      )
      
      fireEvent.keyDown(document.body, { key: 'Escape' })
      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled()
      })
    })
  })
  
  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Modal 
          isOpen={true} 
          onClose={mockOnClose}
          title="Accessible Modal"
          description="This is accessible"
        >
          <p>Content</p>
        </Modal>
      )
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog).toHaveAttribute('aria-describedby')
    })
    
    it('manages focus correctly', async () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <button>Focus me</button>
        </Modal>
      )
      
      const triggerButton = document.createElement('button')
      document.body.appendChild(triggerButton)
      triggerButton.focus()
      
      rerender(
        <Modal isOpen={true} onClose={mockOnClose}>
          <button>Focus me</button>
        </Modal>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Focus me')).toHaveFocus()
      })
      
      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <button>Focus me</button>
        </Modal>
      )
      
      await waitFor(() => {
        expect(triggerButton).toHaveFocus()
      })
      
      document.body.removeChild(triggerButton)
    })
  })
  
  describe('Nested Modals', () => {
    it('handles multiple modals with provider', () => {
      render(
        <ModalProvider>
          <Modal isOpen={true} onClose={mockOnClose} testId="modal1">
            <p>Modal 1</p>
            <Modal isOpen={true} onClose={mockOnClose} testId="modal2">
              <p>Modal 2</p>
            </Modal>
          </Modal>
        </ModalProvider>
      )
      
      expect(screen.getByTestId('modal1')).toBeInTheDocument()
      expect(screen.getByTestId('modal2')).toBeInTheDocument()
    })
  })
})
```

## Validation Gates

### Level 1: Type Checking & Linting
```bash
npm run lint
npm run type-check
```

### Level 2: Unit Tests
```bash
npm run test -- src/shared/components/modal/
```

### Level 3: Accessibility Testing
```bash
# Manual testing with screen reader
# Keyboard navigation testing
# Browser DevTools accessibility audit
```

### Level 4: Build Verification
```bash
npm run build
npm run preview
```

### Level 5: Integration Testing
- [ ] Open modal from button click
- [ ] Close modal with ESC key
- [ ] Close modal with close button
- [ ] Close modal by clicking backdrop
- [ ] Nested modals work correctly
- [ ] Focus management works properly
- [ ] Animations play smoothly
- [ ] Mobile responsive behavior

## File Creation Order

1. `src/shared/components/modal/types/modal.types.ts` - Type definitions
2. `src/shared/components/modal/hooks/useModalFocus.ts` - Focus management
3. `src/shared/components/modal/hooks/useModal.ts` - Modal state hook
4. `src/shared/components/modal/ModalProvider.tsx` - Context provider
5. `src/shared/components/modal/Modal.tsx` - Main component
6. `src/shared/components/modal/Modal.test.tsx` - Unit tests
7. `src/shared/components/modal/ModalProvider.test.tsx` - Provider tests
8. `src/shared/components/modal/index.ts` - Public exports

## Success Metrics

- ✅ Zero TypeScript errors
- ✅ 100% test coverage for modal components
- ✅ WCAG 2.1 AA compliant
- ✅ Keyboard navigation works perfectly
- ✅ Screen reader compatible
- ✅ Smooth animations < 300ms
- ✅ Works on all modern browsers
- ✅ Mobile responsive
- ✅ Bundle size < 5KB gzipped

## Common Pitfalls to Avoid

1. **Don't forget polyfills** - Dialog element needs polyfill for older browsers
2. **Test with real screen readers** - NVDA, JAWS, VoiceOver
3. **Handle rapid open/close** - Debounce or queue animations
4. **Memory leaks** - Clean up event listeners and refs
5. **Z-index conflicts** - Dialog element handles this automatically
6. **Focus trap edge cases** - Hidden elements, dynamic content
7. **Animation interruption** - Handle mid-animation state changes

## External Resources

- [MDN Dialog Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
- [W3C WAI-ARIA Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [React Portals Documentation](https://react.dev/reference/react-dom/createPortal)
- [Dialog Polyfill](https://github.com/GoogleChrome/dialog-polyfill)

## Conclusion

This modal infrastructure provides a solid, accessible foundation for all modal-based interactions in the HSA Songbook. By using the native dialog element with proper focus management and animations, we ensure excellent user experience while maintaining small bundle size and high performance.

**Confidence Score: 9.5/10** - The native dialog element with TypeScript provides a robust, accessible solution that aligns perfectly with the application's architecture.