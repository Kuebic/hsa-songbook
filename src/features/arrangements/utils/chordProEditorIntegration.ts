/**
 * @file chordProEditorIntegration.ts
 * @description Session storage integration utilities for ChordPro editor template pickup
 */

import type { Song, Arrangement } from '../../songs/types/song.types';
import type { ChordProTemplate } from './chordProTemplateGenerator';
import { generateChordProTemplate, generateFullChordProTemplate } from './chordProTemplateGenerator';

/**
 * Interface for editor session data
 */
export interface EditorSessionData {
  template: ChordProTemplate;
  song: Song;
  arrangement?: Arrangement;
  timestamp: number;
  source: 'arrangement-creation' | 'arrangement-edit' | 'song-creation';
  prefillFlag: boolean;
}

/**
 * Interface for session storage service
 */
export interface ChordProEditorSessionService {
  storeTemplate: (data: Omit<EditorSessionData, 'timestamp'>) => void;
  getTemplate: (arrangementId?: string) => EditorSessionData | null;
  hasTemplate: (arrangementId?: string) => boolean;
  clearTemplate: (arrangementId?: string) => void;
  clearAllTemplates: () => void;
}

/**
 * Session storage keys
 */
const SESSION_KEYS = {
  EDITOR_TEMPLATE: 'hsa-songbook-chordpro-template',
  EDITOR_PREFILL: 'hsa-songbook-chordpro-prefill',
  TEMPLATE_METADATA: 'hsa-songbook-template-metadata',
} as const;

/**
 * Maximum age for session data (30 minutes)
 */
const MAX_SESSION_AGE = 30 * 60 * 1000;

/**
 * Store ChordPro template in session storage for editor pickup
 */
export function storeChordProTemplate(data: Omit<EditorSessionData, 'timestamp'>): void {
  try {
    const sessionData: EditorSessionData = {
      ...data,
      timestamp: Date.now(),
    };
    
    // Store the main template data
    sessionStorage.setItem(SESSION_KEYS.EDITOR_TEMPLATE, JSON.stringify(sessionData));
    
    // Store prefill flag separately for quick access
    sessionStorage.setItem(SESSION_KEYS.EDITOR_PREFILL, JSON.stringify({
      prefillFlag: data.prefillFlag,
      arrangementId: data.arrangement?.id,
      timestamp: Date.now(),
    }));
    
    // Store metadata for quick reference
    sessionStorage.setItem(SESSION_KEYS.TEMPLATE_METADATA, JSON.stringify({
      songTitle: data.song.title,
      arrangementName: data.arrangement?.name,
      hasArrangement: Boolean(data.arrangement),
      source: data.source,
      timestamp: Date.now(),
    }));
    
  } catch (error) {
    console.warn('Failed to store ChordPro template in session storage:', error);
  }
}

/**
 * Get ChordPro template from session storage
 */
export function getChordProTemplate(arrangementId?: string): EditorSessionData | null {
  try {
    const storedData = sessionStorage.getItem(SESSION_KEYS.EDITOR_TEMPLATE);
    if (!storedData) {
      return null;
    }
    
    const sessionData: EditorSessionData = JSON.parse(storedData);
    
    // Check if data is too old
    if (Date.now() - sessionData.timestamp > MAX_SESSION_AGE) {
      clearChordProTemplate();
      return null;
    }
    
    // If arrangementId is provided, check if it matches
    if (arrangementId && sessionData.arrangement?.id !== arrangementId) {
      return null;
    }
    
    return sessionData;
    
  } catch (error) {
    console.warn('Failed to get ChordPro template from session storage:', error);
    return null;
  }
}

/**
 * Check if a template exists in session storage
 */
export function hasChordProTemplate(arrangementId?: string): boolean {
  return getChordProTemplate(arrangementId) !== null;
}

/**
 * Clear ChordPro template from session storage
 */
export function clearChordProTemplate(arrangementId?: string): void {
  try {
    if (arrangementId) {
      // Clear only if it matches the specific arrangement
      const current = getChordProTemplate();
      if (current && current.arrangement?.id === arrangementId) {
        sessionStorage.removeItem(SESSION_KEYS.EDITOR_TEMPLATE);
        sessionStorage.removeItem(SESSION_KEYS.EDITOR_PREFILL);
        sessionStorage.removeItem(SESSION_KEYS.TEMPLATE_METADATA);
      }
    } else {
      // Clear all template data
      sessionStorage.removeItem(SESSION_KEYS.EDITOR_TEMPLATE);
      sessionStorage.removeItem(SESSION_KEYS.EDITOR_PREFILL);
      sessionStorage.removeItem(SESSION_KEYS.TEMPLATE_METADATA);
    }
  } catch (error) {
    console.warn('Failed to clear ChordPro template from session storage:', error);
  }
}

/**
 * Clear all ChordPro templates from session storage
 */
export function clearAllChordProTemplates(): void {
  try {
    Object.values(SESSION_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear all ChordPro templates from session storage:', error);
  }
}

/**
 * Get prefill flag from session storage for quick access
 */
export function getPrefillFlag(): { prefillFlag: boolean; arrangementId?: string } | null {
  try {
    const storedData = sessionStorage.getItem(SESSION_KEYS.EDITOR_PREFILL);
    if (!storedData) {
      return null;
    }
    
    const prefillData = JSON.parse(storedData);
    
    // Check if data is too old
    if (Date.now() - prefillData.timestamp > MAX_SESSION_AGE) {
      sessionStorage.removeItem(SESSION_KEYS.EDITOR_PREFILL);
      return null;
    }
    
    return {
      prefillFlag: prefillData.prefillFlag,
      arrangementId: prefillData.arrangementId,
    };
    
  } catch (error) {
    console.warn('Failed to get prefill flag from session storage:', error);
    return null;
  }
}

/**
 * Store template for arrangement creation workflow
 */
export function storeTemplateForArrangementCreation(
  song: Song,
  arrangement: Arrangement,
  includeFullStructure: boolean = true
): void {
  const template = includeFullStructure 
    ? generateFullChordProTemplate(song, arrangement)
    : generateChordProTemplate(song, arrangement);
    
  storeChordProTemplate({
    template,
    song,
    arrangement,
    source: 'arrangement-creation',
    prefillFlag: true,
  });
}

/**
 * Store template for arrangement editing workflow
 */
export function storeTemplateForArrangementEdit(
  song: Song,
  arrangement: Arrangement,
  existingContent?: string
): void {
  let template: ChordProTemplate;
  
  if (existingContent && existingContent.trim()) {
    // Use existing content but update metadata
    template = {
      content: existingContent,
      metadata: generateChordProTemplate(song, arrangement).metadata,
      hasArrangementData: true,
    };
  } else {
    // Generate new template
    template = generateChordProTemplate(song, arrangement);
  }
  
  storeChordProTemplate({
    template,
    song,
    arrangement,
    source: 'arrangement-edit',
    prefillFlag: true,
  });
}

/**
 * Store template for song creation workflow (no arrangement yet)
 */
export function storeTemplateForSongCreation(song: Song): void {
  const template = generateChordProTemplate(song);
  
  storeChordProTemplate({
    template,
    song,
    source: 'song-creation',
    prefillFlag: false,
  });
}

/**
 * Get template metadata for quick reference without loading full template
 */
export function getTemplateMetadata(): {
  songTitle: string;
  arrangementName?: string;
  hasArrangement: boolean;
  source: string;
  timestamp: number;
} | null {
  try {
    const storedData = sessionStorage.getItem(SESSION_KEYS.TEMPLATE_METADATA);
    if (!storedData) {
      return null;
    }
    
    const metadata = JSON.parse(storedData);
    
    // Check if data is too old
    if (Date.now() - metadata.timestamp > MAX_SESSION_AGE) {
      sessionStorage.removeItem(SESSION_KEYS.TEMPLATE_METADATA);
      return null;
    }
    
    return metadata;
    
  } catch (error) {
    console.warn('Failed to get template metadata from session storage:', error);
    return null;
  }
}

/**
 * Clean up expired session data
 */
export function cleanupExpiredSessions(): void {
  try {
    const now = Date.now();
    
    Object.values(SESSION_KEYS).forEach(key => {
      const storedData = sessionStorage.getItem(key);
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          if (data.timestamp && now - data.timestamp > MAX_SESSION_AGE) {
            sessionStorage.removeItem(key);
          }
        } catch {
          // Invalid JSON, remove it
          sessionStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn('Failed to cleanup expired sessions:', error);
  }
}

/**
 * Create the session service object for easy use
 */
export const chordProEditorSessionService: ChordProEditorSessionService = {
  storeTemplate: storeChordProTemplate,
  getTemplate: getChordProTemplate,
  hasTemplate: hasChordProTemplate,
  clearTemplate: clearChordProTemplate,
  clearAllTemplates: clearAllChordProTemplates,
};

/**
 * Hook-like function to get session data with automatic cleanup
 */
export function useChordProSessionData(arrangementId?: string) {
  // Clean up expired sessions
  cleanupExpiredSessions();
  
  // Get current template
  const template = getChordProTemplate(arrangementId);
  const prefillFlag = getPrefillFlag();
  const metadata = getTemplateMetadata();
  
  return {
    template,
    prefillFlag: prefillFlag?.prefillFlag || false,
    metadata,
    hasTemplate: Boolean(template),
    hasValidSession: Boolean(template && prefillFlag),
  };
}

/**
 * Utility to check if the current page should prefill with template data
 */
export function shouldPrefillEditor(arrangementId?: string): boolean {
  const prefillData = getPrefillFlag();
  
  if (!prefillData?.prefillFlag) {
    return false;
  }
  
  // If arrangementId is provided, check if it matches
  if (arrangementId && prefillData.arrangementId !== arrangementId) {
    return false;
  }
  
  // Check if we have a valid template
  return hasChordProTemplate(arrangementId);
}