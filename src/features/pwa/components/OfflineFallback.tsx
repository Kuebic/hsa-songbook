import { useNavigate } from 'react-router-dom'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

interface OfflineFallbackProps {
  pageName?: string
  error?: Error | null
}

export function OfflineFallback({ pageName = 'This page', error }: OfflineFallbackProps) {
  const navigate = useNavigate()
  const { isOnline } = useOnlineStatus()

  // If we're back online, offer to reload
  if (isOnline) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#f0f9ff',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h2 style={{ 
            margin: '0 0 16px', 
            fontSize: '24px', 
            color: '#1e40af' 
          }}>
            Connection Restored!
          </h2>
          <p style={{ 
            margin: '0 0 24px', 
            color: '#64748b',
            lineHeight: 1.6 
          }}>
            You're back online. Would you like to reload the page?
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff7ed',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Offline Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 24px',
          backgroundColor: '#fed7aa',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.51 3.51a.75.75 0 011.06 0l16.92 16.92a.75.75 0 11-1.06 1.06L3.51 4.57a.75.75 0 010-1.06z"
              fill="#ea580c"
            />
            <path
              d="M1.05 9.05a.75.75 0 011.06 0 6.5 6.5 0 014.79-1.61l1.19 1.19a5 5 0 00-5.98.48.75.75 0 01-1.06-1.06zm4.95 4.95a.75.75 0 011.06 0 1.5 1.5 0 01.94-.43l2.57 2.57a3 3 0 01-3.51-3.2.75.75 0 01-1.06 1.06zm11.36-6.56a8 8 0 015.59 2.67.75.75 0 001.06-1.06 9.5 9.5 0 00-13.9 0l1.06 1.06a8 8 0 016.19-2.67z"
              fill="#ea580c"
            />
          </svg>
        </div>

        <h2 style={{ 
          margin: '0 0 16px', 
          fontSize: '24px', 
          color: '#c2410c' 
        }}>
          {pageName} is Not Available Offline
        </h2>
        
        <p style={{ 
          margin: '0 0 24px', 
          color: '#64748b',
          lineHeight: 1.6 
        }}>
          You need to visit this page at least once while online before it can be accessed offline. 
          Please connect to the internet and try again.
        </p>

        {error && process.env.NODE_ENV === 'development' && (
          <details style={{ 
            marginBottom: '24px',
            textAlign: 'left',
            backgroundColor: '#fff',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px'
          }}>
            <summary style={{ cursor: 'pointer', color: '#64748b' }}>
              Technical Details
            </summary>
            <pre style={{ 
              margin: '8px 0 0', 
              whiteSpace: 'pre-wrap',
              color: '#ef4444'
            }}>
              {error.message}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Go Home
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}