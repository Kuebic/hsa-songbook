/**
 * @file ChordEditorCore.tsx
 * @description Core Ace editor functionality extracted from ChordEditor
 */

import React, { useRef, useEffect, useCallback } from 'react';
import type { Ace } from 'ace-builds';
import type { MockAceEditorInstance, MockAceCompletion, MockAceCompleter } from '../../../test/types/test-fixtures.types';

export interface ChordEditorCoreProps {
  content: string;
  onChange: (content: string) => void;
  theme: string;
  fontSize: number;
  readOnly?: boolean;
  autoComplete?: boolean;
  placeholder?: string;
  height?: number;
  onCursorChange?: (position: { line: number; column: number }) => void;
}

export const ChordEditorCore = React.memo<ChordEditorCoreProps>(({
  content,
  onChange,
  theme,
  fontSize,
  readOnly = false,
  autoComplete = true,
  placeholder = 'Start typing...',
  height = 400,
  onCursorChange
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const aceEditorRef = useRef<Ace.Editor | null>(null);
  const isInitializedRef = useRef(false);

  /**
   * Get Ace editor theme based on component theme
   */
  const getAceTheme = useCallback((editorTheme: string) => {
    switch (editorTheme) {
      case 'dark':
        return 'ace/theme/monokai';
      case 'stage':
        return 'ace/theme/terminal';
      default:
        return 'ace/theme/github';
    }
  }, []);

  /**
   * Load Ace editor modules dynamically
   */
  const loadAceModules = useCallback(async () => {
    const [
      aceModule,
      modeTextModule,
      themeModule,
      langToolsModule
    ] = await Promise.all([
      // @ts-ignore - Dynamic ace imports
      import('ace-builds/src-noconflict/ace'),
      // @ts-ignore - Dynamic ace imports
      import('ace-builds/src-noconflict/mode-text'),
      // @ts-ignore - Dynamic ace imports
      import(`ace-builds/src-noconflict/${getAceTheme(theme).replace('ace/', '')}`),
      // @ts-ignore - Dynamic ace imports
      autoComplete ? import('ace-builds/src-noconflict/ext-language_tools') : Promise.resolve(null)
    ]);
    
    return { aceModule, modeTextModule, themeModule, langToolsModule };
  }, [theme, autoComplete, getAceTheme]);

  /**
   * Initialize Ace editor
   */
  const initializeEditor = useCallback(async () => {
    if (!editorRef.current || isInitializedRef.current) return;

    try {
      // Load Ace editor if not already loaded
      if (!window.ace) {
        await loadAceModules();
      }

      const ace = window.ace;
      const editor = ace.edit(editorRef.current);
      aceEditorRef.current = editor;
      
      // Configure editor
      editor.setTheme(getAceTheme(theme));
      editor.session.setMode('ace/mode/text');
      editor.setFontSize(`${fontSize}px`);
      editor.setReadOnly(readOnly);
      
      // Editor options
      editor.setOptions({
        enableBasicAutocompletion: autoComplete,
        enableLiveAutocompletion: autoComplete,
        enableSnippets: true,
        showLineNumbers: true,
        showGutter: true,
        highlightActiveLine: true,
        wrap: true,
        tabSize: 2,
        useSoftTabs: true,
        placeholder
      });

      // Set initial content
      editor.setValue(content, -1);

      // Event handlers
      editor.on('change', () => {
        const newContent = editor.getValue();
        onChange(newContent);
      });

      editor.on('changeSelection', () => {
        if (onCursorChange) {
          const selection = editor.getSelectionRange();
          onCursorChange({
            line: selection.start.row,
            column: selection.start.column
          });
        }
      });

      // Custom keyboard shortcuts
      editor.commands.addCommand({
        name: 'insertChord',
        bindKey: { win: 'Ctrl-[', mac: 'Cmd-[' },
        exec: () => {
          editor.insert('[C]');
        }
      });

      editor.commands.addCommand({
        name: 'insertDirective',
        bindKey: { win: 'Ctrl-{', mac: 'Cmd-{' },
        exec: () => {
          editor.insert('{title: }');
          const pos = editor.getCursorPosition();
          editor.moveCursorTo(pos.row, pos.column - 1);
        }
      });

      // Custom auto-completion
      if (autoComplete) {
        const langTools = ace.require('ace/ext/language_tools');
        
        // ChordPro directives completer
        const directiveCompleter: MockAceCompleter = {
          getCompletions: (
            _editor: MockAceEditorInstance,
            _session: unknown,
            _pos: { row: number; column: number },
            _prefix: string,
            callback: (error: Error | null, completions: MockAceCompletion[]) => void
          ) => {
            const directives = [
              { name: 'title', value: '{title: }', score: 1000, meta: 'directive' },
              { name: 'artist', value: '{artist: }', score: 1000, meta: 'directive' },
              { name: 'key', value: '{key: }', score: 1000, meta: 'directive' },
              { name: 'tempo', value: '{tempo: }', score: 1000, meta: 'directive' },
              { name: 'capo', value: '{capo: }', score: 1000, meta: 'directive' },
              { name: 'comment', value: '{comment: }', score: 1000, meta: 'directive' },
              { name: 'start_of_chorus', value: '{start_of_chorus}', score: 1000, meta: 'directive' },
              { name: 'end_of_chorus', value: '{end_of_chorus}', score: 1000, meta: 'directive' },
              { name: 'start_of_verse', value: '{start_of_verse}', score: 1000, meta: 'directive' },
              { name: 'end_of_verse', value: '{end_of_verse}', score: 1000, meta: 'directive' }
            ];
            callback(null, directives);
          }
        };

        langTools.addCompleter(directiveCompleter);
      }

      isInitializedRef.current = true;
    } catch (error) {
      console.error('Failed to initialize Ace editor:', error);
    }
  }, [content, onChange, theme, fontSize, readOnly, autoComplete, placeholder, onCursorChange, getAceTheme, loadAceModules]);

  // Update content when prop changes
  useEffect(() => {
    if (aceEditorRef.current && aceEditorRef.current.getValue() !== content) {
      const cursorPosition = aceEditorRef.current.getCursorPosition();
      aceEditorRef.current.setValue(content, -1);
      aceEditorRef.current.moveCursorToPosition(cursorPosition);
    }
  }, [content]);

  // Update theme when prop changes
  useEffect(() => {
    if (aceEditorRef.current) {
      aceEditorRef.current.setTheme(getAceTheme(theme));
    }
  }, [theme, getAceTheme]);

  // Update font size when prop changes
  useEffect(() => {
    if (aceEditorRef.current) {
      aceEditorRef.current.setFontSize(`${fontSize}px`);
    }
  }, [fontSize]);

  // Initialize editor on mount
  useEffect(() => {
    initializeEditor();

    return () => {
      if (aceEditorRef.current) {
        aceEditorRef.current.destroy();
        aceEditorRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [initializeEditor]);

  return (
    <div
      ref={editorRef}
      style={{ height: `${height}px` }}
      className="w-full border border-gray-300 dark:border-gray-600 rounded"
    />
  );
});

ChordEditorCore.displayName = 'ChordEditorCore';