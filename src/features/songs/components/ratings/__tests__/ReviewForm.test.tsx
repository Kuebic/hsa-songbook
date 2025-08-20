import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithClerk } from '@shared/test-utils/clerk-test-utils'
import { createMockUser } from '@shared/test-utils/clerk-test-helpers'
import { NotificationProvider } from '@shared/components/notifications'
import { ReviewForm } from '../ReviewForm'

// Mock the useReviewMutations hook
const mockCreateReview = vi.fn()
const mockUpdateReview = vi.fn()
vi.mock('../../../hooks/useReviewMutations', () => ({
  useReviewMutations: () => ({
    createReview: mockCreateReview,
    updateReview: mockUpdateReview,
    isSubmitting: false
  })
}))

// Create a wrapper component with NotificationProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  )
}

describe('ReviewForm', () => {
  const mockUser = createMockUser({ id: 'user_123' })
  const mockSong = {
    id: 'song_123',
    title: 'Test Song',
    artist: 'Test Artist',
    slug: 'test-song',
    themes: ['test'],
    metadata: {
      createdBy: 'test-user',
      isPublic: false,
      views: 0,
      ratings: { average: 0, count: 0 }
    }
  }
  const mockProps = {
    song: mockSong,
    onSubmit: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('form rendering', () => {
    it('renders form elements for new review', () => {
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      expect(screen.getByText('Write a Review')).toBeInTheDocument()
      expect(screen.getByText('Your Rating *')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/share your experience/i)).toBeInTheDocument()
      expect(screen.getByText('Submit Review')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('renders form with existing review data for editing', () => {
      const existingReview = {
        id: 'review_123',
        rating: 4,
        comment: 'Great song!',
        isPublic: true
      }
      
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} initialData={existingReview} isEditing={true} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      expect(screen.getByText('Edit Your Review')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Great song!')).toBeInTheDocument()
      expect(screen.getByText('Update Review')).toBeInTheDocument()
    })

    it('shows song title in header', () => {
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      expect(screen.getByText(/Share your thoughts about "Test Song"/)).toBeInTheDocument()
      expect(screen.getByText(/by Test Artist/)).toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    it('requires rating to be selected', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)
      
      expect(screen.getByText('Please select a rating')).toBeInTheDocument()
      expect(mockProps.onSubmit).not.toHaveBeenCalled()
    })

    it('validates comment length', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      // Fill in rating first
      const ratingButton = screen.getByRole('button', { name: /rate 4 stars?/i })
      await user.click(ratingButton)
      
      // Enter exactly 1000 characters (the limit)
      const commentField = screen.getByPlaceholderText(/share your experience/i)
      const maxComment = 'a'.repeat(1000) // Exactly 1000 characters
      await user.type(commentField, maxComment)
      
      const submitButton = screen.getByText('Submit Review')
      expect(submitButton).not.toBeDisabled() // Should not be disabled at the limit
      
      // Try to type one more character - should be prevented by maxLength
      await user.type(commentField, 'x')
      expect(commentField).toHaveValue(maxComment) // Should still have only 1000 chars
    })

    it('allows empty comment with rating only', async () => {
      const user = userEvent.setup()
      mockProps.onSubmit.mockResolvedValue(undefined)
      
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      // Fill in rating only
      const ratingButton = screen.getByRole('button', { name: /rate 5 stars?/i })
      await user.click(ratingButton)
      
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalledWith({
          rating: 5,
          comment: undefined
        })
      })
    })
  })

  describe('form submission', () => {
    it('creates new review successfully', async () => {
      const user = userEvent.setup()
      mockProps.onSubmit.mockResolvedValue(undefined)
      
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      // Fill form
      const ratingButton = screen.getByRole('button', { name: /rate 4 stars?/i })
      await user.click(ratingButton)
      
      const commentField = screen.getByPlaceholderText(/share your experience/i)
      await user.type(commentField, 'This is a great song!')
      
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalledWith({
          rating: 4,
          comment: 'This is a great song!'
        })
      })
    })

    it('updates existing review successfully', async () => {
      const user = userEvent.setup()
      mockProps.onSubmit.mockResolvedValue(undefined)
      
      const existingReview = {
        id: 'review_123',
        rating: 3,
        comment: 'Original comment',
        isPublic: true
      }
      
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} initialData={existingReview} isEditing={true} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      // Update rating
      const ratingButton = screen.getByRole('button', { name: /rate 5 stars?/i })
      await user.click(ratingButton)
      
      // Update comment
      const commentField = screen.getByDisplayValue('Original comment')
      await user.clear(commentField)
      await user.type(commentField, 'Updated comment')
      
      const submitButton = screen.getByText('Update Review')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalledWith({
          rating: 5,
          comment: 'Updated comment'
        })
      })
    })

    it('handles submission errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockProps.onSubmit.mockRejectedValue(new Error('Server error'))
      
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      // Fill form
      const ratingButton = screen.getByRole('button', { name: /rate 3 stars?/i })
      await user.click(ratingButton)
      
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getAllByText('Server error')).toHaveLength(2) // Form error + notification
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('form interactions', () => {
    it('shows character count for comment field when near limit', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      const commentField = screen.getByPlaceholderText(/share your experience/i)
      // Type 850 characters to exceed 80% of 1000 char limit
      const longText = 'a'.repeat(850)
      await user.type(commentField, longText)
      
      expect(screen.getByText(/characters remaining/)).toBeInTheDocument()
      expect(screen.getByText('150 characters remaining')).toBeInTheDocument()
    })

    it('cancels form and calls onCancel', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(mockProps.onCancel).toHaveBeenCalled()
    })
  })

  describe('loading states', () => {
    it('shows loading state during submission', () => {
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} isSubmitting={true} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      const submitButton = screen.getByText('Submitting...')
      expect(submitButton).toBeDisabled()
    })

    it('disables form elements during submission', () => {
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} isSubmitting={true} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      const ratingButtons = screen.getAllByRole('button', { name: /rate \d stars?/i })
      const commentField = screen.getByPlaceholderText(/share your experience/i)
      
      ratingButtons.forEach(button => expect(button).toBeDisabled())
      expect(commentField).toBeDisabled()
    })
  })

  describe('accessibility', () => {
    it('has proper form labels and ARIA attributes', () => {
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      const ratingLabel = screen.getByText('Your Rating *')
      expect(ratingLabel).toBeInTheDocument()
      
      const commentField = screen.getByLabelText(/Your Review/i)
      expect(commentField).toBeInTheDocument()
    })

    it('announces form errors to screen readers', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <TestWrapper>
          <ReviewForm {...mockProps} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)
      
      const errorMessage = screen.getByText('Please select a rating')
      expect(errorMessage).toBeInTheDocument()
    })
  })
})