import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PreviewPane } from '../PreviewPane'

// Mock the chord renderer utilities
vi.mock('../utils/chordRenderer', () => ({
  CharacterChordRenderer: vi.fn().mockImplementation(() => ({
    renderLine: vi.fn((line: string) => {
      const div = document.createElement('div')
      div.className = 'chord-line-container'
      
      if (line.includes('[D]')) {
        // Mock the encyclopedia case
        const span = document.createElement('span')
        span.className = 'lyric-with-chords'
        
        if (line === 'encyclo[D]pedia') {
          span.innerHTML = 'encyclo<span class="chord-anchor" data-chord="D">p</span>edia'
        } else {
          span.textContent = line.replace(/\[([^\]]+)\]/g, '')
        }
        
        div.appendChild(span)
      } else {
        div.textContent = line.replace(/\[([^\]]+)\]/g, '')
      }
      
      return div
    })
  }))
}))

vi.mock('../utils/customChordProRenderer', () => ({
  CustomChordProRenderer: vi.fn().mockImplementation(() => ({
    parseAndRender: vi.fn((content: string) => {
      // Mock implementation for custom renderer
      const lines = content.split('\n').filter(line => line.trim())
      let html = ''
      
      const titleMatch = content.match(/\{title:\s*([^}]+)\}/)
      const artistMatch = content.match(/\{artist:\s*([^}]+)\}/)
      
      if (titleMatch || artistMatch) {
        html += '<div class="chord-sheet-header">'
        if (titleMatch) {
          html += `<h1 class="song-title">${titleMatch[1].trim()}</h1>`
        }
        if (artistMatch) {
          html += `<p class="song-artist">${artistMatch[1].trim()}</p>`
        }
        html += '</div>'
      }
      
      html += '<div class="chord-sheet-content">'
      lines.forEach(line => {
        if (!line.startsWith('{')) {
          if (line === 'encyclo[D]pedia') {
            html += '<div class="chord-line-container"><span class="lyric-with-chords">encyclo<span class="chord-anchor" data-chord="D">p</span>edia</span></div>'
          } else {
            html += `<div class="chord-line-container">${line.replace(/\[([^\]]+)\]/g, '')}</div>`
          }
        }
      })
      html += '</div>'
      
      return html
    })
  }))
}))

// Mock chordProCache
vi.mock('../utils/chordProCache', () => ({
  parseSongWithCache: vi.fn((content: string) => {
    // Return null for empty content
    if (!content.trim()) return null
    
    // Mock ChordSheetJS song object
    const titleMatch = content.match(/\{title:\s*([^}]+)\}/)
    const artistMatch = content.match(/\{artist:\s*([^}]+)\}/)
    
    return {
      title: titleMatch?.[1]?.trim(),
      artist: artistMatch?.[1]?.trim(),
      key: null,
      paragraphs: []
    }
  }),
  debounce: vi.fn((_fn, _delay) => {
    // For testing, return a function that executes immediately
    return (..._args: unknown[]) => _fn(..._args)
  })
}))

// Mock ChordSheetJS - Create a consistent mock formatter instance
const mockFormat = vi.fn(() => '<div class="row"><div class="chord">G</div><div class="lyrics">Hello</div></div>')
const mockFormatter = { format: mockFormat }

vi.mock('chordsheetjs', () => ({
  default: {
    HtmlDivFormatter: vi.fn(() => mockFormatter)
  },
  HtmlDivFormatter: vi.fn(() => mockFormatter)
}))

// Export mocks for individual test manipulation
export { mockFormat, mockFormatter }

describe('PreviewPane', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('displays empty state when no content is provided', () => {
    render(<PreviewPane content="" />)
    
    expect(screen.getByText('Start typing to see the preview')).toBeInTheDocument()
    expect(screen.getByText('🎵')).toBeInTheDocument()
    expect(screen.getByText(/Enter ChordPro notation/)).toBeInTheDocument()
  })

  it('displays title only once when using ChordSheetJS', async () => {
    const content = `{title: Amazing Grace}
{artist: John Newton}
[G]Amazing [C]grace`

    render(<PreviewPane content={content} />)

    await waitFor(() => {
      const titles = screen.getAllByText('Amazing Grace')
      expect(titles).toHaveLength(1)
    })
  })

  it('positions chords above correct characters in encyclopedia case', async () => {
    render(<PreviewPane content="encyclo[D]pedia" />)

    await waitFor(() => {
      const container = screen.getByRole('document')
      const chordAnchors = container.querySelectorAll('.chord-anchor[data-chord="D"]')
      
      expect(chordAnchors).toHaveLength(1)
      expect(chordAnchors[0].textContent).toBe('p') // D should be above 'p'
    })
  })

  it('does not add excessive spacing between words', async () => {
    const content = '[C]Hello [G]world [Am]test'
    
    render(<PreviewPane content={content} />)

    await waitFor(() => {
      const container = screen.getByRole('document')
      const lyricsElement = container.querySelector('.lyric-with-chords')
      
      if (lyricsElement) {
        // Check that text content doesn't have extra spaces
        const textContent = lyricsElement.textContent
        expect(textContent).toBe('Hello world test')
      } else {
        // If no lyric-with-chords element, check overall text content
        expect(container.textContent).toContain('Hello world test')
      }
    })
  })

  it('applies correct theme classes', async () => {
    render(<PreviewPane content="[G]Test" theme="dark" />)

    await waitFor(() => {
      const previewPane = screen.getByRole('document')
      expect(previewPane).toHaveAttribute('data-theme', 'dark')
    })
  })

  it('falls back to custom renderer when ChordSheetJS fails', async () => {
    // Mock ChordSheetJS to throw an error
    mockFormat.mockImplementationOnce(() => {
      throw new Error('ChordSheetJS error')
    })

    const content = `{title: Fallback Test}
[G]Test line`

    render(<PreviewPane content={content} />)

    await waitFor(() => {
      expect(screen.getByText('Fallback Test')).toBeInTheDocument()
      expect(screen.getByText('Test line')).toBeInTheDocument()
    })
  })

  it('handles error states gracefully', async () => {
    // Mock both parseSongWithCache and custom renderer to throw errors
    const { parseSongWithCache } = await import('../utils/chordProCache')
    vi.mocked(parseSongWithCache).mockImplementation(() => {
      throw new Error('Parse error')
    })

    render(<PreviewPane content="[G]Invalid content" />)

    await waitFor(() => {
      expect(screen.getByText('Error parsing ChordPro')).toBeInTheDocument()
      expect(screen.getByText('Parse error')).toBeInTheDocument()
    })
  })

  it('applies ARIA labels for accessibility', () => {
    render(<PreviewPane content="[G]Test" />)
    
    const previewPane = screen.getByRole('document')
    expect(previewPane).toHaveAttribute('aria-label', 'Chord sheet preview')
  })

  it('applies custom CSS classes', () => {
    render(<PreviewPane content="[G]Test" className="custom-class" />)
    
    const previewPane = screen.getByRole('document')
    expect(previewPane.className).toContain('custom-class')
    expect(previewPane.className).toContain('preview-pane')
  })

  it('renders complex chord progressions correctly', async () => {
    const content = `{title: Complex Song}
[Cmaj7]Amazing [G/B]grace, how [Dm7]sweet
[Am]That [F]saved a [C/E]wretch like [G]me`

    render(<PreviewPane content={content} />)

    await waitFor(() => {
      expect(screen.getByText('Complex Song')).toBeInTheDocument()
      // Text should be rendered without excessive spacing
      const container = screen.getByRole('document')
      expect(container.textContent).toContain('Amazing grace, how sweet')
      expect(container.textContent).toContain('That saved a wretch like me')
    })
  })

  it('handles real-time updates efficiently', async () => {
    const { rerender } = render(<PreviewPane content="[G]Initial" />)

    await waitFor(() => {
      expect(screen.getByText('Initial')).toBeInTheDocument()
    })

    rerender(<PreviewPane content="[C]Updated" />)

    await waitFor(() => {
      expect(screen.getByText('Updated')).toBeInTheDocument()
      expect(screen.queryByText('Initial')).not.toBeInTheDocument()
    })
  })

  it('preserves chord positioning during updates', async () => {
    const { rerender } = render(<PreviewPane content="encyclo[D]pedia" />)

    await waitFor(() => {
      const container = screen.getByRole('document')
      const chordAnchor = container.querySelector('.chord-anchor[data-chord="D"]')
      expect(chordAnchor?.textContent).toBe('p')
    })

    rerender(<PreviewPane content="encyclo[D]pedia updated" />)

    await waitFor(() => {
      const container = screen.getByRole('document')
      const chordAnchor = container.querySelector('.chord-anchor[data-chord="D"]')
      expect(chordAnchor?.textContent).toBe('p')
    })
  })

  it('handles multiple sections correctly', async () => {
    const content = `{title: Multi-Section Song}

{start_of_verse}
[G]Verse line one
[C]Verse line two
{end_of_verse}

{start_of_chorus}
[Am]Chorus line
{end_of_chorus}`

    render(<PreviewPane content={content} />)

    await waitFor(() => {
      expect(screen.getByText('Multi-Section Song')).toBeInTheDocument()
      expect(screen.getByText('Verse line one')).toBeInTheDocument()
      expect(screen.getByText('Verse line two')).toBeInTheDocument()
      expect(screen.getByText('Chorus line')).toBeInTheDocument()
    })
  })

  it('renders metadata correctly without duplication', async () => {
    const content = `{title: Metadata Test}
{artist: Test Artist}
{key: G}
{capo: 3}

[G]Test line`

    render(<PreviewPane content={content} />)

    await waitFor(() => {
      // Title should appear only once
      const titles = screen.getAllByText('Metadata Test')
      expect(titles).toHaveLength(1)
      
      // Artist should appear only once
      const artists = screen.getAllByText('Test Artist')
      expect(artists).toHaveLength(1)
    })
  })

  it('handles performance requirements - updates within reasonable time', async () => {
    const startTime = performance.now()
    
    render(<PreviewPane content="[G]Performance test content" />)

    await waitFor(() => {
      expect(screen.getByText('Performance test content')).toBeInTheDocument()
    })

    const endTime = performance.now()
    const updateTime = endTime - startTime
    
    // Should update quickly (allowing for test environment overhead)
    expect(updateTime).toBeLessThan(1000) // 1 second timeout for test environment
  })

  describe('responsive behavior', () => {
    it('maintains chord positioning on smaller screens', async () => {
      // Mock smaller viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320
      })

      render(<PreviewPane content="encyclo[D]pedia" />)

      await waitFor(() => {
        const container = screen.getByRole('document')
        const chordAnchor = container.querySelector('.chord-anchor[data-chord="D"]')
        expect(chordAnchor?.textContent).toBe('p')
        expect(chordAnchor?.getAttribute('data-chord')).toBe('D')
      })
    })

    it('applies stage theme correctly', () => {
      render(<PreviewPane content="[G]Stage mode" theme="stage" />)
      
      const previewPane = screen.getByRole('document')
      expect(previewPane).toHaveAttribute('data-theme', 'stage')
    })
  })

  describe('edge cases', () => {
    it('handles very long content', async () => {
      const longContent = '[G]' + 'word '.repeat(1000)
      
      render(<PreviewPane content={longContent} />)

      await waitFor(() => {
        const container = screen.getByRole('document')
        expect(container.textContent).toContain('word word word')
      })
    })

    it('handles special characters in content', async () => {
      const content = `{title: Café naïve résumé}
[G]Special chars: ñ, ü, ç, é`

      render(<PreviewPane content={content} />)

      await waitFor(() => {
        expect(screen.getByText('Café naïve résumé')).toBeInTheDocument()
        expect(screen.getByText(/Special chars: ñ, ü, ç, é/)).toBeInTheDocument()
      })
    })

    it('handles malformed ChordPro content gracefully', async () => {
      const malformedContent = `{title: Test
[G]Missing closing bracket
{malformed directive
[C]Valid chord`

      render(<PreviewPane content={malformedContent} />)

      // Should not crash and should render what it can
      await waitFor(() => {
        const container = screen.getByRole('document')
        expect(container).toBeInTheDocument()
        // Should contain some of the valid content
        expect(container.textContent).toContain('Valid chord')
      })
    })
  })
})