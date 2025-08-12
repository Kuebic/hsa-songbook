/**
 * @file textAreaUtils.ts
 * @description Utility functions for enhanced ChordPro textarea functionality
 */

import { TextAreaMetrics, ValidationResult, UndoRedoState, AutoCompleteContext } from '../types/textArea.types'; // Force refresh

/**
 * Calculate text area metrics
 */
export function calculateTextAreaMetrics(
  value: string, 
  selectionStart: number, 
  selectionEnd: number
): TextAreaMetrics {
  const lines = value.split('\n');
  const lineCount = lines.length;
  const charCount = value.length;
  
  // Calculate cursor position
  const textBeforeCursor = value.substring(0, selectionStart);
  const linesBeforeCursor = textBeforeCursor.split('\n');
  const cursorLine = linesBeforeCursor.length;
  const cursorColumn = linesBeforeCursor[linesBeforeCursor.length - 1].length + 1;
  
  const selectionLength = selectionEnd - selectionStart;

  return {
    lineCount,
    charCount,
    cursorLine,
    cursorColumn,
    selectionLength
  };
}

/**
 * Basic ChordPro validation
 */
export function validateChordProContent(value: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = value.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Check for unclosed directives
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    
    if (openBraces > closeBraces) {
      errors.push(`Line ${lineNumber}: Unclosed directive bracket`);
    } else if (closeBraces > openBraces) {
      errors.push(`Line ${lineNumber}: Extra closing bracket`);
    }
    
    // Check for unclosed chord brackets
    const openChords = (line.match(/\[/g) || []).length;
    const closeChords = (line.match(/\]/g) || []).length;
    
    if (openChords > closeChords) {
      errors.push(`Line ${lineNumber}: Unclosed chord bracket`);
    } else if (closeChords > openChords) {
      errors.push(`Line ${lineNumber}: Extra closing chord bracket`);
    }
    
    // Check for common directive typos
    const directiveMatches = line.match(/\{([^}]+)\}/g);
    if (directiveMatches) {
      directiveMatches.forEach(match => {
        const directive = match.slice(1, -1).toLowerCase();
        const commonDirectives = [
          'title', 't', 'subtitle', 'st', 'artist', 'composer', 'lyricist',
          'album', 'year', 'key', 'time', 'tempo', 'capo', 'comment', 'c',
          'start_of_chorus', 'soc', 'end_of_chorus', 'eoc',
          'start_of_verse', 'sov', 'end_of_verse', 'eov',
          'start_of_bridge', 'sob', 'end_of_bridge', 'eob',
          'new_song', 'ns', 'new_page', 'np', 'column_break', 'cb'
        ];
        
        const directiveName = directive.split(':')[0];
        if (!commonDirectives.includes(directiveName) && directiveName.length > 0) {
          warnings.push(`Line ${lineNumber}: Unknown directive '${directiveName}'`);
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Find auto-completion context at cursor position
 */
export function findAutoCompleteContext(
  value: string, 
  cursorPosition: number
): AutoCompleteContext | null {
  const textBeforeCursor = value.substring(0, cursorPosition);
  
  // Find the last trigger character
  const lastOpenBrace = Math.max(
    textBeforeCursor.lastIndexOf('{'),
    textBeforeCursor.lastIndexOf('[')
  );
  
  if (lastOpenBrace === -1) return null;
  
  const triggerChar = value[lastOpenBrace] as '{' | '[';
  const afterTrigger = textBeforeCursor.substring(lastOpenBrace + 1);
  const closingChar = triggerChar === '{' ? '}' : ']';
  
  // Check if we're still in an open context
  if (afterTrigger.includes(closingChar)) return null;
  
  // Validate the filter text
  const validPattern = /^[a-zA-Z0-9_:\-\s]*$/;
  if (!validPattern.test(afterTrigger)) return null;
  
  return {
    triggerChar,
    triggerPosition: lastOpenBrace,
    filterText: afterTrigger,
    isVisible: true,
    selectedIndex: 0
  };
}

/**
 * Get common ChordPro directives for auto-completion
 */
export function getChordProDirectives(): string[] {
  return [
    'title', 't',
    'subtitle', 'st',
    'artist',
    'composer',
    'lyricist',
    'album',
    'year',
    'key',
    'time',
    'tempo',
    'capo',
    'comment', 'c',
    'start_of_chorus', 'soc',
    'end_of_chorus', 'eoc',
    'start_of_verse', 'sov',
    'end_of_verse', 'eov',
    'start_of_bridge', 'sob',
    'end_of_bridge', 'eob',
    'start_of_tab', 'sot',
    'end_of_tab', 'eot',
    'new_song', 'ns',
    'new_page', 'np',
    'column_break', 'cb',
    'new_physical_page', 'npp'
  ];
}

/**
 * Get common chord names for auto-completion
 */
export function getCommonChords(): string[] {
  return [
    // Major chords
    'C', 'D', 'E', 'F', 'G', 'A', 'B',
    'C#', 'Db', 'D#', 'Eb', 'F#', 'Gb', 'G#', 'Ab', 'A#', 'Bb',
    
    // Minor chords
    'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm',
    'C#m', 'Dbm', 'D#m', 'Ebm', 'F#m', 'Gbm', 'G#m', 'Abm', 'A#m', 'Bbm',
    
    // Seventh chords
    'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
    'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7',
    'Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7',
    
    // Suspended chords
    'Csus2', 'Csus4', 'Dsus2', 'Dsus4', 'Esus2', 'Esus4',
    'Fsus2', 'Fsus4', 'Gsus2', 'Gsus4', 'Asus2', 'Asus4', 'Bsus2', 'Bsus4',
    
    // Diminished and augmented
    'Cdim', 'Ddim', 'Edim', 'Fdim', 'Gdim', 'Adim', 'Bdim',
    'Caug', 'Daug', 'Eaug', 'Faug', 'Gaug', 'Aaug', 'Baug'
  ];
}

/**
 * Filter auto-completion suggestions based on input
 */
export function filterSuggestions(suggestions: string[], filterText: string): string[] {
  if (!filterText) return suggestions;
  
  const lowerFilter = filterText.toLowerCase();
  
  return suggestions
    .filter(suggestion => suggestion.toLowerCase().includes(lowerFilter))
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(lowerFilter);
      const bStarts = b.toLowerCase().startsWith(lowerFilter);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return a.localeCompare(b);
    });
}

/**
 * Insert text at cursor position
 */
export function insertTextAtCursor(
  value: string,
  insertText: string,
  selectionStart: number,
  selectionEnd: number
): { newValue: string; newCursorPosition: number } {
  const newValue = value.substring(0, selectionStart) + 
                  insertText + 
                  value.substring(selectionEnd);
  
  const newCursorPosition = selectionStart + insertText.length;
  
  return { newValue, newCursorPosition };
}

/**
 * Get indent level of a line
 */
export function getIndentLevel(line: string, tabSize: number = 4): number {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  
  const whitespace = match[1];
  const spaces = whitespace.replace(/\t/g, ' '.repeat(tabSize));
  
  return Math.floor(spaces.length / tabSize);
}

/**
 * Generate indent string
 */
export function generateIndent(level: number, tabSize: number = 4): string {
  return ' '.repeat(level * tabSize);
}

/**
 * Check if a line is a comment
 */
export function isCommentLine(line: string): boolean {
  return line.trim().startsWith('#');
}

/**
 * Toggle comment on a line
 */
export function toggleComment(line: string): string {
  const trimmed = line.trim();
  if (trimmed.startsWith('#')) {
    return line.replace(/^\s*#\s?/, '');
  } else {
    const indent = line.match(/^(\s*)/)?.[1] || '';
    return indent + '# ' + trimmed;
  }
}

/**
 * Create undo state
 */
export function createUndoState(
  value: string,
  selectionStart: number,
  selectionEnd: number
): UndoRedoState {
  return {
    value,
    selectionStart,
    selectionEnd,
    timestamp: Date.now()
  };
}

/**
 * Check if two undo states are significantly different
 */
export function shouldSaveUndoState(
  current: UndoRedoState,
  previous: UndoRedoState | null,
  threshold: number = 1000
): boolean {
  if (!previous) return true;
  
  // Don't save if too recent
  if (current.timestamp - previous.timestamp < threshold) return false;
  
  // Don't save if values are the same
  if (current.value === previous.value) return false;
  
  // Don't save for very small changes
  const valueDiff = Math.abs(current.value.length - previous.value.length);
  if (valueDiff === 1) return false;
  
  return true;
}
