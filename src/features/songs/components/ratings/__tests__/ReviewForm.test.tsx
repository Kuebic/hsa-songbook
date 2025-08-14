import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithClerk } from '@shared/test-utils/clerk-test-utils'
import { createMockUser } from '@shared/test-utils/clerk-test-helpers'
import { ReviewForm } from '../ReviewForm'

// Mock the useReviewMutations hook
const mockCreateReview = vi.fn()
const mockUpdateReview = vi.fn()
vi.mock('../../hooks/useReviewMutations', () => ({
  useReviewMutations: () => ({
    createReview: mockCreateReview,
    updateReview: mockUpdateReview,
    isSubmitting: false
  })
}))

describe('ReviewForm', () => {
  const mockUser = createMockUser({ id: 'user_123' })
  const mockProps = {
    songId: 'song_123',
    onSuccess: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('form rendering', () => {
    it('renders form elements for new review', () => {
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      expect(screen.getByText('Write a Review')).toBeInTheDocument()
      expect(screen.getByRole('group', { name: /rating/i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/share your thoughts/i)).toBeInTheDocument()
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
        <ReviewForm {...mockProps} initialReview={existingReview} />,
        { user: mockUser, isSignedIn: true }
      )
      
      expect(screen.getByText('Edit Review')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Great song!')).toBeInTheDocument()
      expect(screen.getByText('Update Review')).toBeInTheDocument()
    })

    it('shows private review toggle', () => {
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      expect(screen.getByText('Make review public')).toBeInTheDocument()
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked() // Should be public by default
    })
  })

  describe('form validation', () => {
    it('requires rating to be selected', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)
      
      expect(screen.getByText('Please select a rating')).toBeInTheDocument()
      expect(mockCreateReview).not.toHaveBeenCalled()
    })

    it('validates comment length', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Fill in rating
      const stars = screen.getAllByRole('button', { name: /rate/i })
      await user.click(stars[3]) // 4 stars
      
      // Enter too long comment
      const commentField = screen.getByPlaceholderText(/share your thoughts/i)
      const longComment = 'a'.repeat(1001) // Over 1000 character limit
      await user.type(commentField, longComment)
      
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)
      
      expect(screen.getByText(/comment must be less than 1000 characters/i)).toBeInTheDocument()
      expect(mockCreateReview).not.toHaveBeenCalled()
    })

    it('allows empty comment with rating only', async () => {
      const user = userEvent.setup()
      mockCreateReview.mockResolvedValue({ id: 'review_new' })
      
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Fill in rating only
      const stars = screen.getAllByRole('button', { name: /rate/i })
      await user.click(stars[4]) // 5 stars
      
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreateReview).toHaveBeenCalledWith({
          songId: 'song_123',
          rating: 5,
          comment: '',
          isPublic: true
        })
      })
    })
  })

  describe('form submission', () => {
    it('creates new review successfully', async () => {
      const user = userEvent.setup()
      mockCreateReview.mockResolvedValue({ id: 'review_new' })
      
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Fill form
      const stars = screen.getAllByRole('button', { name: /rate/i })
      await user.click(stars[3]) // 4 stars
      
      const commentField = screen.getByPlaceholderText(/share your thoughts/i)
      await user.type(commentField, 'This is a great song!')
      
      const publicCheckbox = screen.getByRole('checkbox')
      await user.click(publicCheckbox) // Make private
      
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreateReview).toHaveBeenCalledWith({
          songId: 'song_123',
          rating: 4,
          comment: 'This is a great song!',
          isPublic: false
        })
      })
      
      expect(mockProps.onSuccess).toHaveBeenCalled()
    })

    it('updates existing review successfully', async () => {
      const user = userEvent.setup()
      mockUpdateReview.mockResolvedValue({ id: 'review_123' })
      
      const existingReview = {
        id: 'review_123',
        rating: 3,
        comment: 'Original comment',
        isPublic: true
      }
      
      renderWithClerk(
        <ReviewForm {...mockProps} initialReview={existingReview} />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Update rating
      const stars = screen.getAllByRole('button', { name: /rate/i })
      await user.click(stars[4]) // Change to 5 stars
      
      // Update comment
      const commentField = screen.getByDisplayValue('Original comment')
      await user.clear(commentField)
      await user.type(commentField, 'Updated comment')
      
      const submitButton = screen.getByText('Update Review')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockUpdateReview).toHaveBeenCalledWith('review_123', {
          rating: 5,
          comment: 'Updated comment',
          isPublic: true
        })
      })
      
      expect(mockProps.onSuccess).toHaveBeenCalled()
    })

    it('handles submission errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockCreateReview.mockRejectedValue(new Error('Server error'))
      
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Fill form
      const stars = screen.getAllByRole('button', { name: /rate/i })
      await user.click(stars[2]) // 3 stars
      
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to submit review/i)).toBeInTheDocument()
      })
      
      expect(mockProps.onSuccess).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('form interactions', () => {
    it('shows character count for comment field', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      const commentField = screen.getByPlaceholderText(/share your thoughts/i)
      await user.type(commentField, 'Hello world')
      
      expect(screen.getByText('11/1000 characters')).toBeInTheDocument()
    })

    it('cancels form and calls onCancel', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(mockProps.onCancel).toHaveBeenCalled()
    })

    it('resets form when cancelled', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Fill form
      const stars = screen.getAllByRole('button', { name: /rate/i })
      await user.click(stars[3]) // 4 stars
      
      const commentField = screen.getByPlaceholderText(/share your thoughts/i)
      await user.type(commentField, 'Some comment')
      
      // Cancel
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      // Form should be reset if rendered again
      expect(commentField.value).toBe('')
    })
  })

  describe('loading states', () => {
    it('shows loading state during submission', async () => {
      const _user = userEvent.setup()
      
      // Mock the hook to return loading state
      vi.mocked(vi.importActual('../../hooks/useReviewMutations')).useReviewMutations = () => ({
        createReview: mockCreateReview,
        updateReview: mockUpdateReview,
        isSubmitting: true
      })
      
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      const submitButton = screen.getByText('Submitting...')
      expect(submitButton).toBeDisabled()
    })

    it('disables form elements during submission', async () => {
      vi.mocked(vi.importActual('../../hooks/useReviewMutations')).useReviewMutations = () => ({
        createReview: mockCreateReview,
        updateReview: mockUpdateReview,
        isSubmitting: true
      })
      
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      const stars = screen.getAllByRole('button', { name: /rate/i })
      const commentField = screen.getByPlaceholderText(/share your thoughts/i)
      const publicCheckbox = screen.getByRole('checkbox')
      
      stars.forEach(star => expect(star).toBeDisabled())
      expect(commentField).toBeDisabled()
      expect(publicCheckbox).toBeDisabled()
    })
  })

  describe('accessibility', () => {
    it('has proper form labels and ARIA attributes', () => {
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      const ratingGroup = screen.getByRole('group', { name: /rating/i })
      expect(ratingGroup).toBeInTheDocument()
      
      const commentField = screen.getByLabelText(/comment/i)
      expect(commentField).toBeInTheDocument()
      
      const publicCheckbox = screen.getByLabelText(/make review public/i)
      expect(publicCheckbox).toBeInTheDocument()
    })

    it('announces form errors to screen readers', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <ReviewForm {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      const submitButton = screen.getByText('Submit Review')
      await user.click(submitButton)
      
      const errorMessage = screen.getByText('Please select a rating')
      expect(errorMessage).toHaveAttribute('role', 'alert')
    })
  })
})