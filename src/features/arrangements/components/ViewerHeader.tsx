import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@features/auth'
import type { ViewerHeaderProps } from '../types/viewer.types'

export function ViewerHeader({ arrangement }: ViewerHeaderProps) {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
  
  const handleBack = () => {
    // Navigate back to the previous page
    navigate(-1)
  }
  
  return (
    <header className="viewer-header">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff'
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
              border: '1px solid #e2e8f0',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span>←</span>
            <span>Back</span>
          </button>
          
          {isSignedIn && arrangement.slug && (
            <Link
              to={`/arrangements/${arrangement.slug}/edit`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#8b5cf6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#7c3aed'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#8b5cf6'
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
              color: '#6b7280',
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
              backgroundColor: '#eff6ff',
              color: '#1e40af',
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
              backgroundColor: '#f0fdf4',
              color: '#166534',
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
              backgroundColor: arrangement.difficulty === 'beginner' ? '#f0f9ff' :
                             arrangement.difficulty === 'intermediate' ? '#fef3c7' :
                             '#fee2e2',
              color: arrangement.difficulty === 'beginner' ? '#0369a1' :
                     arrangement.difficulty === 'intermediate' ? '#92400e' :
                     '#991b1b',
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