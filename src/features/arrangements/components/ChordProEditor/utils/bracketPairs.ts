/**
 * Bracket pair definitions for ChordPro editor
 */

export interface BracketPair {
  open: string;
  close: string;
  contextRules?: ContextRule[];
}

export interface ContextRule {
  type: 'notInString' | 'notInComment' | 'beforeWhitespace' | 'afterWhitespace';
  value?: boolean;
}

export interface InsertedPair {
  open: string;
  close: string;
  insertedAt: number;
  position: number;
}

/**
 * ChordPro-specific bracket pairs
 */
export const CHORDPRO_BRACKET_PAIRS: BracketPair[] = [
  { 
    open: '{', 
    close: '}',
    contextRules: [
      { type: 'notInString' },
      { type: 'notInComment' }
    ]
  },
  { 
    open: '[', 
    close: ']',
    contextRules: [
      { type: 'notInString' },
      { type: 'notInComment' }
  ]
  },
  { 
    open: '"', 
    close: '"',
    contextRules: [
      { type: 'notInComment' }
    ]
  },
  { 
    open: "'", 
    close: "'",
    contextRules: [
      { type: 'notInComment' }
    ]
  }
];

/**
 * Check if a character is an opening bracket
 */
export const isOpeningBracket = (char: string): boolean => {
  return CHORDPRO_BRACKET_PAIRS.some(pair => pair.open === char);
};

/**
 * Check if a character is a closing bracket
 */
export const isClosingBracket = (char: string): boolean => {
  return CHORDPRO_BRACKET_PAIRS.some(pair => pair.close === char);
};

/**
 * Get the matching bracket pair for a character
 */
export const getBracketPair = (char: string): BracketPair | undefined => {
  return CHORDPRO_BRACKET_PAIRS.find(
    pair => pair.open === char || pair.close === char
  );
};

/**
 * Check if auto-close should happen based on context
 */
export const shouldAutoClose = (
  content: string,
  position: number,
  char: string
): boolean => {
  const pair = getBracketPair(char);
  if (!pair || pair.open !== char) return false;

  // Get context around cursor
  const beforeCursor = content.substring(0, position);
  const afterCursor = content.substring(position);
  const nextChar = afterCursor[0] || '';
  
  // Don't auto-close if next character is alphanumeric
  if (/\w/.test(nextChar)) {
    return false;
  }
  
  // Check context rules
  if (pair.contextRules) {
    for (const rule of pair.contextRules) {
      if (rule.type === 'notInString') {
        // Simple check for being inside a string
        const quotesBeforeCursor = (beforeCursor.match(/["']/g) || []).length;
        if (quotesBeforeCursor % 2 === 1) {
          // Odd number of quotes means we're inside a string
          if (char !== '"' && char !== "'") {
            return false;
          }
        }
      }
      
      if (rule.type === 'notInComment') {
        // Check if we're in a comment line
        const currentLine = beforeCursor.split('\n').pop() || '';
        if (currentLine.trim().startsWith('#')) {
          return false;
        }
      }
      
      if (rule.type === 'beforeWhitespace') {
        // Only auto-close if next char is whitespace or end of line
        if (nextChar && !/\s/.test(nextChar)) {
          return false;
        }
      }
    }
  }
  
  return true;
};

/**
 * Check if a bracket pair was auto-inserted
 */
export const wasAutoInserted = (
  autoInsertedPairs: Map<number, InsertedPair>,
  position: number,
  char: string
): boolean => {
  const pair = autoInsertedPairs.get(position - 1);
  return pair !== undefined && pair.close === char;
};

/**
 * Clean up old auto-inserted pairs (older than 30 seconds)
 */
export const cleanupOldPairs = (
  autoInsertedPairs: Map<number, InsertedPair>
): Map<number, InsertedPair> => {
  const now = Date.now();
  const maxAge = 30000; // 30 seconds
  
  const cleaned = new Map<number, InsertedPair>();
  autoInsertedPairs.forEach((pair, key) => {
    if (now - pair.insertedAt < maxAge) {
      cleaned.set(key, pair);
    }
  });
  
  return cleaned;
};