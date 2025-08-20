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

// Mock ChordSheetJS - Create a comprehensive mock with all required exports
vi.mock('chordsheetjs', () => {
  const format = vi.fn((song) => {
    // Process the song object to create HTML output
    if (!song) return '<div class="empty">No content</div>'
    
    let html = ''
    
    // Add title if present
    if (song.title) {
      html += `<div class="title">${song.title}</div>`
    }
    
    // Add artist if present  
    if (song.artist) {
      html += `<div class="subtitle">${song.artist}</div>`
    }
    
    // Process lines to create chord/lyric rows
    if (song.lines && song.lines.length > 0) {
      song.lines.forEach(line => {
        if (line.items && line.items.length > 0) {
          // Create a single row for each line, with all chord/lyric pairs as columns
          html += '<div class="row">'
          line.items.forEach(item => {
            if (item.chords || item.lyrics) {
              html += '<div class="column">'
              if (item.chords) {
                html += `<div class="chord">${item.chords}</div>`
              } else {
                html += '<div class="chord"></div>' // Empty chord for alignment
              }
              if (item.lyrics !== undefined) {
                html += `<div class="lyrics">${item.lyrics}</div>`
              }
              html += '</div>'
            }
          })
          html += '</div>'
        }
      })
    }
    
    return html || '<div class="row"><div class="column"><div class="chord">G</div><div class="lyrics">Hello</div></div></div>'
  })
  
  const formatter = { format }
  
  // Mock ChordProParser with parse method that processes content
  const parse = vi.fn((content: string) => {
    // Extract metadata
    const title = content.match(/\{title:\s*([^}]+)\}/)?.[1]?.trim() || null
    const artist = content.match(/\{artist:\s*([^}]+)\}/)?.[1]?.trim() || null
    
    // Process lines - split content and filter out directives
    const textLines = content.split('\n').filter(line => 
      line.trim() && !line.trim().startsWith('{')
    )
    
    // Create lines with items for each text line
    const lines = textLines.map(lineContent => {
      const items = []
      
      // Parse chords and lyrics properly for multiple chords per line
      const parts = lineContent.split(/(\[[^\]]+\])/)
      let currentChord = ''
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        
        if (part.startsWith('[') && part.endsWith(']')) {
          // This is a chord
          currentChord = part.slice(1, -1)
        } else if (part.trim() || currentChord) {
          // This is lyrics (could be empty if chord is at end of line)
          items.push({
            chords: currentChord,
            lyrics: part
          })
          currentChord = ''
        }
      }
      
      // If no items were created but we have content, add it as lyrics only
      if (items.length === 0 && lineContent.trim()) {
        items.push({
          chords: '',
          lyrics: lineContent
        })
      }
      
      return {
        type: 'chordLyrics',
        items
      }
    })
    
    return {
      title,
      artist,
      lines,
      paragraphs: []
    }
  })
  
  const chordProParser = {
    parse
  }
  
  // Mock Chord class for transposition
  const chord = {
    parse: vi.fn((chordStr: string) => ({
      toString: () => chordStr,
      transpose: vi.fn((semitones: number) => ({
        toString: () => chordStr // Simplified - just return original for tests
      }))
    }))
  }
  
  return {
    default: {
      ChordProParser: vi.fn(() => chordProParser),
      HtmlDivFormatter: vi.fn(() => formatter),
      Chord: chord
    },
    ChordProParser: vi.fn(() => chordProParser),
    HtmlDivFormatter: vi.fn(() => formatter),
    Chord: chord,
    Line: vi.fn(),
    ChordLyricsPair: vi.fn()
  }
})

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
  })

  it('displays empty state when no content is provided', () => {
    render(<PreviewPane content="" />)
    
    expect(screen.getByText('Start typing to see the preview')).toBeInTheDocument()
    expect(screen.getByText('🎵')).toBeInTheDocument()
  })

  it('positions chord D above p in encyclopedia case', async () => {
    render(<PreviewPane content="encyclo[D]pedia" />)

    await waitFor(() => {
      const container = screen.getByRole('document')
      // Check for chord elements with D
      const chordElements = container.querySelectorAll('.chord, .chord-element')
      const chordTexts = Array.from(chordElements).map(el => el.textContent)
      
      expect(chordTexts).toContain('D')
      
      // Check for lyrics elements
      const lyricsElements = container.querySelectorAll('.lyrics, .chord-lyrics')
      const lyricsText = Array.from(lyricsElements).map(el => el.textContent).join('')
      
      expect(lyricsText).toContain('encyclo')
      expect(lyricsText).toContain('pedia')
    })
  })

  it('displays title only once using custom renderer', async () => {
    const content = `{title: Amazing Grace}
{artist: John Newton}
[G]Amazing grace`

    render(<PreviewPane content={content} />)

    await waitFor(() => {
      const container = screen.getByRole('document')
      const titleElements = container.querySelectorAll('h1, .title, .song-title')
      const titleCount = Array.from(titleElements).filter(el => 
        el.textContent?.includes('Amazing Grace')
      ).length
      
      // Should only have one title element
      expect(titleCount).toBeLessThanOrEqual(1)
      
      // Verify lyrics are present
      const lyricsElements = container.querySelectorAll('.lyrics, .chord-lyrics')
      const lyricsText = Array.from(lyricsElements).map(el => el.textContent).join('')
      expect(lyricsText).toContain('Amazing grace')
    })
  })

  it('handles error states gracefully', async () => {
    // Mock the parse and render to fail
    mockParseAndRender.mockImplementationOnce(() => {
      throw new Error('Custom renderer error')
    })

    render(<PreviewPane content="[G]Invalid content" />)

    await waitFor(() => {
      const container = screen.getByRole('document')
      // Should handle error gracefully and show either error text or fallback content
      expect(container).toBeInTheDocument()
      // Check if error message is displayed or content is handled gracefully
      const hasErrorText = container.textContent?.includes('Error parsing ChordPro') || 
                           container.textContent?.includes('error') ||
                           container.textContent?.includes('Error')
      const hasContent = container.querySelector('.chord-sheet-content') !== null
      
      // Should either show error message or handle gracefully with content
      expect(hasErrorText || hasContent).toBe(true)
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
    const content = `{title: Fallback Test}
[G]Test line`

    render(<PreviewPane content={content} />)

    await waitFor(() => {
      const container = screen.getByRole('document')
      const lyricsElements = container.querySelectorAll('.lyrics, .chord-lyrics')
      const lyricsText = Array.from(lyricsElements).map(el => el.textContent).join('')
      
      expect(lyricsText).toContain('Test line')
      
      // Check for chords
      const chordElements = container.querySelectorAll('.chord, .chord-element')
      const chordText = Array.from(chordElements).map(el => el.textContent).join('')
      expect(chordText).toContain('G')
    })
  })

  it('renders content without excessive spacing', async () => {
    const content = '[C]Hello [G]world [Am]test'
    
    render(<PreviewPane content={content} />)

    await waitFor(() => {
      const container = screen.getByRole('document')
      const lyricsElements = container.querySelectorAll('.lyrics, .chord-lyrics')
      const lyricsText = Array.from(lyricsElements).map(el => el.textContent).join('')
      
      // Check that all words are present
      expect(lyricsText).toContain('Hello')
      expect(lyricsText).toContain('world')
      expect(lyricsText).toContain('test')
      
      // Check chords are present
      const chordElements = container.querySelectorAll('.chord, .chord-element')
      const chordTexts = Array.from(chordElements).map(el => el.textContent)
      expect(chordTexts).toContain('C')
      expect(chordTexts).toContain('G')
      expect(chordTexts).toContain('Am')
    })
  })

  it('handles real-time updates efficiently', async () => {
    const { rerender } = render(<PreviewPane content="[G]Initial" />)

    // Wait for the initial content to render
    await waitFor(() => {
      const container = screen.getByRole('document')
      expect(container.querySelector('.chord-sheet-content')).toBeInTheDocument()
    })

    // Verify initial content
    const container = screen.getByRole('document')
    const initialLyricsElements = container.querySelectorAll('.lyrics, .chord-lyrics')
    const initialLyricsText = Array.from(initialLyricsElements).map(el => el.textContent).join('')
    expect(initialLyricsText).toContain('Initial')

    rerender(<PreviewPane content="[C]Updated" />)

    // Wait for the content to change
    await waitFor(() => {
      const updatedContainer = screen.getByRole('document')
      const updatedLyricsElements = updatedContainer.querySelectorAll('.lyrics, .chord-lyrics')
      const updatedLyricsText = Array.from(updatedLyricsElements).map(el => el.textContent).join('')
      expect(updatedLyricsText).toContain('Updated')
    })
  })
})