import { useAuth } from '@features/auth/hooks/useAuth'
import { useSongModal } from '../../contexts/SongModalContext'

export function AddSongButton() {
  const { isSignedIn, isLoaded } = useAuth()
  const { openCreateModal } = useSongModal()
  
  const handleButtonClick = () => {
    openCreateModal()
  }
  
  // Don't render until auth state is loaded
  if (!isLoaded) return null
  
  // Only show for authenticated users
  if (!isSignedIn) return null
  
  return (
    <button 
      onClick={handleButtonClick}
      aria-label="Add new song"
      title="Add a new song to the library"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--status-success)',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'opacity 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
    >
      <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>+</span>
      Add Song
    </button>
  )
}