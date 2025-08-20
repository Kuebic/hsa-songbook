/**
 * @file index.ts
 * @description Main integration module for ChordPro editor utilities
 */

// Re-export all utilities for easy access
export * from './chordProTemplateGenerator';
export * from './chordProEditorIntegration';
export * from './chordProNavigationUtils';
export * from './chordProUtils';

// Create consolidated interface for the entire integration
export type {
  TemplateGenerationOptions,
  ChordProTemplate,
} from './chordProTemplateGenerator';

export type {
  EditorSessionData,
  ChordProEditorSessionService,
} from './chordProEditorIntegration';

export type {
  NavigationOptions,
  NavigationResult,
  ArrangementWorkflowNavigator,
} from './chordProNavigationUtils';