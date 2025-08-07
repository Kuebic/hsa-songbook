import { useState } from 'react'
import type { Setlist } from '../types/setlist.types'
import { setlistNameSchema } from '@shared/validation'

interface SetlistHeaderProps {
  setlist: Setlist
  onUpdateName?: (name: string) => void
}

export function SetlistHeader({ setlist, onUpdateName }: SetlistHeaderProps) {
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(setlist.name)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    try {
      const validatedName = setlistNameSchema.parse(newName)
      onUpdateName?.(validatedName)
      setEditingName(false)
      setError(null)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  const handleCancel = () => {
    setNewName(setlist.name)
    setEditingName(false)
    setError(null)
  }

  const handleNameChange = (value: string) => {
    setNewName(value)
    if (error) {
      setError(null)
    }
  }

  return (
    <header style={{ marginBottom: '2rem' }}>
      {editingName ? (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => handleNameChange(e.target.value)}
              style={{
                fontSize: '1.5rem',
                padding: '0.25rem',
                border: `1px solid ${error ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '4px'
              }}
            />
            <button
              onClick={handleSave}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
            <button
              onClick={handleCancel}
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
          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {error}
            </p>
          )}
        </div>
      ) : (
        <h2 
          style={{ fontSize: '1.5rem', cursor: 'pointer' }}
          onClick={() => setEditingName(true)}
        >
          {setlist.name} ✏️
        </h2>
      )}
      {setlist.description && (
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          {setlist.description}
        </p>
      )}
    </header>
  )
}