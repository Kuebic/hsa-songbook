import type { Setlist } from '../types/setlist.types'

interface SetlistCardProps {
  setlist: Setlist
  onClick?: (setlist: Setlist) => void
  onDelete?: (id: string) => void
}

export function SetlistCard({ setlist, onClick, onDelete }: SetlistCardProps) {
  const formattedDate = new Date(setlist.updatedAt).toLocaleDateString()
  
  return (
    <div 
      style={{
        padding: '1rem',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        backgroundColor: 'var(--color-card)'
      }}
      onClick={() => onClick?.(setlist)}
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'start' 
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
            {setlist.name}
          </h3>
          {setlist.description && (
            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
              {setlist.description}
            </p>
          )}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            fontSize: '0.875rem', 
            color: 'var(--text-tertiary)' 
          }}>
            <span>📝 {setlist.arrangements.length} arrangements</span>
            <span>📅 {formattedDate}</span>
            {setlist.isPublic && <span>🌐 Public</span>}
          </div>
        </div>
        
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(setlist.id)
            }}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: 'var(--status-error)',
              color: 'var(--color-destructive-foreground)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}