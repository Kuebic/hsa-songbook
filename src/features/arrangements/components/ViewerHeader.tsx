import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { useNativeBackNavigation } from '@features/responsive'
import { ModerationBadge } from '@features/moderation'
import { useRoles } from '@features/auth/hooks/useRoles'
import type { ViewerHeaderProps } from '../types/viewer.types'
import styles from './ViewerHeader.module.css'

export function ViewerHeader({ arrangement }: ViewerHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isSignedIn, userId } = useAuth()
  const { isModerator, isAdmin } = useRoles()
  
  // Setup native back navigation for mobile
  const { isEnabled: isMobileNav } = useNativeBackNavigation({
    enabled: true,
    fallbackPath: '/songs',
    arrangement: {
      id: arrangement.id,
      songSlug: arrangement.songSlug
    }
  })
  
  const handleBack = () => {
    // Strategy 1: If we have the song slug from arrangement data, use it
    if (arrangement.songSlug) {
      navigate(`/songs/${arrangement.songSlug}`)
      return
    }
    
    // Strategy 2: Check if we came from a song details page via location state
    const state = location.state as { fromSong?: string } | null
    if (state?.fromSong && typeof state.fromSong === 'string' && state.fromSong.trim() !== '') {
      navigate(`/songs/${state.fromSong}`)
      return
    }
    
    // Strategy 3: Navigate to songs list as a safe fallback
    // This is safer than navigate(-1) which could go to the chord editor
    navigate('/songs')
  }
  
  return (
    <header className={`viewer-header ${isMobileNav ? 'viewer-header--mobile' : ''}`}>
      <div className={styles.header}>
        <div className={styles.buttonGroup}>
          {/* Only show back button on desktop */}
          {!isMobileNav && (
            <button
              onClick={handleBack}
              className={styles.backButton}
            >
              <span>←</span>
              <span>
                {arrangement.songSlug 
                  ? 'Back to Song' 
                  : (location.state as { fromSong?: string } | null)?.fromSong 
                    ? 'Back to Song'  
                    : 'Back to Songs'}
              </span>
            </button>
          )}
          
          {isSignedIn && arrangement.slug && (arrangement.createdBy === userId || isAdmin) && (
            <Link
              to={`/arrangements/${arrangement.slug}/edit`}
              className={styles.editButton}
            >
              <span>✏️</span>
              <span>Edit Chords</span>
            </Link>
          )}
        </div>
        
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>
            {arrangement.name}
          </h1>
          {arrangement.songTitle && (
            <p className={styles.subtitle}>
              {arrangement.songTitle}
              {arrangement.artist && ` - ${arrangement.artist}`}
            </p>
          )}
          {/* Show moderation badge for moderators */}
          {(isModerator || isAdmin) && arrangement.metadata && (
            <div className={styles.moderationBadgeContainer}>
              <ModerationBadge 
                moderationStatus={arrangement.metadata.moderationStatus}
                isPrivate={!arrangement.metadata.isPublic}
              />
            </div>
          )}
        </div>
        
      </div>
    </header>
  )
}