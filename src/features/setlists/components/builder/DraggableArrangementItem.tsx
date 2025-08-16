import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import type { SetlistArrangement } from '../../types/setlist.types'

interface DraggableArrangementItemProps {
  item: SetlistArrangement
  setlistId: string
  onRemove: () => void
  onUpdateKey?: (key: string) => void
  disabled?: boolean
}

export function DraggableArrangementItem({ 
  item, 
  setlistId,
  onRemove, 
  onUpdateKey: _onUpdateKey,
  disabled 
}: DraggableArrangementItemProps) {
  const navigate = useNavigate()
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.arrangementId,
    disabled 
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  
  const displayKey = item.keyOverride || item.arrangement?.key || 'C'
  const originalKey = item.arrangement?.key || 'C'
  
  const handleTitleClick = () => {
    navigate(`/setlists/${setlistId}/play/${item.order}`)
  }
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      data-testid="draggable-arrangement-item"
    >
      <div
        style={{
          padding: '1rem',
          marginBottom: '0.5rem',
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: isDragging ? '0 4px 8px rgba(0, 0, 0, 0.1)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!disabled && (
            <button
              ref={setActivatorNodeRef}
              {...listeners}
              {...attributes}
              aria-label="Drag to reorder"
              style={{
                background: 'none',
                border: 'none',
                cursor: isDragging ? 'grabbing' : 'grab',
                padding: '0.25rem',
                borderRadius: '4px',
                color: 'var(--text-secondary)',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
              </svg>
            </button>
          )}
          
          <div style={{ flex: 1 }}>
            <h4 
              onClick={handleTitleClick}
              style={{ 
                margin: 0, 
                fontWeight: 'bold',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textDecoration: 'underline',
                textDecorationColor: 'transparent',
                transition: 'text-decoration-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecorationColor = 'var(--color-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecorationColor = 'transparent'
              }}
            >
              {item.order + 1}. {item.arrangement?.name || 'Loading...'}
              <span style={{ 
                marginLeft: '0.5rem', 
                fontWeight: 'bold',
                color: 'var(--color-primary)' 
              }}>
                - Key: {displayKey}
              </span>
            </h4>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem'
            }}>
              Original: {originalKey}
              {item.keyOverride && item.keyOverride !== originalKey && (
                <span style={{ 
                  color: 'var(--status-success)',
                  marginLeft: '0.5rem'
                }}>
                  (Transposed for setlist)
                </span>
              )}
            </div>
            {item.notes && (
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--status-success)',
                fontStyle: 'italic',
                marginTop: '0.25rem'
              }}>
                Note: {item.notes}
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={onRemove}
          aria-label="Remove from setlist"
          style={{
            padding: '0.5rem',
            backgroundColor: 'var(--color-destructive)',
            color: 'var(--color-destructive-foreground)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}