import type { SetlistSong } from '../types/setlist.types'

export function useDragAndDrop(songs: SetlistSong[], onReorder: (songs: SetlistSong[]) => void) {
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('songIndex', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('songIndex'))
    
    if (dragIndex === dropIndex) return
    
    const newSongs = [...songs]
    const [draggedSong] = newSongs.splice(dragIndex, 1)
    newSongs.splice(dropIndex, 0, draggedSong)
    
    onReorder(newSongs)
  }

  return {
    handleDragStart,
    handleDragOver,
    handleDrop
  }
}