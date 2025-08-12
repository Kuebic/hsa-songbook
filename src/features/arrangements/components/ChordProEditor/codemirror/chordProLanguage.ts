/**
 * @file chordProLanguage.ts
 * @description Custom ChordPro language support for CodeMirror 6
 */

import { StreamLanguage } from '@codemirror/language';

// Define token types for ChordPro syntax
export const chordProLanguage = StreamLanguage.define({
  name: 'chordpro',
  
  startState: () => ({
    inDirective: false,
    inComment: false,
    inChord: false,
    inTab: false,
  }),

  token(stream, state) {
    // Handle end of line
    if (stream.eol()) {
      state.inComment = false;
      return null;
    }

    // Handle comments (lines starting with #)
    if (stream.sol() && stream.peek() === '#') {
      stream.skipToEnd();
      return 'comment';
    }

    // Handle directives {...}
    if (stream.peek() === '{') {
      stream.next();
      state.inDirective = true;
      
      // Check for specific directive types
      const directiveMatch = stream.match(/^(title|t|subtitle|st|artist|composer|lyricist|copyright|album|year|key|time|tempo|duration|capo|tuning|instrument):/);
      if (directiveMatch) {
        return 'keyword';
      }
      
      // Check for section directives
      const sectionMatch = stream.match(/^(start_of_chorus|end_of_chorus|soc|eoc|start_of_verse|end_of_verse|sov|eov|start_of_bridge|end_of_bridge|sob|eob|start_of_tab|end_of_tab|sot|eot|chorus|verse|bridge|tab)/);
      if (sectionMatch) {
        return 'tag';
      }
      
      // Check for comment directive
      const commentMatch = stream.match(/^(comment|c|ci|cb|guitar_comment|gc):/);
      if (commentMatch) {
        state.inComment = true;
        return 'comment';
      }
      
      return 'keyword';
    }

    // Continue in directive
    if (state.inDirective) {
      if (stream.peek() === '}') {
        stream.next();
        state.inDirective = false;
        state.inComment = false;
        return state.inComment ? 'comment' : 'keyword';
      }
      
      if (state.inComment) {
        stream.next();
        return 'comment';
      }
      
      // Handle directive values
      if (stream.match(/^[^}]+/)) {
        return 'string';
      }
      
      stream.next();
      return 'keyword';
    }

    // Handle chord notation [...]
    if (stream.peek() === '[') {
      stream.next();
      state.inChord = true;
      return 'atom';
    }

    // Continue in chord
    if (state.inChord) {
      if (stream.peek() === ']') {
        stream.next();
        state.inChord = false;
        return 'atom';
      }
      
      // Match chord content
      if (stream.match(/^[A-Ga-g][#b]?(maj|min|m|M|dim|aug|sus|add)?[0-9]*(\/[A-Ga-g][#b]?)?/)) {
        return 'atom';
      }
      
      stream.next();
      return 'atom';
    }

    // Handle tab sections
    if (state.inTab) {
      if (stream.match(/^\{end_of_tab\}|\{eot\}/)) {
        state.inTab = false;
        return 'tag';
      }
      stream.next();
      return 'string-2';
    }

    // Check for start of tab
    if (stream.match(/^\{start_of_tab\}|\{sot\}/)) {
      state.inTab = true;
      return 'tag';
    }

    // Handle regular lyrics text
    stream.next();
    return null;
  },

  // Indentation support
  indent(_state, _textAfter, _context) {
    // No indentation for ChordPro
    return 0;
  },

  // Block comment support
  blockCommentStart: '{comment:',
  blockCommentEnd: '}',
  lineComment: '#',

  // Folding support for sections
  fold: 'indent'
});

// Export helper function to create language support
import { LanguageSupport } from '@codemirror/language';

export function chordPro() {
  return new LanguageSupport(chordProLanguage);
}