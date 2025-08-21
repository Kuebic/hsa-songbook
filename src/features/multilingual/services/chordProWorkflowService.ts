/**
 * @file chordProWorkflowService.ts
 * @description Service for handling ChordPro creation workflow with multilingual lyrics
 */

import type { Song } from '../../songs/types/song.types';
import type { ArrangementFormData } from '../../songs/validation/schemas/arrangementSchema';
import type { 
  MultilingualText, 
  LanguageCode, 
  LanguageOption 
} from '../types/multilingual.types';
import { multilingualService } from './multilingualService';
import { 
  generateChordProWithLyrics,
  generateMultilingualChordProTemplate,
  generateInitialChordPro
} from '../../songs/utils/chordProGenerator';
import { DEFAULT_LANGUAGE } from '../types/multilingual.types';

/**
 * Interface for workflow configuration
 */
export interface ChordProWorkflowConfig {
  showLanguageModal: boolean;
  autoPopulateLyrics: boolean;
  fallbackLanguage: LanguageCode;
  includeTemplate: boolean;
}

/**
 * Interface for workflow result
 */
export interface ChordProWorkflowResult {
  chordProContent: string;
  selectedLanguage?: LanguageCode;
  hasLyrics: boolean;
  availableLanguages: LanguageCode[];
  workflowStep: 'language-selection' | 'content-generation' | 'completed';
}

/**
 * Interface for language selection result
 */
export interface LanguageSelectionResult {
  selectedLanguage: LanguageCode;
  shouldProceed: boolean;
  cancelled: boolean;
}

/**
 * Interface for arrangement creation context
 */
export interface ArrangementCreationContext {
  song: Song;
  arrangementFormData: Partial<ArrangementFormData>;
  userPreferences?: {
    preferredLanguage?: LanguageCode;
    autoPopulateLyrics?: boolean;
    showLanguageModal?: boolean;
  };
}

/**
 * Default workflow configuration
 */
const DEFAULT_WORKFLOW_CONFIG: ChordProWorkflowConfig = {
  showLanguageModal: true,
  autoPopulateLyrics: true,
  fallbackLanguage: DEFAULT_LANGUAGE,
  includeTemplate: true
};

/**
 * Service for ChordPro workflow with multilingual support
 */
export const chordProWorkflowService = {

  /**
   * Start the ChordPro creation workflow
   */
  async startWorkflow(
    context: ArrangementCreationContext,
    config: Partial<ChordProWorkflowConfig> = {}
  ): Promise<ChordProWorkflowResult> {
    const finalConfig = { ...DEFAULT_WORKFLOW_CONFIG, ...config };
    const { song, userPreferences } = context;
    
    // Get available languages from song lyrics
    const availableLanguages = multilingualService.getAvailableLanguages(song.lyrics || {});
    
    // Determine if we need language selection
    const needsLanguageSelection = this.shouldShowLanguageSelection(
      song.lyrics || {},
      availableLanguages,
      finalConfig,
      userPreferences
    );

    if (needsLanguageSelection) {
      return {
        chordProContent: '',
        hasLyrics: availableLanguages.length > 0,
        availableLanguages,
        workflowStep: 'language-selection'
      };
    }

    // Auto-select language and proceed
    const selectedLanguage = this.determineDefaultLanguage(
      song.lyrics || {},
      availableLanguages,
      userPreferences?.preferredLanguage,
      finalConfig.fallbackLanguage
    );

    return this.generateChordProContent(
      context,
      selectedLanguage,
      finalConfig
    );
  },

  /**
   * Continue workflow after language selection
   */
  async continueWorkflowWithLanguage(
    context: ArrangementCreationContext,
    selectedLanguage: LanguageCode,
    config: Partial<ChordProWorkflowConfig> = {}
  ): Promise<ChordProWorkflowResult> {
    const finalConfig = { ...DEFAULT_WORKFLOW_CONFIG, ...config };
    
    return this.generateChordProContent(context, selectedLanguage, finalConfig);
  },

  /**
   * Generate ChordPro content with selected language
   */
  generateChordProContent(
    context: ArrangementCreationContext,
    selectedLanguage: LanguageCode,
    config: ChordProWorkflowConfig
  ): ChordProWorkflowResult {
    const { song, arrangementFormData } = context;
    const availableLanguages = multilingualService.getAvailableLanguages(song.lyrics || {});
    
    let chordProContent: string;
    
    if (config.autoPopulateLyrics && song.lyrics && availableLanguages.length > 0) {
      // Generate with actual lyrics
      chordProContent = generateChordProWithLyrics(
        arrangementFormData,
        song.title,
        song.lyrics,
        selectedLanguage,
        config.fallbackLanguage
      );
    } else {
      // Generate template without lyrics
      chordProContent = generateInitialChordPro(
        arrangementFormData,
        song.title
      );
    }

    return {
      chordProContent,
      selectedLanguage,
      hasLyrics: multilingualService.hasLanguage(song.lyrics || {}, selectedLanguage),
      availableLanguages,
      workflowStep: 'completed'
    };
  },

  /**
   * Determine if language selection modal should be shown
   */
  shouldShowLanguageSelection(
    _lyrics: MultilingualText,
    availableLanguages: LanguageCode[],
    config: ChordProWorkflowConfig,
    userPreferences?: ArrangementCreationContext['userPreferences']
  ): boolean {
    // Don't show if no lyrics available
    if (availableLanguages.length === 0) {
      return false;
    }

    // Don't show if only one language available
    if (availableLanguages.length === 1) {
      return false;
    }

    // Check user preference override
    if (userPreferences?.showLanguageModal === false) {
      return false;
    }

    // Check config
    if (!config.showLanguageModal) {
      return false;
    }

    return true;
  },

  /**
   * Determine the default language to use
   */
  determineDefaultLanguage(
    _lyrics: MultilingualText,
    availableLanguages: LanguageCode[],
    userPreferredLanguage?: LanguageCode,
    fallbackLanguage: LanguageCode = DEFAULT_LANGUAGE
  ): LanguageCode {
    // Use user's preferred language if available
    if (userPreferredLanguage && availableLanguages.includes(userPreferredLanguage)) {
      return userPreferredLanguage;
    }

    // Use song's original language if available
    if (availableLanguages.length > 0) {
      // Priority order: fallback language, first available, then any
      if (availableLanguages.includes(fallbackLanguage)) {
        return fallbackLanguage;
      }
      return availableLanguages[0];
    }

    return fallbackLanguage;
  },

  /**
   * Get language options for selection
   */
  getLanguageOptionsForSelection(
    lyrics: MultilingualText,
    _currentSelection?: LanguageCode
  ): LanguageOption[] {
    const availableLanguages = multilingualService.getAvailableLanguages(lyrics);
    
    return availableLanguages.map(languageCode => {
      const langInfo = multilingualService.getLanguageDisplayName(languageCode);
      const lyricsText = lyrics[languageCode] || '';
      
      return {
        code: languageCode,
        name: langInfo,
        nativeName: langInfo,
        preview: lyricsText.split('\n').slice(0, 2).join(' ').substring(0, 100),
        hasLyrics: true,
        isRomaji: languageCode.includes('-romaji')
      };
    });
  },

  /**
   * Create preview template showing all available languages
   */
  createMultilingualPreview(
    song: Song,
    arrangementName: string = 'New Arrangement'
  ): string {
    if (!song.lyrics || Object.keys(song.lyrics).length === 0) {
      return generateInitialChordPro({}, song.title);
    }

    const availableLanguages = multilingualService.getAvailableLanguages(song.lyrics);
    
    return generateMultilingualChordProTemplate(
      song.title,
      arrangementName,
      song.lyrics,
      availableLanguages
    );
  },

  /**
   * Update existing ChordPro content with different language
   */
  switchLanguageInChordPro(
    existingContent: string,
    song: Song,
    newLanguage: LanguageCode,
    _arrangementFormData?: Partial<ArrangementFormData>
  ): string {
    if (!song.lyrics || !multilingualService.hasLanguage(song.lyrics, newLanguage)) {
      return existingContent;
    }

    // Extract metadata from existing content
    const metadataLines: string[] = [];
    const contentLines = existingContent.split('\n');
    
    for (const line of contentLines) {
      if (line.startsWith('{') && line.endsWith('}')) {
        // Skip language directive - we'll add new one
        if (!line.startsWith('{language:')) {
          metadataLines.push(line);
        }
      } else {
        break; // Stop at first non-metadata line
      }
    }

    // Add language directive
    if (newLanguage !== DEFAULT_LANGUAGE) {
      metadataLines.push(`{language: ${newLanguage}}`);
    }

    // Get new lyrics content
    const lyricsContent = multilingualService.getText(song.lyrics, newLanguage);
    
    // Generate new content structure
    const newContent = [
      ...metadataLines,
      '',
      ...lyricsContent.split('\n').filter(line => line.trim())
    ].join('\n');

    return newContent;
  },

  /**
   * Validate workflow prerequisites
   */
  validateWorkflowPrerequisites(context: ArrangementCreationContext): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!context.song) {
      errors.push('Song is required for arrangement creation');
    }

    if (!context.song?.title) {
      errors.push('Song title is required');
    }

    if (!context.arrangementFormData?.name) {
      warnings.push('Arrangement name is recommended');
    }

    if (!context.song?.lyrics || Object.keys(context.song.lyrics).length === 0) {
      warnings.push('No lyrics available - template will be generated without lyrics');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  /**
   * Get workflow recommendations based on song content
   */
  getWorkflowRecommendations(song: Song): {
    recommendLanguageSelection: boolean;
    recommendAutoPopulate: boolean;
    preferredLanguage?: LanguageCode;
    reasons: string[];
  } {
    const reasons: string[] = [];
    const availableLanguages = multilingualService.getAvailableLanguages(song.lyrics || {});
    
    const recommendLanguageSelection = availableLanguages.length > 1;
    if (recommendLanguageSelection) {
      reasons.push(`Song has lyrics in ${availableLanguages.length} languages`);
    }

    const recommendAutoPopulate = availableLanguages.length > 0;
    if (recommendAutoPopulate) {
      reasons.push('Lyrics are available and can be automatically populated');
    }

    // Prefer original language or default
    let preferredLanguage: LanguageCode | undefined;
    if (song.originalLanguage && availableLanguages.includes(song.originalLanguage)) {
      preferredLanguage = song.originalLanguage;
      reasons.push(`Using original language: ${song.originalLanguage}`);
    } else if (availableLanguages.includes(DEFAULT_LANGUAGE)) {
      preferredLanguage = DEFAULT_LANGUAGE;
    } else if (availableLanguages.length > 0) {
      preferredLanguage = availableLanguages[0];
    }

    return {
      recommendLanguageSelection,
      recommendAutoPopulate,
      preferredLanguage,
      reasons
    };
  }
};