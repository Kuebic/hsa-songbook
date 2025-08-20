import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

export function UserMenu() {
  const { user, getUserName, getUserAvatar, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
      // Redirect to home page after sign out
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!user) {
    return null
  }

  const userName = getUserName()
  const userAvatar = getUserAvatar()

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '50%',
          border: '2px solid #e5e7eb',
          background: userAvatar ? `url(${userAvatar})` : '#6b7280',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}
      >
        {!userAvatar && userName.charAt(0).toUpperCase()}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 50,
            minWidth: '200px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}
          >
            <div style={{ fontWeight: '600', color: '#111827' }}>
              {userName}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {user.email}
            </div>
          </div>

          <div style={{ padding: '0.5rem 0' }}>
            <button
              onClick={() => {
                setIsOpen(false)
                // You could navigate to a profile page here
                console.log('Profile clicked')
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                color: '#374151',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Profile
            </button>

            <button
              onClick={() => {
                setIsOpen(false)
                // You could navigate to settings here
                console.log('Settings clicked')
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                color: '#374151',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Settings
            </button>

            <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '0.5rem 0' }} />

            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                color: '#dc2626',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}