interface PlaybackHeaderProps {
  setlistName: string
  currentIndex: number
  totalCount: number
  onExit: () => void
}

export function PlaybackHeader({ 
  setlistName, 
  currentIndex, 
  totalCount, 
  onExit 
}: PlaybackHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 1rem',
      borderBottom: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-card)'
    }}>
      <button 
        onClick={onExit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'none',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.875rem'
        }}
      >
        <span>←</span>
        <span>Back</span>
      </button>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <h2 style={{
          fontWeight: '600',
          fontSize: '1.125rem',
          color: 'var(--text-primary)',
          margin: 0
        }}>
          {setlistName}
        </h2>
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          {currentIndex + 1} of {totalCount}
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        alignItems: 'center'
      }}>
        {/* Progress dots */}
        {Array.from({ length: Math.min(totalCount, 10) }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              transition: 'background-color 0.2s',
              backgroundColor: i === currentIndex 
                ? 'var(--color-primary)' 
                : i < currentIndex 
                  ? 'var(--color-muted)' 
                  : 'var(--color-border)'
            }}
          />
        ))}
        {totalCount > 10 && (
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginLeft: '0.25rem'
          }}>
            +{totalCount - 10}
          </span>
        )}
      </div>
    </div>
  )
}