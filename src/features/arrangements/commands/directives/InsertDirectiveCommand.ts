import { BaseEditorCommand } from '../base/EditorCommand';
import { CommandType } from '../../types/command.types';
import type { EditorContext, CommandResult } from '../../types/command.types';

/**
 * Command to insert a ChordPro directive
 */
export class InsertDirectiveCommand extends BaseEditorCommand {
  private position: number;
  private directive: string;
  private value?: string;
  private previousContent: string = '';
  
  constructor(position: number, directive: string, value?: string) {
    super(CommandType.INSERT_DIRECTIVE);
    this.position = position;
    this.directive = directive;
    this.value = value;
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
      
      // Format the directive
      const directiveText = this.value 
        ? `{${this.directive}: ${this.value}}\n`
        : `{${this.directive}}\n`;
      
      // Insert directive at position
      const before = textarea.value.substring(0, this.position);
      const after = textarea.value.substring(this.position);
      
      // Add newline before if not at start and previous char is not newline
      const needsNewlineBefore = this.position > 0 && 
        before[before.length - 1] !== '\n';
      
      const textToInsert = needsNewlineBefore 
        ? '\n' + directiveText
        : directiveText;
      
      const newContent = before + textToInsert + after;
      
      // Update textarea
      const newCursorPosition = this.position + textToInsert.length;
      this.updateTextarea(textarea, newContent, newCursorPosition);
      
      return {
        success: true,
        content: newContent,
        cursorPosition: newCursorPosition
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to insert directive')
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
        error: error instanceof Error ? error : new Error('Failed to undo directive insertion')
      };
    }
  }
  
  serialize(): string {
    return JSON.stringify({
      position: this.position,
      directive: this.directive,
      value: this.value,
      previousContent: this.previousContent
    });
  }
}