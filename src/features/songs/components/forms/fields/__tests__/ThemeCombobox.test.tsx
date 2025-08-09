import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, userEvent } from '../../../../test-utils/render'
import { ThemeCombobox } from '../ThemeCombobox'

describe('ThemeCombobox Component', () => {
  const mockOnChange = vi.fn()
  const defaultThemes = ['worship', 'praise', 'prayer', 'salvation', 'grace', 'christmas', 'easter']
  
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
      const selectedThemes = ['worship', 'praise']
      
      render(
        <ThemeCombobox
          value={selectedThemes}
          onChange={mockOnChange}
        />
      )
      
      expect(screen.getByText('worship')).toBeInTheDocument()
      expect(screen.getByText('praise')).toBeInTheDocument()
    })
    
    it('shows theme count', () => {
      const selectedThemes = ['worship', 'praise', 'prayer']
      
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
      const selectedThemes = ['worship', 'praise', 'prayer']
      
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
        expect(screen.getByText('worship')).toBeInTheDocument()
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
        expect(screen.getByText('christmas')).toBeInTheDocument()
        expect(screen.queryByText('worship')).not.toBeInTheDocument()
      })
    })
    
    it('shows "no results" when no matches', async () => {
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
        expect(screen.getByText(/no themes found/i)).toBeInTheDocument()
      })
    })
    
    it('allows adding custom themes', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
          allowCustom={true}
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
    it('normalizes themes to lowercase', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={[]}
          onChange={mockOnChange}
        />
      )
      
      const input = screen.getByRole('combobox')
      await user.type(input, 'WORSHIP')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['worship'])
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
        expect(mockOnChange).toHaveBeenCalledWith(['worship'])
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
        expect(mockOnChange).toHaveBeenCalledWith(['worship'])
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
      
      expect(mockOnChange).toHaveBeenCalledWith(['worship'])
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
        expect(screen.getByText('worship')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('worship'))
      
      expect(mockOnChange).toHaveBeenCalledWith(['worship'])
    })
    
    it('removes theme when clicking X on chip', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={['worship', 'praise']}
          onChange={mockOnChange}
        />
      )
      
      // Find the remove button for worship theme
      const worshipChip = screen.getByText('worship').closest('div')
      const removeButton = worshipChip?.querySelector('button[aria-label*="Remove"]')
      
      if (removeButton) {
        await user.click(removeButton)
        expect(mockOnChange).toHaveBeenCalledWith(['praise'])
      }
    })
    
    it('prevents duplicate themes', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeCombobox
          value={['worship']}
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
      const currentThemes = ['worship', 'praise', 'prayer']
      
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
      const currentThemes = ['worship', 'praise', 'prayer', 'grace', 'salvation', 'christmas', 'easter', 'communion']
      
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
        expect(screen.getByText('worship')).toBeInTheDocument()
      })
      
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.queryByText('worship')).not.toBeInTheDocument()
      })
    })
    
    it('supports Tab to select highlighted suggestion', async () => {
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
        expect(screen.getByText('worship')).toBeInTheDocument()
      })
      
      await user.keyboard('{Tab}')
      
      expect(mockOnChange).toHaveBeenCalledWith(['worship'])
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
      expect(input).toHaveClass('border-red-500')
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
      expect(input).toHaveAttribute('aria-label', 'Select Themes')
      expect(input).toHaveAttribute('aria-autocomplete', 'list')
    })
    
    it('announces selected themes to screen readers', () => {
      render(
        <ThemeCombobox
          value={['worship', 'praise']}
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
      
      // Tab to first theme chip remove button
      await user.tab()
      await user.tab()
      
      // Press Enter to remove
      await user.keyboard('{Enter}')
      
      expect(mockOnChange).toHaveBeenCalledWith([])
    })
  })
})