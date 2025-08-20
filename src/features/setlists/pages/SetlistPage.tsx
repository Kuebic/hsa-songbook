import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useSetlists } from '../hooks/useSetlists'
import { CreateSetlistForm } from '../components/CreateSetlistForm'
import { AuthPrompt } from '../components/AuthPrompt'
import { SetlistGrid } from '../components/SetlistGrid'

export function SetlistPage() {
  const navigate = useNavigate()
  const { isSignedIn, userId } = useAuth()
  const { setlists, loading, createSetlist, deleteSetlist } = useSetlists()
  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleCreate = (name: string, description: string) => {
    if (isSignedIn) {
      const newSetlist = createSetlist(name, description)
      navigate(`/setlists/${newSetlist.id}`)
    }
  }

  const handleSetlistClick = (setlist: { id: string }) => {
    navigate(`/setlists/${setlist.id}`)
  }

  // Memoize filtered setlists to avoid recomputing on every render
  const userSetlists = useMemo(
    () => setlists.filter(sl => sl.createdBy === userId),
    [setlists, userId]
  )
  
  const publicSetlists = useMemo(
    () => setlists.filter(sl => sl.isPublic && sl.createdBy !== userId),
    [setlists, userId]
  )

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading setlists...
      </div>
    )
  }

  return (
    <div>
      <header style={{ padding: '2rem', borderBottom: '1px solid var(--color-border)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>My Setlists</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Create and manage your worship setlists
        </p>
      </header>

      <div style={{ padding: '2rem' }}>
        {!showCreateForm ? (
          isSignedIn ? (
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--status-info)',
                color: 'var(--color-background)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                marginBottom: '2rem'
              }}
            >
              + Create New Setlist
            </button>
          ) : (
            <AuthPrompt />
          )
        ) : (
          <CreateSetlistForm 
            onCreate={handleCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {userSetlists.length === 0 && publicSetlists.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
            {isSignedIn 
              ? "No setlists yet. Create your first setlist to get started!"
              : "No public setlists available. Sign in to create your own!"}
          </p>
        ) : (
          <div>
            <SetlistGrid 
              title="My Setlists"
              setlists={userSetlists}
              onSetlistClick={handleSetlistClick}
              onDelete={deleteSetlist}
            />
            <SetlistGrid 
              title="Public Setlists"
              setlists={publicSetlists}
              onSetlistClick={handleSetlistClick}
              onDelete={undefined}
            />
          </div>
        )}
      </div>
    </div>
  )
}