/**
 * @file ChordEditorToolbar.tsx
 * @description Toolbar component for ChordEditor with common formatting actions
 */

import React from 'react';
import { cn } from '../../../shared/utils/cn';
import type { 
  EditorToolbarAction, 
  ValidationResult,
  ChordDisplayTheme 
} from '../types/chord.types';

export interface ChordEditorToolbarProps {
  /** Current validation state */
  validation?: ValidationResult;
  /** Whether content has unsaved changes */
  isDirty?: boolean;
  /** Whether undo is available */
  canUndo?: boolean;
  /** Whether redo is available */
  canRedo?: boolean;
  /** Current theme */
  theme?: ChordDisplayTheme;
  /** Whether to show validation status */
  showValidation?: boolean;
  /** Whether save button is enabled (requires onSave handler) */
  showSave?: boolean;
  /** Custom toolbar actions */
  customActions?: EditorToolbarAction[];
  /** Callback for toolbar actions */
  onAction: (action: string, payload?: unknown) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Default toolbar actions with keyboard shortcuts
 */
const DEFAULT_ACTIONS: EditorToolbarAction[] = [
  {
    id: 'undo',
    label: 'Undo',
    icon: '↶',
    shortcut: 'Ctrl+Z',
    tooltip: 'Undo last action',
    type: 'button'
  },
  {
    id: 'redo',
    label: 'Redo',
    icon: '↷',
    shortcut: 'Ctrl+Y',
    tooltip: 'Redo last undone action',
    type: 'button'
  },
  {
    id: 'separator',
    type: 'separator'
  },
  {
    id: 'insert-chord',
    label: 'Chord',
    icon: '[C]',
    shortcut: 'Ctrl+[',
    tooltip: 'Insert chord bracket',
    type: 'button'
  },
  {
    id: 'insert-directive',
    label: 'Directive',
    icon: '{}',
    shortcut: 'Ctrl+{',
    tooltip: 'Insert ChordPro directive',
    type: 'button'
  },
  {
    id: 'separator',
    type: 'separator'
  },
  {
    id: 'format',
    label: 'Format',
    icon: '⚡',
    tooltip: 'Format and clean up content',
    type: 'button'
  }
];

/**
 * ChordEditorToolbar Component
 * 
 * Provides common editing actions and validation feedback for the ChordEditor.
 * Supports custom actions, keyboard shortcuts, and theme-aware styling.
 * 
 * @example
 * ```tsx
 * <ChordEditorToolbar
 *   validation={validationResult}
 *   isDirty={hasChanges}
 *   canUndo={undoAvailable}
 *   canRedo={redoAvailable}
 *   onAction={handleToolbarAction}
 *   showSave={true}
 * />
 * ```
 */
export const ChordEditorToolbar = React.memo<ChordEditorToolbarProps>(({
  validation,
  isDirty = false,
  canUndo = false,
  canRedo = false,
  theme = 'light',
  showValidation = true,
  showSave = false,
  customActions = [],
  onAction,
  className
}) => {
  /**
   * Handle action click
   */
  const handleAction = (action: EditorToolbarAction) => {
    if (action.type === 'separator') return;
    
    // Check if action is disabled
    if ((action.id === 'undo' && !canUndo) || 
        (action.id === 'redo' && !canRedo)) {
      return;
    }
    
    onAction(action.id, action.payload);
  };

  /**
   * Get button style classes based on theme and state
   */
  const getButtonClasses = (action: EditorToolbarAction, isDisabled: boolean = false) => {
    const baseClasses = 'px-2 py-1 text-sm rounded transition-colors duration-150';
    
    if (isDisabled) {
      return cn(baseClasses, 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400');
    }
    
    switch (action.id) {
      case 'insert-chord':
        return cn(baseClasses, 'bg-blue-100 hover:bg-blue-200 text-blue-800');
      case 'insert-directive':
        return cn(baseClasses, 'bg-green-100 hover:bg-green-200 text-green-800');
      case 'format':
        return cn(baseClasses, 'bg-purple-100 hover:bg-purple-200 text-purple-800');
      case 'save':
        return cn(baseClasses, 'bg-orange-100 hover:bg-orange-200 text-orange-800');
      default:
        return cn(baseClasses, 'bg-gray-100 hover:bg-gray-200 text-gray-700');
    }
  };

  /**
   * Get theme-specific container classes
   */
  const getContainerClasses = () => {
    const baseClasses = 'editor-toolbar border-b p-2 flex items-center gap-2';
    
    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'border-gray-700 bg-gray-800');
      case 'stage':
        return cn(baseClasses, 'border-yellow-600 bg-black');
      default:
        return cn(baseClasses, 'border-gray-200 bg-white');
    }
  };

  // Combine default and custom actions
  const allActions = [...DEFAULT_ACTIONS, ...customActions];

  // Add save action if enabled
  if (showSave && isDirty) {
    allActions.push({
      id: 'save',
      label: 'Save',
      icon: '💾',
      tooltip: 'Save changes',
      type: 'button'
    });
  }

  return (
    <div className={cn(getContainerClasses(), className)}>
      {/* Action buttons */}
      {allActions.map((action, index) => {
        if (action.type === 'separator') {
          return (
            <div 
              key={`separator-${index}`}
              className="w-px h-4 bg-gray-300 mx-1" 
            />
          );
        }

        const isDisabled = (action.id === 'undo' && !canUndo) || 
                          (action.id === 'redo' && !canRedo);

        return (
          <button
            key={action.id}
            onClick={() => handleAction(action)}
            disabled={isDisabled}
            className={getButtonClasses(action, isDisabled)}
            title={`${action.tooltip || action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
            aria-label={action.label || action.id}
          >
            {action.icon}
          </button>
        );
      })}

      {/* Validation status */}
      {showValidation && validation && (
        <div className="ml-auto flex items-center gap-2">
          {validation.errors.length > 0 && (
            <div 
              className="flex items-center gap-1 text-red-600 text-sm cursor-help"
              title={`${validation.errors.length} error${validation.errors.length !== 1 ? 's' : ''}: ${validation.errors.map(e => e.message).join(', ')}`}
            >
              <span>❌</span>
              <span>{validation.errors.length}</span>
            </div>
          )}
          
          {validation.warnings && validation.warnings.length > 0 && (
            <div 
              className="flex items-center gap-1 text-yellow-600 text-sm cursor-help"
              title={`${validation.warnings.length} warning${validation.warnings.length !== 1 ? 's' : ''}: ${validation.warnings.map(w => w.message).join(', ')}`}
            >
              <span>⚠️</span>
              <span>{validation.warnings.length}</span>
            </div>
          )}
          
          {validation.valid && validation.errors.length === 0 && (
            <div 
              className="flex items-center gap-1 text-green-600 text-sm"
              title="No errors found"
            >
              <span>✅</span>
            </div>
          )}
          
          {/* Performance indicator */}
          {validation.parseTime && (
            <div 
              className="text-xs text-gray-500 ml-2"
              title={`Validation completed in ${validation.parseTime.toFixed(1)}ms`}
            >
              {validation.parseTime.toFixed(1)}ms
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ChordEditorToolbar.displayName = 'ChordEditorToolbar';