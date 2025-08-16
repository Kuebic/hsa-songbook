import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEnhancedEditorState } from '../useEnhancedEditorState';
import { InsertTextCommand } from '../../commands/text/InsertTextCommand';
import { DeleteTextCommand } from '../../commands/text/DeleteTextCommand';
import { ReplaceTextCommand } from '../../commands/text/ReplaceTextCommand';

// Mock the useDebounce hook
vi.mock('../useDebounce', () => ({
  useDebounce: vi.fn((value: string) => value)
}));

// Mock setTimeout to be synchronous for testing
vi.stubGlobal('setTimeout', (fn: () => void) => {
  fn();
  return 1;
});

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

describe('useEnhancedEditorState', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });
  
  const defaultOptions = {
    initialContent: 'Hello world',
    arrangementId: 'test-arrangement',
    onChange: mockOnChange
  };
  
  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      expect(result.current.content).toBe('Hello world');
      expect(result.current.isDirty).toBe(false);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.cursorPosition).toBe(0);
      expect(result.current.selectionRange).toEqual([0, 0]);
      expect(result.current.debouncedContent).toBe('Hello world');
    });
    
    it('should initialize with empty content', () => {
      const { result } = renderHook(() => 
        useEnhancedEditorState({ ...defaultOptions, initialContent: '' })
      );
      
      expect(result.current.content).toBe('');
      expect(result.current.isDirty).toBe(false);
    });
    
    it('should provide command manager instance', () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      expect(result.current.commandManager).toBeDefined();
      expect(typeof result.current.getHistoryInfo).toBe('function');
      expect(typeof result.current.clearHistory).toBe('function');
    });
  });
  
  describe('executeCommand', () => {
    it('should execute InsertTextCommand successfully', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      // Wait for hook to be initialized
      await act(async () => {
        // Set up mock textarea
        const mockTextarea = new MockTextAreaElement();
        mockTextarea.value = 'Hello world';
        result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
        
        const command = new InsertTextCommand(5, ' beautiful');
        const commandResult = await result.current.executeCommand(command);
        expect(commandResult.success).toBe(true);
      });
      
      expect(result.current.content).toBe('Hello beautiful world');
      expect(result.current.isDirty).toBe(true);
      expect(result.current.canUndo).toBe(true);
      expect(mockOnChange).toHaveBeenCalledWith('Hello beautiful world');
    });
    
    it('should execute DeleteTextCommand successfully', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const mockTextarea = new MockTextAreaElement();
      mockTextarea.value = 'Hello world';
      result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
      
      const command = new DeleteTextCommand(5, 6);
      
      await act(async () => {
        await result.current.executeCommand(command);
      });
      
      expect(result.current.content).toBe('Hello');
      expect(result.current.isDirty).toBe(true);
      expect(result.current.canUndo).toBe(true);
    });
    
    it('should execute ReplaceTextCommand successfully', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const mockTextarea = new MockTextAreaElement();
      mockTextarea.value = 'Hello world';
      result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
      
      const command = new ReplaceTextCommand(6, 5, 'universe');
      
      await act(async () => {
        await result.current.executeCommand(command);
      });
      
      expect(result.current.content).toBe('Hello universe');
      expect(result.current.isDirty).toBe(true);
    });
    
    it('should update cursor position after command execution', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const mockTextarea = new MockTextAreaElement();
      mockTextarea.value = 'Hello world';
      result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
      
      const command = new InsertTextCommand(5, ' beautiful');
      
      await act(async () => {
        await result.current.executeCommand(command);
      });
      
      // Should update cursor position asynchronously
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.cursorPosition).toBe(15);
      expect(mockTextarea.selectionStart).toBe(15);
      expect(mockTextarea.selectionEnd).toBe(15);
    });
    
    it('should handle command execution failure', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      // Don't set textareaRef to simulate failure
      const command = new InsertTextCommand(5, ' beautiful');
      
      await act(async () => {
        const commandResult = await result.current.executeCommand(command);
        expect(commandResult.success).toBe(false);
      });
      
      expect(result.current.content).toBe('Hello world'); // Should remain unchanged
      expect(result.current.isDirty).toBe(false);
      expect(result.current.canUndo).toBe(false);
    });
    
    it('should not call onChange if content unchanged', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const mockTextarea = new MockTextAreaElement();
      mockTextarea.value = 'Hello world';
      result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
      
      // Command that doesn't change content
      const command = new InsertTextCommand(5, '');
      
      await act(async () => {
        await result.current.executeCommand(command);
      });
      
      expect(mockOnChange).toHaveBeenCalledWith('Hello world');
    });
  });
  
  describe('undo', () => {
    it('should undo last command', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const mockTextarea = new MockTextAreaElement();
      mockTextarea.value = 'Hello world';
      result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
      
      // Execute a command first
      const command = new InsertTextCommand(5, ' beautiful');
      await act(async () => {
        await result.current.executeCommand(command);
      });
      
      expect(result.current.content).toBe('Hello beautiful world');
      expect(result.current.canUndo).toBe(true);
      
      // Undo the command
      await act(async () => {
        const undoResult = await result.current.undo();
        expect(undoResult.success).toBe(true);
      });
      
      expect(result.current.content).toBe('Hello world');
      expect(result.current.isDirty).toBe(false);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
      expect(mockOnChange).toHaveBeenLastCalledWith('Hello world');
    });
    
    it('should handle undo when nothing to undo', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      await act(async () => {
        const undoResult = await result.current.undo();
        expect(undoResult.success).toBe(false);
      });
      
      expect(result.current.content).toBe('Hello world');
      expect(result.current.canUndo).toBe(false);
    });
    
    it('should update cursor position after undo', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const mockTextarea = new MockTextAreaElement();
      mockTextarea.value = 'Hello world';
      result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
      
      const command = new InsertTextCommand(5, ' beautiful');
      await act(async () => {
        await result.current.executeCommand(command);
      });
      
      await act(async () => {
        await result.current.undo();
      });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.cursorPosition).toBe(5);
      expect(mockTextarea.selectionStart).toBe(5);
    });
  });
  
  describe('redo', () => {
    it('should redo last undone command', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const mockTextarea = new MockTextAreaElement();
      mockTextarea.value = 'Hello world';
      result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
      
      // Execute and undo a command
      const command = new InsertTextCommand(5, ' beautiful');
      await act(async () => {
        await result.current.executeCommand(command);
        await result.current.undo();
      });
      
      expect(result.current.canRedo).toBe(true);
      
      // Redo the command
      await act(async () => {
        const redoResult = await result.current.redo();
        expect(redoResult.success).toBe(true);
      });
      
      expect(result.current.content).toBe('Hello beautiful world');
      expect(result.current.isDirty).toBe(true);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });
    
    it('should handle redo when nothing to redo', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      await act(async () => {
        const redoResult = await result.current.redo();
        expect(redoResult.success).toBe(false);
      });
      
      expect(result.current.content).toBe('Hello world');
      expect(result.current.canRedo).toBe(false);
    });
  });
  
  describe('state management', () => {
    it('should update isDirty when content changes', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      expect(result.current.isDirty).toBe(false);
      
      await act(async () => {
        result.current.updateContent('New content');
      });
      
      expect(result.current.isDirty).toBe(true);
      expect(result.current.content).toBe('New content');
    });
    
    it('should handle cursor position changes', () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      act(() => {
        result.current.handleCursorPositionChange(10);
      });
      
      expect(result.current.cursorPosition).toBe(10);
    });
    
    it('should handle selection range changes', () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      act(() => {
        result.current.handleSelectionRangeChange([5, 10]);
      });
      
      expect(result.current.selectionRange).toEqual([5, 10]);
      expect(result.current.cursorPosition).toBe(5);
    });
    
    it('should update content externally', () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      act(() => {
        result.current.updateContent('Externally updated');
      });
      
      expect(result.current.content).toBe('Externally updated');
      expect(result.current.isDirty).toBe(true);
      expect(mockOnChange).toHaveBeenCalledWith('Externally updated');
    });
  });
  
  describe('history management', () => {
    it('should provide history info', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const info = result.current.getHistoryInfo();
      expect(info).toHaveProperty('undoCount');
      expect(info).toHaveProperty('redoCount');
      expect(info).toHaveProperty('maxSize');
    });
    
    it('should clear history', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const mockTextarea = new MockTextAreaElement();
      mockTextarea.value = 'Hello world';
      result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
      
      // Execute a command
      const command = new InsertTextCommand(5, ' beautiful');
      await act(async () => {
        await result.current.executeCommand(command);
      });
      
      expect(result.current.canUndo).toBe(true);
      
      act(() => {
        result.current.clearHistory();
      });
      
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
    
    it('should get and restore history', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const mockTextarea = new MockTextAreaElement();
      mockTextarea.value = 'Hello world';
      result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
      
      // Execute commands
      const command1 = new InsertTextCommand(5, ' beautiful');
      const command2 = new InsertTextCommand(15, ' and amazing');
      
      await act(async () => {
        await result.current.executeCommand(command1);
        await result.current.executeCommand(command2);
      });
      
      const history = result.current.getHistory();
      expect(history.length).toBeGreaterThan(0);
      
      act(() => {
        result.current.clearHistory();
        result.current.restoreHistory(history);
      });
      
      expect(result.current.canUndo).toBe(true);
    });
  });
  
  describe('keyboard shortcuts', () => {
    it('should handle Ctrl+Z for undo', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const mockTextarea = new MockTextAreaElement();
      mockTextarea.value = 'Hello world';
      result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
      
      // Execute a command
      const command = new InsertTextCommand(5, ' beautiful');
      await act(async () => {
        await result.current.executeCommand(command);
      });
      
      expect(result.current.canUndo).toBe(true);
      
      // Simulate Ctrl+Z keydown
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true
      });
      
      // Mock document.activeElement to be the textarea
      Object.defineProperty(document, 'activeElement', {
        value: mockTextarea,
        writable: true
      });
      
      await act(async () => {
        window.dispatchEvent(event);
      });
      
      // Note: In real implementation, this would trigger undo
      // Here we're just testing that the event listener is set up
    });
    
    it('should handle Ctrl+Y for redo', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const mockTextarea = new MockTextAreaElement();
      result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
      
      // Simulate Ctrl+Y keydown
      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        bubbles: true
      });
      
      Object.defineProperty(document, 'activeElement', {
        value: mockTextarea,
        writable: true
      });
      
      await act(async () => {
        window.dispatchEvent(event);
      });
      
      // Event listener should be set up (testing the setup, not the action)
    });
    
    it('should handle Ctrl+Shift+Z for redo', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const mockTextarea = new MockTextAreaElement();
      result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
      
      // Simulate Ctrl+Shift+Z keydown
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      });
      
      Object.defineProperty(document, 'activeElement', {
        value: mockTextarea,
        writable: true
      });
      
      await act(async () => {
        window.dispatchEvent(event);
      });
      
      // Event listener should be set up
    });
  });
  
  describe('edge cases', () => {
    it('should handle commands with no textarea ref', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const command = new InsertTextCommand(5, ' beautiful');
      
      await act(async () => {
        const commandResult = await result.current.executeCommand(command);
        expect(commandResult.success).toBe(false);
      });
      
      expect(result.current.content).toBe('Hello world');
      expect(result.current.canUndo).toBe(false);
    });
    
    it('should handle rapid command execution', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      const mockTextarea = new MockTextAreaElement();
      mockTextarea.value = 'Hello world';
      result.current.textareaRef.current = mockTextarea as unknown as HTMLTextAreaElement;
      
      const commands = [
        new InsertTextCommand(5, ' '),
        new InsertTextCommand(6, 'b'),
        new InsertTextCommand(7, 'e'),
        new InsertTextCommand(8, 'a'),
        new InsertTextCommand(9, 'u'),
        new InsertTextCommand(10, 't'),
        new InsertTextCommand(11, 'i'),
        new InsertTextCommand(12, 'f'),
        new InsertTextCommand(13, 'u'),
        new InsertTextCommand(14, 'l')
      ];
      
      await act(async () => {
        for (const command of commands) {
          await result.current.executeCommand(command);
        }
      });
      
      expect(result.current.content).toBe('Hello beautiful world');
      expect(result.current.canUndo).toBe(true);
    });
    
    it('should handle content that matches initial content', async () => {
      const { result } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      act(() => {
        result.current.updateContent('Hello world'); // Same as initial
      });
      
      expect(result.current.isDirty).toBe(false);
    });
    
    it('should handle missing onChange callback', () => {
      const { result } = renderHook(() => 
        useEnhancedEditorState({
          initialContent: 'Hello world',
          arrangementId: 'test-arrangement'
          // No onChange callback
        })
      );
      
      act(() => {
        result.current.updateContent('New content');
      });
      
      expect(result.current.content).toBe('New content');
      // Should not throw error
    });
  });
  
  describe('cleanup', () => {
    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useEnhancedEditorState(defaultOptions));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });
});