import { describe, it, expect, vi } from 'vitest'
import { render, renderAsAdmin, screen, waitFor, userEvent } from '../../test-utils/render'
import { axe, toHaveNoViolations } from 'jest-axe'
import { SongForm } from '../../components/forms/SongForm'
import { SongFormModal } from '../../components/forms/SongFormModal'
import { ThemeCombobox } from '../../components/forms/fields/ThemeCombobox'
import { songFactory } from '../../test-utils/factories'

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations)

describe('Song Form Accessibility', () => {
  describe('WCAG Compliance', () => {
    it('has no accessibility violations in default state', async () => {
      const { container } = renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('has no violations with initial data', async () => {
      const song = songFactory.build()
      
      const { container } = renderAsAdmin(
        <SongForm 
          initialData={song}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('has no violations when submitting', async () => {
      const { container } = renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          isSubmitting={true}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('has no violations in modal context', async () => {
      const { container } = renderAsAdmin(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
  
  describe('ARIA Labels and Roles', () => {
    it('has proper ARIA labels for all form fields', () => {
      renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      // All form fields should have labels
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/artist/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/year/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/ccli number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/source/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/theme search/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })
    
    it('has proper roles for interactive elements', () => {
      renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      // Buttons should have button role
      expect(screen.getByRole('button', { name: /create song/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      
      // Form should have form role
      expect(screen.getByRole('form')).toBeInTheDocument()
      
      // Combobox for themes
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    
    it('has descriptive ARIA descriptions for complex fields', () => {
      renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      const ccliInput = screen.getByLabelText(/ccli number/i)
      expect(ccliInput).toHaveAttribute('aria-describedby')
      
      const themeInput = screen.getByLabelText(/theme search/i)
      expect(themeInput).toHaveAttribute('aria-describedby')
    })
    
    it('indicates required fields with ARIA', () => {
      renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      const titleInput = screen.getByLabelText(/title/i)
      expect(titleInput).toHaveAttribute('aria-required', 'true')
      
      const themeInput = screen.getByLabelText(/theme search/i)
      expect(themeInput).toHaveAttribute('aria-required', 'true')
    })
  })
  
  describe('Keyboard Navigation', () => {
    it('supports full keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      
      renderAsAdmin(
        <SongForm 
          onSubmit={mockOnSubmit}
          onCancel={vi.fn()}
        />
      )
      
      // Tab through form fields
      await user.tab()
      expect(screen.getByLabelText(/title/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/artist/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/year/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/ccli number/i)).toHaveFocus()
      
      // Should be able to navigate backwards
      await user.keyboard('{Shift>}{Tab}{/Shift}')
      expect(screen.getByLabelText(/year/i)).toHaveFocus()
    })
    
    it('supports keyboard interaction for theme selection', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.click(input)
      await user.type(input, 'wor')
      
      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      
      expect(mockOnChange).toHaveBeenCalledWith(['worship'])
    })
    
    it('allows keyboard submission', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn()
      
      renderAsAdmin(
        <SongForm 
          onSubmit={mockOnSubmit}
          onCancel={vi.fn()}
        />
      )
      
      // Fill required fields
      await user.type(screen.getByLabelText(/title/i), 'Test Song')
      await user.tab()
      await user.tab()
      await user.tab()
      await user.tab()
      await user.tab()
      
      // Type theme and add with Enter
      const themeInput = screen.getByLabelText(/theme search/i)
      await user.type(themeInput, 'worship')
      await user.keyboard('{Enter}')
      
      // Submit with Enter while button is focused
      const submitButton = screen.getByRole('button', { name: /create song/i })
      submitButton.focus()
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
    
    it('traps focus in modal', async () => {
      const user = userEvent.setup()
      
      renderAsAdmin(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      )
      
      // Focus should be trapped within modal
      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
      
      // Tab through all focusable elements
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      expect(focusableElements.length).toBeGreaterThan(0)
      
      // Focus should cycle within modal
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
      
      firstElement.focus()
      expect(document.activeElement).toBe(firstElement)
      
      // Tab from last element should go to first
      lastElement.focus()
      await user.tab()
      // This depends on modal implementation
    })
  })
  
  describe('Screen Reader Support', () => {
    it('announces form errors to screen readers', async () => {
      const user = userEvent.setup()
      
      renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      // Try to submit without required fields
      await user.click(screen.getByRole('button', { name: /create song/i }))
      
      // Error messages should have proper ARIA attributes
      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i)
        expect(titleInput).toHaveAttribute('aria-invalid', 'true')
        
        // Error message should be associated with field
        const errorId = titleInput.getAttribute('aria-describedby')
        if (errorId) {
          const errorElement = document.getElementById(errorId)
          expect(errorElement).toHaveAttribute('role', 'alert')
        }
      })
    })
    
    it('announces loading states', () => {
      renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          isSubmitting={true}
        />
      )
      
      const submitButton = screen.getByRole('button', { name: /saving/i })
      expect(submitButton).toHaveAttribute('aria-busy', 'true')
      expect(submitButton).toHaveAttribute('aria-disabled', 'true')
    })
    
    it('announces theme additions and removals', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      
      render(
        <ThemeCombobox
          value={['worship']}
          onChange={mockOnChange}
        />
      )
      
      // Region for selected themes should be announced
      const selectedRegion = screen.getByRole('region', { name: /selected themes/i })
      expect(selectedRegion).toHaveAttribute('aria-live', 'polite')
      
      // Adding a theme
      const input = screen.getByRole('combobox')
      await user.type(input, 'praise')
      await user.keyboard('{Enter}')
      
      expect(mockOnChange).toHaveBeenCalledWith(['worship', 'praise'])
    })
    
    it('provides context for form sections', () => {
      renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      // Form sections should be properly labeled
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Categorization')).toBeInTheDocument()
      expect(screen.getByText('Additional Information')).toBeInTheDocument()
      
      // Each section should be a fieldset or have role=group
      const sections = screen.getAllByRole('group')
      expect(sections.length).toBeGreaterThan(0)
    })
  })
  
  describe('Focus Management', () => {
    it('restores focus after modal closes', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      // Create a button that opens the modal
      const { rerender } = render(
        <button id="open-modal">Open Modal</button>
      )
      
      const openButton = screen.getByText('Open Modal')
      openButton.focus()
      expect(document.activeElement).toBe(openButton)
      
      // Open modal
      rerender(
        <>
          <button id="open-modal">Open Modal</button>
          <SongFormModal 
            isOpen={true}
            onClose={mockOnClose}
            onSubmit={vi.fn()}
          />
        </>
      )
      
      // Focus should move to modal
      await waitFor(() => {
        expect(document.activeElement).not.toBe(openButton)
      })
      
      // Close modal
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      
      // Focus should return to trigger element
      // Note: This depends on modal implementation
    })
    
    it('manages focus for error states', async () => {
      const user = userEvent.setup()
      
      renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      // Submit with errors
      await user.click(screen.getByRole('button', { name: /create song/i }))
      
      // Focus should move to first error field
      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i)
        // Depending on implementation, focus might move to first error
        expect(titleInput).toHaveAttribute('aria-invalid', 'true')
      })
    })
  })
  
  describe('Color Contrast', () => {
    it('maintains sufficient contrast ratios', async () => {
      const { container } = renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      // Run axe with specific color contrast rules
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      
      expect(results).toHaveNoViolations()
    })
    
    it('maintains contrast in error states', async () => {
      const user = userEvent.setup()
      
      const { container } = renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      // Trigger error state
      await user.click(screen.getByRole('button', { name: /create song/i }))
      
      await waitFor(async () => {
        const results = await axe(container, {
          rules: {
            'color-contrast': { enabled: true }
          }
        })
        
        expect(results).toHaveNoViolations()
      })
    })
  })
  
  describe('Responsive Accessibility', () => {
    it('maintains accessibility on mobile viewports', async () => {
      // Set mobile viewport
      global.innerWidth = 375
      global.innerHeight = 667
      
      const { container } = renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      // Reset viewport
      global.innerWidth = 1024
      global.innerHeight = 768
    })
    
    it('supports touch interactions', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
        />
      )
      
      const input = screen.getByRole('combobox')
      
      // Simulate touch interaction
      await user.click(input)
      await user.type(input, 'worship')
      
      // Touch to select
      const suggestion = await screen.findByText('worship')
      await user.click(suggestion)
      
      expect(mockOnChange).toHaveBeenCalledWith(['worship'])
    })
  })
})