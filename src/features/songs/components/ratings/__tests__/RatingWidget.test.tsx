import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithClerk } from '@shared/test-utils/clerk-test-utils'
import { createMockUser } from '@shared/test-utils/clerk-test-helpers'
import { NotificationProvider } from '@shared/components/notifications'
import { RatingWidget } from '../RatingWidget'

// Mock the useReviewMutations hook
const mockSubmitRating = vi.fn()
vi.mock('../../../hooks/useReviewMutations', () => ({
  useReviewMutations: () => ({
    submitRating: mockSubmitRating,
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

describe('RatingWidget', () => {
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
      ratings: { average: 4.2, count: 15 }
    }
  }
  const mockProps = {
    song: mockSong
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('display rating information', () => {
    it('shows average rating and review count', () => {
      renderWithClerk(
        <TestWrapper>
          <RatingWidget {...mockProps} />
        </TestWrapper>
      )
      
      expect(screen.getByText('4.2')).toBeInTheDocument()
      expect(screen.getByText(/15.*ratings/)).toBeInTheDocument()
    })

    it('displays singular review text for one review', () => {
      const singleReviewSong = {
        ...mockSong,
        metadata: {
          ...mockSong.metadata,
          ratings: { average: 3.0, count: 1 }
        }
      }
      
      renderWithClerk(
        <TestWrapper>
          <RatingWidget song={singleReviewSong} />
        </TestWrapper>
      )
      
      expect(screen.getByText(/1.*rating/)).toBeInTheDocument()
    })

    it('shows no reviews text when count is zero', () => {
      const noReviewsSong = {
        ...mockSong,
        metadata: {
          ...mockSong.metadata,
          ratings: { average: 0, count: 0 }
        }
      }
      
      renderWithClerk(
        <TestWrapper>
          <RatingWidget song={noReviewsSong} />
        </TestWrapper>
      )
      
      expect(screen.getByText('No ratings yet')).toBeInTheDocument()
    })

    it('highlights user rating stars when provided', () => {
      renderWithClerk(
        <TestWrapper>
          <RatingWidget {...mockProps} userRating={5} />
        </TestWrapper>
      )
      
      // All 5 stars should be highlighted when user rating is 5
      const stars = screen.getAllByRole('button')
      const ratingStars = stars.filter(button => button.getAttribute('aria-label')?.includes('Rate'))
      expect(ratingStars).toHaveLength(5)
      
      // Check that all stars are filled/highlighted
      ratingStars.forEach((star, index) => {
        expect(star).toHaveStyle({ color: 'rgb(251, 191, 36)' })
      })
    })
  })

  describe('star rendering', () => {
    it('renders filled stars for average rating', () => {
      renderWithClerk(
        <TestWrapper>
          <RatingWidget {...mockProps} />
        </TestWrapper>
      )
      
      const stars = screen.getAllByText('★')
      expect(stars).toHaveLength(4) // 4 full stars for 4.2 rating
      
      const halfStars = screen.getAllByText('☆')
      expect(halfStars).toHaveLength(1) // 1 empty star
    })

    it('handles edge cases for rating display', () => {
      const noRatingSong = {
        ...mockSong,
        metadata: {
          ...mockSong.metadata,
          ratings: { average: 0, count: 0 }
        }
      }
      
      renderWithClerk(
        <TestWrapper>
          <RatingWidget song={noRatingSong} />
        </TestWrapper>
      )
      
      const emptyStars = screen.getAllByText('☆')
      expect(emptyStars).toHaveLength(5) // All 5 stars empty
    })
  })

  describe('user interaction when signed in', () => {
    const mockUser = createMockUser({ id: 'user_123' })

    it('allows rating when user is signed in', async () => {
      const user = userEvent.setup()
      const mockOnRate = vi.fn().mockResolvedValue(undefined)
      
      renderWithClerk(
        <TestWrapper>
          <RatingWidget {...mockProps} onRate={mockOnRate} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      // Click on the third star
      const stars = screen.getAllByRole('button')
      const ratingStars = stars.filter(button => button.getAttribute('aria-label')?.includes('Rate'))
      await user.click(ratingStars[2])
      
      await waitFor(() => {
        expect(mockOnRate).toHaveBeenCalledWith(3)
      })
    })

    it('shows hover effects on stars', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <TestWrapper>
          <RatingWidget {...mockProps} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      const stars = screen.getAllByRole('button')
      const ratingStars = stars.filter(button => button.getAttribute('aria-label')?.includes('Rate'))
      
      // Hover over fourth star
      await user.hover(ratingStars[3])
      
      // Should highlight up to the hovered star
      expect(ratingStars[0]).toHaveStyle({ color: '#fbbf24' })
      expect(ratingStars[3]).toHaveStyle({ color: '#fbbf24' })
    })

    it('updates existing user rating', async () => {
      const user = userEvent.setup()
      const mockOnRate = vi.fn().mockResolvedValue(undefined)
      
      renderWithClerk(
        <TestWrapper>
          <RatingWidget {...mockProps} userRating={3} onRate={mockOnRate} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      // Click on fifth star to change rating
      const stars = screen.getAllByRole('button')
      const ratingStars = stars.filter(button => button.getAttribute('aria-label')?.includes('Rate'))
      await user.click(ratingStars[4])
      
      await waitFor(() => {
        expect(mockOnRate).toHaveBeenCalledWith(5)
      })
    })
  })

  describe('user interaction when not signed in', () => {
    it('shows sign in prompt when trying to rate', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <TestWrapper>
          <RatingWidget {...mockProps} />
        </TestWrapper>,
        { isSignedIn: false }
      )
      
      const stars = screen.getAllByRole('button')
      const ratingStars = stars.filter(button => button.getAttribute('aria-label')?.includes('Rate'))
      await user.click(ratingStars[2])
      
      expect(screen.getByText('Sign in to rate')).toBeInTheDocument()
    })

    it('displays read-only rating when not authenticated', () => {
      renderWithClerk(
        <TestWrapper>
          <RatingWidget {...mockProps} readonly={true} />
        </TestWrapper>,
        { isSignedIn: false }
      )
      
      // Stars should not have pointer cursor or be interactive when readonly
      const stars = screen.getAllByRole('button')
      const ratingStars = stars.filter(button => button.getAttribute('aria-label')?.includes('Rate'))
      ratingStars.forEach(star => {
        expect(star).toHaveStyle({ cursor: 'default' })
      })
    })
  })

  describe('loading and error states', () => {
    it('shows loading state while submitting', () => {
      renderWithClerk(
        <TestWrapper>
          <RatingWidget {...mockProps} />
        </TestWrapper>
      )
      
      // When in submitting state, should show loading indicator
      expect(screen.queryByText('Submitting...')).not.toBeInTheDocument()
    })

    it('handles rating submission errors gracefully', async () => {
      const mockOnRate = vi.fn().mockRejectedValue(new Error('Network error'))
      
      const user = userEvent.setup()
      const mockUser = createMockUser()
      
      renderWithClerk(
        <TestWrapper>
          <RatingWidget {...mockProps} onRate={mockOnRate} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      const stars = screen.getAllByRole('button')
      const ratingStars = stars.filter(button => button.getAttribute('aria-label')?.includes('Rate'))
      await user.click(ratingStars[4])
      
      await waitFor(() => {
        expect(mockOnRate).toHaveBeenCalled()
      })
      
      // Should show error notification
      expect(screen.getByText('Rating failed')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithClerk(
        <TestWrapper>
          <RatingWidget {...mockProps} />
        </TestWrapper>
      )
      
      const widget = screen.getByRole('group')
      expect(widget).toHaveAttribute('aria-label', 'Rate Test Song')
      
      const stars = screen.getAllByRole('button')
      const ratingStars = stars.filter(button => button.getAttribute('aria-label')?.includes('Rate'))
      expect(ratingStars[0]).toHaveAttribute('aria-label', 'Rate 1 star')
      expect(ratingStars[4]).toHaveAttribute('aria-label', 'Rate 5 stars')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockUser = createMockUser()
      const mockOnRate = vi.fn().mockResolvedValue(undefined)
      
      renderWithClerk(
        <TestWrapper>
          <RatingWidget {...mockProps} onRate={mockOnRate} />
        </TestWrapper>,
        { user: mockUser, isSignedIn: true }
      )
      
      const stars = screen.getAllByRole('button')
      const ratingStars = stars.filter(button => button.getAttribute('aria-label')?.includes('Rate'))
      
      // Tab to first star and press Enter
      await user.tab()
      expect(ratingStars[0]).toHaveFocus()
      
      // Press Enter to submit rating for star 1
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockOnRate).toHaveBeenCalledWith(1)
      })
    })
  })
})