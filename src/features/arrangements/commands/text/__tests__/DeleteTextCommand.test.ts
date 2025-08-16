import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteTextCommand } from '../DeleteTextCommand';
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

describe('DeleteTextCommand', () => {
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
      const command = new DeleteTextCommand(5, 6);
      
      expect(command.type).toBe(CommandType.DELETE_TEXT);
      expect(command.id).toBeDefined();
      expect(command.timestamp).toBeDefined();
      expect(typeof command.timestamp).toBe('number');
    });
  });
  
  describe('execute', () => {
    it('should delete text at the specified position and length', async () => {
      mockTextarea.value = 'Hello world';
      const command = new DeleteTextCommand(5, 1); // Delete the space
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Helloworld');
      expect(result.cursorPosition).toBe(5);
      expect(mockTextarea.value).toBe('Helloworld');
      expect(mockTextarea.selectionStart).toBe(5);
      expect(mockTextarea.selectionEnd).toBe(5);
    });
    
    it('should delete multiple characters', async () => {
      mockTextarea.value = 'Hello beautiful world';
      const command = new DeleteTextCommand(6, 10); // Delete 'beautiful '
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello world');
      expect(result.cursorPosition).toBe(6);
    });
    
    it('should delete from the beginning', async () => {
      mockTextarea.value = 'Hello world';
      const command = new DeleteTextCommand(0, 6); // Delete 'Hello '
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('world');
      expect(result.cursorPosition).toBe(0);
    });
    
    it('should delete from the end', async () => {
      mockTextarea.value = 'Hello world';
      const command = new DeleteTextCommand(5, 6); // Delete ' world'
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello');
      expect(result.cursorPosition).toBe(5);
    });
    
    it('should handle zero-length deletion', async () => {
      mockTextarea.value = 'Hello world';
      const command = new DeleteTextCommand(5, 0);
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello world');
      expect(result.cursorPosition).toBe(5);
    });
    
    it('should handle deletion beyond text length', async () => {
      mockTextarea.value = 'Hello';
      const command = new DeleteTextCommand(3, 10); // Delete more than available
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hel');
      expect(result.cursorPosition).toBe(3);
    });
    
    it('should store deleted text for undo', async () => {
      mockTextarea.value = 'Hello world';
      const command = new DeleteTextCommand(5, 6);
      
      await command.execute(context);
      
      // Check that deleted text is stored (via serialization)
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      expect(parsed.deletedText).toBe(' world');
    });
    
    it('should dispatch input event for React', async () => {
      mockTextarea.value = 'Hello world';
      const command = new DeleteTextCommand(5, 1);
      
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
      const command = new DeleteTextCommand(5, 1);
      
      const result = await command.execute(contextWithoutTextarea);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Textarea reference not available');
    });
    
    it('should handle exceptions gracefully', async () => {
      // Mock textarea that throws during execution
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
      const command = new DeleteTextCommand(5, 1);
      
      const result = await command.execute(contextWithThrowingTextarea);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Textarea error');
    });
  });
  
  describe('undo', () => {
    it('should restore previous content and cursor position after delete', async () => {
      mockTextarea.value = 'Hello world';
      const command = new DeleteTextCommand(5, 6);
      
      // Execute first
      await command.execute(context);
      expect(mockTextarea.value).toBe('Hello');
      
      // Then undo
      const undoResult = await command.undo(context);
      
      expect(undoResult.success).toBe(true);
      expect(undoResult.content).toBe('Hello world');
      expect(undoResult.cursorPosition).toBe(11); // position + deletedText.length
      expect(mockTextarea.value).toBe('Hello world');
      expect(mockTextarea.selectionStart).toBe(11);
      expect(mockTextarea.selectionEnd).toBe(11);
    });
    
    it('should handle undo with single character deletion', async () => {
      mockTextarea.value = 'Hello world';
      const command = new DeleteTextCommand(5, 1);
      
      await command.execute(context);
      expect(mockTextarea.value).toBe('Helloworld');
      
      const undoResult = await command.undo(context);
      
      expect(undoResult.success).toBe(true);
      expect(undoResult.content).toBe('Hello world');
      expect(undoResult.cursorPosition).toBe(6); // 5 + 1
    });
    
    it('should handle undo without previous execute', async () => {
      const command = new DeleteTextCommand(5, 1);
      
      const result = await command.undo(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe(''); // previousContent is empty by default
      expect(result.cursorPosition).toBe(5); // position + deletedText.length (0)
    });
    
    it('should handle missing textarea reference in undo', async () => {
      const contextWithoutTextarea = {
        ...context,
        textareaRef: { current: null }
      };
      const command = new DeleteTextCommand(5, 1);
      
      const result = await command.undo(contextWithoutTextarea);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Textarea reference not available');
    });
    
    it('should handle exceptions in undo gracefully', async () => {
      const command = new DeleteTextCommand(5, 1);
      
      // Execute first to set previousContent
      mockTextarea.value = 'Hello world';
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
    it('should merge with same position deletion (repeated backspace)', () => {
      const command1 = new DeleteTextCommand(5, 1);
      const command2 = new DeleteTextCommand(5, 1);
      
      expect(command1.canMerge(command2)).toBe(true);
    });
    
    it('should merge with adjacent position deletion (backspace moving left)', () => {
      const command1 = new DeleteTextCommand(5, 1);
      const command2 = new DeleteTextCommand(4, 1); // Backspace moved cursor left
      
      expect(command1.canMerge(command2)).toBe(true);
    });
    
    it('should not merge non-adjacent deletions', () => {
      const command1 = new DeleteTextCommand(5, 1);
      const command2 = new DeleteTextCommand(8, 1); // Not adjacent
      
      expect(command1.canMerge(command2)).toBe(false);
    });
    
    it('should not merge multi-character deletions', () => {
      const command1 = new DeleteTextCommand(5, 5);
      const command2 = new DeleteTextCommand(5, 1);
      
      expect(command1.canMerge(command2)).toBe(false);
    });
    
    it('should not merge with different command types', () => {
      const deleteCommand = new DeleteTextCommand(5, 1);
      const otherCommand = {
        type: CommandType.INSERT_TEXT,
        id: 'test',
        timestamp: Date.now(),
        execute: vi.fn(),
        undo: vi.fn()
      };
      
      expect(deleteCommand.canMerge(otherCommand)).toBe(false);
    });
    
    it('should not merge when both are multi-character', () => {
      const command1 = new DeleteTextCommand(5, 3);
      const command2 = new DeleteTextCommand(5, 2);
      
      expect(command1.canMerge(command2)).toBe(false);
    });
  });
  
  describe('merge', () => {
    it('should combine deletions from same position', () => {
      const command1 = new DeleteTextCommand(5, 1);
      const command2 = new DeleteTextCommand(5, 1);
      command2.timestamp = command1.timestamp + 100;
      
      // Simulate execution to set deletedText
      command1['deletedText'] = 'a';
      command2['deletedText'] = 'b';
      
      const merged = command1.merge(command2);
      
      expect(merged).toBe(command1);
      expect(merged.timestamp).toBe(command2.timestamp);
      
      // Check internal state via serialization
      const serialized = merged.serialize();
      const parsed = JSON.parse(serialized);
      expect(parsed.length).toBe(2); // Combined length
      expect(parsed.deletedText).toBe('ab'); // Combined deleted text
    });
    
    it('should combine deletions from adjacent position (backspace)', () => {
      const command1 = new DeleteTextCommand(5, 1);
      const command2 = new DeleteTextCommand(4, 1);
      command2.timestamp = command1.timestamp + 100;
      
      // Simulate execution to set deletedText
      command1['deletedText'] = 'b';
      command2['deletedText'] = 'a';
      
      const merged = command1.merge(command2);
      
      expect(merged).toBe(command1);
      expect(merged.timestamp).toBe(command2.timestamp);
      
      // Check internal state via serialization
      const serialized = merged.serialize();
      const parsed = JSON.parse(serialized);
      expect(parsed.position).toBe(4); // Updated position
      expect(parsed.length).toBe(2); // Combined length
      expect(parsed.deletedText).toBe('ab'); // Combined deleted text (order matters)
    });
    
    it('should update timestamp to the later command', () => {
      const command1 = new DeleteTextCommand(5, 1);
      const originalTimestamp = command1.timestamp;
      const command2 = new DeleteTextCommand(5, 1);
      command2.timestamp = originalTimestamp + 1000;
      
      command1.merge(command2);
      
      expect(command1.timestamp).toBe(command2.timestamp);
      expect(command1.timestamp).toBeGreaterThan(originalTimestamp);
    });
  });
  
  describe('serialize', () => {
    it('should serialize command data to JSON', () => {
      const command = new DeleteTextCommand(5, 6);
      
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      
      expect(parsed.position).toBe(5);
      expect(parsed.length).toBe(6);
      expect(parsed.deletedText).toBe('');
      expect(parsed.previousContent).toBe('');
    });
    
    it('should include deletedText and previousContent after execute', async () => {
      mockTextarea.value = 'Hello world';
      const command = new DeleteTextCommand(5, 6);
      
      await command.execute(context);
      
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      
      expect(parsed.deletedText).toBe(' world');
      expect(parsed.previousContent).toBe('Hello world');
    });
    
    it('should handle special characters in serialization', async () => {
      mockTextarea.value = 'Hello "quotes" and \\backslashes\\ and \nnewlines world';
      const command = new DeleteTextCommand(6, 35); // Delete the special characters
      
      await command.execute(context);
      
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      
      expect(parsed.deletedText).toBe('"quotes" and \\backslashes\\ and \nnewlines');
    });
  });
  
  describe('integration tests', () => {
    it('should complete full execute/undo/serialize cycle', async () => {
      mockTextarea.value = 'Hello beautiful world';
      const command = new DeleteTextCommand(5, 10); // Delete ' beautiful'
      
      // Execute
      const executeResult = await command.execute(context);
      expect(executeResult.success).toBe(true);
      expect(mockTextarea.value).toBe('Hello world');
      
      // Serialize after execute
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      expect(parsed.deletedText).toBe(' beautiful');
      expect(parsed.previousContent).toBe('Hello beautiful world');
      
      // Undo
      const undoResult = await command.undo(context);
      expect(undoResult.success).toBe(true);
      expect(mockTextarea.value).toBe('Hello beautiful world');
      expect(mockTextarea.selectionStart).toBe(15); // 5 + 10
    });
    
    it('should handle edge case positions correctly', async () => {
      // Test deletion at various edge positions
      const testCases = [
        { initial: 'hello world', position: 0, length: 6, expected: 'world' },
        { initial: 'hello world', position: 5, length: 6, expected: 'hello' },
        { initial: 'hello', position: 0, length: 5, expected: '' },
        { initial: 'ab', position: 1, length: 1, expected: 'a' },
        { initial: 'a', position: 0, length: 1, expected: '' }
      ];
      
      for (const testCase of testCases) {
        mockTextarea.value = testCase.initial;
        const command = new DeleteTextCommand(testCase.position, testCase.length);
        
        const result = await command.execute(context);
        
        expect(result.success).toBe(true);
        expect(result.content).toBe(testCase.expected);
        expect(mockTextarea.value).toBe(testCase.expected);
      }
    });
    
    it('should handle consecutive deletion commands for typing simulation', () => {
      // Test rapid backspace simulation
      const command1 = new DeleteTextCommand(5, 1);
      const command2 = new DeleteTextCommand(4, 1);
      const command3 = new DeleteTextCommand(3, 1);
      
      // Simulate deletedText being set
      command1['deletedText'] = 'c';
      command2['deletedText'] = 'b';
      command3['deletedText'] = 'a';
      
      // Test merging
      expect(command1.canMerge(command2)).toBe(true);
      command1.merge(command2);
      
      expect(command1.canMerge(command3)).toBe(true);
      command1.merge(command3);
      
      const serialized = command1.serialize();
      const parsed = JSON.parse(serialized);
      expect(parsed.position).toBe(3);
      expect(parsed.length).toBe(3);
      expect(parsed.deletedText).toBe('abc');
    });
  });
});