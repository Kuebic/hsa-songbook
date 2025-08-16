import { BaseEditorCommand } from '../base/EditorCommand';
import { CommandType, EditorContext, CommandResult, EditorCommand } from '../../types/command.types';

/**
 * Command to delete text from a specific position
 */
export class DeleteTextCommand extends BaseEditorCommand {
  private position: number;
  private length: number;
  private deletedText: string = '';
  private previousContent: string = '';
  
  constructor(position: number, length: number) {
    super(CommandType.DELETE_TEXT);
    this.position = position;
    this.length = length;
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
      // Store the previous content and deleted text for undo
      this.previousContent = textarea.value;
      this.deletedText = textarea.value.substring(this.position, this.position + this.length);
      
      // Delete text at position
      const before = textarea.value.substring(0, this.position);
      const after = textarea.value.substring(this.position + this.length);
      const newContent = before + after;
      
      // Update textarea
      this.updateTextarea(textarea, newContent, this.position);
      
      return {
        success: true,
        content: newContent,
        cursorPosition: this.position
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to delete text')
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
      this.updateTextarea(
        textarea, 
        this.previousContent, 
        this.position + this.deletedText.length
      );
      
      return {
        success: true,
        content: this.previousContent,
        cursorPosition: this.position + this.deletedText.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to undo text deletion')
      };
    }
  }
  
  canMerge(other: EditorCommand): boolean {
    // Can merge with another DeleteTextCommand if:
    // 1. It's also a DeleteTextCommand
    // 2. It's deleting from the same position (backspace) or adjacent position
    // 3. Both are single character deletions
    
    if (other.type !== CommandType.DELETE_TEXT) {
      return false;
    }
    
    const otherDelete = other as DeleteTextCommand;
    
    // Check if deleting from same position (repeated backspace)
    const isSamePosition = otherDelete.position === this.position;
    
    // Check if deleting from adjacent position (backspace moving left)
    const isAdjacentBackspace = otherDelete.position === this.position - 1;
    
    // Check if both are single character deletions
    const isSingleChar = this.length === 1 && otherDelete.length === 1;
    
    return (isSamePosition || isAdjacentBackspace) && isSingleChar;
  }
  
  merge(other: EditorCommand): EditorCommand {
    const otherDelete = other as DeleteTextCommand;
    
    if (otherDelete.position === this.position) {
      // Deleting forward from same position
      this.length += otherDelete.length;
      this.deletedText += otherDelete.deletedText;
    } else if (otherDelete.position === this.position - 1) {
      // Backspace moving left
      this.position = otherDelete.position;
      this.length += otherDelete.length;
      this.deletedText = otherDelete.deletedText + this.deletedText;
    }
    
    this.timestamp = otherDelete.timestamp;
    
    return this;
  }
  
  serialize(): string {
    return JSON.stringify({
      position: this.position,
      length: this.length,
      deletedText: this.deletedText,
      previousContent: this.previousContent
    });
  }
}