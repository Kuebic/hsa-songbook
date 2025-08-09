import { useState, useCallback } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useNotification } from '@shared/components/notifications'
import type { Song } from '@features/songs/types/song.types'

interface RatingWidgetProps {
  song: Song
  onRate?: (rating: number) => Promise<void>
  showAverage?: boolean
  size?: 'small' | 'medium' | 'large'
  readonly?: boolean
  className?: string
  userRating?: number
}

export function RatingWidget({
  song,
  onRate,
  showAverage = true,
  size = 'medium',
  readonly = false,
  className = '',
  userRating: initialUserRating = 0
}: RatingWidgetProps) {
  const { isSignedIn } = useAuth()
  const { addNotification } = useNotification()
  const [hoveredRating, setHoveredRating] = useState(0)
  const [userRating, setUserRating] = useState(initialUserRating)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const canRate = isSignedIn && !readonly && !isSubmitting
  
  const handleRate = useCallback(async (rating: number) => {
    if (!canRate) return
    
    setIsSubmitting(true)
    setUserRating(rating)
    
    try {
      if (onRate) {
        await onRate(rating)
        addNotification({
          type: 'success',
          title: 'Rating submitted',
          message: `You rated "${song.title}" ${rating} star${rating === 1 ? '' : 's'}`
        })
      }
    } catch (error) {
      // Revert on error
      setUserRating(initialUserRating)
      addNotification({
        type: 'error',
        title: 'Rating failed',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [canRate, onRate, song.title, addNotification, initialUserRating])
  
  const sizes = {
    small: { star: '16px', gap: '2px', text: '12px' },
    medium: { star: '20px', gap: '4px', text: '14px' },
    large: { star: '24px', gap: '6px', text: '16px' }
  }
  
  const currentSize = sizes[size]
  
  const containerStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px'
  }
  
  const starsStyles: React.CSSProperties = {
    display: 'flex',
    gap: currentSize.gap,
    position: 'relative'
  }
  
  const starStyles = (index: number): React.CSSProperties => {
    const isActive = (hoveredRating || userRating) >= index
    const isHovered = hoveredRating >= index
    
    return {
      fontSize: currentSize.star,
      cursor: canRate ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      transform: isHovered && canRate ? 'scale(1.1)' : 'scale(1)',
      color: isActive ? '#fbbf24' : '#e5e7eb',
      opacity: isSubmitting ? 0.6 : 1,
      filter: isHovered && canRate ? 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))' : 'none',
      userSelect: 'none'
    }
  }
  
  const averageStyles: React.CSSProperties = {
    fontSize: currentSize.text,
    color: '#64748b',
    fontWeight: 500
  }
  
  const currentRating = hoveredRating || userRating || song.metadata.ratings?.average || 0
  const showStars = Math.max(currentRating, song.metadata.ratings?.average || 0)
  
  return (
    <div style={containerStyles} className={className}>
      <div 
        style={starsStyles}
        onMouseLeave={() => canRate && setHoveredRating(0)}
        role="group"
        aria-label={`Rate ${song.title}`}
        title={canRate ? 'Click to rate this song' : readonly ? 'Song rating' : 'Sign in to rate this song'}
      >
        {[1, 2, 3, 4, 5].map(star => {
          const isFilled = star <= Math.round(showStars)
          const isPartiallyFilled = !isFilled && star - 0.5 <= showStars
          
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleRate(star)}
              onMouseEnter={() => canRate && setHoveredRating(star)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...starStyles(star)
              }}
              disabled={!canRate}
              aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
              title={`Rate ${star} star${star === 1 ? '' : 's'}`}
            >
              {isFilled ? '★' : isPartiallyFilled ? '⭐' : '☆'}
            </button>
          )
        })}
        
        {isSubmitting && (
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '10px',
              color: '#3b82f6'
            }}
          >
            ⟳
          </div>
        )}
      </div>
      
      {showAverage && song.metadata.ratings && song.metadata.ratings.count > 0 && (
        <span style={averageStyles}>
          {song.metadata.ratings.average.toFixed(1)} 
          <span style={{ color: '#9ca3af', fontWeight: 400 }}>
            ({song.metadata.ratings.count} {song.metadata.ratings.count === 1 ? 'rating' : 'ratings'})
          </span>
        </span>
      )}
      
      {showAverage && (!song.metadata.ratings || song.metadata.ratings.count === 0) && (
        <span style={{ ...averageStyles, color: '#9ca3af' }}>
          No ratings yet
        </span>
      )}
      
      {!isSignedIn && !readonly && (
        <span style={{ fontSize: currentSize.text, color: '#9ca3af', fontStyle: 'italic' }}>
          Sign in to rate
        </span>
      )}
    </div>
  )
}