import type { SetlistSong } from '../types/setlist.types'

interface SetlistSongItemProps {
  item: SetlistSong
  index: number
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, index: number) => void
  onRemove: () => void
}

export function SetlistSongItem({
  item,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  onRemove
}: SetlistSongItemProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      style={{
        padding: '1rem',
        marginBottom: '0.5rem',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        cursor: 'move',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ color: '#94a3b8', fontSize: '1.25rem' }}>
          ☰
        </span>
        <div>
          <strong>{index + 1}. {item.song.title}</strong>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {item.song.artist}
          </div>
          {item.notes && (
            <div style={{ 
              fontSize: '0.875rem', 
              color: '#059669', 
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
          backgroundColor: '#ef4444',
          color: 'white',
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