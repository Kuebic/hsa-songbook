import { useState, useCallback, useEffect } from 'react'
import {
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import type { SetlistArrangement } from '../types/setlist.types'

interface UseDragAndDropEnhancedProps {
  items: SetlistArrangement[]
  onReorder: (items: SetlistArrangement[]) => void
  disabled?: boolean
}

export function useDragAndDropEnhanced({
  items,
  onReorder,
  disabled = false
}: UseDragAndDropEnhancedProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localItems, setLocalItems] = useState(items)
  
  // Sync with prop changes
  useEffect(() => {
    setLocalItems(items)
  }, [items])
  
  // Configure sensors for pointer, touch, and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex(item => item.arrangementId === active.id)
      const newIndex = localItems.findIndex(item => item.arrangementId === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(localItems, oldIndex, newIndex)
          .map((item, index) => ({ ...item, order: index }))
        
        setLocalItems(newItems)
        onReorder(newItems)
      }
    }
    
    setActiveId(null)
  }, [localItems, onReorder])
  
  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])
  
  return {
    sensors,
    modifiers: [restrictToVerticalAxis],
    collisionDetection: closestCenter,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    activeId,
    items: localItems,
    disabled,
  }
}