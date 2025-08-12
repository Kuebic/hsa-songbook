import { useNavigate } from 'react-router-dom'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <h1 className="animate-fadeIn" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--color-foreground)' }}>
        Welcome to HSA Songbook
      </h1>
      <p className="animate-slideUp" style={{ fontSize: '1.25rem', color: 'var(--color-secondary)', marginBottom: '3rem' }}>
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
          className="animate-scaleIn"
          onClick={() => navigate('/songs')}
          style={{
            padding: '2rem',
            backgroundColor: 'var(--color-card)',
            color: 'var(--color-foreground)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
            animationDelay: '0.1s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = 'var(--color-primary)'
            e.currentTarget.style.backgroundColor = 'var(--color-card-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.backgroundColor = 'var(--color-card)'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-foreground)' }}>Browse Songs</h3>
          <p style={{ color: 'var(--color-secondary)', fontSize: '0.875rem' }}>
            Explore our library of worship songs
          </p>
        </div>

        <div
          className="animate-scaleIn"
          onClick={() => navigate('/search')}
          style={{
            padding: '2rem',
            backgroundColor: 'var(--color-card)',
            color: 'var(--color-foreground)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
            animationDelay: '0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = 'var(--color-primary)'
            e.currentTarget.style.backgroundColor = 'var(--color-card-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.backgroundColor = 'var(--color-card)'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-foreground)' }}>Search</h3>
          <p style={{ color: 'var(--color-secondary)', fontSize: '0.875rem' }}>
            Find songs by title, artist, or theme
          </p>
        </div>

        <div
          className="animate-scaleIn"
          onClick={() => navigate('/setlists')}
          style={{
            padding: '2rem',
            backgroundColor: 'var(--color-card)',
            color: 'var(--color-foreground)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
            animationDelay: '0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.borderColor = 'var(--color-primary)'
            e.currentTarget.style.backgroundColor = 'var(--color-card-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.backgroundColor = 'var(--color-card)'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-foreground)' }}>Setlists</h3>
          <p style={{ color: 'var(--color-secondary)', fontSize: '0.875rem' }}>
            Create and manage worship setlists
          </p>
        </div>
      </div>
    </div>
  )
}
