import type { SimilarSong } from '../../validation/utils/duplicateDetection'

interface DuplicateWarningProps {
  similarSongs: SimilarSong[]
  onContinue: () => void
}

export function DuplicateWarning({ similarSongs, onContinue }: DuplicateWarningProps) {
  const warningStyles: React.CSSProperties = {
    padding: '16px',
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    marginBottom: '16px'
  }
  
  const titleStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#92400e',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
  
  const listStyles: React.CSSProperties = {
    margin: '8px 0',
    paddingLeft: '20px'
  }
  
  const listItemStyles: React.CSSProperties = {
    color: '#92400e',
    fontSize: '14px',
    marginBottom: '4px'
  }
  
  const buttonStyles: React.CSSProperties = {
    marginTop: '12px',
    padding: '6px 12px',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500
  }
  
  const buttonHoverStyles: React.CSSProperties = {
    backgroundColor: '#d97706'
  }
  
  const getSimilarityLabel = (similarity: string) => {
    switch (similarity) {
      case 'exact':
        return '(Exact match)'
      case 'very-similar':
        return '(Very similar)'
      case 'similar':
        return '(Similar)'
      default:
        return ''
    }
  }
  
  return (
    <div style={warningStyles} role="alert" aria-live="polite">
      <div style={titleStyles}>
        <span role="img" aria-label="Warning">⚠️</span>
        Similar songs found in the database
      </div>
      <p style={{ color: '#92400e', fontSize: '14px', margin: '8px 0' }}>
        The following songs may be duplicates:
      </p>
      <ul style={listStyles}>
        {similarSongs.slice(0, 5).map(({ song, similarity }) => (
          <li key={song.id} style={listItemStyles}>
            <strong>{song.title}</strong>
            {song.artist && ` by ${song.artist}`}
            {' '}
            <span style={{ fontStyle: 'italic' }}>
              {getSimilarityLabel(similarity)}
            </span>
          </li>
        ))}
        {similarSongs.length > 5 && (
          <li style={{ ...listItemStyles, fontStyle: 'italic' }}>
            ...and {similarSongs.length - 5} more
          </li>
        )}
      </ul>
      <button 
        type="button" 
        onClick={onContinue} 
        style={buttonStyles}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, buttonHoverStyles)
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, { backgroundColor: '#f59e0b' })
        }}
      >
        Continue Anyway
      </button>
    </div>
  )
}