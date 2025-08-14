import { useEffect, useState } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus()
  const [showBackOnline, setShowBackOnline] = useState(false)

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowBackOnline(true)
      const timer = setTimeout(() => {
        setShowBackOnline(false)
      }, 3000) // Show "back online" message for 3 seconds

      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline])

  // Show "back online" notification
  if (showBackOnline) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--status-success)',
          color: 'var(--color-primary-foreground)',
          padding: '12px 24px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          animation: 'slideDown 0.3s ease-out'
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 11.5l-2-2L7.06 8.44 8 9.38l2.94-2.94L12 7.5l-4 4z"
            fill="white"
          />
        </svg>
        <span style={{ fontWeight: 500 }}>Back online!</span>
      </div>
    )
  }

  // Show offline indicator
  if (!isOnline) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--status-warning)',
          color: 'var(--color-primary-foreground)',
          padding: '12px 24px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 9999
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.707 2.293a1 1 0 00-1.414 1.414l6.921 6.922a2.003 2.003 0 002.622 2.622l6.871 6.871a1 1 0 001.414-1.414l-16.414-16.415z"
            fill="white"
          />
          <path
            d="M5.511 8.098l1.414 1.414a4 4 0 004.563 4.563l1.414 1.414a6 6 0 01-7.391-7.391zm9.391-2.587a6 6 0 00-6.804.588l1.414 1.414a4 4 0 014.389-.588l1.001-1.414z"
            fill="white"
          />
        </svg>
        <span style={{ fontWeight: 500 }}>You're offline</span>
      </div>
    )
  }

  return null
}

// Add CSS animation for slide down effect
if (typeof document !== 'undefined' && !document.querySelector('#offline-indicator-styles')) {
  const style = document.createElement('style')
  style.id = 'offline-indicator-styles'
  style.textContent = `
    @keyframes slideDown {
      from {
        transform: translateX(-50%) translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }
  `
  document.head.appendChild(style)
}