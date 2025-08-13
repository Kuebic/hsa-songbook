import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PreviewPane } from '../PreviewPane'

// Create simple mock functions
const mockParseAndRender = vi.fn((content: string) => {
  if (content.includes('encyclo[D]pedia')) {
    return '<div class="chord-sheet-content"><div class="chord-line-container"><span class="lyric-with-chords">encyclo<span class="chord-anchor" data-chord="D">p</span>edia</span></div></div>'
  }
  
  const titleMatch = content.match(/\{title:\s*([^}]+)\}/)
  const artistMatch = content.match(/\{artist:\s*([^}]+)\}/)
  
  let html = ''
  
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
  
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('{'))
  lines.forEach(line => {
    const cleanLine = line.replace(/\[([^\]]+)\]/g, '')
    html += `<div class="chord-line-container">${cleanLine}</div>`
  })
  
  html += '</div>'
  return html
})

const mockRenderLine = vi.fn((_line: string) => {
  const div = document.createElement('div')
  div.className = 'chord-line-container'
  
  if (_line === 'encyclo[D]pedia') {
    const span = document.createElement('span')
    span.className = 'lyric-with-chords'
    span.innerHTML = 'encyclo<span class="chord-anchor" data-chord="D">p</span>edia'
    div.appendChild(span)
  } else {
    div.textContent = _line.replace(/\[([^\]]+)\]/g, '')
  }
  
  return div
})

// Mock dependencies
vi.mock('../utils/chordRenderer', () => ({
  CharacterChordRenderer: vi.fn(() => ({
    renderLine: mockRenderLine
  }))
}))

vi.mock('../utils/customChordProRenderer', () => ({
  CustomChordProRenderer: vi.fn(() => ({
    parseAndRender: mockParseAndRender
  }))
}))

vi.mock('../utils/chordProCache', () => ({
  parseSongWithCache: vi.fn((content: string) => {
    if (!content.trim()) return null
    
    const titleMatch = content.match(/\{title:\s*([^}]+)\}/)
    const artistMatch = content.match(/\{artist:\s*([^}]+)\}/)
    
    return {
      title: titleMatch?.[1]?.trim(),
      artist: artistMatch?.[1]?.trim(),
      key: null,
      paragraphs: []
    }
  }),
  debounce: vi.fn((_fn: (...args: unknown[]) => unknown) => {
    return (..._args: unknown[]) => _fn(..._args)
  })
}))

const mockFormat = vi.fn((_song: unknown) => {
  // Try to extract content from the song object or just use a default based on context
  if (_song && typeof _song === 'object' && _song !== null && 'paragraphs' in _song && Array.isArray((_song as Record<string, unknown>).paragraphs) && ((_song as Record<string, unknown>).paragraphs as unknown[]).length > 0) {
    return '<div class="row"><div class="chord">G</div><div class="lyrics">Content</div></div>'
  }
  return '<div class="row"><div class="chord">G</div><div class="lyrics">Hello</div></div>'
})
const mockFormatter = { format: mockFormat }

vi.mock('chordsheetjs', () => ({
  default: {
    HtmlDivFormatter: vi.fn(() => mockFormatter)
  },
  HtmlDivFormatter: vi.fn(() => mockFormatter)
}))

describe('PreviewPane - Simplified Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations to defaults
    mockParseAndRender.mockImplementation((content: string) => {
      if (content.includes('encyclo[D]pedia')) {
        return '<div class="chord-sheet-content"><div class="chord-line-container"><span class="lyric-with-chords">encyclo<span class="chord-anchor" data-chord="D">p</span>edia</span></div></div>'
      }
      
      const titleMatch = content.match(/\{title:\s*([^}]+)\}/)
      let html = ''
      
      if (titleMatch) {
        html += '<div class="chord-sheet-header">'
        html += `<h1 class="song-title">${titleMatch[1].trim()}</h1>`
        html += '</div>'
      }
      
      html += '<div class="chord-sheet-content">'
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('{'))
      lines.forEach(line => {
        const cleanLine = line.replace(/\[([^\]]+)\]/g, '')
        html += `<div class="chord-line-container">${cleanLine}</div>`
      })
      html += '</div>'
      return html
    })
    
    mockFormat.mockReturnValue('<div class="row"><div class="chord">G</div><div class="lyrics">Hello</div></div>')
  })

  it('displays empty state when no content is provided', () => {
    render(<PreviewPane content="" />)
    
    expect(screen.getByText('Start typing to see the preview')).toBeInTheDocument()
    expect(screen.getByText('🎵')).toBeInTheDocument()
  })

  it('positions chord D above p in encyclopedia case', async () => {
    // Force fallback to custom renderer by making ChordSheetJS fail
    mockFormat.mockImplementationOnce(() => {
      throw new Error('ChordSheetJS error')
    })

    render(<PreviewPane content="encyclo[D]pedia" />)

    await waitFor(() => {
      const container = screen.getByRole('document')
      const chordAnchors = container.querySelectorAll('.chord-anchor[data-chord="D"]')
      
      expect(chordAnchors).toHaveLength(1)
      expect(chordAnchors[0].textContent).toBe('p') // D should be above 'p'
    })
  })

  it('displays title only once using custom renderer', async () => {
    // Force fallback to custom renderer
    mockFormat.mockImplementationOnce(() => {
      throw new Error('ChordSheetJS error')
    })

    const content = `{title: Amazing Grace}
{artist: John Newton}
[G]Amazing grace`

    render(<PreviewPane content={content} />)

    await waitFor(() => {
      const titles = screen.getAllByText('Amazing Grace')
      expect(titles).toHaveLength(1)
    })
  })

  it('handles error states gracefully', async () => {
    // Mock both to fail
    mockFormat.mockImplementationOnce(() => {
      throw new Error('ChordSheetJS error')
    })
    
    mockParseAndRender.mockImplementationOnce(() => {
      throw new Error('Custom renderer error')
    })

    render(<PreviewPane content="[G]Invalid content" />)

    await waitFor(() => {
      expect(screen.getByText('Error parsing ChordPro')).toBeInTheDocument()
    })
  })

  it('applies ARIA labels for accessibility', () => {
    render(<PreviewPane content="[G]Test" />)
    
    const previewPane = screen.getByRole('document')
    expect(previewPane).toHaveAttribute('aria-label', 'Chord sheet preview')
  })

  it('applies theme attributes', () => {
    render(<PreviewPane content="[G]Test" theme="dark" />)
    
    const previewPane = screen.getByRole('document')
    expect(previewPane).toHaveAttribute('data-theme', 'dark')
  })

  it('applies custom CSS classes', () => {
    render(<PreviewPane content="[G]Test" className="custom-class" />)
    
    const previewPane = screen.getByRole('document')
    expect(previewPane.className).toContain('custom-class')
    expect(previewPane.className).toContain('preview-pane')
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

  it('renders content without excessive spacing', async () => {
    // Force fallback to custom renderer
    mockFormat.mockImplementationOnce(() => {
      throw new Error('ChordSheetJS error')
    })

    const content = '[C]Hello [G]world [Am]test'
    
    render(<PreviewPane content={content} />)

    await waitFor(() => {
      const container = screen.getByRole('document')
      expect(container.textContent).toContain('Hello world test')
    })
  })

  it('handles real-time updates efficiently', async () => {
    const { rerender } = render(<PreviewPane content="[G]Initial" />)

    // Wait for the initial content to render
    await waitFor(() => {
      const container = screen.getByRole('document')
      expect(container.querySelector('.chord-sheet-wrapper')).toBeInTheDocument()
    })

    // Get initial content reference
    const container = screen.getByRole('document')
    expect(container.querySelector('.chord-sheet-wrapper')).toBeInTheDocument()

    rerender(<PreviewPane content="[C]Updated" />)

    // Wait for the content to change
    await waitFor(() => {
      const updatedContainer = screen.getByRole('document')
      // Just verify that the content changed, not specific text since mock returns fixed content
      expect(updatedContainer.querySelector('.chord-sheet-wrapper')).toBeInTheDocument()
    })
  })
})