/**
 * @file ChordEditorToolbar.tsx
 * @description Toolbar component for ChordPro editor with formatting actions
 */

import React from 'react';
import { cn } from '../../../../lib/utils';
import type { ToolbarProps, ToolbarAction } from '../../types/editor.types';

// Icon components (simple SVG icons)
const UndoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const RedoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
  </svg>
);

const TransposeUpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
  </svg>
);

const TransposeDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
  </svg>
);

const ChordIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);

const DirectiveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const FormatIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

// Settings icon removed as it's not currently used

export const ChordEditorToolbar: React.FC<ToolbarProps> = ({
  onAction,
  canUndo,
  canRedo,
  isDirty,
  onSave,
  className,
}) => {
  // Define toolbar actions
  const actions: ToolbarAction[] = [
    {
      id: 'undo',
      label: 'Undo',
      icon: <UndoIcon />,
      shortcut: 'Ctrl+Z',
      action: (editor) => editor.undo(),
      isEnabled: () => canUndo,
    },
    {
      id: 'redo',
      label: 'Redo',
      icon: <RedoIcon />,
      shortcut: 'Ctrl+Y',
      action: (editor) => editor.redo(),
      isEnabled: () => canRedo,
    },
    {
      id: 'separator-1',
      label: '',
      icon: null,
      action: () => {},
    },
    {
      id: 'save',
      label: 'Save',
      icon: <SaveIcon />,
      shortcut: 'Ctrl+S',
      action: (editor) => editor.save(),
      isEnabled: () => isDirty && !!onSave,
    },
    {
      id: 'separator-2',
      label: '',
      icon: null,
      action: () => {},
    },
    {
      id: 'transpose-up',
      label: 'Transpose Up',
      icon: <TransposeUpIcon />,
      action: (editor) => editor.transpose(1),
    },
    {
      id: 'transpose-down',
      label: 'Transpose Down',
      icon: <TransposeDownIcon />,
      action: (editor) => editor.transpose(-1),
    },
    {
      id: 'separator-3',
      label: '',
      icon: null,
      action: () => {},
    },
    {
      id: 'insert-chord',
      label: 'Insert Chord',
      icon: <ChordIcon />,
      shortcut: 'Ctrl+K',
      action: (editor) => editor.insertChord(),
    },
    {
      id: 'insert-directive',
      label: 'Insert Directive',
      icon: <DirectiveIcon />,
      shortcut: 'Ctrl+D',
      action: (editor) => editor.insertDirective('{title: }'),
    },
    {
      id: 'separator-4',
      label: '',
      icon: null,
      action: () => {},
    },
    {
      id: 'format',
      label: 'Format',
      icon: <FormatIcon />,
      shortcut: 'Ctrl+Shift+F',
      action: (editor) => editor.format(),
    },
  ];
  
  const isActionEnabled = (actionId: string): boolean => {
    const action = actions.find((a) => a.id === actionId);
    if (!action?.isEnabled) return true;
    return action.isEnabled({ content: '', cursorPosition: 0, selectionRange: [0, 0], isDirty, history: { past: [], future: [] } });
  };
  
  return (
    <div
      className={cn(
        'flex items-center gap-1 p-2 border-b bg-white',
        className
      )}
      role="toolbar"
      aria-label="ChordPro editor toolbar"
    >
      {actions.map((action) => {
        // Render separator
        if (action.id.startsWith('separator')) {
          return (
            <div
              key={action.id}
              className="w-px h-6 bg-gray-300 mx-1"
              role="separator"
            />
          );
        }
        
        // Render action button
        const enabled = isActionEnabled(action.id);
        
        return (
          <button
            key={action.id}
            onClick={() => onAction(action)}
            disabled={!enabled}
            title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
            className={cn(
              'p-2 rounded transition-colors',
              enabled
                ? 'hover:bg-gray-100 text-gray-700'
                : 'text-gray-400 cursor-not-allowed'
            )}
            aria-label={action.label}
          >
            {action.icon}
          </button>
        );
      })}
      
      {/* Status indicator */}
      {isDirty && (
        <span className="ml-auto text-sm text-gray-500 px-2">
          Unsaved changes
        </span>
      )}
    </div>
  );
};