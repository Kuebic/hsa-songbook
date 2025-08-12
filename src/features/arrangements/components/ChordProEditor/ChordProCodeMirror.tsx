/**
 * @file ChordProCodeMirror.tsx
 * @description Professional ChordPro editor using CodeMirror 6
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, drawSelection, dropCursor, highlightActiveLine, placeholder as placeholderExtension } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, CompletionContext } from '@codemirror/autocomplete';
import type { CompletionResult, Completion } from '@codemirror/autocomplete';
import { linter, lintKeymap } from '@codemirror/lint';
import type { Diagnostic } from '@codemirror/lint';
import { javascript } from '@codemirror/lang-javascript';
import { chordPro } from './codemirror/chordProLanguage';
import { createChordProTheme } from './codemirror/chordProTheme';
import { cn } from '../../../../lib/utils';

interface ChordProCodeMirrorProps {
  value: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  theme?: 'light' | 'dark' | 'stage';
  fontSize?: number;
  readOnly?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  height?: string | number;
  className?: string;
  showLineNumbers?: boolean;
  showFoldGutter?: boolean;
  enableAutocomplete?: boolean;
  enableLinting?: boolean;
}

// ChordPro directives for autocomplete
const DIRECTIVES: Completion[] = [
  { label: 'title:', type: 'keyword', detail: 'Song title', apply: 'title: ' },
  { label: 'subtitle:', type: 'keyword', detail: 'Song subtitle', apply: 'subtitle: ' },
  { label: 'artist:', type: 'keyword', detail: 'Artist name', apply: 'artist: ' },
  { label: 'composer:', type: 'keyword', detail: 'Composer name', apply: 'composer: ' },
  { label: 'lyricist:', type: 'keyword', detail: 'Lyricist name', apply: 'lyricist: ' },
  { label: 'copyright:', type: 'keyword', detail: 'Copyright info', apply: 'copyright: ' },
  { label: 'album:', type: 'keyword', detail: 'Album name', apply: 'album: ' },
  { label: 'year:', type: 'keyword', detail: 'Year', apply: 'year: ' },
  { label: 'key:', type: 'keyword', detail: 'Musical key', apply: 'key: ' },
  { label: 'time:', type: 'keyword', detail: 'Time signature', apply: 'time: ' },
  { label: 'tempo:', type: 'keyword', detail: 'Tempo in BPM', apply: 'tempo: ' },
  { label: 'duration:', type: 'keyword', detail: 'Song duration', apply: 'duration: ' },
  { label: 'capo:', type: 'keyword', detail: 'Capo position', apply: 'capo: ' },
  { label: 'tuning:', type: 'keyword', detail: 'Guitar tuning', apply: 'tuning: ' },
  { label: 'comment:', type: 'keyword', detail: 'Comment', apply: 'comment: ' },
  { label: 'start_of_chorus', type: 'keyword', detail: 'Start chorus section', apply: 'start_of_chorus}' },
  { label: 'end_of_chorus', type: 'keyword', detail: 'End chorus section', apply: 'end_of_chorus}' },
  { label: 'start_of_verse', type: 'keyword', detail: 'Start verse section', apply: 'start_of_verse}' },
  { label: 'end_of_verse', type: 'keyword', detail: 'End verse section', apply: 'end_of_verse}' },
  { label: 'start_of_bridge', type: 'keyword', detail: 'Start bridge section', apply: 'start_of_bridge}' },
  { label: 'end_of_bridge', type: 'keyword', detail: 'End bridge section', apply: 'end_of_bridge}' },
  { label: 'start_of_tab', type: 'keyword', detail: 'Start tab section', apply: 'start_of_tab}' },
  { label: 'end_of_tab', type: 'keyword', detail: 'End tab section', apply: 'end_of_tab}' },
  { label: 'chorus', type: 'keyword', detail: 'Chorus marker', apply: 'chorus}' },
  { label: 'verse', type: 'keyword', detail: 'Verse marker', apply: 'verse}' },
  { label: 'bridge', type: 'keyword', detail: 'Bridge marker', apply: 'bridge}' },
  { label: 'tab', type: 'keyword', detail: 'Tab marker', apply: 'tab}' },
];

// Common chord suggestions
const CHORDS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
  'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
  'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7',
  'Cm7', 'Dm7', 'Em7', 'Fm7', 'Gm7', 'Am7', 'Bm7',
  'Csus4', 'Dsus4', 'Esus4', 'Fsus4', 'Gsus4', 'Asus4', 'Bsus4',
  'Csus2', 'Dsus2', 'Esus2', 'Fsus2', 'Gsus2', 'Asus2', 'Bsus2',
  'Cdim', 'Ddim', 'Edim', 'Fdim', 'Gdim', 'Adim', 'Bdim',
  'Caug', 'Daug', 'Eaug', 'Faug', 'Gaug', 'Aaug', 'Baug',
];

export const ChordProCodeMirror: React.FC<ChordProCodeMirrorProps> = ({
  value,
  onChange,
  onSave,
  theme = 'light',
  fontSize = 16,
  readOnly = false,
  autoFocus = false,
  placeholder = 'Start typing your ChordPro song...',
  height = 600,
  className,
  showLineNumbers = true,
  showFoldGutter = true,
  enableAutocomplete = true,
  enableLinting = true,
}) => {
  const editorRef = useRef<{ view?: EditorView }>(null);

  // ChordPro autocomplete function
  const chordProCompletions = useCallback((context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const line = context.state.doc.lineAt(context.pos);
    const textBefore = line.text.slice(0, context.pos - line.from);
    
    // Check if we're inside a directive
    if (textBefore.includes('{') && !textBefore.includes('}')) {
      const afterBrace = textBefore.slice(textBefore.lastIndexOf('{') + 1);
      const filtered = DIRECTIVES.filter(d => 
        d.label.toLowerCase().startsWith(afterBrace.toLowerCase())
      );
      
      if (filtered.length > 0) {
        return {
          from: context.pos - afterBrace.length,
          options: filtered,
        };
      }
    }
    
    // Check if we're inside a chord
    if (textBefore.includes('[') && !textBefore.includes(']')) {
      const afterBracket = textBefore.slice(textBefore.lastIndexOf('[') + 1);
      const filtered = CHORDS.map(chord => ({
        label: chord,
        type: 'variable' as const,
        apply: chord + ']',
      })).filter(c => 
        c.label.toLowerCase().startsWith(afterBracket.toLowerCase())
      );
      
      if (filtered.length > 0) {
        return {
          from: context.pos - afterBracket.length,
          options: filtered,
        };
      }
    }
    
    return null;
  }, []);

  // ChordPro linting function
  const chordProLinter = useCallback((view: EditorView): Diagnostic[] => {
    const diagnostics: Diagnostic[] = [];
    const doc = view.state.doc;
    
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const text = line.text;
      
      // Check for unclosed brackets
      const openBrackets = (text.match(/\[/g) || []).length;
      const closeBrackets = (text.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        diagnostics.push({
          from: line.from,
          to: line.to,
          severity: 'error',
          message: 'Unclosed chord bracket',
        });
      }
      
      // Check for unclosed braces
      const openBraces = (text.match(/\{/g) || []).length;
      const closeBraces = (text.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        diagnostics.push({
          from: line.from,
          to: line.to,
          severity: 'error',
          message: 'Unclosed directive brace',
        });
      }
      
      // Check for invalid chord notation
      const chordMatches = text.matchAll(/\[([^\]]+)\]/g);
      for (const match of chordMatches) {
        const chord = match[1];
        if (!chord.match(/^[A-G][#b]?(maj|min|m|M|dim|aug|sus|add)?[0-9]*(\/[A-G][#b]?)?$/)) {
          diagnostics.push({
            from: line.from + match.index!,
            to: line.from + match.index! + match[0].length,
            severity: 'warning',
            message: `Invalid chord notation: ${chord}`,
          });
        }
      }
    }
    
    return diagnostics;
  }, []);

  // Create extensions
  const extensions = useMemo(() => {
    const exts = [];
    
    // Add custom language support
    try {
      const chordProLang = chordPro();
      if (chordProLang) {
        exts.push(chordProLang);
      }
    } catch (error) {
      console.error('ChordPro language error:', error);
      // Fallback to JavaScript syntax if custom language fails
      try {
        exts.push(javascript());
      } catch (e) {
        console.error('JavaScript language fallback error:', e);
      }
    }
    
    // Add custom theme
    try {
      exts.push(createChordProTheme(theme));
    } catch (error) {
      console.error('ChordPro theme error:', error);
    }
    
    // Add core extensions
    exts.push(
      history(),
      drawSelection(),
      dropCursor(),
      indentOnInput(),
      bracketMatching(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      highlightSelectionMatches(),
      EditorState.allowMultipleSelections.of(true),
      EditorView.lineWrapping
    );
    
    // Add keymap
    exts.push(
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        ...foldKeymap,
        indentWithTab,
        ...(enableAutocomplete ? completionKeymap : []),
        ...(enableLinting ? lintKeymap : []),
        // Custom save shortcut
        {
          key: 'Mod-s',
          run: (view) => {
            if (onSave) {
              onSave(view.state.doc.toString());
            }
            return true;
          },
        },
      ])
    );

    if (showLineNumbers) {
      exts.push(lineNumbers());
    }

    if (showFoldGutter) {
      exts.push(foldGutter());
    }

    if (enableAutocomplete) {
      exts.push(autocompletion({
        override: [chordProCompletions],
        defaultKeymap: true,
      }));
    }

    if (enableLinting) {
      exts.push(linter(chordProLinter, { delay: 300 }));
    }

    if (readOnly) {
      exts.push(EditorState.readOnly.of(true));
    }

    if (placeholder) {
      exts.push(placeholderExtension(placeholder));
    }

    // Custom styles
    exts.push(EditorView.theme({
      '.cm-content': {
        fontSize: `${fontSize}px`,
      },
    }));

    // Filter out any undefined/null extensions
    return exts.filter(ext => ext != null);
  }, [
    theme,
    fontSize,
    readOnly,
    placeholder,
    showLineNumbers,
    showFoldGutter,
    enableAutocomplete,
    enableLinting,
    chordProCompletions,
    chordProLinter,
    onSave,
  ]);

  // Handle change
  const handleChange = useCallback((val: string) => {
    if (onChange) {
      onChange(val);
    }
  }, [onChange]);

  // Focus on mount if needed
  useEffect(() => {
    if (autoFocus && editorRef.current?.view) {
      editorRef.current.view.focus();
    }
  }, [autoFocus]);

  // Determine CodeMirror theme
  const codeMirrorTheme = theme === 'dark' || theme === 'stage' ? oneDark : 'light';

  return (
    <div className={cn('chord-pro-codemirror', className)}>
      <CodeMirror
        ref={editorRef}
        value={value}
        height={typeof height === 'number' ? `${height}px` : height}
        extensions={extensions}
        onChange={handleChange}
        theme={codeMirrorTheme}
        basicSetup={false} // We configure everything manually
      />
    </div>
  );
};
