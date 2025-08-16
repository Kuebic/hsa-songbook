import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReplaceTextCommand } from '../ReplaceTextCommand';
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

describe('ReplaceTextCommand', () => {
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
      const command = new ReplaceTextCommand(6, 5, 'beautiful');
      
      expect(command.type).toBe(CommandType.REPLACE_TEXT);
      expect(command.id).toBeDefined();
      expect(command.timestamp).toBeDefined();
      expect(typeof command.timestamp).toBe('number');
    });
  });
  
  describe('execute', () => {
    it('should replace text at the specified position and length', async () => {
      mockTextarea.value = 'Hello world';
      const command = new ReplaceTextCommand(6, 5, 'beautiful'); // Replace 'world' with 'beautiful'
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello beautiful');
      expect(result.cursorPosition).toBe(15); // 6 + 'beautiful'.length
      expect(mockTextarea.value).toBe('Hello beautiful');
      expect(mockTextarea.selectionStart).toBe(15);
      expect(mockTextarea.selectionEnd).toBe(15);
    });
    
    it('should replace text with shorter text', async () => {
      mockTextarea.value = 'Hello beautiful world';
      const command = new ReplaceTextCommand(6, 9, 'nice'); // Replace 'beautiful' with 'nice'
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello nice world');
      expect(result.cursorPosition).toBe(10); // 6 + 'nice'.length
    });
    
    it('should replace text with longer text', async () => {
      mockTextarea.value = 'Hello nice world';
      const command = new ReplaceTextCommand(6, 4, 'absolutely magnificent'); // Replace 'nice' with longer text
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello absolutely magnificent world');
      expect(result.cursorPosition).toBe(28); // 6 + 'absolutely magnificent'.length
    });
    
    it('should replace text at the beginning', async () => {
      mockTextarea.value = 'Hello world';
      const command = new ReplaceTextCommand(0, 5, 'Hi'); // Replace 'Hello' with 'Hi'
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hi world');
      expect(result.cursorPosition).toBe(2);
    });
    
    it('should replace text at the end', async () => {
      mockTextarea.value = 'Hello world';
      const command = new ReplaceTextCommand(6, 5, 'universe'); // Replace 'world' with 'universe'
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello universe');
      expect(result.cursorPosition).toBe(14);
    });
    
    it('should replace with empty text (effectively delete)', async () => {
      mockTextarea.value = 'Hello beautiful world';
      const command = new ReplaceTextCommand(5, 10, ''); // Replace ' beautiful' with nothing
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello world');
      expect(result.cursorPosition).toBe(5);
    });
    
    it('should handle zero-length replacement (insert)', async () => {
      mockTextarea.value = 'Hello world';
      const command = new ReplaceTextCommand(5, 0, ' beautiful'); // Insert at position 5
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello beautiful world');
      expect(result.cursorPosition).toBe(15);
    });
    
    it('should handle replacement beyond text length', async () => {
      mockTextarea.value = 'Hello';
      const command = new ReplaceTextCommand(3, 10, 'p'); // Replace beyond end
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Help'); // Replaces 'lo' and beyond with 'p'
      expect(result.cursorPosition).toBe(4);
    });
    
    it('should store old text for undo', async () => {
      mockTextarea.value = 'Hello world';
      const command = new ReplaceTextCommand(6, 5, 'beautiful');
      
      await command.execute(context);
      
      // Check that old text is stored (via serialization)
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      expect(parsed.oldText).toBe('world');
    });
    
    it('should dispatch input event for React', async () => {
      mockTextarea.value = 'Hello world';
      const command = new ReplaceTextCommand(6, 5, 'beautiful');
      
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
      const command = new ReplaceTextCommand(6, 5, 'beautiful');
      
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
      const command = new ReplaceTextCommand(6, 5, 'beautiful');
      
      const result = await command.execute(contextWithThrowingTextarea);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Textarea error');
    });
  });
  
  describe('undo', () => {
    it('should restore previous content and correct cursor position after replace', async () => {
      mockTextarea.value = 'Hello world';
      const command = new ReplaceTextCommand(6, 5, 'beautiful');
      
      // Execute first
      await command.execute(context);
      expect(mockTextarea.value).toBe('Hello beautiful');
      
      // Then undo
      const undoResult = await command.undo(context);
      
      expect(undoResult.success).toBe(true);
      expect(undoResult.content).toBe('Hello world');
      expect(undoResult.cursorPosition).toBe(11); // position + oldText.length
      expect(mockTextarea.value).toBe('Hello world');
      expect(mockTextarea.selectionStart).toBe(11);
      expect(mockTextarea.selectionEnd).toBe(11);
    });
    
    it('should handle undo with shorter replacement', async () => {
      mockTextarea.value = 'Hello beautiful world';
      const command = new ReplaceTextCommand(6, 9, 'nice');
      
      await command.execute(context);
      expect(mockTextarea.value).toBe('Hello nice world');
      
      const undoResult = await command.undo(context);
      
      expect(undoResult.success).toBe(true);
      expect(undoResult.content).toBe('Hello beautiful world');
      expect(undoResult.cursorPosition).toBe(15); // 6 + 'beautiful'.length
    });
    
    it('should handle undo with empty replacement', async () => {
      mockTextarea.value = 'Hello beautiful world';
      const command = new ReplaceTextCommand(5, 10, '');
      
      await command.execute(context);
      expect(mockTextarea.value).toBe('Hello world');
      
      const undoResult = await command.undo(context);
      
      expect(undoResult.success).toBe(true);
      expect(undoResult.content).toBe('Hello beautiful world');
      expect(undoResult.cursorPosition).toBe(15); // 5 + ' beautiful'.length
    });
    
    it('should handle undo without previous execute', async () => {
      const command = new ReplaceTextCommand(6, 5, 'beautiful');
      
      const result = await command.undo(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe(''); // previousContent is empty by default
      expect(result.cursorPosition).toBe(6); // position + oldText.length (0)
    });
    
    it('should handle missing textarea reference in undo', async () => {
      const contextWithoutTextarea = {
        ...context,
        textareaRef: { current: null }
      };
      const command = new ReplaceTextCommand(6, 5, 'beautiful');
      
      const result = await command.undo(contextWithoutTextarea);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Textarea reference not available');
    });
    
    it('should handle exceptions in undo gracefully', async () => {
      const command = new ReplaceTextCommand(6, 5, 'beautiful');
      
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
  
  describe('serialize', () => {
    it('should serialize command data to JSON', () => {
      const command = new ReplaceTextCommand(6, 5, 'beautiful');
      
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      
      expect(parsed.position).toBe(6);
      expect(parsed.length).toBe(5);
      expect(parsed.newText).toBe('beautiful');
      expect(parsed.oldText).toBe('');
      expect(parsed.previousContent).toBe('');
    });
    
    it('should include oldText and previousContent after execute', async () => {
      mockTextarea.value = 'Hello world';
      const command = new ReplaceTextCommand(6, 5, 'beautiful');
      
      await command.execute(context);
      
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      
      expect(parsed.oldText).toBe('world');
      expect(parsed.previousContent).toBe('Hello world');
      expect(parsed.newText).toBe('beautiful');
    });
    
    it('should handle special characters in serialization', async () => {
      mockTextarea.value = 'Hello "test" world';
      const command = new ReplaceTextCommand(6, 6, '"quotes" and \\backslashes\\ and \nnewlines');
      
      await command.execute(context);
      
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      
      expect(parsed.oldText).toBe('"test"');
      expect(parsed.newText).toBe('"quotes" and \\backslashes\\ and \nnewlines');
    });
    
    it('should handle empty strings in serialization', async () => {
      mockTextarea.value = 'Hello world';
      const command = new ReplaceTextCommand(5, 6, '');
      
      await command.execute(context);
      
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      
      expect(parsed.oldText).toBe(' world');
      expect(parsed.newText).toBe('');
    });
  });
  
  describe('integration tests', () => {
    it('should complete full execute/undo/serialize cycle', async () => {
      mockTextarea.value = 'Hello world';
      const command = new ReplaceTextCommand(6, 5, 'beautiful universe');
      
      // Execute
      const executeResult = await command.execute(context);
      expect(executeResult.success).toBe(true);
      expect(mockTextarea.value).toBe('Hello beautiful universe');
      
      // Serialize after execute
      const serialized = command.serialize();
      const parsed = JSON.parse(serialized);
      expect(parsed.oldText).toBe('world');
      expect(parsed.newText).toBe('beautiful universe');
      expect(parsed.previousContent).toBe('Hello world');
      
      // Undo
      const undoResult = await command.undo(context);
      expect(undoResult.success).toBe(true);
      expect(mockTextarea.value).toBe('Hello world');
      expect(mockTextarea.selectionStart).toBe(11); // 6 + 'world'.length
    });
    
    it('should handle edge case positions correctly', async () => {
      // Test replacement at various edge positions
      const testCases = [
        { 
          initial: 'hello world', 
          position: 0, 
          length: 5, 
          newText: 'hi', 
          expected: 'hi world' 
        },
        { 
          initial: 'hello world', 
          position: 6, 
          length: 5, 
          newText: 'universe', 
          expected: 'hello universe' 
        },
        { 
          initial: 'hello', 
          position: 0, 
          length: 5, 
          newText: 'goodbye', 
          expected: 'goodbye' 
        },
        { 
          initial: 'ab', 
          position: 1, 
          length: 1, 
          newText: 'xyz', 
          expected: 'axyz' 
        },
        { 
          initial: 'test', 
          position: 2, 
          length: 0, 
          newText: 'ing', 
          expected: 'testing' 
        }
      ];
      
      for (const testCase of testCases) {
        mockTextarea.value = testCase.initial;
        const command = new ReplaceTextCommand(
          testCase.position, 
          testCase.length, 
          testCase.newText
        );
        
        const result = await command.execute(context);
        
        expect(result.success).toBe(true);
        expect(result.content).toBe(testCase.expected);
        expect(mockTextarea.value).toBe(testCase.expected);
      }
    });
    
    it('should handle complex replacement scenarios', async () => {
      // Multiple replacements in sequence
      mockTextarea.value = 'The quick brown fox jumps over the lazy dog';
      
      // Replace 'quick' with 'slow'
      const command1 = new ReplaceTextCommand(4, 5, 'slow');
      await command1.execute(context);
      expect(mockTextarea.value).toBe('The slow brown fox jumps over the lazy dog');
      
      // Replace 'brown' with 'red'
      const command2 = new ReplaceTextCommand(9, 5, 'red');
      await command2.execute(context);
      expect(mockTextarea.value).toBe('The slow red fox jumps over the lazy dog');
      
      // Undo both
      await command2.undo(context);
      expect(mockTextarea.value).toBe('The slow brown fox jumps over the lazy dog');
      
      await command1.undo(context);
      expect(mockTextarea.value).toBe('The quick brown fox jumps over the lazy dog');
    });
    
    it('should handle replacement that changes text length significantly', async () => {
      mockTextarea.value = 'Hi';
      const command = new ReplaceTextCommand(0, 2, 'Hello there, how are you doing today?');
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello there, how are you doing today?');
      expect(result.cursorPosition).toBe(38);
      
      // Undo should restore
      const undoResult = await command.undo(context);
      expect(undoResult.success).toBe(true);
      expect(undoResult.content).toBe('Hi');
      expect(undoResult.cursorPosition).toBe(2);
    });
  });
  
  describe('error scenarios', () => {
    it('should handle invalid position gracefully', async () => {
      mockTextarea.value = 'Hello';
      const command = new ReplaceTextCommand(-1, 3, 'test'); // Negative position
      
      const result = await command.execute(context);
      
      // Should still succeed but behave predictably
      expect(result.success).toBe(true);
      // Position -1 with length 3 should effectively start from 0
    });
    
    it('should handle very large length gracefully', async () => {
      mockTextarea.value = 'Hello world';
      const command = new ReplaceTextCommand(6, 1000, 'test'); // Length beyond content
      
      const result = await command.execute(context);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello test'); // Should replace from position to end
    });
  });
});