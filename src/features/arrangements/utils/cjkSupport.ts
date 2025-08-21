/**
 * @file cjkSupport.ts
 * @description CJK (Chinese, Japanese, Korean) support utilities for ChordPro editor
 */

import type { LanguageCode } from '../../multilingual/types/multilingual.types';
import { textProcessingUtils } from '../../multilingual/utils/textProcessing';

/**
 * Interface for CJK detection result
 */
export interface CJKDetectionResult {
  containsCJK: boolean;
  detectedLanguage: LanguageCode | null;
  isRomaji: boolean;
  confidence: number;
  suggestedFontStack: string;
}

/**
 * Interface for CJK editor configuration
 */
export interface CJKEditorConfig {
  enableCJKMode: boolean;
  autoDetectLanguage: boolean;
  preferredLanguage?: LanguageCode;
  fontPreference: 'system' | 'monospace' | 'auto';
  lineHeightMultiplier: number;
  letterSpacing: number;
}

/**
 * Default CJK editor configuration
 */
export const DEFAULT_CJK_CONFIG: CJKEditorConfig = {
  enableCJKMode: true,
  autoDetectLanguage: true,
  fontPreference: 'auto',
  lineHeightMultiplier: 1.7,
  letterSpacing: 0.02
};

/**
 * CJK language detection patterns
 */
const CJK_PATTERNS = {
  japanese: {
    hiragana: /[\u3040-\u309F]/,
    katakana: /[\u30A0-\u30FF]/,
    kanji: /[\u4E00-\u9FAF]/,
    romajiKeywords: /\b(desu|masu|arigato|konnichiwa|sayonara|watashi|anata)\b/gi
  },
  korean: {
    hangul: /[\uAC00-\uD7AF]/,
    romajiKeywords: /\b(hamnida|saranghae|annyeong|kamsahamnida|jeongmal)\b/gi
  },
  chinese: {
    simplified: /[\u4E00-\u9FFF]/,
    traditional: /[\u4E00-\u9FFF\uF900-\uFAFF]/
  }
};

/**
 * Font stacks for different CJK languages
 */
const CJK_FONT_STACKS = {
  japanese: `'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'MS Gothic', monospace`,
  korean: `'Malgun Gothic', 'Apple SD Gothic Neo', 'Nanum Gothic', 'Dotum', monospace`,
  chinese: `'PingFang SC', 'PingFang TC', 'Microsoft YaHei', 'SimHei', 'Arial Unicode MS', monospace`,
  generic: `'SF Mono', 'Monaco', 'Menlo', 'Consolas', 'Courier New', 'Noto Sans Mono CJK', monospace`
};

/**
 * CJK support utilities
 */
export const cjkSupportUtils = {

  /**
   * Detect CJK content and language
   */
  detectCJKContent(text: string): CJKDetectionResult {
    if (!text) {
      return {
        containsCJK: false,
        detectedLanguage: null,
        isRomaji: false,
        confidence: 0,
        suggestedFontStack: CJK_FONT_STACKS.generic
      };
    }

    const containsCJK = textProcessingUtils.containsCJKCharacters(text);
    const isRomaji = textProcessingUtils.isLikelyRomaji(text);
    
    let detectedLanguage: LanguageCode | null = null;
    let confidence = 0;
    let suggestedFontStack = CJK_FONT_STACKS.generic;

    if (containsCJK) {
      // Detect specific CJK language
      if (CJK_PATTERNS.japanese.hiragana.test(text) || 
          CJK_PATTERNS.japanese.katakana.test(text)) {
        detectedLanguage = 'ja';
        confidence = 0.9;
        suggestedFontStack = CJK_FONT_STACKS.japanese;
      } else if (CJK_PATTERNS.korean.hangul.test(text)) {
        detectedLanguage = 'ko';
        confidence = 0.9;
        suggestedFontStack = CJK_FONT_STACKS.korean;
      } else if (CJK_PATTERNS.chinese.simplified.test(text)) {
        detectedLanguage = 'en'; // Default to English for Chinese, can be expanded
        confidence = 0.7;
        suggestedFontStack = CJK_FONT_STACKS.chinese;
      }
    } else if (isRomaji) {
      // Detect romaji variants
      if (CJK_PATTERNS.japanese.romajiKeywords.test(text)) {
        detectedLanguage = 'ja-romaji';
        confidence = 0.7;
        suggestedFontStack = CJK_FONT_STACKS.japanese;
      } else if (CJK_PATTERNS.korean.romajiKeywords.test(text)) {
        detectedLanguage = 'ko-romaji';
        confidence = 0.7;
        suggestedFontStack = CJK_FONT_STACKS.korean;
      }
    }

    return {
      containsCJK,
      detectedLanguage,
      isRomaji,
      confidence,
      suggestedFontStack
    };
  },

  /**
   * Get optimal configuration for CJK content
   */
  getOptimalConfig(
    text: string, 
    userConfig: Partial<CJKEditorConfig> = {}
  ): CJKEditorConfig {
    const detection = this.detectCJKContent(text);
    const config = { ...DEFAULT_CJK_CONFIG, ...userConfig };

    // Adjust configuration based on detection
    if (detection.containsCJK) {
      config.enableCJKMode = true;
      config.lineHeightMultiplier = Math.max(config.lineHeightMultiplier, 1.7);
      config.letterSpacing = Math.max(config.letterSpacing, 0.02);
    }

    return config;
  },

  /**
   * Generate CSS variables for CJK content
   */
  generateCJKCSSVariables(config: CJKEditorConfig, detection: CJKDetectionResult): Record<string, string> {
    const variables: Record<string, string> = {};

    if (config.enableCJKMode && detection.containsCJK) {
      variables['--editor-font-family'] = detection.suggestedFontStack;
      variables['--editor-line-height'] = config.lineHeightMultiplier.toString();
      variables['--editor-letter-spacing'] = `${config.letterSpacing}em`;
      
      // Adjust font size for better CJK readability
      variables['--editor-font-size-multiplier'] = '1.05';
    }

    return variables;
  },

  /**
   * Check if text needs CJK-specific handling
   */
  needsCJKHandling(text: string): boolean {
    const detection = this.detectCJKContent(text);
    return detection.containsCJK || detection.isRomaji;
  },

  /**
   * Normalize CJK text for ChordPro processing
   */
  normalizeCJKText(text: string, language?: LanguageCode): string {
    if (!this.needsCJKHandling(text)) {
      return text;
    }

    // Apply language-specific normalization
    let normalized = text;

    // Normalize Unicode for consistent character representation
    normalized = normalized.normalize('NFC');

    // Handle full-width/half-width character conversion if needed
    if (language === 'ja' || language === 'ja-romaji') {
      // Convert full-width ASCII to half-width for better chord alignment
      normalized = normalized.replace(/[！-～]/g, (char) => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code - 0xFEE0);
      });
    }

    return normalized;
  },

  /**
   * Get IME input mode recommendation
   */
  getIMEInputMode(language?: LanguageCode): string {
    if (!language) return 'latin';
    
    switch (language) {
      case 'ja':
      case 'ja-romaji':
        return 'kana';
      case 'ko':
      case 'ko-romaji':
        return 'hangul';
      default:
        return 'latin';
    }
  },

  /**
   * Validate CJK text for common issues
   */
  validateCJKText(text: string, language?: LanguageCode): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    if (!text) {
      return { isValid: true, warnings, suggestions };
    }

    const detection = this.detectCJKContent(text);

    // Check for mixed scripts that might cause display issues
    const hasCJK = detection.containsCJK;
    const hasLatin = /[a-zA-Z]/.test(text);
    
    if (hasCJK && hasLatin) {
      warnings.push('Mixed CJK and Latin text detected');
      suggestions.push('Consider using consistent spacing between CJK and Latin characters');
    }

    // Check for language consistency
    if (language && detection.detectedLanguage && 
        detection.detectedLanguage !== language && 
        detection.confidence > 0.7) {
      warnings.push(`Text appears to be ${detection.detectedLanguage} but language is set to ${language}`);
      suggestions.push(`Consider changing language setting to ${detection.detectedLanguage}`);
    }

    // Check for potential display issues
    if (detection.containsCJK && text.length > 5000) {
      warnings.push('Large amount of CJK text may impact performance');
      suggestions.push('Consider breaking into smaller sections');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  },

  /**
   * Get accessibility improvements for CJK content
   */
  getAccessibilityEnhancements(detection: CJKDetectionResult): {
    ariaLabel?: string;
    lang?: string;
    role?: string;
  } {
    const enhancements: { ariaLabel?: string; lang?: string; role?: string } = {};

    if (detection.detectedLanguage) {
      enhancements.lang = detection.detectedLanguage;
    }

    if (detection.containsCJK) {
      enhancements.ariaLabel = 'ChordPro editor with CJK text support';
    }

    return enhancements;
  }
};