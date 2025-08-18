import { BaseEditorCommand } from '../base/EditorCommand';
import { CommandType } from '../../types/command.types';
import type { EditorContext, CommandResult } from '../../types/command.types';

/**
 * Command to replace text at a specific position
 */
export class ReplaceTextCommand extends BaseEditorCommand {
  private position: number;
  private length: number;
  private newText: string;
  private oldText: string = '';
  private previousContent: string = '';
  
  constructor(position: number, length: number, newText: string) {
    super(CommandType.REPLACE_TEXT);
    this.position = position;
    this.length = length;
    this.newText = newText;
  }
  
  async execute(context: EditorContext): Promise<CommandResult> {
    const textarea = context.textareaRef.current;
    if (!textarea) {
      return { 
        success: false, 
        error: new Error('Textarea reference not available') 
      };
    }
    
    try {
      // Store the previous content and old text for undo
      this.previousContent = textarea.value;
      this.oldText = textarea.value.substring(this.position, this.position + this.length);
      
      // Replace text at position
      const before = textarea.value.substring(0, this.position);
      const after = textarea.value.substring(this.position + this.length);
      const newContent = before + this.newText + after;
      
      // Update textarea
      const newCursorPosition = this.position + this.newText.length;
      this.updateTextarea(textarea, newContent, newCursorPosition);
      
      return {
        success: true,
        content: newContent,
        cursorPosition: newCursorPosition
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to replace text')
      };
    }
  }
  
  async undo(context: EditorContext): Promise<CommandResult> {
    const textarea = context.textareaRef.current;
    if (!textarea) {
      return { 
        success: false, 
        error: new Error('Textarea reference not available') 
      };
    }
    
    try {
      // Restore previous content
      const cursorPosition = this.position + this.oldText.length;
      this.updateTextarea(textarea, this.previousContent, cursorPosition);
      
      return {
        success: true,
        content: this.previousContent,
        cursorPosition: cursorPosition
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to undo text replacement')
      };
    }
  }
  
  serialize(): string {
    return JSON.stringify({
      position: this.position,
      length: this.length,
      newText: this.newText,
      oldText: this.oldText,
      previousContent: this.previousContent
    });
  }
}