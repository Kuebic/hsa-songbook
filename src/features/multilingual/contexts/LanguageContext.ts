import { createContext } from 'react';
import type { 
  LanguageContextState, 
  LanguageContextActions 
} from '../types/multilingual.types';

/**
 * Combined context type for language state and actions
 */
export interface LanguageContextType extends LanguageContextState, LanguageContextActions {}

/**
 * Language context for managing multilingual state
 */
export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);