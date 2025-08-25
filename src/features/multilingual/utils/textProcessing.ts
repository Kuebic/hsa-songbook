/**
 * @file textProcessing.ts
 * @description Text processing utilities for multilingual content
 */

import type { LanguageCode, MultilingualText } from '../types/multilingual.types';

/**
 * Interface for text metrics
 */
export interface TextMetrics {
  characterCount: number;
  wordCount: number;
  lineCount: number;
  containsCJK: boolean;
  isRomaji: boolean;
  estimatedReadingTime: number; // in seconds
}

/**
 * Interface for text normalization options
 */
export interface NormalizationOptions {
  removeExtraWhitespace: boolean;
  normalizeLineBreaks: boolean;
  trimLines: boolean;
  preserveIndentation: boolean;
}

/**
 * Default normalization options
 */
const DEFAULT_NORMALIZATION_OPTIONS: NormalizationOptions = {
  removeExtraWhitespace: true,
  normalizeLineBreaks: true,
  trimLines: true,
  preserveIndentation: false
};

/**
 * Text processing utilities for multilingual content
 */
export const textProcessingUtils = {

  /**
   * Normalize text based on language and options
   */
  normalizeText(
    text: string, 
    _language: LanguageCode,
    options: Partial<NormalizationOptions> = {}
  ): string {
    if (!text) return '';
    
    const opts = { ...DEFAULT_NORMALIZATION_OPTIONS, ...options };
    let normalized = text;

    // Normalize line breaks
    if (opts.normalizeLineBreaks) {
      normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }

    // Split into lines for line-by-line processing
    let lines = normalized.split('\n');

    // Trim lines if requested
    if (opts.trimLines && !opts.preserveIndentation) {
      lines = lines.map(line => line.trim());
    } else if (opts.trimLines && opts.preserveIndentation) {
      // Preserve leading whitespace but trim trailing
      lines = lines.map(line => line.replace(/\s+$/, ''));
    }

    // Remove extra whitespace within lines
    if (opts.removeExtraWhitespace) {
      lines = lines.map(line => {
        // For CJK languages, be more careful with spacing
        if (this.containsCJKCharacters(line)) {
          // Remove multiple spaces but preserve single spaces between non-CJK words
          return line.replace(/\s{2,}/g, ' ');
        } else {
          // For non-CJK, collapse multiple whitespace to single space
          return line.replace(/\s+/g, ' ');
        }
      });
    }

    // Remove empty lines at start and end
    while (lines.length > 0 && lines[0].trim() === '') {
      lines.shift();
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.pop();
    }

    return lines.join('\n');
  },

  /**
   * Check if text contains CJK characters
   */
  containsCJKCharacters(text: string): boolean {
    const cjkRegex = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/;
    return cjkRegex.test(text);
  },

  /**
   * Check if text is likely Romaji
   */
  isLikelyRomaji(text: string): boolean {
    // Must contain Latin characters
    const hasLatin = /[a-zA-Z]/.test(text);
    if (!hasLatin) return false;

    // Must not contain CJK characters
    if (this.containsCJKCharacters(text)) return false;

    // Check for common romaji patterns
    const romajiPatterns = [
      /\b(wa|wo|ga|na|ni|ka|sa|ta|ma|ya|ra|de|su|desu|arigato|konnichiwa)\b/gi, // Japanese
      /\b(annyeong|saranghae|kamsahamnida|jeongmal|uri|naneun)\b/gi, // Korean
      /[aiueo]{2,}/gi, // Multiple vowels common in romaji
    ];

    return romajiPatterns.some(pattern => pattern.test(text));
  },

  /**
   * Get text metrics for a given string
   */
  getTextMetrics(text: string, _language: LanguageCode): TextMetrics {
    if (!text) {
      return {
        characterCount: 0,
        wordCount: 0,
        lineCount: 0,
        containsCJK: false,
        isRomaji: false,
        estimatedReadingTime: 0
      };
    }

    const characterCount = text.length;
    const lineCount = text.split('\n').length;
    const containsCJK = this.containsCJKCharacters(text);
    const isRomaji = this.isLikelyRomaji(text);

    // Word count calculation depends on language
    let wordCount: number;
    if (containsCJK) {
      // For CJK languages, count characters as "words" since they don't use spaces
      wordCount = text.replace(/\s/g, '').length;
    } else {
      // For Latin-based languages, count space-separated words
      wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    // Estimated reading time (rough approximation)
    let estimatedReadingTime: number;
    if (containsCJK) {
      // CJK: ~300 characters per minute
      estimatedReadingTime = Math.ceil((characterCount / 300) * 60);
    } else {
      // Latin: ~250 words per minute
      estimatedReadingTime = Math.ceil((wordCount / 250) * 60);
    }

    return {
      characterCount,
      wordCount,
      lineCount,
      containsCJK,
      isRomaji,
      estimatedReadingTime
    };
  },

  /**
   * Sanitize text for safe display/storage
   */
  sanitizeText(text: string): string {
    if (!text) return '';

    return text
      // Remove control characters except newlines and tabs
      .replace(/[^\S\n\t]|\p{C}/gu, '')
      // Normalize Unicode
      .normalize('NFC')
      // Limit line length to prevent extremely long lines
      .split('\n')
      .map(line => line.length > 1000 ? line.substring(0, 1000) + '...' : line)
      .join('\n');
  },

  /**
   * Split text into verses/sections intelligently
   */
  splitIntoSections(text: string): string[] {
    if (!text) return [];

    const lines = text.split('\n');
    const sections: string[] = [];
    let currentSection: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Empty line indicates section break
      if (trimmedLine === '') {
        if (currentSection.length > 0) {
          sections.push(currentSection.join('\n'));
          currentSection = [];
        }
      } else {
        currentSection.push(line);
      }
    }

    // Add final section if it exists
    if (currentSection.length > 0) {
      sections.push(currentSection.join('\n'));
    }

    return sections.filter(section => section.trim().length > 0);
  },

  /**
   * Join sections back into text with proper spacing
   */
  joinSections(sections: string[]): string {
    return sections
      .filter(section => section.trim().length > 0)
      .join('\n\n');
  },

  /**
   * Extract common patterns from multilingual text
   */
  extractCommonPatterns(multilingualText: MultilingualText): {
    commonWords: string[];
    verseStructure: boolean;
    chorusPattern: boolean;
  } {
    const languages = Object.keys(multilingualText);
    const allTexts = Object.values(multilingualText);

    // Check if all versions have similar line counts (indicating verse structure)
    const lineCounts = allTexts.map(text => text.split('\n').length);
    const avgLineCount = lineCounts.reduce((a, b) => a + b, 0) / lineCounts.length;
    const verseStructure = lineCounts.every(count => Math.abs(count - avgLineCount) <= 2);

    // Simple check for chorus pattern (repeated sections)
    let chorusPattern = false;
    for (const text of allTexts) {
      const sections = this.splitIntoSections(text);
      const sectionCounts = new Map<string, number>();
      
      sections.forEach(section => {
        const normalized = this.normalizeText(section, 'en');
        sectionCounts.set(normalized, (sectionCounts.get(normalized) || 0) + 1);
      });

      if (Array.from(sectionCounts.values()).some(count => count > 1)) {
        chorusPattern = true;
        break;
      }
    }

    // Extract common words (simplified approach)
    const commonWords: string[] = [];
    if (languages.includes('en')) {
      const englishText = multilingualText.en || '';
      const words = englishText.toLowerCase().match(/\b\w+\b/g) || [];
      const wordCounts = new Map<string, number>();
      
      words.forEach(word => {
        if (word.length > 3) { // Only consider longer words
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }
      });

      // Get most frequent words
      commonWords.push(
        ...Array.from(wordCounts.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([word]) => word)
      );
    }

    return {
      commonWords,
      verseStructure,
      chorusPattern
    };
  },

  /**
   * Validate text for specific language requirements
   */
  validateTextForLanguage(text: string, language: LanguageCode): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!text || text.trim().length === 0) {
      return {
        isValid: false,
        warnings: ['Text is empty'],
        suggestions: ['Please add some content']
      };
    }

    const metrics = this.getTextMetrics(text, language);

    // Check for language consistency
    if (language.includes('romaji') && metrics.containsCJK) {
      warnings.push('Text contains CJK characters but language is set to Romaji');
      suggestions.push('Consider changing language to native script or converting to Romaji');
    }

    if (!language.includes('romaji') && language !== 'en' && !metrics.containsCJK) {
      warnings.push('Text appears to be in Latin script but language is set to CJK');
      suggestions.push('Consider changing language to Romaji variant or English');
    }

    // Check text length
    if (text.length > 10000) {
      warnings.push('Text is very long (over 10,000 characters)');
      suggestions.push('Consider breaking into multiple sections');
    }

    // Check line length
    const longLines = text.split('\n').filter(line => line.length > 100);
    if (longLines.length > 0) {
      warnings.push(`${longLines.length} lines are very long (over 100 characters)`);
      suggestions.push('Consider breaking long lines for better readability');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  },

  /**
   * Convert text to display format for specific contexts
   */
  formatForDisplay(
    text: string, 
    context: 'preview' | 'editing' | 'export',
    maxLength?: number
  ): string {
    if (!text) return '';

    let formatted = text;

    switch (context) {
      case 'preview': {
        // For preview, show first few lines with ellipsis
        const previewLines = formatted.split('\n').slice(0, 3);
        if (maxLength && formatted.length > maxLength) {
          formatted = formatted.substring(0, maxLength) + '...';
        } else if (formatted.split('\n').length > 3) {
          formatted = previewLines.join('\n') + '\n...';
        }
        break;
      }

      case 'editing':
        // For editing, preserve formatting but clean up
        formatted = this.normalizeText(formatted, 'en', {
          removeExtraWhitespace: false,
          normalizeLineBreaks: true,
          trimLines: false,
          preserveIndentation: true
        });
        break;

      case 'export':
        // For export, clean and normalize
        formatted = this.normalizeText(formatted, 'en');
        break;
    }

    return formatted;
  }
};