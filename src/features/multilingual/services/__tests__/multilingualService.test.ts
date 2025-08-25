import { describe, it, expect } from 'vitest'
import { multilingualService } from '../multilingualService'
import type { MultilingualText, LanguageCode } from '../../types/multilingual.types'

describe('multilingualService', () => {
  describe('getText', () => {
    const testText: MultilingualText = {
      'en': 'Hello world',
      'ja': 'こんにちは世界',
      'ko': '안녕하세요 세계',
      'ja-romaji': 'konnichiwa sekai'
    }

    it('should return text in preferred language', () => {
      expect(multilingualService.getText(testText, 'ja')).toBe('こんにちは世界')
      expect(multilingualService.getText(testText, 'en')).toBe('Hello world')
    })

    it('should fallback to default language when preferred not available', () => {
      const limitedText: MultilingualText = { 'ja': 'こんにちは' }
      expect(multilingualService.getText(limitedText, 'ko', 'ja')).toBe('こんにちは')
    })

    it('should fallback to any available language in priority order', () => {
      const koreanOnly: MultilingualText = { 'ko': '안녕하세요' }
      expect(multilingualService.getText(koreanOnly, 'en')).toBe('안녕하세요')
    })

    it('should return empty string for invalid input', () => {
      expect(multilingualService.getText({}, 'en')).toBe('')
      expect(multilingualService.getText(null as unknown as MultilingualText, 'en')).toBe('')
      expect(multilingualService.getText(undefined as unknown as MultilingualText, 'en')).toBe('')
    })

    it('should handle empty/whitespace-only text values', () => {
      const textWithEmpty: MultilingualText = {
        'en': '',
        'ja': '   ',
        'ko': '안녕하세요'
      }
      expect(multilingualService.getText(textWithEmpty, 'en')).toBe('안녕하세요')
    })
  })

  describe('getAvailableLanguages', () => {
    it('should return available languages in priority order', () => {
      const text: MultilingualText = {
        'ko': '안녕하세요',
        'en': 'Hello',
        'ja': 'こんにちは',
        'ja-romaji': 'konnichiwa'
      }
      const result = multilingualService.getAvailableLanguages(text)
      expect(result).toEqual(['en', 'ja', 'ko', 'ja-romaji'])
    })

    it('should filter out empty values', () => {
      const text: MultilingualText = {
        'en': 'Hello',
        'ja': '',
        'ko': '   ',
        'ja-romaji': 'konnichiwa'
      }
      const result = multilingualService.getAvailableLanguages(text)
      expect(result).toEqual(['en', 'ja-romaji'])
    })

    it('should return empty array for invalid input', () => {
      expect(multilingualService.getAvailableLanguages({})).toEqual([])
      expect(multilingualService.getAvailableLanguages(null as unknown as MultilingualText)).toEqual([])
    })
  })

  describe('hasLanguage', () => {
    const text: MultilingualText = {
      'en': 'Hello',
      'ja': '',
      'ko': '   '
    }

    it('should return true for languages with content', () => {
      expect(multilingualService.hasLanguage(text, 'en')).toBe(true)
    })

    it('should return false for empty/whitespace content', () => {
      expect(multilingualService.hasLanguage(text, 'ja')).toBe(false)
      expect(multilingualService.hasLanguage(text, 'ko')).toBe(false)
    })

    it('should return false for non-existent languages', () => {
      expect(multilingualService.hasLanguage(text, 'ko-romaji')).toBe(false)
    })

    it('should handle invalid input', () => {
      expect(multilingualService.hasLanguage(null as unknown as MultilingualText, 'en')).toBe(false)
      expect(multilingualService.hasLanguage(undefined as unknown as MultilingualText, 'en')).toBe(false)
    })
  })

  describe('isMultilingual', () => {
    it('should return true for multiple languages', () => {
      const text: MultilingualText = {
        'en': 'Hello',
        'ja': 'こんにちは'
      }
      expect(multilingualService.isMultilingual(text)).toBe(true)
    })

    it('should return false for single language', () => {
      const text: MultilingualText = { 'en': 'Hello' }
      expect(multilingualService.isMultilingual(text)).toBe(false)
    })

    it('should return false for empty text', () => {
      expect(multilingualService.isMultilingual({})).toBe(false)
    })
  })

  describe('setText', () => {
    it('should add text to multilingual object', () => {
      const text: MultilingualText = { 'en': 'Hello' }
      const result = multilingualService.setText(text, 'ja', 'こんにちは')
      expect(result).toEqual({
        'en': 'Hello',
        'ja': 'こんにちは'
      })
    })

    it('should update existing text', () => {
      const text: MultilingualText = { 'en': 'Hello' }
      const result = multilingualService.setText(text, 'en', 'Hi there')
      expect(result).toEqual({ 'en': 'Hi there' })
    })

    it('should trim whitespace', () => {
      const text: MultilingualText = {}
      const result = multilingualService.setText(text, 'en', '  Hello  ')
      expect(result).toEqual({ 'en': 'Hello' })
    })

    it('should throw error for invalid language code', () => {
      const text: MultilingualText = {}
      expect(() => {
        multilingualService.setText(text, 'invalid' as LanguageCode, 'text')
      }).toThrow('Invalid language code: invalid')
    })
  })

  describe('removeText', () => {
    it('should remove language from multilingual text', () => {
      const text: MultilingualText = {
        'en': 'Hello',
        'ja': 'こんにちは'
      }
      const result = multilingualService.removeText(text, 'ja')
      expect(result).toEqual({ 'en': 'Hello' })
    })

    it('should handle removing non-existent language', () => {
      const text: MultilingualText = { 'en': 'Hello' }
      const result = multilingualService.removeText(text, 'ja')
      expect(result).toEqual({ 'en': 'Hello' })
    })
  })

  describe('cleanupText', () => {
    it('should remove empty entries and invalid language codes', () => {
      const text: MultilingualText = {
        'en': 'Hello',
        'ja': '',
        'ko': '   ',
        'ja-romaji': 'konnichiwa',
        'invalid': 'should be removed'
      } as Record<string, string>

      const result = multilingualService.cleanupText(text)
      expect(result).toEqual({
        'en': 'Hello',
        'ja-romaji': 'konnichiwa'
      })
    })

    it('should trim values', () => {
      const text: MultilingualText = {
        'en': '  Hello  ',
        'ja': '  こんにちは  '
      }
      const result = multilingualService.cleanupText(text)
      expect(result).toEqual({
        'en': 'Hello',
        'ja': 'こんにちは'
      })
    })
  })

  describe('detectLanguage', () => {
    it('should detect English', () => {
      const result = multilingualService.detectLanguage('Hello world')
      expect(result.detectedCode).toBe('en')
      expect(result.confidence).toBeGreaterThan(0.5)
      expect(result.containsCJK).toBe(false)
    })

    it('should detect Japanese with CJK characters', () => {
      const result = multilingualService.detectLanguage('こんにちは世界')
      expect(result.detectedCode).toBe('ja')
      expect(result.confidence).toBeGreaterThan(0.8)
      expect(result.containsCJK).toBe(true)
    })

    it('should detect Korean', () => {
      const result = multilingualService.detectLanguage('안녕하세요 세계')
      expect(result.detectedCode).toBe('ko')
      expect(result.confidence).toBeGreaterThan(0.8)
      expect(result.containsCJK).toBe(true)
    })

    it('should detect Japanese Romaji', () => {
      const result = multilingualService.detectLanguage('konnichiwa sekai desu')
      expect(result.detectedCode).toBe('ja-romaji')
      expect(result.isLikelyRomaji).toBe(true)
      expect(result.containsCJK).toBe(false)
    })

    it('should handle empty text', () => {
      const result = multilingualService.detectLanguage('')
      expect(result.detectedCode).toBe('en')
      expect(result.confidence).toBe(0)
    })
  })

  describe('suggestLanguageForContent', () => {
    it('should suggest detected language if not present', () => {
      const result = multilingualService.suggestLanguageForContent(
        'こんにちは',
        ['en']
      )
      expect(result).toBe('ja')
    })

    it('should suggest complementary romaji for existing native', () => {
      const result = multilingualService.suggestLanguageForContent(
        'konnichiwa',
        ['ja']
      )
      expect(result).toBe('ja-romaji')
    })

    it('should fallback to missing default languages', () => {
      const result = multilingualService.suggestLanguageForContent(
        'some text',
        ['ko']
      )
      expect(result).toBe('en')
    })
  })

  describe('generateLanguageStats', () => {
    it('should generate statistics for multilingual texts', () => {
      const texts: MultilingualText[] = [
        { 'en': 'Hello', 'ja': 'こんにちは' },
        { 'en': 'World', 'ko': '세계' },
        { 'ja': 'さようなら' }
      ]

      const stats = multilingualService.generateLanguageStats(texts)
      expect(stats.totalSongs).toBe(3)
      expect(stats.songsWithMultipleLanguages).toBe(2)
      expect(stats.languageCounts.en).toBe(2)
      expect(stats.languageCounts.ja).toBe(2)
      expect(stats.languageCounts.ko).toBe(1)
      expect(stats.mostPopularLanguage).toBe('en') // or 'ja' depending on iteration order
    })
  })

  describe('migrateLegacyNotes', () => {
    it('should convert notes to multilingual format', () => {
      const result = multilingualService.migrateLegacyNotes('Hello world', 'en')
      expect(result).toEqual({ 'en': 'Hello world' })
    })

    it('should handle empty notes', () => {
      const result = multilingualService.migrateLegacyNotes('', 'en')
      expect(result).toEqual({})
    })
  })

  describe('mergeTexts', () => {
    it('should merge two multilingual texts', () => {
      const text1: MultilingualText = { 'en': 'Hello' }
      const text2: MultilingualText = { 'ja': 'こんにちは' }
      
      const result = multilingualService.mergeTexts(text1, text2)
      expect(result).toEqual({
        'en': 'Hello',
        'ja': 'こんにちは'
      })
    })

    it('should handle conflicts with prefer-second strategy', () => {
      const text1: MultilingualText = { 'en': 'Hello' }
      const text2: MultilingualText = { 'en': 'Hi' }
      
      const result = multilingualService.mergeTexts(text1, text2, 'prefer-second')
      expect(result).toEqual({ 'en': 'Hi' })
    })

    it('should handle conflicts with prefer-first strategy', () => {
      const text1: MultilingualText = { 'en': 'Hello' }
      const text2: MultilingualText = { 'en': 'Hi' }
      
      const result = multilingualService.mergeTexts(text1, text2, 'prefer-first')
      expect(result).toEqual({ 'en': 'Hello' })
    })

    it('should handle merge strategy', () => {
      const text1: MultilingualText = { 'en': 'Hello' }
      const text2: MultilingualText = { 'en': 'World' }
      
      const result = multilingualService.mergeTexts(text1, text2, 'merge')
      expect(result).toEqual({ 'en': 'Hello\n\n---\n\nWorld' })
    })
  })

  describe('getLanguageDisplayName', () => {
    it('should return display name for language', () => {
      expect(multilingualService.getLanguageDisplayName('en')).toBe('English')
      expect(multilingualService.getLanguageDisplayName('ja')).toBe('Japanese (日本語)')
      expect(multilingualService.getLanguageDisplayName('ja-romaji')).toBe('Japanese (Romaji)')
    })

    it('should handle showNative option', () => {
      expect(multilingualService.getLanguageDisplayName('ja', false)).toBe('Japanese')
      expect(multilingualService.getLanguageDisplayName('ja', true)).toBe('Japanese (日本語)')
    })
  })

  describe('validateMultilingualText', () => {
    it('should validate correct multilingual text', () => {
      const text: MultilingualText = {
        'en': 'Hello',
        'ja': 'こんにちは'
      }
      const result = multilingualService.validateMultilingualText(text)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid structure', () => {
      const result = multilingualService.validateMultilingualText(null as unknown as MultilingualText)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid multilingual text structure')
    })

    it('should reject invalid language codes', () => {
      const text = { 'invalid': 'text' } as Record<string, string>
      const result = multilingualService.validateMultilingualText(text as MultilingualText)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid language code: invalid')
    })

    it('should reject non-string content', () => {
      const text = { 'en': 123 } as Record<string, unknown>
      const result = multilingualService.validateMultilingualText(text as MultilingualText)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Content for language en must be a string')
    })

    it('should reject content that is too long', () => {
      const longText = 'a'.repeat(10001)
      const text: MultilingualText = { 'en': longText }
      const result = multilingualService.validateMultilingualText(text)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Content for language en exceeds maximum length (10000 characters)')
    })
  })
})