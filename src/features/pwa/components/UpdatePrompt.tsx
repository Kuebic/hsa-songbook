import { useServiceWorker } from '../hooks/useServiceWorker'

export function UpdatePrompt() {
  const { needRefresh, offlineReady, updateServiceWorker, close } = useServiceWorker()

  // Don't show anything if there's no update
  if (!needRefresh && !offlineReady) return null

  return (
    <div 
      className="update-prompt"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        borderRadius: '8px',
        padding: '16px',
        maxWidth: '320px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {offlineReady && !needRefresh && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-1 15l-5-5 1.41-1.41L9 12.17l7.59-7.59L18 6l-9 9z"
                fill="#10b981"
              />
            </svg>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
                Ready for offline use
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
                Content has been cached for offline access
              </p>
            </div>
          </div>
          <button
            onClick={close}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
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
            Dismiss
          </button>
        </>
      )}

      {needRefresh && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M10 2v6l4-4-4-4zm0 16v-6l-4 4 4 4zm0-8a2 2 0 100-4 2 2 0 000 4z"
                fill="#3b82f6"
              />
              <path
                d="M17.65 6.35A8 8 0 116.35 17.65 8 8 0 0117.65 6.35zM16 10a6 6 0 11-12 0 6 6 0 0112 0z"
                fill="#3b82f6"
              />
            </svg>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>
                New version available!
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
                Click update to get the latest features
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => updateServiceWorker(true)}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
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
              Update
            </button>
            <button
              onClick={close}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
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
              Later
            </button>
          </div>
        </>
      )}
    </div>
  )
}