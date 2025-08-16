interface ProgressIndicatorProps {
  current: number
  total: number
  onJumpTo: (index: number) => void
}

export function ProgressIndicator({ current, total, onJumpTo }: ProgressIndicatorProps) {
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0
  
  return (
    <div className="progress-indicator" style={{
      padding: '0.75rem 1rem',
      borderBottom: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-background)',
      flexShrink: 0
    }}>
      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: 'var(--color-muted)',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '0.75rem',
        position: 'relative',
        cursor: 'pointer'
      }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const clickPercentage = clickX / rect.width
        const targetIndex = Math.floor(clickPercentage * total)
        const clampedIndex = Math.max(0, Math.min(total - 1, targetIndex))
        onJumpTo(clampedIndex)
      }}
      >
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: 'var(--color-primary)',
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
        
        {/* Position markers */}
        {Array.from({ length: total }, (_, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${((index + 1) / total) * 100}%`,
              top: '0',
              bottom: '0',
              width: '1px',
              backgroundColor: 'var(--color-border)',
              opacity: 0.5
            }}
          />
        ))}
      </div>
      
      {/* Song indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)'
      }}>
        <span>
          Song {current + 1} of {total}
        </span>
        
        {/* Quick jump buttons for first few songs */}
        <div style={{
          display: 'flex',
          gap: '0.25rem'
        }}>
          {Array.from({ length: Math.min(9, total) }, (_, index) => (
            <button
              key={index}
              onClick={() => onJumpTo(index)}
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: index === current ? 'var(--color-primary)' : 'transparent',
                color: index === current ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${index === current ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (index !== current) {
                  e.currentTarget.style.backgroundColor = 'var(--color-muted)'
                }
              }}
              onMouseLeave={(e) => {
                if (index !== current) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
              aria-label={`Jump to song ${index + 1}`}
              title={`Jump to song ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
          
          {total > 9 && (
            <span style={{
              padding: '0 0.5rem',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              ...
            </span>
          )}
        </div>
        
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          {progress.toFixed(0)}% complete
        </div>
      </div>
    </div>
  )
}