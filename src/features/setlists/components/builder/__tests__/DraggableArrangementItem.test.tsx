import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DraggableArrangementItem } from '../DraggableArrangementItem'
import type { SetlistArrangement } from '../../../types/setlist.types'

// Mock arrangement data
const mockArrangement: SetlistArrangement = {
  arrangementId: 'test-arrangement-id',
  order: 0,
  addedAt: new Date(),
  addedBy: 'test-user',
  arrangement: {
    id: 'test-arrangement-id',
    name: 'Amazing Grace',
    key: 'G',
    difficulty: 'beginner',
    tags: [],
    chordData: '[G]Amazing grace how [C]sweet the [G]sound',
    slug: 'amazing-grace',
    createdBy: 'test-user',
    songIds: ['song-1'] // Add required songIds property
  }
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndContext>
    <SortableContext items={['test-arrangement-id']} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  </DndContext>
)

describe('DraggableArrangementItem', () => {
  it('renders arrangement information correctly', () => {
    const mockOnRemove = jest.fn()
    
    render(
      <TestWrapper>
        <DraggableArrangementItem
          item={mockArrangement}
          onRemove={mockOnRemove}
        />
      </TestWrapper>
    )

    // Check that arrangement name is displayed
    expect(screen.getByText(/Amazing Grace/)).toBeInTheDocument()
    
    // Check that key information is displayed
    expect(screen.getByText(/Key: G/)).toBeInTheDocument()
    
    // Check that difficulty is displayed
    expect(screen.getByText(/Difficulty: beginner/)).toBeInTheDocument()
  })

  it('shows drag handle when not disabled', () => {
    const mockOnRemove = jest.fn()
    
    render(
      <TestWrapper>
        <DraggableArrangementItem
          item={mockArrangement}
          onRemove={mockOnRemove}
          disabled={false}
        />
      </TestWrapper>
    )

    // Check that drag handle exists
    const dragHandle = screen.getByLabelText('Drag to reorder')
    expect(dragHandle).toBeInTheDocument()
  })

  it('hides drag handle when disabled', () => {
    const mockOnRemove = jest.fn()
    
    render(
      <TestWrapper>
        <DraggableArrangementItem
          item={mockArrangement}
          onRemove={mockOnRemove}
          disabled={true}
        />
      </TestWrapper>
    )

    // Check that drag handle is not present
    expect(screen.queryByLabelText('Drag to reorder')).not.toBeInTheDocument()
  })

  it('shows key override when present', () => {
    const mockOnRemove = jest.fn()
    const arrangementWithOverride = {
      ...mockArrangement,
      keyOverride: 'A'
    }
    
    render(
      <TestWrapper>
        <DraggableArrangementItem
          item={arrangementWithOverride}
          onRemove={mockOnRemove}
        />
      </TestWrapper>
    )

    // Check that key override is displayed
    expect(screen.getByText(/Override: A/)).toBeInTheDocument()
  })

  it('shows notes when present', () => {
    const mockOnRemove = jest.fn()
    const arrangementWithNotes = {
      ...mockArrangement,
      notes: 'Play softly during verses'
    }
    
    render(
      <TestWrapper>
        <DraggableArrangementItem
          item={arrangementWithNotes}
          onRemove={mockOnRemove}
        />
      </TestWrapper>
    )

    // Check that notes are displayed
    expect(screen.getByText(/Note: Play softly during verses/)).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    const mockOnRemove = jest.fn()
    
    render(
      <TestWrapper>
        <DraggableArrangementItem
          item={mockArrangement}
          onRemove={mockOnRemove}
        />
      </TestWrapper>
    )

    // Check drag handle accessibility
    const dragHandle = screen.getByLabelText('Drag to reorder')
    expect(dragHandle).toHaveAttribute('aria-label', 'Drag to reorder')
    
    // Check remove button accessibility
    const removeButton = screen.getByLabelText('Remove from setlist')
    expect(removeButton).toHaveAttribute('aria-label', 'Remove from setlist')
  })
})