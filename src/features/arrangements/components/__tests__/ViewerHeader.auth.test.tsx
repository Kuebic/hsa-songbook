import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ViewerHeader } from '../ViewerHeader'
import { useAuth } from '@features/auth'
import type { ArrangementViewerData } from '../../types/viewer.types'

// Mock auth hook
vi.mock('@features/auth', () => ({
  useAuth: vi.fn()
}))

describe('ViewerHeader Authorization', () => {
  const mockArrangement: ArrangementViewerData = {
    id: 'arr-1',
    name: 'Test Arrangement',
    slug: 'test-arrangement',
    songIds: ['song-1'],
    songTitle: 'Test Song',
    songSlug: 'test-song',
    key: 'C',
    tempo: 120,
    difficulty: 'intermediate',
    chordProText: '[C]Test chord sheet',
    createdBy: 'user-123',
    tags: []
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not show Edit Chords button when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      isAdmin: false,
      userId: null,
      getToken: vi.fn(),
      signOut: vi.fn()
    } as any)

    render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )

    // Should not see Edit Chords button
    expect(screen.queryByText('Edit Chords')).not.toBeInTheDocument()
  })

  it('should show Edit Chords button when user is the creator', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      userId: 'user-123', // Same as arrangement.createdBy
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    } as any)

    render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )

    // Should see Edit Chords button as creator
    expect(screen.getByText('Edit Chords')).toBeInTheDocument()
  })

  it('should not show Edit Chords button when user is not the creator', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      userId: 'different-user', // Different from arrangement.createdBy
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    } as any)

    render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )

    // Should not see Edit Chords button as non-creator
    expect(screen.queryByText('Edit Chords')).not.toBeInTheDocument()
  })

  it('should show Edit Chords button when user is admin (even if not creator)', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: true,
      userId: 'admin-456', // Different from arrangement.createdBy but admin
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    } as any)

    render(
      <MemoryRouter>
        <ViewerHeader arrangement={mockArrangement} />
      </MemoryRouter>
    )

    // Should see Edit Chords button as admin
    expect(screen.getByText('Edit Chords')).toBeInTheDocument()
  })

  it('should handle arrangements without createdBy field gracefully', () => {
    const arrangementWithoutCreator = {
      ...mockArrangement,
      createdBy: undefined
    }

    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      userId: 'user-123',
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    } as any)

    render(
      <MemoryRouter>
        <ViewerHeader arrangement={arrangementWithoutCreator} />
      </MemoryRouter>
    )

    // Should not see Edit Chords button when createdBy is undefined
    expect(screen.queryByText('Edit Chords')).not.toBeInTheDocument()
  })
})