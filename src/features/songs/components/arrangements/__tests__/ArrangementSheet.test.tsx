import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@shared/test-utils/testWrapper'
import userEvent from '@testing-library/user-event'
import { ArrangementSheet } from '../ArrangementSheet'
import { arrangementFactory } from '../../../test-utils/factories'
import { useArrangementMutations } from '../../../hooks/useArrangementMutations'

// Mock dependencies
vi.mock('../../../hooks/useArrangementMutations', () => ({
  useArrangementMutations: vi.fn()
}))

const mockAddNotification = vi.fn()

vi.mock('@shared/components/notifications', () => ({
  useNotification: () => ({
    addNotification: mockAddNotification
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
    mockAddNotification.mockClear()
    
    // Mock HTMLDialogElement methods and properties if not available in test environment
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = vi.fn(function(this: HTMLDialogElement) {
        // Set the open property when showModal is called
        Object.defineProperty(this, 'open', { value: true, writable: true, configurable: true })
      })
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = vi.fn(function(this: HTMLDialogElement) {
        // Clear the open property when close is called
        Object.defineProperty(this, 'open', { value: false, writable: true, configurable: true })
      })
    }
    
    // Setup default mock for useArrangementMutations
    vi.mocked(useArrangementMutations).mockReturnValue({
      createArrangement: vi.fn().mockResolvedValue({ id: '1', name: 'New Arrangement' }),
      updateArrangement: vi.fn().mockResolvedValue({ id: '1', name: 'Updated Arrangement' }),
      deleteArrangement: vi.fn().mockResolvedValue(undefined),
      rateArrangement: vi.fn().mockResolvedValue({ id: '1', name: 'Rated Arrangement' }),
      isSubmitting: false,
      error: null,
      clearError: vi.fn(),
      isAuthenticated: true,
      canCreateArrangements: true
    })
  })

  it('renders create mode correctly', () => {
    renderWithProviders(<ArrangementSheet {...defaultProps} />)
    
    expect(screen.getByText('Add New Arrangement')).toBeInTheDocument()
    expect(screen.getByText('Create arrangement for "Test Song" - you\'ll add the chord chart in the next step')).toBeInTheDocument()
    expect(screen.getByText('Create & Open Editor')).toBeInTheDocument()
  })

  it('renders edit mode correctly', () => {
    const arrangement = arrangementFactory.build({
      id: 'arr-1',
      name: 'Existing Arrangement'
    })
    
    renderWithProviders(
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
    const mockCreate = vi.fn().mockResolvedValue({ id: 'new-1' })
    
    vi.mocked(useArrangementMutations).mockReturnValue({
      createArrangement: mockCreate,
      updateArrangement: vi.fn(),
      deleteArrangement: vi.fn(),
      rateArrangement: vi.fn(),
      isSubmitting: false,
      error: null,
      isAuthenticated: true,
      canCreateArrangements: true,
      clearError: vi.fn()
    })
    
    const onSuccess = vi.fn()
    renderWithProviders(
      <ArrangementSheet 
        {...defaultProps}
        onSuccess={onSuccess}
      />
    )
    
    // Fill in required fields
    const nameInput = screen.getByLabelText(/arrangement name/i)
    await user.type(nameInput, 'New Arrangement')
    
    // Submit form
    const submitButton = screen.getByText('Create & Open Editor')
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
    
    const mockUpdate = vi.fn().mockResolvedValue({ id: 'arr-1' })
    
    vi.mocked(useArrangementMutations).mockReturnValue({
      createArrangement: vi.fn(),
      updateArrangement: mockUpdate,
      deleteArrangement: vi.fn(),
      rateArrangement: vi.fn(),
      isSubmitting: false,
      error: null,
      isAuthenticated: true,
      canCreateArrangements: true,
      clearError: vi.fn()
    })
    
    const onSuccess = vi.fn()
    renderWithProviders(
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
    
    // Create a delayed promise to simulate loading state
    let resolveCreate: (value: any) => void
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve
    })
    
    // Mock createArrangement to return the delayed promise
    vi.mocked(useArrangementMutations).mockReturnValue({
      createArrangement: vi.fn().mockReturnValue(createPromise),
      updateArrangement: vi.fn().mockResolvedValue({ id: '1', name: 'Updated Arrangement' }),
      deleteArrangement: vi.fn().mockResolvedValue(undefined),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null
    })
    
    renderWithProviders(<ArrangementSheet {...defaultProps} />)
    
    const nameInput = screen.getByLabelText(/arrangement name/i)
    await user.type(nameInput, 'Test')
    
    const submitButton = screen.getByText('Create & Open Editor')
    await user.click(submitButton)
    
    // Check that the button shows loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    
    // Resolve the promise to complete the test
    resolveCreate!({ id: '1', name: 'New Arrangement' })
  })

  it('handles cancel button click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    
    renderWithProviders(
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
    const { container } = renderWithProviders(
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
    
    renderWithProviders(<ArrangementSheet {...defaultProps} />)
    
    // Find and enter invalid data that would fail validation
    const nameInput = screen.getByLabelText(/arrangement name/i)
    
    // Clear existing input and enter a name that's too long (> 100 chars)
    await user.clear(nameInput)
    const longName = 'x'.repeat(101) // This should fail validation as name max is 100 chars
    await user.type(nameInput, longName)
    
    // Try to submit with invalid data
    const submitButton = screen.getByText('Create & Open Editor')
    await user.click(submitButton)
    
    // Should show validation error for name being too long
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Validation Error'
        })
      )
    })
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'))
    
    vi.mocked(useArrangementMutations).mockReturnValue({
      createArrangement: mockCreate,
      updateArrangement: vi.fn(),
      deleteArrangement: vi.fn(),
      rateArrangement: vi.fn(),
      isSubmitting: false,
      error: null,
      isAuthenticated: true,
      canCreateArrangements: true,
      clearError: vi.fn()
    })
    
    renderWithProviders(<ArrangementSheet {...defaultProps} />)
    
    // Fill required fields
    const nameInput = screen.getByLabelText(/arrangement name/i)
    await user.type(nameInput, 'Test')
    
    // Submit
    const submitButton = screen.getByText('Create & Open Editor')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Error',
          message: 'API Error'
        })
      )
    })
  })
})