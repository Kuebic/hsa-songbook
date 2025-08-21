import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageSelector, LabeledLanguageSelector, CompactLanguageSelector } from '../LanguageSelector'
import type { LanguageCode } from '../../types/multilingual.types'

describe('LanguageSelector', () => {
  const defaultProps = {
    value: 'en' as LanguageCode,
    onChange: vi.fn(),
    availableLanguages: ['en', 'ja', 'ja-romaji'] as LanguageCode[]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('should render with default props', () => {
      render(<LanguageSelector {...defaultProps} />)
      
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Select language')).toBeInTheDocument()
    })

    it('should show placeholder when no value selected', () => {
      render(
        <LanguageSelector 
          {...defaultProps} 
          value={undefined}
          placeholder="Choose a language"
        />
      )
      
      expect(screen.getByDisplayValue('Choose a language')).toBeInTheDocument()
    })
  })

  describe('LabeledLanguageSelector rendering', () => {
    it('should render with label when provided', () => {
      render(<LabeledLanguageSelector {...defaultProps} label="Select Language" />)
      
      expect(screen.getByText('Select Language')).toBeInTheDocument()
    })
  })

  describe('language options', () => {
    it('should only show available languages in select options', () => {
      render(<LanguageSelector {...defaultProps} />)
      
      const select = screen.getByRole('combobox')
      const options = select.querySelectorAll('option')
      
      // Should have placeholder + 3 language options
      expect(options).toHaveLength(4)
      
      const optionTexts = Array.from(options).map(option => option.textContent)
      expect(optionTexts).toContain('English')
      expect(optionTexts).toContain('Japanese (日本語)')
      expect(optionTexts).toContain('Japanese (Romaji)')
    })

    it('should show all languages when availableLanguages not provided', () => {
      const propsWithoutAvailable = { ...defaultProps }
      delete (propsWithoutAvailable as any).availableLanguages

      render(<LanguageSelector {...propsWithoutAvailable} />)
      
      const select = screen.getByRole('combobox')
      const options = select.querySelectorAll('option')
      
      // Should have more options when all languages are available
      expect(options.length).toBeGreaterThan(4)
    })

    it('should group languages correctly when groupByScript is true', () => {
      render(<LanguageSelector {...defaultProps} groupByScript />)
      
      const select = screen.getByRole('combobox')
      const optgroups = select.querySelectorAll('optgroup')
      
      // Should have optgroups for grouping
      expect(optgroups.length).toBeGreaterThan(0)
    })
  })

  describe('CompactLanguageSelector', () => {
    it('should render compact variant without native names', () => {
      render(<CompactLanguageSelector {...defaultProps} />)
      
      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      expect(screen.getByDisplayValue('Lang')).toBeInTheDocument()
    })
  })

  describe('native name display', () => {
    it('should show native names by default', () => {
      render(<LanguageSelector {...defaultProps} />)
      
      const select = screen.getByRole('combobox')
      const options = select.querySelectorAll('option')
      const optionTexts = Array.from(options).map(option => option.textContent)
      
      expect(optionTexts).toContain('Japanese (日本語)')
    })

    it('should hide native names when showNativeNames is false', () => {
      render(<LanguageSelector {...defaultProps} showNativeNames={false} />)
      
      const select = screen.getByRole('combobox')
      const options = select.querySelectorAll('option')
      const optionTexts = Array.from(options).map(option => option.textContent)
      
      expect(optionTexts).toContain('Japanese')
      expect(optionTexts).not.toContain('Japanese (日本語)')
    })
  })

  describe('interaction', () => {
    it('should call onChange when language is selected', () => {
      const mockOnChange = vi.fn()
      render(<LanguageSelector {...defaultProps} onChange={mockOnChange} />)
      
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'ja' } })

      expect(mockOnChange).toHaveBeenCalledWith('ja')
    })

    it('should handle disabled state', () => {
      render(<LanguageSelector {...defaultProps} disabled />)
      
      const select = screen.getByRole('combobox')
      expect(select).toBeDisabled()
    })
  })

  describe('LabeledLanguageSelector validation', () => {
    it('should show validation error', () => {
      render(
        <LabeledLanguageSelector 
          {...defaultProps} 
          label="Language"
          error="Please select a language"
        />
      )
      
      expect(screen.getByText('Please select a language')).toBeInTheDocument()
    })

    it('should show description text', () => {
      render(
        <LabeledLanguageSelector 
          {...defaultProps} 
          label="Language"
          description="Choose the primary language for this content"
        />
      )
      
      expect(screen.getByText('Choose the primary language for this content')).toBeInTheDocument()
    })

    it('should show required indicator', () => {
      render(
        <LabeledLanguageSelector 
          {...defaultProps} 
          label="Language"
          required
        />
      )
      
      expect(screen.getByText('Language *')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle empty availableLanguages array', () => {
      render(<LanguageSelector {...defaultProps} availableLanguages={[]} />)
      
      const select = screen.getByRole('combobox')
      const options = select.querySelectorAll('option')
      
      // Should only have placeholder option
      expect(options).toHaveLength(1)
    })

    it('should handle invalid value gracefully', () => {
      render(<LanguageSelector {...defaultProps} value={'invalid' as LanguageCode} />)
      
      // Should render without crashing
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should handle value not in availableLanguages', () => {
      render(
        <LanguageSelector 
          {...defaultProps} 
          value="ko"
          availableLanguages={['en', 'ja']}
        />
      )
      
      // Should render the value even if not in available languages
      const select = screen.getByRole('combobox')
      expect(select).toHaveValue('ko')
    })
  })

  describe('styling customization', () => {
    it('should accept custom className', () => {
      render(<LanguageSelector {...defaultProps} className="custom-class" />)
      
      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('custom-class')
    })
  })
})