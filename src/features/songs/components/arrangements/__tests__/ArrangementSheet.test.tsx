import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArrangementSheet } from '../ArrangementSheet'
import { arrangementFactory } from '../../../test-utils/factories'

// Mock dependencies
vi.mock('../../../hooks/useArrangementMutations', () => ({
  useArrangementMutations: () => ({
    createArrangement: vi.fn().mockResolvedValue({ id: '1', name: 'New Arrangement' }),
    updateArrangement: vi.fn().mockResolvedValue({ id: '1', name: 'Updated Arrangement' }),
    deleteArrangement: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
    error: null
  })
}))

vi.mock('@shared/components/notifications', () => ({
  useNotification: () => ({
    addNotification: vi.fn()
  })
}))

describe('ArrangementSheet', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    songId: 'song-1',
    songTitle: 'Test Song',
    onSuccess: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create mode correctly', () => {
    render(<ArrangementSheet {...defaultProps} />)
    
    expect(screen.getByText('Add New Arrangement')).toBeInTheDocument()
    expect(screen.getByText('Creating arrangement for "Test Song"')).toBeInTheDocument()
    expect(screen.getByText('Create Arrangement')).toBeInTheDocument()
  })

  it('renders edit mode correctly', () => {
    const arrangement = arrangementFactory.build({
      id: 'arr-1',
      name: 'Existing Arrangement'
    })
    
    render(
      <ArrangementSheet 
        {...defaultProps} 
        arrangement={arrangement}
      />
    )
    
    expect(screen.getByText('Edit Arrangement: Existing Arrangement')).toBeInTheDocument()
    expect(screen.getByText('Update Arrangement')).toBeInTheDocument()
  })

  it('handles form submission for creating new arrangement', async () => {
    const user = userEvent.setup()
    const { createArrangement } = await import('../../../hooks/useArrangementMutations')
    const mockCreate = vi.fn().mockResolvedValue({ id: 'new-1' })
    
    vi.mocked(createArrangement).mockReturnValue({
      createArrangement: mockCreate,
      updateArrangement: vi.fn(),
      deleteArrangement: vi.fn(),
      isSubmitting: false,
      error: null,
      isAuthenticated: true,
      canCreateArrangements: true,
      clearError: vi.fn()
    })
    
    const onSuccess = vi.fn()
    render(
      <ArrangementSheet 
        {...defaultProps}
        onSuccess={onSuccess}
      />
    )
    
    // Fill in required fields
    const nameInput = screen.getByLabelText(/arrangement name/i)
    await user.type(nameInput, 'New Arrangement')
    
    // Submit form
    const submitButton = screen.getByText('Create Arrangement')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('handles form submission for updating arrangement', async () => {
    const user = userEvent.setup()
    const arrangement = arrangementFactory.build({
      id: 'arr-1',
      name: 'Existing Arrangement'
    })
    
    const { updateArrangement } = await import('../../../hooks/useArrangementMutations')
    const mockUpdate = vi.fn().mockResolvedValue({ id: 'arr-1' })
    
    vi.mocked(updateArrangement).mockReturnValue({
      createArrangement: vi.fn(),
      updateArrangement: mockUpdate,
      deleteArrangement: vi.fn(),
      isSubmitting: false,
      error: null,
      isAuthenticated: true,
      canCreateArrangements: true,
      clearError: vi.fn()
    })
    
    const onSuccess = vi.fn()
    render(
      <ArrangementSheet 
        {...defaultProps}
        arrangement={arrangement}
        onSuccess={onSuccess}
      />
    )
    
    // Update name
    const nameInput = screen.getByLabelText(/arrangement name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Arrangement')
    
    // Submit form
    const submitButton = screen.getByText('Update Arrangement')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup()
    
    render(<ArrangementSheet {...defaultProps} />)
    
    const nameInput = screen.getByLabelText(/arrangement name/i)
    await user.type(nameInput, 'Test')
    
    const submitButton = screen.getByText('Create Arrangement')
    await user.click(submitButton)
    
    // Check that the button shows loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('handles cancel button click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    
    render(
      <ArrangementSheet 
        {...defaultProps}
        onClose={onClose}
      />
    )
    
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ArrangementSheet 
        {...defaultProps}
        isOpen={false}
      />
    )
    
    // Modal should not be visible
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    const { addNotification } = await import('@shared/components/notifications').then(m => m.useNotification())
    
    render(<ArrangementSheet {...defaultProps} />)
    
    // Try to submit without filling required fields
    const submitButton = screen.getByText('Create Arrangement')
    await user.click(submitButton)
    
    // Should show validation error
    expect(addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'Validation Error'
      })
    )
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    const { createArrangement } = await import('../../../hooks/useArrangementMutations')
    const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'))
    
    vi.mocked(createArrangement).mockReturnValue({
      createArrangement: mockCreate,
      updateArrangement: vi.fn(),
      deleteArrangement: vi.fn(),
      isSubmitting: false,
      error: null,
      isAuthenticated: true,
      canCreateArrangements: true,
      clearError: vi.fn()
    })
    
    const { addNotification } = await import('@shared/components/notifications').then(m => m.useNotification())
    
    render(<ArrangementSheet {...defaultProps} />)
    
    // Fill required fields
    const nameInput = screen.getByLabelText(/arrangement name/i)
    await user.type(nameInput, 'Test')
    
    // Submit
    const submitButton = screen.getByText('Create Arrangement')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Error',
          message: 'API Error'
        })
      )
    })
  })
})