import { useNavigate } from 'react-router-dom'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        Welcome to HSA Songbook
      </h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
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
            backgroundColor: 'var(--color-background)',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Browse Songs</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Explore our library of worship songs
          </p>
        </div>

        <div 
          onClick={() => navigate('/search')}
          style={{
            padding: '2rem',
            backgroundColor: 'var(--color-background)',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Search</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Find songs by title, artist, or theme
          </p>
        </div>

        <div 
          onClick={() => navigate('/setlists')}
          style={{
            padding: '2rem',
            backgroundColor: 'var(--color-background)',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Setlists</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Create and manage worship setlists
          </p>
        </div>
      </div>
    </div>
  )
}