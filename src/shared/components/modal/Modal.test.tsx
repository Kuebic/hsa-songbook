import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'
import { ModalProvider } from './ModalProvider'

// Mock console.error to avoid noise in test output
const originalError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalError
})

describe('Modal Component', () => {
  const mockOnClose = vi.fn()
  
  beforeEach(() => {
    mockOnClose.mockClear()
    // Mock HTMLDialogElement methods if not available in test environment
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = vi.fn()
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = vi.fn()
    }
  })
  
  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      )
      
      expect(screen.getByText('Modal content')).toBeInTheDocument()
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })
    
    it('renders dialog but closed when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      )
      
      // Dialog element should exist but be closed
      const dialog = screen.getByTestId('modal')
      expect(dialog).toBeInTheDocument()
      // Check that close animation is applied
      expect(dialog.style.animation).toContain('modalFadeOut')
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
    
    it('applies correct size styles', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose} size="small">
          <p>Content</p>
        </Modal>
      )
      
      let dialog = screen.getByTestId('modal')
      expect(dialog.style.maxWidth).toBe('400px')
      
      rerender(
        <Modal isOpen={true} onClose={mockOnClose} size="large">
          <p>Content</p>
        </Modal>
      )
      
      dialog = screen.getByTestId('modal')
      expect(dialog.style.maxWidth).toBe('900px')
    })
    
    it('applies custom className', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} className="custom-modal">
          <p>Content</p>
        </Modal>
      )
      
      expect(screen.getByTestId('modal')).toHaveClass('custom-modal')
    })
    
    it('uses custom testId', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} testId="custom-test-id">
          <p>Content</p>
        </Modal>
      )
      
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument()
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
    
    it('does not render close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} showCloseButton={false}>
          <p>Content</p>
        </Modal>
      )
      
      expect(screen.queryByLabelText('Close dialog')).not.toBeInTheDocument()
    })
    
    it('calls onClose when clicking outside the modal', async () => {
      const user = userEvent.setup()
      
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={true}>
          <p>Content</p>
        </Modal>
      )
      
      const dialog = screen.getByTestId('modal')
      await user.click(dialog)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
    
    it('does not close when clicking inside the modal content', async () => {
      const user = userEvent.setup()
      
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={true}>
          <p>Content</p>
        </Modal>
      )
      
      await user.click(screen.getByText('Content'))
      expect(mockOnClose).not.toHaveBeenCalled()
    })
    
    it('does not close on overlay click when closeOnOverlayClick is false', async () => {
      const user = userEvent.setup()
      
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
          <p>Content</p>
        </Modal>
      )
      
      const dialog = screen.getByTestId('modal')
      await user.click(dialog)
      expect(mockOnClose).not.toHaveBeenCalled()
    })
    
    it('handles ESC key press when closeOnEsc is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnEsc={true}>
          <p>Content</p>
        </Modal>
      )
      
      const dialog = screen.getByTestId('modal')
      const cancelEvent = new Event('cancel', { bubbles: true })
      
      // Mock preventDefault to verify it's called
      const preventDefault = vi.fn()
      Object.defineProperty(cancelEvent, 'preventDefault', { value: preventDefault })
      
      dialog.dispatchEvent(cancelEvent)
      
      expect(preventDefault).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
    
    it('does not close on ESC when closeOnEsc is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnEsc={false}>
          <p>Content</p>
        </Modal>
      )
      
      const dialog = screen.getByTestId('modal')
      const cancelEvent = new Event('cancel', { bubbles: true })
      
      // Mock preventDefault
      const preventDefault = vi.fn()
      Object.defineProperty(cancelEvent, 'preventDefault', { value: preventDefault })
      
      dialog.dispatchEvent(cancelEvent)
      
      expect(preventDefault).toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
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
          testId="test-modal"
        >
          <p>Content</p>
        </Modal>
      )
      
      const dialog = screen.getByTestId('test-modal')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'test-modal-title')
      expect(dialog).toHaveAttribute('aria-describedby', 'test-modal-description')
    })
    
    it('has aria-label when no title is provided', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Content</p>
        </Modal>
      )
      
      const dialog = screen.getByTestId('modal')
      expect(dialog).toHaveAttribute('aria-label', 'Dialog')
      expect(dialog).not.toHaveAttribute('aria-labelledby')
    })
    
    it('manages focus correctly', async () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <button>Focus me</button>
        </Modal>
      )
      
      // Create and focus a trigger button
      const triggerButton = document.createElement('button')
      triggerButton.textContent = 'Trigger'
      document.body.appendChild(triggerButton)
      triggerButton.focus()
      expect(document.activeElement).toBe(triggerButton)
      
      // Open modal
      rerender(
        <Modal isOpen={true} onClose={mockOnClose}>
          <button>Focus me</button>
        </Modal>
      )
      
      // Focus should move to first focusable element in modal (the close button)
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close dialog')
        expect(closeButton).toHaveFocus()
      })
      
      // Close modal
      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <button>Focus me</button>
        </Modal>
      )
      
      // Focus should return to trigger
      await waitFor(() => {
        expect(triggerButton).toHaveFocus()
      })
      
      // Cleanup
      document.body.removeChild(triggerButton)
    })
    
    it('respects initialFocusRef', async () => {
      const buttonRef = { current: null as HTMLElement | null }
      
      render(
        <Modal isOpen={true} onClose={mockOnClose} initialFocusRef={buttonRef as React.RefObject<HTMLElement>}>
          <div>
            <button>First button</button>
            <button ref={el => { buttonRef.current = el }}>Second button</button>
          </div>
        </Modal>
      )
      
      await waitFor(() => {
        expect(buttonRef.current).toHaveFocus()
      })
    })
    
    it('respects finalFocusRef', async () => {
      const finalRef = { current: null as HTMLElement | null }
      
      const { rerender } = render(
        <div>
          <button ref={el => { finalRef.current = el }}>Final focus target</button>
          <Modal isOpen={true} onClose={mockOnClose} finalFocusRef={finalRef as React.RefObject<HTMLElement>}>
            <button>Modal button</button>
          </Modal>
        </div>
      )
      
      // Close modal
      rerender(
        <div>
          <button ref={el => { finalRef.current = el }}>Final focus target</button>
          <Modal isOpen={false} onClose={mockOnClose} finalFocusRef={finalRef as React.RefObject<HTMLElement>}>
            <button>Modal button</button>
          </Modal>
        </div>
      )
      
      await waitFor(() => {
        expect(finalRef.current).toHaveFocus()
      })
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
    
    it('only top modal responds to ESC', () => {
      const onClose1 = vi.fn()
      const onClose2 = vi.fn()
      
      render(
        <ModalProvider>
          <Modal isOpen={true} onClose={onClose1} testId="modal1" closeOnEsc={true}>
            <p>Modal 1</p>
          </Modal>
          <Modal isOpen={true} onClose={onClose2} testId="modal2" closeOnEsc={true}>
            <p>Modal 2</p>
          </Modal>
        </ModalProvider>
      )
      
      // Simulate ESC on second modal
      const modal2 = screen.getByTestId('modal2')
      const cancelEvent = new Event('cancel', { bubbles: true })
      Object.defineProperty(cancelEvent, 'preventDefault', { value: vi.fn() })
      
      modal2.dispatchEvent(cancelEvent)
      
      expect(onClose2).toHaveBeenCalled()
      expect(onClose1).not.toHaveBeenCalled()
    })
  })
  
  describe('Animation', () => {
    it('applies animation styles when opening', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} animationDuration={300}>
          <p>Content</p>
        </Modal>
      )
      
      const dialog = screen.getByTestId('modal')
      expect(dialog.style.animation).toContain('modalFadeIn')
      expect(dialog.style.animation).toContain('300ms')
    })
    
    it('applies close animation before closing', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose} animationDuration={200}>
          <p>Content</p>
        </Modal>
      )
      
      rerender(
        <Modal isOpen={false} onClose={mockOnClose} animationDuration={200}>
          <p>Content</p>
        </Modal>
      )
      
      const dialog = screen.getByTestId('modal')
      expect(dialog.style.animation).toContain('modalFadeOut')
      expect(dialog.style.animation).toContain('200ms')
    })
  })
})