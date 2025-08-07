import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SongViewer } from '../SongViewer'
import type { Song, Arrangement } from '../../types/song.types'

describe('SongViewer', () => {
  const mockSong: Song = {
    id: 'song-1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    slug: 'amazing-grace',
    compositionYear: 1779,
    ccli: '22025',
    themes: ['Grace', 'Salvation', 'Forgiveness'],
    source: 'Traditional Hymnal',
    notes: 'This is a classic hymn with rich theological meaning',
    metadata: {
      isPublic: true,
      views: 100,
      ratings: {
        average: 4.5,
        count: 10
      }
    }
  }

  const mockArrangement: Arrangement = {
    id: 'arr-1',
    name: 'Traditional Arrangement',
    songIds: ['song-1'],
    key: 'G',
    tempo: 78,
    timeSignature: '3/4',
    difficulty: 'intermediate',
    tags: ['traditional', 'slow'],
    chordData: `Verse 1:
G       G/B    C       G
Amazing grace! How sweet the sound
G       D      G
That saved a wretch like me!
G       G/B      C        G
I once was lost, but now am found;
G       D       G
Was blind, but now I see.`
  }

  const mockSongMinimal: Song = {
    id: 'song-2',
    title: 'Simple Song',
    artist: 'Unknown',
    slug: 'simple-song',
    themes: [],
    metadata: {
      isPublic: true,
      views: 1
    }
  }

  it('renders basic song information', () => {
    render(<SongViewer song={mockSong} />)
    
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    expect(screen.getByText('John Newton (1779)')).toBeInTheDocument()
    expect(screen.getByText('CCLI: 22025')).toBeInTheDocument()
    expect(screen.getByText('Source: Traditional Hymnal')).toBeInTheDocument()
  })

  it('renders song without optional fields', () => {
    render(<SongViewer song={mockSongMinimal} />)
    
    expect(screen.getByText('Simple Song')).toBeInTheDocument()
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(screen.queryByText(/CCLI:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Source:/)).not.toBeInTheDocument()
  })

  it('renders themes section correctly', () => {
    render(<SongViewer song={mockSong} />)
    
    expect(screen.getByText('Themes')).toBeInTheDocument()
    expect(screen.getByText('Grace')).toBeInTheDocument()
    expect(screen.getByText('Salvation')).toBeInTheDocument()
    expect(screen.getByText('Forgiveness')).toBeInTheDocument()
  })

  it('handles empty themes array', () => {
    render(<SongViewer song={mockSongMinimal} />)
    
    expect(screen.getByText('Themes')).toBeInTheDocument()
    // With empty array, no themes are rendered and no fallback text appears
    expect(screen.queryByText('No themes available')).not.toBeInTheDocument()
  })

  it('handles undefined themes', () => {
    const songWithUndefinedThemes = {
      ...mockSong,
      themes: undefined as unknown as string[]
    }
    
    render(<SongViewer song={songWithUndefinedThemes} />)
    
    expect(screen.getByText('Themes')).toBeInTheDocument()
    expect(screen.getByText('No themes available')).toBeInTheDocument()
  })

  it('renders notes when provided', () => {
    render(<SongViewer song={mockSong} />)
    
    expect(screen.getByText(/Notes:/)).toBeInTheDocument()
    expect(screen.getByText('This is a classic hymn with rich theological meaning')).toBeInTheDocument()
  })

  it('does not render notes section when not provided', () => {
    render(<SongViewer song={mockSongMinimal} />)
    
    expect(screen.queryByText(/Notes:/)).not.toBeInTheDocument()
  })

  it('renders arrangement information when provided', () => {
    render(<SongViewer song={mockSong} arrangement={mockArrangement} />)
    
    expect(screen.getByText('Key: G')).toBeInTheDocument()
    expect(screen.getByText('Tempo: 78 BPM')).toBeInTheDocument()
    expect(screen.getByText('Time: 3/4')).toBeInTheDocument()
    expect(screen.getByText('Difficulty: intermediate')).toBeInTheDocument()
  })

  it('renders chord data when arrangement is provided', () => {
    render(<SongViewer song={mockSong} arrangement={mockArrangement} />)
    
    const chordData = screen.getByText(/Amazing grace! How sweet the sound/)
    expect(chordData).toBeInTheDocument()
    expect(chordData).toHaveStyle({
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap'
    })
  })

  it('handles arrangement without optional fields', () => {
    const minimalArrangement: Arrangement = {
      id: 'arr-2',
      name: 'Basic',
      songIds: ['song-1'],
      key: 'C',
      difficulty: 'beginner',
      tags: [],
      chordData: 'C - F - G - C'
    }
    
    render(<SongViewer song={mockSong} arrangement={minimalArrangement} />)
    
    expect(screen.getByText('Key: C')).toBeInTheDocument()
    expect(screen.getByText('Difficulty: beginner')).toBeInTheDocument()
    expect(screen.queryByText(/Tempo:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Time:/)).not.toBeInTheDocument()
  })

  it('does not render arrangement section when not provided', () => {
    render(<SongViewer song={mockSong} />)
    
    expect(screen.queryByText('Key:')).not.toBeInTheDocument()
    expect(screen.queryByText('Tempo:')).not.toBeInTheDocument()
    expect(screen.queryByText('Time:')).not.toBeInTheDocument()
    expect(screen.queryByText('Difficulty:')).not.toBeInTheDocument()
  })

  it('renders song header with correct styling structure', () => {
    render(<SongViewer song={mockSong} />)
    
    const title = screen.getByText('Amazing Grace')
    expect(title.tagName).toBe('H1')
    expect(title).toHaveStyle({ fontSize: '2rem' })
  })

  it('renders arrangement metadata badges with correct styling', () => {
    render(<SongViewer song={mockSong} arrangement={mockArrangement} />)
    
    const keyBadge = screen.getByText('Key: G')
    expect(keyBadge).toHaveStyle({
      padding: '0.25rem 0.75rem',
      backgroundColor: '#f1f5f9',
      borderRadius: '4px'
    })
  })

  it('renders themes with correct styling', () => {
    render(<SongViewer song={mockSong} />)
    
    const graceTheme = screen.getByText('Grace')
    expect(graceTheme).toHaveStyle({
      padding: '0.25rem 0.75rem',
      backgroundColor: '#e0f2fe',
      borderRadius: '4px',
      color: '#0369a1'
    })
  })

  it('renders notes with warning styling', () => {
    render(<SongViewer song={mockSong} />)
    
    const notesContainer = screen.getByText(/Notes:/).parentElement
    expect(notesContainer).toHaveStyle({
      backgroundColor: '#fef3c7',
      borderLeft: '4px solid #f59e0b'
    })
  })

  it('handles song without composition year', () => {
    const songWithoutYear = {
      ...mockSong,
      compositionYear: undefined
    }
    
    render(<SongViewer song={songWithoutYear} />)
    
    expect(screen.getByText('John Newton')).toBeInTheDocument()
    expect(screen.queryByText('John Newton (1779)')).not.toBeInTheDocument()
  })

  it('maintains proper layout structure', () => {
    render(<SongViewer song={mockSong} arrangement={mockArrangement} />)
    
    const container = screen.getByText('Amazing Grace').closest('div')
    expect(container).toHaveStyle({
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto'
    })
  })
})