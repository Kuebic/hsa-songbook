import { SignInButton } from '@clerk/clerk-react'

export function AuthPrompt() {
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
}