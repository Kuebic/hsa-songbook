import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import { InlineEditField } from '../InlineEditField'

describe('InlineEditField', () => {
  const mockSave = vi.fn()
  const defaultProps = {
    value: 'Initial Value',
    onSave: mockSave,
    ariaLabel: 'Test field',
    canEdit: true
  }
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should render value in view mode', () => {
    render(<InlineEditField {...defaultProps} />)
    expect(screen.getByText('Initial Value')).toBeInTheDocument()
  })
  
  it('should show edit icon on hover', async () => {
    const user = userEvent.setup()
    render(<InlineEditField {...defaultProps} />)
    
    const button = screen.getByRole('button')
    await user.hover(button)
    
    // The icon exists but visibility is controlled by CSS which doesn't apply in tests
    expect(screen.getByText('✏️')).toBeInTheDocument()
  })
  
  it('should enter edit mode when clicked', async () => {
    const user = userEvent.setup()
    render(<InlineEditField {...defaultProps} />)
    
    await user.click(screen.getByRole('button'))
    
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('Initial Value')
    expect(input).toHaveFocus()
  })
  
  it('should save on Enter key', async () => {
    const user = userEvent.setup()
    mockSave.mockResolvedValueOnce(undefined)
    
    render(<InlineEditField {...defaultProps} />)
    
    await user.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, 'New Value')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith('New Value')
    })
  })
  
  it('should save on blur', async () => {
    const user = userEvent.setup()
    mockSave.mockResolvedValueOnce(undefined)
    
    render(<InlineEditField {...defaultProps} />)
    
    await user.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, 'New Value')
    await user.tab() // Blur the input
    
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith('New Value')
    })
  })
  
  it('should cancel on Escape key', async () => {
    const user = userEvent.setup()
    render(<InlineEditField {...defaultProps} />)
    
    await user.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, 'Changed Value')
    await user.keyboard('{Escape}')
    
    expect(screen.getByText('Initial Value')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
  
  it('should validate input with custom validator', async () => {
    const user = userEvent.setup()
    const validator = z.string().min(5, 'Minimum 5 characters')
    
    render(
      <InlineEditField 
        {...defaultProps} 
        validator={validator}
      />
    )
    
    await user.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, 'Hi')
    await user.keyboard('{Enter}')
    
    expect(screen.getByRole('alert')).toHaveTextContent('Minimum 5 characters')
    expect(mockSave).not.toHaveBeenCalled()
  })
  
  it('should show error state with red border', async () => {
    const user = userEvent.setup()
    const validator = z.string().min(5, 'Too short')
    
    render(
      <InlineEditField 
        {...defaultProps} 
        validator={validator}
      />
    )
    
    await user.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, 'Hi')
    await user.keyboard('{Enter}')
    
    expect(input).toHaveStyle({ border: '2px solid #ef4444' })
  })
  
  it('should disable input while saving', async () => {
    const user = userEvent.setup()
    let resolveSave: () => void
    const slowSave = new Promise<void>((resolve) => {
      resolveSave = resolve
    })
    mockSave.mockReturnValueOnce(slowSave)
    
    render(<InlineEditField {...defaultProps} />)
    
    await user.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, 'New Value')
    await user.keyboard('{Enter}')
    
    expect(input).toBeDisabled()
    expect(input).toHaveStyle({ background: '#f3f4f6' })
    
    resolveSave!()
    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
  })
  
  it('should not render edit button when canEdit is false', () => {
    render(<InlineEditField {...defaultProps} canEdit={false} />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Initial Value')).toBeInTheDocument()
  })
  
  it('should have proper accessibility attributes', async () => {
    const user = userEvent.setup()
    render(<InlineEditField {...defaultProps} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Test field. Click to edit.')
    
    await user.click(button)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-label', 'Test field')
    expect(input).toHaveAttribute('aria-describedby', 'edit-hint')
    
    const hint = screen.getByText('Press Enter to save, Escape to cancel')
    expect(hint).toHaveClass('visually-hidden')
  })
  
  it('should handle save errors gracefully', async () => {
    const user = userEvent.setup()
    const error = new Error('Network error')
    mockSave.mockRejectedValueOnce(error)
    
    render(<InlineEditField {...defaultProps} />)
    
    await user.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, 'New Value')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error')
    })
    
    // Should stay in edit mode on error
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})