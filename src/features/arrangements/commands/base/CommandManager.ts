import type { EditorCommand, EditorContext, CommandResult } from '../../types/command.types';

export interface CommandManagerOptions {
  /**
   * Maximum number of commands to keep in history
   * @default 100
   */
  maxHistorySize?: number;
  
  /**
   * Time window in milliseconds for merging consecutive commands
   * @default 500
   */
  mergeWindow?: number;
}

export class CommandManager {
  private undoStack: EditorCommand[] = [];
  private redoStack: EditorCommand[] = [];
  private maxHistorySize: number;
  private mergeWindow: number;
  
  constructor(options: CommandManagerOptions = {}) {
    this.maxHistorySize = options.maxHistorySize ?? 100;
    this.mergeWindow = options.mergeWindow ?? 500;
  }
  
  /**
   * Execute a command and add it to history
   */
  async execute(command: EditorCommand, context: EditorContext): Promise<CommandResult> {
    // Check for merge opportunity with last command
    if (this.undoStack.length > 0) {
      const lastCommand = this.undoStack[this.undoStack.length - 1];
      
      // Check if we can merge with the last command
      if (
        lastCommand.canMerge?.(command) &&
        command.timestamp - lastCommand.timestamp < this.mergeWindow
      ) {
        // Merge commands
        this.undoStack[this.undoStack.length - 1] = lastCommand.merge!(command);
        // Execute the merged command
        return await this.undoStack[this.undoStack.length - 1].execute(context);
      }
    }
    
    // Execute the command
    const result = await command.execute(context);
    
    if (result.success) {
      // Add to undo stack
      this.undoStack.push(command);
      // Clear redo stack on new command
      this.redoStack = [];
      // Enforce history limit
      this.enforceHistoryLimit();
    }
    
    return result;
  }
  
  /**
   * Undo the last command
   */
  async undo(context: EditorContext): Promise<CommandResult> {
    const command = this.undoStack.pop();
    if (!command) {
      return { success: false, error: new Error('Nothing to undo') };
    }
    
    const result = await command.undo(context);
    
    if (result.success) {
      this.redoStack.push(command);
    } else {
      // If undo failed, put the command back
      this.undoStack.push(command);
    }
    
    return result;
  }
  
  /**
   * Redo the last undone command
   */
  async redo(context: EditorContext): Promise<CommandResult> {
    const command = this.redoStack.pop();
    if (!command) {
      return { success: false, error: new Error('Nothing to redo') };
    }
    
    const result = await command.execute(context);
    
    if (result.success) {
      this.undoStack.push(command);
    } else {
      // If redo failed, put the command back
      this.redoStack.push(command);
    }
    
    return result;
  }
  
  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  
  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  
  /**
   * Get the current history for persistence
   */
  getHistory(): EditorCommand[] {
    return [...this.undoStack];
  }
  
  /**
   * Restore history from persistence
   */
  restoreHistory(history: EditorCommand[]): void {
    this.undoStack = history.slice(-this.maxHistorySize);
    this.redoStack = [];
  }
  
  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
  
  /**
   * Get history size info
   */
  getHistoryInfo(): { undoCount: number; redoCount: number; maxSize: number } {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      maxSize: this.maxHistorySize
    };
  }
  
  /**
   * Update configuration options
   */
  updateOptions(options: Partial<CommandManagerOptions>): void {
    if (options.maxHistorySize !== undefined) {
      this.maxHistorySize = options.maxHistorySize;
      this.enforceHistoryLimit();
    }
    if (options.mergeWindow !== undefined) {
      this.mergeWindow = options.mergeWindow;
    }
  }
  
  /**
   * Get current configuration
   */
  getOptions(): Required<CommandManagerOptions> {
    return {
      maxHistorySize: this.maxHistorySize,
      mergeWindow: this.mergeWindow
    };
  }
  
  /**
   * Enforce the maximum history size
   */
  private enforceHistoryLimit(): void {
    if (this.undoStack.length > this.maxHistorySize) {
      // Keep only the most recent commands
      this.undoStack = this.undoStack.slice(-this.maxHistorySize);
    }
  }
  
  /**
   * Serialize history for storage
   */
  serializeHistory(): string {
    const serializable = this.undoStack.map(cmd => {
      if (cmd.serialize) {
        return {
          type: cmd.type,
          data: cmd.serialize()
        };
      }
      return null;
    }).filter(Boolean);
    
    return JSON.stringify(serializable);
  }
}