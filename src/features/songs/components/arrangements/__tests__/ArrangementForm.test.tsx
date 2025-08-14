import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { ArrangementForm } from '../ArrangementForm'

// Mock the ChordEditor component
vi.mock('../ChordEditor', () => ({
  ChordEditor: ({ value, onChange, onKeyChange }: { value: string; onChange: (value: string) => void; onKeyChange?: (key: string) => void }) => (
    <textarea
      data-testid="chord-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => onKeyChange && onKeyChange('G')}
    />
  )
}))

describe('ArrangementForm', () => {
  const mockProps = {
    initialData: undefined,
    onChange: vi.fn(),
    disabled: false,
    compact: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('form rendering', () => {
    it('renders all form fields in full mode', () => {
      render(<ArrangementForm {...mockProps} />)
      
      expect(screen.getByLabelText(/arrangement title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/key/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/tempo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/capo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/time signature/i)).toBeInTheDocument()
      expect(screen.getByTestId('chord-editor')).toBeInTheDocument()
      expect(screen.getByLabelText(/performance notes/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/public arrangement/i)).toBeInTheDocument()
    })

    it('renders compact form with essential fields only', () => {
      render(<ArrangementForm {...mockProps} compact={true} />)
      
      expect(screen.getByLabelText(/arrangement title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/key/i)).toBeInTheDocument()
      expect(screen.getByTestId('chord-editor')).toBeInTheDocument()
      
      // These should not be in compact mode
      expect(screen.queryByLabelText(/tempo/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/capo/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/time signature/i)).not.toBeInTheDocument()
    })

    it('populates form with initial data', () => {
      const initialData = {
        title: 'Standard Arrangement',
        key: 'C',
        tempo: 120,
        capo: 2,
        timeSignature: '4/4',
        chordProContent: '{title: Test}\n[C]Test content',
        notes: 'Play softly',
        isPublic: false
      }

      render(<ArrangementForm {...mockProps} initialData={initialData} />)
      
      expect(screen.getByDisplayValue('Standard Arrangement')).toBeInTheDocument()
      expect(screen.getByDisplayValue('C')).toBeInTheDocument()
      expect(screen.getByDisplayValue('120')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2')).toBeInTheDocument()
      expect(screen.getByDisplayValue('4/4')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Play softly')).toBeInTheDocument()
      expect(screen.getByRole('checkbox')).not.toBeChecked()
    })
  })

  describe('form validation', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup()
      
      render(<ArrangementForm {...mockProps} />)
      
      // Try to trigger validation by leaving title empty and changing other fields
      const keySelect = screen.getByLabelText(/key/i)
      await user.selectOptions(keySelect, 'G')
      
      // Should show validation error for empty title
      await waitFor(() => {
        expect(screen.getByText(/arrangement title is required/i)).toBeInTheDocument()
      })
    })

    it('validates tempo range', async () => {
      const user = userEvent.setup()
      
      render(<ArrangementForm {...mockProps} />)
      
      const tempoField = screen.getByLabelText(/tempo/i)
      await user.type(tempoField, '300') // Too high
      
      await waitFor(() => {
        expect(screen.getByText(/tempo must be between/i)).toBeInTheDocument()
      })
    })

    it('validates capo range', async () => {
      const user = userEvent.setup()
      
      render(<ArrangementForm {...mockProps} />)
      
      const capoField = screen.getByLabelText(/capo/i)
      await user.type(capoField, '15') // Too high
      
      await waitFor(() => {
        expect(screen.getByText(/capo must be between/i)).toBeInTheDocument()
      })
    })
  })

  describe('form interactions', () => {
    it('calls onChange when form data changes', async () => {
      const user = userEvent.setup()
      
      render(<ArrangementForm {...mockProps} />)
      
      const titleField = screen.getByLabelText(/arrangement title/i)
      await user.type(titleField, 'New Title')
      
      await waitFor(() => {
        expect(mockProps.onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Title'
          })
        )
      })
    })

    it('auto-extracts key from ChordPro content', async () => {
      const user = userEvent.setup()
      
      render(<ArrangementForm {...mockProps} />)
      
      const chordEditor = screen.getByTestId('chord-editor')
      await user.type(chordEditor, '{key: Am}\n[Am]Test')
      
      // Trigger blur to extract key
      await user.tab()
      
      await waitFor(() => {
        expect(mockProps.onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'Am'
          })
        )
      })
    })

    it('updates chord progression when ChordPro changes', async () => {
      const user = userEvent.setup()
      
      render(<ArrangementForm {...mockProps} />)
      
      const chordEditor = screen.getByTestId('chord-editor')
      await user.type(chordEditor, '[G]Amazing [C]grace [D]how [G]sweet')
      
      await waitFor(() => {
        expect(mockProps.onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            chords: ['G', 'C', 'D']
          })
        )
      })
    })

    it('handles disabled state', () => {
      render(<ArrangementForm {...mockProps} disabled={true} />)
      
      const titleField = screen.getByLabelText(/arrangement title/i)
      const keySelect = screen.getByLabelText(/key/i)
      const chordEditor = screen.getByTestId('chord-editor')
      
      expect(titleField).toBeDisabled()
      expect(keySelect).toBeDisabled()
      expect(chordEditor).toBeDisabled()
    })
  })

  describe('ChordPro processing', () => {
    it('extracts metadata from ChordPro content', async () => {
      const user = userEvent.setup()
      
      render(<ArrangementForm {...mockProps} />)
      
      const chordEditor = screen.getByTestId('chord-editor')
      const chordProContent = `{title: Amazing Grace}
{artist: John Newton}
{key: G}
{tempo: 90}
{time: 3/4}

[G]Amazing [C]grace how [G]sweet the [D]sound`

      await user.type(chordEditor, chordProContent)
      await user.tab() // Trigger blur
      
      await waitFor(() => {
        expect(mockProps.onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'G',
            tempo: 90,
            timeSignature: '3/4'
          })
        )
      })
    })

    it('identifies chord progressions correctly', async () => {
      const user = userEvent.setup()
      
      render(<ArrangementForm {...mockProps} />)
      
      const chordEditor = screen.getByTestId('chord-editor')
      await user.type(chordEditor, '[Verse]\n[G]Line [Am]with [C]multiple [D]chords\n[Em]Another [F]line [G]here')
      
      await waitFor(() => {
        expect(mockProps.onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            chords: ['G', 'Am', 'C', 'D', 'Em', 'F']
          })
        )
      })
    })

    it('handles complex chord notations', async () => {
      const user = userEvent.setup()
      
      render(<ArrangementForm {...mockProps} />)
      
      const chordEditor = screen.getByTestId('chord-editor')
      await user.type(chordEditor, '[G/B]Slash [Cmaj7]extended [D#dim]diminished [F#m7b5]complex')
      
      await waitFor(() => {
        expect(mockProps.onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            chords: ['G/B', 'Cmaj7', 'D#dim', 'F#m7b5']
          })
        )
      })
    })
  })

  describe('key signature handling', () => {
    it('provides all 24 keys in select options', () => {
      render(<ArrangementForm {...mockProps} />)
      
      const keySelect = screen.getByLabelText(/key/i)
      const options = keySelect.querySelectorAll('option')
      
      // Should have major and minor keys
      expect(Array.from(options).map(o => o.textContent)).toContain('C major')
      expect(Array.from(options).map(o => o.textContent)).toContain('A minor')
      expect(Array.from(options).map(o => o.textContent)).toContain('F# major')
      expect(Array.from(options).map(o => o.textContent)).toContain('C# minor')
    })

    it('automatically sets key when detected from ChordPro', async () => {
      const user = userEvent.setup()
      
      render(<ArrangementForm {...mockProps} />)
      
      const chordEditor = screen.getByTestId('chord-editor')
      await user.type(chordEditor, '{key: Bb}')
      await user.tab()
      
      await waitFor(() => {
        const keySelect = screen.getByLabelText(/key/i) as HTMLSelectElement
        expect(keySelect.value).toBe('Bb')
      })
    })
  })

  describe('accessibility', () => {
    it('has proper labels and ARIA attributes', () => {
      render(<ArrangementForm {...mockProps} />)
      
      const titleField = screen.getByLabelText(/arrangement title/i)
      expect(titleField).toHaveAttribute('id', 'arrangement-title')
      
      const keySelect = screen.getByLabelText(/key/i)
      expect(keySelect).toHaveAttribute('aria-describedby')
      
      const publicCheckbox = screen.getByLabelText(/public arrangement/i)
      expect(publicCheckbox).toHaveAttribute('type', 'checkbox')
    })

    it('announces validation errors to screen readers', async () => {
      const user = userEvent.setup()
      
      render(<ArrangementForm {...mockProps} />)
      
      const titleField = screen.getByLabelText(/arrangement title/i)
      await user.type(titleField, 'a')
      await user.clear(titleField)
      await user.tab()
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/arrangement title is required/i)
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(<ArrangementForm {...mockProps} />)
      
      // Tab through form elements
      await user.tab() // Title field
      expect(screen.getByLabelText(/arrangement title/i)).toHaveFocus()
      
      await user.tab() // Key select
      expect(screen.getByLabelText(/key/i)).toHaveFocus()
      
      await user.tab() // Tempo field
      expect(screen.getByLabelText(/tempo/i)).toHaveFocus()
    })
  })
})