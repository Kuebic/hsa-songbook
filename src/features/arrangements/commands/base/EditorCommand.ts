import type { EditorCommand as IEditorCommand, CommandType, EditorContext, CommandResult } from '../../types/command.types';

/**
 * Abstract base class for all editor commands
 */
export abstract class BaseEditorCommand implements IEditorCommand {
  id: string;
  timestamp: number;
  type: CommandType;
  
  constructor(type: CommandType) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
    this.type = type;
  }
  
  abstract execute(context: EditorContext): Promise<CommandResult>;
  abstract undo(context: EditorContext): Promise<CommandResult>;
  
  canMerge?(other: IEditorCommand): boolean;
  merge?(other: IEditorCommand): IEditorCommand;
  serialize?(): string;
  deserialize?(data: string): IEditorCommand;
  
  /**
   * Helper method to update textarea value and cursor position
   */
  protected updateTextarea(
    textarea: HTMLTextAreaElement,
    content: string,
    cursorPosition: number
  ): void {
    textarea.value = content;
    textarea.setSelectionRange(cursorPosition, cursorPosition);
    
    // Trigger input event for React
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
  }
  
  /**
   * Helper method to get current textarea state
   */
  protected getTextareaState(textarea: HTMLTextAreaElement): {
    content: string;
    cursorPosition: number;
    selectionStart: number;
    selectionEnd: number;
  } {
    return {
      content: textarea.value,
      cursorPosition: textarea.selectionStart,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd
    };
  }
}