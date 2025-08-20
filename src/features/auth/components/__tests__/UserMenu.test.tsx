import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { UserMenu } from '../UserMenu'
import { renderWithProviders } from '@shared/test-utils/testWrapper'

// Mock the LazyClerkComponents to avoid Suspense issues in tests
vi.mock('../LazyClerkComponents', () => import('../__mocks__/LazyClerkComponents'))

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders UserButton component', () => {
    renderWithProviders(<UserMenu />)
    
    const userButton = screen.getByTestId('user-button')
    expect(userButton).toBeInTheDocument()
  })

  it('renders with correct text', () => {
    renderWithProviders(<UserMenu />)
    
    const userButton = screen.getByText('User')
    expect(userButton).toBeInTheDocument()
  })

  it('passes afterSignOutUrl prop correctly', () => {
    renderWithProviders(<UserMenu />)
    
    // The UserButton is mocked, but we can verify the prop is handled correctly
    const userButton = screen.getByTestId('user-button')
    expect(userButton).toBeInTheDocument()
    expect(userButton).toHaveAttribute('data-after-sign-out-url', '/')
  })
})