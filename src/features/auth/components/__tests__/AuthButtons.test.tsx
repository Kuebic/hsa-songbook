import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthButtons } from '../AuthButtons'
import { renderWithClerk } from '@shared/test-utils/clerk-test-utils'

describe('AuthButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign in and sign up buttons', () => {
    renderWithClerk(<AuthButtons />)
    
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('renders SignInButton and SignUpButton components', () => {
    renderWithClerk(<AuthButtons />)
    
    // The buttons are rendered within the Clerk components
    const signInButton = screen.getByText('Sign In')
    const signUpButton = screen.getByText('Sign Up')
    
    expect(signInButton).toBeInTheDocument()
    expect(signUpButton).toBeInTheDocument()
    expect(signInButton.tagName).toBe('BUTTON')
    expect(signUpButton.tagName).toBe('BUTTON')
  })

  it('sign in button has correct initial styles', () => {
    renderWithClerk(<AuthButtons />)
    
    const signInButton = screen.getByText('Sign In')
    
    // Check that button has expected attributes
    expect(signInButton).toHaveStyle({
      padding: '0.5rem 1rem',
      cursor: 'pointer'
    })
  })

  it('sign up button has correct initial styles', () => {
    renderWithClerk(<AuthButtons />)
    
    const signUpButton = screen.getByText('Sign Up')
    
    // Check that button has expected attributes
    expect(signUpButton).toHaveStyle({
      padding: '0.5rem 1rem',
      cursor: 'pointer'
    })
  })

  it('buttons have hover event handlers', async () => {
    const user = userEvent.setup()
    renderWithClerk(<AuthButtons />)
    
    const signInButton = screen.getByText('Sign In')
    const signUpButton = screen.getByText('Sign Up')
    
    // Test that hover changes styles
    await user.hover(signInButton)
    expect(signInButton.style.backgroundColor).toBe('white')
    
    await user.unhover(signInButton)
    expect(signInButton.style.backgroundColor).toBe('transparent')
    
    await user.hover(signUpButton)
    expect(signUpButton.style.backgroundColor).toBe('rgb(37, 99, 235)') // #2563eb in RGB
    
    await user.unhover(signUpButton)
    expect(signUpButton.style.backgroundColor).toBe('rgb(59, 130, 246)') // #3b82f6 in RGB
  })
})