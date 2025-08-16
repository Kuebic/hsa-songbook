import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Setlist, SetlistArrangement } from '../types/setlist.types'
import type { Arrangement } from '@features/songs'
import { SetlistHeader } from './SetlistHeader'
import { SongSelector } from './SongSelector'
import { DraggableArrangementItem } from './builder/DraggableArrangementItem'
import { useDragAndDropEnhanced } from '../hooks/useDragAndDropEnhanced'

interface SetlistBuilderProps {
  setlist: Setlist
  availableArrangements?: Arrangement[]
  onAddArrangement: (arrangement: Arrangement, notes?: string) => void
  onRemoveArrangement: (index: number) => void
  onReorder: (arrangements: SetlistArrangement[]) => void
  onUpdateName?: (name: string) => void
}

export function SetlistBuilder({
  setlist,
  availableArrangements = [],
  onAddArrangement,
  onRemoveArrangement,
  onReorder,
  onUpdateName
}: SetlistBuilderProps) {
  const navigate = useNavigate()
  const [isAddingMode, setIsAddingMode] = useState(false)
  
  const {
    sensors,
    modifiers,
    collisionDetection,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    items,
  } = useDragAndDropEnhanced({
    items: setlist.arrangements,
    onReorder,
    disabled: false
  })

  const handleArrangementSelect = (arrangement: Arrangement) => {
    onAddArrangement(arrangement)
    setIsAddingMode(false)
  }
  
  const handlePlayAll = () => {
    navigate(`/setlists/${setlist.id}/play`)
  }

  return (
    <div style={{ padding: '1rem' }}>
      <SetlistHeader setlist={setlist} onUpdateName={onUpdateName} />

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={handlePlayAll}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--status-success)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          disabled={setlist.arrangements.length === 0}
        >
          ▶ Play All
        </button>
        
        <button
          onClick={() => setIsAddingMode(!isAddingMode)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          {isAddingMode ? 'Cancel' : '+ Add Arrangement'}
        </button>
      </div>

      {isAddingMode && (
        <SongSelector 
          availableArrangements={availableArrangements} 
          onSelectArrangement={handleArrangementSelect}
        />
      )}

      <div>
        <h3 style={{ marginBottom: '1rem' }}>
          Arrangements ({setlist.arrangements.length})
        </h3>
        
        {setlist.arrangements.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            No arrangements in this setlist yet. Click "Add Arrangement" to get started.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            modifiers={modifiers}
          >
            <SortableContext
              items={items.map(item => item.arrangementId)}
              strategy={verticalListSortingStrategy}
            >
              <div>
                {items.map((item, index) => (
                  <DraggableArrangementItem
                    key={item.arrangementId}
                    item={item}
                    setlistId={setlist.id}
                    onRemove={() => onRemoveArrangement(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}