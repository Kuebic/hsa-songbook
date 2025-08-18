import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddToSetlistDropdown } from '../AddToSetlistDropdown'

// Mock dependencies
vi.mock('@features/auth', () => ({
  useAuth: vi.fn(() => ({ isSignedIn: true }))
}))

vi.mock('../../../hooks/mutations/useAddToSetlistDropdown', () => ({
  useAddToSetlistDropdown: vi.fn(() => ({
    setlists: [
      {
        id: '1',
        name: 'Sunday Service',
        containsArrangement: false,
        lastModifiedRelative: '2 hours ago',
        arrangementCount: 5,
        updatedAt: new Date(),
        arrangements: []
      },
      {
        id: '2',
        name: 'Youth Group',
        containsArrangement: true,
        lastModifiedRelative: 'yesterday',
        arrangementCount: 10,
        updatedAt: new Date(),
        arrangements: [{ arrangementId: 'arr_123' }]
      }
    ],
    isLoadingSetlists: false,
    addToSetlist: vi.fn(),
    createWithArrangement: vi.fn(),
    isCreating: false
  }))
}))

describe('AddToSetlistDropdown', () => {
  const mockArrangement = {
    id: 'arr_123',
    name: 'Amazing Grace',
    slug: 'amazing-grace',
    songIds: ['song_1'],
    key: 'C',
    tempo: 120,
    difficulty: 'intermediate' as const,
    tags: ['worship', 'traditional'],
    createdBy: 'user_123'
  }
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Rendering', () => {
    it('renders trigger button with correct text', () => {
      render(<AddToSetlistDropdown arrangement={mockArrangement} />)
      expect(screen.getByRole('button', { name: /add to setlist/i })).toBeInTheDocument()
    })
    
    it('renders icon variant when specified', () => {
      render(<AddToSetlistDropdown arrangement={mockArrangement} variant="icon" />)
      const button = screen.getByRole('button', { name: /add to setlist/i })
      expect(button.querySelector('.trigger-icon')).toBeInTheDocument()
    })
  })
  
  describe('Dropdown Behavior', () => {
    it('opens dropdown when trigger is clicked', async () => {
      const user = userEvent.setup()
      render(<AddToSetlistDropdown arrangement={mockArrangement} />)
      
      const trigger = screen.getByRole('button', { name: /add to setlist/i })
      await user.click(trigger)
      
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      expect(screen.getByText('Create new setlist')).toBeInTheDocument()
    })
    
    it('displays user setlists in dropdown', async () => {
      const user = userEvent.setup()
      render(<AddToSetlistDropdown arrangement={mockArrangement} />)
      
      await user.click(screen.getByRole('button', { name: /add to setlist/i }))
      
      expect(screen.getByText('Sunday Service')).toBeInTheDocument()
      expect(screen.getByText('Youth Group')).toBeInTheDocument()
    })
    
    it('shows checkmark for setlists already containing arrangement', async () => {
      const user = userEvent.setup()
      render(<AddToSetlistDropdown arrangement={mockArrangement} />)
      
      await user.click(screen.getByRole('button', { name: /add to setlist/i }))
      
      const youthGroupItem = screen.getByText('Youth Group').closest('button')
      expect(youthGroupItem).toHaveClass('contains-arrangement')
    })
  })
  
  describe('Keyboard Navigation', () => {
    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup()
      render(<AddToSetlistDropdown arrangement={mockArrangement} />)
      
      await user.click(screen.getByRole('button', { name: /add to setlist/i }))
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })
  })
  
  describe('Authentication', () => {
    it('redirects to sign-in when not authenticated', async () => {
      const { useAuth } = await import('@features/auth')
      vi.mocked(useAuth).mockReturnValue({ 
        isSignedIn: false,
        user: null,
        userId: null,
        sessionId: null,
        isLoaded: true,
        isAdmin: false,
        getToken: vi.fn(),
        getUserEmail: () => undefined,
        getUserName: () => 'User',
        getUserAvatar: () => undefined
      })
      
      const originalLocation = window.location.href
      delete (window as Record<string, unknown>).location
      window.location = { href: originalLocation } as Location
      
      const user = userEvent.setup()
      render(<AddToSetlistDropdown arrangement={mockArrangement} />)
      
      await user.click(screen.getByRole('button', { name: /add to setlist/i }))
      
      expect(window.location.href).toContain('/sign-in')
      
      window.location.href = originalLocation
    })
  })
  
  describe('Accessibility', () => {
    it('has proper ARIA attributes on trigger button', () => {
      render(<AddToSetlistDropdown arrangement={mockArrangement} />)
      const trigger = screen.getByRole('button', { name: /add to setlist/i })
      
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    })
    
    it('updates aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup()
      render(<AddToSetlistDropdown arrangement={mockArrangement} />)
      
      const trigger = screen.getByRole('button', { name: /add to setlist/i })
      await user.click(trigger)
      
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })
  })
})