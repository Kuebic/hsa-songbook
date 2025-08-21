import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ArrangementList } from '../ArrangementList'
import { useAuth } from '@features/auth'
import type { Arrangement } from '@features/songs/types/song.types'

// Mock auth hook
vi.mock('@features/auth', () => ({
  useAuth: vi.fn()
}))

// Mock notification hook
vi.mock('@shared/components/notifications', () => ({
  useNotification: () => ({
    addNotification: vi.fn()
  })
}))

describe('ArrangementList Authentication', () => {
  const mockArrangement: Arrangement = {
    id: 'arr-1',
    songId: 'song-1',
    name: 'Test Arrangement',
    slug: 'test-arrangement',
    key: 'C',
    tempo: 120,
    timeSignature: '4/4',
    difficulty: 'intermediate',
    tags: ['acoustic', 'worship'],
    createdBy: 'user-123', // Added createdBy field
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not show Chord Editor button when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      isAdmin: false,
      userId: null,
      getToken: vi.fn(),
      signOut: vi.fn()
    })

    render(
      <MemoryRouter>
        <ArrangementList
          arrangements={[mockArrangement]}
          showActions={true}
        />
      </MemoryRouter>
    )

    // Should not see Chord Editor button
    expect(screen.queryByText('Chord Editor')).not.toBeInTheDocument()
    
    // Should still see the arrangement card
    expect(screen.getByText('Test Arrangement')).toBeInTheDocument()
  })

  it('should show Chord Editor button when user is the creator', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      userId: 'user-123', // Same as arrangement.createdBy
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    })

    render(
      <MemoryRouter>
        <ArrangementList
          arrangements={[mockArrangement]}
          showActions={true}
        />
      </MemoryRouter>
    )

    // Should see Chord Editor button as creator
    expect(screen.getByText('Chord Editor')).toBeInTheDocument()
  })

  it('should not show Chord Editor button when user is not the creator', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      userId: 'different-user', // Different from arrangement.createdBy
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    })

    render(
      <MemoryRouter>
        <ArrangementList
          arrangements={[mockArrangement]}
          showActions={true}
        />
      </MemoryRouter>
    )

    // Should not see Chord Editor button as non-creator
    expect(screen.queryByText('Chord Editor')).not.toBeInTheDocument()
  })

  it('should show Chord Editor button when user is admin (even if not creator)', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: true,
      userId: 'admin-456', // Different from arrangement.createdBy but admin
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    })

    render(
      <MemoryRouter>
        <ArrangementList
          arrangements={[mockArrangement]}
          showActions={true}
        />
      </MemoryRouter>
    )

    // Should see Chord Editor button as admin
    expect(screen.getByText('Chord Editor')).toBeInTheDocument()
  })

  it('should not show Edit Details button when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      isAdmin: false,
      userId: null,
      getToken: vi.fn(),
      signOut: vi.fn()
    })

    const onEdit = vi.fn()

    render(
      <MemoryRouter>
        <ArrangementList
          arrangements={[mockArrangement]}
          showActions={true}
          onEdit={onEdit}
        />
      </MemoryRouter>
    )

    // Should not see Edit Details button
    expect(screen.queryByText('Edit Details')).not.toBeInTheDocument()
  })

  it('should show Edit Details button only for creator or admin', () => {
    const onEdit = vi.fn()

    // Test creator can see Edit Details
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      userId: 'user-123', // Same as arrangement.createdBy
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    })

    const { rerender } = render(
      <MemoryRouter>
        <ArrangementList
          arrangements={[mockArrangement]}
          showActions={true}
          onEdit={onEdit}
        />
      </MemoryRouter>
    )

    // Creator should see Edit Details button
    expect(screen.getByText('Edit Details')).toBeInTheDocument()

    // Test non-creator cannot see Edit Details
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      userId: 'different-user',
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    })

    rerender(
      <MemoryRouter>
        <ArrangementList
          arrangements={[mockArrangement]}
          showActions={true}
          onEdit={onEdit}
        />
      </MemoryRouter>
    )

    // Non-creator should not see Edit Details button
    expect(screen.queryByText('Edit Details')).not.toBeInTheDocument()

    // Test admin can see Edit Details
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: true,
      userId: 'admin-456',
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    })

    rerender(
      <MemoryRouter>
        <ArrangementList
          arrangements={[mockArrangement]}
          showActions={true}
          onEdit={onEdit}
        />
      </MemoryRouter>
    )

    // Admin should see Edit Details button
    expect(screen.getByText('Edit Details')).toBeInTheDocument()
  })

  it('should only show Delete button for admin users', () => {
    // Test non-admin authenticated user
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      userId: 'user-123',
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    })

    const onDelete = vi.fn()

    const { rerender } = render(
      <MemoryRouter>
        <ArrangementList
          arrangements={[mockArrangement]}
          showActions={true}
          onDelete={onDelete}
        />
      </MemoryRouter>
    )

    // Regular user should not see Delete button
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()

    // Test admin user
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: true,
      userId: 'admin-123',
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    })

    rerender(
      <MemoryRouter>
        <ArrangementList
          arrangements={[mockArrangement]}
          showActions={true}
          onDelete={onDelete}
        />
      </MemoryRouter>
    )

    // Admin should see Delete button
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('should hide all actions when showActions is false', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: true,
      userId: 'admin-123',
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    })

    render(
      <MemoryRouter>
        <ArrangementList
          arrangements={[mockArrangement]}
          showActions={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    )

    // Should not see any action buttons
    expect(screen.queryByText('Chord Editor')).not.toBeInTheDocument()
    expect(screen.queryByText('Edit Details')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })
})