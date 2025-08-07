import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SongCard } from '../SongCard'
import type { Song } from '../../types/song.types'

describe('SongCard', () => {
  const mockSong: Song = {
    id: 'song-1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    slug: 'amazing-grace',
    compositionYear: 1779,
    ccli: '22025',
    themes: ['Grace', 'Salvation', 'Forgiveness'],
    source: 'Traditional Hymnal',
    notes: 'Classic hymn',
    defaultArrangementId: 'arr-1',
    metadata: {
      isPublic: true,
      views: 100,
      ratings: {
        average: 4.5,
        count: 10
      }
    }
  }

  const mockSongWithoutOptionalFields: Song = {
    id: 'song-2',
    title: 'Simple Song',
    artist: 'Unknown Artist',
    slug: 'simple-song',
    themes: [],
    metadata: {
      isPublic: true,
      views: 50
    }
  }

  it('renders song information correctly', () => {
    render(<SongCard song={mockSong} />)
    
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    expect(screen.getByText('John Newton (1779)')).toBeInTheDocument()
    expect(screen.getByText('Grace')).toBeInTheDocument()
    expect(screen.getByText('Salvation')).toBeInTheDocument()
    expect(screen.getByText('Forgiveness')).toBeInTheDocument()
    expect(screen.getByText('⭐ 4.5 (10 reviews)')).toBeInTheDocument()
  })

  it('renders song without composition year correctly', () => {
    const songWithoutYear = { ...mockSong, compositionYear: undefined }
    render(<SongCard song={songWithoutYear} />)
    
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    expect(screen.getByText('John Newton')).toBeInTheDocument()
    expect(screen.queryByText('John Newton (1779)')).not.toBeInTheDocument()
  })

  it('handles song without themes', () => {
    render(<SongCard song={mockSongWithoutOptionalFields} />)
    
    expect(screen.getByText('Simple Song')).toBeInTheDocument()
    expect(screen.getByText('Unknown Artist')).toBeInTheDocument()
    // With empty array, no themes displayed and no fallback text
    expect(screen.queryByText('No themes')).not.toBeInTheDocument()
  })

  it('handles song without ratings', () => {
    render(<SongCard song={mockSongWithoutOptionalFields} />)
    
    expect(screen.getByText('Simple Song')).toBeInTheDocument()
    expect(screen.queryByText(/⭐/)).not.toBeInTheDocument()
  })

  it('calls onClick when card is clicked and onClick is provided', async () => {
    const user = userEvent.setup()
    const mockOnClick = vi.fn()
    
    render(<SongCard song={mockSong} onClick={mockOnClick} />)
    
    const card = screen.getByText('Amazing Grace').closest('div')
    expect(card).toBeInTheDocument()
    
    await user.click(card!)
    expect(mockOnClick).toHaveBeenCalledWith(mockSong)
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when no onClick handler is provided', async () => {
    const user = userEvent.setup()
    
    render(<SongCard song={mockSong} />)
    
    const card = screen.getByText('Amazing Grace').closest('div')
    expect(card).toBeInTheDocument()
    
    // Should not throw error when clicking without onClick handler
    await user.click(card!)
    // No assertion needed - just ensuring no error is thrown
  })

  it('applies clickable styles when onClick is provided', () => {
    const mockOnClick = vi.fn()
    render(<SongCard song={mockSong} onClick={mockOnClick} />)
    
    const card = screen.getByText('Amazing Grace').closest('div')
    expect(card?.className).toMatch(/clickable/)
  })

  it('does not apply clickable styles when onClick is not provided', () => {
    render(<SongCard song={mockSong} />)
    
    const card = screen.getByText('Amazing Grace').closest('div')
    expect(card?.className).not.toMatch(/clickable/)
  })

  it('renders multiple theme tags correctly', () => {
    render(<SongCard song={mockSong} />)
    
    const themes = mockSong.themes
    themes.forEach(theme => {
      expect(screen.getByText(theme)).toBeInTheDocument()
    })
  })

  it('formats ratings correctly with proper precision', () => {
    const songWithDecimalRating = {
      ...mockSong,
      metadata: {
        ...mockSong.metadata,
        ratings: {
          average: 4.567,
          count: 15
        }
      }
    }
    
    render(<SongCard song={songWithDecimalRating} />)
    
    expect(screen.getByText('⭐ 4.6 (15 reviews)')).toBeInTheDocument()
  })

  it('handles empty themes array', () => {
    const songWithEmptyThemes = {
      ...mockSong,
      themes: []
    }
    
    render(<SongCard song={songWithEmptyThemes} />)
    
    // With empty array, no themes are rendered, but no fallback text either
    expect(screen.queryByText('No themes')).not.toBeInTheDocument()
    expect(screen.queryByText('Grace')).not.toBeInTheDocument()
  })

  it('handles undefined themes', () => {
    const songWithUndefinedThemes = {
      ...mockSong,
      themes: undefined as any
    }
    
    render(<SongCard song={songWithUndefinedThemes} />)
    
    expect(screen.getByText('No themes')).toBeInTheDocument()
  })
})