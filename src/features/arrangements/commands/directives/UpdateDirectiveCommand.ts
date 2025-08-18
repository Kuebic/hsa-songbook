import { BaseEditorCommand } from '../base/EditorCommand';
import { CommandType } from '../../types/command.types';
import type { EditorContext, CommandResult } from '../../types/command.types';

/**
 * Command to update an existing ChordPro directive
 */
export class UpdateDirectiveCommand extends BaseEditorCommand {
  private position: number;
  private oldDirective: string;
  private newDirective: string;
  private oldValue?: string;
  private newValue?: string;
  private previousContent: string = '';
  
  constructor(
    position: number,
    oldDirective: string,
    newDirective: string,
    oldValue?: string,
    newValue?: string
  ) {
    super(CommandType.UPDATE_DIRECTIVE);
    this.position = position;
    this.oldDirective = oldDirective;
    this.newDirective = newDirective;
    this.oldValue = oldValue;
    this.newValue = newValue;
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
      
      // Find and replace the directive
      const oldDirectiveText = this.oldValue 
        ? `{${this.oldDirective}: ${this.oldValue}}`
        : `{${this.oldDirective}}`;
      
      const newDirectiveText = this.newValue 
        ? `{${this.newDirective}: ${this.newValue}}`
        : `{${this.newDirective}}`;
      
      // Find the exact position of the directive
      const searchStart = Math.max(0, this.position - 100); // Search within reasonable range
      const searchEnd = Math.min(textarea.value.length, this.position + 100);
      const searchText = textarea.value.substring(searchStart, searchEnd);
      
      const directiveIndex = searchText.indexOf(oldDirectiveText);
      if (directiveIndex === -1) {
        return {
          success: false,
          error: new Error('Directive not found at expected position')
        };
      }
      
      const actualPosition = searchStart + directiveIndex;
      
      // Replace the directive
      const before = textarea.value.substring(0, actualPosition);
      const after = textarea.value.substring(actualPosition + oldDirectiveText.length);
      const newContent = before + newDirectiveText + after;
      
      // Update textarea
      const newCursorPosition = actualPosition + newDirectiveText.length;
      this.updateTextarea(textarea, newContent, newCursorPosition);
      
      return {
        success: true,
        content: newContent,
        cursorPosition: newCursorPosition
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to update directive')
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
        error: error instanceof Error ? error : new Error('Failed to undo directive update')
      };
    }
  }
  
  serialize(): string {
    return JSON.stringify({
      position: this.position,
      oldDirective: this.oldDirective,
      newDirective: this.newDirective,
      oldValue: this.oldValue,
      newValue: this.newValue,
      previousContent: this.previousContent
    });
  }
}