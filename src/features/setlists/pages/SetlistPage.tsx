import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SetlistCard } from '../components/SetlistCard'
import { useSetlists } from '../hooks/useSetlists'

export function SetlistPage() {
  const navigate = useNavigate()
  const { setlists, loading, createSetlist, deleteSetlist } = useSetlists()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSetlistName, setNewSetlistName] = useState('')
  const [newSetlistDescription, setNewSetlistDescription] = useState('')

  const handleCreate = () => {
    if (newSetlistName.trim()) {
      const newSetlist = createSetlist(newSetlistName, newSetlistDescription)
      navigate(`/setlists/${newSetlist.id}`)
    }
  }

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

        {setlists.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>
            No setlists yet. Create your first setlist to get started!
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {setlists.map(setlist => (
              <SetlistCard
                key={setlist.id}
                setlist={setlist}
                onClick={(sl) => navigate(`/setlists/${sl.id}`)}
                onDelete={deleteSetlist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}