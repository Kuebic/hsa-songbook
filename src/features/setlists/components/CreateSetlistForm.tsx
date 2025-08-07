import { useState } from 'react'
import { createSetlistSchema, useValidation } from '@shared/validation'

interface CreateSetlistFormProps {
  onCreate: (name: string, description: string) => void
  onCancel: () => void
}

export function CreateSetlistForm({ onCreate, onCancel }: CreateSetlistFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { validate, validateField, errors, clearErrors } = useValidation(createSetlistSchema)

  const handleCreate = () => {
    const result = validate({ name, description })
    if (result) {
      onCreate(result.name, result.description || '')
      handleCancel()
    }
  }

  const handleCancel = () => {
    setName('')
    setDescription('')
    clearErrors()
    onCancel()
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (errors.name) {
      validateField('name', value)
    }
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    if (errors.description) {
      validateField('description', value)
    }
  }

  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      marginBottom: '2rem'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>Create New Setlist</h3>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Setlist name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={() => validateField('name', name)}
          style={{
            width: '100%',
            padding: '0.5rem',
            marginBottom: '0.25rem',
            border: `1px solid ${errors.name ? '#ef4444' : '#e2e8f0'}`,
            borderRadius: '4px'
          }}
        />
        {errors.name && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: '0' }}>
            {errors.name}
          </p>
        )}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          onBlur={() => validateField('description', description)}
          style={{
            width: '100%',
            padding: '0.5rem',
            marginBottom: '0.25rem',
            border: `1px solid ${errors.description ? '#ef4444' : '#e2e8f0'}`,
            borderRadius: '4px',
            minHeight: '80px',
            resize: 'vertical'
          }}
        />
        {errors.description && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: '0' }}>
            {errors.description}
          </p>
        )}
      </div>
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
    </div>
  )
}