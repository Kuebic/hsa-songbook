import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandManager } from '../CommandManager';
import { InsertTextCommand } from '../../text/InsertTextCommand';
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

describe('CommandManager Options', () => {
  let context: EditorContext;
  let mockTextarea: MockTextAreaElement;
  
  beforeEach(() => {
    vi.useFakeTimers();
    mockTextarea = new MockTextAreaElement();
    context = {
      textareaRef: { current: mockTextarea as unknown as HTMLTextAreaElement },
      content: '',
      cursorPosition: 0,
      selectionRange: [0, 0]
    };
  });
  
  describe('constructor options', () => {
    it('should use default options when none provided', () => {
      const manager = new CommandManager();
      const options = manager.getOptions();
      
      expect(options.maxHistorySize).toBe(100);
      expect(options.mergeWindow).toBe(500);
    });
    
    it('should accept custom maxHistorySize', () => {
      const manager = new CommandManager({ maxHistorySize: 200 });
      const options = manager.getOptions();
      
      expect(options.maxHistorySize).toBe(200);
      expect(options.mergeWindow).toBe(500);
    });
    
    it('should accept custom mergeWindow', () => {
      const manager = new CommandManager({ mergeWindow: 1000 });
      const options = manager.getOptions();
      
      expect(options.maxHistorySize).toBe(100);
      expect(options.mergeWindow).toBe(1000);
    });
    
    it('should accept both custom options', () => {
      const manager = new CommandManager({ 
        maxHistorySize: 50,
        mergeWindow: 250 
      });
      const options = manager.getOptions();
      
      expect(options.maxHistorySize).toBe(50);
      expect(options.mergeWindow).toBe(250);
    });
  });
  
  describe('updateOptions', () => {
    it('should update maxHistorySize dynamically', () => {
      const manager = new CommandManager();
      
      manager.updateOptions({ maxHistorySize: 150 });
      const options = manager.getOptions();
      
      expect(options.maxHistorySize).toBe(150);
    });
    
    it('should update mergeWindow dynamically', () => {
      const manager = new CommandManager();
      
      manager.updateOptions({ mergeWindow: 750 });
      const options = manager.getOptions();
      
      expect(options.mergeWindow).toBe(750);
    });
    
    it('should update both options dynamically', () => {
      const manager = new CommandManager();
      
      manager.updateOptions({ 
        maxHistorySize: 75,
        mergeWindow: 300 
      });
      const options = manager.getOptions();
      
      expect(options.maxHistorySize).toBe(75);
      expect(options.mergeWindow).toBe(300);
    });
    
    it('should enforce new history limit when updated', async () => {
      const manager = new CommandManager({ maxHistorySize: 10 });
      
      // Add 15 commands
      for (let i = 0; i < 15; i++) {
        const command = new InsertTextCommand(i, `text${i}`);
        await manager.execute(command, context);
      }
      
      // Should have only 10 commands due to limit
      let info = manager.getHistoryInfo();
      expect(info.undoCount).toBe(10);
      
      // Reduce limit to 5
      manager.updateOptions({ maxHistorySize: 5 });
      
      // Should now have only 5 commands
      info = manager.getHistoryInfo();
      expect(info.undoCount).toBe(5);
    });
  });
  
  describe('mergeWindow configuration', () => {
    it('should merge commands within custom window', async () => {
      const manager = new CommandManager({ mergeWindow: 1000 });
      
      const command1 = new InsertTextCommand(0, 'a');
      command1.timestamp = Date.now();
      await manager.execute(command1, context);
      
      // Advance time by 800ms (within 1000ms window)
      vi.advanceTimersByTime(800);
      
      const command2 = new InsertTextCommand(1, 'b');
      command2.timestamp = Date.now();
      await manager.execute(command2, context);
      
      // Should have merged
      const info = manager.getHistoryInfo();
      expect(info.undoCount).toBe(1);
    });
    
    it('should not merge commands outside custom window', async () => {
      const manager = new CommandManager({ mergeWindow: 300 });
      
      const command1 = new InsertTextCommand(0, 'a');
      command1.timestamp = Date.now();
      await manager.execute(command1, context);
      
      // Advance time by 400ms (outside 300ms window)
      vi.advanceTimersByTime(400);
      
      const command2 = new InsertTextCommand(1, 'b');
      command2.timestamp = Date.now();
      await manager.execute(command2, context);
      
      // Should not have merged
      const info = manager.getHistoryInfo();
      expect(info.undoCount).toBe(2);
    });
    
    it('should respect updated merge window', async () => {
      const manager = new CommandManager({ mergeWindow: 200 });
      
      const command1 = new InsertTextCommand(0, 'a');
      command1.timestamp = Date.now();
      await manager.execute(command1, context);
      
      // Update merge window to 600ms
      manager.updateOptions({ mergeWindow: 600 });
      
      // Advance time by 500ms (within new 600ms window)
      vi.advanceTimersByTime(500);
      
      const command2 = new InsertTextCommand(1, 'b');
      command2.timestamp = Date.now();
      await manager.execute(command2, context);
      
      // Should have merged with new window
      const info = manager.getHistoryInfo();
      expect(info.undoCount).toBe(1);
    });
  });
  
  describe('getHistoryInfo', () => {
    it('should include current maxSize in history info', () => {
      const manager = new CommandManager({ maxHistorySize: 75 });
      const info = manager.getHistoryInfo();
      
      expect(info.maxSize).toBe(75);
    });
    
    it('should update maxSize in info after option change', () => {
      const manager = new CommandManager();
      
      let info = manager.getHistoryInfo();
      expect(info.maxSize).toBe(100);
      
      manager.updateOptions({ maxHistorySize: 200 });
      
      info = manager.getHistoryInfo();
      expect(info.maxSize).toBe(200);
    });
  });
});