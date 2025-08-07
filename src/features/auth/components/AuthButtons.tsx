import { SignInButton, SignUpButton } from '@clerk/clerk-react'

export function AuthButtons() {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <SignInButton mode="modal">
        <button
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            color: 'white',
            border: '1px solid white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
            e.currentTarget.style.color = '#1e293b'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'white'
          }}
        >
          Sign In
        </button>
      </SignInButton>
      
      <SignUpButton mode="modal">
        <button
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6'
          }}
        >
          Sign Up
        </button>
      </SignUpButton>
    </div>
  )
}