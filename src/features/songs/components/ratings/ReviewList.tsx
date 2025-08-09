import { useState } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useNotification } from '@shared/components/notifications'
import { RatingWidget } from './RatingWidget'
import type { Song } from '@features/songs/types/song.types'
import type { Review } from '@features/songs/types/review.types'

interface ReviewListProps {
  song: Song
  reviews: Review[]
  currentUserReview?: Review | null
  onHelpfulVote?: (reviewId: string, helpful: boolean) => Promise<void>
  onEditReview?: (review: Review) => void
  onDeleteReview?: (reviewId: string) => Promise<void>
  onLoadMore?: () => Promise<void>
  hasMore?: boolean
  isLoading?: boolean
  className?: string
}

export function ReviewList({
  song,
  reviews,
  currentUserReview,
  onHelpfulVote,
  onEditReview,
  onDeleteReview,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  className = ''
}: ReviewListProps) {
  const { user } = useAuth()
  const { addNotification } = useNotification()
  const [votingReviews, setVotingReviews] = useState<Set<string>>(new Set())
  const [deletingReviews, setDeletingReviews] = useState<Set<string>>(new Set())
  
  const handleHelpfulVote = async (reviewId: string, helpful: boolean) => {
    if (!onHelpfulVote) return
    
    setVotingReviews(prev => new Set(prev).add(reviewId))
    
    try {
      await onHelpfulVote(reviewId, helpful)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Vote failed',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setVotingReviews(prev => {
        const newSet = new Set(prev)
        newSet.delete(reviewId)
        return newSet
      })
    }
  }
  
  const handleDeleteReview = async (reviewId: string) => {
    if (!onDeleteReview) return
    
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }
    
    setDeletingReviews(prev => new Set(prev).add(reviewId))
    
    try {
      await onDeleteReview(reviewId)
      addNotification({
        type: 'success',
        title: 'Review deleted',
        message: 'Your review has been deleted successfully'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setDeletingReviews(prev => {
        const newSet = new Set(prev)
        newSet.delete(reviewId)
        return newSet
      })
    }
  }
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date))
  }
  
  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }
  
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }
  
  const reviewItemStyles: React.CSSProperties = {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    position: 'relative'
  }
  
  const currentUserReviewStyles: React.CSSProperties = {
    ...reviewItemStyles,
    backgroundColor: '#f8fafc',
    border: '2px solid #3b82f6'
  }
  
  const reviewHeaderStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  }
  
  const userInfoStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  }
  
  const userNameStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1e293b'
  }
  
  const dateStyles: React.CSSProperties = {
    fontSize: '12px',
    color: '#64748b'
  }
  
  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  }
  
  const actionButtonStyles: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: '12px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
  
  const commentStyles: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#374151',
    marginTop: '12px',
    whiteSpace: 'pre-wrap'
  }
  
  const helpfulnessStyles: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9'
  }
  
  const helpfulButtonStyles = (helpful: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '20px',
    border: '1px solid',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderColor: helpful ? '#22c55e' : '#ef4444',
    color: helpful ? '#22c55e' : '#ef4444'
  })
  
  const loadMoreStyles: React.CSSProperties = {
    padding: '12px 24px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: hasMore ? 'pointer' : 'not-allowed',
    fontSize: '14px',
    textAlign: 'center',
    opacity: hasMore ? 1 : 0.5
  }
  
  if (reviews.length === 0 && !currentUserReview) {
    return (
      <div className={className} style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: '#64748b',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ fontSize: '16px', marginBottom: '8px' }}>No reviews yet</div>
        <div style={{ fontSize: '14px' }}>Be the first to share your thoughts about this song!</div>
      </div>
    )
  }
  
  return (
    <div className={className} style={containerStyles}>
      {/* Current user's review (if exists) */}
      {currentUserReview && (
        <div style={currentUserReviewStyles}>
          <div style={{
            position: 'absolute',
            top: '-8px',
            left: '16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500
          }}>
            Your Review
          </div>
          
          <div style={reviewHeaderStyles}>
            <div style={userInfoStyles}>
              <div style={userNameStyles}>{currentUserReview.userName || 'You'}</div>
              <div style={dateStyles}>
                {getTimeAgo(currentUserReview.createdAt)} • {formatDate(currentUserReview.createdAt)}
              </div>
            </div>
            
            <div style={actionsStyles}>
              {onEditReview && (
                <button
                  onClick={() => onEditReview(currentUserReview)}
                  style={{
                    ...actionButtonStyles,
                    color: '#3b82f6',
                    borderColor: '#3b82f6'
                  }}
                >
                  Edit
                </button>
              )}
              
              {onDeleteReview && (
                <button
                  onClick={() => handleDeleteReview(currentUserReview.id)}
                  disabled={deletingReviews.has(currentUserReview.id)}
                  style={{
                    ...actionButtonStyles,
                    color: '#ef4444',
                    borderColor: '#ef4444',
                    opacity: deletingReviews.has(currentUserReview.id) ? 0.6 : 1
                  }}
                >
                  {deletingReviews.has(currentUserReview.id) ? '⟳' : 'Delete'}
                </button>
              )}
            </div>
          </div>
          
          <RatingWidget
            song={{ ...song, metadata: { ...song.metadata, ratings: { average: currentUserReview.rating, count: 1 } } }}
            showAverage={false}
            size="small"
            readonly
            userRating={currentUserReview.rating}
          />
          
          {currentUserReview.comment && (
            <div style={commentStyles}>
              {currentUserReview.comment}
            </div>
          )}
        </div>
      )}
      
      {/* Other reviews */}
      {reviews.filter(review => review.id !== currentUserReview?.id).map((review) => (
        <div key={review.id} style={reviewItemStyles}>
          <div style={reviewHeaderStyles}>
            <div style={userInfoStyles}>
              <div style={userNameStyles}>
                {review.userName || 'Anonymous User'}
              </div>
              <div style={dateStyles}>
                {getTimeAgo(review.createdAt)} • {formatDate(review.createdAt)}
              </div>
            </div>
          </div>
          
          <RatingWidget
            song={{ ...song, metadata: { ...song.metadata, ratings: { average: review.rating, count: 1 } } }}
            showAverage={false}
            size="small"
            readonly
            userRating={review.rating}
          />
          
          {review.comment && (
            <div style={commentStyles}>
              {review.comment}
            </div>
          )}
          
          {/* Helpfulness voting */}
          <div style={helpfulnessStyles}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Was this review helpful?
            </span>
            
            <button
              onClick={() => handleHelpfulVote(review.id, true)}
              disabled={votingReviews.has(review.id)}
              style={helpfulButtonStyles(true)}
            >
              👍 {review.helpful}
            </button>
            
            <button
              onClick={() => handleHelpfulVote(review.id, false)}
              disabled={votingReviews.has(review.id)}
              style={helpfulButtonStyles(false)}
            >
              👎 {review.notHelpful}
            </button>
            
            {votingReviews.has(review.id) && (
              <span style={{ fontSize: '12px', color: '#3b82f6' }}>⟳</span>
            )}
          </div>
        </div>
      ))}
      
      {/* Load more button */}
      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={!hasMore || isLoading}
          style={loadMoreStyles}
        >
          {isLoading ? (
            <>
              <span style={{ marginRight: '8px' }}>⟳</span>
              Loading more reviews...
            </>
          ) : (
            'Load More Reviews'
          )}
        </button>
      )}
      
      {isLoading && !hasMore && reviews.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#64748b'
        }}>
          <span style={{ marginRight: '8px' }}>⟳</span>
          Loading reviews...
        </div>
      )}
    </div>
  )
}