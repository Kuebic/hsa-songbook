/**
 * @file chordProNavigationUtils.ts
 * @description Navigation utilities for smooth ChordPro editor workflow integration
 */

import type { Song, Arrangement } from '../../songs/types/song.types';
import { 
  storeTemplateForArrangementCreation, 
  storeTemplateForArrangementEdit,
  storeTemplateForSongCreation 
} from './chordProEditorIntegration';

/**
 * Interface for navigation options
 */
export interface NavigationOptions {
  replace?: boolean;
  openInNewTab?: boolean;
  preserveHistory?: boolean;
}

/**
 * Interface for ChordPro editor navigation result
 */
export interface NavigationResult {
  success: boolean;
  url: string;
  error?: string;
}

/**
 * Base paths for navigation
 */
const EDITOR_PATHS = {
  CHORD_EDITING: '/arrangements/edit',
  ARRANGEMENT_VIEW: '/arrangements',
  SONG_VIEW: '/songs',
} as const;

/**
 * Navigate to ChordPro editor with arrangement template
 */
export function navigateToChordProEditor(
  song: Song,
  arrangement?: Arrangement,
  options: NavigationOptions = {}
): NavigationResult {
  try {
    // Store template based on context
    if (arrangement) {
      storeTemplateForArrangementCreation(song, arrangement, true);
    } else {
      storeTemplateForSongCreation(song);
    }
    
    // Build the navigation URL
    const url = buildEditorUrl(arrangement?.id);
    
    // Perform navigation
    if (options.openInNewTab) {
      window.open(url, '_blank');
    } else if (options.replace) {
      window.location.replace(url);
    } else {
      window.location.href = url;
    }
    
    return {
      success: true,
      url,
    };
    
  } catch (error) {
    console.error('Failed to navigate to ChordPro editor:', error);
    return {
      success: false,
      url: '',
      error: error instanceof Error ? error.message : 'Navigation failed',
    };
  }
}

/**
 * Navigate to ChordPro editor for editing existing arrangement
 */
export function navigateToEditArrangement(
  song: Song,
  arrangement: Arrangement,
  existingContent?: string,
  options: NavigationOptions = {}
): NavigationResult {
  try {
    // Store template for editing
    storeTemplateForArrangementEdit(song, arrangement, existingContent);
    
    // Build the navigation URL
    const url = buildEditorUrl(arrangement.id);
    
    // Perform navigation
    if (options.openInNewTab) {
      window.open(url, '_blank');
    } else if (options.replace) {
      window.location.replace(url);
    } else {
      window.location.href = url;
    }
    
    return {
      success: true,
      url,
    };
    
  } catch (error) {
    console.error('Failed to navigate to edit arrangement:', error);
    return {
      success: false,
      url: '',
      error: error instanceof Error ? error.message : 'Navigation failed',
    };
  }
}

/**
 * Navigate to ChordPro editor for new arrangement creation
 */
export function navigateToCreateArrangement(
  song: Song,
  arrangementData: Partial<Arrangement>,
  options: NavigationOptions = {}
): NavigationResult {
  try {
    // Create a temporary arrangement object for template generation
    const tempArrangement: Arrangement = {
      id: 'temp-' + Date.now(),
      name: arrangementData.name || 'New Arrangement',
      slug: '',
      songIds: [song.id],
      key: arrangementData.key || 'C',
      tempo: arrangementData.tempo,
      timeSignature: arrangementData.timeSignature || '4/4',
      difficulty: arrangementData.difficulty || 'intermediate',
      tags: arrangementData.tags || [],
      description: arrangementData.description,
      capo: arrangementData.capo,
      duration: arrangementData.duration,
      createdBy: '', // Will be set by the system
    };
    
    // Store template for creation
    storeTemplateForArrangementCreation(song, tempArrangement, true);
    
    // Build the navigation URL (no arrangement ID since it's new)
    const url = buildEditorUrl();
    
    // Perform navigation
    if (options.openInNewTab) {
      window.open(url, '_blank');
    } else if (options.replace) {
      window.location.replace(url);
    } else {
      window.location.href = url;
    }
    
    return {
      success: true,
      url,
    };
    
  } catch (error) {
    console.error('Failed to navigate to create arrangement:', error);
    return {
      success: false,
      url: '',
      error: error instanceof Error ? error.message : 'Navigation failed',
    };
  }
}

/**
 * Navigate back to arrangement view after editing
 */
export function navigateToArrangementView(
  arrangementId: string,
  options: NavigationOptions = {}
): NavigationResult {
  try {
    const url = `${EDITOR_PATHS.ARRANGEMENT_VIEW}/${arrangementId}`;
    
    // Perform navigation
    if (options.openInNewTab) {
      window.open(url, '_blank');
    } else if (options.replace) {
      window.location.replace(url);
    } else {
      window.location.href = url;
    }
    
    return {
      success: true,
      url,
    };
    
  } catch (error) {
    console.error('Failed to navigate to arrangement view:', error);
    return {
      success: false,
      url: '',
      error: error instanceof Error ? error.message : 'Navigation failed',
    };
  }
}

/**
 * Navigate back to song view
 */
export function navigateToSongView(
  songId: string,
  options: NavigationOptions = {}
): NavigationResult {
  try {
    const url = `${EDITOR_PATHS.SONG_VIEW}/${songId}`;
    
    // Perform navigation
    if (options.openInNewTab) {
      window.open(url, '_blank');
    } else if (options.replace) {
      window.location.replace(url);
    } else {
      window.location.href = url;
    }
    
    return {
      success: true,
      url,
    };
    
  } catch (error) {
    console.error('Failed to navigate to song view:', error);
    return {
      success: false,
      url: '',
      error: error instanceof Error ? error.message : 'Navigation failed',
    };
  }
}

/**
 * Build editor URL with optional arrangement ID
 */
function buildEditorUrl(arrangementId?: string): string {
  let url = EDITOR_PATHS.CHORD_EDITING;
  
  if (arrangementId) {
    url += `/${arrangementId}`;
  }
  
  // Add prefill flag as query parameter
  url += '?prefill=true';
  
  return url;
}

/**
 * Create navigation workflow for arrangement management
 */
export interface ArrangementWorkflowNavigator {
  createNewArrangement: (song: Song, arrangementData: Partial<Arrangement>, options?: NavigationOptions) => NavigationResult;
  editExistingArrangement: (song: Song, arrangement: Arrangement, existingContent?: string, options?: NavigationOptions) => NavigationResult;
  openEditorWithSong: (song: Song, options?: NavigationOptions) => NavigationResult;
  returnToArrangement: (arrangementId: string, options?: NavigationOptions) => NavigationResult;
  returnToSong: (songId: string, options?: NavigationOptions) => NavigationResult;
}

/**
 * Create an arrangement workflow navigator instance
 */
export function createArrangementWorkflowNavigator(): ArrangementWorkflowNavigator {
  return {
    createNewArrangement: navigateToCreateArrangement,
    editExistingArrangement: navigateToEditArrangement,
    openEditorWithSong: (song: Song, options?: NavigationOptions) => navigateToChordProEditor(song, undefined, options),
    returnToArrangement: navigateToArrangementView,
    returnToSong: navigateToSongView,
  };
}

/**
 * Utility to handle common navigation patterns with error handling
 */
export async function safeNavigate(
  navigationFn: () => NavigationResult,
  onError?: (error: string) => void,
  onSuccess?: (url: string) => void
): Promise<boolean> {
  try {
    const result = navigationFn();
    
    if (result.success) {
      onSuccess?.(result.url);
      return true;
    } else {
      onError?.(result.error || 'Navigation failed');
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    onError?.(errorMessage);
    return false;
  }
}

/**
 * Check if current URL indicates we're in the ChordPro editor
 */
export function isInChordProEditor(): boolean {
  try {
    const currentPath = window.location.pathname;
    return currentPath.startsWith(EDITOR_PATHS.CHORD_EDITING);
  } catch {
    return false;
  }
}

/**
 * Get arrangement ID from current URL if in editor
 */
export function getArrangementIdFromUrl(): string | null {
  try {
    if (!isInChordProEditor()) {
      return null;
    }
    
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/');
    const editIndex = pathParts.indexOf('edit');
    
    if (editIndex !== -1 && editIndex + 1 < pathParts.length) {
      return pathParts[editIndex + 1];
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if current URL has prefill flag
 */
export function hasPrefillFlag(): boolean {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('prefill') === 'true';
  } catch {
    return false;
  }
}

/**
 * Build URL with query parameters
 */
export function buildUrlWithParams(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.pathname + url.search;
}

/**
 * Navigate with confirmation dialog if unsaved changes exist
 */
export function navigateWithConfirmation(
  navigationFn: () => NavigationResult,
  hasUnsavedChanges: boolean,
  confirmMessage: string = 'You have unsaved changes. Are you sure you want to leave?'
): NavigationResult | null {
  if (hasUnsavedChanges) {
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) {
      return null;
    }
  }
  
  return navigationFn();
}