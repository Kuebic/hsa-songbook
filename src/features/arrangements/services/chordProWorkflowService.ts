/**
 * @file chordProWorkflowService.ts
 * @description Comprehensive service that integrates all ChordPro editor utilities for seamless workflow
 */

import type { Song, Arrangement } from '../../songs/types/song.types';
import {
  generateChordProTemplate,
  generateFullChordProTemplate,
  generateMinimalChordProTemplate,
  updateChordProWithArrangementMetadata,
  type ChordProTemplate,
  type TemplateGenerationOptions,
} from '../utils/chordProTemplateGenerator';

import {
  getChordProTemplate,
  hasChordProTemplate,
  clearChordProTemplate,
  storeTemplateForArrangementCreation,
  storeTemplateForArrangementEdit,
  storeTemplateForSongCreation,
  useChordProSessionData,
  shouldPrefillEditor,
  type EditorSessionData,
} from '../utils/chordProEditorIntegration';

import {
  navigateToChordProEditor,
  navigateToEditArrangement,
  navigateToCreateArrangement,
  navigateToArrangementView,
  navigateToSongView,
  createArrangementWorkflowNavigator,
  isInChordProEditor,
  getArrangementIdFromUrl,
  hasPrefillFlag,
  navigateWithConfirmation,
  type NavigationOptions,
  type NavigationResult,
  type ArrangementWorkflowNavigator,
} from '../utils/chordProNavigationUtils';

/**
 * Interface for complete workflow service
 */
export interface ChordProWorkflowService {
  // Template generation
  generateTemplate: (song: Song, arrangement?: Arrangement, options?: TemplateGenerationOptions) => ChordProTemplate;
  generateFullTemplate: (song: Song, arrangement?: Arrangement) => ChordProTemplate;
  generateMinimalTemplate: (song: Song, arrangement?: Arrangement) => ChordProTemplate;
  updateTemplateMetadata: (content: string, song: Song, arrangement: Arrangement) => string;
  
  // Session management
  storeTemplateForCreation: (song: Song, arrangement: Arrangement, includeStructure?: boolean) => void;
  storeTemplateForEditing: (song: Song, arrangement: Arrangement, existingContent?: string) => void;
  storeTemplateForSong: (song: Song) => void;
  getStoredTemplate: (arrangementId?: string) => EditorSessionData | null;
  hasStoredTemplate: (arrangementId?: string) => boolean;
  clearStoredTemplate: (arrangementId?: string) => void;
  shouldPrefill: (arrangementId?: string) => boolean;
  
  // Navigation
  navigator: ArrangementWorkflowNavigator;
  openEditor: (song: Song, arrangement?: Arrangement, options?: NavigationOptions) => NavigationResult;
  openEditorForEdit: (song: Song, arrangement: Arrangement, content?: string, options?: NavigationOptions) => NavigationResult;
  openEditorForCreation: (song: Song, arrangementData: Partial<Arrangement>, options?: NavigationOptions) => NavigationResult;
  returnToView: (type: 'arrangement' | 'song', id: string, options?: NavigationOptions) => NavigationResult;
  
  // Workflow helpers
  isInEditor: () => boolean;
  getCurrentArrangementId: () => string | null;
  hasPrefillFromUrl: () => boolean;
  safeNavigateWithConfirmation: (navFn: () => NavigationResult, hasUnsavedChanges: boolean, message?: string) => NavigationResult | null;
  
  // Session data hook
  useSessionData: (arrangementId?: string) => ReturnType<typeof useChordProSessionData>;
}

/**
 * Create the complete ChordPro workflow service
 */
export function createChordProWorkflowService(): ChordProWorkflowService {
  const navigator = createArrangementWorkflowNavigator();
  
  return {
    // Template generation
    generateTemplate: generateChordProTemplate,
    generateFullTemplate: generateFullChordProTemplate,
    generateMinimalTemplate: generateMinimalChordProTemplate,
    updateTemplateMetadata: updateChordProWithArrangementMetadata,
    
    // Session management
    storeTemplateForCreation: storeTemplateForArrangementCreation,
    storeTemplateForEditing: storeTemplateForArrangementEdit,
    storeTemplateForSong: storeTemplateForSongCreation,
    getStoredTemplate: getChordProTemplate,
    hasStoredTemplate: hasChordProTemplate,
    clearStoredTemplate: clearChordProTemplate,
    shouldPrefill: shouldPrefillEditor,
    
    // Navigation
    navigator,
    openEditor: navigateToChordProEditor,
    openEditorForEdit: navigateToEditArrangement,
    openEditorForCreation: navigateToCreateArrangement,
    returnToView: (type, id, options) => {
      return type === 'arrangement' 
        ? navigateToArrangementView(id, options)
        : navigateToSongView(id, options);
    },
    
    // Workflow helpers
    isInEditor: isInChordProEditor,
    getCurrentArrangementId: getArrangementIdFromUrl,
    hasPrefillFromUrl: hasPrefillFlag,
    safeNavigateWithConfirmation: navigateWithConfirmation,
    
    // Session data hook
    useSessionData: useChordProSessionData,
  };
}

/**
 * Singleton instance of the workflow service
 */
export const chordProWorkflowService = createChordProWorkflowService();

/**
 * Specific workflow implementations for common use cases
 */
export class ChordProWorkflowImplementations {
  
  /**
   * Complete workflow for creating a new arrangement
   */
  static async createNewArrangementWorkflow(
    song: Song,
    arrangementData: Partial<Arrangement>,
    options: { includeFullStructure?: boolean; navigationOptions?: NavigationOptions } = {}
  ): Promise<NavigationResult> {
    try {
      // Generate template data
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
      
      // Store template
      chordProWorkflowService.storeTemplateForCreation(
        song, 
        tempArrangement, 
        options.includeFullStructure ?? true
      );
      
      // Navigate to editor
      return chordProWorkflowService.openEditorForCreation(
        song, 
        arrangementData, 
        options.navigationOptions
      );
      
    } catch (error) {
      console.error('Failed to create new arrangement workflow:', error);
      return {
        success: false,
        url: '',
        error: error instanceof Error ? error.message : 'Workflow failed',
      };
    }
  }
  
  /**
   * Complete workflow for editing an existing arrangement
   */
  static async editExistingArrangementWorkflow(
    song: Song,
    arrangement: Arrangement,
    existingContent?: string,
    options: { navigationOptions?: NavigationOptions } = {}
  ): Promise<NavigationResult> {
    try {
      // Store template for editing
      chordProWorkflowService.storeTemplateForEditing(song, arrangement, existingContent);
      
      // Navigate to editor
      return chordProWorkflowService.openEditorForEdit(
        song, 
        arrangement, 
        existingContent, 
        options.navigationOptions
      );
      
    } catch (error) {
      console.error('Failed to edit arrangement workflow:', error);
      return {
        success: false,
        url: '',
        error: error instanceof Error ? error.message : 'Workflow failed',
      };
    }
  }
  
  /**
   * Complete workflow for quick song-to-editor transition
   */
  static async quickSongEditWorkflow(
    song: Song,
    options: { navigationOptions?: NavigationOptions } = {}
  ): Promise<NavigationResult> {
    try {
      // Store basic song template
      chordProWorkflowService.storeTemplateForSong(song);
      
      // Navigate to editor
      return chordProWorkflowService.openEditor(song, undefined, options.navigationOptions);
      
    } catch (error) {
      console.error('Failed to quick song edit workflow:', error);
      return {
        success: false,
        url: '',
        error: error instanceof Error ? error.message : 'Workflow failed',
      };
    }
  }
  
  /**
   * Handle editor initialization with stored template
   */
  static initializeEditorWithTemplate(arrangementId?: string): {
    template: ChordProTemplate | null;
    shouldPrefill: boolean;
    metadata: ReturnType<typeof useChordProSessionData>['metadata'];
    clearSession: () => void;
  } {
    const sessionData = chordProWorkflowService.useSessionData(arrangementId);
    
    return {
      template: sessionData.template?.template || null,
      shouldPrefill: sessionData.prefillFlag,
      metadata: sessionData.metadata,
      clearSession: () => chordProWorkflowService.clearStoredTemplate(arrangementId),
    };
  }
  
  /**
   * Handle safe navigation with unsaved changes
   */
  static handleExitWithUnsavedChanges(
    navigationFn: () => NavigationResult,
    hasUnsavedChanges: boolean,
    customMessage?: string
  ): NavigationResult | null {
    const message = customMessage || 
      'You have unsaved changes to your chord sheet. Are you sure you want to leave? Your changes will be lost.';
      
    return chordProWorkflowService.safeNavigateWithConfirmation(
      navigationFn,
      hasUnsavedChanges,
      message
    );
  }
}

/**
 * React hook for using the ChordPro workflow service
 */
export function useChordProWorkflow() {
  return {
    service: chordProWorkflowService,
    workflows: ChordProWorkflowImplementations,
    
    // Convenience methods
    createArrangement: ChordProWorkflowImplementations.createNewArrangementWorkflow,
    editArrangement: ChordProWorkflowImplementations.editExistingArrangementWorkflow,
    quickEdit: ChordProWorkflowImplementations.quickSongEditWorkflow,
    initializeEditor: ChordProWorkflowImplementations.initializeEditorWithTemplate,
    handleExit: ChordProWorkflowImplementations.handleExitWithUnsavedChanges,
  };
}

/**
 * Export default service for easy importing
 */
export default chordProWorkflowService;