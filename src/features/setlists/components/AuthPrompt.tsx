import { useState } from 'react'
import { EmailAuthForm } from '@features/auth/components/EmailAuthForm'

export function AuthPrompt() {
  const [showForm, setShowForm] = useState(false)

  if (showForm) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: '8px',
          padding: '2rem',
          position: 'relative',
          maxWidth: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <button
            onClick={() => setShowForm(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              padding: '0.25rem',
              lineHeight: 1
            }}
            aria-label="Close"
          >
            ×
          </button>
          <EmailAuthForm onSuccess={() => setShowForm(false)} />
        </div>
      </div>
    )
  }
  
  return (
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
      <button
        onClick={() => setShowForm(true)}
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
    </div>
  )
}