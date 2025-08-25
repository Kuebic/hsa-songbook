import { useContext } from 'react';
import { LanguageContext, type LanguageContextType } from '../contexts/LanguageContext';

/**
 * Hook to use the language context
 * @throws {Error} If used outside of LanguageProvider
 */
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}