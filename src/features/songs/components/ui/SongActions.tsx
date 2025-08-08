import { useState } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import { SongFormModal } from '../forms/SongFormModal'
import { useSongMutations } from '@features/songs/hooks/mutations/useSongMutations'
import { useNotification } from '@shared/components/notifications'
import type { Song } from '@features/songs/types/song.types'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'

interface SongActionsProps {
  song: Song
  onDelete?: (songId: string) => void
  onUpdate?: (song: Song) => void
}

export function SongActions({ song, onDelete, onUpdate }: SongActionsProps) {
  const { isSignedIn, user, isAdmin } = useAuth()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { updateSong, deleteSong } = useSongMutations()
  const { addNotification } = useNotification()
  
  // Check permissions
  const isOwner = user?.id === song.metadata.createdBy
  const canEdit = isSignedIn && (isOwner || isAdmin)
  const canDelete = isSignedIn && (isOwner || isAdmin)
  
  if (!canEdit && !canDelete) return null
  
  const handleUpdate = async (data: SongFormData) => {
    setIsSubmitting(true)
    
    try {
      const updatedSong = await updateSong(song.id, data)
      
      addNotification({
        type: 'success',
        title: 'Song updated successfully',
        message: `"${updatedSong.title}" has been updated`
      })
      
      onUpdate?.(updatedSong)
      setShowEditModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to update song',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
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
  
  const actionContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginTop: '12px'
  }
  
  const buttonStyles: React.CSSProperties = {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s'
  }
  
  const editButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    color: '#3b82f6'
  }
  
  const deleteButtonStyles: React.CSSProperties = {
    ...buttonStyles,
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
      <div style={actionContainerStyles}>
        {canEdit && (
          <button
            onClick={() => setShowEditModal(true)}
            style={editButtonStyles}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#eff6ff'
              e.currentTarget.style.borderColor = '#3b82f6'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = '#e2e8f0'
            }}
            aria-label={`Edit ${song.title}`}
            disabled={isSubmitting}
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>
        )}
        
        {canDelete && (
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
        )}
      </div>
      
      {showEditModal && (
        <SongFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdate}
          song={song}
          isSubmitting={isSubmitting}
        />
      )}
      
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