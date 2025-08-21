/**
 * @file multilingual.types.ts
 * @description TypeScript interfaces and types for multilingual lyrics support
 * Supports English, Japanese, Korean languages with their respective Romaji variants
 */

/**
 * Interface for storing multilingual text content
 * Keys are language codes, values are the text content in that language
 */
export interface MultilingualText {
  [languageCode: string]: string;
}

/**
 * Interface for supported language configuration
 */
export interface SupportedLanguage {
  code: string;       // Language code (e.g., 'en', 'ja', 'ko', 'ja-romaji', 'ko-romaji')
  name: string;       // English name of the language
  nativeName: string; // Native name of the language
  rtl: boolean;       // Right-to-left text direction support
  isRomaji?: boolean; // Whether this is a Romaji variant
  nativeCode?: string; // Reference to the native script version (for Romaji variants)
}

/**
 * Supported languages including native scripts and Romaji variants
 * Native scripts: 'en', 'ja', 'ko'
 * Romaji variants: 'ja-romaji', 'ko-romaji'
 */
export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  { 
    code: 'en', 
    name: 'English', 
    nativeName: 'English', 
    rtl: false 
  },
  { 
    code: 'ja', 
    name: 'Japanese', 
    nativeName: '日本語', 
    rtl: false 
  },
  { 
    code: 'ja-romaji', 
    name: 'Japanese (Romaji)', 
    nativeName: 'Japanese (Romaji)', 
    rtl: false, 
    isRomaji: true, 
    nativeCode: 'ja' 
  },
  { 
    code: 'ko', 
    name: 'Korean', 
    nativeName: '한국어', 
    rtl: false 
  },
  { 
    code: 'ko-romaji', 
    name: 'Korean (Romaji)', 
    nativeName: 'Korean (Romaji)', 
    rtl: false, 
    isRomaji: true, 
    nativeCode: 'ko' 
  },
] as const;

/**
 * Type for all supported language codes
 */
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

/**
 * Type for native script language codes only (excludes Romaji variants)
 */
export type NativeLanguageCode = 'en' | 'ja' | 'ko';

/**
 * Type for Romaji language codes only
 */
export type RomajiLanguageCode = 'ja-romaji' | 'ko-romaji';

/**
 * Interface for language selection options with preview
 */
export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  preview?: string; // Preview text in this language
  isRomaji?: boolean;
  hasLyrics?: boolean; // Whether this language has lyrics available
}

/**
 * Interface for language group (native + romaji variants)
 */
export interface LanguageGroup {
  nativeLanguage: SupportedLanguage;
  romajiVariant?: SupportedLanguage;
  availableOptions: LanguageOption[];
}

/**
 * Interface for language detection result
 */
export interface LanguageDetectionResult {
  detectedCode: LanguageCode;
  confidence: number; // 0-1 confidence score
  containsCJK: boolean; // Whether text contains Chinese/Japanese/Korean characters
  isLikelyRomaji: boolean; // Whether text appears to be romanized
}

/**
 * Interface for language statistics
 */
export interface LanguageStats {
  totalSongs: number;
  songsWithMultipleLanguages: number;
  languageCounts: Record<LanguageCode, number>;
  mostPopularLanguage: LanguageCode;
}

/**
 * Interface for language context state
 */
export interface LanguageContextState {
  currentLanguage: LanguageCode;
  availableLanguages: LanguageCode[];
  preferredLanguage: LanguageCode; // User's preferred language
  fallbackLanguage: LanguageCode; // Fallback when preferred not available
}

/**
 * Interface for language context actions
 */
export interface LanguageContextActions {
  setCurrentLanguage: (language: LanguageCode) => void;
  setPreferredLanguage: (language: LanguageCode) => void;
  getMultilingualText: (text: MultilingualText, fallback?: string) => string;
  getAvailableLanguages: (text: MultilingualText) => LanguageCode[];
  hasLanguage: (text: MultilingualText, language: LanguageCode) => boolean;
}

/**
 * Interface for language selector props
 */
export interface LanguageSelectorProps {
  value?: LanguageCode;
  onChange: (language: LanguageCode) => void;
  availableLanguages?: LanguageCode[];
  disabled?: boolean;
  placeholder?: string;
  groupByScript?: boolean; // Group Romaji with native scripts
  showNativeNames?: boolean; // Show native script names
  className?: string;
}

/**
 * Interface for lyrics language modal props
 */
export interface LyricsLanguageModalProps {
  isOpen: boolean;
  onClose: (selectedLanguage?: LanguageCode) => void;
  availableLyrics: MultilingualText;
  currentSelection?: LanguageCode;
  songTitle?: string;
}

/**
 * Interface for multilingual text display props
 */
export interface MultilingualTextProps {
  text: MultilingualText;
  language?: LanguageCode;
  fallbackLanguage?: LanguageCode;
  className?: string;
  showLanguageIndicator?: boolean;
  maxLength?: number; // For truncation
}

/**
 * Interface for lyrics editor state
 */
export interface LyricsEditorState {
  lyrics: MultilingualText;
  activeLanguage: LanguageCode;
  hasChanges: boolean;
  isValid: boolean;
  errors: Record<LanguageCode, string>;
}

/**
 * Type for lyrics source tracking
 */
export type LyricsSource = 'user' | 'import' | 'opensong';

/**
 * Interface for lyrics metadata
 */
export interface LyricsMetadata {
  source: LyricsSource;
  verified: boolean;
  lastModified: Date;
  modifiedBy?: string;
  originalLanguage?: NativeLanguageCode;
  autoConversionEnabled: boolean;
}

// Utility types for type guards and validation

/**
 * Type guard to check if a language code is a native script
 */
export function isNativeLanguageCode(code: string): code is NativeLanguageCode {
  return ['en', 'ja', 'ko'].includes(code);
}

/**
 * Type guard to check if a language code is a Romaji variant
 */
export function isRomajiLanguageCode(code: string): code is RomajiLanguageCode {
  return ['ja-romaji', 'ko-romaji'].includes(code);
}

/**
 * Type guard to check if a language code is supported
 */
export function isValidLanguageCode(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

/**
 * Get the native language code for a Romaji variant
 */
export function getNativeLanguageCode(code: LanguageCode): NativeLanguageCode {
  if (isNativeLanguageCode(code)) {
    return code;
  }
  
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return (language?.nativeCode as NativeLanguageCode) || 'en';
}

/**
 * Get the Romaji variant code for a native language
 */
export function getRomajiLanguageCode(nativeCode: NativeLanguageCode): RomajiLanguageCode | null {
  if (nativeCode === 'en') return null; // English has no Romaji variant
  return `${nativeCode}-romaji` as RomajiLanguageCode;
}

/**
 * Get language information by code
 */
export function getLanguageInfo(code: LanguageCode): SupportedLanguage | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Group languages by their script family (native + romaji variants)
 */
export function getLanguageGroups(availableCodes: LanguageCode[]): LanguageGroup[] {
  const groups: LanguageGroup[] = [];
  const processed = new Set<string>();

  for (const code of availableCodes) {
    const nativeCode = getNativeLanguageCode(code);
    
    if (processed.has(nativeCode)) continue;
    processed.add(nativeCode);

    const nativeLanguage = getLanguageInfo(nativeCode);
    if (!nativeLanguage) continue;

    const romajiCode = getRomajiLanguageCode(nativeCode);
    const romajiVariant = romajiCode ? getLanguageInfo(romajiCode) : undefined;

    const availableOptions: LanguageOption[] = [];
    
    // Add native language if available
    if (availableCodes.includes(nativeCode)) {
      availableOptions.push({
        code: nativeCode,
        name: nativeLanguage.name,
        nativeName: nativeLanguage.nativeName,
        isRomaji: false,
        hasLyrics: true
      });
    }

    // Add Romaji variant if available
    if (romajiCode && romajiVariant && availableCodes.includes(romajiCode)) {
      availableOptions.push({
        code: romajiCode,
        name: romajiVariant.name,
        nativeName: romajiVariant.nativeName,
        isRomaji: true,
        hasLyrics: true
      });
    }

    if (availableOptions.length > 0) {
      groups.push({
        nativeLanguage,
        romajiVariant,
        availableOptions
      });
    }
  }

  return groups;
}

/**
 * Constants for default values
 */
export const DEFAULT_LANGUAGE: LanguageCode = 'en';
export const FALLBACK_LANGUAGE: LanguageCode = 'en';

/**
 * Language storage keys for localStorage persistence
 */
export const LANGUAGE_STORAGE_KEYS = {
  PREFERRED: 'hsa-songbook-preferred-language',
  CURRENT: 'hsa-songbook-current-language',
  LYRICS_SELECTION: 'hsa-songbook-selected-lyrics-language'
} as const;