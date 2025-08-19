import { getArrangementDisplayName } from '@features/songs/utils/arrangementNaming'
import type { SetlistArrangement } from '../types/setlist.types'

interface SetlistArrangementItemProps {
  item: SetlistArrangement
  index: number
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, index: number) => void
  onRemove: () => void
}

export function SetlistArrangementItem({
  item,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  onRemove
}: SetlistArrangementItemProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      style={{
        padding: '1rem',
        marginBottom: '0.5rem',
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        cursor: 'move',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: '1.25rem' }}>
          ☰
        </span>
        <div>
          <strong>{index + 1}. {item.arrangement ? getArrangementDisplayName(item.arrangement, 'setlist') : 'Loading...'}</strong>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Key: {item.arrangement?.key || ''} | Difficulty: {item.arrangement?.difficulty || ''}
          </div>
          {item.notes && (
            <div style={{ 
              fontSize: '0.875rem', 
              color: 'var(--status-success)', 
              marginTop: '0.25rem' 
            }}>
              Note: {item.notes}
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={onRemove}
        style={{
          padding: '0.25rem 0.5rem',
          backgroundColor: 'var(--color-destructive)',
          color: 'var(--color-destructive-foreground)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Remove
      </button>
    </div>
  )
}