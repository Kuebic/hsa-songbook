import type { SetlistArrangement } from '../types/setlist.types'

export function useDragAndDrop(arrangements: SetlistArrangement[], onReorder: (arrangements: SetlistArrangement[]) => void) {
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('arrangementIndex', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('arrangementIndex'))
    
    if (dragIndex === dropIndex) return
    
    const newArrangements = [...arrangements]
    const [draggedArrangement] = newArrangements.splice(dragIndex, 1)
    newArrangements.splice(dropIndex, 0, draggedArrangement)
    
    onReorder(newArrangements)
  }

  return {
    handleDragStart,
    handleDragOver,
    handleDrop
  }
}