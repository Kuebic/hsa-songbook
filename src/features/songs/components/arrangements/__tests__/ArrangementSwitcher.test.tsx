import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArrangementSwitcher } from '../ArrangementSwitcher'
import { arrangementFactory } from '../../../test-utils/factories'

describe('ArrangementSwitcher', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Tab view (≤4 arrangements)', () => {
    it('renders tabs for 2 arrangements', () => {
      const arrangements = [
        arrangementFactory.build({ id: '1', name: 'Standard' }),
        arrangementFactory.build({ id: '2', name: 'Acoustic' })
      ]

      render(
        <ArrangementSwitcher
          arrangements={arrangements}
          selectedId="1"
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByRole('tab', { name: 'Standard' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Acoustic' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Standard' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'Acoustic' })).toHaveAttribute('aria-selected', 'false')
    })

    it('renders tabs for 4 arrangements', () => {
      const arrangements = [
        arrangementFactory.build({ id: '1', name: 'Standard' }),
        arrangementFactory.build({ id: '2', name: 'Acoustic' }),
        arrangementFactory.build({ id: '3', name: 'Electric' }),
        arrangementFactory.build({ id: '4', name: 'Piano' })
      ]

      render(
        <ArrangementSwitcher
          arrangements={arrangements}
          selectedId="1"
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getAllByRole('tab')).toHaveLength(4)
    })

    it('handles tab selection', async () => {
      const user = userEvent.setup()
      const arrangements = [
        arrangementFactory.build({ id: '1', name: 'Standard' }),
        arrangementFactory.build({ id: '2', name: 'Acoustic' })
      ]

      render(
        <ArrangementSwitcher
          arrangements={arrangements}
          selectedId="1"
          onSelect={mockOnSelect}
        />
      )

      await user.click(screen.getByRole('tab', { name: 'Acoustic' }))
      expect(mockOnSelect).toHaveBeenCalledWith('2')
    })

    it('generates label from arrangement properties when name is missing', () => {
      const arrangements = [
        arrangementFactory.build({ 
          id: '1', 
          name: '',
          key: 'C',
          difficulty: 'intermediate',
          tempo: 120
        })
      ]

      render(
        <ArrangementSwitcher
          arrangements={arrangements}
          selectedId="1"
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByRole('tab', { name: 'C • intermediate • 120 BPM' })).toBeInTheDocument()
    })
  })

  describe('Dropdown view (>4 arrangements)', () => {
    it('renders dropdown for 5 arrangements', () => {
      const arrangements = [
        arrangementFactory.build({ id: '1', name: 'Standard' }),
        arrangementFactory.build({ id: '2', name: 'Acoustic' }),
        arrangementFactory.build({ id: '3', name: 'Electric' }),
        arrangementFactory.build({ id: '4', name: 'Piano' }),
        arrangementFactory.build({ id: '5', name: 'Orchestra' })
      ]

      render(
        <ArrangementSwitcher
          arrangements={arrangements}
          selectedId="1"
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByLabelText('Select Arrangement')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toHaveValue('1')
    })

    it('handles dropdown selection', async () => {
      const user = userEvent.setup()
      const arrangements = [
        arrangementFactory.build({ id: '1', name: 'Standard' }),
        arrangementFactory.build({ id: '2', name: 'Acoustic' }),
        arrangementFactory.build({ id: '3', name: 'Electric' }),
        arrangementFactory.build({ id: '4', name: 'Piano' }),
        arrangementFactory.build({ id: '5', name: 'Orchestra' })
      ]

      render(
        <ArrangementSwitcher
          arrangements={arrangements}
          selectedId="1"
          onSelect={mockOnSelect}
        />
      )

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, '3')
      expect(mockOnSelect).toHaveBeenCalledWith('3')
    })
  })

  describe('Edge cases', () => {
    it('renders nothing when arrangements array is empty', () => {
      const { container } = render(
        <ArrangementSwitcher
          arrangements={[]}
          selectedId=""
          onSelect={mockOnSelect}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when there is only one arrangement', () => {
      const arrangements = [
        arrangementFactory.build({ id: '1', name: 'Standard' })
      ]

      const { container } = render(
        <ArrangementSwitcher
          arrangements={arrangements}
          selectedId="1"
          onSelect={mockOnSelect}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('shows loading state', () => {
      const arrangements = [
        arrangementFactory.build({ id: '1', name: 'Standard' }),
        arrangementFactory.build({ id: '2', name: 'Acoustic' })
      ]

      render(
        <ArrangementSwitcher
          arrangements={arrangements}
          selectedId="1"
          onSelect={mockOnSelect}
          loading={true}
        />
      )

      expect(screen.getByText('Loading arrangements...')).toBeInTheDocument()
    })

    it('handles undefined selectedId', () => {
      const arrangements = [
        arrangementFactory.build({ id: '1', name: 'Standard' }),
        arrangementFactory.build({ id: '2', name: 'Acoustic' })
      ]

      render(
        <ArrangementSwitcher
          arrangements={arrangements}
          onSelect={mockOnSelect}
        />
      )

      // Should render without errors
      expect(screen.getByRole('tab', { name: 'Standard' })).toBeInTheDocument()
    })

    it('shows fallback label for arrangement without any properties', () => {
      const arrangements = [
        arrangementFactory.build({ 
          id: '1', 
          name: '',
          key: undefined,
          difficulty: undefined,
          tempo: undefined
        }),
        arrangementFactory.build({ id: '2', name: 'Named' })
      ]

      render(
        <ArrangementSwitcher
          arrangements={arrangements}
          selectedId="1"
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByRole('tab', { name: 'Untitled Arrangement' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Named' })).toBeInTheDocument()
    })
  })

  describe('Responsive behavior', () => {
    it('switches from tabs to dropdown at threshold', () => {
      // Start with 4 arrangements (should show tabs)
      const fourArrangements = [
        arrangementFactory.build({ id: '1', name: 'One' }),
        arrangementFactory.build({ id: '2', name: 'Two' }),
        arrangementFactory.build({ id: '3', name: 'Three' }),
        arrangementFactory.build({ id: '4', name: 'Four' })
      ]

      const { rerender } = render(
        <ArrangementSwitcher
          arrangements={fourArrangements}
          selectedId="1"
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getAllByRole('tab')).toHaveLength(4)
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()

      // Add one more arrangement (should switch to dropdown)
      const fiveArrangements = [
        ...fourArrangements,
        arrangementFactory.build({ id: '5', name: 'Five' })
      ]

      rerender(
        <ArrangementSwitcher
          arrangements={fiveArrangements}
          selectedId="1"
          onSelect={mockOnSelect}
        />
      )

      expect(screen.queryAllByRole('tab')).toHaveLength(0)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })
})