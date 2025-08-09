import { useState } from 'react'
import { useAuth } from '@features/auth'
import { useNotification } from '@shared/components/notifications'
import type { Arrangement } from '@features/songs/types/song.types'

interface ArrangementListProps {
  arrangements: Arrangement[]
  onSelect?: (arrangement: Arrangement) => void
  onEdit?: (arrangement: Arrangement) => void
  onDelete?: (arrangementId: string) => Promise<void>
  selectedId?: string
  showActions?: boolean
  className?: string
}

export function ArrangementList({
  arrangements,
  onSelect,
  onEdit,
  onDelete,
  selectedId,
  showActions = true,
  className = ''
}: ArrangementListProps) {
  const { isSignedIn, isAdmin } = useAuth()
  const { addNotification } = useNotification()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const handleDelete = async (arrangement: Arrangement) => {
    if (!onDelete) return
    
    const confirmed = confirm(
      `Are you sure you want to delete the arrangement "${arrangement.name}"? This action cannot be undone.`
    )
    
    if (!confirmed) return
    
    setDeletingId(arrangement.id)
    
    try {
      await onDelete(arrangement.id)
      addNotification({
        type: 'success',
        title: 'Arrangement deleted',
        message: `"${arrangement.name}" has been deleted successfully`
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setDeletingId(null)
    }
  }
  
  const formatDifficulty = (difficulty: string) => {
    const colors = {
      beginner: '#22c55e',
      intermediate: '#f59e0b', 
      advanced: '#ef4444'
    }
    
    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 500,
        backgroundColor: colors[difficulty as keyof typeof colors] || '#6b7280',
        color: 'white',
        textTransform: 'capitalize'
      }}>
        {difficulty}
      </span>
    )
  }
  
  const formatTags = (tags: string[]) => {
    if (!tags || tags.length === 0) return null
    
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
        {tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            style={{
              padding: '2px 6px',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 500
            }}
          >
            {tag}
          </span>
        ))}
        {tags.length > 3 && (
          <span style={{
            fontSize: '10px',
            color: '#9ca3af',
            fontStyle: 'italic'
          }}>
            +{tags.length - 3} more
          </span>
        )}
      </div>
    )
  }
  
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }
  
  const itemStyles = (arrangement: Arrangement): React.CSSProperties => ({
    padding: '16px',
    backgroundColor: selectedId === arrangement.id ? '#eff6ff' : '#ffffff',
    border: selectedId === arrangement.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: onSelect ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    position: 'relative'
  })
  
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px'
  }
  
  const titleStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '4px'
  }
  
  const metaStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
    fontSize: '11px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
  
  if (arrangements.length === 0) {
    return (
      <div className={className} style={{
        textAlign: 'center',
        padding: '32px 16px',
        color: '#64748b',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px dashed #d1d5db'
      }}>
        <div style={{ fontSize: '14px', marginBottom: '4px' }}>No arrangements available</div>
        <div style={{ fontSize: '12px' }}>Create an arrangement to get started</div>
      </div>
    )
  }
  
  return (
    <div className={className} style={containerStyles}>
      {arrangements.map((arrangement) => (
        <div
          key={arrangement.id}
          style={itemStyles(arrangement)}
          onClick={() => onSelect?.(arrangement)}
        >
          {deletingId === arrangement.id && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              zIndex: 10
            }}>
              <span style={{ color: '#ef4444' }}>⟳ Deleting...</span>
            </div>
          )}
          
          <div style={headerStyles}>
            <div style={{ flex: 1 }}>
              <div style={titleStyles}>{arrangement.name}</div>
              
              <div style={metaStyles}>
                {arrangement.key && <span>Key: {arrangement.key}</span>}
                {arrangement.tempo && <span>Tempo: {arrangement.tempo} BPM</span>}
                {arrangement.timeSignature && <span>Time: {arrangement.timeSignature}</span>}
                {arrangement.difficulty && formatDifficulty(arrangement.difficulty)}
                {arrangement.capo && <span>Capo: {arrangement.capo}</span>}
              </div>
              
              {formatTags(arrangement.tags)}
            </div>
            
            {showActions && (isSignedIn || isAdmin) && (
              <div style={actionsStyles}>
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(arrangement)
                    }}
                    style={{
                      ...actionButtonStyles,
                      color: '#3b82f6',
                      borderColor: '#3b82f6'
                    }}
                  >
                    Edit
                  </button>
                )}
                
                {onDelete && isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(arrangement)
                    }}
                    disabled={deletingId === arrangement.id}
                    style={{
                      ...actionButtonStyles,
                      color: '#ef4444',
                      borderColor: '#ef4444',
                      opacity: deletingId === arrangement.id ? 0.5 : 1
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
          
          {arrangement.notes && (
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#6b7280',
              fontStyle: 'italic',
              lineHeight: '1.4'
            }}>
              {arrangement.notes}
            </div>
          )}
          
          {arrangement.duration && (
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '12px',
              fontSize: '10px',
              color: '#9ca3af'
            }}>
              ~{Math.round(arrangement.duration / 60)}min
            </div>
          )}
          
          {selectedId === arrangement.id && (
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 500
            }}>
              Selected
            </div>
          )}
        </div>
      ))}
    </div>
  )
}