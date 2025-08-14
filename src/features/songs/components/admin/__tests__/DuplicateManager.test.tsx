import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithClerk } from '@shared/test-utils/clerk-test-utils'
import { createMockUser } from '@shared/test-utils/clerk-test-helpers'
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
  const mockUser = createMockUser({ 
    id: 'admin_user',
    publicMetadata: { role: 'admin' }
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('duplicate detection and display', () => {
    it('displays detected duplicate groups', async () => {
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      await waitFor(() => {
        expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
        expect(screen.getByText('How Great Thou Art')).toBeInTheDocument()
      })
      
      // Should show duplicate indicators
      expect(screen.getAllByText(/exact match/i)).toHaveLength(1)
      expect(screen.getAllByText(/very similar/i)).toHaveLength(1)
    })

    it('shows duplicate statistics', async () => {
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      await waitFor(() => {
        expect(screen.getByText(/2 duplicate groups found/i)).toBeInTheDocument()
        expect(screen.getByText(/4 songs affected/i)).toBeInTheDocument()
      })
    })

    it('displays similarity reasons', async () => {
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      await waitFor(() => {
        expect(screen.getByText('Identical title')).toBeInTheDocument()
        expect(screen.getByText('Same artist')).toBeInTheDocument()
        expect(screen.getByText('Very similar title')).toBeInTheDocument()
      })
    })
  })

  describe('duplicate filtering and sorting', () => {
    it('filters by similarity level', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Filter to show only exact matches
      const filterSelect = screen.getByLabelText(/filter by similarity/i)
      await user.selectOptions(filterSelect, 'exact')
      
      await waitFor(() => {
        expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
        expect(screen.queryByText('How Great Thou Art')).not.toBeInTheDocument()
      })
    })

    it('sorts duplicate groups by different criteria', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Sort by popularity (views)
      const sortSelect = screen.getByLabelText(/sort by/i)
      await user.selectOptions(sortSelect, 'popularity')
      
      await waitFor(() => {
        // How Great Thou Art has more views, should appear first
        const groupElements = screen.getAllByTestId(/duplicate-group/i)
        expect(groupElements[0]).toHaveTextContent('How Great Thou Art')
      })
    })

    it('searches duplicate groups', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      const searchInput = screen.getByPlaceholderText(/search duplicates/i)
      await user.type(searchInput, 'Amazing')
      
      await waitFor(() => {
        expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
        expect(screen.queryByText('How Great Thou Art')).not.toBeInTheDocument()
      })
    })
  })

  describe('merge functionality', () => {
    it('shows merge options for duplicate group', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Click on first duplicate group
      const groupElement = screen.getAllByTestId(/duplicate-group/i)[0]
      await user.click(groupElement)
      
      await waitFor(() => {
        expect(screen.getByText('Merge Duplicates')).toBeInTheDocument()
        expect(screen.getByText('Select Primary Song')).toBeInTheDocument()
        expect(screen.getByText('Merge Songs')).toBeInTheDocument()
      })
    })

    it('allows selecting primary song for merge', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Expand first duplicate group
      const groupElement = screen.getAllByTestId(/duplicate-group/i)[0]
      await user.click(groupElement)
      
      await waitFor(() => {
        const radioButtons = screen.getAllByRole('radio')
        expect(radioButtons).toHaveLength(2) // Two songs in this group
        
        // Select second song as primary
        await user.click(radioButtons[1])
        expect(radioButtons[1]).toBeChecked()
      })
    })

    it('performs merge operation', async () => {
      const user = userEvent.setup()
      mockMergeSongs.mockResolvedValue({ success: true })
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Expand first duplicate group
      const groupElement = screen.getAllByTestId(/duplicate-group/i)[0]
      await user.click(groupElement)
      
      await waitFor(async () => {
        // Select primary song
        const radioButtons = screen.getAllByRole('radio')
        await user.click(radioButtons[0])
        
        // Click merge button
        const mergeButton = screen.getByText('Merge Songs')
        await user.click(mergeButton)
      })
      
      await waitFor(() => {
        expect(mockMergeSongs).toHaveBeenCalledWith({
          primarySongId: '1',
          duplicateSongIds: ['2'],
          mergeData: true,
          mergeArrangements: true,
          mergeReviews: true
        })
      })
    })

    it('shows merge confirmation dialog', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Expand and initiate merge
      const groupElement = screen.getAllByTestId(/duplicate-group/i)[0]
      await user.click(groupElement)
      
      await waitFor(async () => {
        const radioButtons = screen.getAllByRole('radio')
        await user.click(radioButtons[0])
        
        const mergeButton = screen.getByText('Merge Songs')
        await user.click(mergeButton)
      })
      
      // Should show confirmation
      expect(screen.getByText(/are you sure you want to merge/i)).toBeInTheDocument()
      expect(screen.getByText('Confirm Merge')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('individual song actions', () => {
    it('allows deleting individual duplicate songs', async () => {
      const user = userEvent.setup()
      mockDeleteSong.mockResolvedValue({ success: true })
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Find and click delete button for a song
      const deleteButtons = screen.getAllByText('Delete')
      await user.click(deleteButtons[0])
      
      // Confirm deletion
      await waitFor(() => {
        const confirmButton = screen.getByText('Confirm Delete')
        user.click(confirmButton)
      })
      
      await waitFor(() => {
        expect(mockDeleteSong).toHaveBeenCalledWith('1')
      })
    })

    it('shows song details in comparison view', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Expand duplicate group to see comparison
      const groupElement = screen.getAllByTestId(/duplicate-group/i)[0]
      await user.click(groupElement)
      
      await waitFor(() => {
        // Should show detailed comparison
        expect(screen.getByText('Views: 100')).toBeInTheDocument()
        expect(screen.getByText('Views: 50')).toBeInTheDocument()
        expect(screen.getByText('Rating: 4.5 (10 reviews)')).toBeInTheDocument()
        expect(screen.getByText('Rating: 4.0 (5 reviews)')).toBeInTheDocument()
      })
    })

    it('allows ignoring duplicate groups', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Find ignore button
      const ignoreButtons = screen.getAllByText('Ignore')
      await user.click(ignoreButtons[0])
      
      await waitFor(() => {
        // Group should be hidden or marked as ignored
        expect(screen.queryByText('Amazing Grace')).not.toBeInTheDocument()
      })
    })
  })

  describe('bulk operations', () => {
    it('allows selecting multiple duplicate groups', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Select checkboxes for multiple groups
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])
      
      // Should show bulk actions
      expect(screen.getByText('Bulk Actions')).toBeInTheDocument()
      expect(screen.getByText('2 groups selected')).toBeInTheDocument()
    })

    it('performs bulk ignore operation', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Select groups and perform bulk ignore
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      
      const bulkIgnoreButton = screen.getByText('Ignore Selected')
      await user.click(bulkIgnoreButton)
      
      await waitFor(() => {
        expect(screen.getByText('1 group ignored')).toBeInTheDocument()
      })
    })
  })

  describe('error handling', () => {
    it('handles merge errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockMergeSongs.mockRejectedValue(new Error('Merge failed'))
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Attempt merge
      const groupElement = screen.getAllByTestId(/duplicate-group/i)[0]
      await user.click(groupElement)
      
      await waitFor(async () => {
        const radioButtons = screen.getAllByRole('radio')
        await user.click(radioButtons[0])
        
        const mergeButton = screen.getByText('Merge Songs')
        await user.click(mergeButton)
        
        const confirmButton = screen.getByText('Confirm Merge')
        await user.click(confirmButton)
      })
      
      await waitFor(() => {
        expect(screen.getByText(/failed to merge songs/i)).toBeInTheDocument()
      })
      
      consoleSpy.mockRestore()
    })

    it('shows loading states during operations', async () => {
      const _user = userEvent.setup()
      
      // Mock loading state
      vi.mocked(vi.importActual('../../../hooks/useSongMutations')).useSongMutations = () => ({
        mergeSongs: mockMergeSongs,
        deleteSong: mockDeleteSong,
        isLoading: true
      })
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Duplicate song manager')
      
      const groups = screen.getAllByRole('region')
      expect(groups[0]).toHaveAttribute('aria-label', 'Duplicate group')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      // Tab through elements
      await user.tab()
      expect(screen.getByLabelText(/filter by similarity/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/sort by/i)).toHaveFocus()
    })

    it('announces actions to screen readers', async () => {
      const user = userEvent.setup()
      
      renderWithClerk(
        <DuplicateManager />,
        { user: mockUser, isSignedIn: true }
      )
      
      const groupElement = screen.getAllByTestId(/duplicate-group/i)[0]
      await user.click(groupElement)
      
      // Should have live region for announcements
      expect(screen.getByRole('status')).toHaveTextContent('Duplicate group expanded')
    })
  })
})