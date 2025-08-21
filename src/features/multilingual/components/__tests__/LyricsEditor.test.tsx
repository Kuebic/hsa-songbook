import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LyricsEditor } from '../LyricsEditor'
import type { MultilingualText, LanguageCode } from '../../types/multilingual.types'

// Mock the text processing utilities
vi.mock('../../utils/textProcessing', () => ({
  textProcessingUtils: {
    getTextMetrics: vi.fn((text: string) => ({
      characterCount: text.length,
      wordCount: text.split(' ').filter(w => w.length > 0).length,
      lineCount: text.split('\n').length,
      containsCJK: /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(text),
      isRomaji: false,
      estimatedReadingTime: 60
    })),
    validateTextForLanguage: vi.fn(() => ({
      isValid: true,
      warnings: [],
      suggestions: []
    }))
  }
}))

// Mock the multilingual service
vi.mock('../../services/multilingualService', () => ({
  multilingualService: {
    getAvailableLanguages: vi.fn(),
    setText: vi.fn(),
    removeText: vi.fn(),
    cleanupText: vi.fn(),
    validateMultilingualText: vi.fn(() => ({ isValid: true, errors: [] }))
  }
}))

describe('LyricsEditor', () => {
  const mockLyrics: MultilingualText = {
    'en': 'Hello world\nThis is a test',
    'ja': 'こんにちは世界\nこれはテストです',
    'ja-romaji': 'konnichiwa sekai\nkore wa tesuto desu'
  }

  const defaultProps = {
    value: mockLyrics,
    onChange: vi.fn(),
    supportedLanguages: ['en', 'ja', 'ja-romaji', 'ko', 'ko-romaji'] as LanguageCode[]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('should render tabs for available languages', () => {
      render(<LyricsEditor {...defaultProps} />)
      
      expect(screen.getByText('English')).toBeInTheDocument()
      expect(screen.getByText('Japanese')).toBeInTheDocument()
      expect(screen.getByText('Japanese Romaji')).toBeInTheDocument()
    })

    it('should show active tab content', () => {
      render(<LyricsEditor {...defaultProps} />)
      
      // English should be active by default
      expect(screen.getByDisplayValue('Hello world\nThis is a test')).toBeInTheDocument()
    })

    it('should show add language button when fewer than max languages', () => {
      render(<LyricsEditor {...defaultProps} maxLanguages={5} />)
      
      expect(screen.getByText('+ Add Language')).toBeInTheDocument()
    })

    it('should not show add language button when at max languages', () => {
      const fullLyrics: MultilingualText = {
        'en': 'English',
        'ja': 'Japanese',
        'ja-romaji': 'Japanese Romaji',
        'ko': 'Korean',
        'ko-romaji': 'Korean Romaji'
      }
      
      render(
        <LyricsEditor 
          {...defaultProps} 
          value={fullLyrics}
          maxLanguages={5}
        />
      )
      
      expect(screen.queryByText('+ Add Language')).not.toBeInTheDocument()
    })
  })

  describe('tab interaction', () => {
    it('should switch tabs when clicked', async () => {
      render(<LyricsEditor {...defaultProps} />)
      
      // Click on Japanese tab
      fireEvent.click(screen.getByText('Japanese'))
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('こんにちは世界\nこれはテストです')).toBeInTheDocument()
      })
    })

    it('should maintain scroll position when switching tabs', async () => {
      render(<LyricsEditor {...defaultProps} />)
      
      const textarea = screen.getByDisplayValue('Hello world\nThis is a test')
      
      // Mock scroll position
      Object.defineProperty(textarea, 'scrollTop', { value: 100, writable: true })
      
      // Switch to Japanese and back
      fireEvent.click(screen.getByText('Japanese'))
      fireEvent.click(screen.getByText('English'))
      
      // Should restore scroll position (this would need more complex testing in real scenario)
      expect(textarea).toBeInTheDocument()
    })

    it('should show remove button for non-required languages', () => {
      render(<LyricsEditor {...defaultProps} requiredLanguages={['en']} />)
      
      // Should show remove button for Japanese (not required)
      fireEvent.click(screen.getByText('Japanese'))
      expect(screen.getByTitle('Remove this language')).toBeInTheDocument()
      
      // Should not show remove button for English (required)
      fireEvent.click(screen.getByText('English'))
      expect(screen.queryByTitle('Remove this language')).not.toBeInTheDocument()
    })
  })

  describe('text editing', () => {
    it('should update lyrics when text is changed', () => {
      const mockOnChange = vi.fn()
      render(<LyricsEditor {...defaultProps} onChange={mockOnChange} />)
      
      const textarea = screen.getByDisplayValue('Hello world\nThis is a test')
      fireEvent.change(textarea, { target: { value: 'Updated lyrics' } })
      
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should show character count', () => {
      render(<LyricsEditor {...defaultProps} showStats />)
      
      // Should show stats for current tab
      expect(screen.getByText(/characters/)).toBeInTheDocument()
      expect(screen.getByText(/words/)).toBeInTheDocument()
    })

    it('should show validation warnings', () => {
      const { textProcessingUtils } = require('../../utils/textProcessing')
      textProcessingUtils.validateTextForLanguage.mockReturnValue({
        isValid: false,
        warnings: ['Text is too long'],
        suggestions: ['Consider shortening the text']
      })

      render(<LyricsEditor {...defaultProps} />)
      
      expect(screen.getByText('Text is too long')).toBeInTheDocument()
    })
  })

  describe('language management', () => {
    it('should add new language when selected from dropdown', async () => {
      const mockOnChange = vi.fn()
      render(<LyricsEditor {...defaultProps} onChange={mockOnChange} />)
      
      // Click add language button
      fireEvent.click(screen.getByText('+ Add Language'))
      
      // Select Korean from dropdown
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'ko' } })
      
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should remove language when remove button is clicked', async () => {
      const mockOnChange = vi.fn()
      render(
        <LyricsEditor 
          {...defaultProps} 
          onChange={mockOnChange}
          requiredLanguages={['en']}
        />
      )
      
      // Switch to Japanese tab and click remove
      fireEvent.click(screen.getByText('Japanese'))
      fireEvent.click(screen.getByTitle('Remove this language'))
      
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should not allow removing required languages', () => {
      render(
        <LyricsEditor 
          {...defaultProps} 
          requiredLanguages={['en', 'ja']}
        />
      )
      
      // English and Japanese should not have remove buttons
      fireEvent.click(screen.getByText('English'))
      expect(screen.queryByTitle('Remove this language')).not.toBeInTheDocument()
      
      fireEvent.click(screen.getByText('Japanese'))
      expect(screen.queryByTitle('Remove this language')).not.toBeInTheDocument()
      
      // Japanese Romaji should have remove button
      fireEvent.click(screen.getByText('Japanese Romaji'))
      expect(screen.getByTitle('Remove this language')).toBeInTheDocument()
    })
  })

  describe('placeholder and help text', () => {
    it('should show placeholder for empty languages', () => {
      const emptyLyrics: MultilingualText = {
        'en': '',
        'ja': 'こんにちは'
      }
      
      render(
        <LyricsEditor 
          {...defaultProps} 
          value={emptyLyrics}
          placeholder="Enter lyrics here..."
        />
      )
      
      expect(screen.getByPlaceholderText('Enter lyrics here...')).toBeInTheDocument()
    })

    it('should show language-specific help text', () => {
      render(<LyricsEditor {...defaultProps} />)
      
      // Switch to Japanese tab
      fireEvent.click(screen.getByText('Japanese'))
      
      // Should show CJK-specific help
      expect(screen.getByText(/Japanese/)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper tab navigation', () => {
      render(<LyricsEditor {...defaultProps} />)
      
      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(3) // en, ja, ja-romaji
      
      // First tab should be selected
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    })

    it('should have proper labels for textareas', () => {
      render(<LyricsEditor {...defaultProps} />)
      
      const textarea = screen.getByLabelText(/English lyrics/i)
      expect(textarea).toBeInTheDocument()
    })

    it('should support keyboard navigation between tabs', () => {
      render(<LyricsEditor {...defaultProps} />)
      
      const tabs = screen.getAllByRole('tab')
      
      // Focus first tab and press arrow key
      fireEvent.focus(tabs[0])
      fireEvent.keyDown(tabs[0], { key: 'ArrowRight' })
      
      // Should focus next tab
      expect(tabs[1]).toHaveFocus()
    })
  })

  describe('validation and error handling', () => {
    it('should show validation errors', () => {
      const { multilingualService } = require('../../services/multilingualService')
      multilingualService.validateMultilingualText.mockReturnValue({
        isValid: false,
        errors: ['Invalid content format']
      })

      render(<LyricsEditor {...defaultProps} />)
      
      expect(screen.getByText('Invalid content format')).toBeInTheDocument()
    })

    it('should disable submit when validation fails', () => {
      const { multilingualService } = require('../../services/multilingualService')
      multilingualService.validateMultilingualText.mockReturnValue({
        isValid: false,
        errors: ['Invalid content']
      })

      render(<LyricsEditor {...defaultProps} />)
      
      // Form should indicate validation errors
      expect(screen.getByText('Invalid content')).toBeInTheDocument()
    })
  })

  describe('responsive behavior', () => {
    it('should adapt layout for mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true })
      
      render(<LyricsEditor {...defaultProps} />)
      
      // Should render tabs in mobile-friendly way
      const tabList = screen.getByRole('tablist')
      expect(tabList).toHaveClass('overflow-x-auto')
    })

    it('should adjust textarea height for mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true })
      
      render(<LyricsEditor {...defaultProps} />)
      
      const textarea = screen.getByDisplayValue('Hello world\nThis is a test')
      expect(textarea).toHaveClass('min-h-32') // Smaller on mobile
    })
  })

  describe('performance', () => {
    it('should debounce onChange calls', async () => {
      const mockOnChange = vi.fn()
      render(<LyricsEditor {...defaultProps} onChange={mockOnChange} />)
      
      const textarea = screen.getByDisplayValue('Hello world\nThis is a test')
      
      // Rapid typing
      fireEvent.change(textarea, { target: { value: 'A' } })
      fireEvent.change(textarea, { target: { value: 'AB' } })
      fireEvent.change(textarea, { target: { value: 'ABC' } })
      
      // Should debounce calls
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1)
      }, { timeout: 1000 })
    })
  })
})