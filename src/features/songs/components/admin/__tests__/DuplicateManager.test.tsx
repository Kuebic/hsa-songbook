import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@shared/test-utils/testWrapper'
import { DuplicateManager } from '../DuplicateManager'
import type { Song } from '../../../types/song.types'

// Mock the hooks and services
const mockSongs: Song[] = [
  {
    id: '1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    slug: 'amazing-grace',
    themes: ['grace'],
    metadata: { createdBy: 'user1', isPublic: true, ratings: { average: 4.5, count: 10 }, views: 100 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Amazing Grace',
    artist: 'John Newton',
    slug: 'amazing-grace-2',
    themes: ['grace'],
    metadata: { createdBy: 'user2', isPublic: true, ratings: { average: 4.0, count: 5 }, views: 50 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'How Great Thou Art',
    artist: 'Carl Boberg',
    slug: 'how-great-thou-art',
    themes: ['praise'],
    metadata: { createdBy: 'user1', isPublic: true, ratings: { average: 5.0, count: 20 }, views: 200 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'How Great You Are',
    artist: 'Carl Boberg',
    slug: 'how-great-you-are',
    themes: ['praise'],
    metadata: { createdBy: 'user3', isPublic: false, ratings: { average: 3.5, count: 3 }, views: 25 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

const mockRefreshSongs = vi.fn()
const mockMergeSongs = vi.fn()
const mockDeleteSong = vi.fn()

vi.mock('../../../hooks/useSongs', () => ({
  useSongs: () => ({
    songs: mockSongs,
    loading: false,
    error: null,
    refreshSongs: mockRefreshSongs
  })
}))

vi.mock('../../../hooks/useSongMutations', () => ({
  useSongMutations: () => ({
    mergeSongs: mockMergeSongs,
    deleteSong: mockDeleteSong,
    isLoading: false
  })
}))

vi.mock('@features/auth', () => ({
  useAuth: () => ({
    isAdmin: true,
    getToken: vi.fn().mockResolvedValue('mock-token')
  })
}))

// Mock duplicate detection utility
vi.mock('../../../validation/utils/duplicateDetection', () => ({
  findSimilarSongs: vi.fn((title: string, _songs: Song[], _artist?: string) => {
    if (title === 'Amazing Grace') {
      return [{
        song: mockSongs[1],
        similarity: 'exact' as const,
        score: 1.0,
        reasons: ['Identical title', 'Same artist']
      }]
    }
    if (title === 'How Great Thou Art') {
      return [{
        song: mockSongs[3],
        similarity: 'very-similar' as const,
        score: 0.9,
        reasons: ['Very similar title', 'Same artist']
      }]
    }
    return []
  })
}))

describe('DuplicateManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('duplicate detection and display', () => {
    it('renders duplicate manager component', async () => {
      renderWithProviders(
        <DuplicateManager />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/Duplicate Song Manager/)).toBeInTheDocument()
      })
    })

    it('shows duplicate groups when found', async () => {
      renderWithProviders(
        <DuplicateManager />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/2.*groups found/)).toBeInTheDocument()
      })
    })

    it('displays songs in duplicate groups', async () => {
      renderWithProviders(
        <DuplicateManager />
      )
      
      await waitFor(() => {
        // Check that song titles appear in the UI (allowing for multiple instances)
        expect(screen.getAllByText('Amazing Grace').length).toBeGreaterThan(0)
        expect(screen.getAllByText('How Great Thou Art').length).toBeGreaterThan(0)
      })
    })
  })

  describe('duplicate filtering and sorting', () => {
    it('has filter controls', async () => {
      renderWithProviders(
        <DuplicateManager />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/Show only exact matches/)).toBeInTheDocument()
      })
    })

    it('displays basic group information', async () => {
      renderWithProviders(
        <DuplicateManager />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/2.*groups found/)).toBeInTheDocument()
      })
    })
  })

  describe('merge functionality', () => {
    it('shows merge interface elements', async () => {
      renderWithProviders(
        <DuplicateManager />
      )
      
      await waitFor(() => {
        expect(screen.getAllByText(/Merge/).length).toBeGreaterThan(0)
      })
    })

    it('has merge controls', async () => {
      renderWithProviders(
        <DuplicateManager />
      )
      
      await waitFor(() => {
        // Check for basic merge-related elements
        expect(screen.getAllByText(/selected for merge/).length).toBeGreaterThan(0)
      })
    })
  })

  describe('individual song actions', () => {
    it('renders component with song information', async () => {
      renderWithProviders(
        <DuplicateManager />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/2.*groups found/)).toBeInTheDocument()
      })
    })
  })

  describe('bulk operations', () => {
    it('has bulk selection controls', async () => {
      renderWithProviders(
        <DuplicateManager />
      )
      
      await waitFor(() => {
        // Check for checkboxes or selection controls
        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes.length).toBeGreaterThan(0)
      })
    })
  })

  describe('error handling', () => {
    it('renders without crashing', async () => {
      renderWithProviders(
        <DuplicateManager />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/Duplicate Song Manager/)).toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('has basic accessibility features', async () => {
      renderWithProviders(
        <DuplicateManager />
      )
      
      await waitFor(() => {
        // Check for basic heading structure
        expect(screen.getByText(/Duplicate Song Manager/)).toBeInTheDocument()
      })
    })
  })
})