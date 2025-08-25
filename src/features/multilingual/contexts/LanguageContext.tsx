import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { 
  LanguageCode, 
  MultilingualText
} from '../types/multilingual.types';
import { 
  DEFAULT_LANGUAGE, 
  FALLBACK_LANGUAGE, 
  LANGUAGE_STORAGE_KEYS,
  isValidLanguageCode 
} from '../types/multilingual.types';
import { LanguageContext, type LanguageContextType } from './LanguageContext';

// Hook moved to ../hooks/useLanguage.ts

/**
 * Get initial language preference from localStorage
 */
const getInitialLanguage = (storageKey: string, defaultLang: LanguageCode): LanguageCode => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && isValidLanguageCode(stored)) {
        return stored;
      }
    } catch (error) {
      console.warn('Failed to read language preference from localStorage:', error);
    }
  }
  return defaultLang;
};

/**
 * Save language preference to localStorage
 */
const saveLanguagePreference = (key: string, language: LanguageCode): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, language);
    } catch (error) {
      console.warn('Failed to save language preference to localStorage:', error);
    }
  }
};

/**
 * Language provider component props
 */
export interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: LanguageCode;
  enablePersistence?: boolean;
}

/**
 * Language provider component that manages multilingual state
 */
export function LanguageProvider({ 
  children, 
  initialLanguage, 
  enablePersistence = true 
}: LanguageProviderProps) {
  // Initialize language state from localStorage or defaults
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>(() => {
    if (initialLanguage) return initialLanguage;
    return enablePersistence 
      ? getInitialLanguage(LANGUAGE_STORAGE_KEYS.CURRENT, DEFAULT_LANGUAGE)
      : DEFAULT_LANGUAGE;
  });

  const [preferredLanguage, setPreferredLanguageState] = useState<LanguageCode>(() => {
    if (initialLanguage) return initialLanguage;
    return enablePersistence 
      ? getInitialLanguage(LANGUAGE_STORAGE_KEYS.PREFERRED, DEFAULT_LANGUAGE)
      : DEFAULT_LANGUAGE;
  });

  const [availableLanguages] = useState<LanguageCode[]>([
    'en', 'ja', 'ja-romaji', 'ko', 'ko-romaji'
  ]);

  // Persist language changes to localStorage
  useEffect(() => {
    if (enablePersistence) {
      saveLanguagePreference(LANGUAGE_STORAGE_KEYS.CURRENT, currentLanguage);
    }
  }, [currentLanguage, enablePersistence]);

  useEffect(() => {
    if (enablePersistence) {
      saveLanguagePreference(LANGUAGE_STORAGE_KEYS.PREFERRED, preferredLanguage);
    }
  }, [preferredLanguage, enablePersistence]);

  /**
   * Set the current display language
   */
  const setCurrentLanguage = useCallback((language: LanguageCode) => {
    if (!isValidLanguageCode(language)) {
      console.warn(`Invalid language code: ${language}, using fallback`);
      setCurrentLanguageState(FALLBACK_LANGUAGE);
      return;
    }
    setCurrentLanguageState(language);
  }, []);

  /**
   * Set the user's preferred language
   */
  const setPreferredLanguage = useCallback((language: LanguageCode) => {
    if (!isValidLanguageCode(language)) {
      console.warn(`Invalid language code: ${language}, using fallback`);
      setPreferredLanguageState(FALLBACK_LANGUAGE);
      return;
    }
    setPreferredLanguageState(language);
    // Also update current language to match preference
    setCurrentLanguageState(language);
  }, []);

  /**
   * Get text in the current or specified language with fallback support
   */
  const getMultilingualText = useCallback((
    text: MultilingualText, 
    fallback?: string
  ): string => {
    if (!text || typeof text !== 'object') {
      return fallback || '';
    }

    // Try current language first
    if (text[currentLanguage]?.trim()) {
      return text[currentLanguage];
    }

    // Try preferred language
    if (text[preferredLanguage]?.trim()) {
      return text[preferredLanguage];
    }

    // Try fallback language
    if (text[FALLBACK_LANGUAGE]?.trim()) {
      return text[FALLBACK_LANGUAGE];
    }

    // Try any available language
    for (const lang of availableLanguages) {
      if (text[lang]?.trim()) {
        return text[lang];
      }
    }

    // Try any key in the text object
    const availableKeys = Object.keys(text);
    for (const key of availableKeys) {
      if (text[key]?.trim()) {
        return text[key];
      }
    }

    // Return provided fallback or empty string
    return fallback || '';
  }, [currentLanguage, preferredLanguage, availableLanguages]);

  /**
   * Get array of available language codes for given multilingual text
   */
  const getAvailableLanguages = useCallback((text: MultilingualText): LanguageCode[] => {
    if (!text || typeof text !== 'object') {
      return [];
    }

    return Object.keys(text)
      .filter((key): key is LanguageCode => {
        return isValidLanguageCode(key) && text[key]?.trim() !== '';
      })
      .sort((a, b) => {
        // Sort by preference: current language first, then preferred, then alphabetically
        if (a === currentLanguage) return -1;
        if (b === currentLanguage) return 1;
        if (a === preferredLanguage) return -1;
        if (b === preferredLanguage) return 1;
        return a.localeCompare(b);
      });
  }, [currentLanguage, preferredLanguage]);

  /**
   * Check if text has content in specific language
   */
  const hasLanguage = useCallback((text: MultilingualText, language: LanguageCode): boolean => {
    return Boolean(text?.[language]?.trim());
  }, []);

  // Context value
  const contextValue: LanguageContextType = {
    // State
    currentLanguage,
    availableLanguages,
    preferredLanguage,
    fallbackLanguage: FALLBACK_LANGUAGE,
    
    // Actions
    setCurrentLanguage,
    setPreferredLanguage,
    getMultilingualText,
    getAvailableLanguages,
    hasLanguage,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// HOC moved to ../utils/withLanguageProvider.tsx

// Re-export types for convenience
export type { LanguageCode, MultilingualText } from '../types/multilingual.types';