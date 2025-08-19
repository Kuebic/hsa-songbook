import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth'
import type { ViewerHeaderProps } from '../types/viewer.types'

export function ViewerHeader({ arrangement }: ViewerHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isSignedIn } = useAuth()
  
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
    <header className="viewer-header">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-background)'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-muted)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
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
          
          {isSignedIn && arrangement.slug && (
            <Link
              to={`/arrangements/${arrangement.slug}/edit`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              <span>✏️</span>
              <span>Edit Chords</span>
            </Link>
          )}
        </div>
        
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold',
            margin: 0
          }}>
            {arrangement.name}
          </h1>
          {arrangement.songTitle && (
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)',
              margin: '0.25rem 0 0 0'
            }}>
              {arrangement.songTitle}
              {arrangement.artist && ` - ${arrangement.artist}`}
            </p>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          {arrangement.key && (
            <span style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-primary)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Key: {arrangement.key}
            </span>
          )}
          {arrangement.tempo && (
            <span style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--status-success)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {arrangement.tempo} BPM
            </span>
          )}
          {arrangement.difficulty && (
            <span style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: 'var(--color-accent)',
              color: arrangement.difficulty === 'beginner' ? 'var(--status-success)' :
                     arrangement.difficulty === 'intermediate' ? 'var(--status-warning)' :
                     'var(--status-error)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              textTransform: 'capitalize'
            }}>
              {arrangement.difficulty}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}