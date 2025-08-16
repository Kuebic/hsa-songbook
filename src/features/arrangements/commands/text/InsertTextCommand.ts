import { BaseEditorCommand } from '../base/EditorCommand';
import { CommandType, EditorContext, CommandResult, EditorCommand } from '../../types/command.types';

/**
 * Command to insert text at a specific position
 */
export class InsertTextCommand extends BaseEditorCommand {
  private position: number;
  private text: string;
  private previousContent: string = '';
  
  constructor(position: number, text: string) {
    super(CommandType.INSERT_TEXT);
    this.position = position;
    this.text = text;
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
      // Store the previous content for undo
      this.previousContent = textarea.value;
      
      // Insert text at position
      const before = textarea.value.substring(0, this.position);
      const after = textarea.value.substring(this.position);
      const newContent = before + this.text + after;
      
      // Update textarea
      const newCursorPosition = this.position + this.text.length;
      this.updateTextarea(textarea, newContent, newCursorPosition);
      
      return {
        success: true,
        content: newContent,
        cursorPosition: newCursorPosition
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to insert text')
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
      this.updateTextarea(textarea, this.previousContent, this.position);
      
      return {
        success: true,
        content: this.previousContent,
        cursorPosition: this.position
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to undo text insertion')
      };
    }
  }
  
  canMerge(other: EditorCommand): boolean {
    // Can merge with another InsertTextCommand if:
    // 1. It's also an InsertTextCommand
    // 2. It's inserting at the end of our inserted text (consecutive typing)
    // 3. Both are single characters (regular typing)
    // 4. They're close in time (handled by CommandManager)
    
    if (other.type !== CommandType.INSERT_TEXT) {
      return false;
    }
    
    const otherInsert = other as InsertTextCommand;
    
    // Check if inserting consecutively
    const isConsecutive = otherInsert.position === this.position + this.text.length;
    
    // Check if both are single character insertions (regular typing)
    const isSingleChar = this.text.length === 1 && otherInsert.text.length === 1;
    
    return isConsecutive && isSingleChar;
  }
  
  merge(other: EditorCommand): EditorCommand {
    const otherInsert = other as InsertTextCommand;
    
    // Combine the text
    this.text += otherInsert.text;
    this.timestamp = otherInsert.timestamp;
    
    return this;
  }
  
  serialize(): string {
    return JSON.stringify({
      position: this.position,
      text: this.text,
      previousContent: this.previousContent
    });
  }
}