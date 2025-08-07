import { useState, useEffect } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export function InstallPrompt() {
  const { isInstallable, isInstalled, platform, promptInstall, dismissPrompt } = useInstallPrompt()
  const [isDismissed, setIsDismissed] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  // Check if user has previously dismissed the prompt
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setIsDismissed(true)
      }
    }
  }, [])

  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowIOSInstructions(true)
    } else {
      const installed = await promptInstall()
      if (installed) {
        // Installation successful
        localStorage.removeItem('pwa-install-dismissed')
      }
    }
  }

  const handleDismiss = () => {
    dismissPrompt()
    setIsDismissed(true)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  const handleCloseIOSInstructions = () => {
    setShowIOSInstructions(false)
    handleDismiss()
  }

  // Don't show if already installed, dismissed, or not installable
  if (isInstalled || isDismissed || (!isInstallable && platform !== 'ios')) {
    return null
  }

  // Show iOS instructions modal
  if (showIOSInstructions) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}
        onClick={handleCloseIOSInstructions}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1f2937' }}>
            Install HSA Songbook on iOS
          </h2>
          <ol style={{ margin: '0 0 20px', paddingLeft: '20px', color: '#4b5563', lineHeight: 1.6 }}>
            <li>Tap the <strong>Share</strong> button (square with arrow) at the bottom of Safari</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Enter a name for the app and tap <strong>"Add"</strong></li>
            <li>The app will appear on your home screen</li>
          </ol>
          <button
            onClick={handleCloseIOSInstructions}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Got it
          </button>
        </div>
      </div>
    )
  }

  // Show install prompt banner
  return (
    <div
      className="install-prompt"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        borderRadius: '12px',
        padding: '16px',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
            fill="#3b82f6"
          />
          <path
            d="M12 12V8m0 8h.01M8 17h8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
          Install HSA Songbook
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
          Install our app for offline access and a better experience
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            padding: '8px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6'
          }}
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          style={{
            padding: '8px 20px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
          }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}