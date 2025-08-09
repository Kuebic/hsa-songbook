import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithClerk } from '@shared/test-utils/clerk-test-utils'
import { createMockUser } from '@shared/test-utils/clerk-test-helpers'
import { RatingWidget } from '../RatingWidget'

// Mock the useReviewMutations hook
const mockSubmitRating = vi.fn()
vi.mock('../../hooks/useReviewMutations', () => ({
  useReviewMutations: () => ({
    submitRating: mockSubmitRating,
    isSubmitting: false
  })
}))

describe('RatingWidget', () => {
  const mockProps = {
    songId: 'song_123',
    averageRating: 4.2,
    totalReviews: 15,
    userRating: undefined
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('display rating information', () => {
    it('shows average rating and review count', () => {
      renderWithClerk(<RatingWidget {...mockProps} />)
      
      expect(screen.getByText('4.2')).toBeInTheDocument()
      expect(screen.getByText('15 reviews')).toBeInTheDocument()
    })

    it('displays singular review text for one review', () => {
      renderWithClerk(
        <RatingWidget {...mockProps} totalReviews={1} />
      )
      
      expect(screen.getByText('1 review')).toBeInTheDocument()
    })

    it('shows no reviews text when count is zero', () => {
      renderWithClerk(
        <RatingWidget {...mockProps} totalReviews={0} averageRating={0} />
      )
      
      expect(screen.getByText('No reviews yet')).toBeInTheDocument()
    })

    it('displays user rating when provided', () => {
      renderWithClerk(
        <RatingWidget {...mockProps} userRating={5} />
      )
      
      expect(screen.getByText('Your rating: 5')).toBeInTheDocument()
    })
  })

  describe('star rendering', () => {
    it('renders filled stars for average rating', () => {
      renderWithClerk(<RatingWidget {...mockProps} />)
      
      const stars = screen.getAllByText('★')
      expect(stars).toHaveLength(4) // 4 full stars for 4.2 rating
      
      const halfStars = screen.getAllByText('☆')
      expect(halfStars).toHaveLength(1) // 1 empty star
    })

    it('handles edge cases for rating display', () => {
      renderWithClerk(
        <RatingWidget {...mockProps} averageRating={0} />
      )
      
      const emptyStars = screen.getAllByText('☆')
      expect(emptyStars).toHaveLength(5) // All 5 stars empty
    })
  })

  describe('user interaction when signed in', () => {
    const mockUser = createMockUser({ id: 'user_123' })

    it('allows rating when user is signed in', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <RatingWidget {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Click on the third star
      const stars = screen.getAllByRole('button')
      await user.click(stars[2])
      
      await waitFor(() => {
        expect(mockSubmitRating).toHaveBeenCalledWith({
          songId: 'song_123',
          rating: 3
        })
      })
    })

    it('shows hover effects on stars', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <RatingWidget {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      const stars = screen.getAllByRole('button')
      
      // Hover over fourth star
      await user.hover(stars[3])
      
      // Should highlight up to the hovered star
      expect(stars[0]).toHaveStyle({ color: '#fbbf24' })
      expect(stars[3]).toHaveStyle({ color: '#fbbf24' })
    })

    it('updates existing user rating', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <RatingWidget {...mockProps} userRating={3} />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Click on fifth star to change rating
      const stars = screen.getAllByRole('button')
      await user.click(stars[4])
      
      await waitFor(() => {
        expect(mockSubmitRating).toHaveBeenCalledWith({
          songId: 'song_123',
          rating: 5
        })
      })
    })
  })

  describe('user interaction when not signed in', () => {
    it('shows sign in prompt when trying to rate', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <RatingWidget {...mockProps} />,
        { isSignedIn: false }
      )
      
      const stars = screen.getAllByRole('button')
      await user.click(stars[2])
      
      expect(screen.getByText('Sign in to rate this song')).toBeInTheDocument()
      expect(mockSubmitRating).not.toHaveBeenCalled()
    })

    it('displays read-only rating when not authenticated', () => {
      renderWithClerk(
        <RatingWidget {...mockProps} />,
        { isSignedIn: false }
      )
      
      // Stars should not have pointer cursor or be interactive
      const stars = screen.getAllByRole('button')
      stars.forEach(star => {
        expect(star).toHaveStyle({ cursor: 'default' })
      })
    })
  })

  describe('loading and error states', () => {
    it('shows loading state while submitting', () => {
      const mockSubmittingRating = vi.fn()
      vi.mocked(vi.importActual('../../hooks/useReviewMutations')).useReviewMutations = () => ({
        submitRating: mockSubmittingRating,
        isSubmitting: true
      })

      const mockUser = createMockUser()
      
      renderWithClerk(
        <RatingWidget {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      expect(screen.getByText('Submitting...')).toBeInTheDocument()
    })

    it('handles rating submission errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockSubmitRating.mockRejectedValue(new Error('Network error'))
      
      const user = userEvent.setup()
      const mockUser = createMockUser()
      
      renderWithClerk(
        <RatingWidget {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      const stars = screen.getAllByRole('button')
      await user.click(stars[4])
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error submitting rating:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithClerk(<RatingWidget {...mockProps} />)
      
      const widget = screen.getByRole('group')
      expect(widget).toHaveAttribute('aria-label', 'Song rating')
      
      const stars = screen.getAllByRole('button')
      expect(stars[0]).toHaveAttribute('aria-label', 'Rate 1 star')
      expect(stars[4]).toHaveAttribute('aria-label', 'Rate 5 stars')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockUser = createMockUser()
      
      renderWithClerk(
        <RatingWidget {...mockProps} />,
        { user: mockUser, isSignedIn: true }
      )
      
      const stars = screen.getAllByRole('button')
      
      // Tab to first star and press Enter
      await user.tab()
      expect(stars[0]).toHaveFocus()
      
      // Use arrow keys to navigate
      await user.keyboard('{ArrowRight}')
      expect(stars[1]).toHaveFocus()
      
      // Press Enter to submit rating
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockSubmitRating).toHaveBeenCalledWith({
          songId: 'song_123',
          rating: 2
        })
      })
    })
  })
})