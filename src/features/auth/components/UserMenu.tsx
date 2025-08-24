import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './UserMenu.module.css'

export function UserMenu() {
  const { user, session, getUserName, getUserAvatar, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

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
      console.log('Attempting to sign out...')
      setIsOpen(false) // Close menu immediately for better UX
      
      // Call signOut with built-in timeout protection
      await signOut()
      
      console.log('Sign out completed, navigating to home...')
      
      // Navigate to home
      navigate('/')
      
      // Force reload to ensure complete state reset
      // This is a fallback to ensure all cached state is cleared
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } catch (error) {
      console.error('Error during sign out:', error)
      
      // Even on error, still navigate and reload
      // The AuthContext will have cleared local state
      navigate('/')
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }

  // Use session.user as fallback if user is null
  const currentUser = user || session?.user
  
  if (!currentUser) {
    return null
  }

  const userName = getUserName() || currentUser.email?.split('@')[0] || 'User'
  const userAvatar = getUserAvatar()

  return (
    <div ref={menuRef} className={styles.container}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.avatarButton}
        style={userAvatar ? { backgroundImage: `url(${userAvatar})` } : undefined}
      >
        {!userAvatar && userName.charAt(0).toUpperCase()}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{userName}</div>
            <div className={styles.userEmail}>{currentUser.email}</div>
          </div>

          <div className={styles.menuItems}>
            <button
              onClick={() => {
                setIsOpen(false)
                console.log('Profile clicked')
              }}
              className={styles.menuButton}
            >
              Profile
            </button>

            <button
              onClick={() => {
                setIsOpen(false)
                console.log('Settings clicked')
              }}
              className={styles.menuButton}
            >
              Settings
            </button>

            <div className={styles.divider} />

            <button
              onClick={handleSignOut}
              className={styles.signOutButton}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}