
export function SetlistsPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          color: 'var(--text-primary)'
        }}>
          🚧 Under Construction
        </h1>

        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1.5rem',
          color: 'var(--text-primary)'
        }}>
          Setlists Feature Coming Soon
        </h2>

        <p style={{
          fontSize: '1.125rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          marginBottom: '2rem'
        }}>
          We're working hard to bring you an amazing setlist management experience.
          This feature will allow you to create, organize, and share your performance setlists.
        </p>

        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--color-accent)',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            marginBottom: '1rem',
            color: 'var(--text-primary)'
          }}>
            Planned Features:
          </h3>
          <ul style={{
            textAlign: 'left',
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            listStyle: 'none',
            padding: 0
          }}>
            <li style={{ marginBottom: '0.5rem' }}>✨ Create and manage multiple setlists</li>
            <li style={{ marginBottom: '0.5rem' }}>🎵 Drag and drop song ordering</li>
            <li style={{ marginBottom: '0.5rem' }}>📱 Mobile-friendly performance mode</li>
            <li style={{ marginBottom: '0.5rem' }}>🎸 Transpose songs within setlists</li>
            <li style={{ marginBottom: '0.5rem' }}>📤 Export and share setlists</li>
          </ul>
        </div>

        <button
          onClick={() => window.history.back()}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-dark, #2563eb)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary)'
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  )
}

// Export placeholder functions for any required APIs
export function useSetlists() {
  return {
    setlists: [],
    isLoading: false,
    error: null
  }
}

export function useSetlist(_id: string) {
  return {
    setlist: null,
    isLoading: false,
    error: null
  }
}
