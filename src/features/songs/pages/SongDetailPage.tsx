import { useParams, useNavigate } from 'react-router-dom'
// import { useState } from 'react' // Currently unused after removing sheet functionality
import { SongViewer } from '../components/SongViewer'
import { ArrangementList } from '../components/arrangements/ArrangementList'
import { useSong } from '../hooks/useSongs'
import { useArrangements } from '../hooks/useArrangements'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useArrangementMutations } from '../hooks/useArrangementMutations'
import { useNotification } from '@shared/components/notifications'
import type { Arrangement } from '../types/song.types'

export function SongDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { song, loading, error } = useSong(slug || '', true)
  const { 
    arrangements, 
    refreshArrangements
  } = useArrangements(song?.id)
  const { deleteArrangement } = useArrangementMutations()
  const { addNotification } = useNotification()
  // Note: Arrangement editing functionality removed temporarily
  // const [editingArrangement, setEditingArrangement] = useState<Arrangement | null>(null)
  // const [showArrangementSheet, setShowArrangementSheet] = useState(false)

  const handleEditArrangement = (_arrangement: Arrangement) => {
    // TODO: Implement arrangement editing
    console.log('Edit arrangement functionality coming soon')
  }

  const handleDeleteArrangement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this arrangement?')) {
      return
    }
    
    try {
      await deleteArrangement(id)
      addNotification({
        type: 'success',
        title: 'Arrangement Deleted',
        message: 'The arrangement has been removed successfully'
      })
      refreshArrangements()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete arrangement'
      })
    }
  }

  // Note: Sheet-related handlers removed temporarily
  // const handleArrangementSheetClose = () => {
  //   setShowArrangementSheet(false)
  //   setEditingArrangement(null)
  // }
  //
  // const handleArrangementSuccess = () => {
  //   refreshArrangements()
  //   handleArrangementSheetClose()
  // }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading song...
      </div>
    )
  }

  if (error || !song) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--status-error)', marginBottom: '1rem' }}>
          {error || 'Song not found'}
        </p>
        <button 
          onClick={() => navigate('/songs')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--status-info)',
            color: 'var(--color-background)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Songs
        </button>
      </div>
    )
  }

  return (
    <div>
      <button 
        onClick={() => navigate('/songs')}
        style={{
          margin: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--color-accent)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Back to Songs
      </button>
      
      <SongViewer 
        song={song} 
      />
      
      {/* Arrangement Management Section */}
      <div style={{ 
        padding: '1rem 2rem', 
        borderTop: '1px solid var(--color-border)',
        marginTop: '2rem' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            Arrangements
          </h2>
          {/* TODO: Add arrangement creation functionality */}
          <span style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-secondary)',
            fontStyle: 'italic'
          }}>
            Arrangement creation coming soon
          </span>
        </div>
        
        {arrangements.length > 0 ? (
          <ArrangementList
            arrangements={arrangements}
            onEdit={user ? handleEditArrangement : undefined}
            onDelete={isAdmin ? handleDeleteArrangement : undefined}
            songTitle={song.title}
            songSlug={song.slug}
          />
        ) : (
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontStyle: 'italic',
            fontSize: '0.875rem'
          }}>
            No arrangements yet. Add one to get started!
          </p>
        )}
      </div>
      
      {/* TODO: Add arrangement editing functionality */}
    </div>
  )
}