import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandManager } from '../CommandManager';
import { InsertTextCommand } from '../../text/InsertTextCommand';
import { DeleteTextCommand } from '../../text/DeleteTextCommand';
import { ReplaceTextCommand } from '../../text/ReplaceTextCommand';
import { CommandType } from '../../../types/command.types';
import type { EditorContext, EditorCommand, CommandResult } from '../../../types/command.types';

// Mock textarea element
class MockTextAreaElement {
  value = '';
  selectionStart = 0;
  selectionEnd = 0;
  
  setSelectionRange(start: number, end: number) {
    this.selectionStart = start;
    this.selectionEnd = end;
  }
  
  dispatchEvent = vi.fn();
}

// Mock command for testing
class MockCommand implements EditorCommand {
  id = 'mock-id';
  timestamp = Date.now();
  type = CommandType.INSERT_TEXT;
  executeResult: CommandResult = { success: true };
  undoResult: CommandResult = { success: true };
  
  shouldFail: boolean;
  canMergeWith: EditorCommand | null;
  
  constructor(
    shouldFail = false,
    canMergeWith: EditorCommand | null = null
  ) {
    this.shouldFail = shouldFail;
    this.canMergeWith = canMergeWith;
  }
  
  async execute(): Promise<CommandResult> {
    if (this.shouldFail) {
      return { success: false, error: new Error('Execute failed') };
    }
    return this.executeResult;
  }
  
  async undo(): Promise<CommandResult> {
    if (this.shouldFail) {
      return { success: false, error: new Error('Undo failed') };
    }
    return this.undoResult;
  }
  
  canMerge(other: EditorCommand): boolean {
    return this.canMergeWith === other;
  }
  
  merge(other: EditorCommand): EditorCommand {
    this.timestamp = other.timestamp;
    return this;
  }
  
  serialize(): string {
    return JSON.stringify({ id: this.id, timestamp: this.timestamp });
  }
}

describe('CommandManager', () => {
  let manager: CommandManager;
  let mockTextarea: MockTextAreaElement;
  let context: EditorContext;
  
  beforeEach(() => {
    manager = new CommandManager();
    mockTextarea = new MockTextAreaElement();
    context = {
      textareaRef: { current: mockTextarea as unknown as HTMLTextAreaElement },
      content: 'Hello world',
      cursorPosition: 5,
      selectionRange: [5, 5]
    };
    vi.clearAllMocks();
  });
  
  describe('constructor', () => {
    it('should initialize with empty stacks', () => {
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
      expect(manager.getHistoryInfo().undoCount).toBe(0);
      expect(manager.getHistoryInfo().redoCount).toBe(0);
    });
    
    it('should set default history limits', () => {
      const info = manager.getHistoryInfo();
      expect(info.maxSize).toBe(100);
    });
  });
  
  describe('execute', () => {
    it('should execute a command and add to undo stack', async () => {
      const command = new MockCommand();
      
      const result = await manager.execute(command, context);
      
      expect(result.success).toBe(true);
      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);
      expect(manager.getHistoryInfo().undoCount).toBe(1);
    });
    
    it('should not add failed commands to history', async () => {
      const command = new MockCommand(true); // Should fail
      
      const result = await manager.execute(command, context);
      
      expect(result.success).toBe(false);
      expect(manager.canUndo()).toBe(false);
      expect(manager.getHistoryInfo().undoCount).toBe(0);
    });
    
    it('should clear redo stack when executing new command', async () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();
      const command3 = new MockCommand();
      
      // Execute two commands
      await manager.execute(command1, context);
      await manager.execute(command2, context);
      
      // Undo one to have redo available
      await manager.undo(context);
      expect(manager.canRedo()).toBe(true);
      
      // Execute new command should clear redo
      await manager.execute(command3, context);
      expect(manager.canRedo()).toBe(false);
    });
    
    it('should merge compatible commands within merge window', async () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();
      command1.canMergeWith = command2;
      
      // Execute first command
      await manager.execute(command1, context);
      expect(manager.getHistoryInfo().undoCount).toBe(1);
      
      // Execute second command immediately (within merge window)
      await manager.execute(command2, context);
      expect(manager.getHistoryInfo().undoCount).toBe(1); // Should be merged
    });
    
    it('should not merge commands outside merge window', async () => {
      vi.useFakeTimers();
      const startTime = Date.now();
      vi.setSystemTime(startTime);
      
      const command1 = new MockCommand();
      command1.timestamp = startTime;
      
      await manager.execute(command1, context);
      
      // Simulate time passing beyond merge window
      vi.advanceTimersByTime(1000); // Advance beyond 500ms merge window
      vi.setSystemTime(startTime + 1000);
      
      const command2 = new MockCommand();
      command2.timestamp = startTime + 1000;
      command1.canMergeWith = command2;
      
      await manager.execute(command2, context);
      
      expect(manager.getHistoryInfo().undoCount).toBe(2); // Should not be merged
      
      vi.useRealTimers();
    });
    
    it('should not merge incompatible commands', async () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();
      // Don't set canMergeWith, so they can't merge
      
      await manager.execute(command1, context);
      await manager.execute(command2, context);
      
      expect(manager.getHistoryInfo().undoCount).toBe(2);
    });
  });
  
  describe('undo', () => {
    it('should undo the last command', async () => {
      const command = new MockCommand();
      command.undoResult = { success: true, content: 'undone' };
      
      await manager.execute(command, context);
      
      const result = await manager.undo(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('undone');
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(true);
    });
    
    it('should move command to redo stack on successful undo', async () => {
      const command = new MockCommand();
      
      await manager.execute(command, context);
      await manager.undo(context);
      
      expect(manager.getHistoryInfo().undoCount).toBe(0);
      expect(manager.getHistoryInfo().redoCount).toBe(1);
    });
    
    it('should return error when nothing to undo', async () => {
      const result = await manager.undo(context);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Nothing to undo');
    });
    
    it('should keep command in undo stack if undo fails', async () => {
      const command = new MockCommand();
      command.undoResult = { success: false, error: new Error('Undo failed') };
      
      await manager.execute(command, context);
      const result = await manager.undo(context);
      
      expect(result.success).toBe(false);
      expect(manager.canUndo()).toBe(true); // Command should still be in undo stack
      expect(manager.canRedo()).toBe(false);
    });
    
    it('should handle multiple undos correctly', async () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();
      const command3 = new MockCommand();
      
      await manager.execute(command1, context);
      await manager.execute(command2, context);
      await manager.execute(command3, context);
      
      expect(manager.getHistoryInfo().undoCount).toBe(3);
      
      await manager.undo(context);
      expect(manager.getHistoryInfo().undoCount).toBe(2);
      expect(manager.getHistoryInfo().redoCount).toBe(1);
      
      await manager.undo(context);
      expect(manager.getHistoryInfo().undoCount).toBe(1);
      expect(manager.getHistoryInfo().redoCount).toBe(2);
    });
  });
  
  describe('redo', () => {
    it('should redo the last undone command', async () => {
      const command = new MockCommand();
      command.executeResult = { success: true, content: 'redone' };
      
      await manager.execute(command, context);
      await manager.undo(context);
      
      const result = await manager.redo(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('redone');
      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);
    });
    
    it('should move command back to undo stack on successful redo', async () => {
      const command = new MockCommand();
      
      await manager.execute(command, context);
      await manager.undo(context);
      await manager.redo(context);
      
      expect(manager.getHistoryInfo().undoCount).toBe(1);
      expect(manager.getHistoryInfo().redoCount).toBe(0);
    });
    
    it('should return error when nothing to redo', async () => {
      const result = await manager.redo(context);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Nothing to redo');
    });
    
    it('should keep command in redo stack if redo fails', async () => {
      const command = new MockCommand();
      let executeCallCount = 0;
      
      // Override execute to succeed first time, fail second time
      command.execute = async (): Promise<CommandResult> => {
        executeCallCount++;
        if (executeCallCount === 1) {
          return { success: true };
        }
        return { success: false, error: new Error('Redo failed') };
      };
      
      await manager.execute(command, context);
      await manager.undo(context);
      
      const result = await manager.redo(context);
      
      expect(result.success).toBe(false);
      expect(manager.canRedo()).toBe(true); // Command should still be in redo stack
      expect(manager.canUndo()).toBe(false);
    });
    
    it('should handle multiple redos correctly', async () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();
      
      await manager.execute(command1, context);
      await manager.execute(command2, context);
      
      // Undo both
      await manager.undo(context);
      await manager.undo(context);
      
      expect(manager.getHistoryInfo().undoCount).toBe(0);
      expect(manager.getHistoryInfo().redoCount).toBe(2);
      
      // Redo both
      await manager.redo(context);
      expect(manager.getHistoryInfo().undoCount).toBe(1);
      expect(manager.getHistoryInfo().redoCount).toBe(1);
      
      await manager.redo(context);
      expect(manager.getHistoryInfo().undoCount).toBe(2);
      expect(manager.getHistoryInfo().redoCount).toBe(0);
    });
  });
  
  describe('history management', () => {
    it('should enforce maximum history size', async () => {
      // Create more commands than the max history size (100)
      const commands = Array.from({ length: 105 }, () => new MockCommand());
      
      // Execute all commands
      for (const command of commands) {
        await manager.execute(command, context);
      }
      
      const info = manager.getHistoryInfo();
      expect(info.undoCount).toBe(100); // Should be limited to max size
      expect(info.maxSize).toBe(100);
    });
    
    it('should provide correct history info', () => {
      const info = manager.getHistoryInfo();
      
      expect(info).toHaveProperty('undoCount');
      expect(info).toHaveProperty('redoCount');
      expect(info).toHaveProperty('maxSize');
      expect(typeof info.undoCount).toBe('number');
      expect(typeof info.redoCount).toBe('number');
      expect(typeof info.maxSize).toBe('number');
    });
    
    it('should get and restore history', async () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();
      
      await manager.execute(command1, context);
      await manager.execute(command2, context);
      
      const history = manager.getHistory();
      expect(history.length).toBe(2);
      
      // Clear and restore
      manager.clear();
      expect(manager.getHistoryInfo().undoCount).toBe(0);
      
      manager.restoreHistory(history);
      expect(manager.getHistoryInfo().undoCount).toBe(2);
      expect(manager.getHistoryInfo().redoCount).toBe(0); // Redo should be cleared
    });
    
    it('should limit restored history to max size', () => {
      const largeHistory = Array.from({ length: 150 }, () => new MockCommand());
      
      manager.restoreHistory(largeHistory);
      
      expect(manager.getHistoryInfo().undoCount).toBe(100); // Should be limited
    });
    
    it('should clear all history', async () => {
      const command = new MockCommand();
      
      await manager.execute(command, context);
      await manager.undo(context);
      
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(true);
      
      manager.clear();
      
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
      expect(manager.getHistoryInfo().undoCount).toBe(0);
      expect(manager.getHistoryInfo().redoCount).toBe(0);
    });
  });
  
  describe('serialization', () => {
    it('should serialize history to JSON string', async () => {
      const command1 = new MockCommand();
      const command2 = new MockCommand();
      
      await manager.execute(command1, context);
      await manager.execute(command2, context);
      
      const serialized = manager.serializeHistory();
      
      expect(typeof serialized).toBe('string');
      
      const parsed = JSON.parse(serialized);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });
    
    it('should handle commands without serialize method', async () => {
      const commandWithoutSerialize = {
        id: 'test',
        timestamp: Date.now(),
        type: CommandType.INSERT_TEXT,
        execute: vi.fn().mockResolvedValue({ success: true }),
        undo: vi.fn().mockResolvedValue({ success: true })
      };
      
      await manager.execute(commandWithoutSerialize, context);
      
      const serialized = manager.serializeHistory();
      const parsed = JSON.parse(serialized);
      
      expect(parsed.length).toBe(0); // Commands without serialize should be filtered out
    });
    
    it('should include command type and data in serialization', async () => {
      const command = new MockCommand();
      
      await manager.execute(command, context);
      
      const serialized = manager.serializeHistory();
      const parsed = JSON.parse(serialized);
      
      expect(parsed[0]).toHaveProperty('type');
      expect(parsed[0]).toHaveProperty('data');
      expect(parsed[0].type).toBe(CommandType.INSERT_TEXT);
    });
  });
  
  describe('integration with real commands', () => {
    it('should work with InsertTextCommand', async () => {
      mockTextarea.value = 'Hello world';
      const command = new InsertTextCommand(5, ' beautiful');
      
      const result = await manager.execute(command, context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello beautiful world');
      expect(manager.canUndo()).toBe(true);
    });
    
    it('should work with DeleteTextCommand', async () => {
      mockTextarea.value = 'Hello world';
      const command = new DeleteTextCommand(5, 6);
      
      const result = await manager.execute(command, context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello');
      expect(manager.canUndo()).toBe(true);
    });
    
    it('should work with ReplaceTextCommand', async () => {
      mockTextarea.value = 'Hello world';
      const command = new ReplaceTextCommand(6, 5, 'universe');
      
      const result = await manager.execute(command, context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello universe');
      expect(manager.canUndo()).toBe(true);
    });
    
    it('should merge consecutive InsertTextCommands', async () => {
      mockTextarea.value = 'Hello';
      
      const command1 = new InsertTextCommand(5, ' ');
      const command2 = new InsertTextCommand(6, 'w');
      const command3 = new InsertTextCommand(7, 'o');
      
      await manager.execute(command1, context);
      await manager.execute(command2, context);
      await manager.execute(command3, context);
      
      // Should be merged into fewer commands
      expect(manager.getHistoryInfo().undoCount).toBeLessThan(3);
    });
    
    it('should handle undo/redo cycle with real commands', async () => {
      mockTextarea.value = 'Hello world';
      const insertCommand = new InsertTextCommand(5, ' beautiful');
      const deleteCommand = new DeleteTextCommand(5, 10); // Delete " beautiful" (10 chars)
      
      // Execute insert
      await manager.execute(insertCommand, context);
      expect(mockTextarea.value).toBe('Hello beautiful world');
      
      // Execute delete
      await manager.execute(deleteCommand, context);
      expect(mockTextarea.value).toBe('Hello world');
      
      // Undo delete
      await manager.undo(context);
      expect(mockTextarea.value).toBe('Hello beautiful world');
      
      // Undo insert
      await manager.undo(context);
      expect(mockTextarea.value).toBe('Hello world');
      
      // Redo insert
      await manager.redo(context);
      expect(mockTextarea.value).toBe('Hello beautiful world');
      
      // Redo delete
      await manager.redo(context);
      expect(mockTextarea.value).toBe('Hello world');
    });
  });
  
  describe('edge cases', () => {
    it('should handle rapid command execution', async () => {
      const commands = Array.from({ length: 10 }, () => new MockCommand());
      
      // Execute all commands rapidly
      const results = await Promise.all(
        commands.map(cmd => manager.execute(cmd, context))
      );
      
      // All should succeed
      expect(results.every(r => r.success)).toBe(true);
      expect(manager.getHistoryInfo().undoCount).toBe(10);
    });
    
    it('should handle mixed success/failure commands', async () => {
      const successCommand = new MockCommand(false);
      const failCommand = new MockCommand(true);
      
      await manager.execute(successCommand, context);
      await manager.execute(failCommand, context);
      await manager.execute(successCommand, context);
      
      expect(manager.getHistoryInfo().undoCount).toBe(2); // Only successful commands
    });
    
    it('should handle empty history operations gracefully', async () => {
      // Try operations on empty history
      expect(await manager.undo(context)).toEqual({
        success: false,
        error: expect.any(Error)
      });
      
      expect(await manager.redo(context)).toEqual({
        success: false,
        error: expect.any(Error)
      });
      
      expect(manager.getHistory()).toEqual([]);
      expect(manager.serializeHistory()).toBe('[]');
    });
  });
});