import { useNavigate } from 'react-router-dom'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.9)' }}>
        Welcome to HSA Songbook
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '3rem' }}>
        Your digital companion for worship songs and setlists
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div
          onClick={() => navigate('/songs')}
          style={{
            padding: '2rem',
            backgroundColor: '#1f2937',
            color: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            border: '1px solid #374151',
            cursor: 'pointer',
            transition: 'transform 0.2s, border-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = '#4f46e5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = '#374151'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)' }}>Browse Songs</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Explore our library of worship songs
          </p>
        </div>

        <div
          onClick={() => navigate('/search')}
          style={{
            padding: '2rem',
            backgroundColor: '#1f2937',
            color: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            border: '1px solid #374151',
            cursor: 'pointer',
            transition: 'transform 0.2s, border-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = '#4f46e5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = '#374151'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)' }}>Search</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Find songs by title, artist, or theme
          </p>
        </div>

        <div
          onClick={() => navigate('/setlists')}
          style={{
            padding: '2rem',
            backgroundColor: '#1f2937',
            color: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            border: '1px solid #374151',
            cursor: 'pointer',
            transition: 'transform 0.2s, border-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = '#4f46e5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = '#374151'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)' }}>Setlists</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Create and manage worship setlists
          </p>
        </div>
      </div>
    </div>
  )
}
