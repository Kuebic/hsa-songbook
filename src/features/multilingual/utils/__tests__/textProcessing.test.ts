import { describe, it, expect } from 'vitest'
import { textProcessingUtils } from '../textProcessing'
import type { MultilingualText } from '../../types/multilingual.types'

describe('textProcessingUtils', () => {
  describe('normalizeText', () => {
    it('should normalize line breaks', () => {
      const text = 'Hello\r\nWorld\rTest'
      const result = textProcessingUtils.normalizeText(text, 'en')
      expect(result).toBe('Hello\nWorld\nTest')
    })

    it('should trim lines', () => {
      const text = '  Hello  \n  World  '
      const result = textProcessingUtils.normalizeText(text, 'en')
      expect(result).toBe('Hello\nWorld')
    })

    it('should remove extra whitespace', () => {
      const text = 'Hello    world   test'
      const result = textProcessingUtils.normalizeText(text, 'en')
      expect(result).toBe('Hello world test')
    })

    it('should preserve indentation when requested', () => {
      const text = '  Hello\n    World'
      const result = textProcessingUtils.normalizeText(text, 'en', {
        preserveIndentation: true,
        trimLines: true
      })
      expect(result).toBe('  Hello\n    World')
    })

    it('should handle CJK text carefully', () => {
      const text = 'こんにちは  世界'
      const result = textProcessingUtils.normalizeText(text, 'ja')
      expect(result).toBe('こんにちは 世界')
    })

    it('should remove empty lines at start and end', () => {
      const text = '\n\nHello\nWorld\n\n'
      const result = textProcessingUtils.normalizeText(text, 'en')
      expect(result).toBe('Hello\nWorld')
    })

    it('should handle empty input', () => {
      expect(textProcessingUtils.normalizeText('', 'en')).toBe('')
      expect(textProcessingUtils.normalizeText(null as any, 'en')).toBe('')
    })
  })

  describe('containsCJKCharacters', () => {
    it('should detect Japanese characters', () => {
      expect(textProcessingUtils.containsCJKCharacters('こんにちは')).toBe(true)
      expect(textProcessingUtils.containsCJKCharacters('カタカナ')).toBe(true)
      expect(textProcessingUtils.containsCJKCharacters('漢字')).toBe(true)
    })

    it('should detect Korean characters', () => {
      expect(textProcessingUtils.containsCJKCharacters('안녕하세요')).toBe(true)
    })

    it('should not detect Latin characters', () => {
      expect(textProcessingUtils.containsCJKCharacters('Hello world')).toBe(false)
      expect(textProcessingUtils.containsCJKCharacters('konnichiwa')).toBe(false)
    })

    it('should detect mixed content', () => {
      expect(textProcessingUtils.containsCJKCharacters('Hello こんにちは')).toBe(true)
    })
  })

  describe('isLikelyRomaji', () => {
    it('should detect Japanese romaji', () => {
      expect(textProcessingUtils.isLikelyRomaji('konnichiwa sekai')).toBe(true)
      expect(textProcessingUtils.isLikelyRomaji('arigato gozaimasu')).toBe(true)
    })

    it('should detect Korean romaji', () => {
      expect(textProcessingUtils.isLikelyRomaji('annyeong haseyo')).toBe(true)
      expect(textProcessingUtils.isLikelyRomaji('saranghae')).toBe(true)
    })

    it('should not detect regular English', () => {
      expect(textProcessingUtils.isLikelyRomaji('Hello world')).toBe(false)
      expect(textProcessingUtils.isLikelyRomaji('This is a test')).toBe(false)
    })

    it('should not detect CJK characters as romaji', () => {
      expect(textProcessingUtils.isLikelyRomaji('こんにちは')).toBe(false)
      expect(textProcessingUtils.isLikelyRomaji('안녕하세요')).toBe(false)
    })

    it('should detect vowel patterns', () => {
      expect(textProcessingUtils.isLikelyRomaji('aiueo')).toBe(true)
      expect(textProcessingUtils.isLikelyRomaji('sayounara')).toBe(true)
    })
  })

  describe('getTextMetrics', () => {
    it('should calculate metrics for English text', () => {
      const text = 'Hello world\nThis is a test'
      const metrics = textProcessingUtils.getTextMetrics(text, 'en')
      
      expect(metrics.characterCount).toBe(26)
      expect(metrics.lineCount).toBe(2)
      expect(metrics.wordCount).toBe(6)
      expect(metrics.containsCJK).toBe(false)
      expect(metrics.isRomaji).toBe(false)
      expect(metrics.estimatedReadingTime).toBeGreaterThan(0)
    })

    it('should calculate metrics for CJK text', () => {
      const text = 'こんにちは\n世界'
      const metrics = textProcessingUtils.getTextMetrics(text, 'ja')
      
      expect(metrics.characterCount).toBe(7)
      expect(metrics.lineCount).toBe(2)
      expect(metrics.wordCount).toBe(6) // Characters count as words for CJK
      expect(metrics.containsCJK).toBe(true)
      expect(metrics.estimatedReadingTime).toBeGreaterThan(0)
    })

    it('should handle empty text', () => {
      const metrics = textProcessingUtils.getTextMetrics('', 'en')
      
      expect(metrics.characterCount).toBe(0)
      expect(metrics.wordCount).toBe(0)
      expect(metrics.lineCount).toBe(0)
      expect(metrics.containsCJK).toBe(false)
      expect(metrics.isRomaji).toBe(false)
      expect(metrics.estimatedReadingTime).toBe(0)
    })

    it('should detect romaji text', () => {
      const text = 'konnichiwa sekai'
      const metrics = textProcessingUtils.getTextMetrics(text, 'ja-romaji')
      
      expect(metrics.isRomaji).toBe(true)
      expect(metrics.containsCJK).toBe(false)
    })
  })

  describe('sanitizeText', () => {
    it('should remove control characters', () => {
      const text = 'Hello\x00\x01World\x7F'
      const result = textProcessingUtils.sanitizeText(text)
      expect(result).toBe('HelloWorld')
    })

    it('should preserve newlines and tabs', () => {
      const text = 'Hello\nWorld\tTest'
      const result = textProcessingUtils.sanitizeText(text)
      expect(result).toBe('Hello\nWorld\tTest')
    })

    it('should normalize Unicode', () => {
      const text = 'café' // May contain combining characters
      const result = textProcessingUtils.sanitizeText(text)
      expect(result).toBe('café')
    })

    it('should limit line length', () => {
      const longLine = 'a'.repeat(1500)
      const text = `Short line\n${longLine}\nAnother short line`
      const result = textProcessingUtils.sanitizeText(text)
      
      const lines = result.split('\n')
      expect(lines[0]).toBe('Short line')
      expect(lines[1]).toHaveLength(1003) // 1000 + '...'
      expect(lines[1]).toEndWith('...')
      expect(lines[2]).toBe('Another short line')
    })

    it('should handle empty input', () => {
      expect(textProcessingUtils.sanitizeText('')).toBe('')
      expect(textProcessingUtils.sanitizeText(null as any)).toBe('')
    })
  })

  describe('splitIntoSections', () => {
    it('should split text by empty lines', () => {
      const text = 'Verse 1\nLine 2\n\nChorus\nLine 2\n\nVerse 2'
      const sections = textProcessingUtils.splitIntoSections(text)
      
      expect(sections).toHaveLength(3)
      expect(sections[0]).toBe('Verse 1\nLine 2')
      expect(sections[1]).toBe('Chorus\nLine 2')
      expect(sections[2]).toBe('Verse 2')
    })

    it('should handle text without empty lines', () => {
      const text = 'Line 1\nLine 2\nLine 3'
      const sections = textProcessingUtils.splitIntoSections(text)
      
      expect(sections).toHaveLength(1)
      expect(sections[0]).toBe('Line 1\nLine 2\nLine 3')
    })

    it('should filter out empty sections', () => {
      const text = '\n\nVerse 1\n\n\n\nVerse 2\n\n'
      const sections = textProcessingUtils.splitIntoSections(text)
      
      expect(sections).toHaveLength(2)
      expect(sections[0]).toBe('Verse 1')
      expect(sections[1]).toBe('Verse 2')
    })

    it('should handle empty input', () => {
      expect(textProcessingUtils.splitIntoSections('')).toEqual([])
      expect(textProcessingUtils.splitIntoSections(null as any)).toEqual([])
    })
  })

  describe('joinSections', () => {
    it('should join sections with double line breaks', () => {
      const sections = ['Verse 1', 'Chorus', 'Verse 2']
      const result = textProcessingUtils.joinSections(sections)
      expect(result).toBe('Verse 1\n\nChorus\n\nVerse 2')
    })

    it('should filter out empty sections', () => {
      const sections = ['Verse 1', '', '  ', 'Verse 2']
      const result = textProcessingUtils.joinSections(sections)
      expect(result).toBe('Verse 1\n\nVerse 2')
    })

    it('should handle empty array', () => {
      expect(textProcessingUtils.joinSections([])).toBe('')
    })
  })

  describe('extractCommonPatterns', () => {
    it('should detect verse structure', () => {
      const multilingualText: MultilingualText = {
        'en': 'Line 1\nLine 2\nLine 3',
        'ja': 'ライン 1\nライン 2\nライン 3'
      }
      
      const patterns = textProcessingUtils.extractCommonPatterns(multilingualText)
      expect(patterns.verseStructure).toBe(true)
    })

    it('should detect chorus pattern', () => {
      const multilingualText: MultilingualText = {
        'en': 'Verse 1\n\nChorus\n\nVerse 2\n\nChorus'
      }
      
      const patterns = textProcessingUtils.extractCommonPatterns(multilingualText)
      expect(patterns.chorusPattern).toBe(true)
    })

    it('should extract common English words', () => {
      const multilingualText: MultilingualText = {
        'en': 'love love world peace love world'
      }
      
      const patterns = textProcessingUtils.extractCommonPatterns(multilingualText)
      expect(patterns.commonWords).toContain('love')
      expect(patterns.commonWords).toContain('world')
    })
  })

  describe('validateTextForLanguage', () => {
    it('should validate correct text', () => {
      const validation = textProcessingUtils.validateTextForLanguage('Hello world', 'en')
      expect(validation.isValid).toBe(true)
      expect(validation.warnings).toHaveLength(0)
    })

    it('should reject empty text', () => {
      const validation = textProcessingUtils.validateTextForLanguage('', 'en')
      expect(validation.isValid).toBe(false)
      expect(validation.warnings).toContain('Text is empty')
    })

    it('should warn about language mismatch - CJK in romaji', () => {
      const validation = textProcessingUtils.validateTextForLanguage('こんにちは', 'ja-romaji')
      expect(validation.warnings).toContain('Text contains CJK characters but language is set to Romaji')
    })

    it('should warn about language mismatch - Latin in CJK', () => {
      const validation = textProcessingUtils.validateTextForLanguage('konnichiwa', 'ja')
      expect(validation.warnings).toContain('Text appears to be in Latin script but language is set to CJK')
    })

    it('should warn about very long text', () => {
      const longText = 'a'.repeat(10001)
      const validation = textProcessingUtils.validateTextForLanguage(longText, 'en')
      expect(validation.warnings).toContain('Text is very long (over 10,000 characters)')
    })

    it('should warn about long lines', () => {
      const longLine = 'a'.repeat(150)
      const validation = textProcessingUtils.validateTextForLanguage(longLine, 'en')
      expect(validation.warnings).toContain('1 lines are very long (over 100 characters)')
    })
  })

  describe('formatForDisplay', () => {
    const text = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'

    it('should format for preview with line limit', () => {
      const result = textProcessingUtils.formatForDisplay(text, 'preview')
      expect(result).toBe('Line 1\nLine 2\nLine 3\n...')
    })

    it('should format for preview with character limit', () => {
      const longText = 'a'.repeat(50)
      const result = textProcessingUtils.formatForDisplay(longText, 'preview', 20)
      expect(result).toBe('a'.repeat(20) + '...')
    })

    it('should format for editing with preserved formatting', () => {
      const textWithIndent = '  Line 1\n    Line 2'
      const result = textProcessingUtils.formatForDisplay(textWithIndent, 'editing')
      expect(result).toContain('  Line 1')
      expect(result).toContain('    Line 2')
    })

    it('should format for export with normalization', () => {
      const messyText = '  Line 1  \r\n  Line 2  '
      const result = textProcessingUtils.formatForDisplay(messyText, 'export')
      expect(result).toBe('Line 1\nLine 2')
    })

    it('should handle empty input', () => {
      expect(textProcessingUtils.formatForDisplay('', 'preview')).toBe('')
      expect(textProcessingUtils.formatForDisplay(null as any, 'preview')).toBe('')
    })
  })
})