import { useState, useCallback } from 'react'
import { FormTextarea } from '@shared/components/form'
import { useNotification } from '@shared/components/notifications'
import { RatingWidget } from './RatingWidget'
import type { Song } from '@features/songs/types/song.types'
import type { ReviewFormData, Review } from '@features/songs/types/review.types'

interface ReviewFormProps {
  song: Song
  onSubmit: (data: ReviewFormData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<Review>
  isEditing?: boolean
  isSubmitting?: boolean
}

export function ReviewForm({
  song,
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  isSubmitting = false
}: ReviewFormProps) {
  const { addNotification } = useNotification()
  const [rating, setRating] = useState(initialData?.rating || 0)
  const [comment, setComment] = useState(initialData?.comment || '')
  const [localSubmitting, setLocalSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isLoading = isSubmitting || localSubmitting
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    
    setLocalSubmitting(true)
    setError(null)
    
    try {
      await onSubmit({
        rating,
        comment: comment.trim() || undefined
      })
      
      addNotification({
        type: 'success',
        title: isEditing ? 'Review updated' : 'Review submitted',
        message: `Your review for "${song.title}" has been ${isEditing ? 'updated' : 'submitted'}`
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit review'
      setError(errorMessage)
      addNotification({
        type: 'error',
        title: isEditing ? 'Update failed' : 'Submission failed',
        message: errorMessage
      })
    } finally {
      setLocalSubmitting(false)
    }
  }, [rating, comment, onSubmit, isEditing, song.title, addNotification])
  
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }
  
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  }
  
  const titleStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1e293b'
  }
  
  const subtitleStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#64748b'
  }
  
  const sectionStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }
  
  const labelStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151'
  }
  
  const errorStyles: React.CSSProperties = {
    color: '#ef4444',
    fontSize: '14px',
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px'
  }
  
  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9'
  }
  
  const buttonBaseStyles: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none'
  }
  
  const cancelButtonStyles: React.CSSProperties = {
    ...buttonBaseStyles,
    backgroundColor: '#f8fafc',
    color: '#64748b',
    border: '1px solid #e2e8f0'
  }
  
  const submitButtonStyles: React.CSSProperties = {
    ...buttonBaseStyles,
    backgroundColor: rating > 0 && !isLoading ? '#3b82f6' : '#9ca3af',
    color: 'white',
    cursor: rating > 0 && !isLoading ? 'pointer' : 'not-allowed'
  }
  
  const characterCount = comment.length
  const maxCharacters = 1000
  const isNearLimit = characterCount > maxCharacters * 0.8
  
  return (
    <form onSubmit={handleSubmit} style={containerStyles}>
      <div style={headerStyles}>
        <div style={titleStyles}>
          {isEditing ? 'Edit Your Review' : 'Write a Review'}
        </div>
        <div style={subtitleStyles}>
          Share your thoughts about "{song.title}"
          {song.artist && ` by ${song.artist}`}
        </div>
      </div>
      
      <div style={sectionStyles}>
        <label style={labelStyles}>Your Rating *</label>
        <RatingWidget
          song={{ ...song, metadata: { ...song.metadata, ratings: { average: rating, count: 0 } } }}
          onRate={async (newRating) => {
            setRating(newRating)
            setError(null)
          }}
          showAverage={false}
          size="large"
          userRating={rating}
        />
        {error && rating === 0 && (
          <div style={errorStyles}>Please select a rating</div>
        )}
      </div>
      
      <div style={sectionStyles}>
        <FormTextarea
          label="Your Review (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={5}
          maxLength={maxCharacters}
          placeholder="Share your experience with this song. What did you like? How did it work for your team or congregation?"
          showCharacterCount
          helperText="Help others by sharing your honest thoughts and experiences"
          style={{
            resize: 'vertical',
            minHeight: '120px'
          }}
        />
        
        {isNearLimit && (
          <div style={{ 
            fontSize: '12px', 
            color: characterCount >= maxCharacters ? '#ef4444' : '#f59e0b',
            textAlign: 'right' 
          }}>
            {maxCharacters - characterCount} characters remaining
          </div>
        )}
      </div>
      
      {error && rating > 0 && (
        <div style={errorStyles}>{error}</div>
      )}
      
      <div style={actionsStyles}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          style={{
            ...cancelButtonStyles,
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={rating === 0 || isLoading || characterCount > maxCharacters}
          style={submitButtonStyles}
        >
          {isLoading ? (
            <>
              <span style={{ marginRight: '8px' }}>⟳</span>
              {isEditing ? 'Updating...' : 'Submitting...'}
            </>
          ) : (
            isEditing ? 'Update Review' : 'Submit Review'
          )}
        </button>
      </div>
      
      {isEditing && (
        <div style={{
          fontSize: '12px',
          color: '#64748b',
          fontStyle: 'italic',
          textAlign: 'center',
          paddingTop: '8px',
          borderTop: '1px solid #f1f5f9'
        }}>
          Last updated: {initialData?.updatedAt ? new Date(initialData.updatedAt).toLocaleDateString() : 'Unknown'}
        </div>
      )}
    </form>
  )
}