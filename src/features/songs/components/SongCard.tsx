import type { Song } from '../types/song.types'

interface SongCardProps {
  song: Song
  onClick?: (song: Song) => void
}

export function SongCard({ song, onClick }: SongCardProps) {
  return (
    <div 
      className="song-card"
      onClick={() => onClick?.(song)}
      style={{
        padding: '1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        backgroundColor: 'var(--card-bg, white)'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
        {song.title}
      </h3>
      <p style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>
        {song.artist} {song.compositionYear && `(${song.compositionYear})`}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {song.themes.map(theme => (
          <span 
            key={theme}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#f1f5f9',
              borderRadius: '4px',
              fontSize: '0.875rem',
              color: '#475569'
            }}
          >
            {theme}
          </span>
        ))}
      </div>
      {song.metadata.ratings && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
          ⭐ {song.metadata.ratings.average.toFixed(1)} ({song.metadata.ratings.count} reviews)
        </div>
      )}
    </div>
  )
}