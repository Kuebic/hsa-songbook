import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { SignInButton } from '@clerk/clerk-react'
import { SetlistCard } from '../components/SetlistCard'
import { useSetlists } from '../hooks/useSetlists'

export function SetlistPage() {
  const navigate = useNavigate()
  const { isSignedIn, userId } = useAuth()
  const { setlists, loading, createSetlist, deleteSetlist } = useSetlists()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSetlistName, setNewSetlistName] = useState('')
  const [newSetlistDescription, setNewSetlistDescription] = useState('')

  const handleCreate = () => {
    if (newSetlistName.trim() && isSignedIn) {
      const newSetlist = createSetlist(newSetlistName, newSetlistDescription)
      navigate(`/setlists/${newSetlist.id}`)
    }
  }

  // Filter to show only user's setlists and public setlists
  const userSetlists = setlists.filter(sl => sl.createdBy === userId)
  const publicSetlists = setlists.filter(sl => sl.isPublic && sl.createdBy !== userId)

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading setlists...
      </div>
    )
  }

  return (
    <div>
      <header style={{ padding: '2rem', borderBottom: '1px solid #e2e8f0' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>My Setlists</h1>
        <p style={{ color: '#64748b' }}>
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
                backgroundColor: '#3b82f6',
                color: 'white',
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
            <div style={{
              padding: '1rem',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <p style={{ marginBottom: '1rem' }}>
                Sign in to create and manage your own setlists
              </p>
              <SignInButton mode="modal">
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
              </SignInButton>
            </div>
          )
        ) : (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Create New Setlist</h3>
            <input
              type="text"
              placeholder="Setlist name"
              value={newSetlistName}
              onChange={(e) => setNewSetlistName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginBottom: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px'
              }}
            />
            <textarea
              placeholder="Description (optional)"
              value={newSetlistDescription}
              onChange={(e) => setNewSetlistDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginBottom: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleCreate}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setNewSetlistName('')
                  setNewSetlistDescription('')
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#94a3b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {userSetlists.length === 0 && publicSetlists.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>
            {isSignedIn 
              ? "No setlists yet. Create your first setlist to get started!"
              : "No public setlists available. Sign in to create your own!"}
          </p>
        ) : (
          <div>
            {userSetlists.length > 0 && (
              <>
                <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>My Setlists</h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  {userSetlists.map(setlist => (
                    <SetlistCard
                      key={setlist.id}
                      setlist={setlist}
                      onClick={(sl) => navigate(`/setlists/${sl.id}`)}
                      onDelete={deleteSetlist}
                    />
                  ))}
                </div>
              </>
            )}
            
            {publicSetlists.length > 0 && (
              <>
                <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Public Setlists</h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1rem'
                }}>
                  {publicSetlists.map(setlist => (
                    <SetlistCard
                      key={setlist.id}
                      setlist={setlist}
                      onClick={(sl) => navigate(`/setlists/${sl.id}`)}
                      onDelete={setlist.createdBy === userId ? deleteSetlist : undefined}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}