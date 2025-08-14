import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { SongViewer } from '../components/SongViewer'
import { AddArrangementButton } from '../components/arrangements/AddArrangementButton'
import { ArrangementList } from '../components/arrangements/ArrangementList'
import { useSong } from '../hooks/useSongs'
import { useArrangements } from '../hooks/useArrangements'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useArrangementMutations } from '../hooks/useArrangementMutations'
import { ArrangementSheet } from '../components/arrangements/ArrangementSheet'
import { useNotification } from '@shared/components/notifications'
import type { Arrangement } from '../types/song.types'

export function SongDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { song, loading, error } = useSong(slug || '', true)
  const { 
    arrangements, 
    selectedArrangement,
    selectArrangement,
    refreshArrangements
  } = useArrangements(song?.id)
  const { deleteArrangement } = useArrangementMutations()
  const { addNotification } = useNotification()
  const [editingArrangement, setEditingArrangement] = useState<Arrangement | null>(null)
  const [showArrangementSheet, setShowArrangementSheet] = useState(false)

  const handleEditArrangement = (arrangement: Arrangement) => {
    setEditingArrangement(arrangement)
    setShowArrangementSheet(true)
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

  const handleArrangementSheetClose = () => {
    setShowArrangementSheet(false)
    setEditingArrangement(null)
  }

  const handleArrangementSuccess = () => {
    refreshArrangements()
    handleArrangementSheetClose()
  }

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
        arrangements={arrangements}
        selectedArrangementId={selectedArrangement?.id}
        onArrangementSelect={(id) => {
          const arr = arrangements.find(a => a.id === id)
          if (arr) selectArrangement(arr)
        }}
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
          <AddArrangementButton 
            songId={song.id} 
            songTitle={song.title}
            onArrangementAdded={refreshArrangements}
          />
        </div>
        
        {arrangements.length > 0 ? (
          <ArrangementList
            arrangements={arrangements}
            selectedId={selectedArrangement?.id}
            onSelect={(arr) => selectArrangement(arr)}
            onEdit={user ? handleEditArrangement : undefined}
            onDelete={user?.role === 'admin' ? handleDeleteArrangement : undefined}
            compact
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
      
      {/* Edit Arrangement Sheet */}
      {showArrangementSheet && (
        <ArrangementSheet
          isOpen={showArrangementSheet}
          onClose={handleArrangementSheetClose}
          songId={song.id}
          songTitle={song.title}
          arrangement={editingArrangement || undefined}
          onSuccess={handleArrangementSuccess}
        />
      )}
    </div>
  )
}