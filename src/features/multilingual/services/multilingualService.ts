/**
 * @file multilingualService.ts
 * @description Service for multilingual text operations and language detection
 */

import type { 
  MultilingualText, 
  LanguageCode, 
  LanguageDetectionResult,
  LanguageStats
} from '../types/multilingual.types';
import { 
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE, 
  FALLBACK_LANGUAGE,
  isValidLanguageCode,
  getNativeLanguageCode,
  getRomajiLanguageCode,
  getLanguageInfo
} from '../types/multilingual.types';

/**
 * Service for multilingual text operations
 */
export const multilingualService = {
  
  /**
   * Get text in specified language with intelligent fallback
   */
  getText(
    multilingualText: MultilingualText, 
    preferredLanguage: LanguageCode = DEFAULT_LANGUAGE,
    fallbackLanguage: LanguageCode = FALLBACK_LANGUAGE
  ): string {
    if (!multilingualText || typeof multilingualText !== 'object') {
      return '';
    }

    // Try preferred language first
    if (multilingualText[preferredLanguage]?.trim()) {
      return multilingualText[preferredLanguage];
    }

    // Try fallback language
    if (multilingualText[fallbackLanguage]?.trim()) {
      return multilingualText[fallbackLanguage];
    }

    // Try any available language in priority order
    const priorityOrder: LanguageCode[] = ['en', 'ja', 'ko', 'ja-romaji', 'ko-romaji'];
    for (const langCode of priorityOrder) {
      if (multilingualText[langCode]?.trim()) {
        return multilingualText[langCode];
      }
    }

    // Try any available language
    const availableKeys = Object.keys(multilingualText);
    for (const key of availableKeys) {
      if (multilingualText[key]?.trim()) {
        return multilingualText[key];
      }
    }

    return '';
  },

  /**
   * Get available languages in multilingual text
   */
  getAvailableLanguages(multilingualText: MultilingualText): LanguageCode[] {
    if (!multilingualText || typeof multilingualText !== 'object') {
      return [];
    }

    return Object.keys(multilingualText)
      .filter((key): key is LanguageCode => {
        return isValidLanguageCode(key) && multilingualText[key]?.trim() !== '';
      })
      .sort((a, b) => {
        // Sort by language priority: en, ja, ko, then romaji variants
        const priorityMap: Record<string, number> = {
          'en': 1, 'ja': 2, 'ko': 3, 'ja-romaji': 4, 'ko-romaji': 5
        };
        return (priorityMap[a] || 99) - (priorityMap[b] || 99);
      });
  },

  /**
   * Check if text has content in specific language
   */
  hasLanguage(multilingualText: MultilingualText, language: LanguageCode): boolean {
    return Boolean(multilingualText?.[language]?.trim());
  },

  /**
   * Check if multilingual text has multiple languages
   */
  isMultilingual(multilingualText: MultilingualText): boolean {
    const availableLanguages = this.getAvailableLanguages(multilingualText);
    return availableLanguages.length > 1;
  },

  /**
   * Add or update text in specific language
   */
  setText(
    multilingualText: MultilingualText, 
    language: LanguageCode, 
    text: string
  ): MultilingualText {
    if (!isValidLanguageCode(language)) {
      throw new Error(`Invalid language code: ${language}`);
    }

    return {
      ...multilingualText,
      [language]: text.trim()
    };
  },

  /**
   * Remove text in specific language
   */
  removeText(multilingualText: MultilingualText, language: LanguageCode): MultilingualText {
    const newText = { ...multilingualText };
    delete newText[language];
    return newText;
  },

  /**
   * Clean up multilingual text by removing empty entries
   */
  cleanupText(multilingualText: MultilingualText): MultilingualText {
    const cleaned: MultilingualText = {};
    
    for (const [language, text] of Object.entries(multilingualText)) {
      if (isValidLanguageCode(language) && text?.trim()) {
        cleaned[language] = text.trim();
      }
    }
    
    return cleaned;
  },

  /**
   * Detect primary language of text content
   */
  detectLanguage(text: string): LanguageDetectionResult {
    if (!text?.trim()) {
      return {
        detectedCode: DEFAULT_LANGUAGE,
        confidence: 0,
        containsCJK: false,
        isLikelyRomaji: false
      };
    }

    const content = text.trim();
    
    // Check for CJK characters (Chinese, Japanese, Korean)
    const cjkRegex = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/;
    const containsCJK = cjkRegex.test(content);
    
    // Japanese-specific characters (Hiragana, Katakana)
    const hiraganaRegex = /[\u3040-\u309F]/;
    const katakanaRegex = /[\u30A0-\u30FF]/;
    const hasHiragana = hiraganaRegex.test(content);
    const hasKatakana = katakanaRegex.test(content);
    
    // Korean-specific characters (Hangul)
    const hangulRegex = /[\uAC00-\uD7AF]/;
    const hasHangul = hangulRegex.test(content);
    
    // English alphabet
    const englishRegex = /[a-zA-Z]/;
    const hasEnglish = englishRegex.test(content);
    
    // Romaji detection heuristics
    const romajiPatterns = [
      /\b(wa|wo|ga|na|ni|ka|sa|ta|ma|ya|ra|de|su|desu|arigato|konnichiwa)\b/gi, // Japanese common words in romaji
      /\b(annyeong|saranghae|kamsahamnida|jeongmal|uri|naneun)\b/gi, // Korean common words in romaji
      /[aiueo]{2,}/gi, // Multiple vowels common in romaji
    ];
    
    const isLikelyRomaji = !containsCJK && hasEnglish && 
                          romajiPatterns.some(pattern => pattern.test(content));

    let detectedCode: LanguageCode;
    let confidence: number;

    if (containsCJK) {
      if (hasHiragana || hasKatakana) {
        detectedCode = 'ja';
        confidence = 0.9;
      } else if (hasHangul) {
        detectedCode = 'ko';
        confidence = 0.9;
      } else {
        // Contains CJK but unclear which - could be Chinese or mixed
        detectedCode = 'ja'; // Default to Japanese for now
        confidence = 0.5;
      }
    } else if (isLikelyRomaji) {
      // Try to distinguish between Japanese and Korean romaji
      if (/\b(desu|masu|arigato|konnichiwa|sayonara)\b/gi.test(content)) {
        detectedCode = 'ja-romaji';
        confidence = 0.7;
      } else if (/\b(hamnida|saranghae|annyeong|kamsahamnida)\b/gi.test(content)) {
        detectedCode = 'ko-romaji';
        confidence = 0.7;
      } else {
        detectedCode = 'ja-romaji'; // Default to Japanese romaji
        confidence = 0.4;
      }
    } else if (hasEnglish) {
      detectedCode = 'en';
      confidence = 0.8;
    } else {
      detectedCode = DEFAULT_LANGUAGE;
      confidence = 0.2;
    }

    return {
      detectedCode,
      confidence,
      containsCJK,
      isLikelyRomaji
    };
  },

  /**
   * Suggest best language for new content
   */
  suggestLanguageForContent(
    content: string, 
    existingLanguages: LanguageCode[] = []
  ): LanguageCode {
    const detection = this.detectLanguage(content);
    
    // If detected language is not already present, suggest it
    if (!existingLanguages.includes(detection.detectedCode) && detection.confidence > 0.5) {
      return detection.detectedCode;
    }
    
    // If detected language is already present, suggest complementary language
    if (detection.containsCJK) {
      const nativeCode = getNativeLanguageCode(detection.detectedCode);
      const romajiCode = getRomajiLanguageCode(nativeCode);
      
      // If native exists, suggest romaji
      if (existingLanguages.includes(nativeCode) && romajiCode && !existingLanguages.includes(romajiCode)) {
        return romajiCode;
      }
      
      // If romaji exists, suggest native
      if (romajiCode && existingLanguages.includes(romajiCode) && !existingLanguages.includes(nativeCode)) {
        return nativeCode;
      }
    }
    
    // Default suggestions based on what's missing
    const defaultOrder: LanguageCode[] = ['en', 'ja', 'ko'];
    for (const lang of defaultOrder) {
      if (!existingLanguages.includes(lang)) {
        return lang;
      }
    }
    
    return DEFAULT_LANGUAGE;
  },

  /**
   * Generate language statistics for a collection of multilingual texts
   */
  generateLanguageStats(texts: MultilingualText[]): LanguageStats {
    const languageCounts: Record<LanguageCode, number> = {};
    let songsWithMultipleLanguages = 0;
    
    // Initialize counts
    for (const lang of SUPPORTED_LANGUAGES) {
      languageCounts[lang.code] = 0;
    }
    
    for (const text of texts) {
      const availableLanguages = this.getAvailableLanguages(text);
      
      if (availableLanguages.length > 1) {
        songsWithMultipleLanguages++;
      }
      
      for (const language of availableLanguages) {
        languageCounts[language]++;
      }
    }
    
    // Find most popular language
    let mostPopularLanguage: LanguageCode = DEFAULT_LANGUAGE;
    let maxCount = 0;
    
    for (const [language, count] of Object.entries(languageCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostPopularLanguage = language as LanguageCode;
      }
    }
    
    return {
      totalSongs: texts.length,
      songsWithMultipleLanguages,
      languageCounts,
      mostPopularLanguage
    };
  },

  /**
   * Migrate legacy notes field to multilingual lyrics
   */
  migrateLegacyNotes(
    notes: string, 
    originalLanguage: LanguageCode = DEFAULT_LANGUAGE
  ): MultilingualText {
    if (!notes?.trim()) {
      return {};
    }
    
    return {
      [originalLanguage]: notes.trim()
    };
  },

  /**
   * Convert multilingual text to legacy notes format (for backwards compatibility)
   */
  toLegacyNotes(
    multilingualText: MultilingualText, 
    preferredLanguage: LanguageCode = DEFAULT_LANGUAGE
  ): string {
    return this.getText(multilingualText, preferredLanguage);
  },

  /**
   * Merge two multilingual texts, with conflict resolution
   */
  mergeTexts(
    text1: MultilingualText, 
    text2: MultilingualText, 
    conflictResolution: 'prefer-first' | 'prefer-second' | 'merge' = 'prefer-second'
  ): MultilingualText {
    const merged: MultilingualText = { ...text1 };
    
    for (const [language, content] of Object.entries(text2)) {
      if (!isValidLanguageCode(language) || !content?.trim()) {
        continue;
      }
      
      if (merged[language] && conflictResolution === 'prefer-first') {
        continue; // Keep existing content
      }
      
      if (merged[language] && conflictResolution === 'merge') {
        // Simple merge: combine with separator
        merged[language] = `${merged[language]}\n\n---\n\n${content.trim()}`;
      } else {
        merged[language] = content.trim();
      }
    }
    
    return this.cleanupText(merged);
  },

  /**
   * Get display name for language code
   */
  getLanguageDisplayName(
    language: LanguageCode, 
    showNative: boolean = true
  ): string {
    const langInfo = getLanguageInfo(language);
    if (!langInfo) {
      return language;
    }
    
    if (showNative && langInfo.nativeName !== langInfo.name) {
      return `${langInfo.name} (${langInfo.nativeName})`;
    }
    
    return langInfo.name;
  },

  /**
   * Validate multilingual text structure
   */
  validateMultilingualText(text: MultilingualText): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!text || typeof text !== 'object') {
      errors.push('Invalid multilingual text structure');
      return { isValid: false, errors };
    }
    
    for (const [language, content] of Object.entries(text)) {
      if (!isValidLanguageCode(language)) {
        errors.push(`Invalid language code: ${language}`);
        continue;
      }
      
      if (typeof content !== 'string') {
        errors.push(`Content for language ${language} must be a string`);
        continue;
      }
      
      if (content.length > 10000) {
        errors.push(`Content for language ${language} exceeds maximum length (10000 characters)`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};