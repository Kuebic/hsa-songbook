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

// Helper to create complete auth mock
const createAuthMock = (overrides: Partial<ReturnType<typeof useAuth>> = {}) => ({
  user: null,
  userId: undefined,
  sessionId: undefined,
  isLoaded: true,
  isSignedIn: false,
  isAdmin: false,
  isAnonymous: false,
  getToken: vi.fn().mockResolvedValue(null),
  getUserEmail: vi.fn().mockReturnValue(undefined),
  getUserName: vi.fn().mockReturnValue('User'),
  getUserAvatar: vi.fn().mockReturnValue(undefined),
  session: null,
  signInWithProvider: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  resetPassword: vi.fn(),
  signInAnonymously: vi.fn(),
  linkEmailToAnonymousUser: vi.fn(),
  linkOAuthToAnonymousUser: vi.fn(),
  signOut: vi.fn(),
  ...overrides
})

// Mock notification hook
vi.mock('@shared/components/notifications', () => ({
  useNotification: () => ({
    addNotification: vi.fn()
  })
}))

describe('ArrangementList Authentication', () => {
  const mockArrangement: Arrangement = {
    id: 'arr-1',
    songIds: ['song-1'],
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
    vi.mocked(useAuth).mockReturnValue(createAuthMock())

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
    vi.mocked(useAuth).mockReturnValue(createAuthMock({
      isSignedIn: true,
      userId: 'user-123', // Same as arrangement.createdBy
      user: { id: 'user-123' } as any,
      getToken: vi.fn().mockResolvedValue('mock-token')
    }))

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
    vi.mocked(useAuth).mockReturnValue(createAuthMock({
      isSignedIn: true,
      userId: 'different-user', // Different from arrangement.createdBy
      user: { id: 'different-user' } as any,
      getToken: vi.fn().mockResolvedValue('mock-token')
    }))

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
    vi.mocked(useAuth).mockReturnValue(createAuthMock({
      isSignedIn: true,
      isAdmin: true,
      userId: 'admin-456', // Different from arrangement.createdBy but admin
      user: { id: 'admin-456' } as any,
      getToken: vi.fn().mockResolvedValue('mock-token')
    }))

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
    vi.mocked(useAuth).mockReturnValue(createAuthMock())

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
    vi.mocked(useAuth).mockReturnValue(createAuthMock({
      isSignedIn: true,
      userId: 'user-123', // Same as arrangement.createdBy
      user: { id: 'user-123' } as any,
      getToken: vi.fn().mockResolvedValue('mock-token')
    }))

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
    vi.mocked(useAuth).mockReturnValue(createAuthMock({
      isSignedIn: true,
      userId: 'different-user',
      user: { id: 'different-user' } as any,
      getToken: vi.fn().mockResolvedValue('mock-token')
    }))

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
    vi.mocked(useAuth).mockReturnValue(createAuthMock({
      isSignedIn: true,
      isAdmin: true,
      userId: 'admin-456',
      user: { id: 'admin-456' } as any,
      getToken: vi.fn().mockResolvedValue('mock-token')
    }))

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
    vi.mocked(useAuth).mockReturnValue(createAuthMock({
      isSignedIn: true,
      userId: 'user-123',
      user: { id: 'user-123' } as any,
      getToken: vi.fn().mockResolvedValue('mock-token')
    }))

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
    vi.mocked(useAuth).mockReturnValue(createAuthMock({
      isSignedIn: true,
      isAdmin: true,
      userId: 'admin-123',
      user: { id: 'admin-123' } as any,
      getToken: vi.fn().mockResolvedValue('mock-token')
    }))

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
    vi.mocked(useAuth).mockReturnValue(createAuthMock({
      isSignedIn: true,
      isAdmin: true,
      userId: 'admin-123',
      user: { id: 'admin-123' } as any,
      getToken: vi.fn().mockResolvedValue('mock-token')
    }))

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