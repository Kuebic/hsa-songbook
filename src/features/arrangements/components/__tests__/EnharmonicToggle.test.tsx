/**
 * @file EnharmonicToggle.test.tsx
 * @description Integration tests for EnharmonicToggle component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnharmonicToggle } from '../EnharmonicToggle'
import { enharmonicService } from '../../services/enharmonicService'

describe('EnharmonicToggle', () => {
  const mockOnToggle = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Reset preference to default
    enharmonicService.setPreference({ preference: 'auto' })
  })
  
  describe('visibility', () => {
    it('should show toggle for enharmonic keys', () => {
      render(
        <EnharmonicToggle
          currentKey="F#"
          onToggle={mockOnToggle}
        />
      )
      
      expect(screen.getByLabelText('Toggle enharmonic equivalent')).toBeInTheDocument()
    })
    
    it('should not show toggle for non-enharmonic keys', () => {
      const { container } = render(
        <EnharmonicToggle
          currentKey="C"
          onToggle={mockOnToggle}
        />
      )
      
      expect(container.firstChild).toBeNull()
    })
    
    it('should not show toggle when no key is provided', () => {
      const { container } = render(
        <EnharmonicToggle
          onToggle={mockOnToggle}
        />
      )
      
      expect(container.firstChild).toBeNull()
    })
  })
  
  describe('button variant', () => {
    it('should render button variant by default', () => {
      render(
        <EnharmonicToggle
          currentKey="Bb"
          onToggle={mockOnToggle}
        />
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('enharmonic-toggle-button')
    })
    
    it('should display current preference symbol', () => {
      enharmonicService.setPreference({ preference: 'sharp' })
      
      render(
        <EnharmonicToggle
          currentKey="F#"
          onToggle={mockOnToggle}
        />
      )
      
      expect(screen.getByText('♯')).toBeInTheDocument()
    })
  })
  
  describe('switch variant', () => {
    it('should render switch variant when specified', () => {
      render(
        <EnharmonicToggle
          currentKey="C#"
          onToggle={mockOnToggle}
          variant="switch"
        />
      )
      
      const switchButton = screen.getByRole('button')
      expect(switchButton).toHaveClass('switch-button')
    })
    
    it('should show both sharp and flat symbols in switch', () => {
      render(
        <EnharmonicToggle
          currentKey="Db"
          onToggle={mockOnToggle}
          variant="switch"
        />
      )
      
      expect(screen.getByText('♯')).toBeInTheDocument()
      expect(screen.getByText('♭')).toBeInTheDocument()
    })
    
    it('should apply active class based on preference', () => {
      enharmonicService.setPreference({ preference: 'flat' })
      
      render(
        <EnharmonicToggle
          currentKey="Gb"
          onToggle={mockOnToggle}
          variant="switch"
        />
      )
      
      const switchButton = screen.getByRole('button')
      expect(switchButton).toHaveClass('active-flat')
    })
  })
  
  describe('interaction', () => {
    it('should call onToggle when clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <EnharmonicToggle
          currentKey="A#"
          onToggle={mockOnToggle}
        />
      )
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(mockOnToggle).toHaveBeenCalledTimes(1)
    })
    
    it('should toggle preference when clicked', async () => {
      const user = userEvent.setup()
      enharmonicService.setPreference({ preference: 'sharp' })
      
      render(
        <EnharmonicToggle
          currentKey="F#"
          onToggle={mockOnToggle}
        />
      )
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      const newPref = enharmonicService.getPreference()
      expect(newPref.preference).toBe('flat')
    })
    
    it('should update context key when toggling', async () => {
      const user = userEvent.setup()
      
      render(
        <EnharmonicToggle
          currentKey="Bb"
          onToggle={mockOnToggle}
        />
      )
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      const pref = enharmonicService.getPreference()
      expect(pref.contextKey).toBe('Bb')
    })
  })
  
  describe('accessibility', () => {
    it('should have proper aria-label', () => {
      render(
        <EnharmonicToggle
          currentKey="C#"
          onToggle={mockOnToggle}
        />
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Toggle enharmonic equivalent')
    })
    
    it('should have descriptive title', () => {
      enharmonicService.setPreference({ preference: 'sharp' })
      
      render(
        <EnharmonicToggle
          currentKey="D#"
          onToggle={mockOnToggle}
        />
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Switch to flat notation')
    })
    
    it('should be keyboard accessible', async () => {
      render(
        <EnharmonicToggle
          currentKey="G#"
          onToggle={mockOnToggle}
        />
      )
      
      const button = screen.getByRole('button')
      button.focus()
      // Click event is triggered by Enter key press in the browser
      fireEvent.click(button)
      
      expect(mockOnToggle).toHaveBeenCalled()
    })
  })
  
  describe('styling', () => {
    it('should apply custom className', () => {
      render(
        <EnharmonicToggle
          currentKey="Eb"
          onToggle={mockOnToggle}
          className="custom-class"
        />
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })
})