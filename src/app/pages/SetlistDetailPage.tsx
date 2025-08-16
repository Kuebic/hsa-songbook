import { useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SetlistBuilder } from '@features/setlists'
import type { SetlistArrangement } from '@features/setlists'
import { useSetlists } from '@features/setlists'
import { useArrangements } from '@features/songs'
import type { Arrangement } from '@features/songs'

export function SetlistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { arrangements: availableArrangements } = useArrangements()
  const { 
    setlists, 
    loading, 
    addArrangementToSetlist, 
    removeArrangementFromSetlist, 
    reorderArrangements, 
    updateSetlist 
  } = useSetlists()
  
  // Get the specific setlist from the setlists array
  const setlist = useMemo(() => {
    return setlists.find(sl => sl.id === id) || null
  }, [setlists, id])

  // Memoize available arrangements that aren't already in the setlist
  const filteredAvailableArrangements = useMemo(() => {
    if (!setlist || !availableArrangements) return availableArrangements
    
    const arrangementIdsInSetlist = new Set(setlist.arrangements.map(a => a.arrangementId))
    return availableArrangements.filter(arrangement => !arrangementIdsInSetlist.has(arrangement.id))
  }, [availableArrangements, setlist])

  // Memoize callback functions to prevent unnecessary re-renders
  const handleAddArrangement = useCallback((arrangement: Arrangement, notes?: string) => {
    if (setlist) {
      addArrangementToSetlist(setlist.id, arrangement, notes)
    }
  }, [setlist, addArrangementToSetlist])

  const handleRemoveArrangement = useCallback((index: number) => {
    if (setlist) {
      removeArrangementFromSetlist(setlist.id, index)
    }
  }, [setlist, removeArrangementFromSetlist])

  const handleReorderArrangements = useCallback((arrangements: SetlistArrangement[]) => {
    if (setlist) {
      reorderArrangements(setlist.id, arrangements)
    }
  }, [setlist, reorderArrangements])

  const handleUpdateName = useCallback((name: string) => {
    if (setlist) {
      updateSetlist(setlist.id, { name })
    }
  }, [setlist, updateSetlist])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading setlist...
      </div>
    )
  }

  if (!setlist) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--status-error)', marginBottom: '1rem' }}>
          Setlist not found
        </p>
        <button 
          onClick={() => navigate('/setlists')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--status-info)',
            color: 'var(--color-background)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Setlists
        </button>
      </div>
    )
  }

  return (
    <div>
      <button 
        onClick={() => navigate('/setlists')}
        style={{
          margin: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--color-accent)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Back to Setlists
      </button>

      <SetlistBuilder
        setlist={setlist}
        availableArrangements={filteredAvailableArrangements}
        onAddArrangement={handleAddArrangement}
        onRemoveArrangement={handleRemoveArrangement}
        onReorder={handleReorderArrangements}
        onUpdateName={handleUpdateName}
      />
    </div>
  )
}