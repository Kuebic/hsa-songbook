import type { RefObject } from 'react';

// Command types as const assertion pattern (compatible with erasableSyntaxOnly)
export const CommandType = {
  INSERT_TEXT: 'INSERT_TEXT',
  DELETE_TEXT: 'DELETE_TEXT',
  REPLACE_TEXT: 'REPLACE_TEXT',
  INSERT_DIRECTIVE: 'INSERT_DIRECTIVE',
  UPDATE_DIRECTIVE: 'UPDATE_DIRECTIVE',
  TRANSPOSE: 'TRANSPOSE',
  FORMAT: 'FORMAT'
} as const;

export type CommandType = typeof CommandType[keyof typeof CommandType];

// Editor context passed to commands
export interface EditorContext {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  content: string;
  cursorPosition: number;
  selectionRange: [number, number];
}

// Result of command execution
export interface CommandResult {
  success: boolean;
  content?: string;
  cursorPosition?: number;
  error?: Error;
}

// Base command interface
export interface EditorCommand {
  id: string;
  timestamp: number;
  type: CommandType;
  
  execute(context: EditorContext): Promise<CommandResult>;
  undo(context: EditorContext): Promise<CommandResult>;
  
  // Optional for advanced features
  canMerge?(other: EditorCommand): boolean;
  merge?(other: EditorCommand): EditorCommand;
  serialize?(): string;
  deserialize?(data: string): EditorCommand;
}

// Editor state for tracking
export interface EditorState {
  content: string;
  cursorPosition: number;
  selectionRange: [number, number];
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

// Command history state
export interface CommandHistory {
  undoStack: EditorCommand[];
  redoStack: EditorCommand[];
  maxSize: number;
}