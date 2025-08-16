import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InsertTextCommand } from '../InsertTextCommand';
import { CommandType } from '../../../types/command.types';
import type { EditorContext } from '../../../types/command.types';

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

describe('InsertTextCommand', () => {
  let mockTextarea: MockTextAreaElement;
  let context: EditorContext;
  
  beforeEach(() => {
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
    it('should initialize with correct type and properties', () => {
      const command = new InsertTextCommand(5, ' beautiful');
      
      expect(command.type).toBe(CommandType.INSERT_TEXT);
      expect(command.id).toBeDefined();
      expect(command.timestamp).toBeDefined();
      expect(typeof command.timestamp).toBe('number');
    });
  });
  
  describe('execute', () => {
    it('should insert text at the specified position', async () => {
      mockTextarea.value = 'Hello world';
      const command = new InsertTextCommand(5, ' beautiful');
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello beautiful world');
      expect(result.cursorPosition).toBe(15); // 5 + ' beautiful'.length
      expect(mockTextarea.value).toBe('Hello beautiful world');
      expect(mockTextarea.selectionStart).toBe(15);
      expect(mockTextarea.selectionEnd).toBe(15);
    });
    
    it('should insert text at the beginning', async () => {
      mockTextarea.value = 'world';
      const command = new InsertTextCommand(0, 'Hello ');
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello world');
      expect(result.cursorPosition).toBe(6);
    });
    
    it('should insert text at the end', async () => {
      mockTextarea.value = 'Hello';
      const command = new InsertTextCommand(5, ' world');
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello world');
      expect(result.cursorPosition).toBe(11);
    });
    
    it('should handle empty text insertion', async () => {
      mockTextarea.value = 'Hello world';
      const command = new InsertTextCommand(5, '');
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello world');
      expect(result.cursorPosition).toBe(5);
    });
    
    it('should dispatch input event for React', async () => {
      mockTextarea.value = 'Hello world';
      const command = new InsertTextCommand(5, ' beautiful');
      
      await command.execute(context);
      
      expect(mockTextarea.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'input',
          bubbles: true
        })
      );
    });
    
    it('should handle missing textarea reference', async () => {
      const contextWithoutTextarea = {
        ...context,
        textareaRef: { current: null }
      };
      const command = new InsertTextCommand(5, ' beautiful');
      
      const result = await command.execute(contextWithoutTextarea);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Textarea reference not available');
    });
    
    it('should handle exceptions gracefully', async () => {
      // Mock textarea with initial value that throws on property access during execution
      const throwingTextarea = {
        _value: 'Hello world',
        get value() { return this._value; },
        set value(val: string) { throw new Error('Textarea error'); },
        selectionStart: 0,
        selectionEnd: 0,
        setSelectionRange: vi.fn(),
        dispatchEvent: vi.fn()
      };
      const contextWithThrowingTextarea = {
        ...context,
        textareaRef: { current: throwingTextarea as unknown as HTMLTextAreaElement }
      };
      const command = new InsertTextCommand(5, ' beautiful');
      
      const result = await command.execute(contextWithThrowingTextarea);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Textarea error');
    });
  });
  
  describe('undo', () => {
    it('should restore previous content after execute', async () => {
      mockTextarea.value = 'Hello world';
      const command = new InsertTextCommand(5, ' beautiful');
      
      // Execute first
      await command.execute(context);
      expect(mockTextarea.value).toBe('Hello beautiful world');
      
      // Then undo
      const undoResult = await command.undo(context);
      
      expect(undoResult.success).toBe(true);
      expect(undoResult.content).toBe('Hello world');
      expect(undoResult.cursorPosition).toBe(5);
      expect(mockTextarea.value).toBe('Hello world');
      expect(mockTextarea.selectionStart).toBe(5);
      expect(mockTextarea.selectionEnd).toBe(5);
    });
    
    it('should handle undo without previous execute', async () => {
      const command = new InsertTextCommand(5, ' beautiful');
      
      const result = await command.undo(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe(''); // previousContent is empty by default
      expect(result.cursorPosition).toBe(5);
    });
    
    it('should handle missing textarea reference in undo', async () => {
      const contextWithoutTextarea = {
        ...context,
        textareaRef: { current: null }
      };
      const command = new InsertTextCommand(5, ' beautiful');
      
      const result = await command.undo(contextWithoutTextarea);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Textarea reference not available');
    });
    
    it('should handle exceptions in undo gracefully', async () => {
      const command = new InsertTextCommand(5, ' beautiful');
      
      // Execute first to set previousContent
      await command.execute(context);
      
      // Mock textarea that throws on value assignment
      const throwingTextarea = {
        ...mockTextarea,
        set value(val: string) {
          throw new Error('Undo error');
        }
      };
      const contextWithThrowingTextarea = {
        ...context,
        textareaRef: { current: throwingTextarea as unknown as HTMLTextAreaElement }
      };
      
      const result = await command.undo(contextWithThrowingTextarea);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Undo error');
    });
  });
  
  describe('canMerge', () => {
    it('should merge with consecutive InsertTextCommand for single characters', () => {
      const command1 = new InsertTextCommand(5, 'a');
      const command2 = new InsertTextCommand(6, 'b');
      
      expect(command1.canMerge(command2)).toBe(true);
    });
    
    it('should not merge non-consecutive insertions', () => {
      const command1 = new InsertTextCommand(5, 'a');
      const command2 = new InsertTextCommand(8, 'b'); // Gap of 2
      
      expect(command1.canMerge(command2)).toBe(false);
    });
    
    it('should not merge multi-character insertions', () => {
      const command1 = new InsertTextCommand(5, 'hello');
      const command2 = new InsertTextCommand(10, 'world');
      
      expect(command1.canMerge(command2)).toBe(false);
    });
    
    it('should not merge with different command types', () => {
      const insertCommand = new InsertTextCommand(5, 'a');
      const otherCommand = {
        type: CommandType.DELETE_TEXT,
        id: 'test',
        timestamp: Date.now(),
        execute: vi.fn(),
        undo: vi.fn()
      };
      
      expect(insertCommand.canMerge(otherCommand)).toBe(false);
    });
    
    it('should not merge when one command is multi-character', () => {
      const command1 = new InsertTextCommand(5, 'ab'); // Multi-character
      const command2 = new InsertTextCommand(7, 'c');
      
      expect(command1.canMerge(command2)).toBe(false);
    });
    
    it('should not merge when both commands are multi-character', () => {
      const command1 = new InsertTextCommand(5, 'ab');
      const command2 = new InsertTextCommand(7, 'cd');
      
      expect(command1.canMerge(command2)).toBe(false);
    });
  });
  
  describe('merge', () => {
    it('should combine text from both commands', () => {
      const command1 = new InsertTextCommand(5, 'a');
      const command2 = new InsertTextCommand(6, 'b');
      command2.timestamp = command1.timestamp + 100;
      
      const merged = command1.merge(command2);
      
      expect(merged).toBe(command1); // Returns this
      expect(merged.serialize()).toContain('"text":"ab"');
      expect(merged.timestamp).toBe(command2.timestamp);
    });
    
    it('should update timestamp to the later command', () => {
      const command1 = new InsertTextCommand(5, 'a');
      const originalTimestamp = command1.timestamp;
      const command2 = new InsertTextCommand(6, 'b');
      command2.timestamp = originalTimestamp + 1000;
      
      command1.merge(command2);
      
      expect(command1.timestamp).toBe(command2.timestamp);
      expect(command1.timestamp).toBeGreaterThan(originalTimestamp);
    });
  });
  
  describe('serialize', () => {
    it('should serialize command data to JSON', () => {
      const command = new InsertTextCommand(5, ' beautiful');
      
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      
      expect(parsed.position).toBe(5);
      expect(parsed.text).toBe(' beautiful');
      expect(parsed.previousContent).toBe('');
    });
    
    it('should include previousContent after execute', async () => {
      mockTextarea.value = 'Hello world';
      const command = new InsertTextCommand(5, ' beautiful');
      
      await command.execute(context);
      
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      
      expect(parsed.previousContent).toBe('Hello world');
    });
    
    it('should handle special characters in serialization', () => {
      const command = new InsertTextCommand(0, '"quotes" and \\backslashes\\ and \nnewlines');
      
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      
      expect(parsed.text).toBe('"quotes" and \\backslashes\\ and \nnewlines');
    });
  });
  
  describe('integration tests', () => {
    it('should complete full execute/undo/serialize cycle', async () => {
      mockTextarea.value = 'Hello world';
      const command = new InsertTextCommand(6, 'beautiful ');
      
      // Execute
      const executeResult = await command.execute(context);
      expect(executeResult.success).toBe(true);
      expect(mockTextarea.value).toBe('Hello beautiful world');
      
      // Serialize after execute
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      expect(parsed.previousContent).toBe('Hello world');
      
      // Undo
      const undoResult = await command.undo(context);
      expect(undoResult.success).toBe(true);
      expect(mockTextarea.value).toBe('Hello world');
    });
    
    it('should handle edge case positions correctly', async () => {
      // Test insertion at various edge positions
      const testCases = [
        { initial: 'test', position: 0, text: 'pre-', expected: 'pre-test' },
        { initial: 'test', position: 4, text: '-post', expected: 'test-post' },
        { initial: '', position: 0, text: 'new', expected: 'new' },
        { initial: 'a', position: 1, text: 'b', expected: 'ab' }
      ];
      
      for (const testCase of testCases) {
        mockTextarea.value = testCase.initial;
        const command = new InsertTextCommand(testCase.position, testCase.text);
        
        const result = await command.execute(context);
        
        expect(result.success).toBe(true);
        expect(result.content).toBe(testCase.expected);
        expect(mockTextarea.value).toBe(testCase.expected);
      }
    });
  });
});