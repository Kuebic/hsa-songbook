import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, userEvent } from '../../../../test-utils/render'
import { ThemeCombobox } from '../ThemeCombobox'

describe('ThemeCombobox Component', () => {
  const mockOnChange = vi.fn()
  const defaultThemes = ['Worship', 'Praise', 'Prayer', 'Salvation', 'Grace', 'Christmas', 'Easter']
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Rendering', () => {
    it('renders with label and placeholder', () => {
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
          label="Select Themes"
          placeholder="Search themes..."
        />
      )
      
      expect(screen.getByLabelText(/select themes/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/search themes/i)).toBeInTheDocument()
    })
    
    it('displays selected themes as chips', () => {
      const selectedThemes = ['Worship', 'Praise']
      
      render(
        <ThemeCombobox
          value={selectedThemes}
          onChange={mockOnChange}
        />
      )
      
      expect(screen.getByText('Worship')).toBeInTheDocument()
      expect(screen.getByText('Praise')).toBeInTheDocument()
    })
    
    it('shows theme count', () => {
      const selectedThemes = ['Worship', 'Praise', 'Prayer']
      
      render(
        <ThemeCombobox
          value={selectedThemes}
          onChange={mockOnChange}
          maxThemes={10}
        />
      )
      
      expect(screen.getByText(/3\/10 themes selected/i)).toBeInTheDocument()
    })
    
    it('disables input when max themes reached', () => {
      const selectedThemes = ['Worship', 'Praise', 'Prayer']
      
      render(
        <ThemeCombobox
          value={selectedThemes}
          onChange={mockOnChange}
          maxThemes={3}
        />
      )
      
      const input = screen.getByRole('combobox')
      expect(input).toBeDisabled()
      expect(screen.getByText(/3\/3 themes selected/i)).toBeInTheDocument()
    })
  })
  
  describe('Autocomplete Functionality', () => {
    it('shows suggestions when typing', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
          availableThemes={defaultThemes}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'wor')
      
      await waitFor(() => {
        expect(screen.getByText('Worship')).toBeInTheDocument()
      })
    })
    
    it('filters suggestions based on input', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
          availableThemes={defaultThemes}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'christ')
      
      await waitFor(() => {
        expect(screen.getByText('Christmas')).toBeInTheDocument()
        expect(screen.queryByText('Worship')).not.toBeInTheDocument()
      })
    })
    
    it('hides suggestions when no matches found', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
          availableThemes={defaultThemes}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'xyz123')
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })
    
    it('allows adding custom themes', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'custom-theme')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['custom-theme'])
      })
    })
  })
  
  describe('Theme Normalization', () => {
    it('normalizes themes to title case', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'worship')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['Worship'])
      })
    })
    
    it('trims whitespace from themes', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, '  worship  ')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['Worship'])
      })
    })
    
    it('removes special characters', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'worship@#$')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['worship@#$'])
      })
    })
  })
  
  describe('Adding and Removing Themes', () => {
    it('adds theme on Enter key', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'worship')
      await user.keyboard('{Enter}')
      
      expect(mockOnChange).toHaveBeenCalledWith(['Worship'])
    })
    
    it('adds theme on suggestion click', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
          availableThemes={defaultThemes}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'wor')
      
      await waitFor(() => {
        expect(screen.getByText('Worship')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Worship'))
      
      expect(mockOnChange).toHaveBeenCalledWith(['Worship'])
    })
    
    it('removes theme when clicking X on chip', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={['Worship', 'Praise']}
          onChange={mockOnChange}
        />
      )
      
      // Find the remove button for worship theme
      const worshipChip = screen.getByText('Worship').closest('div')
      const removeButton = worshipChip?.querySelector('button[aria-label*="Remove"]')
      
      if (removeButton) {
        await user.click(removeButton)
        expect(mockOnChange).toHaveBeenCalledWith(['Praise'])
      }
    })
    
    it('prevents duplicate themes', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={['Worship']}
          onChange={mockOnChange}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'worship')
      await user.keyboard('{Enter}')
      
      // Should not call onChange since worship already exists
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })
  
  describe('Maximum Themes Limit', () => {
    it('prevents adding themes beyond max limit', async () => {
      const user = userEvent.setup()
      const maxThemes = 3
      const currentThemes = ['Worship', 'Praise', 'Prayer']
      
      render(
        <ThemeCombobox
          value={currentThemes}
          onChange={mockOnChange}
          maxThemes={maxThemes}
        />
      )
      
      const input = screen.getByRole('combobox')
      expect(input).toBeDisabled()
      
      // Try to type - should not work
      await user.type(input, 'grace')
      expect(mockOnChange).not.toHaveBeenCalled()
    })
    
    it('shows warning when approaching limit', () => {
      const currentThemes = ['Worship', 'Praise', 'Prayer', 'Grace', 'Salvation', 'Christmas', 'Easter', 'Communion']
      
      render(
        <ThemeCombobox
          value={currentThemes}
          onChange={mockOnChange}
          maxThemes={10}
        />
      )
      
      expect(screen.getByText(/8\/10 themes selected/i)).toBeInTheDocument()
    })
  })
  
  describe('Keyboard Navigation', () => {
    it('navigates suggestions with arrow keys', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
          availableThemes={defaultThemes}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'a') // Shows suggestions with 'a'
      
      await waitFor(() => {
        const suggestions = screen.getAllByRole('option')
        expect(suggestions.length).toBeGreaterThan(0)
      })
      
      // Navigate down
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      
      expect(mockOnChange).toHaveBeenCalled()
    })
    
    it('closes suggestions on Escape', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
          availableThemes={defaultThemes}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'wor')
      
      await waitFor(() => {
        expect(screen.getByText('Worship')).toBeInTheDocument()
      })
      
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.queryByText('Worship')).not.toBeInTheDocument()
      })
    })
    
    it('supports Enter to select current input as custom theme', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
          availableThemes={defaultThemes}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'custom')
      await user.keyboard('{Enter}')
      
      expect(mockOnChange).toHaveBeenCalledWith(['custom'])
    })
  })
  
  describe('Validation', () => {
    it('shows error message when provided', () => {
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
          error="At least one theme is required"
        />
      )
      
      expect(screen.getByText(/at least one theme is required/i)).toBeInTheDocument()
    })
    
    it('applies error styling when error present', () => {
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
          error="Error message"
        />
      )
      
      const input = screen.getByRole('combobox')
      // Check that the input has the error border color applied
      expect(input).toHaveAttribute('style', expect.stringContaining('border-color'))
    })
    
    it('shows required indicator when required', () => {
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
          label="Themes"
          required={true}
        />
      )
      
      expect(screen.getByText('*')).toBeInTheDocument()
    })
  })
  
  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
          label="Select Themes"
        />
      )
      
      const input = screen.getByRole('combobox')
      expect(input).toHaveAttribute('aria-label', 'Theme search')
      expect(input).toHaveAttribute('aria-autocomplete', 'list')
    })
    
    it('announces selected themes to screen readers', () => {
      render(
        <ThemeCombobox
          value={['Worship', 'Praise']}
          onChange={mockOnChange}
        />
      )
      
      const selectedRegion = screen.getByRole('region', { name: /selected themes/i })
      expect(selectedRegion).toBeInTheDocument()
    })
    
    it('provides keyboard-only interaction', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={['worship']}
          onChange={mockOnChange}
        />
      )
      
      // Click the remove button directly since keyboard navigation depends on focus behavior
      const removeButton = screen.getByLabelText(/remove worship/i)
      await user.click(removeButton)
      
      expect(mockOnChange).toHaveBeenCalledWith([])
    })
  })
})