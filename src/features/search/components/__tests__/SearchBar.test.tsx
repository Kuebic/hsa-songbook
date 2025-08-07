import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from '../SearchBar'
import { useState } from 'react'

// Helper component for testing controlled input behavior
function SearchBarWrapper({ onChange, ...props }: Parameters<typeof SearchBar>[0]) {
  const [value, setValue] = useState(props.value || '')
  
  const handleChange = (newValue: string) => {
    setValue(newValue)
    onChange?.(newValue)
  }
  
  return <SearchBar {...props} value={value} onChange={handleChange} />
}

describe('SearchBar', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    placeholder: 'Search songs, artists, themes...'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default placeholder', () => {
    render(<SearchBar {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search songs, artists, themes...')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('renders with custom placeholder', () => {
    const customPlaceholder = 'Find your favorite hymns...'
    render(<SearchBar {...defaultProps} placeholder={customPlaceholder} />)
    
    const input = screen.getByPlaceholderText(customPlaceholder)
    expect(input).toBeInTheDocument()
  })

  it('displays the current value', () => {
    render(<SearchBar {...defaultProps} value="Amazing Grace" />)
    
    const input = screen.getByDisplayValue('Amazing Grace')
    expect(input).toBeInTheDocument()
  })

  it('calls onChange when user types', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    
    render(<SearchBarWrapper {...defaultProps} onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'Amazing')
    
    expect(mockOnChange).toHaveBeenCalledTimes(7) // "Amazing" has 7 characters
    expect(mockOnChange.mock.calls[6][0]).toBe('Amazing')
  })

  it('calls onChange for each character typed', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    
    render(<SearchBarWrapper {...defaultProps} onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'Hi')
    
    expect(mockOnChange.mock.calls[0][0]).toBe('H')
    expect(mockOnChange.mock.calls[1][0]).toBe('Hi')
  })

  it('shows search icon', () => {
    render(<SearchBar {...defaultProps} />)
    
    const searchIcon = screen.getByText('🔍')
    expect(searchIcon).toBeInTheDocument()
    expect(searchIcon).toHaveStyle({ pointerEvents: 'none' })
  })

  it('shows clear button when value is provided', () => {
    render(<SearchBar {...defaultProps} value="test query" />)
    
    const clearButton = screen.getByLabelText('Clear search')
    expect(clearButton).toBeInTheDocument()
    expect(clearButton).toHaveTextContent('×')
  })

  it('does not show clear button when value is empty', () => {
    render(<SearchBar {...defaultProps} value="" />)
    
    const clearButton = screen.queryByLabelText('Clear search')
    expect(clearButton).not.toBeInTheDocument()
  })

  it('calls onClear when clear button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnClear = vi.fn()
    
    render(<SearchBar {...defaultProps} value="test query" onClear={mockOnClear} />)
    
    const clearButton = screen.getByLabelText('Clear search')
    await user.click(clearButton)
    
    expect(mockOnClear).toHaveBeenCalledTimes(1)
  })

  it('changes border color on focus', async () => {
    const user = userEvent.setup()
    render(<SearchBar {...defaultProps} />)
    
    const input = screen.getByRole('textbox')
    
    // Initial border color
    expect(input).toHaveStyle({ border: '2px solid #e2e8f0' })
    
    // Focus the input
    await user.click(input)
    expect(input).toHaveStyle({ border: '2px solid #3b82f6' })
  })

  it('changes border color back on blur', async () => {
    const user = userEvent.setup()
    render(<SearchBar {...defaultProps} />)
    
    const input = screen.getByRole('textbox')
    
    // Focus and then blur
    await user.click(input)
    expect(input).toHaveStyle({ border: '2px solid #3b82f6' })
    
    await user.tab() // This will blur the input
    expect(input).toHaveStyle({ border: '2px solid #e2e8f0' })
  })

  it('handles input changes correctly', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    
    render(<SearchBarWrapper {...defaultProps} onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, 'new search term')
    
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1]
    expect(lastCall[0]).toBe('new search term')
  })

  it('clears input when clear button is used', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    const mockOnClear = vi.fn()
    
    render(
      <SearchBar 
        {...defaultProps} 
        value="current search" 
        onChange={mockOnChange}
        onClear={mockOnClear} 
      />
    )
    
    const clearButton = screen.getByLabelText('Clear search')
    await user.click(clearButton)
    
    expect(mockOnClear).toHaveBeenCalledTimes(1)
    // onClear should handle clearing the value, not onChange
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('has correct accessibility attributes', () => {
    render(<SearchBar {...defaultProps} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    
    const clearButton = screen.queryByLabelText('Clear search')
    if (clearButton) {
      expect(clearButton).toHaveAttribute('aria-label', 'Clear search')
    }
  })

  it('applies correct styling to input', () => {
    render(<SearchBar {...defaultProps} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveStyle({
      width: '100%',
      padding: '0.75rem 2.5rem 0.75rem 2.5rem',
      fontSize: '1rem',
      borderRadius: '8px',
      outline: 'none'
    })
  })

  it('positions search icon correctly', () => {
    render(<SearchBar {...defaultProps} />)
    
    const searchIcon = screen.getByText('🔍')
    expect(searchIcon).toHaveStyle({
      position: 'absolute',
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)'
    })
  })

  it('positions clear button correctly when visible', () => {
    render(<SearchBar {...defaultProps} value="test" />)
    
    const clearButton = screen.getByLabelText('Clear search')
    expect(clearButton).toHaveStyle({
      position: 'absolute',
      right: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)'
    })
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    const mockOnClear = vi.fn()
    
    render(<SearchBar {...defaultProps} value="test query" onClear={mockOnClear} />)
    
    const input = screen.getByRole('textbox')
    const clearButton = screen.getByLabelText('Clear search')
    
    // Focus input first
    await user.click(input)
    expect(input).toHaveFocus()
    
    // Tab to clear button
    await user.tab()
    expect(clearButton).toHaveFocus()
    
    // Press Enter on clear button
    await user.keyboard('{Enter}')
    expect(mockOnClear).toHaveBeenCalledTimes(1)
  })
})