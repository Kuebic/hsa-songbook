import { useState } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import { ArrangementSheet } from './ArrangementSheet'

interface AddArrangementButtonProps {
  songId: string
  songTitle?: string
  onArrangementAdded?: () => void
  variant?: 'primary' | 'secondary'
}

export function AddArrangementButton({ 
  songId, 
  songTitle,
  onArrangementAdded,
  variant = 'primary' 
}: AddArrangementButtonProps) {
  const { isSignedIn } = useAuth()
  const [showModal, setShowModal] = useState(false)
  
  // Only show for authenticated users
  if (!isSignedIn) {
    return null
  }
  
  const handleSuccess = () => {
    setShowModal(false)
    onArrangementAdded?.()
  }
  
  const buttonStyles = {
    primary: {
      padding: '0.5rem 1rem',
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-primary-foreground)',
      border: 'none',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: 500,
      transition: 'background-color 0.2s'
    },
    secondary: {
      padding: '0.5rem 1rem',
      backgroundColor: 'transparent',
      color: 'var(--color-primary)',
      border: '1px solid var(--color-primary)',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: 500,
      transition: 'all 0.2s'
    }
  }
  
  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        style={buttonStyles[variant]}
        aria-label="Add new arrangement"
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Arrangement
        </span>
      </button>
      
      {showModal && (
        <ArrangementSheet
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          songId={songId}
          songTitle={songTitle}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}