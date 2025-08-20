import { useState } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useSongMutations } from '@features/songs/hooks/mutations/useSongMutations'
import { useNotification } from '@shared/components/notifications'
import type { Song } from '@features/songs/types/song.types'

interface SongActionsProps {
  song: Song
  onDelete?: (songId: string) => void
}

export function SongActions({ song, onDelete }: SongActionsProps) {
  const { isSignedIn, user, isAdmin } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { deleteSong } = useSongMutations()
  const { addNotification } = useNotification()
  
  // Check permissions
  const isOwner = user?.id === song.metadata.createdBy
  const canDelete = isSignedIn && (isOwner || isAdmin)
  
  if (!canDelete) return null
  
  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      await deleteSong(song.id)
      
      addNotification({
        type: 'success',
        title: 'Song deleted',
        message: `"${song.title}" has been removed from the songbook`
      })
      
      onDelete?.(song.id)
      setShowDeleteConfirm(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to delete song',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setIsDeleting(false)
    }
  }
  
  const deleteButtonStyles: React.CSSProperties = {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s',
    color: '#ef4444'
  }
  
  const confirmDialogStyles: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
    maxWidth: '400px',
    width: '90%'
  }
  
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999
  }
  
  return (
    <>
      <button
        onClick={() => setShowDeleteConfirm(true)}
        style={deleteButtonStyles}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#fef2f2'
          e.currentTarget.style.borderColor = '#ef4444'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.borderColor = '#e2e8f0'
        }}
        aria-label={`Delete ${song.title}`}
        disabled={isDeleting}
      >
        <span>🗑️</span>
        <span>Delete</span>
      </button>
      
      {showDeleteConfirm && (
        <>
          <div style={overlayStyles} onClick={() => setShowDeleteConfirm(false)} />
          <div style={confirmDialogStyles} role="alertdialog">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              Delete Song
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b' }}>
              Are you sure you want to delete "{song.title}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}