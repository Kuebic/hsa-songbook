import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useDragAndDropEnhanced } from '../useDragAndDropEnhanced'
import type { SetlistArrangement } from '../../types/setlist.types'
import type { DragStartEvent } from '@dnd-kit/core'

// Mock @dnd-kit modules
vi.mock('@dnd-kit/core', () => ({
  DndContext: 'DndContext',
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  TouchSensor: vi.fn(),
  useSensor: vi.fn().mockReturnValue({}),
  useSensors: vi.fn().mockReturnValue([]),
}))

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((items, oldIndex, newIndex) => {
    const result = [...items]
    const [removed] = result.splice(oldIndex, 1)
    result.splice(newIndex, 0, removed)
    return result
  }),
  SortableContext: 'SortableContext',
  sortableKeyboardCoordinates: vi.fn(),
}))

vi.mock('@dnd-kit/modifiers', () => ({
  restrictToVerticalAxis: vi.fn(),
}))

const mockArrangements: SetlistArrangement[] = [
  {
    arrangementId: 'arr-1',
    order: 0,
    addedAt: new Date(),
    addedBy: 'user-1',
    arrangement: {
      id: 'arr-1',
      name: 'Song 1',
      key: 'G',
      difficulty: 'beginner',
      tags: [],
      chordData: '[G]Test song',
      slug: 'song-1',
      createdBy: 'user-1',
      songIds: ['song-1']
    }
  },
  {
    arrangementId: 'arr-2',
    order: 1,
    addedAt: new Date(),
    addedBy: 'user-1',
    arrangement: {
      id: 'arr-2',
      name: 'Song 2',
      key: 'C',
      difficulty: 'intermediate',
      tags: [],
      chordData: '[C]Another test song',
      slug: 'song-2',
      createdBy: 'user-1',
      songIds: ['song-2']
    }
  }
]

describe('useDragAndDropEnhanced', () => {
  it('initializes with provided items', () => {
    const mockOnReorder = vi.fn()
    
    const { result } = renderHook(() =>
      useDragAndDropEnhanced({
        items: mockArrangements,
        onReorder: mockOnReorder,
        disabled: false
      })
    )

    expect(result.current.items).toEqual(mockArrangements)
    expect(result.current.disabled).toBe(false)
  })

  it('updates local items when props change', () => {
    const mockOnReorder = vi.fn()
    const initialItems = mockArrangements.slice(0, 1)
    
    const { result, rerender } = renderHook(
      ({ items }) =>
        useDragAndDropEnhanced({
          items,
          onReorder: mockOnReorder,
          disabled: false
        }),
      { initialProps: { items: initialItems } }
    )

    expect(result.current.items).toEqual(initialItems)

    // Update props with new items
    rerender({ items: mockArrangements })

    expect(result.current.items).toEqual(mockArrangements)
  })

  it('handles drag start event', () => {
    const mockOnReorder = vi.fn()
    
    const { result } = renderHook(() =>
      useDragAndDropEnhanced({
        items: mockArrangements,
        onReorder: mockOnReorder,
        disabled: false
      })
    )

    const mockEvent = {
      active: { id: 'arr-1' }
    }

    act(() => {
      result.current.handleDragStart(mockEvent as DragStartEvent)
    })

    expect(result.current.activeId).toBe('arr-1')
  })

  it('handles drag cancel event', () => {
    const mockOnReorder = vi.fn()
    
    const { result } = renderHook(() =>
      useDragAndDropEnhanced({
        items: mockArrangements,
        onReorder: mockOnReorder,
        disabled: false
      })
    )

    // First set an active id
    act(() => {
      result.current.handleDragStart({ active: { id: 'arr-1' } } as DragStartEvent)
    })

    expect(result.current.activeId).toBe('arr-1')

    // Then cancel
    act(() => {
      result.current.handleDragCancel()
    })

    expect(result.current.activeId).toBe(null)
  })

  it('provides expected return values', () => {
    const mockOnReorder = vi.fn()
    
    const { result } = renderHook(() =>
      useDragAndDropEnhanced({
        items: mockArrangements,
        onReorder: mockOnReorder,
        disabled: false
      })
    )

    // Check that all expected properties are returned
    expect(result.current).toHaveProperty('sensors')
    expect(result.current).toHaveProperty('modifiers')
    expect(result.current).toHaveProperty('collisionDetection')
    expect(result.current).toHaveProperty('handleDragStart')
    expect(result.current).toHaveProperty('handleDragEnd')
    expect(result.current).toHaveProperty('handleDragCancel')
    expect(result.current).toHaveProperty('activeId')
    expect(result.current).toHaveProperty('items')
    expect(result.current).toHaveProperty('disabled')
  })

  it('respects disabled prop', () => {
    const mockOnReorder = vi.fn()
    
    const { result } = renderHook(() =>
      useDragAndDropEnhanced({
        items: mockArrangements,
        onReorder: mockOnReorder,
        disabled: true
      })
    )

    expect(result.current.disabled).toBe(true)
  })
})