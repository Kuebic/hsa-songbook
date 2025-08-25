import { describe, it, expect, vi } from 'vitest'
import { chordProWorkflowService } from '../chordProWorkflowService'
import type { ArrangementCreationContext, ChordProWorkflowConfig } from '../chordProWorkflowService'
import type { Song } from '../../../songs/types/song.types'
import type { MultilingualText } from '../../types/multilingual.types'

// Mock the dependencies
vi.mock('../multilingualService', () => ({
  multilingualService: {
    getAvailableLanguages: vi.fn(),
    hasLanguage: vi.fn(),
    getText: vi.fn(),
    getLanguageDisplayName: vi.fn()
  }
}))

vi.mock('../../../songs/utils/chordProGenerator', () => ({
  generateChordProWithLyrics: vi.fn(),
  generateMultilingualChordProTemplate: vi.fn(),
  generateInitialChordPro: vi.fn()
}))

import { multilingualService } from '../multilingualService'
import { 
  generateChordProWithLyrics,
  generateMultilingualChordProTemplate,
  generateInitialChordPro
} from '../../../songs/utils/chordProGenerator'

describe('chordProWorkflowService', () => {
  const mockSong: Song = {
    id: 'song-1',
    title: 'Test Song',
    artist: 'Test Artist',
    slug: 'test-song',
    themes: [],
    lyrics: {
      'en': 'Hello world',
      'ja': 'こんにちは世界',
      'ja-romaji': 'konnichiwa sekai'
    },
    originalLanguage: 'en',
    lyricsVerified: false,
    lyricsSource: 'user',
    autoConversionEnabled: false,
    metadata: {
      isPublic: true,
      ratings: { average: 0, count: 0 },
      views: 0
    }
  }

  const mockContext: ArrangementCreationContext = {
    song: mockSong,
    arrangementFormData: {
      name: 'Test Arrangement',
      key: 'C',
      tempo: 120
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('startWorkflow', () => {
    it('should trigger language selection when multiple languages available', async () => {
      const mockGetAvailableLanguages = vi.mocked(multilingualService.getAvailableLanguages)
      mockGetAvailableLanguages.mockReturnValue(['en', 'ja', 'ja-romaji'])

      const result = await chordProWorkflowService.startWorkflow(mockContext)

      expect(result.workflowStep).toBe('language-selection')
      expect(result.availableLanguages).toEqual(['en', 'ja', 'ja-romaji'])
      expect(result.hasLyrics).toBe(true)
      expect(result.chordProContent).toBe('')
    })

    it('should auto-proceed when only one language available', async () => {
      const mockGetAvailableLanguages = vi.mocked(multilingualService.getAvailableLanguages)
      mockGetAvailableLanguages.mockReturnValue(['en'])
      
      const mockGenerateChordPro = vi.mocked(generateChordProWithLyrics)
      mockGenerateChordPro.mockReturnValue('Generated ChordPro content')

      const result = await chordProWorkflowService.startWorkflow(mockContext)

      expect(result.workflowStep).toBe('completed')
      expect(result.selectedLanguage).toBe('en')
      expect(result.chordProContent).toBe('Generated ChordPro content')
    })

    it('should respect user preferences to skip language selection', async () => {
      const mockGetAvailableLanguages = vi.mocked(multilingualService.getAvailableLanguages)
      mockGetAvailableLanguages.mockReturnValue(['en', 'ja'])

      const contextWithPrefs: ArrangementCreationContext = {
        ...mockContext,
        userPreferences: {
          showLanguageModal: false,
          preferredLanguage: 'ja'
        }
      }

      const mockGenerateChordPro = vi.mocked(generateChordProWithLyrics)
      mockGenerateChordPro.mockReturnValue('Japanese ChordPro content')

      const result = await chordProWorkflowService.startWorkflow(contextWithPrefs)

      expect(result.workflowStep).toBe('completed')
      expect(result.selectedLanguage).toBe('ja')
    })

    it('should handle empty lyrics', async () => {
      const mockGetAvailableLanguages = vi.mocked(multilingualService.getAvailableLanguages)
      mockGetAvailableLanguages.mockReturnValue([])

      const mockHasLanguage = vi.mocked(multilingualService.hasLanguage)
      mockHasLanguage.mockReturnValue(false)

      const contextWithoutLyrics: ArrangementCreationContext = {
        ...mockContext,
        song: { ...mockSong, lyrics: {} }
      }

      const mockGenerateInitial = vi.mocked(generateInitialChordPro)
      mockGenerateInitial.mockReturnValue('Empty template')

      const result = await chordProWorkflowService.startWorkflow(contextWithoutLyrics)

      expect(result.workflowStep).toBe('completed')
      expect(result.hasLyrics).toBe(false)
      expect(result.chordProContent).toBe('Empty template')
      expect(result.availableLanguages).toEqual([])
    })
  })

  describe('continueWorkflowWithLanguage', () => {
    it('should generate ChordPro content with selected language', async () => {
      const mockGetAvailableLanguages = vi.mocked(multilingualService.getAvailableLanguages)
      mockGetAvailableLanguages.mockReturnValue(['en', 'ja', 'ja-romaji'])

      const mockGenerateChordPro = vi.mocked(generateChordProWithLyrics)
      mockGenerateChordPro.mockReturnValue('Generated content for Japanese')

      const mockHasLanguage = vi.mocked(multilingualService.hasLanguage)
      mockHasLanguage.mockReturnValue(true)

      const result = await chordProWorkflowService.continueWorkflowWithLanguage(
        mockContext,
        'ja'
      )

      expect(result.workflowStep).toBe('completed')
      expect(result.selectedLanguage).toBe('ja')
      expect(result.chordProContent).toBe('Generated content for Japanese')
      expect(mockGenerateChordPro).toHaveBeenCalledWith(
        mockContext.arrangementFormData,
        mockSong.title,
        mockSong.lyrics,
        'ja',
        'en'
      )
    })
  })

  describe('shouldShowLanguageSelection', () => {
    const defaultConfig: ChordProWorkflowConfig = {
      showLanguageModal: true,
      autoPopulateLyrics: true,
      fallbackLanguage: 'en',
      includeTemplate: true
    }

    it('should return false when no lyrics available', () => {
      const result = chordProWorkflowService.shouldShowLanguageSelection(
        {},
        [],
        defaultConfig
      )
      expect(result).toBe(false)
    })

    it('should return false when only one language available', () => {
      const result = chordProWorkflowService.shouldShowLanguageSelection(
        { en: 'Hello' },
        ['en'],
        defaultConfig
      )
      expect(result).toBe(false)
    })

    it('should return true when multiple languages available', () => {
      const result = chordProWorkflowService.shouldShowLanguageSelection(
        { en: 'Hello', ja: 'こんにちは' },
        ['en', 'ja'],
        defaultConfig
      )
      expect(result).toBe(true)
    })

    it('should respect user preference override', () => {
      const result = chordProWorkflowService.shouldShowLanguageSelection(
        { en: 'Hello', ja: 'こんにちは' },
        ['en', 'ja'],
        defaultConfig,
        { showLanguageModal: false }
      )
      expect(result).toBe(false)
    })

    it('should respect config setting', () => {
      const configNoModal = { ...defaultConfig, showLanguageModal: false }
      const result = chordProWorkflowService.shouldShowLanguageSelection(
        { en: 'Hello', ja: 'こんにちは' },
        ['en', 'ja'],
        configNoModal
      )
      expect(result).toBe(false)
    })
  })

  describe('determineDefaultLanguage', () => {
    it('should use user preferred language if available', () => {
      const result = chordProWorkflowService.determineDefaultLanguage(
        { en: 'Hello', ja: 'こんにちは' },
        ['en', 'ja'],
        'ja'
      )
      expect(result).toBe('ja')
    })

    it('should use fallback language if available', () => {
      const result = chordProWorkflowService.determineDefaultLanguage(
        { en: 'Hello', ja: 'こんにちは' },
        ['en', 'ja'],
        'ko', // preferred not available
        'en'  // fallback
      )
      expect(result).toBe('en')
    })

    it('should use first available language if fallback not available', () => {
      const result = chordProWorkflowService.determineDefaultLanguage(
        { ja: 'こんにちは', ko: '안녕하세요' },
        ['ja', 'ko'],
        'zh', // preferred not available
        'en'  // fallback not available
      )
      expect(result).toBe('ja')
    })

    it('should return fallback when no languages available', () => {
      const result = chordProWorkflowService.determineDefaultLanguage(
        {},
        [],
        'ja',
        'en'
      )
      expect(result).toBe('en')
    })
  })

  describe('getLanguageOptionsForSelection', () => {
    it('should return language options with display names and previews', () => {
      const mockGetAvailableLanguages = vi.mocked(multilingualService.getAvailableLanguages)
      mockGetAvailableLanguages.mockReturnValue(['en', 'ja'])

      const mockGetLanguageDisplayName = vi.mocked(multilingualService.getLanguageDisplayName)
      mockGetLanguageDisplayName.mockImplementation((code) => {
        const names = { 'en': 'English', 'ja': 'Japanese' }
        return names[code as keyof typeof names] || code
      })

      const lyrics: MultilingualText = {
        'en': 'Hello world\nThis is a test',
        'ja': 'こんにちは世界\nこれはテストです'
      }

      const result = chordProWorkflowService.getLanguageOptionsForSelection(lyrics)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        code: 'en',
        name: 'English',
        nativeName: 'English',
        preview: 'Hello world This is a test',
        hasLyrics: true,
        isRomaji: false
      })
      expect(result[1]).toEqual({
        code: 'ja',
        name: 'Japanese',
        nativeName: 'Japanese',
        preview: 'こんにちは世界 これはテストです',
        hasLyrics: true,
        isRomaji: false
      })
    })

    it('should truncate long previews', () => {
      const mockGetAvailableLanguages = vi.mocked(multilingualService.getAvailableLanguages)
      mockGetAvailableLanguages.mockReturnValue(['en'])

      const mockGetLanguageDisplayName = vi.mocked(multilingualService.getLanguageDisplayName)
      mockGetLanguageDisplayName.mockReturnValue('English')

      const longText = 'a'.repeat(150)
      const lyrics: MultilingualText = { 'en': longText }

      const result = chordProWorkflowService.getLanguageOptionsForSelection(lyrics)

      expect(result[0].preview).toHaveLength(100)
      expect(result[0].preview).toBe('a'.repeat(100))
    })
  })

  describe('createMultilingualPreview', () => {
    it('should create preview for song with lyrics', () => {
      const mockGetAvailableLanguages = vi.mocked(multilingualService.getAvailableLanguages)
      mockGetAvailableLanguages.mockReturnValue(['en', 'ja'])

      const mockGenerateTemplate = vi.mocked(generateMultilingualChordProTemplate)
      mockGenerateTemplate.mockReturnValue('Multilingual template')

      const result = chordProWorkflowService.createMultilingualPreview(mockSong)

      expect(result).toBe('Multilingual template')
      expect(mockGenerateTemplate).toHaveBeenCalledWith(
        mockSong.title,
        'New Arrangement',
        mockSong.lyrics,
        ['en', 'ja']
      )
    })

    it('should create basic template for song without lyrics', () => {
      const mockGetAvailableLanguages = vi.mocked(multilingualService.getAvailableLanguages)
      mockGetAvailableLanguages.mockReturnValue([])

      const mockGenerateInitial = vi.mocked(generateInitialChordPro)
      mockGenerateInitial.mockReturnValue('Basic template')

      const songWithoutLyrics = { ...mockSong, lyrics: {} }
      const result = chordProWorkflowService.createMultilingualPreview(songWithoutLyrics)

      expect(result).toBe('Basic template')
    })
  })

  describe('switchLanguageInChordPro', () => {
    it('should switch language in existing ChordPro content', () => {
      const mockHasLanguage = vi.mocked(multilingualService.hasLanguage)
      mockHasLanguage.mockReturnValue(true)

      const mockGetText = vi.mocked(multilingualService.getText)
      mockGetText.mockReturnValue('こんにちは世界')

      const existingContent = '{title: Test Song}\n{artist: Test Artist}\n{language: en}\n\nHello world'
      
      const result = chordProWorkflowService.switchLanguageInChordPro(
        existingContent,
        mockSong,
        'ja'
      )

      expect(result).toContain('{language: ja}')
      expect(result).toContain('こんにちは世界')
      expect(result).not.toContain('Hello world')
    })

    it('should preserve other metadata', () => {
      const mockHasLanguage = vi.mocked(multilingualService.hasLanguage)
      mockHasLanguage.mockReturnValue(true)

      const mockGetText = vi.mocked(multilingualService.getText)
      mockGetText.mockReturnValue('こんにちは世界')

      const existingContent = '{title: Test Song}\n{artist: Test Artist}\n{key: C}\n\nHello world'
      
      const result = chordProWorkflowService.switchLanguageInChordPro(
        existingContent,
        mockSong,
        'ja'
      )

      expect(result).toContain('{title: Test Song}')
      expect(result).toContain('{artist: Test Artist}')
      expect(result).toContain('{key: C}')
    })

    it('should return original content if language not available', () => {
      const mockHasLanguage = vi.mocked(multilingualService.hasLanguage)
      mockHasLanguage.mockReturnValue(false)

      const existingContent = '{title: Test Song}\n\nHello world'
      
      const result = chordProWorkflowService.switchLanguageInChordPro(
        existingContent,
        mockSong,
        'ko'
      )

      expect(result).toBe(existingContent)
    })
  })

  describe('validateWorkflowPrerequisites', () => {
    it('should validate correct context', () => {
      const result = chordProWorkflowService.validateWorkflowPrerequisites(mockContext)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should require song', () => {
      const invalidContext = { ...mockContext, song: null as unknown as Song }
      const result = chordProWorkflowService.validateWorkflowPrerequisites(invalidContext)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Song is required for arrangement creation')
    })

    it('should require song title', () => {
      const invalidContext = {
        ...mockContext,
        song: { ...mockSong, title: '' }
      }
      const result = chordProWorkflowService.validateWorkflowPrerequisites(invalidContext)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Song title is required')
    })

    it('should warn about missing arrangement name', () => {
      const contextWithoutName = {
        ...mockContext,
        arrangementFormData: { ...mockContext.arrangementFormData, name: undefined }
      }
      const result = chordProWorkflowService.validateWorkflowPrerequisites(contextWithoutName)
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Arrangement name is recommended')
    })

    it('should warn about missing lyrics', () => {
      const contextWithoutLyrics = {
        ...mockContext,
        song: { ...mockSong, lyrics: {} }
      }
      const result = chordProWorkflowService.validateWorkflowPrerequisites(contextWithoutLyrics)
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('No lyrics available - template will be generated without lyrics')
    })
  })

  describe('getWorkflowRecommendations', () => {
    it('should recommend language selection for multilingual songs', () => {
      const mockGetAvailableLanguages = vi.mocked(multilingualService.getAvailableLanguages)
      mockGetAvailableLanguages.mockReturnValue(['en', 'ja', 'ja-romaji'])

      const recommendations = chordProWorkflowService.getWorkflowRecommendations(mockSong)

      expect(recommendations.recommendLanguageSelection).toBe(true)
      expect(recommendations.recommendAutoPopulate).toBe(true)
      expect(recommendations.preferredLanguage).toBe('en')
      expect(recommendations.reasons).toContain('Song has lyrics in 3 languages')
      expect(recommendations.reasons).toContain('Using original language: en')
    })

    it('should not recommend language selection for single language', () => {
      const mockGetAvailableLanguages = vi.mocked(multilingualService.getAvailableLanguages)
      mockGetAvailableLanguages.mockReturnValue(['en'])

      const recommendations = chordProWorkflowService.getWorkflowRecommendations(mockSong)

      expect(recommendations.recommendLanguageSelection).toBe(false)
      expect(recommendations.recommendAutoPopulate).toBe(true)
    })

    it('should handle songs without lyrics', () => {
      const mockGetAvailableLanguages = vi.mocked(multilingualService.getAvailableLanguages)
      mockGetAvailableLanguages.mockReturnValue([])

      const songWithoutLyrics = { ...mockSong, lyrics: {} }
      const recommendations = chordProWorkflowService.getWorkflowRecommendations(songWithoutLyrics)

      expect(recommendations.recommendLanguageSelection).toBe(false)
      expect(recommendations.recommendAutoPopulate).toBe(false)
      expect(recommendations.preferredLanguage).toBeUndefined()
    })
  })
})